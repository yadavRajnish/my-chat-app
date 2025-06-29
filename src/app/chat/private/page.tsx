"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"
import { ArrowLeft, Send, Paperclip, Loader2, Settings, Users, MessageCircle } from "lucide-react"
// import { FileUpload } from "@/components/file-upload"
// import { FileMessage } from "@/components/file-message"
// import { EmojiPicker } from "@/components/emoji-picker"
// import { GifPicker } from "@/components/gif-picker"
// import { AvatarUpload } from "@/components/avatar-upload"
// import { PrivateChatList } from "@/components/private-chat-list"
import { FileUpload } from "@/app/components/ui/file-upload"
import { FileMessage } from "@/app/components/ui/file-message"
import { EmojiPicker } from "@/app/components/ui/emoji.picker"
import { GifPicker } from "@/app/components/ui/gif.picker"
import { AvatarUpload } from "@/app/components/ui/avatar.upload"
import { PrivateChatList } from "@/app/components/ui/private-chat-list"

interface Message {
  id: number
  content: string
  username: string
  userId: number
  receiverId: number
  messageType: string
  isRead: boolean
  createdAt: string
  fileInfo?: any
}

interface User {
  id: number
  username: string
  email: string
  avatar?: string
  isOnline: boolean
  lastSeen: string
}

interface PrivateChat {
  id: number
  otherUser: User
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
}

export default function PrivateChatPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [selectedChat, setSelectedChat] = useState<PrivateChat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState("")
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const userData = await response.json()
          setCurrentUser(userData.user)
          console.log("Current user set:", userData.user)
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat || !currentUser) return

    const fetchMessages = async () => {
      try {
        console.log("Fetching messages for chat:", selectedChat.id)
        const response = await fetch(`/api/messages/private/${selectedChat.id}`)
        if (response.ok) {
          const data = await response.json()
          console.log("Messages received:", data.length)
          setMessages(data)
        } else {
          console.error("Failed to fetch messages:", response.status)
        }
      } catch (error) {
        console.error("Error fetching messages:", error)
      }
    }

    fetchMessages()
    const interval = setInterval(fetchMessages, 3000) // Check for new messages every 3 seconds
    return () => clearInterval(interval)
  }, [selectedChat, currentUser, refreshKey])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleChatSelect = (chat: PrivateChat) => {
    console.log("Chat selected:", chat)
    setSelectedChat(chat)
    setError("")
    setIsCreatingChat(false)
    setMessages([]) // Clear messages while loading new chat
  }

  const handleNewChat = async (userId: number) => {
    console.log("Creating new chat with user:", userId)
    setIsCreatingChat(true)
    setError("")
    setMessages([])

    try {
      const response = await fetch("/api/chats/private", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId }),
      })

      if (response.ok) {
        const chat = await response.json()
        console.log("Chat created/retrieved:", chat)
        setSelectedChat(chat)
        setIsCreatingChat(false)
        setRefreshKey((prev) => prev + 1) // Trigger refresh of chat list

        // Focus on input after chat is created
        setTimeout(() => {
          inputRef.current?.focus()
        }, 100)
      } else {
        const errorData = await response.json()
        console.error("Failed to create chat:", errorData)
        setError("Failed to create chat: " + (errorData.error || "Unknown error"))
        setIsCreatingChat(false)
      }
    } catch (error) {
      console.error("Error creating chat:", error)
      setError("Error creating chat. Please try again.")
      setIsCreatingChat(false)
    }
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!newMessage.trim() || !currentUser || !selectedChat || isSending) {
      console.log("Cannot send message:", {
        hasMessage: !!newMessage.trim(),
        hasUser: !!currentUser,
        hasChat: !!selectedChat,
        isSending,
      })
      return
    }

    setIsSending(true)
    setError("")
    const messageToSend = newMessage.trim()
    setNewMessage("")

    try {
      console.log("Sending private message:", {
        content: messageToSend,
        receiverId: selectedChat.otherUser.id,
        chatId: selectedChat.id,
      })

      const response = await fetch(`/api/messages/private/${selectedChat.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageToSend,
          receiverId: selectedChat.otherUser.id,
        }),
      })

      if (response.ok) {
        console.log("Message sent successfully")
        // Refresh messages immediately
        const messagesResponse = await fetch(`/api/messages/private/${selectedChat.id}`)
        if (messagesResponse.ok) {
          const data = await messagesResponse.json()
          setMessages(data)
        }
        inputRef.current?.focus()
      } else {
        const errorData = await response.json()
        console.error("Failed to send message:", errorData)
        setError("Failed to send message: " + (errorData.error || "Unknown error"))
        setNewMessage(messageToSend)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setError("Error sending message. Please try again.")
      setNewMessage(messageToSend)
    } finally {
      setIsSending(false)
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji)
    inputRef.current?.focus()
  }

  const handleGifSelect = async (gifUrl: string, gifTitle: string) => {
    if (!currentUser || !selectedChat) return

    try {
      const response = await fetch(`/api/messages/private/${selectedChat.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `🎬 Shared a GIF: ${gifTitle}`,
          receiverId: selectedChat.otherUser.id,
          messageType: "gif",
          fileInfo: { gifUrl, gifTitle },
        }),
      })

      if (response.ok) {
        const messagesResponse = await fetch(`/api/messages/private/${selectedChat.id}`)
        if (messagesResponse.ok) {
          const data = await messagesResponse.json()
          setMessages(data)
        }
      }
    } catch (error) {
      console.error("Error sending GIF:", error)
    }
  }

  const handleFileUploaded = async (fileInfo: any) => {
    if (!currentUser || !selectedChat) return

    try {
      const response = await fetch(`/api/messages/private/${selectedChat.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `📎 Shared a file: ${fileInfo.fileName}`,
          receiverId: selectedChat.otherUser.id,
          messageType: "file",
          fileInfo,
        }),
      })

      if (response.ok) {
        const messagesResponse = await fetch(`/api/messages/private/${selectedChat.id}`)
        if (messagesResponse.ok) {
          const data = await messagesResponse.json()
          setMessages(data)
        }
        setShowFileUpload(false)
      }
    } catch (error) {
      console.error("Error sending file:", error)
    }
  }

  const handleAvatarUpdated = (avatarUrl: string) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, avatar: avatarUrl })
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Chat List Sidebar */}
      <PrivateChatList
        key={refreshKey}
        currentUserId={currentUser.id}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedChat || isCreatingChat ? (
          <Card className="flex-1 m-4 flex flex-col min-h-0">
            {/* Chat Header */}
            <CardHeader className="border-b flex-shrink-0">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="sm" onClick={() => router.push("/chat")}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  {selectedChat && (
                    <>
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {selectedChat.otherUser.avatar ? (
                          <img
                            src={selectedChat.otherUser.avatar || "/placeholder.svg"}
                            alt={selectedChat.otherUser.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {selectedChat.otherUser.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{selectedChat.otherUser.username}</h3>
                        <p className="text-sm text-gray-500">
                          {selectedChat.otherUser.isOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                    </>
                  )}
                  {isCreatingChat && (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating chat...</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => router.push("/chat")}>
                    <Users className="h-4 w-4 mr-2" />
                    Group Chat
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>

            {/* Messages Area - Fixed height with proper scrolling */}
            <CardContent className="flex-1 p-0 overflow-hidden min-h-0">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
                  <div className="text-red-700">{error}</div>
                </div>
              )}

              <div
                className="h-full p-4 overflow-y-auto"
                ref={scrollAreaRef}
                style={{ maxHeight: "calc(100vh - 300px)" }}
              >
                <div className="space-y-4">
                  {messages.length === 0 && selectedChat && !isCreatingChat ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">Start your conversation</p>
                      <p className="text-sm">Send a message to {selectedChat.otherUser.username} to begin chatting!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start space-x-3 ${
                          message.userId === currentUser.id ? "flex-row-reverse space-x-reverse" : ""
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                            message.userId === currentUser.id ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-700"
                          }`}
                        >
                          {message.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="max-w-xs lg:max-w-md">
                          {/* GIF Message */}
                          {message.messageType === "gif" && message.fileInfo ? (
                            <div className="rounded-lg overflow-hidden">
                              <img
                                src={message.fileInfo.gifUrl || "/placeholder.svg"}
                                alt={message.fileInfo.gifTitle}
                                className="max-w-full h-auto"
                              />
                              <div className="bg-gray-100 p-2">
                                <p className="text-xs text-gray-600">{message.fileInfo.gifTitle}</p>
                                <p className="text-xs text-gray-500">{formatTime(message.createdAt)}</p>
                              </div>
                            </div>
                          ) : message.messageType === "file" && message.fileInfo ? (
                            /* File Message */
                            <FileMessage {...message.fileInfo} />
                          ) : (
                            /* Regular Text Message */
                            <div
                              className={`px-4 py-2 rounded-lg ${
                                message.userId === currentUser.id
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              <div className="text-sm">{message.content}</div>
                              <div
                                className={`text-xs mt-1 ${
                                  message.userId === currentUser.id ? "text-blue-100" : "text-gray-500"
                                }`}
                              >
                                {formatTime(message.createdAt)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>

            {/* Message Input - Show for both selected chat and creating chat */}
            {(selectedChat || isCreatingChat) && (
              <CardFooter className="border-t p-4 flex-shrink-0">
                <div className="w-full space-y-3">
                  {/* File Upload Area */}
                  {showFileUpload && selectedChat && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium">Upload File</h4>
                        <Button size="sm" variant="ghost" onClick={() => setShowFileUpload(false)}>
                          ✕
                        </Button>
                      </div>
                      <FileUpload onFileUploaded={handleFileUploaded} disabled={isSending} />
                    </div>
                  )}

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="flex w-full space-x-2">
                    <EmojiPicker onEmojiSelect={handleEmojiSelect} disabled={isSending || isCreatingChat} />
                    <GifPicker onGifSelect={handleGifSelect} disabled={isSending || isCreatingChat || !selectedChat} />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowFileUpload(!showFileUpload)}
                      disabled={isSending || isCreatingChat || !selectedChat}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      ref={inputRef}
                      type="text"
                      placeholder={isCreatingChat ? "Creating chat..." : "Type your message..."}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                      disabled={isSending || isCreatingChat}
                      autoFocus={!!selectedChat}
                    />
                    <Button type="submit" disabled={isSending || !newMessage.trim() || isCreatingChat || !selectedChat}>
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>

                  {selectedChat && (
                    <div className="text-xs text-gray-500 text-center">
                      Press Enter to send • 😊 for emojis • GIF for animations • 📎 to attach files
                    </div>
                  )}
                </div>
              </CardFooter>
            )}
          </Card>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center m-4">
            <Card className="p-8 text-center max-w-md">
              <CardContent>
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">Select a conversation</h2>
                <p className="text-gray-500 mb-4">Choose from your existing conversations or start a new one</p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/chat")}>
                    <Users className="h-4 w-4 mr-2" />
                    Go to Group Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="w-80 bg-white border-l border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Settings</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
              ✕
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-3">Your Avatar</h4>
              <AvatarUpload currentAvatar={currentUser.avatar} onAvatarUpdated={handleAvatarUpdated} disabled={false} />
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Account Info</h4>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Username:</strong> {currentUser.username}
                </p>
                <p>
                  <strong>Email:</strong> {currentUser.email}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/chat")}>
                <Users className="h-4 w-4 mr-2" />
                Group Chat
              </Button>
              <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/")}>
                🏠 Home Page
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
