"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function ClearCachePage() {
  const router = useRouter()

  const handleClearCache = () => {
    // Clear localStorage
    localStorage.clear()
    
    // Clear sessionStorage
    sessionStorage.clear()
    
    // Show alert
    alert("Cache cleared successfully! You will be redirected to the login page.")
    
    // Redirect to home
    router.push("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Clear Browser Cache</CardTitle>
          <CardDescription>
            Click the button below to clear all cached data and logout
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleClearCache} className="w-full">
            Clear Cache & Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
