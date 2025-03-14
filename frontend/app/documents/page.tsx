'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../context/auth-context'
import { AuthLoading } from '@/components/auth/auth-loading'
import { Button } from '@/components/ui/button'
import { downloadDocument } from '@/lib/download-utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatFileSize, formatDate } from '@/lib/utils'
import { Download } from 'lucide-react'

interface Document {
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
  data: Document[]
}

export default function DocumentsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(5)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(
          `/api/get_wd?page=${page}&limit=${pageSize}`
        )
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('获取文档列表失败')
        }
        const data: PaginationResponse = await response.json()
        setDocuments(data.data)
        setTotal(data.count)
        setTotalPages(Math.ceil(data.count / pageSize))
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : '发生错误')
        setIsLoading(false)
      }
    }
    if (!authLoading) {
      fetchDocuments()
    }
  }, [authLoading, page, pageSize, router])

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定要删除文档 "${name}" 吗？此操作不可恢复。`)) {
      return
    }

    setIsDeleting(id)
    try {
      const response = await fetch(`/api/del_doc/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('删除文档失败')
      }

      // Remove the document from the list
      setDocuments((prev) => prev.filter((doc) => doc.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除文档时发生错误')
    } finally {
      setIsDeleting(null)
    }
  }

  if (authLoading) {
    return <AuthLoading />
  }

  if (error) {
    return <div className='text-center text-red-500 p-4'>错误: {error}</div>
  }

  return (
    <div className='container mx-auto py-10'>
      <div className='flex flex-col gap-4'>
        <div className='flex justify-between items-center'>
          <h1 className='text-2xl font-bold'>文档列表</h1>
          <Link href='/upload?mode=document'>
            <Button>上传新文档</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className='flex justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900'></div>
          </div>
        ) : documents.length === 0 ? (
          <div className='text-center py-12 bg-gray-50 rounded-lg'>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>暂无文档</h3>
            <p className='text-gray-500 mb-4'>上传您的第一个文档开始使用</p>
            <Link href='/upload?mode=document'>
              <Button>上传文档</Button>
            </Link>
          </div>
        ) : (
          <div className='bg-white rounded-lg shadow overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-1/4'>文档名</TableHead>
                  <TableHead className='w-1/6'>所有者</TableHead>
                  <TableHead className='w-1/6'>状态</TableHead>
                  <TableHead className='w-1/6'>创建时间</TableHead>
                  <TableHead className='w-1/4'>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className='font-medium'>{doc.name}</TableCell>
                    <TableCell>{doc.owner}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          doc.status === '有错误'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(doc.create_time)}</TableCell>
                    <TableCell>
                      <div className='flex space-x-2'>
                        <Link href={`/documents/${doc.id}`}>
                          <Button variant='outline' size='sm'>
                            查看详情
                          </Button>
                        </Link>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => downloadDocument(doc.id, 'original')}
                        >
                          <Download className='h-4 w-4' />
                          下载原文
                        </Button>
                        {doc.dest && (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => downloadDocument(doc.id, 'corrected')}
                          >
                            <Download className='h-4 w-4' />
                            下载更正版
                          </Button>
                        )}
                        <Button
                          variant='destructive'
                          size='sm'
                          onClick={() => handleDelete(doc.id, doc.name)}
                          disabled={isDeleting === doc.id}
                        >
                          {isDeleting === doc.id ? '删除中...' : '删除'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <div className='flex items-center justify-between px-4 py-3 border-t'>
              <div className='flex items-center gap-2'>
                <span className='text-sm text-gray-700'>
                  共 {total} 条记录，第 {page}/{totalPages} 页
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  上一页
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}