'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Footer from '../components/layout/Footer'

export default function Home() {
  const { status } = useSession()
  const router = useRouter()
  
  // Redirect to confessions if logged in
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/confessions')
    }
  }, [status, router])
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden flex flex-col">
      {/* Stars */}
      <div className="stars"></div>
      <div className="stars2"></div>
      <div className="stars3"></div>
      <div className="shooting-stars"></div>
      
      {/* Floating hearts */}
      <div className="absolute top-1/4 left-1/6 opacity-40 text-pink-500 text-5xl animate-float-slow">
        ❤️
      </div>
      <div className="absolute top-3/4 right-1/6 opacity-30 text-pink-500 text-4xl animate-float-medium">
        ❤️
      </div>
      
      {/* Header */}
      <header className="relative z-10">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-pink-500">
              CrushConfessions
            </div>
          </div>
        </nav>
      </header>
      
      {/* Main content */}
      <main className="relative z-10 container mx-auto px-6 flex flex-col items-center justify-center flex-grow text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-400 text-transparent bg-clip-text">
          <span className="block mb-2">Anonymous</span>
          <span className="block mb-2">Confessions for</span>
          <span className="block">University Students</span>
        </h1>
        
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-blue-300">
          Find Your Perfect Match
        </h2>
        
        <p className="text-white text-lg md:text-xl mb-12 max-w-3xl">
          Share your secret feelings with classmates, send anonymous notes to your
          crush, and connect with others on campus - all with verified university
          email protection.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto">
          <Link 
            href="/auth/signup"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-md transition-colors flex items-center justify-center relative overflow-hidden group"
          >
            <span className="absolute right-0 translate-x-3 opacity-70 text-xl group-hover:translate-x-0 transition-transform">
              💖
            </span>
            <span>Sign Up with @umt.edu.pk</span>
          </Link>
          
          <Link 
            href="/auth/signin"
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-6 rounded-md transition-colors flex items-center justify-center relative overflow-hidden group"
          >
            <div className="absolute left-4 group-hover:left-6 transition-all duration-300 flex items-center justify-center">
              <span className="text-xl z-10 group-hover:animate-shine">🌙</span>
              <div className="absolute w-6 h-6 rounded-full bg-yellow-300/30 group-hover:animate-glow"></div>
              
              {/* Blurry shine effect */}
              <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute -inset-2 bg-yellow-200/10 rounded-full blur-md group-hover:animate-pulse-slow"></div>
                <div className="absolute -inset-3 bg-yellow-300/5 rounded-full blur-xl group-hover:animate-pulse-slower"></div>
                <div className="absolute -inset-4 bg-yellow-100/5 rounded-full blur-2xl group-hover:animate-pulse-slowest"></div>
              </div>
            </div>
            <span className="ml-8">Login</span>
          </Link>
        </div>
      </main>
      
      {/* Features */}
      <section className="relative z-10 container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center hover:bg-white/20 transition-colors">
            <div className="text-4xl mb-4 mx-auto">🔒</div>
            <h3 className="text-xl font-bold text-white mb-2">Verified Campus Only</h3>
            <p className="text-gray-300">
              Only students with verified @umt.edu.pk email addresses can participate, keeping your community safe and authentic.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center hover:bg-white/20 transition-colors">
            <div className="text-4xl mb-4 mx-auto">👋</div>
            <h3 className="text-xl font-bold text-white mb-2">Respond Anonymously</h3>
            <p className="text-gray-300">
              Use "Flirt Back" to show interest while staying anonymous, or "Reveal" your identity when you're ready to connect.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center hover:bg-white/20 transition-colors">
            <div className="text-4xl mb-4 mx-auto">🎵</div>
            <h3 className="text-xl font-bold text-white mb-2">Share Your Vibe</h3>
            <p className="text-gray-300">
              Connect your Spotify to share playlists that reflect your crush's energy, adding another layer to your anonymous connection.
            </p>
            <div className="mt-3">
              <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full animate-pulse">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <Footer />
      
      <style jsx global>{`
        @keyframes twinkle {
          0% { opacity: 0.2; }
          50% { opacity: 0.8; }
          100% { opacity: 0.2; }
        }
        
        @keyframes shooting {
          0% {
            transform: translateX(0) translateY(0) rotate(-45deg);
            opacity: 1;
          }
          100% {
            transform: translateX(-100vw) translateY(100vh) rotate(-45deg);
            opacity: 0;
          }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes float-medium {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        
        @keyframes shine {
          0% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.5); opacity: 1; }
          100% { transform: scale(1); opacity: 0.7; }
        }
        
        @keyframes glow {
          0% { 
            box-shadow: 0 0 5px 2px rgba(255, 255, 150, 0.3),
                       0 0 10px 5px rgba(255, 255, 150, 0.1); 
            opacity: 0.7;
          }
          50% { 
            box-shadow: 0 0 15px 7px rgba(255, 255, 150, 0.6),
                       0 0 25px 10px rgba(255, 255, 150, 0.2); 
            opacity: 1;
          }
          100% { 
            box-shadow: 0 0 5px 2px rgba(255, 255, 150, 0.3),
                       0 0 10px 5px rgba(255, 255, 150, 0.1); 
            opacity: 0.7;
          }
        }
        
        @keyframes pulse-slow {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        
        @keyframes pulse-slower {
          0% { transform: scale(0.9); opacity: 0.3; }
          60% { transform: scale(1.05); opacity: 0.6; }
          100% { transform: scale(0.9); opacity: 0.3; }
        }
        
        @keyframes pulse-slowest {
          0% { transform: scale(0.9); opacity: 0.2; }
          70% { transform: scale(1.1); opacity: 0.4; }
          100% { transform: scale(0.9); opacity: 0.2; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .stars, .stars2, .stars3 {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        
        .stars {
          background: transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000'%3E%3Cg fill='%23ffffff'%3E%3Ccircle cx='100' cy='100' r='1'/%3E%3Ccircle cx='300' cy='200' r='1'/%3E%3Ccircle cx='500' cy='50' r='1'/%3E%3Ccircle cx='700' cy='150' r='1'/%3E%3Ccircle cx='900' cy='300' r='1'/%3E%3Ccircle cx='150' cy='350' r='1'/%3E%3Ccircle cx='250' cy='450' r='1'/%3E%3Ccircle cx='450' cy='550' r='1'/%3E%3Ccircle cx='650' cy='450' r='1'/%3E%3Ccircle cx='850' cy='550' r='1'/%3E%3Ccircle cx='50' cy='650' r='1'/%3E%3Ccircle cx='350' cy='750' r='1'/%3E%3Ccircle cx='550' cy='850' r='1'/%3E%3Ccircle cx='750' cy='950' r='1'/%3E%3Ccircle cx='950' cy='750' r='1'/%3E%3C/g%3E%3C/svg%3E") repeat;
          animation: twinkle 6s infinite;
        }
        
        .stars2 {
          background: transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000'%3E%3Cg fill='%23ffffff'%3E%3Ccircle cx='200' cy='150' r='1.2'/%3E%3Ccircle cx='400' cy='250' r='1.2'/%3E%3Ccircle cx='600' cy='100' r='1.2'/%3E%3Ccircle cx='800' cy='200' r='1.2'/%3E%3Ccircle cx='100' cy='300' r='1.2'/%3E%3Ccircle cx='300' cy='400' r='1.2'/%3E%3Ccircle cx='500' cy='500' r='1.2'/%3E%3Ccircle cx='700' cy='600' r='1.2'/%3E%3Ccircle cx='900' cy='500' r='1.2'/%3E%3Ccircle cx='100' cy='700' r='1.2'/%3E%3Ccircle cx='300' cy='800' r='1.2'/%3E%3Ccircle cx='500' cy='900' r='1.2'/%3E%3Ccircle cx='700' cy='800' r='1.2'/%3E%3Ccircle cx='900' cy='700' r='1.2'/%3E%3C/g%3E%3C/svg%3E") repeat;
          animation: twinkle 4s infinite;
          animation-delay: 1s;
        }
        
        .stars3 {
          background: transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000'%3E%3Cg fill='%23ffffff'%3E%3Ccircle cx='150' cy='100' r='1.5'/%3E%3Ccircle cx='350' cy='200' r='1.5'/%3E%3Ccircle cx='550' cy='300' r='1.5'/%3E%3Ccircle cx='750' cy='100' r='1.5'/%3E%3Ccircle cx='950' cy='250' r='1.5'/%3E%3Ccircle cx='50' cy='400' r='1.5'/%3E%3Ccircle cx='250' cy='500' r='1.5'/%3E%3Ccircle cx='450' cy='400' r='1.5'/%3E%3Ccircle cx='650' cy='500' r='1.5'/%3E%3Ccircle cx='850' cy='400' r='1.5'/%3E%3Ccircle cx='150' cy='600' r='1.5'/%3E%3Ccircle cx='350' cy='700' r='1.5'/%3E%3Ccircle cx='550' cy='600' r='1.5'/%3E%3Ccircle cx='750' cy='700' r='1.5'/%3E%3Ccircle cx='950' cy='800' r='1.5'/%3E%3C/g%3E%3C/svg%3E") repeat;
          animation: twinkle 8s infinite;
          animation-delay: 2s;
        }
        
        .shooting-stars:after {
          content: "";
          position: absolute;
          top: 0;
          left: 80%;
          width: 4px;
          height: 4px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1), 0 0 0 8px rgba(255, 255, 255, 0.1), 0 0 20px rgba(255, 255, 255, 1);
          animation: shooting 6s infinite linear;
          animation-delay: 2s;
        }
        
        .shooting-stars:before {
          content: "";
          position: absolute;
          top: 20%;
          left: 40%;
          width: 3px;
          height: 3px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1), 0 0 0 6px rgba(255, 255, 255, 0.1), 0 0 20px rgba(255, 255, 255, 1);
          animation: shooting 8s infinite linear;
          animation-delay: 6s;
        }
        
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        
        .animate-float-medium {
          animation: float-medium 5s ease-in-out infinite;
          animation-delay: 1s;
        }
        
        .animate-shine {
          animation: shine 2s ease-in-out infinite;
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        
        .animate-spin {
          animation: spin 8s linear infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-pulse-slower {
          animation: pulse-slower 5s ease-in-out infinite;
          animation-delay: 0.5s;
        }
        
        .animate-pulse-slowest {
          animation: pulse-slowest 7s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </div>
  )
} 