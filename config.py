import os
from datetime import timedelta

class Config:
    # Configurações básicas
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'chave-secreta-padrao'
    
    # Configurações MongoDB
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://admin:admin123@localhost:27017/admin?authSource=admin'
    
    # Configurações de upload
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # Limite de 16MB para upload
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    
    # Configurações de sessão
    PERMANENT_SESSION_LIFETIME = timedelta(days=30)