import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { correctedContent, corrections } = await request.json()

    // First, update the document with corrected content
    const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        correctedContent,
        status: 'manual_corrected'
      }),
    })

    if (!updateResponse.ok) {
      throw new Error('Failed to update document')
    }

    // Then, save the corrections history
    const correctionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${params.id}/corrections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        corrections,
        type: 'manual'
      }),
    })

    if (!correctionsResponse.ok) {
      throw new Error('Failed to save corrections history')
    }

    const data = await updateResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in manual correction API:', error)
    return NextResponse.json(
      { error: 'Failed to save corrections' },
      { status: 500 }
    )
  }
}
