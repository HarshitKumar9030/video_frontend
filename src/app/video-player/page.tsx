'use client'

import { useSearchParams } from 'next/navigation'
import VideoPlayer from '@/components/VideoPlayer'

export default function VideoPlayerPage() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get('videoId')
  const token = searchParams.get('token')

  if (!videoId || !token) {
    return <div className="text-center text-red-500">Invalid video parameters</div>
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Video Player</h1>
      <VideoPlayer videoId={videoId} initialToken={token} />
    </div>
  )
}