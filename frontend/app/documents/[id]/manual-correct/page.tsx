'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Target, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Correction {
  originalText: string
  correctedText: string
  isSelected?: boolean
  position: { start: number; end: number }
}

interface Document {
  id: string
  title: string
  originalContent: string
  correctedContent: string
}

export default function ManualCorrectPage({
  params,
}: {
  params: { id: string }
}) {
  const [mdocument, setMDocument] = useState<Document | null>(null)
  const [corrections, setCorrections] = useState<Correction[]>([])
  const [selectedText, setSelectedText] = useState('')
  const [correctedText, setCorrectedText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${params.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch document')
        }
        const data = await response.json()
        if (!data.correctedContent || data.correctedContent === '') {
          data.correctedContent = data.originalContent
        }
        setMDocument(data)
        if (data.status === 'manual-corrected' && data.corrections) {
          const parsedCorrections =
            typeof data.corrections === 'string'
              ? JSON.parse(data.corrections)
              : data.corrections
          setCorrections(parsedCorrections)
        }
      } catch (error) {
        console.error('Error fetching document:', error)
        toast.error('Failed to load document')
      }
    }

    fetchDocument()
  }, [params.id])

  useEffect(() => {
    if (typeof window === 'undefined' || !mdocument) return

    const highlightCorrection = () => {
      const contentElement = document.querySelector('.whitespace-pre-wrap')
      if (!contentElement) return

      // Remove any existing highlights
      const existingHighlights = contentElement.querySelectorAll(
        '.correction-highlight'
      )
      existingHighlights.forEach((el) => el.replaceWith(el.textContent || ''))

      // Create a temporary div to help with text node manipulation
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = mdocument.correctedContent

      corrections.forEach((correction) => {
        const { start, end } = correction.position

        // Create a range and highlight
        const range = document.createRange()

        // Traverse text nodes to find the correct positioning
        let currentLength = 0
        let startNode: Node | null = null
        let endNode: Node | null = null

        const walker = document.createTreeWalker(
          contentElement,
          NodeFilter.SHOW_TEXT,
          null
        )

        let textNode: Node | null
        while ((textNode = walker.nextNode())) {
          const nodeLength = textNode.textContent?.length || 0

          // Check for start node
          if (currentLength <= start && start < currentLength + nodeLength) {
            startNode = textNode
            range.setStart(textNode, start - currentLength)
          }

          // Check for end node
          if (currentLength <= end && end < currentLength + nodeLength) {
            endNode = textNode
            range.setEnd(textNode, end - currentLength)
            break
          }

          currentLength += nodeLength
        }

        // Only highlight if both start and end nodes are found
        if (startNode && endNode) {
          const highlightSpan = document.createElement('span')
          highlightSpan.className = 'correction-highlight'
          if (correction.isSelected) {
            highlightSpan.style.backgroundColor = 'yellow'
          } else {
            highlightSpan.style.backgroundColor = 'lightyellow'
          }
          highlightSpan.style.textDecoration = 'underline'
          highlightSpan.style.textDecorationColor = 'red'
          highlightSpan.style.textDecorationThickness = '2px'

          try {
            range.surroundContents(highlightSpan)
          } catch (error) {
            console.error('Highlighting error:', error)
          }
        }
      })
    }

    // Delay to ensure DOM is updated
    const timeoutId = setTimeout(highlightCorrection, 100)

    return () => clearTimeout(timeoutId)
  }, [corrections, mdocument])

  const handleTextSelection = () => {
    if (typeof window === 'undefined') return // Guard for server-side rendering

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const text = range.toString().trim()
    if (text && typeof document !== 'undefined') {
      // Create a span element with the desired styles
      const span = document.createElement('span')
      span.style.backgroundColor = 'yellow'
      span.style.textDecoration = 'underline'
      span.style.textDecorationColor = 'red'
      span.style.textDecorationThickness = '2px'
      span.textContent = text

      // Delete the selected content and insert our styled span
      range.deleteContents()
      range.insertNode(span)
    }

    setSelectedText(text)
    setCorrectedText(text)
  }

  const handleCorrection = () => {
    if (!selectedText || !mdocument) return

    if (correctedText.trim() === '') {
      setShowConfirmDialog(true)
      return
    }

    applyCorrection()
  }

  const applyCorrection = () => {
    if (!mdocument || !selectedText) return

    if (selectedText === correctedText) {
      toast.warning('信息没有改动')
      return
    }

    // Update document content with the correction
    const newContent = mdocument.correctedContent.replace(
      selectedText,
      correctedText
    )

    setMDocument({
      ...mdocument,
      correctedContent: newContent,
    })

    const newCorrection: Correction = {
      originalText: selectedText,
      correctedText: correctedText,
      isSelected: false,
      position: {
        start: newContent.indexOf(correctedText),
        end: newContent.indexOf(correctedText) + correctedText.length,
      },
    }

    const new_corrections = [...corrections, newCorrection].sort(
      (a, b) => a.position.start - b.position.start
    )
    setCorrections(new_corrections)
    setSelectedText('')
    setCorrectedText('')
    setShowConfirmDialog(false)
  }

  const handleSave = async () => {
    if (!mdocument) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/documents/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          correctedContent: mdocument.correctedContent,
          corrections: JSON.stringify(corrections),
          status: 'manual-corrected',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save corrections')
      }

      toast.success('Corrections saved successfully')
      router.push('/documents')
      router.refresh()
    } catch (error) {
      console.error('Error saving corrections:', error)
      toast.error('Failed to save corrections')
    } finally {
      setIsSaving(false)
    }
  }

  const cancelCorrection = (index: number) => {
    const _correction = corrections[index]
    const newCorrections = [...corrections]
    newCorrections.splice(index, 1)
    if (mdocument) {
      // revert the content
      const newContent =
        mdocument.correctedContent.substring(0, _correction.position.start) +
        _correction.originalText +
        mdocument.correctedContent.substring(_correction.position.end)
      setMDocument({
        ...mdocument,
        correctedContent: newContent,
      })
    }
    setCorrections(newCorrections)
  }

  const gotoCorrection = (index: number) => {
    // set other corrections to false
    const newCorrections = [...corrections]
    newCorrections.forEach((c) => (c.isSelected = false))
    newCorrections[index].isSelected = true

    // Scroll to the correction highlight
    setTimeout(() => {
      const contentElement = document.querySelector('.whitespace-pre-wrap')
      const highlights = contentElement?.querySelectorAll(
        '.correction-highlight'
      )

      if (highlights && highlights.length > 0) {
        const targetHighlight = highlights[index]

        if (targetHighlight) {
          targetHighlight.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          })
        }
      }
    }, 100)

    setCorrections([...newCorrections])
  }

  if (!mdocument) {
    return <div>Loading...</div>
  }

  return (
    <div className='container py-6'>
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-bold'>手动校对</h1>
        <Button
          onClick={handleSave}
          disabled={isSaving || corrections.length === 0}
        >
          {isSaving ? '保存中...' : '保存校对'}
        </Button>
      </div>
      <div className='grid grid-cols-2 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <h2 className='text-lg font-semibold mb-2'>文档内容</h2>
            <ScrollArea className='h-[600px]' onMouseUp={handleTextSelection}>
              <div className='whitespace-pre-wrap'>
                {mdocument?.correctedContent}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <div className='space-y-4'>
          <Card>
            <CardContent className='p-4'>
              <h2 className='text-lg font-semibold mb-2'>当前选择</h2>
              <div className='space-y-2'>
                <div>
                  <label className='text-sm font-medium'>原始文字:</label>
                  <div className='p-2 bg-muted rounded'>{selectedText}</div>
                </div>
                <div>
                  <label className='text-sm font-medium'>校对文字:</label>
                  <textarea
                    className='w-full p-2 border rounded'
                    value={correctedText}
                    onChange={(e) => setCorrectedText(e.target.value)}
                    placeholder='清空以删除选中文本'
                  />
                </div>
                <Button onClick={handleCorrection} disabled={!selectedText}>
                  应用校对
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4'>
              <h2 className='text-lg font-semibold mb-2'>校对列表</h2>
              <ScrollArea className='h-[300px]'>
                <div className='space-y-2'>
                  {corrections.map((correction, index) => (
                    <div key={index} className='p-2 border my-8 rounded'>
                      位置: {correction.position.start} -{' '}
                      {correction.position.end} &nbsp;&nbsp;
                      <Button
                        variant='outline'
                        onClick={() => gotoCorrection(index)}
                      >
                        <Target className='mr-2' size={16} color='#4ade80' />
                        定位
                      </Button>
                      &nbsp;&nbsp;
                      <Button
                        variant='outline'
                        onClick={() => cancelCorrection(index)}
                      >
                        <Trash2 className='mr-2' size={16} color='#f87171' />
                        取消
                      </Button>
                      <Separator className='my-2' />
                      <div className='text-sm text-muted-foreground'>
                        原始文字:
                      </div>
                      <div>{correction.originalText}</div>
                      <Separator className='my-2' />
                      <div className='text-sm text-muted-foreground'>
                        校对文字:
                      </div>
                      <div>{correction.correctedText}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除选中文本</AlertDialogTitle>
            <AlertDialogDescription>
              您将要删除以下文本:
              <div className='mt-2 p-2 bg-muted rounded'>{selectedText}</div>
              您确定要继续吗?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={applyCorrection}>
              应用校对
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
