from datetime import datetime
from typing import Any
from uuid import UUID
from app.models import User

from sqlalchemy.orm import Session, aliased

from app.models.announcement_models import Announcement
from app.models.chat_models import Chatroom, MatchingRequest
from app.models.matching_models import Matching, Teach
from app.models.skill_models import Skill

from app.core.verify_jwt import get_current_user_id


class MatchingRepository:
    def accept_matching_request(
        self,
        db: Session,
        matching_request_id: UUID,
        matching_id: UUID,
    ) -> Chatroom | None:
        """이미 있는 matching에 대해 matching request를 연결하고 matching request를 삭제하는 로직"

        Args:
            db (Session):
            matching_request_id (UUID):
            matching_id (UUID):

        Returns:
            Chatroom | None:
        """
        matching_request = (
            db.query(MatchingRequest)
            .filter(MatchingRequest.id == matching_request_id)
            .first()
        )
        if matching_request is None:
            return None

        chatroom = (
            db.query(Chatroom).filter(Chatroom.id == matching_request.room_id).first()
        )
        if chatroom is None:
            return None

        chatroom.matching_id = matching_id  # type: ignore
        db.delete(matching_request)
        db.commit()
        db.refresh(chatroom)
        return chatroom

    def create_matching(
        self, db: Session, announcement_id: UUID, host_id: UUID, guest_id: UUID
    ) -> Matching | None:

        announcement = (
            db.query(Announcement).filter(Announcement.id == announcement_id).first()
        )
        if announcement is None:
            return None

        # 생성 이름: 이름 없는 매칭 YYYYMMDD
        name = f"이름 없는 매칭 {datetime.now().strftime('%Y%m%d')}"

        matching = Matching(name=name)
        db.add(matching)
        db.commit()
        db.refresh(matching)

        teach: set[Teach] = {
            Teach(
                teacher_id=announcement.user_id,
                skill_id=announcement.can_teach_skill,
                matching_id=matching.id,
                status="ACTIVE",
            ),
            Teach(
                teacher_id=guest_id,
                skill_id=announcement.want_to_skill,
                matching_id=matching.id,
                status="ACTIVE",
            ),
        }
        for t in teach:
            db.add(t)
        db.commit()
        return matching

    def create_matching_from_request(
        self,
        db: Session,
        matching_request_id: UUID,
    ) -> tuple[UUID, UUID, UUID, UUID] | None:
        matching_request = (
            db.query(MatchingRequest)
            .filter(MatchingRequest.id == matching_request_id)
            .first()
        )
        if matching_request is None:
            return None

        chatroom = (
            db.query(Chatroom).filter(Chatroom.id == matching_request.room_id).first()
        )
        if chatroom is None:
            return None

        announcement = (
            db.query(Announcement)
            .filter(Announcement.id == chatroom.announcement_id)
            .first()
        )
        if announcement is None or announcement.user_id is None:
            return None

        host_user_id = announcement.user_id
        guest_user_id = (
            matching_request.from_user_id
            if matching_request.from_user_id != host_user_id # type: ignore
            else matching_request.to_user_id
        )
        if guest_user_id is None:
            return None

        try:
            name = f"이름 없는 매칭 {datetime.now().strftime('%Y%m%d')}"
            matching = Matching(name=name)
            db.add(matching)
            db.flush()

            db.add(
                Teach(
                    teacher_id=host_user_id,
                    skill_id=announcement.can_teach_skill,
                    matching_id=matching.id,
                    status="ACTIVE",
                )
            )
            db.add(
                Teach(
                    teacher_id=guest_user_id,
                    skill_id=announcement.want_to_skill,
                    matching_id=matching.id,
                    status="ACTIVE",
                )
            )

            chatroom.matching_id = matching.id  # type: ignore
            db.delete(matching_request)
            db.commit()
        except Exception:
            db.rollback()
            raise

        return (matching.id, host_user_id, guest_user_id, announcement.id)  # type: ignore

    def matching_request_info(self, db: Session, matching_request_id: UUID) -> dict[str, Any] | None:
        matching_request = (
            db.query(MatchingRequest)
            .filter(MatchingRequest.id == matching_request_id)
            .first()
        )
        if matching_request is None:
            return None

        chatroom = (
            db.query(Chatroom).filter(Chatroom.id == matching_request.room_id).first()
        )
        if chatroom is None:
            return None

        announcement = (
            db.query(Announcement)
            .filter(Announcement.id == chatroom.announcement_id)
            .first()
        )
        if announcement is None or announcement.user_id is None:
            return None

        host_user_id = announcement.user_id
        guest_user_id = (
            matching_request.from_user_id
            if matching_request.from_user_id != host_user_id  # type: ignore
            else matching_request.to_user_id
        )
        if guest_user_id is None:
            return None
        return {"host_user_id": host_user_id, "guest_user_id": guest_user_id}

    def reject_matching_request(self, db: Session, matching_request_id: UUID) -> bool:
        matching_request = (
            db.query(MatchingRequest)
            .filter(MatchingRequest.id == matching_request_id)
            .first()
        )
        if matching_request is None:
            return False

        db.delete(matching_request)
        db.commit()
        return True

    def get_matching_request(self, db: Session, user_id: UUID) -> tuple[list[tuple[MatchingRequest, str]], list[tuple[MatchingRequest, str]]]:


        matching_request_send = (
            db.query(MatchingRequest, User.name.label("opponent_name"))
            .filter(MatchingRequest.from_user_id == user_id)
            .join(User, User.id == MatchingRequest.to_user_id)
            .all()
        )
        matching_reqeust_receive = (
            db.query(MatchingRequest, User.name.label("opponent_name"))
            .filter(MatchingRequest.to_user_id == user_id)
            .join(User, User.id == MatchingRequest.from_user_id)
            .all()
        )
        return matching_request_send, matching_reqeust_receive # type: ignore
    

    def get_my_matchings(self, db: Session, user_id: UUID):
        # 상대방의 Teach 정보를 가져오기 위한 별칭(Alias) 설정
        PartnerTeach = aliased(Teach)
        PartnerSkill = aliased(Skill)

        results = (
            db.query(
                Matching.id.label("matching_id"),
                Matching.name,
                Skill.name.label("teaching_skill"),      # 내가 가르치는 스킬
                PartnerSkill.name.label("learning_skill"), # 상대방이 가르치는(내가 배우는) 스킬
                Teach.status.label("status")               # 내 진행 상태
            )
            # 1. 내 Teach 정보 조인 (나의 스킬)
            .join(Teach, Teach.matching_id == Matching.id)
            .join(Skill, Skill.id == Teach.skill_id)
            
            # 2. 상대방 Teach 정보 조인 (상대방의 스킬)
            .join(PartnerTeach, (PartnerTeach.matching_id == Matching.id) & (PartnerTeach.teacher_id != user_id))
            .join(PartnerSkill, PartnerSkill.id == PartnerTeach.skill_id)
            
            # 3. 내 ID로 필터링
            .filter(Teach.teacher_id == user_id)
            .all()
        )
        
        return results
    
    def get_by_id(self, db: Session, matching_id: UUID, current_user_id: UUID):
        # 1. 상대방 정보 (이름, ID, 상대방이 가르치는 스킬 이름)
        opponent_data = (
            db.query(User.name, User.id, Skill.name.label("skill_name"))
            .join(Teach, Teach.teacher_id == User.id)
            .join(Skill, Skill.id == Teach.skill_id)
            .filter(Teach.matching_id == matching_id)
            .filter(User.id != current_user_id) # 내가 아닌 상대방
            .first()
        )

        # 2. 내가 가르치는 스킬 정보
        my_skill_data = (
            db.query(Skill.name)
            .join(Teach, Teach.skill_id == Skill.id)
            .filter(Teach.matching_id == matching_id)
            .filter(Teach.teacher_id == current_user_id)
            .first()
        )

        if not opponent_data:
            return None

        # ⭐ 중요: DB 모델이 아니라, 라우터가 기대하는 형태의 '딕셔너리'나 '객체'로 반환합니다.
        
        # 3. 전체 매칭 상태 확인
        all_teaches = db.query(Teach).filter(Teach.matching_id == matching_id).all()
        is_all_completed = len(all_teaches) == 2 and all(t.status == "COMPLETED" for t in all_teaches)
        
        # 4. 내 교습 상태 확인
        my_teach = db.query(Teach).filter(Teach.matching_id == matching_id, Teach.teacher_id == current_user_id).first()

        return {
            "opponent_name": opponent_data.name,
            "opponent_id": str(opponent_data.id),
            "teaching_skill": my_skill_data.name if my_skill_data else "Unknown",
            "learning_skill": opponent_data.skill_name, # 상대방이 가르치는 게 내가 배우는 것
            "status": my_teach.status if my_teach else "ACTIVE",
            "is_all_completed": is_all_completed
        }
    
    def update_matching_and_teach(self, db: Session, matching_id: UUID, user_id: UUID, name: str | None, status: str | None):
        # 1. MATCHING 테이블 존재 확인 및 이름 업데이트
        matching = db.query(Matching).filter(Matching.id == matching_id).first()
        if not matching:
            return None
            
        if name is not None:
            matching.name = name # type: ignore

        # 2. 나의 TEACH 상태 업데이트
        if status is not None:
            my_teach = db.query(Teach).filter(
                Teach.matching_id == matching_id, 
                Teach.teacher_id == user_id
            ).first()
            if my_teach:
                my_teach.status = status # type: ignore

        db.flush() # 변경 사항 임시 반영 (조회를 위해)

        # 3. 해당 매칭의 모든 TEACH 상태 확인
        all_teaches = db.query(Teach).filter(Teach.matching_id == matching_id).all()
        # 모든 TEACH의 status가 'COMPLETED'인지 체크 (두 개의 TEACH가 모두 COMPLETED여야 함)
        is_all_completed = len(all_teaches) == 2 and all(t.status == "COMPLETED" for t in all_teaches)
        
        # 4. MATCHING 테이블의 matching_status (전체 완료 여부) 업데이트
        # True면 진행 중, False면 종료 (스키마 기준)
        matching.matching_status = not is_all_completed # type: ignore

        db.commit()
        return matching, is_all_completed
