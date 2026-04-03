from app.models import MatchingRequest
from app.repositories.announcement_repository import AnnouncementRepository
from app.repositories.matching_repository import MatchingRepository
from app.schemas.chat_schema import WSMessageType, WSReplyMatchingMessage
from app.schemas.matching_schema import (
    MatchingRequestsResponse,
    SentMatchingRequest,
    ReceivedMatchingRequest,
    UpdateMatchingRequest,
    UpdateMatchingResponse,
)


class MatchingService:
    def __init__(
        self, repo: MatchingRepository, announcement_repo: AnnouncementRepository
    ):
        self.repo: MatchingRepository = repo
        self.announcement_repo: AnnouncementRepository = announcement_repo

    def get_my_matchings(self, db, user_id):
        return self.repo.get_my_matchings(db, user_id)

    def get_matching_detail(self, db, id, current_user_id):
        result_dict = self.repo.get_by_id(db, id, current_user_id)
        if not result_dict:
            raise ValueError("Matching not found")

        return result_dict

    def accept_matching_request(self, db, matching_request_id):
        result = self.repo.create_matching_from_request(db, matching_request_id)
        if result is None:
            raise ValueError("matching request not found")
        matching_id, host_user_id, guest_user_id, announcement_id = result
        announcement = self.announcement_repo.get_by_id(db, announcement_id)
        if announcement is None:
            raise ValueError("announcement not found")
        self.announcement_repo.update(db, announcement, {"visible": False})
        return WSReplyMatchingMessage(
            type=WSMessageType.REPLY_MATCHING,
            user_id=host_user_id,
            to_user_id=guest_user_id,
            matching_id=matching_id,
            accept=True,
        ).model_dump(mode="json", exclude_none=True)

    def reject_matching_request(self, db, matching_request_id):
        res = self.repo.matching_request_info(db, matching_request_id)
        if res is None:
            return (False, None)

        host_id = res["host_user_id"]
        guest_id = res["guest_user_id"]
        is_deleted = self.repo.reject_matching_request(db, matching_request_id)
        if not is_deleted:
            return (False, None)

        return (
            is_deleted,
            WSReplyMatchingMessage(
                type=WSMessageType.REPLY_MATCHING,
                user_id=host_id,
                to_user_id=guest_id,
                accept=False,
            ).model_dump(mode="json", exclude_none=True),
        )

    def get_matching_request(self, db, user_id):
        matching_request_send, matching_request_receive = (
            self.repo.get_matching_request(db, user_id)
        )
        return MatchingRequestsResponse(
            send=[
                SentMatchingRequest(
                    matching_request_id=str(matching_request[0].id),
                    opponent_name=matching_request[1],
                    room_id=str(matching_request[0].room_id),
                )
                for matching_request in matching_request_send
            ],
            receive=[
                ReceivedMatchingRequest(
                    matching_request_id=str(matching_request[0].id),
                    opponent_name=matching_request[1],
                    room_id=str(matching_request[0].room_id),
                )
                for matching_request in matching_request_receive
            ],
        )

    def update_matching_status(
        self, db, matching_id, user_id, data: UpdateMatchingRequest
    ):
        normalized_status = data.status
        if normalized_status == "ACTIVATE":
            normalized_status = "ACTIVE"

        result = self.repo.update_matching_and_teach(
            db, matching_id, user_id, data.name, normalized_status
        )
        if not result:
            raise ValueError("Matching not found")

        matching, is_all_completed = result
        return {"name": matching.name, "matching_status": not is_all_completed}
