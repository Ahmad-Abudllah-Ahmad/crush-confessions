import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-transparent py-3 mt-auto z-10 relative">
      <div className="container mx-auto text-center text-sm">
        <p className="text-gray-300 mb-1">Only for UMT students with a valid @umt.edu.pk email address</p>
        <div className="flex items-center justify-center space-x-2 mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <a href="mailto:confession.team.code@gmail.com" className="text-gray-300 hover:text-purple-400 transition-colors">
            Contact Us: confession.team.code@gmail.com
          </a>
        </div>
        <p className="text-gray-400 text-xs">dev by A.A.A</p>
      </div>
    </footer>
  );
} 