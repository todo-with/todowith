from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.core.dependencies import get_ai_service, get_todo_service
from app.core.verify_jwt import get_current_user_id

from app.dependencies.database import get_db
from app.repositories.todo_repository import TodoRepository
from app.services.ai_service import AiService
from app.services.todo_service import TodoService
from app.schemas.todo_schema import (
    CreateToDoRequest,
    UpdateToDoRequest,
    ViewMyToDoResponse,
    ViewToDoCandidateResponse,
    CreateToDoCandidateRequest,
    ToDoCandidate,
    SelectTodoCandidateRequest,
)

router = APIRouter(
    prefix="/todo",
    tags=["todo"],
)

# 테스트용 고정 UUID (나중에 로그인 기능 완성 시 삭제)
TEST_USER_ID = UUID("123e4567-e89b-12d3-a456-426614174000")

# ---------------------------------------------------------
# 1. 일반 Todo 관리 (조회, 생성, 업데이트)
# ---------------------------------------------------------


@router.get("/my-tasks", response_model=ViewMyToDoResponse)
def get_my_tasks(
    db: Session = Depends(get_db),
    service: TodoService = Depends(get_todo_service),
    user_id: UUID = Depends(get_current_user_id),
):
    """
    용도: 현재 로그인한 유저의 모든 할 일 목록을 조회합니다.
    화면: '나의 TODO' 탭 리스트업
    """
    tasks = service.get_my_tasks(db, user_id)
    # Schema에 정의된 리스트 구조로 변환하여 반환
    return {
        "items": [
            {
                "todo_id": str(t.id),
                "name": t.name,
                "skill": t.skill.name,
                "is_completed": t.is_completed,
                "matching_id": str(t.matching_id),
                "matching_name": str(matching_name),
            }
            for t, matching_name in tasks
        ]
    }


@router.post("", status_code=201)
def create_todo(
    request: CreateToDoRequest,
    db: Session = Depends(get_db),
    service: TodoService = Depends(get_todo_service),
    user_id: UUID = Depends(get_current_user_id),
):
    """
    용도: 새로운 할 일을 직접 생성하거나 후보군에서 선택하여 등록합니다.
    로직: Task 생성 -> Todo 생성 순으로 진행됩니다.
    """
    return service.create_todo_from_candidate(
        db,
        user_id=UUID(request.user_id),
        matching_id=UUID(request.matching_id),
        skill=request.skill,
        task_name=request.name,
    )


@router.patch("/{task_id}")
def update_todo(
    task_id: UUID,
    request: UpdateToDoRequest,
    db: Session = Depends(get_db),
    service: TodoService = Depends(get_todo_service),
    user_id: UUID = Depends(get_current_user_id),
):
    """
    용도: 할 일의 완료 상태(체크박스)를 업데이트합니다.
    """
    # 2. 서비스에서 업데이트된 객체를 받아옵니다.
    try:
        updated_task = service.update_todo_status(
            db, task_id, request.is_completed, user_id
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # 3. 요구하신 형식대로 딕셔너리를 만들어서 반환합니다.
    return {
        "todo_id": str(updated_task.id),
        "name": updated_task.name,
        "is_completed": updated_task.is_completed,
    }


@router.get("/{matching_id}/opponent-tasks", response_model=ViewMyToDoResponse)
def get_opponent_tasks(
    matching_id: UUID,
    db: Session = Depends(get_db),
    service: TodoService = Depends(get_todo_service),
    user_id: UUID = Depends(get_current_user_id),
):
    """
    용도: 매칭된 상대방의 투두 목록을 조회합니다.
    화면: '상대의 TODO' 탭 리스트업
    """
    tasks = service.get_opponent_tasks_automatically(db, matching_id, user_id)
    return {
        "items": [
            {
                "todo_id": str(t.id),
                "name": t.name,
                "skill": t.skill.name,
                "is_completed": t.is_completed,
                "matching_id": str(t.matching_id),
                "matching_name": t.matching_name,
            }
            for t in tasks
        ]
    }


# ---------------------------------------------------------
# 2. AI/채팅 추천 후보 Todo (GeneratedTodo)
# ---------------------------------------------------------


@router.get("/generated_todo", response_model=ViewToDoCandidateResponse)
def get_generated_todo(
    chatroom_id: UUID,
    db: Session = Depends(get_db),
    service: TodoService = Depends(get_todo_service),
    user_id: UUID = Depends(get_current_user_id),
):
    """
    용도: 현재 채팅방에 추천된 투두 후보군 리스트를 가져옵니다.
    화면: 투두 추천 팝업 또는 커리큘럼 선택 창
    """
    candidates = service.get_candidates(db, chatroom_id)
    return {
        "candidates": [
            ToDoCandidate(id=str(c.id), name=c.name, skill=skill_name)  # type: ignore
            for c, skill_name in candidates
        ]
    }


@router.post("/generated_todo", response_model=ViewToDoCandidateResponse)
def create_generated_todo(
    request: CreateToDoCandidateRequest,
    db: Session = Depends(get_db),
    service: TodoService = Depends(get_todo_service),
    ai_service: AiService = Depends(get_ai_service),
    _: UUID = Depends(get_current_user_id),
):
    candidates_data = service.create_candidate_todo(db, request.room_id, ai_service)

    return ViewToDoCandidateResponse(candidates=candidates_data)


@router.delete("/generated_todo/{generated_todo_id}")
def delete_generated_todo(
    generated_todo_id: UUID,
    db: Session = Depends(get_db),
    service: TodoService = Depends(get_todo_service),
    _: UUID = Depends(get_current_user_id),
):
    success = service.delete_generated_todo_by_id(db, generated_todo_id)
    if not success:
        raise HTTPException(
            status_code=404, detail="삭제할 generated todo를 찾을 수 없습니다."
        )
    return {"message": "삭제 성공"}


@router.delete("/{todo_id}")
def delete_todo(
    todo_id: UUID,
    db: Session = Depends(get_db),
    service: TodoService = Depends(get_todo_service),
    user_id: UUID = Depends(get_current_user_id),
):
    success = service.delete_todo(db, todo_id, user_id)  # 이렇게 인자가 2개여야 함
    if not success:
        raise HTTPException(status_code=404, detail="삭제할 태스크를 찾을 수 없습니다.")
    return {"message": "삭제 성공"}


@router.post("/{target_id}/select")
def select_todo_candidate(
    target_id: str,
    request: SelectTodoCandidateRequest,
    db: Session = Depends(get_db),
    service: TodoService = Depends(get_todo_service),
    current_user: UUID = Depends(get_current_user_id),
):
    # If user_id is provided in request body, use it, otherwise use current_user
    target_user_id = UUID(request.user_id) if request.user_id else current_user

    try:
        service.select_candidate_to_task(
            db, user_id=target_user_id, target_id=target_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"후보 선택 중 오류가 발생했습니다: {str(e)}"
        )
    return {"message": "성공"}
