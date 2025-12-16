import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { startGame, getGameState, playCard, drawCard } from "../controllers/game.controller";

export const gameRouter = Router()

gameRouter.get("/:roomCode/start", authenticate, startGame)
gameRouter.get("/:roomCode/state", authenticate, getGameState)
gameRouter.post("/:roomCode/play-card", authenticate, playCard)
gameRouter.post("/:roomCode/draw-card", authenticate, drawCard)