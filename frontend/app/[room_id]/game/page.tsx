"use client"
import { useParams } from 'next/navigation'
import React from 'react'

export default function page() {
    const { room_id } = useParams()
    return (
        <div>game - {room_id}</div>
    )
}
