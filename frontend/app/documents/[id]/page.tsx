'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '../../context/auth-context'
import { AuthLoading } from '@/components/auth/auth-loading'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LoadingModal } from '@/components/ui/loading-modal'
import axios from 'axios'
import { MAX_LINES_PER_PAGE, MAX_CHARACTERS_PER_LINE } from '@/app/constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Document {
  id: string
  title: string
  originalContent: string
  parsedContent?: string
  correctedContent?: string
  createdAt: string
  status: string
  summary?: string
  keywords?: string[]
  corrections?: string
}

interface Correction {
  line?: number
  content?: string
  original_text?: string
  corrected_text?: string
  startIndex?: number
  endIndex?: number
}

interface TooltipPosition {
  x: number
  y: number
}

interface Knowledge {
  id: string
  name: string
}

export default function DocumentDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [aiCorrection, setAiCorrection] = useState<string>('')
  const [correctedContentText, setCorrectedContentText] = useState<string>('') // 默认的校正后内容
  const [isAiCorrecting, setIsAiCorrecting] = useState(false)
  const [aiCorrectionMessage, setAiCorrectionMessage] = useState('AI校对中...')
  const [isAiCorrectionChanged, setIsAiCorrectionChanged] = useState(false)

  // Correction-related state
  const [corrections, setCorrections] = useState<Correction[]>([])

  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')

  const [knowledges, setKnowledges] = useState([] as Knowledge[])
  const [selectedKnowledgeId, setSelectedKnowledgeId] = useState('')
  const isMounted = useRef(false)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [router])

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${params.id}`)
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('文档未找到')
          }
          throw new Error('获取文档失败')
        }
        const data = await response.json()
        console.log('🚀 ~ file: page.tsx:70 ~ data:', data)
        setDocument(data)
        setEditedTitle(data.title)
        // Set AI correction if available
        if (data.correctedContent) {
          setAiCorrection(data.correctedContent)
          setIsAiCorrectionChanged(false)
        }

        console.log('data.corrections', data.corrections)
        if (data.corrections) {
          const parsedCorrections =
            typeof data.corrections === 'string'
              ? JSON.parse(data.corrections)
              : data.corrections

          console.log(
            '🚀 ~ file: page.tsx:79 ~ parsedCorrections:',
            parsedCorrections
          )

          setCorrections(parsedCorrections)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '发生错误')
      } finally {
        setIsLoading(false)
      }
    }

    const fetchKnowledges = async () => {
      try {
        const response = await fetch('/api/knowledges?pageSize=1000')
        if (!response.ok) {
          throw new Error('Failed to fetch knowledge bases')
        }
        const { items } = await response.json()
        setKnowledges(items)
      } catch (error) {
        console.error('Error fetching knowledge bases:', error)
      }
    }

    if (!authLoading) {
      fetchDocument()
      fetchKnowledges()
    }
  }, [authLoading, params.id, router])

  const handleUpdateTitle = async () => {
    try {
      console.log('[debug1] in handleUpdateTitle')
      const response = await fetch(`/api/documents/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: editedTitle }),
      })

      if (!response.ok) {
        throw new Error('更新文档标题失败')
      }

      const updatedDoc = await response.json()
      setDocument(updatedDoc)
      setIsEditing(false)
      toast.success('标题更新成功')
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新文档失败'
      setError(message)
      toast.error(message)
    }
  }

  const handleAiCorrection = async () => {
    if (!document) return

    setIsAiCorrecting(true)
    setAiCorrectionMessage('AI校对中...')

    try {
      console.log('[debug2] in handleAiCorrection', process.env.API_BASE_URL)
      const baseUrl = `${process.env.API_BASE_URL || 'http://localhost:3001'}`
      const response = await axios.request({
        url: `${baseUrl}/api/fullCorrectByAI`,
        method: 'POST',
        data: {
          content: document.originalContent,
          knowledgeId: selectedKnowledgeId,
        },
        timeout: 5 * 60 * 1000, // 5 minutes timeout
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      })

      const { correctedContent, corrections, markedContent } = response.data
      setAiCorrection(markedContent)
      setCorrections(corrections)
      setCorrectedContentText(correctedContent)
      setIsAiCorrectionChanged(true)

      console.log('[debug2] correctedContent:', correctedContent)

      toast.success('AI校对完成')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI校对失败'
      if (err instanceof Error && err.name === 'AbortError') {
        toast.error('AI校对超时，请重试')
      } else {
        toast.error(message)
      }
    } finally {
      setIsAiCorrecting(false)
      setAiCorrectionMessage('')
    }
  }

  // Save corrections
  const handleSaveCorrections = async () => {
    if (!document) return

    try {
      console.log('[debug3]before handleSaveCorrections')
      const response = await fetch(`/api/documents/${document.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          correctedContent: correctedContentText,
          corrections: JSON.stringify(corrections),
          status: 'ai-corrected',
        }),
      })

      if (!response.ok) {
        throw new Error('保存校对内容失败')
      }

      toast.success('校对内容保存成功')
      router.push('/documents')
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存校对内容失败'
      setError(message)
      toast.error(message)
    }
  }

  const calculateWrappedLines = useCallback((text: string): string[] => {
    if (!text) return []

    const rawLines = text.split('\n')
    const wrappedLines: string[] = []

    rawLines.forEach((line) => {
      if (line.length <= MAX_CHARACTERS_PER_LINE) {
        wrappedLines.push(line)
      } else {
        // Split long lines based on MAX_CHARACTERS_PER_LINE
        let remainingText = line
        while (remainingText.length > 0) {
          // Find the last space within MAX_CHARACTERS_PER_LINE
          let splitIndex = MAX_CHARACTERS_PER_LINE
          if (remainingText.length > MAX_CHARACTERS_PER_LINE) {
            const lastSpace = remainingText.lastIndexOf(
              ' ',
              MAX_CHARACTERS_PER_LINE
            )
            if (lastSpace > 0) {
              splitIndex = lastSpace
            }
          }
          wrappedLines.push(remainingText.slice(0, splitIndex))
          remainingText = remainingText.slice(splitIndex).trim()
        }
      }
    })

    return wrappedLines
  }, [])

  const getCurrentPageContent = useCallback(
    (content: string) => {
      if (!content) return { content: '', charOffset: 0, wrappedLines: [] }

      const wrappedLines = calculateWrappedLines(content)
      const startIdx = (currentPage - 1) * MAX_LINES_PER_PAGE
      const endIdx = Math.min(
        startIdx + MAX_LINES_PER_PAGE,
        wrappedLines.length
      )
      const pageLines = wrappedLines.slice(startIdx, endIdx)

      // Calculate character offset including wrapped lines
      const charOffset =
        wrappedLines.slice(0, startIdx).join('\n').length +
        (startIdx > 0 ? 1 : 0)

      return {
        content: pageLines.join('\n'),
        charOffset,
        wrappedLines: pageLines,
      }
    },
    [currentPage, calculateWrappedLines]
  )

  useEffect(() => {
    if (document?.originalContent) {
      const wrappedLines = calculateWrappedLines(document.originalContent)
      const newTotalPages = Math.ceil(wrappedLines.length / MAX_LINES_PER_PAGE)
      console.log('Document loaded:', {
        totalWrappedLines: wrappedLines.length,
        MAX_LINES_PER_PAGE,
        calculatedTotalPages: newTotalPages,
      })
    }
  }, [document?.originalContent, calculateWrappedLines])

  const totalPages = document
    ? Math.ceil(
        calculateWrappedLines(document.originalContent).length /
          MAX_LINES_PER_PAGE
      )
    : 0

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      setPageInput(page.toString())
    }
  }

  const handleKnowledgeChange = (knowledgeId: string) => {
    setSelectedKnowledgeId(knowledgeId)
  }

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value)
  }

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const newPage = parseInt(pageInput)
      if (!isNaN(newPage)) {
        handlePageChange(newPage)
      }
    }
  }

  // Render highlighted content
  const renderHighlightedContent = (content: string) => {
    if (!content) return null

    const { content: pageContent, charOffset } = getCurrentPageContent(content)

    let lastIndex = 0
    const elements: JSX.Element[] = []

    // Sort corrections by startIndex and filter for current page
    const sortedCorrections = corrections
      .sort((a, b) => (a.startIndex || 0) - (b.startIndex || 0))
      .filter((correction) => {
        // Only include corrections that overlap with the current page
        const correctionStart = (correction.startIndex || 0) - charOffset
        const correctionEnd = (correction.endIndex || 0) - charOffset
        return correctionStart < pageContent.length && correctionEnd > 0
      })
      .map((correction) => ({
        ...correction,
        startIndex: Math.max(0, (correction.startIndex || 0) - charOffset),
        endIndex: Math.min(
          pageContent.length,
          (correction.endIndex || 0) - charOffset
        ),
      }))

    sortedCorrections.forEach((correction, index) => {
      if (
        correction.startIndex >= 0 &&
        correction.endIndex > correction.startIndex
      ) {
        // Add text before highlight
        if (correction.startIndex > lastIndex) {
          elements.push(
            <span key={`text-${index}`}>
              {pageContent.slice(lastIndex, correction.startIndex)}
            </span>
          )
        }

        // Add highlighted text
        elements.push(
          <span
            key={`highlight-${index}`}
            className='bg-yellow-100 border-b-2 border-red-500'
            title={`校对内容: ${correction.corrected_text}`}
          >
            {pageContent.slice(correction.startIndex, correction.endIndex)}
          </span>
        )

        lastIndex = correction.endIndex
      }
    })

    // Add remaining text
    if (lastIndex < pageContent.length) {
      elements.push(<span key='text-end'>{pageContent.slice(lastIndex)}</span>)
    }

    return elements
  }

  const renderHtmlContent = (content: string) => {
    if (!content) return null

    return (
      <div
        dangerouslySetInnerHTML={{
          __html: content,
        }}
        className='document-content-html'
      />
    )
  }

  if (authLoading) {
    return <AuthLoading />
  }

  if (error) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center'>
          <p className='text-red-500 mb-4'>{error}</p>
          <Button onClick={() => router.push('/documents')}>
            返回文档列表
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading || !document) {
    return (
      <div className='flex justify-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900'></div>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex items-center justify-between mb-6'>
        {isEditing ? (
          <>
            <Button onClick={handleUpdateTitle}>保存</Button>
            <Button variant='ghost' onClick={() => setIsEditing(false)}>
              取消
            </Button>
          </>
        ) : (
          <>
            <div>
              <Button variant='outline' asChild>
                <Link href='/documents'>返回列表</Link>
              </Button>
            </div>
            <div className='flex items-center gap-4'>
              <Select
                value={selectedKnowledgeId}
                onValueChange={handleKnowledgeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder='选择知识库' />
                </SelectTrigger>
                <SelectContent>
                  {knowledges.length > 0 &&
                    knowledges.map((knowledge) => (
                      <SelectItem key={knowledge.id} value={knowledge.id}>
                        {knowledge.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAiCorrection}>AI校对</Button>
              {isAiCorrectionChanged && (
                <Button onClick={handleSaveCorrections}>保存校对</Button>
              )}
            </div>
          </>
        )}
      </div>

      <div className='bg-white rounded-lg shadow p-6'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-bold'>{document.title}</h1>
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              document.status === 'corrected'
                ? 'bg-green-100 text-green-800'
                : document.status === 'processing'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {document.status === 'corrected'
              ? '已校对'
              : document.status === 'processing'
              ? '处理中'
              : '未处理'}
          </span>
        </div>

        <div className='space-y-6'>
          {document.summary && (
            <div>
              <h2 className='text-lg font-semibold mb-2'>文档摘要</h2>
              <p className='text-gray-700'>{document.summary}</p>
            </div>
          )}

          {document.keywords && document.keywords.length > 0 && (
            <div>
              <h2 className='text-lg font-semibold mb-2'>关键词</h2>
              <div className='flex flex-wrap gap-2'>
                {document.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className='bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm'
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className='grid grid-cols-2 gap-4'>
            {/* Original Content */}
            <div>
              <h2 className='text-lg font-semibold mb-2'>原始内容</h2>
              <div className='bg-gray-50 p-4 rounded-lg relative h-[600px] overflow-auto'>
                {/* Document content with highlights */}
                <div className='space-y-4'>
                  <div className='flex items-center gap-4'>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className='px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50'
                    >
                      Previous
                    </button>
                    <div className='flex items-center gap-2'>
                      <input
                        type='text'
                        value={pageInput}
                        onChange={handlePageInputChange}
                        onKeyDown={handlePageInputKeyDown}
                        className='w-16 px-2 py-1 text-sm border rounded'
                      />
                      <span className='text-sm text-gray-600'>
                        / {totalPages}
                      </span>
                    </div>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className='px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50'
                    >
                      Next
                    </button>
                  </div>
                  <div className='document-content flex'>
                    <div className='whitespace-pre-wrap text-sm text-gray-700 leading-[1.75rem] max-w-full flex-1'>
                      {document &&
                        renderHighlightedContent(document.originalContent)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Corrected Content */}
            <div>
              <h2 className='text-lg font-semibold mb-2'>AI校对内容</h2>

              <div className='bg-gray-50 p-4 rounded-lg h-[600px] overflow-auto'>
                {aiCorrection ? (
                  <div className='flex'>
                    <div className='whitespace-pre-wrap text-sm text-gray-700 leading-[1.75rem] max-w-full flex-1'>
                      {document && renderHtmlContent(aiCorrection)}
                    </div>
                  </div>
                ) : (
                  <div className='text-sm text-gray-700'>
                    点击&quot;AI校对&quot;按钮开始校对
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Corrections list */}
          {corrections.length > 0 && (
            <div>
              <h2 className='text-lg font-semibold mb-2'>校对列表</h2>
              <div className='space-y-2'>
                {corrections.map((correction, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between bg-yellow-50 p-2 rounded'
                  >
                    <span className='text-sm text-gray-700'>
                      {correction.line}: {correction.content}
                    </span>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        setCorrections((prev) =>
                          prev.filter((_, i) => i !== index)
                        )
                        toast.success('删除校对内容成功')
                      }}
                    >
                      删除
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className='text-sm text-gray-500'>
            创建于 {new Date(document.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
      <LoadingModal
        isOpen={isAiCorrecting}
        message={aiCorrectionMessage}
        title='AI校对'
      />
    </div>
  )
}
