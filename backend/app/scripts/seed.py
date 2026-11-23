"""Geliştirme verisi: 3 kamera, bölgeleri, 50 olay (durum geçmişiyle) ve demo kullanıcılar.

Kullanım (`backend/` içinde, `alembic upgrade head` sonrası):
    python -m app.scripts.seed

Tekrar çalıştırılınca veriyi çoğaltmaz ve hiçbir şeyi silmez:
- kullanıcılar ada göre aranır, varsa dokunulmaz (parolası da değişmez);
- kameralar ada göre, bölgeler kamera + ada göre aranır;
- seed kameralarında olay varsa olay eklenmez.
Demo parolaları yalnızca geliştirme içindir.
"""

import random
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import AlarmAction, AnomalyEvent, Camera, User, Zone
from app.models.enums import (
    EVENT_TYPE_SEVERITY,
    EventStatus,
    EventType,
    UserRole,
    ZoneRuleType,
)

MODEL_VERSION = "yolo26n-exp1"
EVENT_COUNT = 50
DAYS_BACK = 7
RANDOM_SEED = 42

DEMO_USERS = [
    ("admin", "admin1234", UserRole.admin),
    ("operator", "operator1234", UserRole.operator),
]

CAMERAS = [
    {
        "name": "Üretim Hattı A",
        "area": "Üretim",
        "location": "Tesis 2 · Üretim",
        "stream_url": "rtsp://10.0.1.11/stream",
    },
    {
        "name": "Depo Rafları",
        "area": "Depo",
        "location": "Tesis 2 · Depo",
        "stream_url": "rtsp://admin:depo2026@10.0.1.12/stream",
    },
    {
        "name": "Kimyasal Depo",
        "area": "Kısıtlı bölgeler",
        "location": "Tesis 2 · Kimyasal alan",
        "stream_url": None,
    },
]

ZONES = {
    "Üretim Hattı A": [
        ("KKD zorunlu alan", ZoneRuleType.ppe_helmet_vest, [[0.1, 0.2], [0.6, 0.2], [0.6, 0.9], [0.1, 0.9]]),
    ],
    "Depo Rafları": [
        ("Raf koridoru", ZoneRuleType.ppe_vest, [[0.2, 0.1], [0.8, 0.1], [0.8, 0.95], [0.2, 0.95]]),
        ("Forklift yolu", ZoneRuleType.restricted, [[0.0, 0.6], [1.0, 0.6], [1.0, 1.0], [0.0, 1.0]]),
    ],
    "Kimyasal Depo": [
        ("Kırmızı alan", ZoneRuleType.restricted, [[0.55, 0.3], [0.9, 0.3], [0.9, 0.85], [0.55, 0.85]]),
    ],
}

ZONE_RULES_FOR_TYPE = {
    EventType.restricted_zone: {ZoneRuleType.restricted},
    EventType.no_helmet: {ZoneRuleType.ppe_helmet_vest, ZoneRuleType.ppe_helmet},
    EventType.no_vest: {ZoneRuleType.ppe_helmet_vest, ZoneRuleType.ppe_vest},
}

STATUS_WEIGHTS = {
    EventStatus.new: 25,
    EventStatus.reviewing: 15,
    EventStatus.confirmed: 40,
    EventStatus.false_alarm: 20,
}

CLOSING_NOTES = {
    EventStatus.confirmed: "Saha ekibi bilgilendirildi",
    EventStatus.false_alarm: "Kamera açısı yanıltıcı",
}


@dataclass
class SeedSummary:
    """Bu çalıştırmada eklenen kayıt sayıları."""

    users: int = 0
    cameras: int = 0
    zones: int = 0
    events: int = 0
    actions: int = 0
    skipped: list[str] = field(default_factory=list)


def _seed_users(db: Session, summary: SeedSummary) -> dict[str, User]:
    users: dict[str, User] = {}
    for username, password, role in DEMO_USERS:
        user = db.scalar(select(User).where(User.username == username))
        if user is None:
            user = User(username=username, password_hash=hash_password(password), role=role)
            db.add(user)
            summary.users += 1
        users[username] = user
    db.flush()
    return users


def _seed_cameras(db: Session, summary: SeedSummary) -> list[Camera]:
    cameras: list[Camera] = []
    for values in CAMERAS:
        camera = db.scalar(select(Camera).where(Camera.name == values["name"]))
        if camera is None:
            camera = Camera(**values)
            db.add(camera)
            summary.cameras += 1
        cameras.append(camera)
    db.flush()
    return cameras


def _seed_zones(db: Session, cameras: list[Camera], summary: SeedSummary) -> list[Zone]:
    zones: list[Zone] = []
    for camera in cameras:
        for name, rule_type, polygon in ZONES.get(camera.name, []):
            zone = db.scalar(select(Zone).where(Zone.camera_id == camera.id, Zone.name == name))
            if zone is None:
                zone = Zone(camera_id=camera.id, name=name, rule_type=rule_type, polygon=polygon)
                db.add(zone)
                summary.zones += 1
            zones.append(zone)
    db.flush()
    return zones


def _random_bbox(rng: random.Random) -> list[float]:
    x1 = rng.uniform(0.0, 0.8)
    y1 = rng.uniform(0.0, 0.5)
    x2 = min(1.0, x1 + rng.uniform(0.05, 0.2))
    y2 = min(1.0, y1 + rng.uniform(0.25, 0.5))
    return [round(x1, 3), round(y1, 3), round(x2, 3), round(y2, 3)]


def _history(
    event: AnomalyEvent, operator: User, now: datetime
) -> list[AlarmAction]:
    """Olayın şimdiki durumuna nasıl gelindiği: incelemeye alındı, sonra (varsa) kapandı."""
    if event.status == EventStatus.new:
        return []

    def step(from_status, to_status, minutes, note=None):
        return AlarmAction(
            event_id=event.id,
            user_id=operator.id,
            from_status=from_status,
            to_status=to_status,
            note=note,
            created_at=min(now, event.created_at + timedelta(minutes=minutes)),
        )

    steps = [step(EventStatus.new, EventStatus.reviewing, 2)]
    if event.status != EventStatus.reviewing:
        steps.append(
            step(EventStatus.reviewing, event.status, 9, CLOSING_NOTES[event.status])
        )
    return steps


def _seed_events(
    db: Session,
    cameras: list[Camera],
    zones: list[Zone],
    operator: User,
    now: datetime,
    summary: SeedSummary,
) -> None:
    camera_ids = [camera.id for camera in cameras]
    existing = db.scalar(
        select(func.count()).select_from(AnomalyEvent).where(AnomalyEvent.camera_id.in_(camera_ids))
    )
    if existing:
        summary.skipped.append(f"olaylar (seed kameralarında zaten {existing} olay var)")
        return

    rng = random.Random(RANDOM_SEED)
    event_types = list(EventType)
    statuses = list(STATUS_WEIGHTS)
    weights = list(STATUS_WEIGHTS.values())
    for _ in range(EVENT_COUNT):
        camera = rng.choice(cameras)
        event_type = rng.choice(event_types)
        matching = [
            z for z in zones
            if z.camera_id == camera.id and z.rule_type in ZONE_RULES_FOR_TYPE[event_type]
        ]
        event = AnomalyEvent(
            camera_id=camera.id,
            zone_id=rng.choice(matching).id if matching else None,
            type=event_type,
            severity=EVENT_TYPE_SEVERITY[event_type],
            confidence=round(rng.uniform(0.55, 0.98), 2),
            bbox=_random_bbox(rng),
            snapshot_path=None,
            track_id=rng.randint(100, 999) if rng.random() > 0.1 else None,
            model_version=MODEL_VERSION,
            status=rng.choices(statuses, weights)[0],
            created_at=now - timedelta(seconds=rng.randint(60, DAYS_BACK * 24 * 3600)),
        )
        db.add(event)
        db.flush()
        actions = _history(event, operator, now)
        db.add_all(actions)
        summary.events += 1
        summary.actions += len(actions)


def seed(db: Session, now: datetime | None = None) -> SeedSummary:
    """Geliştirme verisini ekler (eksik olanları). Tek işlemde commit eder."""
    now = now or datetime.now(UTC)
    summary = SeedSummary()
    users = _seed_users(db, summary)
    cameras = _seed_cameras(db, summary)
    zones = _seed_zones(db, cameras, summary)
    _seed_events(db, cameras, zones, users["operator"], now, summary)
    db.commit()
    return summary


def main() -> None:
    with SessionLocal() as db:
        summary = seed(db)
    print(
        f"Eklendi: {summary.users} kullanıcı, {summary.cameras} kamera, {summary.zones} bölge, "
        f"{summary.events} olay, {summary.actions} durum kaydı."
    )
    for item in summary.skipped:
        print(f"Atlandı: {item}")
    if summary.users:
        print("Demo girişleri: admin / admin1234, operator / operator1234 (yalnızca geliştirme)")


if __name__ == "__main__":
    main()
