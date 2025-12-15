"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    Copy,
    Crown,
    Play,
    Users,
    UserCheck,
    Clock,
    Loader2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

import { BASE_API } from "@/utils/backendAPIs"
import { supabase } from "@/utils/supabase/client"

/* ----------------------------- Types ----------------------------- */

interface Player {
    user_id: string
    position: number
    display_name: string
    email?: string
    is_host: boolean
}

/* ----------------------------- Page ------------------------------ */

export default function GameLobbyPage() {
    const params = useParams()
    const router = useRouter()
    const roomCode = Array.isArray(params.room_id)
        ? params.room_id[0]
        : params.room_id

    const [players, setPlayers] = useState<Player[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [starting, setStarting] = useState(false)

    const isHost = players.some(
        (p) => p.position === 1 && p.user_id === currentUserId
    )

    /* ------------------------- Helpers ------------------------- */

    const initials = (name?: string) =>
        name
            ? name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
            : "U"

    /* ----------------------- Fetch Players ----------------------- */

    const fetchPlayers = async () => {
        try {
            const { data } = await supabase.auth.getSession()
            const session = data.session
            if (!session) return

            setCurrentUserId(session.user.id)

            const res = await fetch(
                `${BASE_API}/room/${roomCode}/players`,
                {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                }
            )

            const json = await res.json()
            if (!res.ok) throw new Error(json.message)

            setPlayers(json.data)
        } catch (err: any) {
            toast.error("Failed to load players", {
                description: err.message,
            })
        } finally {
            setLoading(false)
        }
    }

    /* ----------------------- Auto Join ----------------------- */

    const autoJoin = async () => {
        try {
            const { data } = await supabase.auth.getSession()
            const session = data.session
            if (!session) return

            await fetch(`${BASE_API}/room/${roomCode}/join`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    "Content-Type": "application/json",
                },
            })
        } catch {
            // silent – already joined is fine
        }
    }

    /* ------------------------- Effects ------------------------- */

    // Initial load
    useEffect(() => {
        if (!roomCode) return
        autoJoin().then(fetchPlayers)
    }, [roomCode])


    // Realtime - connection with dataabse
    useEffect(() => {
        if (!roomCode) return

        // 1️⃣ Players realtime (join / leave)
        const playersChannel = supabase
            .channel(`room-players:${roomCode}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "room_players",
                },
                () => {
                    fetchPlayers()
                }
            )
            .subscribe()

        // 2️⃣ Room status realtime (game start)
        const roomStatusChannel = supabase
            .channel(`room-status:${roomCode}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "rooms",
                },
                (payload) => {
                    if (payload.new.status === "playing") {
                        router.push(`/${roomCode}/game`)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(playersChannel)
            supabase.removeChannel(roomStatusChannel)
        }
    }, [roomCode])

    /* ------------------------- Actions ------------------------- */

    const copyCode = async () => {
        await navigator.clipboard.writeText(roomCode || "")
        toast.success("Room code copied")
    }

    const startGame = async () => {
        setStarting(true)
        try {
            const { data } = await supabase.auth.getSession()
            const session = data.session
            if (!session) return

            const res = await fetch(
                `${BASE_API}/game/${roomCode}/start`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                }
            )
            const resData = await res.json();

            if (!res.ok) throw new Error(resData?.message)

            router.push(`/${roomCode}/game`)
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setStarting(false)
        }
    }

    /* ------------------------- Loading ------------------------- */

    if (loading) {
        return (
            <div className="min-h-dvh flex items-center justify-center">
                <Loader2 className="size-6 animate-spin text-primary" />
            </div>
        )
    }

    /* --------------------------- UI --------------------------- */

    return (
        <div className="min-h-dvh flex items-center justify-center px-6">
            <div className="w-full max-w-4xl space-y-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">Game Lobby</h1>
                    <div className="flex items-center justify-center gap-2">
                        <Badge variant="secondary" className="font-mono">
                            {roomCode}
                        </Badge>
                        <Button size="icon" variant="ghost" onClick={copyCode}>
                            <Copy className="size-4" />
                        </Button>
                    </div>
                </div>

                {/* Players Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="size-4" />
                                    Players ({players.length}/4)
                                </CardTitle>
                                <CardDescription>
                                    {players.length < 2
                                        ? "Waiting for more players to join..."
                                        : "Ready to start the game!"
                                    }
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className="text-xs">
                                {players.length < 2 ? 'Need more players' : 'Ready to start'}
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                        {players.map((p, i) => (
                            <div key={p.user_id}>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback>
                                            {initials(p.display_name)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                {p.display_name}
                                            </span>
                                            {p.position === 1 && (
                                                <Crown className="size-4 text-yellow-500" />
                                            )}
                                            {p.user_id === currentUserId && (
                                                <Badge variant="outline">You</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {p.email}
                                        </p>
                                    </div>

                                    <UserCheck className="size-4 text-green-500" />
                                </div>

                                {i < players.length - 1 && (
                                    <Separator className="mt-3" />
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Game Controls */}
                <Card>
                    <CardContent className="pt-6">
                        {isHost ? (
                            <div className="space-y-4">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
                                        <Crown className="size-4 text-yellow-500" />
                                        You are the host
                                    </div>
                                    <Button
                                        size="lg"
                                        className="w-full h-12 rounded-xl"
                                        disabled={players.length < 2 || starting}
                                        onClick={startGame}
                                    >
                                        {starting ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin mr-2" />
                                                Starting Game…
                                            </>
                                        ) : (
                                            <>
                                                <Play className="size-4 mr-2" />
                                                Start Game
                                            </>
                                        )}
                                    </Button>
                                    {players.length < 2 && (
                                        <p className="text-xs text-muted-foreground mt-3">
                                            Need at least 2 players to start
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center space-y-3">
                                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="size-4" />
                                    Waiting for host to start the game
                                </div>
                                {players.find(p => p.position === 1) && (
                                    <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-muted/50">
                                        <span className="text-sm font-medium">
                                            {players.find(p => p.position === 1)?.display_name}
                                        </span>
                                        <Crown className="size-3.5 text-yellow-500" />
                                        <span className="text-xs text-muted-foreground">will start the game</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
