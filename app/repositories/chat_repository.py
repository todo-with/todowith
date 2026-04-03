from datetime import datetime, timezone
from typing import List, Tuple
from uuid import UUID

from sqlalchemy import Row, and_, func
from sqlalchemy.orm import aliased
from sqlalchemy.orm import Session

from app.models.announcement_models import Announcement
from app.models.chat_models import ChatLog, Chatroom, JoinChat, MatchingRequest
from app.models.skill_models import Skill
from app.models.user_models import User


class ChatRepository:
    def get_my_chatrooms(
        self,
        db: Session,
        user_id: UUID,
    ) -> List[Row[Tuple[UUID, str, str, str, datetime, UUID, UUID | None]]]:
        me = aliased(JoinChat)
        opponent = aliased(User)

        opponent_user_id_subquery = (
            db.query(JoinChat.user_id)
            .filter(
                JoinChat.room_id == Chatroom.id,
                JoinChat.user_id != user_id,
            )
            .limit(1)
            .correlate(Chatroom)
            .scalar_subquery()
        )

        latest_message_subquery = (
            db.query(
                ChatLog.room_id.label("room_id"),
                func.max(ChatLog.timestamp).label("latest_timestamp"),
            )
            .group_by(ChatLog.room_id)
            .subquery()
        )

        can_teach_skill = aliased(Skill)
        want_to_skill = aliased(Skill)

        return (
            db.query(
                Chatroom.id.label("room_id"),
                func.coalesce(opponent.name, "").label("opponent_name"),
                func.coalesce(Chatroom.name, "").label("name"),
                func.coalesce(ChatLog.content, "").label("last_message"),
                func.coalesce(
                    latest_message_subquery.c.latest_timestamp,
                    datetime.now(timezone.utc),
                ).label("updated_at"),
                Chatroom.announcement_id.label("announcement_id"),
                Chatroom.matching_id.label("matching_id"),
                Announcement.user_id.label("announcement_user_id"),
                can_teach_skill.name.label("can_teach_skill_name"),
                want_to_skill.name.label("want_to_skill_name"),
            )
            .join(me, me.room_id == Chatroom.id)
            .outerjoin(opponent, opponent.id == opponent_user_id_subquery)
            .outerjoin(
                latest_message_subquery,
                latest_message_subquery.c.room_id == Chatroom.id,
            )
            .outerjoin(
                ChatLog,
                and_(
                    ChatLog.room_id == Chatroom.id,
                    ChatLog.timestamp == latest_message_subquery.c.latest_timestamp,
                ),
            )
            .outerjoin(Announcement, Announcement.id == Chatroom.announcement_id)
            .outerjoin(can_teach_skill, can_teach_skill.id == Announcement.can_teach_skill)
            .outerjoin(want_to_skill, want_to_skill.id == Announcement.want_to_skill)
            .filter(me.user_id == user_id)
            .order_by(
                func.coalesce(
                    latest_message_subquery.c.latest_timestamp,
                    datetime.now(timezone.utc),
                ).desc()
            )
            .all()
        )

    def check_matching_exists(self, db: Session, room_id: UUID) -> bool:
        return (
            db.query(Chatroom)
            .filter(Chatroom.id == room_id, Chatroom.matching_id.isnot(None))
            .first()
            is not None
        )

    def get_chat_logs(
        self,
        db: Session,
        room_id: UUID,
        last_message_id: UUID | None = None,
        limit: int = 50,
    ) -> List[Row[Tuple[ChatLog, str]]]:
        query = (
            db.query(ChatLog, User.name.label("sender_name"))
            .filter(ChatLog.room_id == room_id)
            .join(User, User.id == ChatLog.author_id)
        )
        if last_message_id is not None:
            cursor_log = (
                db.query(ChatLog.timestamp)
                .filter(
                    ChatLog.room_id == room_id,
                    ChatLog.id == last_message_id,
                )
                .first()
            )
            if cursor_log is not None:
                query = query.filter(ChatLog.timestamp < cursor_log.timestamp)

        logs = (
            query.order_by(ChatLog.timestamp.desc(), ChatLog.id.desc())
            .limit(limit)
            .all()
        )
        logs.reverse()
        return logs

    def get_received_matching_requests(
        self,
        db: Session,
        user_id: UUID,
    ) -> list[MatchingRequest]:
        return (
            db.query(MatchingRequest)
            .filter(MatchingRequest.to_user_id == user_id)
            .all()
        )

    def get_sent_matching_requests(
        self,
        db: Session,
        user_id: UUID,
    ) -> list[MatchingRequest]:
        return (
            db.query(MatchingRequest)
            .filter(MatchingRequest.from_user_id == user_id)
            .all()
        )

    def create_chatroom(
        self,
        db: Session,
        announcement_id: UUID,
        participant_user_id: UUID,
        name: str,
    ) -> Chatroom | None:
        announcement = (
            db.query(Announcement).filter(Announcement.id == announcement_id).first()
        )
        if announcement is None:
            return None

        chatroom = Chatroom(
            name=name,
            matching_id=None,
            announcement_id=announcement_id,
            user_id=announcement.user_id,
        )
        db.add(chatroom)
        db.flush()

        participant_ids = {participant_user_id, announcement.user_id}
        for user_id in participant_ids:
            if user_id is None:
                continue
            db.add(JoinChat(user_id=user_id, room_id=chatroom.id))

        db.commit()
        db.refresh(chatroom)
        return chatroom

    def create_chat_log(
        self,
        db: Session,
        room_id: UUID,
        author_id: UUID,
        content: str,
        timestamp: datetime | None = None,
    ) -> ChatLog:
        chat_log = ChatLog(
            room_id=room_id,
            author_id=author_id,
            content=content,
            timestamp=timestamp or datetime.now(timezone.utc),
            read=False,
        )
        db.add(chat_log)
        db.commit()
        db.refresh(chat_log)
        return chat_log

    def create_matching_request(
        self,
        db: Session,
        from_user_id: UUID,
        room_id: UUID,
    ) -> MatchingRequest | None:
        room = db.query(Chatroom).filter(Chatroom.id == room_id).first()
        if room is None:
            return None

        opponent_row = (
            db.query(JoinChat.user_id)
            .filter(JoinChat.room_id == room_id, JoinChat.user_id != from_user_id)
            .first()
        )
        to_user_id = opponent_row[0] if opponent_row is not None else None

        if to_user_id is None:
            return None

        existing_request = (
            db.query(MatchingRequest)
            .filter(
                MatchingRequest.from_user_id == from_user_id,
                MatchingRequest.to_user_id == to_user_id,
                MatchingRequest.room_id == room_id,
            )
            .first()
        )
        if existing_request is not None:
            return existing_request

        matching_request = MatchingRequest(
            from_user_id=from_user_id,
            to_user_id=to_user_id,
            room_id=room_id,
        )
        db.add(matching_request)
        db.commit()
        db.refresh(matching_request)
        return matching_request

    def update_chatroom_name(
        self,
        db: Session,
        room_id: UUID,
        name: str,
    ) -> Chatroom | None:
        chatroom = db.query(Chatroom).filter(Chatroom.id == room_id).first()
        if chatroom is None:
            return None

        chatroom.name = name  # type: ignore
        db.commit()
        db.refresh(chatroom)
        return chatroom

    def mark_messages_as_read(self, db: Session, room_id: UUID, user_id: UUID) -> int:
        logs = (
            db.query(ChatLog)
            .filter(
                ChatLog.room_id == room_id,
                ChatLog.author_id != user_id,
                ChatLog.read.is_(False),
            )
            .all()
        )

        for log in logs:
            log.read = True  # type: ignore

        db.commit()
        return len(logs)
