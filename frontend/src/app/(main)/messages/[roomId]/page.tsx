"use client"

import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, MoreVertical } from "lucide-react"
import { useEffect, useState, useRef, use } from "react"
import { useChatHistory, useChatRooms, useUserProfile } from "@/hooks/useQueries"
import { useWebSocket } from "@/lib/useWebSocket"

export default function ChatRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const resolvedParams = use(params)
  const roomId = resolvedParams.roomId
  
  const { data: userProfile } = useUserProfile()
  const { data: historyData } = useChatHistory(roomId)
  const { data: roomsData } = useChatRooms()
  
  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Find info about the current room
  const rooms = Array.isArray(roomsData) ? roomsData : []
  const currentRoom = rooms.find((r: any) => r.room_id === roomId)

  // Initialize history
  useEffect(() => {
    if (historyData && Array.isArray(historyData)) {
      setMessages(historyData)
    }
  }, [historyData])

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

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }, 50)
    }
  }, [messages])

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
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 bg-slate-50/50 min-h-0">
        <div className="p-6 space-y-4">
          {messages.map((msg: any) => {
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
