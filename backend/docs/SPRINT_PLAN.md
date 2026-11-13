# Backend Sprint Planı — Akıllı Endüstriyel Güvenlik Sistemi

Sorumlu: Berkay Gündoğan · Son güncelleme: 14 Kasım 2026
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
| `zones` | id, camera_id → cameras, name, polygon (JSON), rule_type, is_active | silme = soft delete (`is_active=False`), eski olaylar bölgesini kaybetmesin diye; polygon birimi Aslı ve Cudi ile netleşecek (öneri: 0–1 oran); rule_type enum: restricted, ppe_helmet_vest, ppe_helmet, ppe_vest, forklift_proximity, smoke_fire, person_near_equipment (Cudi ile netleşecek) |
| `anomaly_events` | id, camera_id, zone_id, type, severity, confidence, bbox (JSON), snapshot_path, track_id, model_version, status, created_at | status: `new` / `reviewing` / `confirmed` / `false_alarm`; severity: `critical` / `high` / `medium` / `info` (backend `type`'tan doldurur); `bbox` = `[x1, y1, x2, y2]`, 0–1 normalize; `code` ("OLY-014") ve `snapshot_url` DB'de yok, yanıtta üretilir |
| `alarm_actions` | id, event_id, user_id, from_status, to_status, note, created_at | olayın durum geçmişi; `GET /api/events/{id}` yanıtında `actions` olarak döner |
| `agent_logs` | id, user_id, query, response, created_at | Sprint 4'te doldurulacak |
| `audit_logs` | id, user_id (null olabilir), action, target_type, target_id, details (JSON), created_at | Sprint 2'de; yönetim işlemleri ve durum değişiklikleri |

### 1. hafta — modeller ve Alembic
- [x] Branch: `feature/db-models`
- [x] `app/db/base.py` (Base, naming convention) ve `app/db/session.py` (engine, SessionLocal, `get_db`, SQLite foreign key)
- [x] Enum'lar + `User`, `Camera`, `Zone` modelleri
- [ ] `AnomalyEvent`, `AlarmAction` modelleri
- [ ] `anomaly_events` tablosunda `(camera_id, created_at)` bileşik index + `status` index (küçük tablolarda index yok, foreign key sütunlarında var)
- [ ] **Alembic** kurulumu + ilk migration; şema değişikliği hep migration ile
- [ ] PR (açıklamaya `Closes #25` değil, `Refs #25` — sözleşmenin tamamı bu PR'da bitmiyor)

### 2. hafta — şemalar ve uçlar
- [ ] Her tablo için Pydantic şemaları: `Create`, `Update`, `Read`
- [ ] CRUD uçları (`/api` önekiyle): `/api/cameras`, `/api/zones`, `/api/events`
- [ ] `GET /api/events`: filtre + sayfalama, yanıt `{items, total}`
  - Filtreler: `camera_id`, `area`, `type`, `from`/`to`; çoklu değer tekrar eden parametreyle (`?status=new&status=reviewing`, `?severity=high&severity=critical`)
  - Sıralama: `?sort=-created_at` (varsayılan); izinli alanlar `created_at`, `severity` (critical > high > medium > info), `confidence`
  - Liste öğesi: `code`, `camera: {id, name, area}`, `snapshot_url` dahil (`selectinload` ile, N+1 olmadan)
- [ ] `GET /api/events/{id}`: ayrıca `zone: {id, name} | null`, `model_version`, `bbox`, `actions` geçmişi
- [ ] `GET /api/events/stats`: `by_type`, `by_camera`, `by_day`, `by_hour` (gruplama İstanbul saatine göre)
- [ ] SQLite'tan gelen tarihleri yanıtta UTC (`Z`) olarak döndür
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
- [ ] `PATCH /api/events/{id}/status`, gövde `{status, note?}` → `alarm_actions` kaydı
  - Geçişler: new → reviewing | confirmed | false_alarm; reviewing → new | confirmed | false_alarm; confirmed / false_alarm → reviewing. Diğerleri `409 Conflict`
- [ ] `audit_logs` modeli + `GET /api/audit-logs` (admin): `{id, user: {id, username} | null, action, target_type, target_id, details, created_at}`
  - `action`: `event.status_changed`, `camera.created|updated|deactivated`, `zone.*`, `user.*`, `user.login`; `target_type`: `event | camera | zone | user`
- [ ] CORS: sadece frontend adresi (`http://localhost:5173`)
- [ ] Testler: yanlış parola, süresi dolmuş token, yetkisiz erişim

## Sprint 3 — Olay akışı ve canlı alarm (7–20 Aralık)

**Hedef:** Kayıtlı videoda baretsiz kişi görününce 1–2 saniye içinde panelde alarm.

- [ ] Cudi ile olay JSON formatı: `camera_id`, `type`, `confidence`, `bbox`, `track_id`, `timestamp`, kare görüntüsü
- [ ] `POST /internal/events` (API anahtarıyla korumalı)
- [ ] Kare görüntüsü `media/snapshots/`'a, DB'de sadece yolu
- [ ] Tekrar alarm bastırma: aynı `track_id` + tür için X saniye içinde yeni kayıt açma
- [ ] `WS /ws/alarms?token=<JWT>`: mesaj `{"type": "event.created" | "event.updated", "data": AnomalyEvent}`
- [ ] `GET /api/cameras/{id}/stream?token=<JWT>` (MJPEG, MVP)
- [ ] Snapshot servis etme: `snapshot_url` `?token=<JWT>` ile korunur (`<img>` başlık gönderemez); query string loglanmaz
- [ ] Dedektör `bbox`'ı 0–1 normalize `[x1, y1, x2, y2]` ve `model_version` ile gönderir
- [ ] Dedektör ayrı süreçte

## Sprint 4 — Ajan araçları ve mevzuat RAG (21 Aralık – 3 Ocak)

**Hedef:** "Son 1 saatte A bölgesinde kaç ihlal oldu?" sorusuna doğru yanıt.

- [ ] Emre ile ajan fonksiyonları: `get_events`, `get_event_summary`, `get_camera_status`, `acknowledge_alarm` (onaylanınca → `reviewing`)
- [ ] `POST /api/assistant/query` → `{answer, actions}`; `actions` sadece öneri, uygulama ön yüz onayıyla `PATCH /api/events/{id}/status` üzerinden
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

- REST uçları `/api` önekiyle; `/health`, `/docs`, `WS /ws/alarms` öneksiz
- Liste uçları `{"items": [...], "total": n}` döner; `limit`/`offset` her yerde (varsayılan 50, en fazla 200)
- Tarihler UTC, ISO 8601 (`2026-11-05T10:30:00Z`); alan adları snake_case
- Tarayıcının başlık gönderemediği yerlerde (WS, `<img>`) JWT `?token=` ile
- type → severity (ilk sürüm): restricted_zone → critical, no_helmet → high, no_vest → medium; `info` ihlal olmayan olaylar için
- `area` = grup (Üretim / Depo …), `location` = kameranın tam yeri
- Ajan tarafı (Emre): `/api/assistant/query`, `/api/events/{id}/analysis`, `/api/agents/status`
- Model YOLO26 ailesi; arayüzde/dokümanda "YOLOv11-s" yazılmaz

## Tamamlanma tanımı

- [ ] Kod ayrı branch'te, bir ekip arkadaşı PR'ı inceledi ve merge edildi
- [ ] En az bir test yazıldı ve geçiyor
- [ ] Endpoint Swagger'da açıklamasıyla görünüyor
- [ ] Gerekirse README güncellendi
- [ ] Kullanan kişi (Aslı/Cudi/Emre) kendi tarafından denedi
