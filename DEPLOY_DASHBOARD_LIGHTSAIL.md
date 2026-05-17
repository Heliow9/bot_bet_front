# Dashboard Bet2026 - deploy e conexão com API

## O que foi ajustado

- Conexão centralizada com a API em `src/api.js`.
- `.env.production` apontando para `http://13.220.25.160:8000`.
- Mensagem visual no dashboard mostrando se a API conectou ou falhou.
- Radar de oportunidades com score operacional.
- Controle de risco automático.
- Detecção de live desatualizado, útil para validar se o monitor de 120s está funcionando.
- Build testado com `npm run build`.

## Subir no servidor

```bash
cd /var/www
# se ainda não existir
git clone LINK_DO_REPOSITORIO_DA_DASHBOARD dashboard-bet2026
cd dashboard-bet2026
npm install
cp .env.example .env
nano .env
npm run build
```

No `.env`, deixe:

```env
VITE_API_URL=http://13.220.25.160:8000
VITE_DASHBOARD_POLL_INTERVAL_MS=60000
VITE_API_TIMEOUT_MS=20000
```

## Atenção a CORS

Se a dashboard estiver em outro domínio/porta, a API FastAPI precisa liberar CORS.
No backend, em `app/main.py`, precisa ter algo como:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://13.220.25.160",
        "http://13.220.25.160:5173",
        "http://13.220.25.160:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Temporariamente pode usar `allow_origins=["*"]`, mas em produção é melhor listar os domínios.

Depois reinicie a API:

```bash
pm2 restart api
```

## Testes rápidos

API:

```bash
curl -I http://13.220.25.160:8000/docs
```

Dashboard local:

```bash
npm run dev -- --host 0.0.0.0
```

Build:

```bash
npm run build
```

## Se a dashboard usar HTTPS

Navegador bloqueia dashboard HTTPS chamando API HTTP. Nesse caso use Nginx + SSL na API e troque o `.env` para:

```env
VITE_API_URL=https://api.seudominio.com
```

Ou hospede dashboard e API no mesmo domínio com proxy `/api`.
