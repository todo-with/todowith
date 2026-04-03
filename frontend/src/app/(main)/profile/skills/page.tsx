"use client"

import { useState, useEffect } from "react"
import { useAllSkills, useAvailableSkills } from "@/hooks/useQueries"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, X, Save, BookOpen, GraduationCap, Search, ArrowLeft } from "lucide-react"
import api from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ProfileSkillsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: mySkills, isLoading: isMySkillsLoading } = useAllSkills()
  
  const [canTeach, setCanTeach] = useState<any[]>([])
  const [wantToLearn, setWantToLearn] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  const [teachKeyword, setTeachKeyword] = useState("")
  const [learnKeyword, setLearnKeyword] = useState("")

  const { data: availableTeachSkills } = useAvailableSkills(teachKeyword)
  const { data: availableLearnSkills } = useAvailableSkills(learnKeyword)

  useEffect(() => {
    if (mySkills) {
      setCanTeach(mySkills.can_teach_skill || [])
      setWantToLearn(mySkills.want_to_skill || [])
    }
  }, [mySkills])

  const handleAddSkill = (skill: any, type: 'teach' | 'learn') => {
    if (type === 'teach') {
      if (!canTeach.find(s => s.name === skill.name)) {
        setCanTeach([...canTeach, skill])
      }
    } else {
      if (!wantToLearn.find(s => s.name === skill.name)) {
        setWantToLearn([...wantToLearn, skill])
      }
    }
  }

  const handleRemoveSkill = (skillName: string, type: 'teach' | 'learn') => {
    if (type === 'teach') {
      setCanTeach(canTeach.filter(s => s.name !== skillName))
    } else {
      setWantToLearn(wantToLearn.filter(s => s.name !== skillName))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch('/skill/can_teach', { can_teach_skill: canTeach })
      await api.patch('/skill/want_to', { want_to_skill: wantToLearn })
      
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      await queryClient.invalidateQueries({ queryKey: ['allSkills'] })
      
      alert('스킬 정보가 성공적으로 수정되었습니다.')
      router.push('/profile')
    } catch (e) {
      console.error(e)
      alert('스킬 수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (isMySkillsLoading) {
    return <div className="text-center py-20 text-slate-500">정보를 불러오는 중...</div>
  }

  const teachList = Array.isArray(availableTeachSkills) ? availableTeachSkills : []
  const learnList = Array.isArray(availableLearnSkills) ? availableLearnSkills : []

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div className="space-y-4">
          <Link href="/profile" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> 돌아가기
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">스킬 관리</h1>
            <p className="text-slate-600">나의 재능을 추가하고 배울 수 있는 기회를 넓혀보세요</p>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 gap-2 font-bold shadow-lg shadow-blue-200"
        >
          <Save className="w-5 h-5" />
          {saving ? "저장 중..." : "변경사항 저장"}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Currently Teaching */}
        <Card className="border-slate-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              가르칠 수 있는 재능
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-2 mb-6 p-4 bg-slate-50 rounded-xl min-h-[4rem]">
              {canTeach.length === 0 ? (
                <p className="text-sm text-slate-400 italic flex items-center h-full">등록된 기술이 없습니다.</p>
              ) : (
                canTeach.map(skill => (
                  <Badge 
                    key={skill.name} 
                    className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 gap-1.5 px-3 py-1.5 rounded-lg transition-all group"
                  >
                    {skill.name}
                    <button onClick={() => handleRemoveSkill(skill.name, 'teach')} className="opacity-50 group-hover:opacity-100 hover:text-red-500 transition-opacity">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </Badge>
                ) )
              )}
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-4">
                <p className="text-sm font-bold text-slate-700">추가할 기술 검색</p>
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input 
                    placeholder="기술 검색 (예: 파이썬)" 
                    value={teachKeyword}
                    onChange={(e) => setTeachKeyword(e.target.value)}
                    className="pl-9 h-9 text-sm rounded-lg border-slate-200 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                {teachList.filter(s => !canTeach.find(ct => ct.name === s.name)).length === 0 ? (
                  <p className="text-sm text-slate-400 p-2">선택할 수 있는 기술이 없습니다.</p>
                ) : (
                  teachList.filter(s => !canTeach.find(ct => ct.name === s.name)).map(skill => (
                    <Button 
                      key={skill.name}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSkill(skill, 'teach')}
                      className="rounded-lg border-slate-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 gap-1.5 text-xs h-8"
                    >
                      <Plus className="w-3 h-3" />
                      {skill.name}
                    </Button>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currently Learning */}
        <Card className="border-slate-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-orange-500" />
              배우고 싶은 재능
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-2 mb-6 p-4 bg-slate-50 rounded-xl min-h-[4rem]">
              {wantToLearn.length === 0 ? (
                <p className="text-sm text-slate-400 italic flex items-center h-full">등록된 기술이 없습니다.</p>
              ) : (
                wantToLearn.map(skill => (
                  <Badge 
                    key={skill.name} 
                    className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200 gap-1.5 px-3 py-1.5 rounded-lg transition-all group"
                  >
                    {skill.name}
                    <button onClick={() => handleRemoveSkill(skill.name, 'learn')} className="opacity-50 group-hover:opacity-100 hover:text-red-500 transition-opacity">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </Badge>
                ) )
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-4">
                <p className="text-sm font-bold text-slate-700">추가할 기술 검색</p>
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input 
                    placeholder="기술 검색 (예: 피아노)" 
                    value={learnKeyword}
                    onChange={(e) => setLearnKeyword(e.target.value)}
                    className="pl-9 h-9 text-sm rounded-lg border-slate-200 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                {learnList.filter(s => !wantToLearn.find(wt => wt.name === s.name)).length === 0 ? (
                  <p className="text-sm text-slate-400 p-2">선택할 수 있는 기술이 없습니다.</p>
                ) : (
                  learnList.filter(s => !wantToLearn.find(wt => wt.name === s.name)).map(skill => (
                    <Button 
                      key={skill.name}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSkill(skill, 'learn')}
                      className="rounded-lg border-slate-200 hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600 gap-1.5 text-xs h-8"
                    >
                      <Plus className="w-3 h-3" />
                      {skill.name}
                    </Button>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
