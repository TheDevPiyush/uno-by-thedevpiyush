import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { startGame } from "../controllers/game.controller";

export const gameRouter = Router()

gameRouter.get("/:roomCode/start", authenticate, startGame)