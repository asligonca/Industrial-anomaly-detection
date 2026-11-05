# Backend — Akıllı Endüstriyel Güvenlik Sistemi

FastAPI + SQLAlchemy 2.1 backend'i. Takım repo'su; bu klasörün sorumlusu Berkay.
Proje özeti: kök `README.md`. Sprint planı ve tablolar: `backend/docs/SPRINT_PLAN.md`.
Frontend ile API sözleşmesi: GitHub issue #25 (FE-12).

## Ortam (Windows, PowerShell)
- Komutlar `backend/` içinde, venv aktifken çalışır: `.venv\Scripts\activate`
- Sunucu: `uvicorn app.main:app --reload`
- Python 3.13, paket sürümleri `requirements.txt`'te sabit

## Kurallar
- Sadece `backend/` altındaki dosyaları değiştir. `frontend/`, `ml/`, kök dosyalara dokunma.
- Asla commit, push veya branch işlemi yapma. Git'i kullanıcı GitHub Desktop'tan yönetir.
- `.env` dosyasını okuma veya değiştirme; yeni ayar gerekiyorsa `.env.example`'a ekle.
- Yeni paket gerekiyorsa önce sor; onaylanırsa sürümüyle `requirements.txt`'e ekle.
- `drop_all` veya veri silen komut çalıştırma. Şema değişikliği yalnızca Alembic migration ile.
- Her değişiklikten sonra ne yaptığını ve nedenini kısa Türkçe açıkla. Büyük işleri küçük adımlara böl, her adımda onay al.

## Kod kuralları
- SQLAlchemy 2.0 stili: `Mapped[...]` + `mapped_column`. Opsiyonel alan = `Mapped[X | None]`.
- DB kullanan endpoint'ler `def` (async değil); oturum `Depends(get_db)` ile gelir.
- Her tablo için ayrı Pydantic şemaları: `XCreate`, `XUpdate` (alanlar opsiyonel), `XRead`.
- Liste uçları `{"items": [...], "total": n}` döner. Tarihler UTC, ISO 8601.
- Alan adları snake_case. Kamera ve bölge silme = soft delete (`is_active = False`).

## Alınan kararlar (#25)
- Olay `status`: new, reviewing, confirmed, false_alarm
- Olay `severity`: critical, high, medium, info. Backend `type`'tan doldurur.
- `cameras.area`: serbest metin, String(50)
- `users.last_login_at` var. Olay kodu (`OLY-014`) DB'de tutulmaz, yanıtta `id`'den üretilir.
- WS mesajı: `{"type": "event.created" | "event.updated", "data": ...}`
