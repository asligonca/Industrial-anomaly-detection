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


class ZoneRuleType(StrEnum):
    restricted = "restricted"
    ppe_helmet_vest = "ppe_helmet_vest"
    ppe_helmet = "ppe_helmet"
    ppe_vest = "ppe_vest"
    forklift_proximity = "forklift_proximity"
    smoke_fire = "smoke_fire"
    person_near_equipment = "person_near_equipment"
