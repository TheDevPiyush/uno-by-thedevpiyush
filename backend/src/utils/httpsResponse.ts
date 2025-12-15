import { Response } from "express"

export function sendError(
    res: Response,
    statusCode: number,
    message: string
) {
    return res.status(statusCode).json({ message })
}

export function sendSuccess<T>(
    res: Response,
    statusCode: number,
    data: T,
    message?: string
) {
    return res.status(statusCode).json({
        message,
        data,
    })
}
