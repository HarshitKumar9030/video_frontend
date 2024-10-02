'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function UploadPage() {
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const router = useRouter()
  const apiToken = '23434'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setUploading(true)
    setUploadStatus('Uploading video...')

    const formData = new FormData(event.target)
    formData.append('apiToken', apiToken)

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload video')
      }

      setUploadStatus('Video uploaded successfully!')
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (error) {
      console.error('Error uploading video:', error)
      setUploadStatus('Error uploading video. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-background text-white min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Upload Video</h1>
        <form onSubmit={handleSubmit} className="bg-surface p-8 rounded-lg shadow-lg">
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium mb-2">Video Title</label>
            <Input type="text" id="title" name="title" placeholder="Enter video title" required />
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium mb-2">Video Description</label>
            <Textarea id="description" name="description" placeholder="Enter video description" required />
          </div>
          <div className="mb-4">
            <label htmlFor="video-file" className="block text-sm font-medium mb-2">Choose Video File</label>
            <Input type="file" id="video-file" name="video" accept="video/*" required />
          </div>
          <Button type="submit" disabled={uploading} className="w-full">
            {uploading ? 'Uploading...' : 'Upload Video'}
          </Button>
        </form>
        {uploadStatus && (
          <div className="mt-4 text-center" aria-live="polite">{uploadStatus}</div>
        )}
      </div>
    </div>
  )
}