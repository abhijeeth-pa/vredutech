import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: "EduTech VR Platform",
  description: "AI-powered VR education platform with immersive learning experiences",
  generator: "v0.app",
  other: {
    "permissions-policy": "xr-spatial-tracking=*, camera=*, microphone=*, gyroscope=*, accelerometer=*",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
