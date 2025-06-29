"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent } from "@/app/components/ui/card"
import { Input } from "@/app/components/ui/input"
import { MessageCircle, Search, Plus, ArrowLeft } from "lucide-react"
import { User } from "@/types/user"
// import type { User } from "@/types/user"

interface PrivateChat {
  id: number
  otherUser: User
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
}

interface PrivateChatListProps {
  currentUserId: number
  onChatSelect: (chat: PrivateChat) => void
  onNewChat: (userId: number) => void
}

export function PrivateChatList({ currentUserId, onChatSelect, onNewChat }: PrivateChatListProps) {
  const [chats, setChats] = useState<PrivateChat[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showUserList, setShowUserList] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchChats()
    fetchUsers()
  }, [])

  const fetchChats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/chats/private")
      if (response.ok) {
        const data = await response.json()
        setChats(data)
      }
    } catch (error) {
      console.error("Error fetching chats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users/online")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.filter((user: User) => user.id !== currentUserId))
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredChats = chats.filter((chat) => chat.otherUser.username.toLowerCase().includes(searchTerm.toLowerCase()))

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const handleUserSelect = (userId: number) => {
    onNewChat(userId)
    setShowUserList(false)
    setSearchTerm("")
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          {showUserList ? (
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" onClick={() => setShowUserList(false)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold">Start New Chat</h2>
            </div>
          ) : (
            <h2 className="text-lg font-semibold">Messages</h2>
          )}

          {!showUserList && (
            <Button size="sm" onClick={() => setShowUserList(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={showUserList ? "Search users..." : "Search chats..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {showUserList ? (
          /* User List for New Chats */
          <div className="p-2">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-sm">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">{searchTerm ? "No users found" : "No other users available"}</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <Card
                  key={user.id}
                  className="mb-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleUserSelect(user.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                          {user.avatar ? (
                            <img
                              src={user.avatar || "/placeholder.svg"}
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-600">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {user.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.username}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.isOnline ? "Online" : "Offline"} • {user.email}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          /* Chat List */
          <div className="p-2">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-sm">Loading chats...</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">{searchTerm ? "No chats found" : "No conversations yet"}</p>
                {!searchTerm && <p className="text-xs mt-1">Click "New" to start a chat</p>}
              </div>
            ) : (
              filteredChats.map((chat) => (
                <Card
                  key={chat.id}
                  className="mb-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => onChatSelect(chat)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                          {chat.otherUser.avatar ? (
                            <img
                              src={chat.otherUser.avatar || "/placeholder.svg"}
                              alt={chat.otherUser.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-600">
                              {chat.otherUser.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {chat.otherUser.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">{chat.otherUser.username}</p>
                          {chat.lastMessageTime && (
                            <span className="text-xs text-gray-500">{formatTime(chat.lastMessageTime)}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 truncate">
                            {chat.lastMessage || "Start a conversation..."}
                          </p>
                          {chat.unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
