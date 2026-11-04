# Backend Sprint Planı — Akıllı Endüstriyel Güvenlik Sistemi

Sorumlu: Berkay Gündoğan · Son güncelleme: 5 Kasım 2026
Kaynak doküman: https://claude.ai/artifact/NGXrmUzDrS4cNsjNyECM2F

## Özet

Backend işi 2 Kasım 2026 – 17 Ocak 2027 arasında 6 sprintte (11 hafta) bitiyor. Sonunda tek komutla ayağa kalkan, alarmları panele anlık ileten ve ajanlara veri sağlayan bir API olacak.

Backend'in üç işi var:

- **Veriyi tutmak:** kullanıcılar, kameralar, yasaklı bölgeler, anomali olayları, alarm kararları.
- **Olayları dağıtmak:** YOLO modülünden gelen olayı kaydedip WebSocket ile panele anında iletmek.
- **Ajanlara veri sağlamak:** Gemini ajanlarının çağıracağı fonksiyonlar ("son 1 saatteki ihlaller" gibi) backend servisleridir.

| Sprint | Tarih | Konu |
| --- | --- | --- |
| S0 | 2–8 Kasım | Ortam ve temel — **tamamlandı** |
| S1 | 9–22 Kasım | Veritabanı şeması ve CRUD |
| S2 | 23 Kasım – 6 Aralık | Kimlik doğrulama ve yetkiler |
| S3 | 7–20 Aralık | Olay akışı ve canlı alarm |
| S4 | 21 Aralık – 3 Ocak | Ajan araçları ve mevzuat RAG |
| S5 | 4–17 Ocak | Docker, test, güvenlik, README |
| Demo | 17 Ocak | 1. dönem demosu |

## Sprint 0 — Ortam ve temel (2–8 Kasım) ✅

- [x] Python 3.13 + `backend\.venv`
- [x] Paketler sürümleriyle `requirements.txt`'te (FastAPI 0.162, SQLAlchemy 2.1.6, uvicorn 0.54, pydantic-settings 2.16)
- [x] `backend/` klasör yapısı (`app/api`, `app/core`, `app/db`, `app/models`, `app/schemas`, `tests`)
- [x] `.gitignore`, `.env.example`, `backend/README.md`
- [x] `GET /health` → `{"status": "ok"}`
- [x] FastAPI tutorial ve SQLAlchemy ORM pratiği
- [x] PR #1 merge edildi

## Sprint 1 — Veritabanı şeması ve CRUD (9–22 Kasım)

**Hedef:** Aslı'nın panelde gerçek API'den örnek veri gösterebilmesi.

Tablolar (FE-12 / #25 kararları işlendi):

| Tablo | Temel sütunlar | Not |
| --- | --- | --- |
| `users` | id, username, password_hash, role, is_active, last_login_at, created_at | role: `admin` / `operator` |
| `cameras` | id, name, area, location, stream_url, is_active, created_at | `area` serbest metin (String(50)); silme = soft delete (`is_active=False`) |
| `zones` | id, camera_id → cameras, name, polygon (JSON), rule_type | rule_type enum: restricted, ppe_helmet_vest, ppe_helmet, ppe_vest, forklift_proximity, smoke_fire, person_near_equipment (Cudi ile netleşecek) |
| `anomaly_events` | id, camera_id, zone_id, type, severity, confidence, bbox (JSON), snapshot_path, track_id, status, created_at | status: `new` / `reviewing` / `confirmed` / `false_alarm`; severity: `critical` / `high` / `medium` / `info` (backend `type`'tan doldurur); `code` ("OLY-014") DB'de yok, yanıtta üretilir |
| `alarm_actions` | id, event_id, user_id, action, note, created_at | kim, hangi alarmı, ne zaman işaretledi |
| `agent_logs` | id, user_id, query, response, created_at | Sprint 4'te doldurulacak |

### 1. hafta — modeller ve Alembic
- [ ] Branch: `feature/db-models`
- [ ] `app/db/base.py` (Base) ve `app/db/session.py` (engine, SessionLocal, `get_db`)
- [ ] Enum'lar + `User`, `Camera`, `Zone` modelleri
- [ ] `AnomalyEvent`, `AlarmAction` modelleri
- [ ] `created_at` ve `camera_id` üzerine index
- [ ] **Alembic** kurulumu + ilk migration; şema değişikliği hep migration ile
- [ ] PR (açıklamaya `Closes #25` değil, `Refs #25` — sözleşmenin tamamı bu PR'da bitmiyor)

### 2. hafta — şemalar ve uçlar
- [ ] Her tablo için Pydantic şemaları: `Create`, `Update`, `Read`
- [ ] CRUD uçları: `/cameras`, `/zones`, `/events`
- [ ] `GET /events`: filtre + sayfalama (`camera_id`, `area`, `type`, `severity`, `status`, `from`/`to`, `limit`/`offset`), yanıt `{items, total}`
- [ ] `GET /events/stats`: `by_type`, `by_camera`, `by_day`, `by_hour` (gruplama İstanbul saatine göre)
- [ ] `seed.py`: 3 kamera, 50 sahte olay
- [ ] `pytest` + `TestClient` ile ilk testler
- [ ] ER diyagramı (dbdiagram.io) → forma ekle

**Sprint sonu çıktısı:** Swagger'dan kamera eklenip olay listesi filtrelenebiliyor; formun veritabanı bölümü dolu.

## Sprint 2 — Kimlik doğrulama ve yetkiler (23 Kasım – 6 Aralık)

**Hedef:** Operatör ve admin farklı yetkilerle giriş yapabilsin.

- [ ] Parolaları bcrypt ile hash'le (`pwdlib` ya da `passlib[bcrypt]`)
- [ ] `POST /auth/login` → JWT access token (`PyJWT`), ömür 30–60 dk; `last_login_at` güncellenir
- [ ] `get_current_user` ve `require_role("admin")` dependency'leri
- [ ] Yetkiler: admin → kullanıcı/kamera/bölge yönetimi, loglar; operatör → olayları gör, alarm durumunu değiştir
- [ ] `PATCH /events/{id}/status` → durum değişikliği + `alarm_actions` kaydı
- [ ] `GET /audit-logs` (admin): `{id, user: {id, username}, action, target_type, target_id, created_at}`
- [ ] CORS: sadece frontend adresi (`http://localhost:5173`)
- [ ] Testler: yanlış parola, süresi dolmuş token, yetkisiz erişim

## Sprint 3 — Olay akışı ve canlı alarm (7–20 Aralık)

**Hedef:** Kayıtlı videoda baretsiz kişi görününce 1–2 saniye içinde panelde alarm.

- [ ] Cudi ile olay JSON formatı: `camera_id`, `type`, `confidence`, `bbox`, `track_id`, `timestamp`, kare görüntüsü
- [ ] `POST /internal/events` (API anahtarıyla korumalı)
- [ ] Kare görüntüsü `media/snapshots/`'a, DB'de sadece yolu
- [ ] Tekrar alarm bastırma: aynı `track_id` + tür için X saniye içinde yeni kayıt açma
- [ ] `WS /ws/alarms`: mesaj `{"type": "event.created" | "event.updated", "data": AnomalyEvent}`, JWT ile bağlantı
- [ ] `GET /cameras/{id}/stream` (MJPEG, MVP)
- [ ] Dedektör ayrı süreçte

## Sprint 4 — Ajan araçları ve mevzuat RAG (21 Aralık – 3 Ocak)

**Hedef:** "Son 1 saatte A bölgesinde kaç ihlal oldu?" sorusuna doğru yanıt.

- [ ] Emre ile ajan fonksiyonları: `get_events`, `get_event_summary`, `get_camera_status`, `acknowledge_alarm`
- [ ] `POST /assistant/query` → `{answer, actions}`; `actions` sadece öneri, uygulama `PATCH /events/{id}/status` üzerinden
- [ ] Gemini anahtarı sadece backend `.env`'de; LLM'e görüntü değil metaveri
- [ ] Timeout + hız sınırı
- [ ] PostgreSQL + pgvector; `regulation_chunks` ve `search_regulations(query)`

## Sprint 5 — Docker, test, güvenlik, README (4–17 Ocak)

- [ ] `Dockerfile` + `docker-compose.yml` (backend, PostgreSQL/pgvector, frontend)
- [ ] Test kapsamı: auth, filtreler, WebSocket, yetkiler
- [ ] Güvenlik: snapshot saklama süresi, audit log, loglarda kişisel veri yok, HTTPS, `pip-audit`
- [ ] README ve Swagger açıklamaları
- [ ] Uçtan uca demo provası

## API sözleşmesi — genel kurallar (#25)

- Liste uçları `{"items": [...], "total": n}` döner
- Tarihler UTC, ISO 8601 (`2026-11-05T10:30:00Z`); alan adları snake_case
- Ajan tarafı (Emre): `/assistant/query`, `/events/{id}/analysis`, `/agents/status`

## Tamamlanma tanımı

- [ ] Kod ayrı branch'te, bir ekip arkadaşı PR'ı inceledi ve merge edildi
- [ ] En az bir test yazıldı ve geçiyor
- [ ] Endpoint Swagger'da açıklamasıyla görünüyor
- [ ] Gerekirse README güncellendi
- [ ] Kullanan kişi (Aslı/Cudi/Emre) kendi tarafından denedi
