from typing import List, Literal, Optional

from pydantic import BaseModel


# Response Models
class MatchingItem(BaseModel):
    matching_id: str
    name: str
    teaching_skill: str
    learning_skill: str
    status: str


class ViewMyMatchingListResponse(BaseModel):
    items: List[MatchingItem]


class ViewDetailMatchingResponse(BaseModel):
    opponent_name: str
    teaching_skill: str
    learning_skill: str
    opponent_id: str
    status: str  # 내 교습 상태 (ACTIVE/COMPLETED)
    is_all_completed: bool  # 전체 매칭 완료 여부


class AcceptMatchingRequest(BaseModel):
    accept: bool


class SentMatchingRequest(BaseModel):
    """보낸 매칭 요청 아이템"""

    matching_request_id: str
    opponent_name: str
    room_id: str


class ReceivedMatchingRequest(BaseModel):
    """받은 매칭 요청 아이템"""

    matching_request_id: str
    opponent_name: str
    room_id: str


class MatchingRequestsResponse(BaseModel):
    """/matching/requests 응답 전체 모델"""

    send: List[SentMatchingRequest]
    receive: List[ReceivedMatchingRequest]


class UpdateMatchingRequest(BaseModel):
    name: Optional[str] = None
    status: Optional[Literal["ACTIVE", "ACTIVATE", "COMPLETED"]] = None


class UpdateMatchingResponse(BaseModel):
    name: str
    matching_status: bool
