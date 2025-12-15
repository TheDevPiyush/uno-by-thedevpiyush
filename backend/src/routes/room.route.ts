import { Router } from "express";
import { createRoom, getAllPlayersInRoom, joinRoom } from "../controllers/room.controller";
import { authenticate } from "../middlewares/auth.middleware";

export const roomRouter = Router()

roomRouter.get("/create", authenticate, createRoom)
roomRouter.get("/:roomCode/join", authenticate, joinRoom)
roomRouter.get("/:roomCode/players", authenticate, getAllPlayersInRoom)