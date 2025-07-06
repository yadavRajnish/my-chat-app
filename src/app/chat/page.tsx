"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  LogOut,
  Send,
  Users,
  MessageCircle,
  Loader2,
  Paperclip,
  Settings,
  Plus,
} from "lucide-react";
// import { AvatarUpload } from "@/components/avatar-upload"
import { FileUpload } from "../components/ui/file-upload";
import { GifPicker } from "../components/ui/gif.picker";
import { FileMessage } from "../components/ui/file-message";
import { EmojiPicker } from "../components/ui/emoji.picker";
import { AvatarUpload } from "../components/ui/avatar.upload";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";

interface Message {
  id: number;
  content: string;
  username: string;
  userId: number;
  messageType: string;
  isRead: boolean;
  createdAt: string;
  fileInfo?: {
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
    uploadedBy: string;
    uploadedAt: string;
    gifUrl?: string;
    gifTitle?: string;
  };
}

interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Check authentication and get current user
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData.user);
          console.log("Current user set:", userData.user);
        } else {
          console.log("Not authenticated, redirecting to login");
          router.push("/login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  // Fetch messages and online users periodically
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      try {
        setError("");

        // Fetch messages
        console.log("Fetching messages...");
        const messagesResponse = await fetch("/api/messages");
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          console.log("Messages received:", messagesData.length);
          setMessages(messagesData);
        } else {
          const errorData = await messagesResponse.json();
          console.error("Failed to fetch messages:", errorData);
          setError("Failed to load messages");
        }

        // Fetch online users
        const usersResponse = await fetch("/api/users/online");
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setOnlineUsers(usersData);
        } else {
          console.error("Failed to fetch users");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Connection error");
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [currentUser]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!newMessage.trim() || !currentUser || isSending) {
      console.log("Cannot send message:", {
        hasMessage: !!newMessage.trim(),
        hasUser: !!currentUser,
        isSending,
      });
      return;
    }

    setIsSending(true);
    setError("");
    const messageToSend = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX

    try {
      console.log("Sending message:", {
        content: messageToSend,
        userId: currentUser.id,
      });

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: messageToSend,
          userId: currentUser.id,
        }),
      });

      const responseData = await response.json();
      console.log("Send message response:", response.status, responseData);

      if (response.ok) {
        console.log("Message sent successfully");
        // Fetch messages immediately after sending
        const messagesResponse = await fetch("/api/messages");
        if (messagesResponse.ok) {
          const data = await messagesResponse.json();
          setMessages(data);
        }

        // Focus back to input
        if (inputRef.current) {
          inputRef.current.focus();
        }
      } else {
        console.error("Failed to send message:", responseData);
        // Restore message if sending failed
        setNewMessage(messageToSend);
        setError(
          "Failed to send message: " + (responseData.error || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Restore message if sending failed
      setNewMessage(messageToSend);
      setError("Error sending message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleGifSelect = async (gifUrl: string, gifTitle: string) => {
    if (!currentUser) return;

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `🎬 Shared a GIF: ${gifTitle}`,
          userId: currentUser.id,
          messageType: "gif",
          fileInfo: { gifUrl, gifTitle },
        }),
      });

      if (response.ok) {
        // Refresh messages
        const messagesResponse = await fetch("/api/messages");
        if (messagesResponse.ok) {
          const data = await messagesResponse.json();
          setMessages(data);
        }
      } else {
        const errorData = await response.json();
        setError("Failed to send GIF: " + (errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error sending GIF:", error);
      setError("Error sending GIF. Please try again.");
    }
  };

  const handleFileUploaded = async (fileInfo: any) => {
    if (!currentUser) return;

    try {
      // Send a file message
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `📎 Shared a file: ${fileInfo.fileName}`,
          userId: currentUser.id,
          messageType: "file",
          fileInfo: fileInfo,
        }),
      });

      if (response.ok) {
        // Refresh messages
        const messagesResponse = await fetch("/api/messages");
        if (messagesResponse.ok) {
          const data = await messagesResponse.json();
          setMessages(data);
        }
        setShowFileUpload(false);
      } else {
        const errorData = await response.json();
        setError(
          "Failed to send file: " + (errorData.error || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error sending file message:", error);
      setError("Error sending file. Please try again.");
    }
  };

  const handleAvatarUpdated = (avatarUrl: string) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, avatar: avatarUrl });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLastSeen = (lastSeen: string) => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor(
      (now.getTime() - lastSeenDate.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Sidebar */}
      <div
        className={`${
          showUsers ? "w-80" : "w-16"
        } transition-all duration-300 bg-white border-r border-gray-200 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUsers(!showUsers)}
              className="p-2"
            >
              <Users className="h-5 w-5 text-black" />
            </Button>
            {showUsers && (
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2"
                >
                  <Settings className="h-5 w-5 text-black" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="p-2 text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {showUsers && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4">
              <Button
                onClick={() => router.push("/chat/private")}
                className="w-full mb-3"
                variant="outline"
              >
                💬 Private Messages
              </Button>
            </div>

            <h3 className="text-sm font-semibold text-gray-600 mb-3">
              Public Chat - Online Users ({onlineUsers.length})
            </h3>
            <div className="space-y-2">
              {onlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                      {user.avatar ? (
                        <img
                          src={user.avatar || "/placeholder.svg"}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium text-gray-600">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {user.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {user.username}
                      {user.id === currentUser.id && " (You)"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.isOnline ? "Online" : formatLastSeen(user.lastSeen)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 m-4 flex flex-col !h-[calc(100vh-1rem)]">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-6 w-6 text-blue-600" />
                <span className="text-black hidden lg:block">
                  Public Chat Room
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-normal text-gray-600">
                  Welcome, {currentUser.username}!
                </span>
                {!showUsers && (
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="text-red-600 hover:text-red-700"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-y-scroll no-scrollbar">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
                <div className="text-red-700">{error}</div>
              </div>
            )}

            <div className="h-full p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start space-x-3 ${
                        message.userId === currentUser.id
                          ? "flex-row-reverse space-x-reverse"
                          : ""
                      }`}
                    >
                      <div className="relative">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                            message.userId === currentUser.id
                              ? "bg-blue-500 text-white"
                              : "bg-gray-300 text-gray-700"
                          }`}
                        >
                          {(message.username || "U").charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="max-w-xs lg:max-w-md">
                        {/* GIF Message */}
                        {message.messageType === "gif" &&
                        message.fileInfo?.gifUrl ? (
                          <div className="rounded-lg overflow-hidden">
                            <img
                              src={
                                message.fileInfo.gifUrl || "/placeholder.svg"
                              }
                              alt={message.fileInfo.gifTitle || "GIF"}
                              className="max-w-full h-auto max-h-64"
                            />
                            <div
                              className={`p-2 ${
                                message.userId === currentUser.id
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100"
                              }`}
                            >
                              <div className="text-sm font-medium mb-1">
                                {message.username || "Unknown User"}
                              </div>
                              <p className="text-xs">
                                {message.fileInfo.gifTitle || "GIF"}
                              </p>
                              <p
                                className={`text-xs mt-1 ${
                                  message.userId === currentUser.id
                                    ? "text-blue-100"
                                    : "text-gray-500"
                                }`}
                              >
                                {formatTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        ) : message.messageType === "file" &&
                          message.fileInfo ? (
                          /* File Message */
                          <div>
                            <div
                              className={`px-3 py-2 rounded-t-lg ${
                                message.userId === currentUser.id
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              <div className="text-sm font-medium">
                                {message.username || "Unknown User"}
                              </div>
                              <div className="text-xs mt-1">
                                {formatTime(message.createdAt)}
                              </div>
                            </div>
                            <FileMessage {...message.fileInfo} />
                          </div>
                        ) : (
                          /* Regular Text Message */
                          <div
                            className={`px-4 py-2 rounded-lg relative ${
                              message.userId === currentUser.id
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            <div className="text-sm font-medium mb-1">
                              {message.username || "Unknown User"}
                            </div>
                            <div className="text-sm">{message.content}</div>
                            <div
                              className={`text-xs mt-1 flex items-center justify-between ${
                                message.userId === currentUser.id
                                  ? "text-blue-100"
                                  : "text-gray-500"
                              }`}
                            >
                              <span>{formatTime(message.createdAt)}</span>
                              {message.userId === currentUser.id && (
                                <span className="ml-2">
                                  {message.isRead ? "✓✓" : "✓"}
                                </span>
                              )}
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

          <CardFooter className="border-t p-4 ">
            <div className="w-full space-y-3">
              {/* File Upload Area */}
              {showFileUpload && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium">Upload File</h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowFileUpload(false)}
                    >
                      ✕
                    </Button>
                  </div>
                  <FileUpload
                    onFileUploaded={handleFileUploaded}
                    disabled={isSending}
                  />
                </div>
              )}

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className="flex w-full space-x-2"
              >
                <Popover>
                  <PopoverTrigger>
                    <Plus className="text-black" />
                  </PopoverTrigger>
                  <PopoverContent>
                    <EmojiPicker
                      onEmojiSelect={handleEmojiSelect}
                      disabled={isSending}
                    />
                    <GifPicker
                      onGifSelect={handleGifSelect}
                      disabled={isSending}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowFileUpload(!showFileUpload)}
                      disabled={isSending}
                      className="flex-shrink-0"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </PopoverContent>
                </Popover>

                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  disabled={isSending}
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={isSending || !newMessage.trim()}
                  className="px-6 lg:min-w-[80px]"
                  size="default"
                >
                  {isSending ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Send className="h-7 w-7 text-black" />
                      {/* <span className="text-black">Send</span> */}
                    </div>
                  )}
                </Button>
              </form>
              <div className="text-xs text-gray-500 text-center">
                Press Enter to send • 😊 for emojis • GIF for animations • 📎 to
                attach files
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Settings</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(false)}
            >
              ✕
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-3">Your Avatar</h4>
              <AvatarUpload
                currentAvatar={currentUser.avatar}
                onAvatarUpdated={handleAvatarUpdated}
                disabled={false}
              />
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

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full mb-2 bg-transparent"
                onClick={() => router.push("/chat/private")}
              >
                💬 Private Messages
              </Button>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => router.push("/")}
              >
                🏠 Home Page
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
