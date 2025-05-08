'use client'

import { usePathname } from 'next/navigation'
import Navbar from '../components/layout/Navbar'

export default function NavbarWrapper() {
  const pathname = usePathname()
  
  // Don't show navbar on homepage, login or signup pages
  if (pathname === '/' || 
      pathname.startsWith('/auth/signin') || 
      pathname.startsWith('/auth/signup')) {
    return null
  }
  
  return <Navbar />
} 