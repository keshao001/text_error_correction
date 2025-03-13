'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/auth-context'
import { AuthLoading } from '@/components/auth/auth-loading'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { KnowledgeModal } from '@/components/knowledge/create-knowledge-modal'

// interface Knowledge {
//   id: string
//   name: string
//   desc: string
//   createdAt: string
//   updatedAt: string
//   fileCount: number
// }
//
// interface PaginationResponse {
//   items: Knowledge[]
//   pagination: {
//     total: number
//     page: number
//     pageSize: number
//     totalPages: number
//   }
// }
interface Knowledge {
  id: number
  name: string
  src: string
  dest: string
  owner: string
  status: string
  create_time: string
}

interface PaginationResponse {
  code: number
  msg: string
  count: number
  data: Knowledge[]
}

export default function KnowledgesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [knowledges, setKnowledges] = useState<Knowledge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchKnowledges = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/get_knowledge')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch knowledges')
      }
      const data = await response.json()
      setKnowledges(data.data)
    } catch (error) {
      console.error('Error fetching knowledges:', error)
      setError('Failed to fetch knowledge bases')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (!authLoading) {
      fetchKnowledges()
    }
  }, [authLoading, router, fetchKnowledges])

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this knowledge base?')) {
      return
    }

    try {
      const response = await fetch(`/api/del_doc/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete knowledge base')
      }

      setKnowledges(knowledges.filter((k) => k.id !== id))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete knowledge base'
      )
    }
  }

  const handleCreateSuccess = (newKnowledge: Knowledge) => {
    setKnowledges((prev) => [...prev, newKnowledge])
  }

  const handleRefresh = () => {
    fetchKnowledges()
  }

  if (authLoading) {
    return <AuthLoading />
  }

  if (error) {
    return (
      <div className='text-center py-8'>
        <p className='text-red-500 mb-4'>{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-bold'>Knowledge Bases</h1>
        <KnowledgeModal mode='create' onComplete={handleRefresh} />
      </div>

      {loading ? (
        <div className='text-center py-8'>
          <p>Loading...</p>
        </div>
      ) : knowledges.length === 0 ? (
        <div className='text-center py-8 bg-gray-50 rounded-lg'>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No Knowledge Bases
          </h3>
          <p className='text-gray-500 mb-4'>
            Create your first knowledge base to get started
          </p>
        </div>
      ) : (
        <div className='bg-white rounded-lg shadow'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>文件名</TableHead>
                <TableHead>文件描述</TableHead>
                <TableHead>上传人员</TableHead>
                <TableHead>创建时间</TableHead>
                {/*<TableHead>更新时间</TableHead>*/}
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {knowledges.map((knowledge) => (
                <TableRow key={knowledge.id}>
                  <TableCell className='font-medium'>
                    {knowledge.name}
                  </TableCell>
                  <TableCell>{knowledge.status}</TableCell>
                  <TableCell>{knowledge.owner}</TableCell>
                  <TableCell>
                    {new Date(knowledge.create_time).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      {/*<KnowledgeModal*/}
                      {/*  mode='edit'*/}
                      {/*  knowledge={knowledge}*/}
                      {/*  onComplete={handleRefresh}*/}
                      {/*/>*/}
                      <Link href={`/knowledges/${knowledge.id}`}>
                        <Button variant='outline' size='sm'>
                          查看文件
                        </Button>
                      </Link>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleDelete(knowledge.id)}
                        className='text-red-600 hover:text-red-700'
                      >
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
