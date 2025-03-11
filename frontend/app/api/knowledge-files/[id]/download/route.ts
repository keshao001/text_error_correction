import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/knowledge-files/${params.id}/download`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error('Failed to download file')
    }

    const blob = await response.blob()
    const headers = new Headers(response.headers)
    
    // Get the filename from Content-Disposition header or use a default
    const contentDisposition = response.headers.get('content-disposition')
    if (contentDisposition) {
      headers.set('content-disposition', contentDisposition)
    }

    return new NextResponse(blob, {
      headers,
      status: 200,
    })
  } catch (error) {
    console.error('Error in download API:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}
