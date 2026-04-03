from typing import cast
from uuid import UUID

from sqlalchemy import Row, or_
from sqlalchemy.orm import Session, aliased

from app.models.announcement_models import Announcement
from app.models.chat_models import Chatroom, JoinChat
from app.models.skill_models import Skill
from app.models.user_models import User


class AnnouncementRepository:
    def get_all_detail(
        self, db: Session, excluded_user_id: UUID, keyword: str | None = None
    ) -> list[Row[tuple[Announcement, str, str, str]]]:
        """

        :param db
        :return list[(Announcement, want_skill_name, can_teach_skill_name, user_name)]
        """
        want_skill = aliased(Skill)
        teach_skill = aliased(Skill)

        joined_announcement_ids = (
            db.query(Chatroom.announcement_id)
            .join(JoinChat, JoinChat.room_id == Chatroom.id)
            .filter(
                JoinChat.user_id == excluded_user_id,
                Chatroom.announcement_id.isnot(None),
            )
            .distinct()
        )

        query = (
            db.query(
                Announcement,
                want_skill.name.label("want_to_skill_name"),
                teach_skill.name.label("can_teach_name"),
                User.name.label("user_name"),
            )
            .filter(Announcement.visible == True)
            .filter(Announcement.user_id != excluded_user_id)
            .filter(~Announcement.id.in_(joined_announcement_ids))
            .join(want_skill, Announcement.want_to_skill == want_skill.id)
            .join(teach_skill, Announcement.can_teach_skill == teach_skill.id)
            .join(User, User.id == Announcement.user_id)
        )

        normalized_keyword = keyword.strip() if keyword else ""
        if normalized_keyword:
            like_keyword = f"%{normalized_keyword}%"
            query = query.filter(
                or_(
                    want_skill.name.ilike(like_keyword),
                    teach_skill.name.ilike(like_keyword),
                )
            )

        results = query.all()
        return results

    def get_by_id_detail(
        self, db: Session, announcement_id: UUID
    ) -> Row[tuple[Announcement, str | None, str | None, str]] | None:
        """

        :param db, announcement_id: UUID
        :return (Announcement, want_skill_name, can_teach_skill_name, user_name)
        """
        want_skill = aliased(Skill)
        teach_skill = aliased(Skill)

        result = (
            db.query(
                Announcement,
                want_skill.name.label("want_to_skill_name"),
                teach_skill.name.label("can_teach_name"),
                User.name.label("user_name"),
            )
            .filter(Announcement.id == announcement_id)
            .outerjoin(want_skill, Announcement.want_to_skill == want_skill.id)
            .outerjoin(teach_skill, Announcement.can_teach_skill == teach_skill.id)
            .join(User, User.id == Announcement.user_id)
            .first()
        )

        return result  # type: ignore

    def get_by_id(self, db: Session, announcement_id: UUID) -> Announcement | None:
        result = (
            db.query(Announcement).filter(Announcement.id == announcement_id).first()
        )
        return cast(Announcement | None, result)

    def create(self, db: Session, payload: dict):
        announcement = Announcement(**payload)
        db.add(announcement)
        db.commit()
        db.refresh(announcement)
        return announcement

    def update(
        self, db: Session, announcement: Announcement, payload: dict
    ) -> tuple[str, str]:
        for key, value in payload.items():
            if hasattr(announcement, key) and value is not None:
                setattr(announcement, key, value)

        db.commit()
        db.refresh(announcement)

        res = self.get_by_id_detail(db, announcement.id)  # type:ignore
        if not res:
            raise ValueError(f"Announcement with id {announcement.id} does not exist")

        _, want_skill_name, can_teach_skill_name, _ = res
        if want_skill_name is None or can_teach_skill_name is None:
            raise ValueError("Invalid announcement skill mapping")

        return want_skill_name, can_teach_skill_name

    def delete(self, db: Session, announcement: Announcement):
        db.delete(announcement)
        db.commit()

    def skill_name_to_id(self, db: Session, skill_name: str) -> UUID | None:
        skill = db.query(Skill).filter(Skill.name == skill_name).first()
        return skill.id if skill else None  # type: ignore
