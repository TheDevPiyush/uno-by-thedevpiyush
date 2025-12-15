import localFont from "next/font/local"

export const hellix = localFont({
    src: [
        {
            path: "../public/fonts/Hellix-Medium.ttf",
            weight: "500",
            style: "normal",
        },
        {
            path: "../public/fonts/Hellix-SemiBold.ttf",
            weight: "600",
            style: "normal",
        },
        {
            path: "../public/fonts/Hellix-Bold.ttf",
            weight: "700",
            style: "normal",
        },
        {
            path: "../public/fonts/Hellix-RegularItalic.ttf",
            weight: "400",
            style: "italic",
        },
    ],
    display: "swap",
    variable: "--font-hellix",
})
