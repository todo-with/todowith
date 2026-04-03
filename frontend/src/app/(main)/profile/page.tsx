"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useUserProfileContext } from "@/context/UserProfileContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useQueryClient } from "@tanstack/react-query"
import { useAllSkills, useUpdateProfile } from "@/hooks/useQueries"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Edit2, Save, X, User as UserIcon, BookOpen, GraduationCap } from "lucide-react"

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfileContext()
  const { data: mySkills, isLoading: isMySkillsLoading } = useAllSkills()
  const updateProfile = useUpdateProfile()

  const [canTeach, setCanTeach] = useState<any[]>([])
  const [wantToLearn, setWantToLearn] = useState<any[]>([])
  
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")

  useEffect(() => {
    if (userProfile) {
      setEditName(userProfile.name || "")
      setEditDescription(userProfile.description || "")
    }
  }, [userProfile])

  useEffect(() => {
    if (mySkills) {
      setCanTeach(mySkills.can_teach_skill || [])
      setWantToLearn(mySkills.want_to_skill || [])
    }
  }, [mySkills])

  const handleSave = () => {
    updateProfile.mutate({
      name: editName,
      description: editDescription
    }, {
      onSuccess: () => {
        setIsEditing(false)
      }
    })
  }


  if (isProfileLoading || isMySkillsLoading) {
    return <div className="text-center py-20 text-slate-500">프로필을 불러오는 중...</div>
  }


  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">프로필 요약</h1>
          <p className="text-slate-600">나의 정보를 확인하고 관리하세요</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: User Info Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-none shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/20 overflow-hidden">
                <img 
                  src="/duck_profile.png" 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {isEditing ? (
                <div className="w-full space-y-3">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">이름</label>
                    <Input 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-10 px-4"
                      placeholder="이름을 입력하세요"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">자기소개</label>
                    <Textarea 
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 min-h-[100px] px-4 py-3"
                      placeholder="자신을 소개해 보세요"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handleSave} 
                      disabled={updateProfile.isPending}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 rounded-xl"
                    >
                      <Save className="w-4 h-4 mr-2" /> 저장
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsEditing(false)
                        setEditName(userProfile?.name || "")
                        setEditDescription(userProfile?.description || "")
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white font-bold h-10 px-3 rounded-xl border border-white/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold">{userProfile?.name}</h2>
                    <p className="text-slate-400 text-sm">{userProfile?.email}</p>
                  </div>

                  {userProfile?.description && (
                    <div className="w-full pt-6 border-t border-white/10 mt-2">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">자기소개</p>
                      <p className="text-sm text-slate-200 bg-white/5 p-4 rounded-xl border border-white/5 leading-relaxed text-left italic">
                        "{userProfile.description}"
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="w-full mt-4 bg-white/10 hover:bg-white/20 text-blue-400 font-bold h-10 rounded-xl border border-white/10"
                  >
                    <Edit2 className="w-4 h-4 mr-2" /> 프로필 수정
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Skill Management Card */}
        <div className="md:col-span-2 space-y-6">
          {/* Currently Teaching */}
          <Card className="border-slate-200/60 shadow-sm overflow-hidden mb-6 bg-slate-50 py-0 gap-0">
            <CardHeader className="py-5 px-6 border-b border-slate-200/60 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                가르칠 수 있는 재능
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2">
                {canTeach.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">등록된 기술이 없습니다.</p>
                ) : (
                  canTeach.map(skill => (
                    <Badge
                      key={skill.name}
                      className="bg-blue-50 text-blue-700 border-blue-100 gap-1.5 px-3 py-1.5 rounded-lg"
                    >
                      {skill.name}
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Currently Learning */}
          <Card className="border-slate-200/60 shadow-sm overflow-hidden mb-6 bg-slate-50 py-0 gap-0">
            <CardHeader className="py-5 px-6 border-b border-slate-200/60 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-orange-500" />
                배우고 싶은 재능
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2">
                {wantToLearn.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">등록된 기술이 없습니다.</p>
                ) : (
                  wantToLearn.map(skill => (
                    <Badge
                      key={skill.name}
                      className="bg-orange-50 text-orange-700 border-orange-100 gap-1.5 px-3 py-1.5 rounded-lg"
                    >
                      {skill.name}
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Link href="/profile/skills">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-10 h-14 gap-2 font-bold shadow-md text-lg">
                스킬 관리 페이지 가기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

