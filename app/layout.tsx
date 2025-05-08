import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './providers'
import FooterWrapper from './FooterWrapper'
import NavbarWrapper from './NavbarWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CrushConfessions | Anonymous Campus Crush Platform',
  description: 'Share your feelings anonymously with your campus crushes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <NavbarWrapper />
            {children}
            <FooterWrapper />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
} 