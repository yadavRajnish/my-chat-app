"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { MessageCircle, Users, Shield } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          router.push("/chat")
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">ChatApp</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/login">
                <Button variant="outline" className="px-6">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="px-6">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Connect with Friends
            <span className="block text-blue-600">Instantly</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Experience seamless real-time messaging with our modern chat application. Stay connected, share moments, and
            build communities.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/register">
              <Button size="lg" className="px-8 py-3 text-lg">
                Start Chatting Now
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <Card className="text-center p-6">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Real-time Messaging</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Send and receive messages instantly with our lightning-fast real-time chat system.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-xl">Online Presence</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                See who's online and when your friends were last active with live status indicators.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Secure & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Your conversations are protected with secure authentication and data encryption.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
            <CardHeader>
              <CardTitle className="text-3xl mb-4">Ready to Get Started?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl mb-6 text-blue-100">Join thousands of users already chatting on our platform</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" variant="secondary" className="px-8 py-3 text-lg">
                    Create Account
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 py-3 text-lg border-white text-white hover:bg-white hover:text-blue-600"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <MessageCircle className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">ChatApp</span>
            </div>
            <div className="flex space-x-6">
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Login
              </Link>
              <Link href="/register" className="text-gray-600 hover:text-gray-900">
                Register
              </Link>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-center text-gray-500">
            <p>&copy; 2024 ChatApp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
