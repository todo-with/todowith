"use client"

import { useState, useEffect } from "react"
import { useUserProfileContext } from "@/context/UserProfileContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User as UserIcon, BookOpen, GraduationCap } from "lucide-react"
import Link from "next/link"

import { useQueryClient } from "@tanstack/react-query"
import { useAllSkills } from "@/hooks/useQueries"

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfileContext()
  const { data: mySkills, isLoading: isMySkillsLoading } = useAllSkills()

  const [canTeach, setCanTeach] = useState<any[]>([])
  const [wantToLearn, setWantToLearn] = useState<any[]>([])

  useEffect(() => {
    if (mySkills) {
      setCanTeach(mySkills.can_teach_skill || [])
      setWantToLearn(mySkills.want_to_skill || [])
    }
  }, [mySkills])


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
              <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <UserIcon className="w-12 h-12 text-blue-400" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold">{userProfile?.name}</h2>
                <p className="text-slate-400 text-sm">{userProfile?.email}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Skill Management Card */}
        <div className="md:col-span-2 space-y-6">
          {/* Currently Teaching */}
          <Card className="border-slate-100 shadow-sm overflow-hidden mb-6">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
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
          <Card className="border-slate-100 shadow-sm overflow-hidden mb-6">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
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
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 gap-2 font-bold shadow-sm">
                스킬 관리 페이지 가기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

