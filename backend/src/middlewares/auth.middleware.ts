import { Request, Response, NextFunction } from "express"
import { supabase } from "../utils/supabase/client"

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader) {
            return res.status(401).json({ message: "Missing Authorization header" })
        }

        const token = authHeader.replace("Bearer ", "")

        const { data, error } = await supabase.auth.getUser(token)

        if (error || !data.user) {
            return res.status(401).json({ message: "Invalid or expired token" })
        }

        req.user = {
            id: data.user.id,
            email: data.user.email ?? undefined,
            name: data.user.user_metadata?.display_name
        }

        next()
    } catch (err) {
        console.error(err)
        return res.status(401).json({ message: "Unauthorized" })
    }
}
