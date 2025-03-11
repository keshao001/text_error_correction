'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/app/context/auth-context'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { signup } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await signup(email, password)
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败')
    }
  }

  return (
    <div className='container max-w-md mx-auto mt-20'>
      <Card>
        <CardHeader>
          <CardTitle>用户注册</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {error && <div className='text-sm text-red-500 mb-4'>{error}</div>}
            <div className='space-y-2'>
              <Input
                type='email'
                placeholder='邮箱'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className='space-y-2'>
              <Input
                type='password'
                placeholder='密码'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type='submit' className='w-full'>
              注册
            </Button>
            <div className='text-center text-sm text-gray-600'>
              已有账号？{' '}
              <Link href='/login' className='text-blue-600 hover:underline'>
                立即登录
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
