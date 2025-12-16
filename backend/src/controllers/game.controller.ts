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


export const getGameState = async (req: Request, res: Response) => {
    const userId = req.user?.id
    const { roomCode } = req.params

    if (!userId) {
        return sendError(res, 401, "Unauthorized")
    }

    try {
        /* -------------------- Fetch room -------------------- */
        const { data: room } = await supabase
            .from("rooms")
            .select("id, status")
            .eq("room_code", roomCode)
            .single()

        if (!room) {
            return sendError(res, 404, "Room not found")
        }

        if (room.status !== "playing") {
            return sendError(res, 400, "Game has not started yet")
        }

        /* -------------------- Fetch game -------------------- */
        const { data: game } = await supabase
            .from("games")
            .select("*")
            .eq("room_id", room.id)
            .single()

        if (!game) {
            return sendError(res, 404, "Game not found")
        }

        /* -------------------- Fetch players -------------------- */
        const { data: players } = await supabase
            .from("room_players")
            .select("user_id, position, display_name")
            .eq("room_id", room.id)
            .order("position")

        if (!players) {
            return sendError(res, 500, "Failed to fetch players")
        }

        /* -------------------- Fetch my hand -------------------- */
        const { data: myHand } = await supabase
            .from("cards")
            .select("id, color, value")
            .eq("game_id", game.id)
            .eq("location", "player")
            .eq("owner_user_id", userId)

        /* -------------------- Fetch discard card -------------------- */
        const { data: discardCards } = await supabase
            .from("cards")
            .select("id, color, value")
            .eq("game_id", game.id)
            .eq("location", "discard_pile")
            .order("position", { ascending: true })
            .limit(1)

        const discardCard = discardCards?.[0] ?? null

        /* -------------------- Player card counts -------------------- */
        const playerStates = await Promise.all(
            players.map(async (player) => {
                const { count } = await supabase
                    .from("cards")
                    .select("*", { count: "exact", head: true })
                    .eq("game_id", game.id)
                    .eq("location", "player")
                    .eq("owner_user_id", player.user_id)

                return {
                    user_id: player.user_id,
                    display_name: player.display_name,
                    position: player.position,
                    cardCount: count ?? 0,
                }
            })
        )

        /* -------------------- Response -------------------- */
        return sendSuccess(
            res,
            200,
            {
                game: {
                    id: game.id,
                    current_turn_position: game.current_turn_position,
                    direction: game.direction,
                    status: game.status,
                    pending_draw: game.pending_draw
                },
                discardCard,
                myHand,
                players: playerStates,
            },
            "Game state fetched"
        )
    } catch (error: any) {
        console.error(error)
        return sendError(res, 500, "Failed to fetch game state")
    }
}


export const playCard = async (req: Request, res: Response) => {
    const userId = req.user?.id
    const { roomCode } = req.params
    const { cardId } = req.body

    if (!userId) return sendError(res, 401, "Unauthorized")
    if (!cardId) return sendError(res, 400, "Card ID is required")

    try {
        /* -------------------- Room -------------------- */
        const { data: room } = await supabase
            .from("rooms")
            .select("id")
            .eq("room_code", roomCode)
            .single()

        if (!room) return sendError(res, 404, "Room not found")

        /* -------------------- Game -------------------- */
        const { data: game } = await supabase
            .from("games")
            .select("*")
            .eq("room_id", room.id)
            .single()

        if (!game || game.status !== "active") {
            return sendError(res, 400, "Game is not active")
        }

        /* -------------------- Player -------------------- */
        const { data: player } = await supabase
            .from("room_players")
            .select("position")
            .eq("room_id", room.id)
            .eq("user_id", userId)
            .single()

        if (!player) return sendError(res, 403, "Not part of game")
        if (player.position !== game.current_turn_position) {
            return sendError(res, 403, "Not your turn")
        }

        /* -------------------- Card ownership -------------------- */
        const { data: card } = await supabase
            .from("cards")
            .select("*")
            .eq("id", cardId)
            .eq("owner_user_id", userId)
            .eq("location", "player")
            .single()

        if (!card) return sendError(res, 400, "Card not in your hand")

        let wildFreePlay = false

        if (card.color === "wild") {
            wildFreePlay = true;
        } else {
            wildFreePlay = false;
        }


        /* -------------------- Discard card -------------------- */
        const { data: discardCards } = await supabase
            .from("cards")
            .select("*")
            .eq("game_id", game.id)
            .eq("location", "discard_pile")
            .order("position", { ascending: true })
            .limit(1)

        const topDiscard = discardCards?.[0]
        if (!topDiscard) return sendError(res, 500, "Discard pile empty")

        /* -------------------- Validate playable -------------------- */
        const isPlayable =
            game.wild_free_play ||
            card.color === "wild" ||
            card.color === topDiscard.color ||
            card.value === topDiscard.value

        if (!isPlayable) {
            return sendError(res, 400, "This card cannot be played")
        }


        /* -------------------- Clear previous discard -------------------- */
        await supabase
            .from("cards")
            .update({
                location: "discarded",
                position: null,
            })
            .eq("game_id", game.id)
            .eq("location", "discard_pile")


        /* -------------------- Move card to discard -------------------- */
        await supabase
            .from("cards")
            .update({
                location: "discard_pile",
                owner_user_id: null,
                position: 1,
            })
            .eq("id", card.id)

        /* -------------------- Handle power cards -------------------- */
        let pendingDraw = game.pending_draw ?? 0
        let skipNext = false
        let direction = game.direction

        switch (card.value) {
            case "draw_2":
                pendingDraw += 2
                break

            case "draw_4":
                pendingDraw += 4
                break

            case "skip":
                skipNext = true
                break

            case "reverse":
                direction =
                    game.direction === "clockwise"
                        ? "counterclockwise"
                        : "clockwise"
                break
        }

        /* -------------------- Turn calculation -------------------- */
        const { data: players } = await supabase
            .from("room_players")
            .select("position")
            .eq("room_id", room.id)

        const totalPlayers = players?.length ?? 0
        if (totalPlayers < 2) {
            return sendError(res, 500, "Invalid player count")
        }

        const nextPos = (current: number) => {
            if (direction === "clockwise") {
                return current % totalPlayers + 1
            }
            return current - 1 <= 0 ? totalPlayers : current - 1
        }

        let nextTurn = nextPos(game.current_turn_position)
        if (skipNext) {
            nextTurn = nextPos(nextTurn)
        }

        /* -------------------- Update game -------------------- */
        await supabase
            .from("games")
            .update({
                current_turn_position: nextTurn,
                pending_draw: pendingDraw,
                wild_free_play: wildFreePlay,
                direction,
                skip_next: false,
            })
            .eq("id", game.id)

        return sendSuccess(res, 200, null, "Card played successfully")
    } catch (err) {
        console.error(err)
        return sendError(res, 500, "Failed to play card")
    }
}



export const drawCard = async (req: Request, res: Response) => {
    const userId = req.user?.id
    const { roomCode } = req.params

    if (!userId) return sendError(res, 401, "Unauthorized")

    try {
        /* -------------------- Room -------------------- */
        const { data: room } = await supabase
            .from("rooms")
            .select("id")
            .eq("room_code", roomCode)
            .single()

        if (!room) return sendError(res, 404, "Room not found")

        /* -------------------- Game -------------------- */
        const { data: game } = await supabase
            .from("games")
            .select("*")
            .eq("room_id", room.id)
            .single()

        if (!game || game.status !== "active") {
            return sendError(res, 400, "Game is not active")
        }

        /* -------------------- Player -------------------- */
        const { data: player } = await supabase
            .from("room_players")
            .select("position")
            .eq("room_id", room.id)
            .eq("user_id", userId)
            .single()

        if (!player) return sendError(res, 403, "Not part of game")
        if (player.position !== game.current_turn_position) {
            return sendError(res, 403, "Not your turn")
        }

        /* -------------------- Determine draw count -------------------- */
        const drawCount = game.pending_draw > 0 ? game.pending_draw : 1

        for (let i = 0; i < drawCount; i++) {
            const { data: drawCards } = await supabase
                .from("cards")
                .select("id")
                .eq("game_id", game.id)
                .eq("location", "draw_pile")
                .order("position", { ascending: true })
                .limit(1)

            const card = drawCards?.[0]
            if (!card) break

            await supabase
                .from("cards")
                .update({
                    location: "player",
                    owner_user_id: userId,
                    position: null,
                })
                .eq("id", card.id)
        }

        /* -------------------- Advance turn -------------------- */
        const { data: players } = await supabase
            .from("room_players")
            .select("position")
            .eq("room_id", room.id)

        const totalPlayers = players?.length ?? 0

        const nextPos = (current: number) => {
            if (game.direction === "clockwise") {
                return current % totalPlayers + 1
            }
            return current - 1 <= 0 ? totalPlayers : current - 1
        }

        const nextTurn = nextPos(game.current_turn_position)

        /* -------------------- Clear pending draw -------------------- */
        await supabase
            .from("games")
            .update({
                current_turn_position: nextTurn,
                pending_draw: 0,
            })
            .eq("id", game.id)

        return sendSuccess(res, 200, null, "Card(s) drawn")
    } catch (err) {
        console.error(err)
        return sendError(res, 500, "Failed to draw card")
    }
}

