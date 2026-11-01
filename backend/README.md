# Backend

## Kurulum
```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

## Çalıştırma
```powershell
uvicorn app.main:app --reload
```
API dokümantasyonu: http://127.0.0.1:8000/docs