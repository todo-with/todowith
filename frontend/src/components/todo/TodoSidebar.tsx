"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Trash2, Wand2, Plus, User, Users, Sparkles, X } from "lucide-react"
import {
  useMyTasks,
  useOpponentTasks,
  useGeneratedTodos,
  useCreateTodo,
  useUpdateTodo,
  useDeleteTodo,
  useCreateGeneratedTodo,
  useSelectCandidateTodo,
  useDeleteGeneratedTodo
} from "@/hooks/useQueries"

interface TodoSidebarProps {
  roomId: string
  matchingId: string
  userId?: string
  opponentId?: string
  matchingSkills?: string[]
  teachingSkill?: string
  learningSkill?: string
}

export function TodoSidebar({ 
  roomId, 
  matchingId, 
  userId, 
  opponentId, 
  matchingSkills = [],
  teachingSkill,
  learningSkill
}: TodoSidebarProps) {
  const [activeTab, setActiveTab] = useState("my")
  const [newTaskName, setNewTaskName] = useState("")
  const [newSkill, setNewSkill] = useState("")
  const [newOpponentTaskName, setNewOpponentTaskName] = useState("")
  const [newOpponentSkill, setNewOpponentSkill] = useState("")

  // Sync initial skills when matchingSkills loads
  useEffect(() => {
    if (matchingSkills.length > 0) {
      if (!newSkill) setNewSkill(matchingSkills[0])
      if (!newOpponentSkill) setNewOpponentSkill(matchingSkills[0])
    }
  }, [matchingSkills])

  const { data: myTasksData } = useMyTasks()
  const { data: opponentTasksData } = useOpponentTasks(matchingId)
  const { data: generatedTodosData } = useGeneratedTodos(roomId)

  const createTodo = useCreateTodo()
  const updateTodo = useUpdateTodo()
  const deleteTodo = useDeleteTodo()
  const createGeneratedTodo = useCreateGeneratedTodo()
  const selectCandidate = useSelectCandidateTodo()
  const deleteGeneratedTodo = useDeleteGeneratedTodo()

  const myTasks = Array.isArray(myTasksData?.items)
    ? myTasksData.items.filter((t: any) => t.matching_id === matchingId)
    : []
  const opponentTasks = Array.isArray(opponentTasksData?.items) ? opponentTasksData.items : []
  const candidates = Array.isArray(generatedTodosData?.candidates) ? generatedTodosData.candidates : []

  const handleCreateTodo = (targetUserId: string | undefined, taskName: string, skill: string, isMy: boolean) => {
    if (!taskName.trim() || !targetUserId || !skill) return

    createTodo.mutate({
      matching_id: matchingId,
      user_id: targetUserId,
      name: taskName,
      skill: skill
    }, {
      onSuccess: () => {
        if (isMy) setNewTaskName("")
        else setNewOpponentTaskName("")
      }
    })
  }

  const handleToggleComplete = (taskId: string, currentStatus: boolean) => {
    updateTodo.mutate({ taskId, isCompleted: !currentStatus })
  }

  const handleDelete = (taskId: string) => {
    deleteTodo.mutate(taskId)
  }

  const handleGenerate = () => {
    createGeneratedTodo.mutate(roomId)
  }

  const handleSelectCandidate = (targetId: string, targetType: 'my' | 'opponent') => {
    const targetUserId = targetType === 'my' ? userId : opponentId;
    selectCandidate.mutate({ targetId, roomId, targetUserId })
  }

  return (
    <div className="w-96 h-full border-l border-slate-200 bg-white flex flex-col hidden md:flex shrink-0">
      <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0">
        <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          📝 매칭 TODO 관리
        </h2>
        <p className="text-xs text-slate-500 mt-1">이 매칭에서 이룰 목표를 관리하세요</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-4 shrink-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my" className="text-xs">나의 TODO</TabsTrigger>
            <TabsTrigger value="opponent" className="text-xs">상대 TODO</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-500" />
              AI 추천
            </TabsTrigger>
          </TabsList>
        </div>

        {/* My Tasks Tab */}
        <TabsContent value="my" className="flex-1 min-h-0 flex flex-col pt-2 m-0 border-none data-[state=active]:flex">
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-2 pb-4">
              {myTasks.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4 italic">할 일이 없습니다.</p>
              ) : (
                myTasks.map((task: any) => (
                  <div key={task.todo_id} className="group flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-yellow-200 hover:bg-yellow-50/30 transition-colors">
                    <button
                      onClick={() => handleToggleComplete(task.todo_id, task.is_completed)}
                      className={`shrink-0 w-5 h-5 mt-0.5 rounded flex items-center justify-center border transition-colors ${task.is_completed ? 'bg-yellow-400 border-yellow-400 text-white' : 'border-slate-300 hover:border-yellow-400'}`}
                    >
                      {task.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${task.is_completed ? 'text-slate-400 line-through' : 'text-slate-700'} break-words`}>
                        <span className="font-semibold text-xs text-blue-600 mr-2 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">{task.skill}</span>
                        {task.name}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(task.todo_id)}
                      className="shrink-0 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); handleCreateTodo(userId, newTaskName, newSkill, true); }} className="space-y-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">나의 할 일 추가</h3>
              <select
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="w-full text-sm border-slate-200 rounded-md bg-slate-50 h-8 px-2"
                required
              >
                <option value="" disabled>스킬 선택</option>
                {matchingSkills.map((s, i) => (
                  <option key={i} value={s}>{s}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Input
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="할 일 내용"
                  className="h-8 text-sm"
                />
                <Button type="submit" size="sm" className="h-8 shrink-0 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 px-2" disabled={createTodo.isPending}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* Opponent Tasks Tab */}
        <TabsContent value="opponent" className="flex-1 min-h-0 flex flex-col pt-2 m-0 border-none data-[state=active]:flex">
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-2 pb-4">
              {opponentTasks.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4 italic">상대방의 할 일이 없습니다.</p>
              ) : (
                opponentTasks.map((task: any) => (
                  <div key={task.todo_id} className="group flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className={`shrink-0 w-5 h-5 mt-0.5 rounded flex items-center justify-center border ${task.is_completed ? 'bg-slate-300 border-slate-300 text-white' : 'border-slate-300 bg-white'}`}>
                      {task.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${task.is_completed ? 'text-slate-400 line-through' : 'text-slate-600'} break-words`}>
                        <span className="font-semibold text-xs text-slate-500 mr-2 bg-slate-200 px-1.5 py-0.5 rounded shrink-0">{task.skill}</span>
                        {task.name}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); handleCreateTodo(opponentId, newOpponentTaskName, newOpponentSkill, false); }} className="space-y-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">상대방 할 일 추가</h3>
              <select
                value={newOpponentSkill}
                onChange={(e) => setNewOpponentSkill(e.target.value)}
                className="w-full text-sm border-slate-200 rounded-md bg-slate-50 h-8 px-2"
                required
              >
                <option value="" disabled>스킬 선택</option>
                {matchingSkills.map((s, i) => (
                  <option key={i} value={s}>{s}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Input
                  value={newOpponentTaskName}
                  onChange={(e) => setNewOpponentTaskName(e.target.value)}
                  placeholder="할 일 내용"
                  className="h-8 text-sm"
                />
                <Button type="submit" size="sm" className="h-8 shrink-0 bg-blue-500 hover:bg-blue-600 text-white px-2" disabled={createTodo.isPending}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* AI Recommendations Tab */}
        <TabsContent value="ai" className="flex-1 min-h-0 flex flex-col pt-2 m-0 border-none data-[state=active]:flex">
          <div className="px-4 py-2 shrink-0">
            <Button
              variant="outline"
              className="w-full h-10 text-sm border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 font-bold shadow-sm"
              onClick={handleGenerate}
              disabled={createGeneratedTodo.isPending}
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {createGeneratedTodo.isPending ? "AI 분석 중..." : "대화 기반 TODO 자동 생성"}
            </Button>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-3 pb-4">
              {candidates.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium whitespace-pre-wrap leading-relaxed">
                    최근 대화 내용을 분석하여{"\n"}수업 목표를 추천해 드립니다.
                  </p>
                  <p className="text-xs text-slate-400 mt-2">상단의 버튼을 눌러보세요!</p>
                </div>
              ) : (
                candidates.map((c: any) => (
                  <div key={c.id} className="flex flex-col gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <div>
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {c.skill === teachingSkill ? (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                              <Users className="w-2.5 h-2.5" /> [가르침] {c.skill}
                            </span>
                          ) : c.skill === learningSkill ? (
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> [배움] {c.skill}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-purple-600 bg-white border border-purple-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              {c.skill}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={() => deleteGeneratedTodo.mutate({ candidateId: c.id, roomId })}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          title="삭제"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-700 font-medium leading-normal">{c.name}</p>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full h-8 text-xs bg-white text-yellow-700 hover:bg-yellow-50 border border-yellow-200 shadow-sm font-bold"
                        onClick={() => handleSelectCandidate(c.id, 'my')}
                        disabled={selectCandidate.isPending}
                      >
                        <User className="w-3.5 h-3.5 mr-1.5" /> 채택하기
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
