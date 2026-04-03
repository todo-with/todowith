import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_announcement_service
from app.core.verify_jwt import get_current_user_id
from app.dependencies.database import get_db
from app.schemas.announcement_schema import (
    CreateAnnounceRequest,
    AnnounceItem,
    ViewDetailAnnounceResponse,
    EditAnnounceResponse,
    EditAnnounceRequest,
)
from app.services.announcement_service import AnnouncementService

router = APIRouter(
    prefix="/announcement",
    tags=["announcement"],
)


@router.get("/all", response_model=List[AnnounceItem])
def get_all_announcements(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
    service: AnnouncementService = Depends(get_announcement_service),
    keyword: str | None = Query(default=None),
) -> List[AnnounceItem]:
    logger = logging.getLogger("__main__")
    try:
        get_announcements = service.get_all_announcements(db, user_id, keyword)
    except Exception as e:
        logger.error(str(e))
        raise HTTPException(status_code=500, detail="Failed to get announcements")
    return get_announcements


@router.get("/detail/{announcement_id}", response_model=ViewDetailAnnounceResponse)
def get_announcement_detail(
    announcement_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_id),
    service: AnnouncementService = Depends(get_announcement_service),
) -> ViewDetailAnnounceResponse:
    logger = logging.getLogger("__main__")
    try:
        res: ViewDetailAnnounceResponse = service.get_detail_announcement(
            db, announcement_id
        )
    except ValueError as e:
        logger.error(e)
        raise HTTPException(status_code=404, detail="Announcement not found")
    return res


@router.post("")
def create_announcement(
    create_announcement_request: CreateAnnounceRequest,
    user_id: str = Depends(get_current_user_id),
    service: AnnouncementService = Depends(get_announcement_service),
    db=Depends(get_db),
) -> str:
    try:
        announcement = service.create_announcement(
            db=db, payload=create_announcement_request, user_id=user_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return str(announcement.id)


@router.patch("/{announcement_id}", response_model=EditAnnounceResponse)
def update_announcement(
    announcement_id: str,
    payload: EditAnnounceRequest,
    user_id: str = Depends(get_current_user_id),
    service: AnnouncementService = Depends(get_announcement_service),
    db: Session = Depends(get_db),
) -> EditAnnounceResponse:
    logger = logging.getLogger("__main__")
    try:
        return service.update_announcement(
            db=db,
            announcement_id=announcement_id,
            payload=payload,
            user_id=user_id,
        )
    except ValueError as e:
        logger.error(str(e))
        if str(e) == "Announcement not found":
            raise HTTPException(status_code=404, detail="Invalid announcement id")
        if str(e) == "Invalid user id":
            raise HTTPException(status_code=400, detail="Invalid user id")
        raise HTTPException(status_code=400, detail=str(e))
