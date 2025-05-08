'use client'

import { useState } from 'react'
import { Button } from '../ui/Button'
import { useRouter } from 'next/navigation'

export default function NewConfessionButton() {
  const router = useRouter()
  
  return (
    <Button
      variant="primary"
      onClick={() => router.push('/confessions/new')}
      className="flex items-center space-x-2"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 4v16m8-8H4" 
        />
      </svg>
      <span>New Confession</span>
    </Button>
  )
} 