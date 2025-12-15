import type { Metadata } from "next"
import { ThemeProvider } from "next-themes"
import "./globals.css"
import { Toaster } from "sonner"
import { hellix } from "./fonts"
import Providers from "@/utils/Providers"
import { DisplayNameModal } from "@/components/display-name-modal"


export const metadata: Metadata = {
  title: "UNO by TheDevPiyush",
  description: "A multiplayer UNO game developed by TheDevPiyush",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${hellix.variable} antialiased`}
      >
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster position="bottom-right" richColors closeButton />
            <DisplayNameModal />
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html >
  )
}
