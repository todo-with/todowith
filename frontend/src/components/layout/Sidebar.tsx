"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { Home, Users, MessageSquare, User, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUserProfileContext } from "@/context/UserProfileContext"
import { useMatchingRequests } from "@/hooks/useQueries"
import { useState } from "react"
import { NotificationModal } from "./NotificationModal"

const navItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/matching", label: "공고", icon: Users },
  { href: "/messages", label: "매칭/메시지", icon: MessageSquare },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: user, isLoading } = useUserProfileContext()
  const { data: matchingReqs } = useMatchingRequests()
  const [isNotiOpen, setIsNotiOpen] = useState(false)

  const receivedCount = Array.isArray(matchingReqs?.receive) ? matchingReqs.receive.length : 0

  return (
    <div className="w-64 h-full bg-slate-50 flex flex-col pt-8 shrink-0">
      <div className="px-5 mb-8 flex flex-col items-center relative">
        <button
          onClick={() => setIsNotiOpen(true)}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors p-1 z-10"
        >
          <Bell className="w-5 h-5" />
          {receivedCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-slate-50">
              {receivedCount}
            </span>
          )}
        </button>

        <Image
          src="/logo.png"
          alt="ToDoWith Logo"
          width={220}
          height={96}
          className="h-24 w-auto object-contain"
          priority
        />
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-yellow-100 text-yellow-900 font-medium"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t mt-auto">
        <div className="flex items-center gap-3 p-2 rounded-lg transition-colors group">
          <Link href="/profile" className="flex items-center gap-3 flex-1 overflow-hidden hover:bg-slate-100 p-1 rounded-md transition-colors">
            <Avatar className="w-9 h-9 shrink-0">
              <AvatarImage src="/book_duck.png" />
              <AvatarFallback className="bg-slate-200 font-bold text-slate-600">
                {isLoading ? "?" : (user?.name?.[0] || "U")}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-semibold truncate">
                {isLoading ? "로딩 중..." : (user?.name || "로그인 필요")}
              </span>
              <span className="text-[11px] text-slate-400">내 프로필 보기</span>
            </div>
          </Link>

          {user && (
            <button
              onClick={() => {
                localStorage.removeItem("access_token");
                window.location.href = "/login";
              }}
              className="text-xs text-slate-400 hover:text-red-500 font-medium p-2 rounded hover:bg-red-50 transition-colors shrink-0"
              title="로그아웃"
            >
              로그아웃
            </button>
          )}
        </div>
      </div>

      <NotificationModal open={isNotiOpen} onOpenChange={setIsNotiOpen} />
    </div>
  )
}
