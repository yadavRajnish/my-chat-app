"use client"

import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import {
  CheckCircle,
  XCircle,
  Loader2,
  Database,
  Users,
  MessageCircle,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [setupResult, setSetupResult] = useState<any>(null)
  const [dbStatus, setDbStatus] = useState<any>(null)

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch("/api/setup")
      const data = await response.json()
      setDbStatus(data)
    } catch (error) {
      setDbStatus({ status: "error", error: "Failed to connect" })
    }
  }

  const runSetup = async () => {
    setIsLoading(true)
    setSetupResult(null)

    try {
      const response = await fetch("/api/setup", { method: "POST" })
      const data = await response.json()
      setSetupResult(data)

      if (data.success) {
        // Refresh database status
        await checkDatabaseStatus()
      }
    } catch (error) {
      setSetupResult({
        success: false,
        error: "Failed to run setup",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Check status on page load
  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🔧 Database Setup</h1>
          <p className="text-xl text-gray-600">Set up your chat application database</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Database Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Database Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={checkDatabaseStatus} variant="outline" className="w-full bg-transparent">
                  Check Database Status
                </Button>

                {dbStatus && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {dbStatus.status === "connected" ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium">{dbStatus.status === "connected" ? "Connected" : "Error"}</span>
                    </div>

                    {dbStatus.tables && (
                      <div>
                        <p className="text-sm font-medium">Tables ({dbStatus.tables.length}):</p>
                        <ul className="text-sm text-gray-600">
                          {dbStatus.tables.map((table: string) => (
                            <li key={table}>✅ {table}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {dbStatus.counts && (
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{dbStatus.counts.users} users</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{dbStatus.counts.messages} messages</span>
                        </div>
                      </div>
                    )}

                    {dbStatus.ready && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 text-green-800">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">Database is ready!</span>
                        </div>
                        <Button asChild className="mt-2 w-full">
                          <a href="/">Go to Chat App</a>
                        </Button>
                      </div>
                    )}

                    {dbStatus.error && (
                      <div className="text-red-600 text-sm bg-red-50 p-2 rounded">Error: {dbStatus.error}</div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Setup Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Automatic Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Click the button below to automatically create all required database tables.
                </p>

                <Button onClick={runSetup} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up database...
                    </>
                  ) : (
                    "🚀 Run Database Setup"
                  )}
                </Button>

                {setupResult && (
                  <div
                    className={`p-4 rounded-lg ${
                      setupResult.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {setupResult.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                      <span className="font-medium">{setupResult.success ? "Setup Successful!" : "Setup Failed"}</span>
                    </div>
                    <p className="text-sm mt-2">{setupResult.message || setupResult.error}</p>

                    {setupResult.features && (
                      <div className="mt-3">
                        <p className="text-sm font-medium">Features enabled:</p>
                        <ul className="text-xs mt-1">
                          {setupResult.features.map((feature: string, index: number) => (
                            <li key={index}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {setupResult.nextSteps && (
                      <div className="mt-3">
                        <p className="text-sm font-medium">Next steps:</p>
                        <ul className="text-xs mt-1">
                          {setupResult.nextSteps.map((step: string, index: number) => (
                            <li key={index}>• {step}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {setupResult.success && (
                      <div className="mt-4 space-y-2">
                        <Button asChild className="w-full">
                          <a href="/">🎉 Go to Chat App</a>
                        </Button>
                        <Button asChild variant="outline" className="w-full bg-transparent">
                          <a href="/login">🔑 Login Page</a>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Manual Setup Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span>Manual Setup (If Automatic Fails)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                If the automatic setup doesn't work due to strict database settings, follow these steps:
              </p>

              <div className="bg-gray-50 p-4 rounded-lg">
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>
                    <strong>Go to FreeSQLDatabase:</strong>
                    <a
                      href="https://www.freesqldatabase.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline inline-flex items-center"
                    >
                      Open FreeSQLDatabase <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </li>
                  <li>
                    Click on <strong>phpMyAdmin</strong> or <strong>Database Manager</strong>
                  </li>
                  <li>
                    Select your database: <code className="bg-gray-200 px-1 rounded">sql12787364</code>
                  </li>
                  <li>
                    Click the <strong>SQL</strong> tab
                  </li>
                  <li>
                    Copy and paste the SQL from:{" "}
                    <code className="bg-gray-200 px-1 rounded">scripts/manual-setup-simple.sql</code>
                  </li>
                  <li>
                    Click <strong>Go</strong> to execute
                  </li>
                  <li>Come back here and click "Check Database Status"</li>
                </ol>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tip:</strong> The manual setup uses the most basic SQL commands that work with any MySQL
                  version, even with the strictest settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
