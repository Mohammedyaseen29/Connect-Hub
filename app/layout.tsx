import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import {ClerkProvider} from "@clerk/nextjs"
import './globals.css'
import { ThemeProvider } from '@/components/Provider/theme-provider'
import { cn } from '@/lib/utils'
import ModalProvider from '@/components/Provider/modalProvided'
import { SockerProvider } from '@/components/Provider/socketProvider'
import { QueryProvider } from '@/components/Provider/queryProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Connect Hub',
  description: 'Bringing People Together, Building Stronger Communities.',
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: ["nextjs", "nextjs13", "next13", "pwa", "next-pwa"],
  icons: [
    { rel: "apple-touch-icon", url: "icons/icon-128x128.png" },
    { rel: "icon", url: "icons/icon-128x128.png" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
        <html lang="en">
          <body className={cn(inter.className,"bg-white dark:bg-[#313338]")}>
            <ThemeProvider attribute='class' defaultTheme='dark' enableSystem disableTransitionOnChange>
              <SockerProvider>
              <ModalProvider />
              <QueryProvider>
              {children}
              </QueryProvider>
              </SockerProvider>
              </ThemeProvider>
            </body>
        </html>
    </ClerkProvider>
  )
}
