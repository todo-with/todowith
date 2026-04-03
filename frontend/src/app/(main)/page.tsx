"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { useMyTasks, useMyMatchings, useOpponentTasks } from "@/hooks/useQueries"

function MateCard({ mate }: { mate: any }) {
  const { data } = useOpponentTasks(mate.matching_id)
  const items = data?.items || []
  const total = items.length
  const completed = items.filter((i: any) => i.is_completed).length
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100)

  // Skip rendering if not ACTIVATE
  if (mate.status !== "ACTIVATE" && mate.status !== "ACTIVE") return null

  return (
    <div className="flex items-center gap-4">
      <Avatar className="w-12 h-12">
        <AvatarFallback className="bg-slate-100 font-bold text-slate-500">
          {mate.name?.[0] || "?"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-center">
          <div className="font-semibold">{mate.name} (상대: {mate.opponent_name || "매칭상대"})</div>
          <div className="text-sm font-medium text-slate-600">{progress}%</div>
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-1">
          {mate.teaching_skill}
          <span className="text-blue-500">↔</span>
          {mate.learning_skill}
        </div>
        <Progress value={progress} className="h-2 bg-slate-100" />
      </div>
    </div>
  )
}

export default function HomePage() {
  const { data: tasksData, isLoading: isTasksLoading } = useMyTasks()
  const { data: matchingsData } = useMyMatchings()

  const tasks = tasksData?.items || []
  const completedCount = tasks.filter((t: any) => t.is_completed).length
  const totalTasks = tasks.length
  const ongoingCount = totalTasks - completedCount
  const achievementRate = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100)

  const matchings = Array.isArray(matchingsData) ? matchingsData : []
  // Filter active matchings to render
  const activeMatchings = matchings.filter((m: any) => m.status === "ACTIVATE" || m.status === "ACTIVE")

  const stats = [
    { label: "현재 진행 중", value: isTasksLoading ? "-" : ongoingCount.toString(), sub: "TODO 항목" },
    { label: "완료한 목표", value: isTasksLoading ? "-" : completedCount.toString(), sub: `성취도 ${achievementRate}%` },
    // Removed Badge as it's not in API
  ]

  return (
    <div className="space-y-8 pb-10">
      {/* Greeting Banner */}
      <div className="bg-orange-50 rounded-2xl p-8 flex justify-between items-center">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-slate-900">안녕하세요!</h1>
          <p className="text-slate-600">오늘도 새로운 재능을 배우고 나누어보세요</p>
          <Link href="/matching">
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-semibold gap-2">
              <span className="text-lg">✨</span> 매칭 시작하기
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="shadow-sm border-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ongoing Mates */}
      <Card className="shadow-sm border-slate-100">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <span className="text-green-500">📈</span> 진행 중인 TODO 메이트
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {activeMatchings.length === 0 ? (
             <div className="text-center py-4 text-slate-500">진행 중인 매칭이 없습니다.</div>
          ) : (
             activeMatchings.map((mate: any) => (
               <MateCard key={mate.matching_id} mate={mate} />
             ))
          )}
        </CardContent>
      </Card>

      {/* Popular Talents */}
      <Card className="shadow-sm border-slate-100">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <span className="text-yellow-500">🌟</span> 추천 스킬
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["영어 회화", "React", "피아노", "디자인", "수영", "스페인어"].map((badge, i) => (
              <div key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                {badge}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
