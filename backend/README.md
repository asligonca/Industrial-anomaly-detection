# Backend

## Kurulum
```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
```

## Veritabanı (Alembic)
Şema yalnızca migration ile değişir; tablolar `alembic upgrade head` ile oluşur.

Branch çektikten sonra (yeni paket veya migration gelmiş olabilir):
```powershell
pip install -r requirements.txt
alembic upgrade head
```

Model değiştirdikten sonra yeni migration:
```powershell
alembic revision --autogenerate -m "kısa açıklama"
# alembic/versions/ altındaki dosyayı gözden geçir, sonra:
alembic upgrade head
```

Hangi migration'da olduğunu görmek için: `alembic current`

## Çalıştırma
```powershell
uvicorn app.main:app --reload
```
API dokümantasyonu: http://127.0.0.1:8000/docs