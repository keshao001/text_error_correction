'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../context/auth-context'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, isLoading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const setDefaultUserCredentials = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault()
    setEmail('default@user.local')
    setPassword('123456')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setError('')
    setIsSubmitting(true)

    try {
      await login(email, password)
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='container max-w-md mx-auto mt-20'>
      <Card>
        <CardHeader>
          <CardTitle>用户登录</CardTitle>
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
            <Button
              type='submit'
              className='w-full'
              disabled={isLoading || isSubmitting}
            >
              {isSubmitting ? '登录中...' : '登录'}
            </Button>
            <div className='text-center text-sm text-gray-600'>
              还没有账号？{' '}
              <Link href='/signup' className='text-blue-600 hover:underline'>
                立即注册
              </Link>
            </div>
            <div className='text-center'>
              <Button
                variant='ghost'
                className='text-sm text-green-400 hover:text-green-300 outline'
                onClick={setDefaultUserCredentials}
              >
                使用访客账户
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
