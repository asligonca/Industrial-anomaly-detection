from enum import StrEnum


class UserRole(StrEnum):
    admin = "admin"
    operator = "operator"


class EventStatus(StrEnum):
    new = "new"
    reviewing = "reviewing"
    confirmed = "confirmed"
    false_alarm = "false_alarm"


class EventSeverity(StrEnum):
    critical = "critical"
    high = "high"
    medium = "medium"
    info = "info"


class EventType(StrEnum):
    no_helmet = "no_helmet"
    no_vest = "no_vest"
    restricted_zone = "restricted_zone"



EVENT_TYPE_SEVERITY: dict[EventType, EventSeverity] = {
    EventType.restricted_zone: EventSeverity.critical,
    EventType.no_helmet: EventSeverity.high,
    EventType.no_vest: EventSeverity.medium,
}


EVENT_STATUS_TRANSITIONS: dict[EventStatus, frozenset[EventStatus]] = {
    EventStatus.new: frozenset(
        {EventStatus.reviewing, EventStatus.confirmed, EventStatus.false_alarm}
    ),
    EventStatus.reviewing: frozenset(
        {EventStatus.new, EventStatus.confirmed, EventStatus.false_alarm}
    ),
    EventStatus.confirmed: frozenset({EventStatus.reviewing}),
    EventStatus.false_alarm: frozenset({EventStatus.reviewing}),
}
"""İzin verilen olay durumu geçişleri; listede olmayan (aynı duruma geçiş dahil) 409."""


class AuditAction(StrEnum):
    """Denetim kaydı işlem kodları. DB'de düz metin; yeni kod migration gerektirmez."""

    user_login = "user.login"
    user_created = "user.created"
    event_status_changed = "event.status_changed"
    camera_created = "camera.created"
    camera_updated = "camera.updated"
    camera_activated = "camera.activated"
    camera_deactivated = "camera.deactivated"
    zone_created = "zone.created"
    zone_deactivated = "zone.deactivated"


class AuditTargetType(StrEnum):
    """Denetim kaydının hedef türü. DB'de düz metin."""

    user = "user"
    event = "event"
    camera = "camera"
    zone = "zone"


class ZoneRuleType(StrEnum):
    restricted = "restricted"
    ppe_helmet_vest = "ppe_helmet_vest"
    ppe_helmet = "ppe_helmet"
    ppe_vest = "ppe_vest"
    forklift_proximity = "forklift_proximity"
    smoke_fire = "smoke_fire"
    person_near_equipment = "person_near_equipment"
