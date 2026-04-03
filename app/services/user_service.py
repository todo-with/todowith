import uuid
from sqlalchemy.orm import Session

from app.repositories.user_repository import UserRepository
from app.repositories.skill_repository import SkillRepository
from app.schemas.user_schema import EditMyProfileRequest, SearchUserProfileResponse


class UserService:
    def __init__(self, repo: UserRepository, skill_repo: SkillRepository):
        self.repo = repo
        self.skill_repo = skill_repo

    def get_user_profile(
        self, db: Session, user_id: uuid.UUID
    ) -> SearchUserProfileResponse | None:
        """유저 프로필 조회 (SearchUserProfile)"""
        user = self.repo.get_user_by_id(db, user_id)
        if user is None:
            return None

        # Skill 저장소에서 can_teach_skills, want_to_skills 조회
        can_teach_skills_obj = self.skill_repo.get_teaching_skills_by_user(db, user_id)
        want_to_skills_obj = self.skill_repo.get_learning_skills_by_user(db, user_id)

        can_teach_skills = [skill.name for skill in can_teach_skills_obj]
        want_to_skills = [skill.name for skill in want_to_skills_obj]

        return SearchUserProfileResponse(
            id=str(user.id),
            name=user.name, # type: ignore
            email=user.email, # type: ignore
            can_teach_skills=can_teach_skills, # type: ignore
            want_to_skills=want_to_skills, # type: ignore
            description=user.description, # type: ignore
        )

    def update_my_profile(
        self, db: Session, user_id: uuid.UUID, request: EditMyProfileRequest
    ) -> SearchUserProfileResponse | None:
        """내 정보 수정 (EditMyProfile)"""
        payload = request.model_dump()
        user = self.repo.update_user(db, user_id, payload)
        if user is None:
            return None

        # 업데이트된 유저의 프로필 반환
        return self.get_user_profile(db, user_id)
