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