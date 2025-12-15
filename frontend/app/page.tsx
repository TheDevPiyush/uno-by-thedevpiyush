"use client"

import Link from "next/link"
import { ArrowRight, Gamepad2, Sparkles, Users, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-linear-to-br from-background via-background to-muted/10">
      <div className="flex items-center justify-center min-h-dvh px-6 py-12">
        <div className="w-full max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-8">
              <div className="p-6 rounded-full bg-primary/10 ring-1 ring-primary/20 shadow-sm">
                <Gamepad2 className="size-12 text-primary" />
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
              UNO
              <span className="text-primary"> Multiplayer</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              The classic card game, reimagined for the digital age. Play with friends in real-time,
              anywhere in the world.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 shadow-sm"
              >
                <Link href="/create-or-join-room">
                  Get Started
                  <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 px-8 rounded-xl border-border/60 hover:bg-muted/50 font-medium transition-all duration-200"
              >
                <Link href="#features">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>

          {/* Features Section */}
          <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <Card className="bg-card/60 backdrop-blur-sm border border-border/60 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-4">
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-3">
                  <Users className="size-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Multiplayer Fun</CardTitle>
                <CardDescription>
                  Play with 2-4 players in real-time. Create private rooms or join existing games instantly.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card/60 backdrop-blur-sm border border-border/60 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-4">
                <div className="p-3 rounded-lg bg-secondary/10 w-fit mb-3">
                  <Zap className="size-5 text-secondary-foreground" />
                </div>
                <CardTitle className="text-lg">Lightning Fast</CardTitle>
                <CardDescription>
                  Smooth gameplay with real-time updates. No lag, no waiting - just pure gaming fun.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card/60 backdrop-blur-sm border border-border/60 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-4">
                <div className="p-3 rounded-lg bg-accent/10 w-fit mb-3">
                  <Sparkles className="size-5 text-accent-foreground" />
                </div>
                <CardTitle className="text-lg">Modern Design</CardTitle>
                <CardDescription>
                  Beautiful, intuitive interface designed for the modern web. Works perfectly on any device.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-card/40 backdrop-blur-sm border border-border/30 rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Ready to Play?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Jump into a game in seconds. Create a room for friends or join an existing match.
            </p>
            <Button
              asChild
              size="lg"
              className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 shadow-sm"
            >
              <Link href="/create-or-join-room">
                Start Playing Now
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground/60">
              Built with ❤️ by <span>
                <a className="text-indigo-500" href="https://TheDevPiyush.com" target="_blank">
                  TheDevPiyush
                </a>
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
