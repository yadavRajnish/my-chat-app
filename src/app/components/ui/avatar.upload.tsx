"use client"

import { useState, useRef } from "react"
// import { Button } from "./components/ui/button"
import { Camera, Upload, Loader2 } from "lucide-react"
import { Button } from "./button"
import { Input } from "./input"

interface AvatarUploadProps {
  currentAvatar?: string
  onAvatarUpdated: (avatarUrl: string) => void
  disabled?: boolean
}

export function AvatarUpload({ currentAvatar, onAvatarUpdated, disabled }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Avatar too large. Maximum size is 5MB")
      return
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid avatar format. Use JPEG, PNG, GIF, or WebP")
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload avatar
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("avatar", file)

      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        onAvatarUpdated(data.avatarUrl)
        setPreview(null)
      } else {
        alert(data.error || "Avatar upload failed")
        setPreview(null)
      }
    } catch (error) {
      console.error("Avatar upload error:", error)
      alert("Avatar upload failed. Please try again.")
      setPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Display */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          {preview || currentAvatar ? (
            <img
              src={preview || currentAvatar || "/placeholder.svg"}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <Camera className="h-8 w-8 text-gray-400" />
          )}
        </div>

        {/* Upload Button Overlay */}
        <Button
          size="sm"
          className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
        </Button>
      </div>

      {/* Hidden File Input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0])
          }
        }}
        disabled={disabled || isUploading}
      />

      {/* Upload Status */}
      {isUploading && <p className="text-sm text-gray-600">Uploading avatar...</p>}

      <p className="text-xs text-gray-500 text-center">Click the camera icon to upload a new avatar (Max 5MB)</p>
    </div>
  )
}
