"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, X, Send } from "lucide-react"
import { useMatchingRequests } from "@/hooks/useQueries"
import { useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"

interface NotificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationModal({ open, onOpenChange }: NotificationModalProps) {
  const queryClient = useQueryClient()
  const { data: matchingReqs, isLoading } = useMatchingRequests()
  const [isReplying, setIsReplying] = useState(false)

  const receivedRequests = Array.isArray(matchingReqs?.receive) ? matchingReqs.receive : []
  const sentRequests = Array.isArray(matchingReqs?.send) ? matchingReqs.send : []

  const handleReplyMatching = async (accept: boolean, reqId: string) => {
    if (isReplying) return;
    setIsReplying(true);
    try {
      await api.post(`/matching/${reqId}/accept`, { accept });
      await queryClient.invalidateQueries({ queryKey: ['matchingRequests'] });
      await queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    } catch(e) {
      console.error(e)
      alert("매칭 응답 처리 중 에러가 발생했습니다.");
    } finally {
      setIsReplying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 border-b border-slate-100 flex-shrink-0">
          <DialogTitle className="text-xl font-bold">알림 내역</DialogTitle>
          <DialogDescription>
            주고받은 매칭 요청을 확인하고 응답하세요.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-8 h-full bg-white">
            {isLoading ? (
              <p className="text-center text-slate-500 py-4">로딩 중...</p>
            ) : (
              <>
                {/* 받은 요청 */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900 border-l-4 border-blue-500 pl-2">
                    받은 매칭 요청 ({receivedRequests.length})
                  </h3>
                  {receivedRequests.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">받은 매칭 요청이 없습니다.</p>
                  ) : (
                    <div className="space-y-3">
                      {receivedRequests.map((req: any) => (
                        <div key={req.matching_request_id} className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-slate-900">{req.opponent_name}</p>
                              <p className="text-xs text-slate-500">채팅방에서 요청이 도달했습니다.</p>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full">
                            <Button 
                              size="sm" 
                              onClick={() => handleReplyMatching(true, req.matching_request_id)}
                              disabled={isReplying}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-sm disabled:opacity-50"
                            >
                              <Check className="w-4 h-4 mr-1" />수락
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleReplyMatching(false, req.matching_request_id)}
                              disabled={isReplying}
                              className="flex-1 text-slate-600 hover:bg-red-50 hover:text-red-600 border-slate-200 disabled:opacity-50"
                            >
                              <X className="w-4 h-4 mr-1" />거절
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-px bg-slate-100" />

                {/* 보낸 요청 */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900 border-l-4 border-orange-400 pl-2">
                    보낸 매칭 요청 ({sentRequests.length})
                  </h3>
                  {sentRequests.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">보낸 매칭 요청이 없습니다.</p>
                  ) : (
                    <div className="space-y-3">
                      {sentRequests.map((req: any) => (
                        <div key={req.matching_request_id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-slate-900">{req.opponent_name}</p>
                            <p className="text-xs text-slate-500">수락 대기중...</p>
                          </div>
                          <Send className="w-4 h-4 text-slate-300" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
