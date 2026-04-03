from uuid import UUID
import uuid
from sqlalchemy.orm import Session
from app.repositories.todo_repository import TodoRepository
from app.models import (
    Task,
    Teach,
    Skill,
    Matching,
    Chatroom,
)  # 👈 이 줄을 꼭 추가해야 합니다!
from fastapi import HTTPException
from datetime import datetime

from app.schemas.todo_schema import ToDoCandidate
from app.services.ai_service import AiService


class TodoService:
    def __init__(self, repo: TodoRepository):
        self.repo: TodoRepository = repo

    # [내 투두 조회]
    def get_my_tasks(self, db: Session, user_id: UUID):
        return self.repo.get_todos_by_user(db, user_id)

    # [상대방 투두 조회]
    # matching_id와 상대방 user_id(opponent_id)가 필요합니다.
    def get_opponent_tasks_automatically(
        self, db: Session, matching_id: UUID, my_id: UUID
    ):
        opponent = (
            db.query(Teach)
            .filter(Teach.matching_id == matching_id, Teach.teacher_id != my_id)
            .first()
        )

        if not opponent:
            return []

        # 2. 상대방의 Task들 가져오기
        tasks = (
            db.query(Task)
            .filter(
                Task.matching_id == matching_id, Task.user_id == opponent.teacher_id
            )
            .all()
        )

        # 3. 각 Task에 Skill 이름과 Matching 이름을 수동으로 붙여주기
        from app.models.skill_models import Skill  # 필요한 모델들 임포트
        from app.models.matching_models import Matching  # Matching 모델 이름 확인 필요!

        for t in tasks:
            # DB에서 직접 스킬 이름 찾기
            skill_obj = db.query(Skill).filter(Skill.id == t.skill_id).first()
            t.skill_name = skill_obj.name if skill_obj else "Unknown"

            # DB에서 직접 매칭방 이름 찾기
            match_obj = db.query(Matching).filter(Matching.id == t.matching_id).first()
            t.matching_name = match_obj.name if match_obj else "알 수 없는 방"

        return tasks

    # [투두 완료 상태 업데이트]
    def update_todo_status(
        self, db: Session, task_id: UUID, is_completed: bool, user_id: UUID
    ):
        return self.repo.update_todo_status(db, task_id, is_completed, user_id)

    # [후보군 채택 시 - Task 생성]
    def create_todo_from_candidate(
        self, db: Session, user_id: UUID, matching_id: UUID, skill, task_name: str
    ):
        # Task 생성 (user_id 포함)
        skill_obj = db.query(Skill).filter(Skill.name == skill).first()
        if not skill_obj:
            raise HTTPException(
                status_code=400, detail=f"'{skill}'이라는 스킬을 찾을 수 없습니다."
            )

        # 2. 찾은 스킬의 진짜 ID(UUID)를 레포지토리에 넘겨줍니다.
        return self.repo.create_task(
            db,
            user_id=user_id,
            name=task_name,
            skill=skill_obj.id,  # 👈 여기서 ID로 변환!
            matching_id=matching_id,
        )

    # [후보군 조회]
    def get_candidates(self, db: Session, chatroom_id: UUID):
        return self.repo.get_generated_todos_by_chatroom(db, chatroom_id)

    def delete_todo(self, db: Session, todo_id: UUID, user_id: UUID):
        # 레포지토리에 있는 삭제 기능을 호출합니다.
        return self.repo.delete_task(db, todo_id, user_id)

    def delete_generated_todo_by_id(self, db: Session, generated_todo_id: UUID) -> bool:
        return self.repo.delete_generated_todo_by_id(db, generated_todo_id)

    def get_todo_candidates(self, db: Session, room_id: str):
        # 레포지토리에서 데이터를 긁어옵니다.
        tasks = self.repo.get_tasks_by_room(db, room_id)

        # API 명세에 맞는 형식(id, name, skill)으로 변환해서 리스트로 만듭니다.
        return [
            {"id": str(t.skill_id), "name": t.name, "skill": str(t.skill_id)}
            for t in tasks
        ]

    def create_candidate_todo(
        self, db: Session, room_id: str, service: AiService
    ) -> list[ToDoCandidate]:

        announcement = self.repo.get_announcement_by_room(db, room_id)
        if not announcement:
            raise ValueError("해당 방에 연결된 공고를 찾을 수 없습니다.")
        skills = self.repo.get_skills_by_announcement(db, announcement.id)  # type: ignore
        skill_names = [s.name for s in skills]  # type: ignore
        name_to_id = {s.name: str(s.id) for s in skills}  # type: ignore

        # TODO: 투두 후보군 만드는 로직 들어가야함
        generated = service.create_todo_by_ai(db, UUID(room_id))

        candidates = [
            ToDoCandidate(id=str(uuid.uuid4()), name=item.name, skill=item.skill)
            for item in generated
        ]

        for candidate in candidates:
            self.repo.create_generated_todo(
                db,
                UUID(room_id),
                candidate.name,
                UUID(name_to_id.get(candidate.skill)), # type: ignore
                datetime.utcnow(),
                UUID(candidate.id),
            )  # type: ignore
        return candidates

    def get_tasks_by_room(self, db: Session, room_id: str):
        from app.models.todo_models import Task  # Task 모델 위치에 맞게 수정 필요

        # DB에서 matching_id가 room_id와 일치하는 모든 Task를 가져옵니다.
        return db.query(Task).filter(Task.matching_id == room_id).all()

    def select_candidate_to_task(self, db, user_id, target_id):
        # 1. 후보 테이블에서 해당 ID 데이터를 찾음
        candidate = self.repo.get_candidate_by_id(db, target_id)
        if not candidate:
            raise HTTPException(status_code=404, detail="후보를 찾을 수 없습니다.")
        matching_row = (
            db.query(Matching.id)
            .join(Chatroom, Matching.id == Chatroom.matching_id)
            .filter(Chatroom.id == candidate.chatroom_id)
            .first()
        )

        if matching_row is None:
            raise HTTPException(
                status_code=404, detail="해당 후보가 속한 매칭을 찾을 수 없습니다."
            )

        matching_id = matching_row[0]

        # 2. 찾은 정보를 진짜 TASK 테이블로 복사해서 저장
        # matching_id는 candidate가 가지고 있는 걸 그대로 씁니다.
        new_task = self.repo.create_task(
            db,
            user_id=user_id,
            name=candidate.name,  # type: ignore
            skill=candidate.skill_id,
            matching_id=matching_id,
        )
        # 3. 후보 테이블에서는 해당 데이터 삭제
        self.repo.delete_generated_todo_by_id(db, candidate.id)  # type: ignore
        return new_task
