from flask import Flask, render_template, request, redirect, url_for, jsonify, session, flash
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
import os
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
# from passlib.context import CryptContext
# from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

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




@app.route('/')
def page_criar_anuncio():
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
    
@app.route('/salvar_anuncio', methods=['POST'])
def salvar_anuncio():
    """API para salvar um anúncio no banco de dados"""
    try:
        # Obter dados do formulário
        dados = request.form.to_dict()
        
        # Processar a ação (publicar ou rascunho)
        acao = dados.pop('acao', 'rascunho')
        
        # Processar opcionais (vem como JSON string)
        opcionais = []
        if 'opcionais' in dados:
            try:
                opcionais = json.loads(dados.pop('opcionais'))
            except:
                opcionais = []
        
        # Processar plataformas selecionadas (vem como JSON string)
        plataformas_selecionadas = []
        if 'plataformas' in dados:
            try:
                plataformas_selecionadas = json.loads(dados.pop('plataformas'))
            except:
                plataformas_selecionadas = []
        
        # Verificar se há arquivos enviados (imagens)
        imagens = []
        if 'imagens' in request.files:
            arquivos = request.files.getlist('imagens')
            for arquivo in arquivos:
                if arquivo and arquivo.filename:
                    nome_arquivo = secure_filename(arquivo.filename)
                    
                    # Gerar um nome único para evitar conflitos
                    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
                    nome_unico = f"{timestamp}_{nome_arquivo}"
                    
                    # Salvar o arquivo
                    caminho_completo = os.path.join(UPLOAD_FOLDER, nome_unico)
                    arquivo.save(caminho_completo)
                    
                    # Adicionar o caminho relativo à lista de imagens
                    imagens.append(f"/static/uploads/{nome_unico}")
        
        # Criar o documento de anúncio
        anuncio = {
            'marca': dados.get('marca', ''),
            'modelo': dados.get('modelo', ''),
            'ano': int(dados.get('ano', 0)),
            'versao': dados.get('versao', ''),
            'km': int(dados.get('km', 0)),
            'preco': float(dados.get('preco', 0)),
            'descricao': dados.get('descricao', ''),
            # Campos da ficha técnica
            'combustivel': dados.get('combustivel', ''),
            'cambio': dados.get('cambio', ''),
            'cor': dados.get('cor', ''),
            'portas': dados.get('portas', ''),
            'motor': dados.get('motor', ''),
            'potencia': dados.get('potencia', ''),
            'direcao': dados.get('direcao', ''),
            'final_placa': dados.get('final_placa', ''),
            'informacoes_adicionais': dados.get('informacoes_adicionais', ''),
            'opcionais': opcionais,
            'imagens': imagens,
            'status': 'publicado' if acao == 'publicar' else 'rascunho',
            'data_criacao': datetime.now(),
            'veiculo_id': ObjectId(dados.get('veiculo', '')) if dados.get('veiculo') else None,
            'plataformas_selecionadas': plataformas_selecionadas
        }
        
        # Inserir no banco de dados
        resultado = mongo.db.anuncios.insert_one(anuncio)
        
        # Se for publicar e houver plataformas selecionadas, criar registros de publicação
        if acao == 'publicar' and plataformas_selecionadas:
            # Buscar informações das plataformas selecionadas no banco de dados
            plataformas_info = list(mongo.db.plataformas.find({"slug": {"$in": plataformas_selecionadas}}))
            
            # Criar registros de publicação para cada plataforma
            publicacoes = []
            for plataforma in plataformas_info:
                publicacao = {
                    'anuncio_id': resultado.inserted_id,
                    'plataforma_id': plataforma['_id'],
                    'plataforma_nome': plataforma['nome'],
                    'plataforma_slug': plataforma['slug'],
                    'status': 'pendente',
                    'data_criacao': datetime.now(),
                    'preco': plataforma.get('preco_30dias', 0),
                    'expiracao': datetime.now() + timedelta(days=30)
                }
                publicacoes.append(publicacao)
            
            # Inserir as publicações no banco de dados se houver
            if publicacoes:
                mongo.db.publicacoes.insert_many(publicacoes)
                
                # Atualizar o anúncio com a referência às publicações
                mongo.db.anuncios.update_one(
                    {'_id': resultado.inserted_id},
                    {'$set': {'publicacoes_ids': [p['_id'] for p in publicacoes]}}
                )
        
        # Retornar sucesso com o ID do anúncio criado
        return jsonify({
            'sucesso': True,
            'mensagem': 'Anúncio salvo com sucesso!',
            'anuncio_id': str(resultado.inserted_id),
            'status': anuncio['status'],
            'plataformas': plataformas_selecionadas
        })
        
    except Exception as e:
        # Retornar erro
        return jsonify({
            'sucesso': False,
            'mensagem': f'Erro ao salvar anúncio: {str(e)}'
        }), 500

@app.route('/anuncios')
def listar_anuncios():
    """Página para gerenciar anúncios"""
    status = request.args.get('status', '')
    
    # Filtrar anúncios por status, se especificado
    query = {}
    if status in ['publicado', 'rascunho']:
        query['status'] = status
    
    # Buscar anúncios no banco de dados
    anuncios = list(mongo.db.anuncios.find(query).sort('data_criacao', -1))
    
    # Converter ObjectId para string para cada anúncio
    for anuncio in anuncios:
        anuncio['_id'] = str(anuncio['_id'])
        if anuncio.get('veiculo_id'):
            anuncio['veiculo_id'] = str(anuncio['veiculo_id'])
    
    # Verificar o formato de retorno
    if request.headers.get('Accept') == 'application/json':
        # Se o cliente solicitar JSON, retornar como API
        return jsonify(anuncios)
    
    # Caso contrário, renderizar uma página simples
    return render_template('anuncios.html', anuncios=anuncios, status_filtro=status)

@app.route('/anuncio/<anuncio_id>')
def get_anuncio(anuncio_id):
    """API para obter detalhes de um anúncio específico"""
    try:
        # Buscar o anúncio no banco de dados usando o ObjectId
        anuncio = mongo.db.anuncios.find_one({'_id': ObjectId(anuncio_id)})
        
        if not anuncio:
            return jsonify({'erro': 'Anúncio não encontrado'}), 404
            
        # Converter ObjectId para string para serialização JSON
        anuncio['_id'] = str(anuncio['_id'])
        if anuncio.get('veiculo_id'):
            anuncio['veiculo_id'] = str(anuncio['veiculo_id'])
        
        # Retornar os dados do anúncio
        return jsonify(anuncio)
        
    except Exception as e:
        return jsonify({'erro': str(e)}), 500
@app.route('/atualizar_anuncio/<anuncio_id>', methods=['POST'])
def atualizar_anuncio(anuncio_id):
    """API para atualizar um anúncio no banco de dados"""
    try:
        # Obter dados do formulário
        dados = request.form.to_dict()
        
        # Processar imagens existentes
        imagens_existentes = []
        if 'imagens_existentes' in dados:
            try:
                imagens_existentes = json.loads(dados.pop('imagens_existentes'))
            except:
                imagens_existentes = []
        
        # Processar opcionais (vem como JSON string)
        opcionais = []
        if 'opcionais' in dados:
            try:
                opcionais = json.loads(dados.pop('opcionais'))
            except:
                opcionais = []
        
        # Processar plataformas selecionadas
        plataformas_selecionadas = []
        if 'plataformas' in dados:
            try:
                plataformas_selecionadas = json.loads(dados.pop('plataformas'))
            except:
                plataformas_selecionadas = []
        
        # Verificar se há novas imagens enviadas
        novas_imagens = []
        if 'novas_imagens' in request.files:
            arquivos = request.files.getlist('novas_imagens')
            for arquivo in arquivos:
                if arquivo and arquivo.filename:
                    nome_arquivo = secure_filename(arquivo.filename)
                    
                    # Gerar um nome único para evitar conflitos
                    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
                    nome_unico = f"{timestamp}_{nome_arquivo}"
                    
                    # Salvar o arquivo
                    caminho_completo = os.path.join(UPLOAD_FOLDER, nome_unico)
                    arquivo.save(caminho_completo)
                    
                    # Adicionar o caminho relativo à lista de imagens
                    novas_imagens.append(f"/static/uploads/{nome_unico}")
        
        # Combinar imagens existentes e novas
        todas_imagens = imagens_existentes + novas_imagens
        
        # Remover o ID do dicionário de dados, se presente
        if '_id' in dados:
            dados.pop('_id')
        
        # Criar o documento de atualização
        atualizacao = {
            'marca': dados.get('marca', ''),
            'modelo': dados.get('modelo', ''),
            'ano': int(dados.get('ano', 0)),
            'versao': dados.get('versao', ''),
            'km': int(dados.get('km', 0)),
            'preco': float(dados.get('preco', 0)),
            'descricao': dados.get('descricao', ''),
            'imagens': todas_imagens,
            # Campos da ficha técnica
            'combustivel': dados.get('combustivel', ''),
            'cambio': dados.get('cambio', ''),
            'cor': dados.get('cor', ''),
            'portas': dados.get('portas', ''),
            'motor': dados.get('motor', ''),
            'potencia': dados.get('potencia', ''),
            'direcao': dados.get('direcao', ''),
            'final_placa': dados.get('final_placa', ''),
            'informacoes_adicionais': dados.get('informacoes_adicionais', ''),
            'opcionais': opcionais,
            'plataformas_selecionadas': plataformas_selecionadas,
            'data_atualizacao': datetime.now()
        }
        
        # Buscar o anúncio atual para comparar as plataformas
        anuncio_atual = mongo.db.anuncios.find_one({'_id': ObjectId(anuncio_id)})
        plataformas_anteriores = anuncio_atual.get('plataformas_selecionadas', []) if anuncio_atual else []
        
        # Verificar mudanças nas plataformas
        plataformas_adicionadas = [p for p in plataformas_selecionadas if p not in plataformas_anteriores]
        plataformas_removidas = [p for p in plataformas_anteriores if p not in plataformas_selecionadas]
        
        # Atualizar no banco de dados
        resultado = mongo.db.anuncios.update_one(
            {'_id': ObjectId(anuncio_id)},
            {'$set': atualizacao}
        )
        
        # Se o anúncio está publicado, atualizar as publicações
        if anuncio_atual and anuncio_atual.get('status') == 'publicado':
            # Remover publicações para plataformas removidas
            if plataformas_removidas:
                mongo.db.publicacoes.delete_many({
                    'anuncio_id': ObjectId(anuncio_id),
                    'plataforma_slug': {'$in': plataformas_removidas}
                })
            
            # Adicionar publicações para novas plataformas
            if plataformas_adicionadas:
                plataformas_info = list(mongo.db.plataformas.find({"slug": {"$in": plataformas_adicionadas}}))
                
                novas_publicacoes = []
                for plataforma in plataformas_info:
                    publicacao = {
                        'anuncio_id': ObjectId(anuncio_id),
                        'plataforma_id': plataforma['_id'],
                        'plataforma_nome': plataforma['nome'],
                        'plataforma_slug': plataforma['slug'],
                        'status': 'pendente',
                        'data_criacao': datetime.now(),
                        'preco': plataforma.get('preco_30dias', 0),
                        'expiracao': datetime.now() + timedelta(days=30)
                    }
                    novas_publicacoes.append(publicacao)
                
                if novas_publicacoes:
                    # Inserir as novas publicações
                    resultado_publicacoes = mongo.db.publicacoes.insert_many(novas_publicacoes)
                    
                    # Atualizar o anúncio com as novas publicações
                    nova_publicacoes_ids = [p for p in resultado_publicacoes.inserted_ids]
                    publicacoes_anteriores = anuncio_atual.get('publicacoes_ids', []) if anuncio_atual else []
                    
                    todas_publicacoes = publicacoes_anteriores + nova_publicacoes_ids
                    
                    mongo.db.anuncios.update_one(
                        {'_id': ObjectId(anuncio_id)},
                        {'$set': {'publicacoes_ids': todas_publicacoes}}
                    )
        
        if resultado.modified_count > 0:
            return jsonify({
                'sucesso': True,
                'mensagem': 'Anúncio atualizado com sucesso!',
                'anuncio_id': anuncio_id,
                'plataformas': plataformas_selecionadas
            })
        else:
            return jsonify({
                'sucesso': False,
                'mensagem': 'Nenhuma alteração foi feita ao anúncio.'
            })
        
    except Exception as e:
        # Retornar erro
        return jsonify({
            'sucesso': False,
            'mensagem': f'Erro ao atualizar anúncio: {str(e)}'
        }), 500

@app.route('/excluir_anuncio/<anuncio_id>', methods=['DELETE'])
def excluir_anuncio(anuncio_id):
    """API para excluir um anúncio do banco de dados"""
    try:
        # Buscar o anúncio para obter informações das imagens
        anuncio = mongo.db.anuncios.find_one({'_id': ObjectId(anuncio_id)})
        
        if not anuncio:
            return jsonify({
                'sucesso': False,
                'mensagem': 'Anúncio não encontrado'
            }), 404
        
        # Excluir o anúncio do banco de dados
        resultado = mongo.db.anuncios.delete_one({'_id': ObjectId(anuncio_id)})
        
        if resultado.deleted_count > 0:
            # Opcional: remover arquivos de imagem do servidor
            # Se você quiser remover as imagens do servidor quando o anúncio for excluído
            # Você pode implementar essa lógica aqui
            
            return jsonify({
                'sucesso': True,
                'mensagem': 'Anúncio excluído com sucesso!'
            })
        else:
            return jsonify({
                'sucesso': False,
                'mensagem': 'Não foi possível excluir o anúncio'
            })
        
    except Exception as e:
        return jsonify({
            'sucesso': False,
            'mensagem': f'Erro ao excluir anúncio: {str(e)}'
        }), 500


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