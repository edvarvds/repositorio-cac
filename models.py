from app import db

class CAC(db.Model):
    """Model for CAC (Colecionador, Atirador Desportivo e Caçador) certificates"""
    id = db.Column(db.Integer, primary_key=True)
    cpf = db.Column(db.String(11), unique=True, nullable=False)
    nome = db.Column(db.String(100), nullable=False)
    nome_mae = db.Column(db.String(100), nullable=False)
    data_nascimento = db.Column(db.String(10), nullable=False)  # Format: YYYY-MM-DD
    sexo = db.Column(db.String(20), nullable=False)
    
    def __repr__(self):
        return f'<CAC {self.nome}>'
