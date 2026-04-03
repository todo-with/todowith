from pydantic import BaseModel
from typing import List, Optional


# Request Models
class EditMyProfileRequest(BaseModel):
    name: str | None = None
    description: str | None = None


# Response Models
class SearchUserProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    can_teach_skills: List[str]
    want_to_skills: List[str]
    description: Optional[str] = None
