'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from "next/navigation";
 import ConfessionCard from '../../components/confessions/ConfessionCard'
import NewConfessionButton from '../../components/confessions/NewConfessionButton'
import { Button } from '../../components/ui/Button'
import Loader from "../../components/ui/Loader";

type ConfessionFilter = "all" | "mine" | "popular" | "recent";

export default function ConfessionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [confessions, setConfessions] = useState<any[]>([]);
  const [filteredConfessions, setFilteredConfessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ConfessionFilter>("all");

  // Handle authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      // Store current URL to redirect back after login
      localStorage.setItem("redirectAfterLogin", window.location.pathname);

      // Use a simple approach with window.location to avoid Next.js router issues
      window.location.href = "/auth/signin";
    } else if (status === "authenticated") {
      console.log("User is authenticated, session is valid");
      // Clear any stored redirect if we're successfully authenticated
      localStorage.removeItem("redirectAfterLogin");
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
      setConfessions(data.confessions || []);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching confessions");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = (filter: ConfessionFilter) => {
    if (!confessions.length) {
      setFilteredConfessions([]);
      return;
    }

    let filtered;
    switch (filter) {
      case "mine":
        filtered = confessions.filter((confession) => confession.isSender);
        break;
      case "popular":
        filtered = [...confessions].sort((a, b) => b.likes - a.likes);
        break;
      case "recent":
        filtered = [...confessions].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        break;
      default:
        filtered = confessions;
    }

    setFilteredConfessions(filtered);
  };

  const handleFilterChange = (filter: ConfessionFilter) => {
    setActiveFilter(filter);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <Loader text="Loading confessions..." />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-purple-800">Confessions</h1>
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
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
            <button
              className="underline text-red-700 font-medium mt-2"
              onClick={fetchConfessions}
            >
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !error && filteredConfessions.length === 0 && (
          <div className="text-center py-10">
            <p className="text-lg text-gray-500 mb-4">No confessions found</p>
            {activeFilter !== "all" ? (
              <Button
                variant="secondary"
                onClick={() => handleFilterChange("all")}
              >
                Show All Confessions
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => router.push("/confessions/new")}
              >
                Create Your First Confession
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredConfessions.map((confession) => (
            <ConfessionCard key={confession.id} confession={confession} />
          ))}
        </div>
      </main>
    </div>
  );
}