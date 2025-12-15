import { Request, Response } from "express"
import { generateUniqueRoomID } from "../utils/room_id_generator"
import { supabase } from "../utils/supabase/client"
import { sendError, sendSuccess } from "../utils/httpsResponse"

export const createRoom = async (req: Request, res: Response) => {
    try {
        const userId = req?.user?.id
        const name = req.user?.name;

        let room = null
        let roomCode = ""

        while (!room) {
            roomCode = generateUniqueRoomID()

            // create a room
            const { data, error } = await supabase
                .from("rooms")
                .insert({
                    room_code: roomCode,
                    host_id: userId,
                })
                .select()
                .single()

            if (!error) {
                room = data
            }

            if (error && error.code !== "23505") {
                throw error
            }
        }

        // add the host as first player
        await supabase.from("room_players").insert({
            room_id: room.id,
            user_id: userId,
            display_name: name,
            position: 1,
        })

        sendSuccess(res, 201, room.room_code, "Room created successfully")

    } catch (error: any) {
        sendError(res, 500, error.message)
    }
}

export const joinRoom = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const name = req.user?.name;

        const { roomCode } = req.params
        console.log(roomCode)

        // Find room
        const { data: room, error: roomError } = await supabase
            .from("rooms")
            .select("*")
            .eq("room_code", roomCode)
            .single()

        if (roomError || !room) {
            sendError(res, 404, "Room not found");
        }

        if (room.status !== "waiting") {
            sendError(res, 404, "Game already started");
        }

        // all current players
        const { data: players, error: playersError } = await supabase
            .from("room_players")
            .select("*")
            .eq("room_id", room.id)

        if (playersError) {
            throw playersError
        }

        // Prevent duplicate joining
        const alreadyJoined = players.some(p => p.user_id === userId)

        if (alreadyJoined) {
            sendError(res, 404, "Already joined this room");
        }

        // Max players check
        if (players.length >= 4) {
            sendError(res, 404, "Room is full");
        }

        // Assign position
        const position = players.length + 1

        // Insert current player
        await supabase.from("room_players").insert({
            room_id: room.id,
            user_id: userId,
            display_name: name,
            position,
        })

        sendSuccess(res, 200, position, "Joined room successfully")

    } catch (error: any) {
        sendError(res, 500, error.message);
    }
}


export const getAllPlayersInRoom = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { roomCode } = req.params

    try {

        const { data: room, error: roomError } = await supabase
            .from("rooms")
            .select()
            .eq("room_code", roomCode)
            .single()

        if (!room) {
            sendError(res, 404, "Room not found");
        }

        if (roomError) {
            throw roomError
        }

        const { data: players, error: playersError } = await supabase
            .from("room_players")
            .select()
            .eq("room_id", room.id)

        if (playersError) {
            throw playersError
        }

        sendSuccess(res, 200, players, "Players Found")

    }
    catch (error: any) {
        sendError(res, 505, error.message);
    }
}