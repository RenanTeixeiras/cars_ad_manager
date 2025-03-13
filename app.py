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
            'imagens': imagens,
            'status': 'publicado' if acao == 'publicar' else 'rascunho',
            'data_criacao': datetime.now(),
            'veiculo_id': ObjectId(dados.get('veiculo', '')) if dados.get('veiculo') else None
        }
        
        # Inserir no banco de dados
        resultado = mongo.db.anuncios.insert_one(anuncio)
        
        # Retornar sucesso com o ID do anúncio criado
        return jsonify({
            'sucesso': True,
            'mensagem': 'Anúncio salvo com sucesso!',
            'anuncio_id': str(resultado.inserted_id),
            'status': anuncio['status']
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