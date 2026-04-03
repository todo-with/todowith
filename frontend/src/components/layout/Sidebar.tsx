"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, MessageSquare, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useUserProfileContext } from "@/context/UserProfileContext"

const navItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/matching", label: "매칭", icon: Users },
  { href: "/messages", label: "메시지", icon: MessageSquare },
  { href: "/profile", label: "프로필", icon: User },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: user, isLoading } = useUserProfileContext()

  return (
    <div className="w-64 border-r h-screen bg-slate-50 flex flex-col pt-8">
      <div className="px-6 mb-8 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold">
          TODO
        </div>
        <span className="font-semibold text-sm">재능 교환 플랫폼</span>
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
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-slate-200 font-bold text-slate-600">
              {isLoading ? "?" : (user?.name?.[0] || "U")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1">
            <span className="text-sm font-semibold">
              {isLoading ? "로딩 중..." : (user?.name || "로그인 필요")}
            </span>
            <span className="text-xs text-slate-500 line-clamp-1">
              {user?.description || "프로필 소개를 추가해보세요"}
            </span>
            {user?.can_teach_skills && user.can_teach_skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {user.can_teach_skills.map(skill => (
                  <span key={skill} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
          {user && (
            <button 
              onClick={() => {
                localStorage.removeItem("access_token");
                window.location.href = "/login";
              }}
              className="text-xs text-slate-400 hover:text-red-500 font-medium px-2 py-1 rounded hover:bg-red-50"
            >
              로그아웃
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
