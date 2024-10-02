'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  const [videos, setVideos] = useState([])
  const [error, setError] = useState<null | string>(null)
  const apiToken = '23434'

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/video/list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch videos')
      }
      const data = await response.json()
      setVideos(data)
    } catch (error) {
      console.error('Error fetching videos:', error)
      setError('Failed to load videos. Please try again later.')
    }
  }

  const generateToken = async (videoId: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/generate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId, apiToken })
      })
      if (!response.ok) {
        throw new Error('Failed to generate token')
      }
      const data = await response.json()
      localStorage.setItem('accessToken', data.token)
      window.location.href = `http://localhost:3000/video-player?videoId=${encodeURIComponent(videoId)}&token=${encodeURIComponent(data.token)}`
    } catch (error) {
      console.error('Error generating token:', error)
      alert('Failed to generate token. Please try again.')
    }
  }

  return (
    <div className="bg-background text-white min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8">Available Videos</h1>
      <div className="w-full max-w-3xl space-y-4">
        {error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : (
          videos.map((video) => (
            <div key={video._id} className="bg-surface p-4 rounded-lg flex justify-between items-center">
              <span className="text-lg">{video.title}</span>
              <Button onClick={() => generateToken(video._id)}>
                Play
              </Button>
            </div>
          ))
        )}
      </div>
      <Link href="/upload" className="mt-8">
        <Button variant="outline">Upload New Video</Button>
      </Link>
    </div>
  )
}