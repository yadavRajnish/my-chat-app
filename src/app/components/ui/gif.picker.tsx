"use client"

import { useState } from "react"
import { Button } from "./button"
import { Input } from "./input"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Search, Loader2 } from "lucide-react"

interface GifPickerProps {
  onGifSelect: (gifUrl: string, gifTitle: string) => void
  disabled?: boolean
}

interface GifResult {
  id: string
  title: string
  images: {
    fixed_height: {
      url: string
      width: string
      height: string
    }
    fixed_height_small: {
      url: string
      width: string
      height: string
    }
  }
}

// Popular GIF URLs for demo (in production, you'd use Giphy API)
const DEMO_GIFS = [
  {
    id: "1",
    title: "Happy Dance",
    url: "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif",
  },
  {
    id: "2",
    title: "Thumbs Up",
    url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
  },
  {
    id: "3",
    title: "Celebration",
    url: "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif",
  },
  {
    id: "4",
    title: "Heart Eyes",
    url: "https://media.giphy.com/media/3o7abAHdYvZdBNnGZq/giphy.gif",
  },
  {
    id: "5",
    title: "Clapping",
    url: "https://media.giphy.com/media/7rj2ZgttvgomY/giphy.gif",
  },
  {
    id: "6",
    title: "Laughing",
    url: "https://media.giphy.com/media/3o7absbD7PbTFQa0c8/giphy.gif",
  },
]

export function GifPicker({ onGifSelect, disabled }: GifPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [gifs, setGifs] = useState(DEMO_GIFS)

  const handleGifClick = (gif: { url: string; title: string }) => {
    onGifSelect(gif.url, gif.title)
    setIsOpen(false)
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setGifs(DEMO_GIFS)
      return
    }

    setIsLoading(true)
    // In production, you would use Giphy API here
    // For demo, we'll filter our demo GIFs
    const filtered = DEMO_GIFS.filter((gif) => gif.title.toLowerCase().includes(searchTerm.toLowerCase()))
    setGifs(filtered.length > 0 ? filtered : DEMO_GIFS)
    setIsLoading(false)
  }

  return (
    <div className="relative">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex-shrink-0"
      >
        GIF
      </Button>

      {isOpen && (
        <Card className="absolute bottom-12 left-0 w-96 z-50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Choose a GIF</CardTitle>
            <div className="flex space-x-2">
              <Input
                placeholder="Search GIFs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="text-sm"
              />
              <Button size="sm" onClick={handleSearch} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {gifs.map((gif) => (
                <div
                  key={gif.id}
                  className="cursor-pointer rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                  onClick={() => handleGifClick({ url: gif.url, title: gif.title })}
                >
                  <img src={gif.url || "/placeholder.svg"} alt={gif.title} className="w-full h-24 object-cover" />
                  <p className="text-xs p-1 bg-gray-50 truncate">{gif.title}</p>
                </div>
              ))}
            </div>

            {gifs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No GIFs found</p>
              </div>
            )}

            <div className="mt-3 text-center">
              <Button size="sm" variant="outline" onClick={() => setIsOpen(false)} className="text-xs">
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
