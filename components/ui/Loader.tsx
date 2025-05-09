'use client'

import React from 'react'

interface LoaderProps {
  size?: 'small' | 'medium' | 'large'
  text?: string
  center?: boolean
  className?: string
}

export default function Loader({ 
  size = 'medium', 
  text = 'Loading...', 
  center = true,
  className = ''
}: LoaderProps) {
  
  const sizeClasses = {
    small: 'w-5 h-5',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }
  
  const spinnerSize = sizeClasses[size]
  
  return (
    <div className={`flex flex-col items-center ${center ? 'justify-center h-full min-h-[200px]' : ''} ${className}`}>
      <div className={`${spinnerSize} text-purple-600`}>
        <svg 
          className="animate-spin h-full w-full" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          ></circle>
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
      {text && <p className="mt-3 text-purple-600 font-medium">{text}</p>}
    </div>
  )
}