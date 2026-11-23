from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ZoneRuleType

Coordinate = Annotated[float, Field(ge=0, le=1)]
Point = Annotated[list[Coordinate], Field(min_length=2, max_length=2, description="[x, y], 0–1 normalize")]
Polygon = Annotated[list[Point], Field(min_length=3, description="En az 3 nokta: [[x, y], ...]")]
ZoneName = Annotated[str, Field(min_length=1, max_length=100)]


class ZoneCreate(BaseModel):
    """`POST /api/zones` gövdesi. Polygon zorunlu."""

    camera_id: int
    name: ZoneName
    rule_type: ZoneRuleType
    polygon: Polygon


class ZoneUpdate(BaseModel):
    """Bölge kısmi güncelleme gövdesi. Gönderilmeyen alan değişmez; `null` kabul edilmez."""

    camera_id: int = Field(default=None)
    name: ZoneName = Field(default=None)
    rule_type: ZoneRuleType = Field(default=None)
    polygon: Polygon = Field(default=None)


class ZoneRead(BaseModel):
    """Bölge yanıtı."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    camera_id: int
    name: str
    polygon: list[list[float]]
    rule_type: ZoneRuleType
    is_active: bool
