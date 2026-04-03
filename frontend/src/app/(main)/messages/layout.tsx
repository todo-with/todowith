"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useChatRooms } from "@/hooks/useQueries"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const { data: rooms, isLoading } = useChatRooms()
  const pathname = usePathname()

  const chatRooms = Array.isArray(rooms) ? rooms : []

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col pt-4">
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-bold text-slate-900">메시지</h1>
        <p className="text-slate-600">TODO 메이트와 대화해보세요</p>
      </div>

      <div className="flex-1 flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        
        {/* Left Side: Chat List */}
        <div className="w-[320px] bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
          <ScrollArea className="flex-1">
            {isLoading ? (
               <div className="text-center py-6 text-sm text-slate-500">불러오는 중...</div>
            ) : chatRooms.length === 0 ? (
               <div className="text-center py-6 text-sm text-slate-500">진행 중인 대화가 없습니다.</div>
            ) : (
              chatRooms.map((room) => {
                const isActive = pathname === `/messages/${room.room_id}`
                return (
                  <Link 
                    key={room.room_id}
                    href={`/messages/${room.room_id}`}
                    className={`block p-4 border-b border-slate-100 transition-colors ${isActive ? 'bg-yellow-50' : 'hover:bg-white'}`}
                  >
                    <div className="flex gap-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-slate-200 font-bold text-slate-600">
                            {room.opponent_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-900">{room.opponent_name}</span>
                          <span className="text-xs text-slate-400">
                            {room.updated_at ? new Date(room.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mb-1 line-clamp-1">{room.name}</div>
                        <div className="text-sm truncate text-slate-700">{room.last_message || "메시지가 없습니다"}</div>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </ScrollArea>
        </div>

        {/* Right Side: Chat Container Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative min-h-0">
          {children}
        </div>
      </div>
    </div>
  )
}
