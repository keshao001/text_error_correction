'use client'

export const dynamic = 'force-dynamic'

import { useAuth } from './context/auth-context'
import { AuthLoading } from '@/components/auth/auth-loading'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function Home() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <AuthLoading />
  }

  return (
    <div className='space-y-8'>
      <div className='text-center space-y-4'>
        <h1 className='text-4xl font-bold'>欢迎 {user?.email || ''}</h1>
        <p className='text-gray-600'>{user?.email ? '您已登录。' : ''}</p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto'>
        <Link href='/upload?mode=document' className='block'>
          <div className='border rounded-lg p-6 hover:border-blue-500 transition-colors'>
            <h2 className='text-xl font-semibold mb-2'>上传文档</h2>
            <p className='text-gray-600'>使用智能API解析和上传文档</p>
          </div>
        </Link>

        <Link href='/documents' className='block'>
          <div className='border rounded-lg p-6 hover:border-blue-500 transition-colors'>
            <h2 className='text-xl font-semibold mb-2'>我的文档</h2>
            <p className='text-gray-600'>查看和管理您上传的文档</p>
          </div>
        </Link>

        <Link href='/knowledges' className='block'>
          <div className='border rounded-lg p-6 hover:border-blue-500 transition-colors'>
            <h2 className='text-xl font-semibold mb-2'>知识库</h2>
            <p className='text-gray-600'>访问和管理您的知识文档</p>
          </div>
        </Link>

        {/* {!user?.isDefaultUser && (
          <Link href="/settings" className="block">
            <div className="border rounded-lg p-6 hover:border-blue-500 transition-colors">
              <h2 className="text-xl font-semibold mb-2">设置</h2>
              <p className="text-gray-600">
                管理您的账户设置
              </p>
            </div>
          </Link>
        )} */}

        <Link href='/conversations' className='block'>
          <div className='border rounded-lg p-6 hover:border-blue-500 transition-colors'>
            <h2 className='text-xl font-semibold mb-2'>与模型对话</h2>
            <p className='text-gray-600'>使用AI模型与您对话</p>
          </div>
        </Link>
      </div>

      {/* {!user?.email && (
        <div className='text-center mt-8'>
          <p className='text-gray-600 mb-4'>想要保持文档私密性？</p>
          <div className='space-x-4'>
            <Link href='/signup'>
              <Button>注册</Button>
            </Link>
            <Link href='/login'>
              <Button variant='outline'>登录</Button>
            </Link>
          </div>
        </div>
      )} */}
    </div>
  )
}
