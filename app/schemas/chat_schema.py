from enum import Enum

from pydantic import BaseModel
from typing import Optional
from uuid import UUID


# Response Models
class ChatRoomInfo(BaseModel):
    room_id: UUID
    opponent_name: str
    name: str
    last_message: str
    updated_at: str
    announcement_id: str
    matching_id: str|None



class ChatLogResponse(BaseModel):
    sender_name: str
    content: str
    timestamp: str
    read: bool
    message_id: str


class CreateRoomRequest(BaseModel):
    announcement_id: UUID
    name: str


class CreateRoomResponse(BaseModel):
    room_id: UUID


class WSMessageType(str, Enum):
    JOIN_CHAT = "JOIN_CHAT"
    REQUEST_MATCHING = "REQUEST_MATCHING"
    REPLY_MATCHING = "REPLY_MATCHING"
    SEND_MESSAGE = "SEND_MESSAGE"
    RECV_MESSAGE = "RECV_MESSAGE"
    RECEIVE_MATCHING = "RECEIVE_MATCHING"


class WSSubscribeMessage(BaseModel):
    type: WSMessageType = WSMessageType.JOIN_CHAT
    user_id: Optional[UUID] = None
    room_id: UUID


class WSSendMessage(BaseModel):
    type: WSMessageType = WSMessageType.SEND_MESSAGE
    user_id: Optional[UUID] = None
    room_id: UUID
    content: str
    chat_log_id: Optional[UUID] = None
    timestamp: Optional[str] = None


# 클라이언트에서 매칭 요청을 보낼 때와 서버에서 매칭 요청을 클라이언트에게 전달할 때 모두 사용할 수 있는 메시지 모델
class WSRequestMatchingMessage(BaseModel):
    type: WSMessageType = WSMessageType.REQUEST_MATCHING
    user_id: Optional[UUID] = None
    to_user_id: UUID
    room_id: UUID
    matching_request_id: Optional[UUID] = (
        None  # 클라이언트가 매칭 요청을 보낼 때는 포함하지 않고 클라이언트에게 만들어진 요청을 전달할 때는 포함
    )


# 매칭 요청에 대한 답변이 발생했을 때 보낸 사람과 받는 사람 모두에게 전달할 메시지 모델
# 클라이언트의 응답은 POST로 따로 전달됨, 클라이언트가 받기만 하는 메시지 모델
class WSReplyMatchingMessage(BaseModel):
    type: WSMessageType = WSMessageType.REPLY_MATCHING
    user_id: UUID
    to_user_id: UUID
    matching_id: Optional[UUID] = None
    accept: bool
