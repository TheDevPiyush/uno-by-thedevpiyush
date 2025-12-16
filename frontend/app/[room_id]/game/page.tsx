"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowRight, ArrowLeft, RotateCcw, RotateCw, Loader2 } from "lucide-react"
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
import { BASE_API } from "@/utils/backendAPIs"
import { supabase } from "@/utils/supabase/client"

/* ----------------------------- Types ----------------------------- */

interface UnoCard {
    id: string
    color: string
    value: string
}

interface Player {
    user_id: string
    display_name: string
    position: number
    cardCount: number
}

interface GameState {
    game: {
        id: string
        current_turn_position: number
        direction: "clockwise" | "counterclockwise"
        status: string
        pending_draw?: number
    }
    discardCard: UnoCard
    myHand: UnoCard[]
    players: Player[]
}

/* ----------------------------- Page ------------------------------ */

export default function GamePage() {
    const params = useParams()
    const roomCode = Array.isArray(params.room_id) ? params.room_id[0] : params.room_id

    const [gameState, setGameState] = useState<GameState | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [playingCard, setPlayingCard] = useState<string | null>(null)

    /* ------------------------- Helpers ------------------------- */

    const initials = (name: string) =>
        name
            .split(" ")
            .map(n => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()

    const getCardColor = (color: string) => {
        switch (color.toLowerCase()) {
            case "red": return "bg-red-500"
            case "blue": return "bg-blue-500"
            case "green": return "bg-green-500"
            case "yellow": return "bg-yellow-500"
            default: return "bg-gray-800"
        }
    }

    const isMyTurn = () => {
        if (!gameState || !currentUserId) return false
        const myPlayer = gameState.players.find(p => p.user_id === currentUserId)
        return myPlayer?.position === gameState.game.current_turn_position
    }

    const hasPendingDraw = () => {
        return gameState?.game.pending_draw && gameState.game.pending_draw > 0
    }

    const canPlayCards = () => {
        return isMyTurn() && !hasPendingDraw()
    }

    /* ----------------------- Fetch Game State ----------------------- */

    const fetchGameState = async () => {
        try {
            const { data } = await supabase.auth.getSession()
            const session = data.session
            if (!session) return

            setCurrentUserId(session.user.id)

            const res = await fetch(`${BASE_API}/game/${roomCode}/state`, {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.message)

            setGameState(json.data)
        } catch (err: any) {
            toast.error("Failed to load game", {
                description: err.message,
            })
        } finally {
            setLoading(false)
        }
    }

    /* ----------------------- Play Card ----------------------- */

    const playCard = async (cardId: string) => {
        if (!canPlayCards() || playingCard) return

        setPlayingCard(cardId)
        try {
            const { data } = await supabase.auth.getSession()
            const session = data.session
            if (!session) return

            const res = await fetch(`${BASE_API}/game/${roomCode}/play-card`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ cardId }),
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.message)

            // Refresh game state after playing
            // fetchGameState()
        } catch (err: any) {
            toast.error("Failed to play card", {
                description: err.message,
            })
        } finally {
            setPlayingCard(null)
        }
    }


    // ------------------ Draw a card ---------------------
    const drawCard = async () => {
        if (!isMyTurn() || playingCard) return

        try {
            const { data } = await supabase.auth.getSession()
            const session = data.session
            if (!session) return

            const res = await fetch(`${BASE_API}/game/${roomCode}/draw-card`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    "Content-Type": "application/json",
                },
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.message)

            const cardsDrawn = gameState?.game.pending_draw || 1
            toast.success(`Drew ${cardsDrawn} card${cardsDrawn > 1 ? 's' : ''}!`)

            // Refresh game state after drawing
            fetchGameState()
        } catch (err: any) {
            toast.error("Failed to draw card", {
                description: err.message,
            })
        }
    }

    /* ------------------------- Effects ------------------------- */

    useEffect(() => {
        if (!roomCode) return
        fetchGameState()
    }, [roomCode])

    // Realtime updates
    useEffect(() => {
        if (!roomCode) return

        const channel = supabase
            .channel(`game:${roomCode}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "games",
                },
                () => fetchGameState()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [roomCode])

    /* ------------------------- Loading ------------------------- */

    if (loading) {
        return (
            <div className="min-h-dvh flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="size-8 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Loading game...</p>
                </div>
            </div>
        )
    }

    if (!gameState) {
        return (
            <div className="min-h-dvh flex items-center justify-center">
                <p className="text-muted-foreground">Game not found</p>
            </div>
        )
    }

    /* --------------------------- UI --------------------------- */

    const currentPlayer = gameState.players.find(
        p => p.position === gameState.game.current_turn_position
    )

    return (
        <div className="min-h-dvh bg-linear-to-br from-background via-background to-muted/10 p-4">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Game Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">UNO Game</h1>
                        <p className="text-sm text-muted-foreground">Room: {roomCode}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Badge variant="secondary" className="flex items-center gap-2">
                            {gameState.game.direction === "clockwise" ? (
                                <RotateCw className="size-3.5" />
                            ) : (
                                <RotateCcw className="size-3.5" />
                            )}
                            {gameState.game.direction}
                        </Badge>

                        <Badge variant={isMyTurn() ? "default" : "outline"}>
                            {isMyTurn() ? "Your Turn" : `${currentPlayer?.display_name}'s Turn`}
                        </Badge>
                    </div>
                </div>

                {/* Game Board */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Players List */}
                    <div className="lg:order-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Players</CardTitle>
                                <CardDescription>
                                    {gameState.players.length} players in game
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {gameState.players.map((player) => (
                                    <div
                                        key={player.user_id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${player.position === gameState.game.current_turn_position
                                            ? "border-primary bg-primary/5"
                                            : "border-border/30"
                                            }`}
                                    >
                                        <Avatar className="size-10">
                                            <AvatarFallback className="text-sm">
                                                {initials(player.display_name)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                    {player.display_name}
                                                </span>
                                                {player.user_id === currentUserId && (
                                                    <Badge variant="outline" className="text-xs">You</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {player.cardCount} cards
                                            </p>
                                        </div>

                                        {player.position === gameState.game.current_turn_position && (
                                            <div className="flex items-center gap-1">
                                                {gameState.game.direction === "clockwise" ? (
                                                    <ArrowRight className="size-4 text-primary" />
                                                ) : (
                                                    <ArrowLeft className="size-4 text-primary" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Game Center - Discard Pile */}
                    <div className="lg:order-2 flex items-center justify-center">
                        <div className="text-center space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Current Card</h3>
                                <div className="relative mx-auto w-24 h-36">
                                    <div
                                        className={`w-full h-full rounded-xl border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-2xl ${getCardColor(
                                            gameState.discardCard.color
                                        )}`}
                                    >
                                        {gameState.discardCard.value.toUpperCase()}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Last played by{" "}
                                    <span className="font-medium">
                                        {currentPlayer?.display_name}
                                    </span>
                                </p>

                                {!isMyTurn() && (
                                    <Badge variant="secondary" className="text-xs">
                                        Waiting for {currentPlayer?.display_name}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="lg:order-3">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Actions</CardTitle>
                                 <CardDescription>
                                     {hasPendingDraw() && isMyTurn() 
                                         ? `You must draw ${gameState?.game.pending_draw} card${gameState?.game.pending_draw! > 1 ? 's' : ''}` 
                                         : isMyTurn() ? "Choose your move" : "Wait for your turn"
                                     }
                                 </CardDescription>
                            </CardHeader>
                             <CardContent className="space-y-3">
                                 <Button
                                     className={`w-full ${hasPendingDraw() && isMyTurn() ? 'animate-pulse bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                                     disabled={!isMyTurn()}
                                     variant={hasPendingDraw() && isMyTurn() ? "default" : "outline"}
                                     onClick={() => drawCard()}
                                 >
                                     {hasPendingDraw() 
                                         ? `Draw ${gameState?.game.pending_draw} Card${gameState?.game.pending_draw! > 1 ? 's' : ''}`
                                         : "Draw Card"
                                     }
                                 </Button>

                                <Button
                                    className="w-full"
                                    disabled={!isMyTurn()}
                                    variant="outline"
                                >
                                    Call UNO!
                                </Button>

                                 <div className="pt-2">
                                     <p className="text-xs text-muted-foreground text-center">
                                         {hasPendingDraw() && isMyTurn()
                                             ? "You must draw cards before playing"
                                             : isMyTurn()
                                             ? "Click a card below to play it"
                                             : "Wait for your turn to play"
                                         }
                                     </p>
                                 </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* My Hand */}
                <Card>
                    <CardHeader>
                         <CardTitle className="flex items-center justify-between">
                             <span>Your Hand ({gameState.myHand.length} cards)</span>
                             {isMyTurn() && (
                                 <Badge 
                                     variant={hasPendingDraw() ? "destructive" : "default"} 
                                     className="animate-pulse"
                                 >
                                     {hasPendingDraw() 
                                         ? `Must Draw ${gameState?.game.pending_draw} Cards`
                                         : "Your Turn"
                                     }
                                 </Badge>
                             )}
                         </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {gameState.myHand.map((card) => (
                                 <Button
                                     key={card.id}
                                     variant="ghost"
                                     className={`relative w-16 h-24 p-0 rounded-xl border-2 border-white shadow-md hover:scale-105 transition-all ${getCardColor(card.color)
                                         } ${canPlayCards()
                                             ? "hover:shadow-lg cursor-pointer"
                                             : "cursor-not-allowed opacity-60"
                                         } ${playingCard === card.id ? "scale-95 opacity-50" : ""
                                         }`}
                                     onClick={() => playCard(card.id)}
                                     disabled={!canPlayCards() || playingCard === card.id}
                                 >
                                    <span className="text-white font-bold text-sm">
                                        {card.value.toUpperCase()}
                                    </span>

                                    {playingCard === card.id && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                                            <Loader2 className="size-4 animate-spin text-white" />
                                        </div>
                                    )}
                                </Button>
                            ))}
                        </div>

                        {gameState.myHand.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No cards in hand</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
