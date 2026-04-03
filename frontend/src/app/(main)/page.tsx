"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { useMatchingDetail, useMyTasks, useMyMatchings, useOpponentTasks, useUpdateTodo, useDeleteTodo } from "@/hooks/useQueries"
import { CheckCircle2, Circle, ClipboardList, Trash2, Sparkles, Users, Calendar, ArrowRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

function MateCard({ mate, myTasks, onToggleTodo, onDeleteTodo }: { mate: any; myTasks: any[]; onToggleTodo: any; onDeleteTodo: any }) {
  const { data: opponentTasksData } = useOpponentTasks(mate.matching_id)
  const { data: matchingDetail } = useMatchingDetail(mate.matching_id)

  const opponentTasks = opponentTasksData?.items || []
  const filteredMyTasks = myTasks.filter((t: any) => t.matching_id === mate.matching_id)
  const completedOpponent = opponentTasks.filter((i: any) => i.is_completed).length
  const totalOpponent = opponentTasks.length

  const totalTasks = filteredMyTasks.length + totalOpponent
  const totalCompleted = filteredMyTasks.filter((t: any) => t.is_completed).length + completedOpponent
  const totalProgress = totalTasks === 0 ? 0 : Math.round((totalCompleted / totalTasks) * 100)

  const opponentName = matchingDetail?.opponent_name || "매칭상대"

  // Skip rendering if not ACTIVATE
  if (mate.status !== "ACTIVATE" && mate.status !== "ACTIVE") return null

  return (
    <Dialog>
      <DialogTrigger className="w-full">
        <div className="group cursor-pointer p-4 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all text-left w-full">
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12 transition-transform group-hover:scale-105">
              <AvatarFallback className="bg-slate-100 font-bold text-slate-500">
                {opponentName?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-center">
                <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {mate.name}
                </div>
                <div className="text-sm font-bold text-blue-600">{totalProgress}%</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter">교습</span>
                  <span className="text-xs font-semibold text-slate-600">{mate.teaching_skill}</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-300" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-green-500 uppercase tracking-tighter">학습</span>
                  <span className="text-xs font-semibold text-slate-600">{mate.learning_skill}</span>
                </div>
              </div>
              <Progress value={totalProgress} className="h-1.5 bg-slate-100" />
            </div>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            매칭 상세 정보
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Matching Summary Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">매칭 이름</p>
              <p className="font-bold text-slate-900">{mate.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">상대방</p>
              <p className="font-bold text-slate-900">{opponentName}</p>
            </div>
            <div className="pt-3 border-t border-slate-200">
              <p className="text-[10px] font-bold text-blue-500 uppercase">내가 가르치는 스킬</p>
              <p className="text-sm font-bold text-slate-700">{mate.teaching_skill}</p>
            </div>
            <div className="pt-3 border-t border-slate-200">
              <p className="text-[10px] font-bold text-green-500 uppercase">내가 배우는 스킬</p>
              <p className="text-sm font-bold text-slate-700">{mate.learning_skill}</p>
            </div>
          </div>

          {/* TODO Status Comparison */}
          <div className="grid grid-cols-2 gap-6">
            {/* My TODOs */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                나의 TODO ({filteredMyTasks.filter((t: any) => t.is_completed).length}/{filteredMyTasks.length})
              </h4>
              <ScrollArea className="h-[300px] rounded-xl border border-slate-100 p-2">
                <div className="space-y-2">
                  {filteredMyTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-10">등록된 TODO가 없습니다.</p>
                  ) : (
                    filteredMyTasks.map((t: any) => (
                      <div key={t.todo_id} className="flex items-center group gap-2 p-2 rounded-lg bg-white border border-slate-50 hover:border-blue-100 transition-all">
                        <button
                          onClick={() => onToggleTodo(t.todo_id, t.is_completed)}
                          className={`shrink-0 transition-colors ${t.is_completed ? 'text-blue-500' : 'text-slate-300 hover:text-blue-400'}`}
                        >
                          {t.is_completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </button>
                        <span className={`text-xs flex-1 truncate ${t.is_completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          {t.name}
                        </span>
                        <button
                          onClick={() => onDeleteTodo(t.todo_id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Opponent TODOs */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                상대의 TODO ({completedOpponent}/{totalOpponent})
              </h4>
              <ScrollArea className="h-[300px] rounded-xl border border-slate-100 p-2 text-slate-400">
                <div className="space-y-2">
                  {opponentTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-10">상대가 등록한 TODO가 없습니다.</p>
                  ) : (
                    opponentTasks.map((t: any) => (
                      <div key={t.todo_id} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-50">
                        {t.is_completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-200 shrink-0" />
                        )}
                        <span className={`text-xs truncate ${t.is_completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          {t.name}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function HomePage() {
  const { data: tasksData, isLoading: isTasksLoading } = useMyTasks()
  const { data: matchingsData } = useMyMatchings()
  const updateTodo = useUpdateTodo()
  const deleteTodo = useDeleteTodo()

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
  ]

  const onToggleTodo = (todoId: string, isCompleted: boolean) => {
    updateTodo.mutate({ taskId: todoId, isCompleted: !isCompleted })
  }

  const onDeleteTodo = (todoId: string) => {
    if (confirm("정말 이 TODO를 삭제하시겠습니까?")) {
      deleteTodo.mutate(todoId)
    }
  }

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
            <span className="text-green-500">📈</span> 진행 중인 매칭
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {activeMatchings.length === 0 ? (
            <div className="text-center py-4 text-slate-500">진행 중인 매칭이 없습니다.</div>
          ) : (
            activeMatchings.map((mate: any) => (
              <MateCard key={mate.matching_id} mate={mate} myTasks={tasks} onToggleTodo={onToggleTodo} onDeleteTodo={onDeleteTodo} />
            ))
          )}
        </CardContent>
      </Card>

      {/* My TODO List */}
      <Card className="shadow-sm border-slate-100">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-500" />
            나의 TODO 리스트
          </CardTitle>
          <Badge className="bg-slate-100 text-slate-600 border-none hover:bg-slate-100">
            총 {totalTasks}개
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {isTasksLoading ? (
            <div className="text-center py-8 text-slate-400">TODO를 불러오는 중...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <p className="text-sm">아직 등록된 TODO가 없습니다.</p>
              <p className="text-xs text-slate-400 mt-1">매칭된 메이트와 채팅에서 TODO를 추천받아보세요!</p>
            </div>
          ) : (
            tasks.map((task: any) => (
              <div key={task.todo_id} className="flex items-center group gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all">
                <button
                  onClick={() => onToggleTodo(task.todo_id, task.is_completed)}
                  disabled={updateTodo.isPending}
                  className={`shrink-0 transition-colors ${task.is_completed ? 'text-blue-500' : 'text-slate-300 hover:text-blue-400'}`}
                >
                  {task.is_completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm truncate ${task.is_completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                    {task.name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                      {task.skill}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      @ {task.matching_name || '매칭'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteTodo(task.todo_id)}
                  disabled={deleteTodo.isPending}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

    </div>
  )
}
