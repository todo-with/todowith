from datetime import datetime
import uuid
from sqlalchemy.orm import Session, aliased
from app.models.announcement_models import Announcement
from app.models.chat_models import Chatroom
from app.models.matching_models import Matching
from app.models.skill_models import Skill
from app.models.todo_models import Task, GeneratedTodo


class TodoRepository:
    # 용도: 유저가 참여 중인 모든 매칭을 통틀어 "그 유저가 할 모든 일"을 리스트로 가져올 때 사용 (전체 대시보드용)
    def get_todos_by_user(self, db: Session, user_id: uuid.UUID):
        return (
            db.query(Task, Matching.name)
            .filter(Task.user_id == user_id)
            .join(Matching, Task.matching_id == Matching.id)
            .all()
        )

    # 용도: 특정 매칭 방 안에서 "나" 또는 "상대방"의 투두 리스트만 쏙 골라올 때 사용 (매칭 상세 페이지용)
    def get_todos_by_matching_user(
        self, db: Session, matching_id: uuid.UUID, user_id: uuid.UUID
    ):
        return (
            db.query(Task)
            .filter(Task.matching_id == matching_id, Task.user_id == user_id)
            .all()
        )

    # 용도: 실제 투두의 '내용'이 담긴 본체(Task)를 생성할 때 사용
    def create_task(
        self, db: Session, user_id: uuid.UUID, name: str, skill, matching_id: uuid.UUID
    ):
        db_task = Task(
            id=uuid.uuid4(),
            user_id=user_id,
            name=name,
            skill_id=skill,
            matching_id=matching_id,
            is_completed=False,
        )
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return db_task

    # 용도: 화면에서 체크박스를 눌렀을 때, '완료' 또는 '미완료' 상태를 DB에 반영할 때 사용
    def update_todo_status(
        self, db: Session, task_id: uuid.UUID, is_completed: bool, user_id: uuid.UUID
    ):
        task = (
            db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
        )

        if task is None:
            raise ValueError("해당 투두를 찾을 수 없습니다.")

        if task:
            task.is_completed = is_completed  # type: ignore
            db.commit()
            db.refresh(task)
        return task

    # 용도: 채팅 로그 분석 결과로 나온 '추천 커리큘럼'들을 임시 저장소에 쌓아둘 때 사용
    def create_generated_todo(
        self,
        db: Session,
        chatroom_id: uuid.UUID,
        content: str,
        skill_id: uuid.UUID,
        created_at: datetime,
        gen_todo_id: uuid.UUID,
    ):
        db_gen = GeneratedTodo(
            id=gen_todo_id,
            chatroom_id=chatroom_id,
            name=content,
            skill_id=skill_id,
            created_at=created_at,
        )

        db.add(db_gen)
        db.commit()
        db.refresh(db_gen)
        return db_gen

    # 용도: 사용자가 매칭 방에 들어왔을 때, 아직 채택되지 않은 '추천 투두 목록'을 보여줄 때 사용
    def get_generated_todos_by_chatroom(self, db: Session, chatroom_id: uuid.UUID):
        return (
            db.query(GeneratedTodo, Skill.name.label("skill_name"))
            .filter(GeneratedTodo.chatroom_id == chatroom_id)
            .join(Skill, GeneratedTodo.skill_id == Skill.id)
            .all()
        )

    # 용도: 사용자가 추천 후보를 채택하여 실제 투두로 옮겼거나, 추천 목록을 거절/초기화할 때 임시 데이터를 비우기 위해 사용
    def delete_generated_todo(self, db: Session, chatroom_id: uuid.UUID):
        db.query(GeneratedTodo).filter(
            GeneratedTodo.chatroom_id == chatroom_id
        ).delete()
        db.commit()

    def delete_generated_todo_by_id(self, db: Session, target_id: uuid.UUID):
        gen_todo = db.query(GeneratedTodo).filter(GeneratedTodo.id == target_id).first()
        if gen_todo:
            db.delete(gen_todo)
            db.commit()
            # Explicitly return True if deletion was successful
            return True
        return False

    def delete_task(self, db: Session, todo_id: uuid.UUID, user_id: uuid.UUID):
        task = (
            db.query(Task).filter(Task.id == todo_id, Task.user_id == user_id).first()
        )
        if task:
            db.delete(task)
            db.commit()
            return True
        return False

    def get_announcement_by_room(self, db: Session, room_id: str):
        from app.models.announcement_models import Announcement

        return (
            db.query(Announcement)
            .join(Chatroom, Chatroom.announcement_id == Announcement.id)
            .filter(Chatroom.id == room_id)
            .first()
        )

    # 기존 코드들 사이에 추가
    def get_tasks_by_room(self, db: Session, room_id: str):
        from app.models.todo_models import (
            GeneratedTodo,
        )  # 모델 이름이 다를 수 있으니 확인!

        # 해당 채팅방(room_id)에 연결된 생성된 투두 후보들을 가져옵니다.
        return (
            db.query(GeneratedTodo).filter(GeneratedTodo.chatroom_id == room_id).all()
        )

    def get_candidate_by_id(self, db: Session, target_id: str):
        from app.models.todo_models import GeneratedTodo

        return db.query(GeneratedTodo).filter(GeneratedTodo.id == target_id).first()

    def get_skills_by_announcement(
        self, db: Session, announcement_id: uuid.UUID
    ) -> list[Skill]:
        from app.models.skill_models import Skill

        announcement = (
            db.query(Announcement).filter(Announcement.id == announcement_id).first()
        )
        if not announcement:
            raise ValueError("해당 공고를 찾을 수 없습니다.")

        return [
            s
            for s in db.query(Skill)
            .filter(
                Skill.id.in_((announcement.want_to_skill, announcement.can_teach_skill))
            )
            .all()
        ]  # type: ignore
