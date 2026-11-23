# Backend — Akıllı Endüstriyel Güvenlik Sistemi

FastAPI + SQLAlchemy 2.1 backend'i. Takım repo'su; bu klasörün sorumlusu Berkay.
Proje özeti: kök `README.md`. Sprint planı ve tablolar: `backend/docs/SPRINT_PLAN.md`.
Frontend ile API sözleşmesi: GitHub issue #25 (FE-12).

## Ortam (Windows, PowerShell)
- Komutlar `backend/` içinde, venv aktifken çalışır: `.venv\Scripts\activate`
- Sunucu: `uvicorn app.main:app --reload`
- Python 3.13, paket sürümleri `requirements.txt`'te sabit
- Branch çektikten sonra: `pip install -r requirements.txt` ve `alembic upgrade head`
- Yeni migration: `alembic revision --autogenerate -m "..."` → dosyayı gözden geçir → `alembic upgrade head`. Kontrol: `alembic current`
- Alembic adresi `env.py`'de `settings.database_url`'den gelir (`alembic.ini`'deki değil); SQLite'ta `render_as_batch` açık

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
- Liste uçları `{"items": [...], "total": n, "limit": n, "offset": n}` döner (`total` filtrelenmiş toplam). Tarihler UTC, ISO 8601.
- Alan adları snake_case. Kamera ve bölge silme = soft delete (`is_active = False`).

## Alınan kararlar (#25 — ayrıntı: docs/SPRINT_PLAN.md "API sözleşmesi")
- REST uçları `/api` önekiyle. Durum değişikliği: `PATCH /api/events/{id}/status` `{status, note?}`
- Olay `status`: new, reviewing, confirmed, false_alarm. Geçişler: new → reviewing|confirmed|false_alarm; reviewing → new|confirmed|false_alarm; confirmed/false_alarm → reviewing; diğerleri 409.
- Olay `severity`: critical, high, medium, info. Backend `type`'tan doldurur.
- `AnomalyEvent` ayrıca `model_version` tutar; `bbox` = `[x1, y1, x2, y2]`, 0–1 normalize.
- `AlarmAction`: event_id, user_id, from_status, to_status, note, created_at.
- `cameras.area`: serbest metin, String(50). `users.last_login_at` var.
- Olay `code` (`OLY-014`) ve `snapshot_url` DB'de tutulmaz, yanıtta üretilir.
- Liste öğesinde `camera: {id, name, area}`; ilişkiler `selectinload` ile yüklenir (N+1 yok).
- WS mesajı: `{"type": "event.created" | "event.updated", "data": ...}`. WS ve görüntülerde JWT `?token=` ile.
- SQLite naive datetime döndürür; yanıtta tarihler UTC `Z` ile verilir.
- Kamera `code` (`KAM-03`) da yanıtta üretilir. `stream_url` içindeki parola yanıtta maskelenir; PATCH'te gönderilmezse eskisi korunur.
- Bölge: polygon zorunlu, `[[x, y], ...]` 0–1 normalize. `DELETE /api/zones/{id}` → 204, soft delete; liste yalnızca aktifleri döner.
- Olay `type` şimdilik: restricted_zone, no_helmet, no_vest (diğerleri model kesinleşince).
- Filtrelerde çoklu değer tekrar eden parametreyle (`?type=a&type=b`); `q` araması olay kodu/id, kamera adı ve kodu; `from`/`to` saat dilimli ISO, `to` dahil.
- Stats: İstanbul saatine göre gruplama, `by_hour` her zaman 24 kayıt.
- Giriş yanıtı: `{access_token, token_type, user: {id, username, role}}`; JWT'de `role` claim'i. Parola en az 8 karakter; aynı kullanıcı adı 409.
- Yazma uçları yalnızca admin (operatör 403).
- `snapshot_path` yanıtta dönmez; `snapshot_url` = `/api/events/{id}/snapshot` ya da görüntü yoksa `null`. `track_id`, `location`, `stream_url` null olabilir.
- Giriş form-encoded (`OAuth2PasswordRequestForm`), bunun için `python-multipart` gerekir.
- Audit log kod döner (`user.login`, `event.status_changed`, `camera.created|updated|activated|deactivated`, `zone.created|deactivated`, `user.created`); `details` içinde `from/to` veya `label`.

## İş bitti kontrolü (her uç / görev bittiğinde)

Bir uç veya görev bittiğinde, cevabının sonuna aşağıdaki listeyi **Berkay'a hatırlatma olarak** ekle (commit/push/merge'ü Berkay yapar, sen yapma):

1. **Test** — Bu uç için en az bir `pytest` testi var ve geçiyor mu?
2. **Swagger** — Uç `/docs`'ta açıklamasıyla görünüyor mu?
3. **Sözleşme** — Yanıt biçimi #25 / SPRINT_PLAN "API sözleşmesi" ile aynı mı? (`/api` öneki, `{items,total,limit,offset}`, hata kodları)
4. **Küçük PR** — Bu iş tek başına PR olabilecek kadar küçük mü? PR açıklamasına hangi uçların eklendiğini yaz.
5. **Haber ver** — Merge sonrası ucu kullanacak kişiye yazılacak mesajı hazırla:
   - Olay, kamera, bölge, kullanıcı, giriş, istatistik uçları → **Aslı** (mock'tan gerçek API'ye geçecek)
   - `POST /internal/events`, snapshot → **Cudi** (dedektör buraya gönderecek)
   - `POST /api/assistant/query`, ajan araçları → **Emre**
   Mesaj: uç adresi + örnek istek/yanıt + varsa sözleşmeden fark.
6. **SPRINT_PLAN.md** — İlgili maddeyi `[x]` yap.
