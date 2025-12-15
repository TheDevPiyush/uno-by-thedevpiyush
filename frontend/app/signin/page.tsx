"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, KeyRound, Loader2, Mail } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import { useAuthStore } from "@/utils/stores/user.store"
import { supabase } from "@/utils/supabase/client"

type Step = "email" | "otp"

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export default function SignInPage() {
    const router = useRouter()
    const setUser = useAuthStore((s) => s.setUser)
    const { email: mail } = useAuthStore()

    const [step, setStep] = React.useState<Step>("email")
    const [email, setEmail] = React.useState("")
    const [otp, setOtp] = React.useState("")
    const [sendingOtp, setSendingOtp] = React.useState(false)
    const [verifyingOtp, setVerifyingOtp] = React.useState(false)

    const supabaseEnvMissing =
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

    React.useEffect(() => {
        let mounted = true
            ; (async () => {
                const { data } = await supabase.auth.getSession()
                const session = data.session
                if (!mounted || !session?.user) return

                setUser(session.user.id, session.user.email ?? null)
                router.replace("/")
            })()
        return () => {
            mounted = false
        }
    }, [router, setUser])

    async function handleSendOtp(e?: React.FormEvent) {
        e?.preventDefault()

        const trimmedEmail = email.trim()
        if (!trimmedEmail) {
            toast.error("Email is required")
            return
        }
        if (!isValidEmail(trimmedEmail)) {
            toast.error("Please enter a valid email address")
            return
        }
        if (supabaseEnvMissing) {
            toast.error("Configuration Error", {
                description: "Supabase environment variables are missing"
            })
            return
        }

        setSendingOtp(true)
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: trimmedEmail,
                options: {
                    shouldCreateUser: true,
                    emailRedirectTo: `${location.origin}/api/auth/callback`
                },
            })

            if (error) {
                toast.error("Failed to send verification code", {
                    description: error.message
                })
                return
            }

            setStep("otp")
            setOtp("")
            toast.success("Verification code sent!", {
                description: "Check your email for the 6-digit code"
            })
        } finally {
            setSendingOtp(false)
        }
    }

    async function handleVerifyOtp(e?: React.FormEvent) {
        e?.preventDefault()

        const trimmedEmail = email.trim()
        const trimmedOtp = otp.trim()

        if (!trimmedOtp) {
            toast.error("Verification code is required")
            return
        }
        if (trimmedOtp.length !== 6) {
            toast.error("Please enter the complete 6-digit code")
            return
        }

        setVerifyingOtp(true)
        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email: trimmedEmail,
                token: trimmedOtp,
                type: "email",
            })

            if (error) {
                toast.error("Invalid verification code", {
                    description: error.message
                })
                return
            }

            const user = data.user ?? data.session?.user
            if (user) {
                setUser(user.id, user.email ?? null)
                toast.success("Welcome back!", {
                    description: "Successfully signed in"
                })
            }

            router.replace("/create-or-join-room")
        } finally {
            setVerifyingOtp(false)
        }
    }

    return (
        <div className="min-h-dvh bg-linear-to-br from-background via-background to-muted/20">
            <div className="flex items-center justify-center min-h-dvh px-4 py-12">
                <div className="w-full max-w-sm">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                            Welcome back {mail}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-2">
                            {step === "email"
                                ? "Enter your email to receive a verification code"
                                : "Check your email and enter the code below"
                            }
                        </p>
                    </div>


                    {/* Main Content */}
                    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-sm">
                        {step === "email" ? (
                            <form className="space-y-6" onSubmit={handleSendOtp}>
                                <div className="space-y-3">
                                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                                        Email address
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                                        <Input
                                            id="email"
                                            type="email"
                                            autoComplete="email"
                                            placeholder="Enter your email"
                                            className="pl-10 h-11 bg-background/60 border-border/60 rounded-xl text-sm placeholder:text-muted-foreground/60 focus:bg-background focus:border-ring/40"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={sendingOtp}
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 shadow-sm"
                                    disabled={sendingOtp}
                                >
                                    {sendingOtp ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin mr-2" />
                                            Sending code...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="size-4 mr-2" />
                                            Send verification code
                                        </>
                                    )}
                                </Button>
                            </form>
                        ) : (
                            <form className="space-y-6" onSubmit={handleVerifyOtp}>
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium text-foreground">
                                        Sent to
                                    </Label>
                                    <Input
                                        value={email.trim()}
                                        disabled
                                        className="bg-muted/50 border-border/30 rounded-xl text-sm h-11"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <KeyRound className="size-4 text-muted-foreground/60" />
                                        Verification code
                                    </Label>
                                    <div className="flex justify-center">
                                        <InputOTP
                                            maxLength={6}
                                            value={otp}
                                            onChange={(value) => setOtp(value)}
                                            disabled={verifyingOtp}
                                        >
                                            <InputOTPGroup>
                                                <InputOTPSlot index={0} />
                                                <InputOTPSlot index={1} />
                                                <InputOTPSlot index={2} />
                                                <InputOTPSlot index={3} />
                                                <InputOTPSlot index={4} />
                                                <InputOTPSlot index={5} />
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>
                                    <p className="text-xs text-center text-muted-foreground/60">
                                        Enter the 6-digit code from your email
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 shadow-sm"
                                    disabled={verifyingOtp}
                                >
                                    {verifyingOtp ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin mr-2" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <KeyRound className="size-4 mr-2" />
                                            Verify & continue
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}

                        {/* Footer Actions */}
                        <div className="mt-6 pt-6 border-t border-border/30">
                            <div className="flex items-center justify-between">
                                {step === "otp" ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        onClick={() => {
                                            setStep("email")
                                            setOtp("")
                                        }}
                                        disabled={sendingOtp || verifyingOtp}
                                    >
                                        <ArrowLeft className="size-3.5 mr-2" />
                                        Change email
                                    </Button>
                                ) : (
                                    <span className="text-xs text-muted-foreground/80">
                                        No password required
                                    </span>
                                )}

                                {step === "otp" && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        onClick={() => handleSendOtp()}
                                        disabled={sendingOtp || verifyingOtp || !email.trim()}
                                    >
                                        {sendingOtp ? (
                                            <>
                                                <Loader2 className="size-3.5 animate-spin mr-2" />
                                                Resending...
                                            </>
                                        ) : (
                                            "Resend code"
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

