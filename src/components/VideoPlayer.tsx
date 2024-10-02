'use client'

import React, { useState, useRef, useEffect } from 'react'
import Hls from 'hls.js'
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Captions, SkipBack, SkipForward, Minimize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface VideoPlayerProps {
  videoId: string
  token: string
}

interface Caption {
  start: number
  end: number
  text: string
}

const sampleCaptions = {
  en: [
    { start: 0, end: 5, text: "Welcome to our video!" },
    { start: 5, end: 10, text: "This is a sample caption in English." },
    { start: 10, end: 15, text: "Captions can be very helpful for accessibility." },
  ],
  es: [
    { start: 0, end: 5, text: "¡Bienvenido a nuestro video!" },
    { start: 5, end: 10, text: "Este es un subtítulo de ejemplo en español." },
    { start: 10, end: 15, text: "Los subtítulos pueden ser muy útiles para la accesibilidad." },
  ],
}

export default function VideoPlayer({ videoId, token }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [quality, setQuality] = useState('720p')
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [captions, setCaptions] = useState<Caption[] | null>(null)
  const [isLooping, setIsLooping] = useState(false)
  const [streamUrls, setStreamUrls] = useState<Record<string, string>>({})
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const hls = new Hls()
    fetch(`http://localhost:5000/api/video/stream/${videoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        setStreamUrls(data.streamUrls)
        hls.loadSource(data.streamUrls[quality])
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(error => console.error('Error auto-playing video:', error))
        })
      })
      .catch((error) => console.error('Error loading video:', error))

    return () => {
      hls.destroy()
    }
  }, [videoId, token, quality])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = playbackSpeed
  }, [playbackSpeed])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.loop = isLooping
  }, [isLooping])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = value[0]
    setVolume(newVolume)
    video.volume = newVolume
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      video.volume = volume
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }

  const handleSeek = (value: number[]) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = value[0]
  }

  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      container.requestFullscreen()
    }
  }

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const video = videoRef.current
    if (!video) return

    switch (e.key.toLowerCase()) {
      case 'k':
      case ' ':
        togglePlay()
        break
      case 'j':
      case 'arrowleft':
        video.currentTime = Math.max(0, video.currentTime - 10)
        break
      case 'l':
      case 'arrowright':
        video.currentTime = Math.min(video.duration, video.currentTime + 10)
        break
      case 'arrowup':
        handleVolumeChange([Math.min(1, video.volume + 0.1)])
        break
      case 'arrowdown':
        handleVolumeChange([Math.max(0, video.volume - 0.1)])
        break
      case 'f':
        toggleFullscreen()
        break
      case 'm':
        toggleMute()
        break
      case 'c':
        setCaptions(captions ? null : sampleCaptions.en)
        break
    }
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto bg-black"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <video 
        ref={videoRef} 
        className="w-full h-auto"
        onContextMenu={(e) => e.preventDefault()}
      />
      {captions && (
        <div className="absolute bottom-16 left-0 right-0 text-center text-white text-shadow bg-black bg-opacity-50 py-2">
          {captions.find(cap => currentTime >= cap.start && currentTime < cap.end)?.text}
        </div>
      )}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
          <Slider
            value={[currentTime]}
            max={duration}
            step={1}
            onValueChange={handleSeek}
            className="w-full mb-4"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={togglePlay}>
                {isPlaying ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => videoRef.current!.currentTime -= 10}>
                <SkipBack className="h-6 w-6 text-white" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => videoRef.current!.currentTime += 10}>
                <SkipForward className="h-6 w-6 text-white" />
              </Button>
              <div className="relative" onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)}>
                <Button variant="ghost" size="icon" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="h-6 w-6 text-white" /> : <Volume2 className="h-6 w-6 text-white" />}
                </Button>
                {showVolumeSlider && (
                  <div className="absolute bottom-full left-0 mb-2 bg-black bg-opacity-50 p-2 rounded">
                    <Slider
                      orientation="vertical"
                      value={[isMuted ? 0 : volume]}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                      className="h-24"
                    />
                  </div>
                )}
              </div>
              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Captions className="h-6 w-6 text-white" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setCaptions(null)}>Off</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCaptions(sampleCaptions.en)}>English</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCaptions(sampleCaptions.es)}>Español</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-6 w-6 text-white" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setIsLooping(!isLooping)}>
                    Loop: {isLooping ? 'On' : 'Off'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPlaybackSpeed(speed => speed === 2 ? 0.25 : speed + 0.25)}>
                    Playback Speed: {playbackSpeed}x
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="w-full text-left">Quality</DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {Object.keys(streamUrls).map(q => (
                          <DropdownMenuItem key={q} onClick={() => setQuality(q)}>{q}</DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize className="h-6 w-6 text-white" /> : <Maximize className="h-6 w-6 text-white" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}