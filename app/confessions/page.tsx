'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ConfessionCard from '../../components/confessions/ConfessionCard'
import NewConfessionButton from '../../components/confessions/NewConfessionButton'
import { Button } from '../../components/ui/Button'

interface Confession {
  id: string
  content: string
  timestamp: string
  status: string
  likes: number
  comments: number
  targetUserName?: string
  hasLiked: boolean
  isSender: boolean
  visibility: string
  senderRevealed: boolean
  isReceiver: boolean
  receiverRevealed: boolean
  mutualReveal: boolean
  chatChannelId?: string | null
  senderName?: string
}

type FilterType = 'all' | 'popular' | 'recent' | 'mine';

export default function ConfessionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [filteredConfessions, setFilteredConfessions] = useState<Confession[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Simplified authentication check to prevent redirect loops
  useEffect(() => {
    console.log('Current auth status:', status);
    
    // Only redirect if we're definitely not authenticated and not still loading
    if (status === "unauthenticated") {
      console.log('User is not authenticated, storing redirect info in localStorage');
      
      // Store the intended destination in localStorage
      localStorage.setItem('redirectAfterLogin', '/confessions');
      
      // Use a simple approach with window.location to avoid Next.js router issues
      window.location.href = "/auth/signin";
    } else if (status === "authenticated") {
      console.log('User is authenticated, session is valid');
      // Clear any stored redirect if we're successfully authenticated
      localStorage.removeItem('redirectAfterLogin');
    }
  }, [status]);

  // Fetch confessions
  useEffect(() => {
    if (status === "authenticated") {
      fetchConfessions();
    }
  }, [status]);

  // Apply filter when confessions or filter change
  useEffect(() => {
    applyFilter(activeFilter);
  }, [confessions, activeFilter]);

  const fetchConfessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/confessions");

      if (!response.ok) {
        throw new Error("Failed to fetch confessions");
      }

      const data = await response.json();
      setConfessions(data.confessions);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching confessions");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch personal confessions
  const fetchMyConfessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/confessions?feed=sent");

      if (!response.ok) {
        throw new Error("Failed to fetch your confessions");
      }

      const data = await response.json();
      setConfessions(data.confessions);
    } catch (err: any) {
      setError(
        err.message || "An error occurred while fetching your confessions"
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filter to confessions
  const applyFilter = (filterType: FilterType) => {
    let filtered = [...confessions];

    switch (filterType) {
      case "popular":
        // Sort by likes count, descending
        filtered = filtered.sort((a, b) => b.likes - a.likes);
        break;

      case "recent":
        // Sort by timestamp, most recent first
        filtered = filtered.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        break;

      case "mine":
        // Show only confessions where user is the sender
        filtered = filtered.filter(
          (confession) => confession.isSender === true
        );
        break;

      case "all":
      default:
        // No special filtering
        break;
    }

    setFilteredConfessions(filtered);
  };

  // Handle filter button clicks
  const handleFilterChange = (filterType: FilterType) => {
    setActiveFilter(filterType);

    // If switching to "mine" filter, fetch user's confessions specifically
    if (filterType === "mine") {
      fetchMyConfessions();
    } else if (activeFilter === "mine") {
      // If coming from "mine" filter, fetch all confessions again
      fetchConfessions();
    }
  };

  const handleLike = async (confessionId: string) => {
    try {
      const response = await fetch(`/api/confessions/${confessionId}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to like confession");
      }

      // Update UI optimistically
      const updatedConfessions = confessions.map((confession) =>
        confession.id === confessionId
          ? {
              ...confession,
              likes: confession.hasLiked
                ? confession.likes - 1
                : confession.likes + 1,
              hasLiked: !confession.hasLiked,
            }
          : confession
      );

      setConfessions(updatedConfessions);
    } catch (err) {
      console.error("Error liking confession:", err);
    }
  };

  // Function to handle revealing interest
  const handleRevealInterest = async (confessionId: string) => {
    try {
      setError(null);

      const response = await fetch(`/api/confessions/${confessionId}/reveal`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to reveal interest");
      }

      // After successful reveal, refresh the confessions
      if (activeFilter === "mine") {
        fetchMyConfessions();
      } else {
        fetchConfessions();
      }

      alert(
        "Interest revealed successfully! If they also reveal interest, you can start chatting."
      );
    } catch (err: any) {
      console.error("Error revealing interest:", err);
      setError(err.message || "An error occurred while revealing interest");
    }
  };

  // Add delete confession handler
  const handleDelete = async (confessionId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this confession? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/confessions/${confessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete confession");
      }

      // Update UI by removing the deleted confession
      const updatedConfessions = confessions.filter(
        (confession) => confession.id !== confessionId
      );
      setConfessions(updatedConfessions);

      // Show success message
      alert("Confession deleted successfully");
    } catch (err) {
      console.error("Error deleting confession:", err);
      alert("Failed to delete confession. Please try again.");
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl text-purple-600">Loading confessions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-purple-800 mb-2 md:mb-0">
            Campus Confessions
          </h1>
          <NewConfessionButton />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeFilter === "all" ? "primary" : "secondary"}
            onClick={() => handleFilterChange("all")}
          >
            All Confessions
          </Button>
          <Button
            variant={activeFilter === "popular" ? "primary" : "secondary"}
            onClick={() => handleFilterChange("popular")}
          >
            Most Popular
          </Button>
          <Button
            variant={activeFilter === "recent" ? "primary" : "secondary"}
            onClick={() => handleFilterChange("recent")}
          >
            Recent
          </Button>
          <Button
            variant={activeFilter === "mine" ? "primary" : "secondary"}
            onClick={() => handleFilterChange("mine")}
          >
            My Confessions
          </Button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button
              className="ml-4 text-red-500 underline"
              onClick={() =>
                activeFilter === "mine"
                  ? fetchMyConfessions()
                  : fetchConfessions()
              }
            >
              Try Again
            </button>
          </div>
        )}

        {filteredConfessions.length === 0 && !isLoading && !error ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">
              {activeFilter === "mine"
                ? "You haven't created any confessions yet."
                : "No confessions found. Be the first to share!"}
            </p>
            <NewConfessionButton />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredConfessions.map((confession) => (
              <ConfessionCard
                key={confession.id}
                confession={confession}
                onLike={() => handleLike(confession.id)}
                onReveal={() => handleRevealInterest(confession.id)}
                onDelete={() => handleDelete(confession.id)}
                currentUserId={session?.user?.id || ""}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}