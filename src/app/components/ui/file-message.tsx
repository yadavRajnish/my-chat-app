"use client"

import { Card, CardContent } from "./card"
import { Button } from "./button"
import { Download, ImageIcon, FileText, ExternalLink } from "lucide-react"

interface FileMessageProps {
  fileName: string
  filePath: string
  fileSize: number
  fileType: string
  uploadedBy: string
  uploadedAt: string
}

export function FileMessage({ fileName, filePath, fileSize, fileType, uploadedBy, uploadedAt }: FileMessageProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-blue-500" />
    if (fileType === "application/pdf") return <FileText className="h-5 w-5 text-red-500" />
    return <ImageIcon className="h-5 w-5 text-gray-500" />
  }

  const isImage = fileType.startsWith("image/")

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = filePath
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleView = () => {
    window.open(filePath, "_blank")
  }

  return (
    <Card className="max-w-sm">
      <CardContent className="p-4">
        {/* Image Preview */}
        {isImage && (
          <div className="mb-3">
            <img
              src={filePath || "/placeholder.svg"}
              alt={fileName}
              className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={handleView}
            />
          </div>
        )}

        {/* File Info */}
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">{getFileIcon(fileType)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
            <p className="text-xs text-gray-500">
              {formatFileSize(fileSize)} • Uploaded by {uploadedBy}
            </p>
            <p className="text-xs text-gray-400">{new Date(uploadedAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 mt-3">
          <Button size="sm" variant="outline" onClick={handleDownload} className="flex-1 bg-transparent">
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
          <Button size="sm" variant="outline" onClick={handleView}>
            <ExternalLink className="h-3 w-3 mr-1" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
