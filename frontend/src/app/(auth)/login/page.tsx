"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import api from "@/lib/api"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [msg, setMsg] = useState(registered === "true" ? "회원가입이 완료되었습니다. 이메일 인증 후 로그인해주세요." : "")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMsg("")
    setLoading(true)

    try {
      const response = await api.post("/auth/login", { email, password })
      localStorage.setItem("access_token", response.data.access_token)
      window.location.href = "/" // use window.location to trigger full app reload for context
    } catch (err: any) {
      setError(err.response?.data?.detail || "아이디 또는 비밀번호가 올바르지 않거나 이메일 인증이 필요합니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    if (!email) {
      setError("이메일을 입력해주세요.")
      return
    }
    setError("")
    try {
      await api.get(`/auth/send_email?email=${encodeURIComponent(email)}`)
      setMsg("인증 이메일이 재전송되었습니다.")
    } catch (err: any) {
      setError("이메일 발송에 실패했습니다.")
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="pt-6">
        {msg && <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-lg">{msg}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">이메일</label>
            <Input 
              type="email" 
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">비밀번호</label>
              <button type="button" onClick={handleResendEmail} className="text-xs text-blue-600 hover:underline">
                인증 메일 재전송
              </button>
            </div>
            <Input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="text-sm text-red-500 break-words">{error}</div>}

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          계정이 없으신가요?{" "}
          <Link href="/register" className="text-blue-600 hover:underline font-medium">
            회원가입
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
