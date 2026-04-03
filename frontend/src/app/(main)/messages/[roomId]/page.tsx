"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, MoreVertical, Handshake, Check, X } from "lucide-react"
import { useEffect, useState, useRef, use } from "react"
import { useChatHistory, useChatRooms, useUserProfile, useMatchingRequests } from "@/hooks/useQueries"
import { useWebSocket } from "@/lib/useWebSocket"
import api from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"

export default function ChatRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const queryClient = useQueryClient()
  const resolvedParams = use(params)
  const roomId = resolvedParams.roomId
  
  const { data: userProfile } = useUserProfile()
  const { data: historyData } = useChatHistory(roomId)
  const { data: roomsData } = useChatRooms()
  const { data: matchingReqs } = useMatchingRequests()
  
  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isReplying, setIsReplying] = useState(false)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const lastScrollHeightRef = useRef<number>(0)

  // Find info about the current room
  const rooms = Array.isArray(roomsData) ? roomsData : []
  const currentRoom = rooms.find((r: any) => r.room_id === roomId)

  // Matching request logic
  const isMatched = currentRoom?.matching_id != null
  const sentRequest = matchingReqs?.send?.find((r: any) => r.room_id === roomId)
  const receivedRequest = matchingReqs?.receive?.find((r: any) => r.room_id === roomId)

  // Initialize history
  useEffect(() => {
    if (historyData && Array.isArray(historyData)) {
      setMessages(historyData)
      setHasMore(historyData.length >= 10) // Assuming default page size is 10 or more
    }
  }, [historyData])

  const fetchMoreMessages = async () => {
    if (isFetchingMore || !hasMore || messages.length === 0) return

    const firstMsg = messages.find(m => !m.isSystem && m.message_id)
    if (!firstMsg) return

    setIsFetchingMore(true)
    try {
      const { data } = await api.get(`/chat/room/${roomId}`, {
        params: { last_message_id: firstMsg.message_id }
      })

      if (data && Array.isArray(data) && data.length > 0) {
        // Save current scroll height to restore position
        if (viewportRef.current) {
          lastScrollHeightRef.current = viewportRef.current.scrollHeight
        }
        
        setMessages(prev => [...data, ...prev])
        setHasMore(data.length >= 10)
      } else {
        setHasMore(false)
      }
    } catch (e) {
      console.error("Failed to fetch more messages:", e)
    } finally {
      setIsFetchingMore(false)
    }
  }

  // Restore scroll position after prepending messages
  useEffect(() => {
    if (lastScrollHeightRef.current && viewportRef.current && isFetchingMore === false) {
      const newScrollHeight = viewportRef.current.scrollHeight
      const delta = newScrollHeight - lastScrollHeightRef.current
      if (delta > 0) {
        viewportRef.current.scrollTop = delta
        lastScrollHeightRef.current = 0
      }
    }
  }, [messages, isFetchingMore])

  // Process websocket messages
  const handleWebSocketMessage = (data: any) => {
    if ((data.type === "SEND_MESSAGE" || data.type === "RECV_MESSAGE") && data.room_id === roomId) {
      setMessages(prev => {
        // 중복 방지 (이미 같은 message_id가 있으면 무시)
        if (data.chat_log_id && prev.some(m => m.message_id === data.chat_log_id)) return prev;
        
        // 서버에서 user_id를 포함해 브로드스트합니다.
        const isMe = data.user_id === userProfile?.id;
        const newMsg = {
           message_id: data.chat_log_id || (Date.now().toString() + Math.random()), 
           sender_name: isMe ? userProfile?.name : currentRoom?.opponent_name,
           content: data.content,
           timestamp: data.timestamp || new Date().toISOString(),
           read: false
        }
        return [...prev, newMsg]
      })
    }

    if (data.room_id === roomId) {
      if (data.type === "REQUEST_MATCHING") {
        queryClient.invalidateQueries({queryKey: ['matchingRequests']});
        setMessages(prev => [...prev, {
          message_id: Date.now().toString() + Math.random(),
          sender_name: "System",
          content: "매칭 요청을 보냈습니다. 상대방의 응답을 기다립니다.",
          timestamp: new Date().toISOString(),
          isSystem: true
        }])
      } else if (data.type === "RECEIVE_MATCHING") {
        queryClient.invalidateQueries({queryKey: ['matchingRequests']});
        setMessages(prev => [...prev, {
          message_id: Date.now().toString() + Math.random(),
          sender_name: "System",
          content: "상대방이 매칭을 요청했습니다. 상단에서 수락/거절을 선택해주세요.",
          timestamp: new Date().toISOString(),
          isSystem: true
        }])
      } else if (data.type === "REPLY_MATCHING") {
        queryClient.invalidateQueries({queryKey: ['matchingRequests']});
        queryClient.invalidateQueries({queryKey: ['chatRooms']});
        setMessages(prev => [...prev, {
          message_id: Date.now().toString() + Math.random(),
          sender_name: "System",
          content: data.accept ? "매칭이 성사되었습니다! 이제TODO를 만들어 공부를 시작해보세요." : "매칭 요청이 거절되었습니다.",
          timestamp: new Date().toISOString(),
          isSystem: true
        }])
      }
    }
  }

  const { isConnected, sendMessage } = useWebSocket({
    onConnect: () => {
      // Upon connection, JOIN_CHAT
      sendMessage({
        type: "JOIN_CHAT",
        room_id: roomId
      })
    },
    onMessage: handleWebSocketMessage
  })

  // Auto scroll to bottom only for new messages (not when fetching history)
  useEffect(() => {
    if (scrollRef.current && !isFetchingMore) {
      // Logic for scrolling to bottom should only trigger if we are near the bottom
      // or if it's the very first load or a message I sent.
      const isNearBottom = viewportRef.current 
        ? (viewportRef.current.scrollHeight - viewportRef.current.scrollTop - viewportRef.current.clientHeight < 200)
        : true;

      if (isNearBottom) {
        setTimeout(() => {
          scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }, 50)
      }
    }
  }, [messages, isFetchingMore])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (target.scrollTop === 0 && !isFetchingMore && hasMore) {
      fetchMoreMessages()
    }
  }

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputValue.trim() || !isConnected) return

    // websocket으로 메시지 전송 (서버가 브로드캐스트하면 handleWebSocketMessage에서 처리됨)
    sendMessage({
      type: "SEND_MESSAGE",
      room_id: roomId,
      content: inputValue
    })
    
    setInputValue("")
  }

  const handleRequestMatching = () => {
    if (!isConnected) return;
    sendMessage({
      type: "REQUEST_MATCHING",
      room_id: roomId
    })
  }

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
    <div className="h-full flex flex-col pt-0 min-h-0">
      {/* Chat Header */}
      <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-slate-200 font-bold">
              {currentRoom?.opponent_name?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold text-slate-900 leading-tight">
              {currentRoom?.opponent_name || "채팅 기록 불러오는 중..."}
            </div>
            <div className="text-xs text-slate-500">{currentRoom?.name || ""}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isMatched && (
            <>
              {receivedRequest ? (
                <div className="flex bg-slate-100 rounded-lg p-1 animate-pulse">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleReplyMatching(true, receivedRequest.matching_request_id)}
                    disabled={isReplying}
                    className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 font-bold disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 mr-1" />수락
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleReplyMatching(false, receivedRequest.matching_request_id)}
                    disabled={isReplying}
                    className="h-8 text-slate-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <X className="w-4 h-4 mr-1" />거절
                  </Button>
                </div>
              ) : sentRequest ? (
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
                  매칭 수락 대기중...
                </span>
              ) : (
                <Button 
                  size="sm" 
                  onClick={handleRequestMatching}
                  className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold h-8 rounded-lg"
                >
                  <Handshake className="w-4 h-4 mr-1.5" /> 매칭 요청
                </Button>
              )}
            </>
          )}

          <button className="text-slate-400 hover:text-slate-600 transition-colors ml-2">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea 
        className="flex-1 bg-slate-50/50 min-h-0" 
        viewportRef={viewportRef}
        onScroll={handleScroll}
      >
        <div className="p-6 space-y-4">
          {hasMore && (
            <div className="flex justify-center p-2">
              <span className="text-xs text-slate-400">
                {isFetchingMore ? "메시지 불러오는 중..." : "위로 스크롤하여 이전 메시지 보기"}
              </span>
            </div>
          )}
          {messages.map((msg: any) => {
            if (msg.isSystem || msg.sender_name === "System") {
              return (
                <div key={msg.message_id} className="flex justify-center my-4">
                  <span className="px-4 py-1.5 bg-slate-200/60 text-slate-600 font-medium text-xs rounded-full shadow-sm text-center">
                    {msg.content}
                  </span>
                </div>
              )
            }

            const isMy = msg.sender_name === userProfile?.name
            return (
              <div key={msg.message_id} className={`flex flex-col ${isMy ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`px-4 py-2.5 rounded-2xl max-w-[70%] text-[15px] ${isMy ? 'bg-yellow-400 text-yellow-950 rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-900 rounded-tl-sm'}`}
                >
                  {msg.content}
                </div>
                <span className="text-xs text-slate-400 mt-1 mx-1">
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}
                </span>
              </div>
            )
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Chat Input */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <form onSubmit={handleSend} className="relative flex items-center bg-slate-100 rounded-xl p-1">
          <Input 
            className="flex-1 border-none bg-transparent h-10 focus-visible:ring-0 px-4 text-slate-700" 
            placeholder={isConnected ? "메시지를 입력하세요..." : "연결 중..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={!isConnected}
          />
          <button 
            type="submit"
            disabled={!isConnected || !inputValue.trim()}
            className="w-10 h-10 shrink-0 bg-yellow-400 text-yellow-900 rounded-lg flex items-center justify-center hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  )
}
