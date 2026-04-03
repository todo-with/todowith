from pydantic import BaseModel
from typing import List

# Request Models
class CreateToDoCandidateRequest(BaseModel):
    room_id: str

class SelectTodoCandidateRequest(BaseModel):
    user_id: str | None = None

class CreateToDoRequest(BaseModel):
    matching_id: str
    skill: str
    name: str
    user_id: str

class UpdateToDoRequest(BaseModel):
    is_completed: bool

# Response Models
class ToDoItem(BaseModel):
    todo_id: str
    name: str
    skill: str
    is_completed: bool
    matching_name: str | None = None
    matching_id: str | None = None

class GeneratedTodoItem(BaseModel): 
    name: str
    skill: str

class ViewMyToDoResponse(BaseModel):
    items: List[ToDoItem]

class ViewOpponentToDoResponse(BaseModel):
    items: List[ToDoItem]

class UpdateToDoResponse(BaseModel):
    todo_id: str
    name: str
    is_completed: bool

class ToDoCandidate(BaseModel):
    id: str
    name: str
    skill: str

class ViewToDoCandidateResponse(BaseModel):
    candidates: List[ToDoCandidate]

class CreateToDoCandidateResponse(BaseModel):
    candidates: List[ToDoCandidate]
