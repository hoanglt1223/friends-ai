"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Play, Pause, Volume2 } from "lucide-react"

interface MediaMessageProps {
  fileUrl: string
  messageType: 'image' | 'audio'
  metadata?: {
    originalName?: string
    mimeType?: string
    size?: number
  }
  className?: string
}

export function MediaMessage({ fileUrl, messageType, metadata, className }: MediaMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null)

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = metadata?.originalName || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleAudioPlay = () => {
    if (!audioRef) return

    if (isPlaying) {
      audioRef.pause()
      setIsPlaying(false)
    } else {
      audioRef.play()
      setIsPlaying(true)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (messageType === 'image') {
    return (
      <div className={`relative group max-w-sm ${className}`}>
        <img
          src={fileUrl}
          alt={metadata?.originalName || 'Uploaded image'}
          className="rounded-lg max-w-full h-auto shadow-md"
          loading="lazy"
        />
        
        {/* Image overlay with download button */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            className="bg-white/90 text-black hover:bg-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
        
        {/* Image info */}
        {metadata && (
          <div className="mt-2 text-xs text-muted-foreground">
            {metadata.originalName} {metadata.size && `• ${formatFileSize(metadata.size)}`}
          </div>
        )}
      </div>
    )
  }

  if (messageType === 'audio') {
    return (
      <div className={`bg-muted rounded-lg p-4 max-w-sm ${className}`}>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAudioPlay}
            className="flex-shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium truncate">
                {metadata?.originalName || 'Audio file'}
              </span>
            </div>
            {metadata?.size && (
              <div className="text-xs text-muted-foreground mt-1">
                {formatFileSize(metadata.size)}
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="flex-shrink-0"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Hidden audio element */}
        <audio
          ref={setAudioRef}
          src={fileUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          className="hidden"
        />
      </div>
    )
  }

  return null
}