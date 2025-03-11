'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { Pagination } from '@/components/pagination'

interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: Array<{
    id: string
    content: string
    sender: 'user' | 'ai'
    timestamp: number
  }>
}

interface RESPONSE_NEW_CONVERSATION {
  conversation: Conversation
  message: string
}

const dateTimeFormatter = (dateTime: string) => {
  // convert create time to a more readable format
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    // timeZone: 'UTC',
  })
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [newConversationTitle, setNewConversationTitle] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 5
  const router = useRouter()

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch(
          `/api/conversations?page=${currentPage}&pageSize=${pageSize}`
        )
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login')
            return
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data: {
          conversations: Conversation[]
          message: string
          total: number
        } = await response.json()

        // Validate data
        if (!Array.isArray(data.conversations)) {
          console.error('Received invalid conversations data:', data)
          setConversations([])
          return
        }

        setConversations(data.conversations)
        setTotalPages(Math.ceil(data.total / pageSize))
      } catch (error) {
        console.error('获取对话列表失败:', error)
        setConversations([])
      }
    }

    fetchConversations()
  }, [currentPage, router])

  // Create new conversation
  const handleCreateConversation = async () => {
    if (!newConversationTitle.trim()) return

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newConversationTitle,
          model: 'qwen-72b',
        }),
      })

      if (response.ok) {
        const res = await response.json()
        router.push(`/conversations/${res.conversation.id}`)
      }
    } catch (error) {
      console.error('创建对话失败:', error)
    }
  }

  const handleDelete = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Immediately update UI
        setConversations(conversations.filter((c) => c.id !== conversationId))

        // Fetch fresh data to ensure consistency
        const freshData = await fetch(
          `/api/conversations?page=${currentPage}&pageSize=${pageSize}`
        ).then((res) => res.json())
        if (freshData.conversations) {
          setConversations(freshData.conversations)
          setTotalPages(Math.ceil(freshData.total / pageSize))
        }
      } else {
        console.error('Failed to delete conversation')
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  return (
    <div className='container mx-auto max-w-4xl p-4'>
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle>开始新对话</CardTitle>
        </CardHeader>
        <CardContent className='flex space-x-2'>
          <Input
            value={newConversationTitle}
            onChange={(e) => setNewConversationTitle(e.target.value)}
            placeholder='输入对话标题'
            onKeyDown={(e) => e.key === 'Enter' && handleCreateConversation()}
          />
          <Button onClick={handleCreateConversation}>创建对话</Button>
        </CardContent>
      </Card>

      <div className='space-y-4'>
        <h2 className='text-2xl font-semibold'>最近对话</h2>
        {conversations.length === 0 ? (
          <p className='text-gray-500'>暂无对话</p>
        ) : (
          <>
            {conversations.map((conversation) => (
              <Card key={conversation.id}>
                <CardContent className='flex justify-between items-center p-4'>
                  <div>
                    <h3 className='text-lg font-medium'>
                      {conversation.title}
                    </h3>
                    <p className='text-sm text-gray-500'>
                      更新时间：{dateTimeFormatter(conversation.updatedAt)}
                    </p>
                    <p className='text-sm text-gray-500'>
                      消息数：{conversation.messages.length}
                    </p>
                  </div>
                  <div className='flex space-x-4'>
                    <Link href={`/conversations/${conversation.id}`}>
                      <Button variant='outline'>继续对话</Button>
                    </Link>
                    <Button
                      variant='destructive'
                      onClick={() => handleDelete(conversation.id)}
                    >
                      删除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
