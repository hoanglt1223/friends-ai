"use client"

import * as React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ImageIcon, Mic, Upload, X } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { UPLOAD_API } from "@/lib/apiRoutes"

interface MediaUploadProps {
  onUploadSuccess: (fileUrl: string, messageType: 'image' | 'audio', metadata: any) => void
  onCancel: () => void
  disabled?: boolean
}

export function MediaUpload({ onUploadSuccess, onCancel, disabled }: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if user has premium access
  const isPremium = (user as any)?.subscriptionTier === 'premium' || 
                   (user as any)?.subscriptionPlan === 'premium' || 
                   (user as any)?.subscriptionPlan === 'pro'

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      })
      return
    }

    // Validate file type
    const isImage = file.type.startsWith('image/')
    const isAudio = file.type.startsWith('audio/')
    
    if (!isImage && !isAudio) {
      toast({
        title: "Invalid file type",
        description: "Please select an image or audio file.",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile || !isPremium) return

    setIsUploading(true)

    try {
      // Convert file to base64
      const fileData = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          // Remove data URL prefix
          const base64Data = result.split(',')[1]
          resolve(base64Data)
        }
        reader.readAsDataURL(selectedFile)
      })

      const messageType = selectedFile.type.startsWith('image/') ? 'image' : 'audio'

      const response = await fetch(UPLOAD_API.upload(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: {
            name: selectedFile.name,
            type: selectedFile.type,
            size: selectedFile.size,
            data: fileData,
          },
          messageType,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.upgradeRequired) {
          toast({
            title: "Premium Required",
            description: "Upgrade to Premium to share images and audio files.",
            variant: "destructive",
          })
          return
        }
        throw new Error(result.error || 'Upload failed')
      }

      // Call the callback with the uploaded file info
      onUploadSuccess(result.fileUrl, result.messageType, result.metadata)
      
      // Reset state
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully.",
      })

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onCancel()
  }

  const handleUpgradePrompt = () => {
    toast({
      title: "Premium Feature",
      description: "Upgrade to Premium to share images and audio files.",
      variant: "default",
    })
  }

  if (!isPremium) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleUpgradePrompt}
        disabled={disabled}
        className="text-muted-foreground"
      >
        <ImageIcon className="w-4 h-4 mr-2" />
        Media (Premium)
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {!selectedFile ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,audio/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Media
          </Button>
        </>
      ) : (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            {selectedFile.type.startsWith('image/') ? (
              <ImageIcon className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
            <span className="truncate max-w-32">{selectedFile.name}</span>
          </div>
          
          <Button
            size="sm"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isUploading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}