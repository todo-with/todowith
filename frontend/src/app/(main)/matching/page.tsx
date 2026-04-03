"use client"

import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Heart, MessageSquare, Search } from "lucide-react"
import { useAnnouncements, useAllSkills } from "@/hooks/useQueries"
import { useUserProfileContext } from "@/context/UserProfileContext"
import api from "@/lib/api"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Plus, Edit2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function MatchingPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const { data: userProfile } = useUserProfileContext()
  const { data: mySkills, isLoading: skillsLoading } = useAllSkills()
  const { data: announcements, isLoading } = useAnnouncements(searchTerm)
  const [creating, setCreating] = useState<string | null>(null)
  
  // Create/Edit Announcement State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    want_to_skill: "",
    can_teach_skill: "",
    want_to_message: "",
    can_teach_message: "",
    can_teach_difficulty: "초급",
    want_to_difficulty: "보통"
  })

  const handleSendMessage = async (announcementId: string, announcerName: string) => {
    try {
      setCreating(announcementId)
      const { data } = await api.post('/chat/room', {
        announcement_id: announcementId,
        name: `${announcerName}님과의 채팅`
      })
      await queryClient.invalidateQueries({ queryKey: ['chatRooms'] })
      await queryClient.invalidateQueries({ queryKey: ['announcements'] })
      router.push(`/messages/${data.room_id}`)
    } catch (e) {
      console.error(e)
      alert('채팅방 생성에 실패했습니다.')
    } finally {
      setCreating(null)
    }
  }

  const openCreateModal = () => {
    setEditingId(null)
    setFormData({
      want_to_skill: "",
      can_teach_skill: "",
      want_to_message: "",
      can_teach_message: "",
      can_teach_difficulty: "초급",
      want_to_difficulty: "보통"
    })
    setIsDialogOpen(true)
  }

  const openEditModal = async (id: string) => {
    try {
      const { data } = await api.get(`/announcement/detail/${id}`)
      setEditingId(id)
      setFormData({
        want_to_skill: data.want_to_skill,
        can_teach_skill: data.can_teach_skill,
        want_to_message: data.want_to_message,
        can_teach_message: data.can_teach_message,
        can_teach_difficulty: data.can_teach_difficulty,
        want_to_difficulty: data.want_to_difficulty
      })
      setIsDialogOpen(true)
    } catch (e) {
      console.error(e)
      alert('공고 정보를 불러오는데 실패했습니다.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Ensuring values are not empty strings if they are meant to be chosen
    if (!formData.can_teach_skill || !formData.want_to_skill) {
      alert('가르칠 재능과 배우고 싶은 재능을 모두 선택해주세요.')
      return
    }

    setSubmitting(true)
    try {
      if (editingId) {
        await api.patch(`/announcement/${editingId}`, formData)
      } else {
        await api.post('/announcement', formData)
      }
      await queryClient.invalidateQueries({ queryKey: ['announcements'] })
      setIsDialogOpen(false)
    } catch (e) {
      console.error(e)
      alert('공고 저장에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  // Effect to set initial skill values in the form when opening create modal if skills exist
  useEffect(() => {
    if (isDialogOpen && !editingId && mySkills) {
      setFormData(prev => ({
        ...prev,
        can_teach_skill: mySkills.can_teach_skill?.[0]?.name || "",
        want_to_skill: mySkills.want_to_skill?.[0]?.name || ""
      }))
    }
  }, [isDialogOpen, editingId, mySkills])

  const matches = Array.isArray(announcements) ? announcements : []

  return (
    <div className="space-y-6 pb-10 relative">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">매칭 찾기</h1>
          <p className="text-slate-600">나와 재능을 교환할 메이트를 찾아보세요</p>
        </div>
        <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 font-semibold">
          <Plus className="w-5 h-5" />
          공고 등록하기
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl"
          placeholder="배우고 싶은 재능을 검색해보세요..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs defaultValue="recommended" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12 bg-slate-100 rounded-xl p-1 mb-6">
          <TabsTrigger value="recommended" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">추천 공고</TabsTrigger>
          <TabsTrigger value="teach" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">가르칠 재능</TabsTrigger>
          <TabsTrigger value="learn" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">배우고 싶은 재능</TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="space-y-4 outline-none">
          {isLoading ? (
            <div className="text-center py-10 text-slate-500">공고를 불러오는 중...</div>
          ) : matches.length === 0 ? (
            <div className="text-center py-10 text-slate-500">등록된 공고가 없습니다.</div>
          ) : (
            matches.map((match: any) => (
              <Card key={match.id} className="border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between">
                    <div className="flex gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback className="text-lg bg-blue-100 text-blue-600 font-bold">{match.username?.[0] || "?"}</AvatarFallback>
                      </Avatar>

                      <div className="space-y-2 flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">{match.username}</span>
                        </div>

                        <div className="text-sm space-y-1 text-slate-700">
                          <div><span className="text-slate-500 mr-2">가르칠 수 있어요:</span>{match.can_teach_skill}</div>
                          <div><span className="text-slate-500 mr-2">배우고 싶어요:</span>{match.want_to_skill}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 items-start mt-2">
                      <Button variant="outline" size="icon" className="text-slate-400 hover:text-red-500 rounded-full w-10 h-10">
                        <Heart className="w-5 h-5" />
                      </Button>
                      
                      {match.user_id === userProfile?.id ? (
                        <Button 
                          variant="secondary"
                          onClick={() => openEditModal(match.id)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold gap-2 pl-4 pr-5 rounded-full"
                        >
                          <Edit2 className="w-4 h-4" />
                          수정하기
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSendMessage(match.id, match.username)}
                          disabled={creating === match.id}
                          className="bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-bold gap-2 pl-4 pr-5 rounded-full"
                        >
                          <MessageSquare className="w-4 h-4 fill-current" />
                          {creating === match.id ? "생성 중..." : "메시지 보내기"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        {/* Fill others with dummy empty state or identical list for now */}
        <TabsContent value="teach" className="space-y-4 outline-none">
          {isLoading ? (
            <div className="text-center py-10 text-slate-500">불러오는 중...</div>
          ) : matches.filter((m: any) => userProfile?.can_teach_skills.includes(m.want_to_skill)).length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              가르칠 수 있는 재능
              {userProfile?.can_teach_skills && userProfile.can_teach_skills.length > 0 && `(${userProfile.can_teach_skills.join(", ")})`}
              과 매칭되는 공고가 없습니다.
            </div>
          ) : (
            matches
              .filter((m: any) => userProfile?.can_teach_skills.includes(m.want_to_skill))
              .map((match: any) => (
                <Card key={match.id} className="border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between">
                      <div className="flex gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarFallback className="text-lg bg-green-100 text-green-600 font-bold">{match.username?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-2 flex flex-col justify-center">
                          <div className="font-bold text-lg">{match.username}</div>
                          <div className="text-sm space-y-1 text-slate-700">
                            <div><span className="text-slate-500 mr-2">가르칠 수 있어요:</span>{match.can_teach_skill}</div>
                            <div><span className="text-slate-500 mr-2 text-green-600 font-semibold">배우고 싶어요:</span>{match.want_to_skill}</div>
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => handleSendMessage(match.id, match.username)} className="bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-bold rounded-full">메시지 보내기</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="learn" className="space-y-4 outline-none">
          {isLoading ? (
            <div className="text-center py-10 text-slate-500">불러오는 중...</div>
          ) : matches.filter((m: any) => userProfile?.want_to_skills.includes(m.can_teach_skill)).length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              배우고 싶은 재능
              {userProfile?.want_to_skills && userProfile.want_to_skills.length > 0 && `(${userProfile.want_to_skills.join(", ")})`}
              과 매칭되는 공고가 없습니다.
            </div>
          ) : (
            matches
              .filter((m: any) => userProfile?.want_to_skills.includes(m.can_teach_skill))
              .map((match: any) => (
                <Card key={match.id} className="border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between">
                      <div className="flex gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarFallback className="text-lg bg-orange-100 text-orange-600 font-bold">{match.username?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-2 flex flex-col justify-center">
                          <div className="font-bold text-lg">{match.username}</div>
                          <div className="text-sm space-y-1 text-slate-700">
                            <div><span className="text-slate-500 mr-2 text-orange-600 font-semibold">가르칠 수 있어요:</span>{match.can_teach_skill}</div>
                            <div><span className="text-slate-500 mr-2">배우고 싶어요:</span>{match.want_to_skill}</div>
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => handleSendMessage(match.id, match.username)} className="bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-bold rounded-full">메시지 보내기</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>
      </Tabs>

      {/* Announcement Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="p-6 bg-slate-900 text-white">
              <DialogTitle className="text-xl">{editingId ? "공고 수정하기" : "새로운 재능 교환 공고 등록"}</DialogTitle>
            </DialogHeader>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Skills Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-700">가르칠 수 있는 재능</Label>
                  <select
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm bg-white"
                    value={formData.can_teach_skill}
                    onChange={(e) => setFormData({...formData, can_teach_skill: e.target.value})}
                    required
                  >
                    <option value="" disabled>기술 선택...</option>
                    {mySkills?.can_teach_skill?.map((s: any) => (
                      <option key={s.name} value={s.name}>{s.name} ({s.category})</option>
                    ))}
                    {(!mySkills?.can_teach_skill || mySkills.can_teach_skill.length === 0) && (
                      <option disabled>등록된 재능이 없습니다</option>
                    )}
                  </select>

                  <Label className="text-sm font-bold text-slate-700 block mt-4">가르칠 수 있는 수준</Label>
                  <Input 
                    placeholder="예: 입문, 보통, 심화"
                    value={formData.can_teach_difficulty}
                    onChange={(e) => setFormData({...formData, can_teach_difficulty: e.target.value})}
                    required
                    className="h-11 border-slate-200 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-700">배우고 싶은 재능</Label>
                  <select
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm bg-white"
                    value={formData.want_to_skill}
                    onChange={(e) => setFormData({...formData, want_to_skill: e.target.value})}
                    required
                  >
                    <option value="" disabled>기술 선택...</option>
                    {mySkills?.want_to_skill?.map((s: any) => (
                      <option key={s.name} value={s.name}>{s.name} ({s.category})</option>
                    ))}
                    {(!mySkills?.want_to_skill || mySkills.want_to_skill.length === 0) && (
                      <option disabled>등록된 재능이 없습니다</option>
                    )}
                  </select>
                  
                  <Label className="text-sm font-bold text-slate-700 block mt-4">배우고 싶은 수준</Label>
                  <Input 
                    placeholder="예: 기초부터, 중급과정"
                    value={formData.want_to_difficulty}
                    onChange={(e) => setFormData({...formData, want_to_difficulty: e.target.value})}
                    required
                    className="h-11 border-slate-200 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-700">재능 나눔 메시지 (가르칠 내용)</Label>
                  <textarea 
                    className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-sm"
                    placeholder="상대방에게 가르쳐줄 수 있는 내용을 상세히 적어주세요."
                    value={formData.can_teach_message}
                    onChange={(e) => setFormData({...formData, can_teach_message: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-700">배우고 싶은 점 (요청 사항)</Label>
                  <textarea 
                    className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-sm"
                    placeholder="상대방으로부터 배우고 싶은 점을 자유롭게 적어주세요."
                    value={formData.want_to_message}
                    onChange={(e) => setFormData({...formData, want_to_message: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl font-semibold text-slate-500 hover:text-slate-900"
              >
                취소
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 font-bold"
              >
                {submitting ? "저장 중..." : (editingId ? "변경사항 저장" : "공고 등록하기")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
