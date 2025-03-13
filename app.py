from flask import Flask, render_template, request, redirect, url_for, jsonify, session, flash
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
import os
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
import json

# Importar configurações
from config import Config

# Criar app Flask
app = Flask(__name__)
app.config.from_object(Config)

# Configurar MongoDB
mongo = PyMongo(app)

# Configurar caminho para upload de imagens
UPLOAD_FOLDER = os.path.join(app.static_folder, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Rotas
@app.route('/')
def index():
    """Página inicial com formulário para criar anúncio"""
    # Buscar todos os veículos no banco de dados
    veiculos = list(mongo.db.veiculo.find())
    return render_template('index.html', veiculos=veiculos)

@app.route('/veiculo/<veiculo_id>')
def get_veiculo(veiculo_id):
    """API para obter detalhes de um veículo específico"""
    try:
        # Buscar o veículo no banco de dados usando o ObjectId
        veiculo = mongo.db.veiculo.find_one({'_id': ObjectId(veiculo_id)})
        
        if not veiculo:
            return jsonify({'erro': 'Veículo não encontrado'}), 404
            
        # Converter ObjectId para string para serialização JSON
        veiculo['_id'] = str(veiculo['_id'])
        veiculo['ano'] = veiculo['ano_modelo']
        # Retornar os dados do veículo
        print(veiculo)
        return jsonify(veiculo)
        
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@app.route('/criar-anuncio', methods=['POST'])
def criar_anuncio():
    """Processar formulário e criar novo anúncio"""
    try:
        # Obter dados do formulário
        dados = {
            'marca': request.form.get('marca'),
            'modelo': request.form.get('modelo'),
            'ano': int(request.form.get('ano')),
            'versao': request.form.get('versao'),
            'km': int(request.form.get('km')),
            'preco': float(request.form.get('preco')),
            'descricao': request.form.get('descricao'),
            'data_criacao': datetime.now(),
            
            'status': 'rascunho',  # inicialmente como rascunho
            'visualizacoes': 0,
            'contatos': 0,
            'favoritados': 0,
            'plataformas': [],  # será preenchido na etapa de publicação
            'usuario_id': session.get('usuario_id', 'anonimo')  # ideal usar um sistema de auth
        }
        
        # Processar imagens
        imagens = []
        if 'imagens' in request.files:
            arquivos = request.files.getlist('imagens')
            for arquivo in arquivos:
                if arquivo and arquivo.filename:
                    filename = secure_filename(arquivo.filename)
                    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
                    novo_filename = f"{timestamp}_{filename}"
                    caminho = os.path.join(UPLOAD_FOLDER, novo_filename)
                    arquivo.save(caminho)
                    imagens.append(f"/static/uploads/{novo_filename}")
        
        dados['imagens'] = imagens
        
        # Salvar no MongoDB
        anuncio_id = mongo.db.anuncios.insert_one(dados).inserted_id
        
        # Redirecionar para escolher plataformas se for publicação
        if request.form.get('acao') == 'publicar':
            return redirect(url_for('publicar', anuncio_id=anuncio_id))
        else:
            flash('Anúncio salvo como rascunho com sucesso!', 'success')
            return redirect(url_for('gerenciar'))
            
    except Exception as e:
        flash(f'Erro ao criar anúncio: {str(e)}', 'error')
        return redirect(url_for('index'))

@app.route('/publicar/<anuncio_id>')
def publicar(anuncio_id):
    """Página para selecionar plataformas de publicação"""
    try:
        anuncio = mongo.db.anuncios.find_one({'_id': ObjectId(anuncio_id)})
        plataformas = list(mongo.db.plataformas.find())
        
        if not anuncio:
            flash('Anúncio não encontrado', 'error')
            return redirect(url_for('index'))
            
        return render_template('publicar.html', anuncio=anuncio, plataformas=plataformas)
        
    except Exception as e:
        flash(f'Erro ao carregar página de publicação: {str(e)}', 'error')
        return redirect(url_for('index'))

@app.route('/processar-publicacao/<anuncio_id>', methods=['POST'])
def processar_publicacao(anuncio_id):
    """Processar publicação em plataformas selecionadas"""
    try:
        plataformas_selecionadas = request.form.getlist('plataformas')
        
        # Atualizar anúncio com plataformas selecionadas
        publicacoes = []
        for plat_id in plataformas_selecionadas:
            plataforma = mongo.db.plataformas.find_one({'_id': ObjectId(plat_id)})
            # Na prática, aqui teríamos integração com APIs das plataformas
            publicacoes.append({
                'plataforma_id': plat_id,
                'plataforma_nome': plataforma['nome'],
                'data_publicacao': datetime.now(),
                'data_expiracao': datetime.now() + timedelta(days=30),  # Por padrão, 30 dias
                'status': 'ativo',
                'url': None,  # Seria preenchido após retorno da API da plataforma
                'visualizacoes': 0
            })
            
        # Atualizar status do anúncio
        mongo.db.anuncios.update_one(
            {'_id': ObjectId(anuncio_id)},
            {
                '$set': {
                    'status': 'ativo',
                    'plataformas': publicacoes
                }
            }
        )
        
        flash('Anúncio publicado com sucesso!', 'success')
        return redirect(url_for('gerenciar'))
        
    except Exception as e:
        flash(f'Erro ao publicar anúncio: {str(e)}', 'error')
        return redirect(url_for('publicar', anuncio_id=anuncio_id))

@app.route('/gerenciar')
def gerenciar():
    """Página para gerenciar anúncios publicados"""
    try:
        anuncios = list(mongo.db.anuncios.find({
            'usuario_id': session.get('usuario_id', 'anonimo')
        }).sort('data_criacao', -1))
        
        return render_template('gerenciar.html', anuncios=anuncios)
        
    except Exception as e:
        flash(f'Erro ao carregar anúncios: {str(e)}', 'error')
        return render_template('ads-management.html', anuncios=[])

@app.route('/estatisticas/<anuncio_id>')
def estatisticas(anuncio_id):
    """Obter estatísticas de um anúncio"""
    try:
        anuncio = mongo.db.anuncios.find_one({'_id': ObjectId(anuncio_id)})
        
        if not anuncio:
            return jsonify({'erro': 'Anúncio não encontrado'}), 404
            
        # Calcular estatísticas por plataforma
        estatisticas = {
            'total_visualizacoes': anuncio.get('visualizacoes', 0),
            'total_contatos': anuncio.get('contatos', 0),
            'total_favoritados': anuncio.get('favoritados', 0),
            'plataformas': []
        }
        
        for plat in anuncio.get('plataformas', []):
            estatisticas['plataformas'].append({
                'nome': plat.get('plataforma_nome'),
                'visualizacoes': plat.get('visualizacoes', 0),
                'status': plat.get('status')
            })
            
        return jsonify(estatisticas)
        
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@app.route('/excluir-anuncio/<anuncio_id>', methods=['POST'])
def excluir_anuncio(anuncio_id):
    """Excluir um anúncio"""
    try:
        # Na prática, também teríamos que remover das plataformas via API
        anuncio = mongo.db.anuncios.find_one({'_id': ObjectId(anuncio_id)})
        
        # Remover imagens do servidor
        for img in anuncio.get('imagens', []):
            try:
                caminho = os.path.join(app.static_folder, img.replace('/static/', ''))
                if os.path.exists(caminho):
                    os.remove(caminho)
            except:
                pass
        
        # Remover do banco de dados
        mongo.db.anuncios.delete_one({'_id': ObjectId(anuncio_id)})
        
        flash('Anúncio excluído com sucesso!', 'success')
        return redirect(url_for('gerenciar'))
        
    except Exception as e:
        flash(f'Erro ao excluir anúncio: {str(e)}', 'error')
        return redirect(url_for('gerenciar'))

# Iniciar aplicação
if __name__ == '__main__':
    # scripts/inicializar_db.py
    from app import app, mongo
    

    # Executar dentro do contexto da aplicação
    with app.app_context():
        # Verificar se já existem plataformas
        if mongo.db.plataformas.count_documents({}) == 0:
            plataformas = [
                {
                    'nome': 'Webmotor',
                    'slug': 'webmotor',
                    'logo': '/static/images/logos/webmotor.png',
                    'descricao': 'Maior portal de veículos do Brasil',
                    'preco_30dias': 89.90,
                    'ativo': True,
                    'config_api': {
                        'url_base': 'https://api.webmotor.com.br',
                        'metodos': {
                            'publicar': '/anuncios',
                            'atualizar': '/anuncios/{id}',
                            'remover': '/anuncios/{id}',
                            'status': '/anuncios/{id}/status'
                        }
                    }
                },
                {
                    'nome': 'Só Carrão',
                    'slug': 'socarrao',
                    'logo': '/static/images/logos/socarrao.png',
                    'descricao': 'Especializado em carros de luxo e esportivos',
                    'preco_30dias': 69.90,
                    'ativo': True,
                    'config_api': {
                        'url_base': 'https://api.socarrao.com.br',
                        'metodos': {
                            'publicar': '/classificados',
                            'atualizar': '/classificados/{id}',
                            'remover': '/classificados/{id}',
                            'status': '/classificados/{id}/status'
                        }
                    }
                }
            ]
            for platform in plataformas:
                mongo.db.plataformas.insert_one(platform)
            
            
                
            print("Plataformas inicializadas com sucesso!")
        app.run(debug=True)