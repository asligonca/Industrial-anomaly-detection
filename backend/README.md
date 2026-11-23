# Backend

## Kurulum
```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

`.env` içindeki `JWT_SECRET_KEY` zorunludur (en az 32 karakter); yoksa uygulama ve Alembic açılmaz.
Rastgele bir anahtar üretip `.env`'e yazın:
```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Tabloları oluşturun, sonra ilk admin kullanıcısını ekleyin (parola iki kez sorulur, en az 8 karakter):
```powershell
alembic upgrade head
python -m app.scripts.create_admin --username admin
```

Geliştirme verisi (3 kamera, bölgeler, 50 olay; demo girişleri `admin / admin1234`, `operator / operator1234`).
Tekrar çalıştırılınca veriyi çoğaltmaz, var olan kullanıcıların parolasına dokunmaz:
```powershell
python -m app.scripts.seed
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

Korumalı uçları Swagger'da denemek için sağ üstteki **Authorize** düğmesine kullanıcı adı ve parolayı girin.
Liste uçları giriş yapmış herkese, yazma uçları ve kullanıcı listesi yalnızca admin'e açıktır.

## Testler
Test paketleri çalışma ortamı için gerekmez; ayrı dosyadadır:
```powershell
pip install -r requirements-dev.txt
pytest
```
