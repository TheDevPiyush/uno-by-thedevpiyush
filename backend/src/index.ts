import express from "express"
import cors from "cors"
import dotenv from 'dotenv'
import { userRouter } from "./routes/user.route"
import { roomRouter } from "./routes/room.route"
import { gameRouter } from "./routes/game.route"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8080

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}))
app.use(express.json())

app.get("/", (_, res) => { res.json({ "status": "connected" }) });

app.use("/user", userRouter);
app.use("/room", roomRouter);
app.use("/game", gameRouter);

app.listen(PORT, () => {
    console.log(`app is live at ${PORT}`)
})