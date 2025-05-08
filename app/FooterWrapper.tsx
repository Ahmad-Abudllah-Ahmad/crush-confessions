'use client'

import { usePathname } from 'next/navigation'
import DarkFooter from '../components/layout/DarkFooter'

export default function FooterWrapper() {
  const pathname = usePathname()
  
  // Don't show footer on homepage (it's included in the page itself)
  if (pathname === '/') {
    return null
  }
  
  return <DarkFooter />
} 