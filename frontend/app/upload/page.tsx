'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UploadDocument } from '@/components/upload-document'

interface FileInfo {
  id: string
}

interface Document {
  id: number
  name: string
  src: string
  dest: string
  owner: string
  status: string
  create_time: string
}

async function generateFileHash(content: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

export default function UploadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'document'
  const knowledgeId = searchParams.get('knowledgeId')

  // check if user is logged in
  const [isLoading, setIsLoading] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true)
      const res = await fetch('/api/user/get_session',{
        method: 'GET'
      })
      if (!res.ok) {
        setIsLoading(false)
        router.push('/login')
        return
      }
      const data = await res.json()
      setIsSignedIn(!!data.user)
      setIsLoading(false)
    }
    checkSession()
  }, [router])

  const handleUploadComplete = async (fileInfo: any) => {
   if (mode === 'document') {
      const document: Document = {
        title: fileInfo.title || fileInfo.originalname,
        parsedContent: '',
        originalContent: fileInfo.content,
        fileName: fileInfo.filename,
        fileType: fileInfo.fileType || '未知文件类型',
        fileSize: fileInfo.size,
        totalPages: fileInfo.totalPages,
        status: 'uploaded',
      }

      // post to save
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(document),
      })

      if (!res.ok) {
        throw new Error('Failed to upload document')
      }

      const data = await res.json()
      router.push(`/documents/${data.id}`)
    } else {
      if (!knowledgeId) {
        throw new Error('Knowledge ID is required')
      }


      // Upload file
      const res = await fetch('/api/knowledge-files', {
        method: 'POST',
        body: JSON.stringify({
          knowledgeId: knowledgeId,
          name: fileInfo.title || fileInfo.originalname,
          content: fileInfo.content,
          fileType: fileInfo.fileType,
          fileSize: fileInfo.fileSize,
          fileHash: await generateFileHash(fileInfo.content),
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) {
        const error = await res.json()
        console.error('Upload error:', error)
        throw new Error(
          error.error?.message || 'Failed to upload knowledge file'
        )
      }
      router.push(`/knowledges/${knowledgeId}`)
    }
  }

  return (
    <div className='container mx-auto p-4'>
      <div className='max-w-7xl mx-auto'>
        <div className='mt-6'>
          <h1 className='text-2xl font-bold mb-4'>
            {mode === 'document' ? 'Upload Document' : 'Upload Knowledge Files'}
          </h1>
          <UploadDocument onUploadComplete={handleUploadComplete} />
        </div>
      </div>
    </div>
  )
}