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


class ZoneRuleType(StrEnum):
    restricted = "restricted"
    ppe_helmet_vest = "ppe_helmet_vest"
    ppe_helmet = "ppe_helmet"
    ppe_vest = "ppe_vest"
    forklift_proximity = "forklift_proximity"
    smoke_fire = "smoke_fire"
    person_near_equipment = "person_near_equipment"
