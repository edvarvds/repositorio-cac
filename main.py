import os
from app import app  # noqa: F401

# Para produção, desativa o modo debug e usa a porta do ambiente
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
