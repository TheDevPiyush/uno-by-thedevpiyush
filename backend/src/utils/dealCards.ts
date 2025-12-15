import { supabase } from "./supabase/client"


export const dealCards = async (gameId: string, roomId: string) => {
    const { data: players, error: playersError } = await supabase
        .from("room_players")
        .select("user_id, position")
        .eq("room_id", roomId)
        .order("position", { ascending: true })

    if (playersError || !players || players.length < 2) {
        throw new Error("Invalid players list")
    }

    const { data: drawPile, error: cardsError } = await supabase
        .from("cards")
        .select("*")
        .eq("game_id", gameId)
        .eq("location", "draw_pile")
        .order("position", { ascending: true })

    if (cardsError || !drawPile || drawPile.length < 15) {
        throw new Error("Draw pile is invalid or too small")
    }

    let cursor = 0
    const updates: { id: string; payload: any }[] = []

    for (const player of players) {
        for (let i = 0; i < 7; i++) {
            const card = drawPile[cursor++]

            updates.push({
                id: card.id,
                payload: {
                    location: "player",
                    owner_user_id: player.user_id,
                    position: null,
                },
            })
        }
    }

    let discardCardFound = false

    while (cursor < drawPile.length && !discardCardFound) {
        const card = drawPile[cursor++]

        const isInvalidFirstCard =
            card.color === "wild" ||
            ["skip", "reverse", "draw_two"].includes(card.value)

        if (isInvalidFirstCard) continue

        updates.push({
            id: card.id,
            payload: {
                location: "discard_pile",
                owner_user_id: null,
                position: 1,
            },
        })

        discardCardFound = true
    }

    if (!discardCardFound) {
        throw new Error("No valid discard card found")
    }

    let drawPosition = 1

    for (let i = cursor; i < drawPile.length; i++) {
        updates.push({
            id: drawPile[i].id,
            payload: {
                position: drawPosition++,
            },
        })
    }

    for (const update of updates) {
        const { error } = await supabase
            .from("cards")
            .update(update.payload)
            .eq("id", update.id)

        if (error) {
            throw new Error("Failed to update card state")
        }
    }

    return true
}
