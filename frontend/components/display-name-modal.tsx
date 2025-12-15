"use client"

import * as React from "react"
import { toast } from "sonner"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { supabase } from "@/utils/supabase/client"

export function DisplayNameModal() {
    const [open, setOpen] = React.useState(false)
    const [name, setName] = React.useState("")
    const [loading, setLoading] = React.useState(false)

    // Check if display_name exists
    React.useEffect(() => {
        const checkName = async () => {
            const { data } = await supabase.auth.getUser()
            const user = data.user

            if (!user) return

            const displayName = user.user_metadata?.display_name
            if (!displayName) {
                setOpen(true)
            }
        }

        checkName()
    }, [])

    const handleSave = async () => {
        const trimmed = name.trim()

        if (trimmed.length < 2) {
            toast.error("Name must be at least 2 characters")
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    display_name: trimmed,
                },
            })

            if (error) throw error

            toast.success("Name saved!")
            setOpen(false)
        } catch (err: any) {
            toast.error("Failed to save name", {
                description: err.message,
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent
                className="sm:max-w-md"
                onInteractOutside={(e: any) => e.preventDefault()}
                onEscapeKeyDown={(e: any) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>Choose a display name</DialogTitle>
                    <DialogDescription>
                        This name will be visible to other players in the lobby.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Piyush"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? "Saving..." : "Continue"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
