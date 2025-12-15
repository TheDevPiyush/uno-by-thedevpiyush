type CardColor = "red" | "yellow" | "green" | "blue" | "wild"
type CardValue =
    | "0" | "1" | "2" | "3" | "4"
    | "5" | "6" | "7" | "8" | "9"
    | "skip" | "reverse" | "draw_two"
    | "wild" | "wild_draw_four"

interface DeckCard {
    color: CardColor
    value: CardValue
}

export function createUnoDeck(): DeckCard[] {
    const deck: DeckCard[] = []
    const colors: CardColor[] = ["red", "yellow", "green", "blue"]

    // Number cards
    for (const color of colors) {
        deck.push({ color, value: "0" })

        for (let i = 1; i <= 9; i++) {
            deck.push({ color, value: String(i) as CardValue })
            deck.push({ color, value: String(i) as CardValue })
        }

        // Action cards (2 each)
        for (let i = 0; i < 2; i++) {
            deck.push({ color, value: "skip" })
            deck.push({ color, value: "reverse" })
            deck.push({ color, value: "draw_two" })
        }
    }

    // Wild cards
    for (let i = 0; i < 4; i++) {
        deck.push({ color: "wild", value: "wild" })
        deck.push({ color: "wild", value: "wild_draw_four" })
    }

    return deck
}


export function shuffle<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}
