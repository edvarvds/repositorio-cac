# Configuração Gunicorn para produção
import os
import multiprocessing

# Variáveis de ambiente ou valores padrão
port = int(os.environ.get("PORT", 5000))
workers = int(os.environ.get("WEB_CONCURRENCY", multiprocessing.cpu_count() * 2 + 1))
threads = int(os.environ.get("THREADS", 2))
timeout = int(os.environ.get("TIMEOUT", 30))

# Configurações de bind
bind = f"0.0.0.0:{port}"

# Configurações de workers
worker_class = "sync"
max_requests = 1000
max_requests_jitter = 50

# Configurações de logging
accesslog = "-"  # stdout
errorlog = "-"   # stderr
loglevel = "info"

# Configurações de segurança
limit_request_line = 4096
limit_request_fields = 100
limit_request_field_size = 8190