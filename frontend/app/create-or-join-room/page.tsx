"use client"

import * as React from "react"
import { Gamepad2, Plus, Users } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { BASE_API } from "@/utils/backendAPIs"
import { supabase } from "@/utils/supabase/client"
import { useRouter } from "@bprogress/next"

export default function Home() {

  const [roomCode, setRoomCode] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const [isJoining, setIsJoining] = React.useState(false)
  const router = useRouter()

  async function handleCreateRoom() {
    setIsCreating(true)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        toast.error("Authentication required", {
          description: "Please sign in to create a room"
        })
        return
      }

      const response = await fetch(`${BASE_API}/room/create`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        }
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Room created!", {
          description: `Room code: ${data.data}`
        })

        setRoomCode(data.data)

        setTimeout(() => {
          router.push(`/${data.data}/join`)
        }, 200);
      } else {
        toast.error("Failed to create room", {
          description: data.message || "Please try again"
        })
      }

    } catch (error: any) {
      toast.error("Failed to create room", {
        description: error.message || "Network error. Please check your connection."
      })
    } finally {
      setIsCreating(false)
    }
  }

  async function handleJoinRoom(e?: React.FormEvent) {
    e?.preventDefault()

    const code = roomCode.trim().toUpperCase()
    if (!code) {
      toast.error("Room code is required")
      return
    }

    if (code.length < 4) {
      toast.error("Room code must be at least 4 characters")
      return
    }

    setIsJoining(true)
    try {
      // Get the current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        toast.error("Authentication required", {
          description: "Please sign in to join a room"
        })
        return
      }

      const response = await fetch(`${BASE_API}/room/${code}/join`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        }
      })

      const data = await response.json()

      if (response.ok) {

        toast.success("Joining room...", {
          description: `Connected to room ${code}`
        })

        setTimeout(() => {
          router.push(`/${code}/join`)
        }, 200);

      } else {
        toast.error("Failed to join room", {
          description: data.message || "Room not found or is full"
        })
      }

    } catch (error: any) {
      toast.error("Failed to join room", {
        description: error.message || "Network error. Please check your connection."
      })
    } finally {
      setIsJoining(false)

    }
  }

  return (
    <div className="min-h-dvh bg-linear-to-br from-background via-background to-muted/10">
      <div className="flex items-center justify-center min-h-dvh px-6 py-12">
        <div className="w-full max-w-sm sm:max-w-2xl lg:max-w-5xl">
          {/* Header */}
          <div className="text-center mb-12 lg:mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 rounded-full bg-primary/10 ring-1 ring-primary/20">
                <Gamepad2 className="size-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-3">
              UNO by TheDevPiyush
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Create or join a game room to start playing
            </p>
          </div>

          {/* Game Actions */}
          <div className="flex flex-col lg:flex-row items-stretch gap-6 lg:gap-8">
            {/* Create Room */}
            <div className="flex-1 w-full lg:max-w-md lg:mx-0">
              <Card className="bg-card/60 backdrop-blur-sm border border-border/60 shadow-sm lg:h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Plus className="size-4 text-primary" />
                    </div>
                    Create New Room
                  </CardTitle>
                  <CardDescription>
                    Start a new game and invite friends to join
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleCreateRoom}
                    disabled={isCreating}
                    className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200"
                  >
                    {isCreating ? (
                      <>
                        <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-3" />
                        Creating room...
                      </>
                    ) : (
                      <>
                        <Plus className="size-5 mr-3" />
                        Create Room
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Divider */}
            <div className="flex lg:flex-col items-center justify-center lg:py-8">
              <div className="flex lg:hidden items-center gap-4 w-full">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground/60 bg-background px-3 py-1 rounded-full border border-border/30">
                  OR
                </span>
                <Separator className="flex-1" />
              </div>
              <div className="hidden lg:flex flex-col items-center gap-4">
                <Separator orientation="vertical" className="h-12" />
                <span className="text-xs text-muted-foreground/60 bg-background px-3 py-1 rounded-full border border-border/30">
                  OR
                </span>
                <Separator orientation="vertical" className="h-12" />
              </div>
            </div>

            {/* Join Room */}
            <div className="flex-1 w-full lg:max-w-md lg:mx-0">
              <Card className="bg-card/60 backdrop-blur-sm border border-border/60 shadow-sm lg:h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-lg bg-secondary/80">
                      <Users className="size-4 text-secondary-foreground" />
                    </div>
                    Join Existing Room
                  </CardTitle>
                  <CardDescription>
                    Enter a room code to join an ongoing game
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleJoinRoom} className="space-y-4">
                    <div className="space-y-3">
                      <Label htmlFor="roomCode" className="text-sm font-medium">
                        Room Code
                      </Label>
                      <Input
                        id="roomCode"
                        placeholder="Enter 6-digit code"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        disabled={isJoining}
                        className="h-12 bg-background/60 border-border/60 rounded-xl text-center text-lg font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:bg-background focus:border-ring/40"
                        maxLength={6}
                        autoComplete="off"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isJoining || !roomCode.trim()}
                      variant="secondary"
                      className="w-full h-12 rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium transition-all duration-200"
                    >
                      {isJoining ? (
                        <>
                          <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-3" />
                          Joining room...
                        </>
                      ) : (
                        <>
                          <Users className="size-5 mr-3" />
                          Join Room
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-16 lg:mt-20">
            <p className="text-xs text-muted-foreground/60">
              Choose your preferred way to start playing
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
