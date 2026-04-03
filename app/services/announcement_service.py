from uuid import UUID

from sqlalchemy.orm import Session

from app.models.announcement_models import Announcement
from app.repositories.announcement_repository import AnnouncementRepository
from app.schemas.announcement_schema import (
    AnnounceItem,
    CreateAnnounceRequest,
    EditAnnounceRequest,
    EditAnnounceResponse,
    ViewDetailAnnounceResponse,
)


class AnnouncementService:
    def __init__(self, repo: AnnouncementRepository):
        self.repo = repo

    def create_announcement(
        self, db: Session, payload: CreateAnnounceRequest, user_id: str
    ) -> Announcement:
        payload_dict = payload.model_dump()

        want_to_skill_name = payload_dict.pop("want_to_skill")
        can_teach_skill_name = payload_dict.pop("can_teach_skill")
        want_to_skill_id = self.repo.skill_name_to_id(db, want_to_skill_name)
        can_teach_skill_id = self.repo.skill_name_to_id(db, can_teach_skill_name)
        if want_to_skill_id is None or can_teach_skill_id is None:
            raise ValueError("Invalid skill name")

        return self.repo.create(
            db,
            {
                "want_to_skill": str(want_to_skill_id),
                "can_teach_skill": str(can_teach_skill_id),
                "want_to_message": payload_dict.pop("want_to_message"),
                "can_teach_message": payload_dict.pop("can_teach_message"),
                "user_id": user_id,
                "want_to_difficulty": payload_dict.pop("want_to_difficulty"),
                "can_teach_difficulty": payload_dict.pop("can_teach_difficulty"),
            },
        )

    def get_all_announcements(
        self, db: Session, current_user_id: UUID, keyword: str | None = None
    ) -> list[AnnounceItem]:
        res = self.repo.get_all_detail(db, current_user_id, keyword)
        if not res:
            return []
        return [
            AnnounceItem(
                id=str(announcement.id),
                username=user_name,
                user_id=str(announcement.user_id),
                want_to_skill=want_to,
                can_teach_skill=can_teach,
            )
            for announcement, want_to, can_teach, user_name in res
        ]

    def get_detail_announcement(
        self, db: Session, announcement_id
    ) -> ViewDetailAnnounceResponse:
        res = self.repo.get_by_id_detail(db, announcement_id)
        if not res:
            raise ValueError("Invalid announcement id")
        announcement, want_to, can_teach, username = res

        if want_to is None or can_teach is None:
            raise ValueError("Invalid announcement skill mapping")

        return ViewDetailAnnounceResponse(
            id=str(announcement.id),
            username=username,
            user_id=str(announcement.user_id),
            want_to_skill=want_to,
            can_teach_skill=can_teach,
            want_to_message=announcement.want_to_message,
            can_teach_message=announcement.can_teach_message,
            want_to_difficulty=announcement.want_to_difficulty,
            can_teach_difficulty=announcement.can_teach_difficulty,
        )

    def update_announcement(
        self,
        db: Session,
        user_id: str,
        announcement_id: str,
        payload: EditAnnounceRequest,
    ):
        payload_dict = payload.model_dump(exclude_none=True)

        if "want_to_skill" in payload_dict:
            want_to_skill_id = self.repo.skill_name_to_id(
                db, payload_dict["want_to_skill"]
            )
            if want_to_skill_id is None:
                raise ValueError("Invalid skill name")
            payload_dict["want_to_skill"] = want_to_skill_id

        if "can_teach_skill" in payload_dict:
            can_teach_skill_id = self.repo.skill_name_to_id(
                db, payload_dict["can_teach_skill"]
            )
            if can_teach_skill_id is None:
                raise ValueError("Invalid skill name")
            payload_dict["can_teach_skill"] = can_teach_skill_id

        announcement = self.repo.get_by_id(db, UUID(announcement_id))
        if not announcement:
            raise ValueError("Invalid announcement id")

        if str(announcement.user_id).strip() != str(user_id).strip():
            raise ValueError("Invalid user id")

        want_skill_name, can_teach_skill_name = self.repo.update(
            db, announcement, payload_dict
        )

        return EditAnnounceResponse(
            id=str(announcement.id),
            user_id=str(user_id),
            want_to_skill=want_skill_name,
            can_teach_skill=can_teach_skill_name,
            want_to_message=announcement.want_to_message,  # type: ignore
            can_teach_message=announcement.can_teach_message,  # type: ignore
            want_to_difficulty=announcement.want_to_difficulty,  # type: ignore
            can_teach_difficulty=announcement.can_teach_difficulty,  # type: ignore
        )
