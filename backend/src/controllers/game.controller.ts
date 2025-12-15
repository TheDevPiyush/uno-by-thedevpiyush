import { Request, Response } from "express"
import { supabase } from "../utils/supabase/client"
import { sendError, sendSuccess } from "../utils/httpsResponse"
import { createUnoDeck, shuffle } from "../utils/deck"
import { dealCards } from "../utils/dealCards"

export const startGame = async (req: Request, res: Response) => {
    const userId = req.user?.id
    const { roomCode } = req.params

    try {
        const { data: room, error: roomError } = await supabase
            .from("rooms")
            .select("*")
            .eq("room_code", roomCode)
            .single()

        if (roomError || !room) {
            return sendError(res, 404, "Room not found")
        }

        if (room.host_id !== userId) {
            return sendError(res, 403, "Only the host can start the game")
        }

        if (room.status !== "waiting") {
            return sendError(res, 400, "Game has already started")
        }

        const { data: players } = await supabase
            .from("room_players")
            .select("user_id, position")
            .eq("room_id", room.id)
            .order("position")

        if (!players || players.length < 2) {
            return sendError(res, 400, "At least 2 players are required")
        }

        const { data: game, error: gameError } = await supabase
            .from("games")
            .insert({
                room_id: room.id,
                status: "active",
                current_turn_position: 1,
                direction: "clockwise",
                draw_pile_count: 108,
            })
            .select()
            .single()

        if (gameError || !game) {
            throw gameError
        }

        /* ------------------- Create + shuffle deck ------------------- */
        const deck = shuffle(createUnoDeck())

        await supabase.from("cards").insert(
            deck.map((card, index) => ({
                game_id: game.id,
                color: card.color,
                value: card.value,
                location: "draw_pile",
                position: index + 1,
            }))
        )

        /* ------------------- Deal cards ------------------- */
        await dealCards(game.id, room.id)

        const { error: roomUpdateError } = await supabase
            .from("rooms")
            .update({ status: "playing" })
            .eq("id", room.id)

        if (roomUpdateError) {
            throw roomUpdateError
        }

        return sendSuccess(res, 201, { gameId: game.id }, "Game started successfully")
    } catch (error: any) {
        console.error(error)
        return sendError(res, 500, error.message || "Failed to start game")
    }
}
