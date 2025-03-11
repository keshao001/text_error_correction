'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/app/context/auth-context'

export function AuthStatus() {
  const { user, logout, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className='flex items-center gap-4'>
        <span className='text-sm text-gray-600'>Loading...</span>
      </div>
    )
  }

  return (
    <div className='flex items-center gap-4'>
      {user ? (
        <>
          <span className='text-sm text-gray-600'>
            {user.email || '--'}
          </span>
          <Button variant='outline' size='sm' onClick={() => logout()}>
            退出登录
          </Button>
        </>
      ) : (
        <>
          <Link href='/login'>
            <Button variant='outline' size='sm'>
              登录
            </Button>
          </Link>
          <Link href='/signup'>
            <Button variant='default' size='sm'>
              注册
            </Button>
          </Link>
        </>
      )}
    </div>
  )
}
