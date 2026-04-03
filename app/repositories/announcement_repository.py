from typing import cast
from uuid import UUID

from sqlalchemy import Row, func, or_
from sqlalchemy.orm import Session, aliased

from app.models.announcement_models import Announcement
from app.models.chat_models import Chatroom, JoinChat
from app.models.skill_models import CanTeach, Skill, Want
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

    def get_recommended_announcements(
        self, db: Session, target_user_id: UUID
    ) -> list[Row[tuple[Announcement, str, str, str]]]:
        WantSkill = aliased(Skill)
        TeachSkill = aliased(Skill)

        # [Step 1] 현재 유저의 WANT 스킬 벡터들 가져오기
        user_want_vectors = (
            db.query(Skill.name_embedding)
            .join(Want, Skill.id == Want.skill_id)
            .filter(Want.user_id == target_user_id)
            .all()
        )
        user_want_vectors = [v[0] for v in user_want_vectors if v[0] is not None]

        # [Step 2] 현재 유저의 CAN_TEACH 스킬 벡터들 가져오기
        user_can_teach_vectors = (
            db.query(Skill.name_embedding)
            .join(CanTeach, Skill.id == CanTeach.skill_id)
            .filter(CanTeach.user_id == target_user_id)
            .all()
        )
        user_can_teach_vectors = [
            v[0] for v in user_can_teach_vectors if v[0] is not None
        ]

        # [Step 3] 메인 쿼리 작성
        # 유저 스킬이 없을 경우를 대비해 기본 벡터 처리 (0점 처리용)
        if not user_want_vectors or not user_can_teach_vectors:
            return self.get_all_detail(
                db, target_user_id
            )  # 벡터 없으면 일반 조회로 fallback

        # 각 공고별로 유저 스킬셋과의 최소 거리를 계산하는 식 정의
        # pgvector의 <=> 연산자를 사용 (cosine_distance)

        # 1. 공고가 배우고 싶어하는 스킬 <-> 내가 가르칠 수 있는 스킬 중 최단거리
        dist_teach = func.least(
            *[
                WantSkill.name_embedding.cosine_distance(v)
                for v in user_can_teach_vectors
            ]
        ).label("dist_teach")

        # 2. 공고가 가르쳐줄 스킬 <-> 내가 배우고 싶은 스킬 중 최단거리
        dist_want = func.least(
            *[TeachSkill.name_embedding.cosine_distance(v) for v in user_want_vectors]
        ).label("dist_want")

        total_distance = (dist_teach + dist_want).label("total_distance")

        # [Step 4] 정렬 및 쿼리 실행
        results = (
            db.query(
                Announcement,
                WantSkill.name.label("want_to_skill_name"),
                TeachSkill.name.label("can_teach_name"),
                User.name.label("user_name"),
            )
            .join(WantSkill, Announcement.want_to_skill == WantSkill.id)
            .join(TeachSkill, Announcement.can_teach_skill == TeachSkill.id)
            .join(User, User.id == Announcement.user_id)
            .filter(
                Announcement.visible == True, Announcement.user_id != target_user_id
            )
            .order_by(
                total_distance.asc()  # 거리가 작은 순(유사한 순)으로 정렬
            )
            .all()
        )

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

    def get_my_details(
        self, db: Session, user_id: UUID
    ) -> list[Row[tuple[Announcement, str | None, str | None, str]]]:
        want_skill = aliased(Skill)
        teach_skill = aliased(Skill)

        return (
            db.query(
                Announcement,
                want_skill.name.label("want_to_skill_name"),
                teach_skill.name.label("can_teach_name"),
                User.name.label("user_name"),
            )
            .filter(Announcement.user_id == user_id)
            .outerjoin(want_skill, Announcement.want_to_skill == want_skill.id)
            .outerjoin(teach_skill, Announcement.can_teach_skill == teach_skill.id)
            .join(User, User.id == Announcement.user_id)
            .all()
        )  # type: ignore

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
