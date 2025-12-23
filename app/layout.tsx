import './globals.css'
import { Inter } from 'next/font/google'
import type { Viewport } from 'next'
import GlobalSweetMessage from '../components/GlobalSweetMessage'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '明家居家護理服務 - Intranet',
  description: '明家居家護理服務內部管理系統',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 5.0,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" className="scroll-smooth">
      <head>
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={`${inter.className} mobile-friendly antialiased`}>
        {children}
        <GlobalSweetMessage />
      </body>
    </html>
  )
}
