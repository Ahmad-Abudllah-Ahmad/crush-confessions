'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from '../../../components/ui/Button'
import Loader from "../../../components/ui/Loader";

const confessionSchema = z.object({
  content: z
    .string()
    .min(10, 'Confession must be at least 10 characters')
    .max(1000, 'Confession must be less than 1000 characters'),
  targetUserEmail: z
    .string()
    .email('Please enter a valid email address')
    .endsWith('@umt.edu.pk', 'Only @umt.edu.pk email addresses are allowed')
    .or(z.string().length(0)),  
  visibility: z.enum(['PUBLIC', 'PRIVATE']),
})

type ConfessionFormData = z.infer<typeof confessionSchema>

export default function NewConfessionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  if (status === "unauthenticated") {
    router.push("/auth/signin");
  }

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ConfessionFormData>({
    resolver: zodResolver(confessionSchema),
    defaultValues: {
      content: "",
      targetUserEmail: "",
      visibility: "PUBLIC",
    },
  });

  const watchVisibility = watch("visibility");

  const onSubmit = async (data: ConfessionFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/confessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
      }

      // Redirect to confessions feed after successful submission
      router.push("/confessions");
      router.refresh();
    } catch (err: any) {
      setError(
        err.message || "An error occurred while creating the confession"
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <Loader text="Loading..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-purple-800 mb-6">
            Create New Confession
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white rounded-lg shadow-md p-6 space-y-6"
          >
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Your Confession
              </label>
              <textarea
                id="content"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Express your feelings here..."
                {...register("content")}
                disabled={isLoading}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.content.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="targetUserEmail"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Crush&apos;s Email (Optional)
              </label>
              <input
                id="targetUserEmail"
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="their.email@umt.edu.pk"
                {...register("targetUserEmail")}
                disabled={isLoading}
              />
              {errors.targetUserEmail && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.targetUserEmail.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                If you specify your crush&apos;s email, they&apos;ll be notified
                when they log in (but won&apos;t know it&apos;s you unless you
                both reveal interest).
              </p>
            </div>

            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">
                Visibility
              </span>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="PUBLIC"
                    {...register("visibility")}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-gray-700">
                    Public (visible to all UMT students)
                  </span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="PRIVATE"
                    {...register("visibility")}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-gray-700">
                    Private (only visible to your crush)
                  </span>
                </label>
              </div>
              {watchVisibility === "PRIVATE" && !watch("targetUserEmail") && (
                <p className="mt-1 text-sm text-yellow-600">
                  You must specify a crush&apos;s email for private confessions.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="button"
                variant="ghost"
                className="mr-4"
                onClick={() => router.push("/confessions")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={
                  isLoading ||
                  (watchVisibility === "PRIVATE" && !watch("targetUserEmail"))
                }
              >
                {isLoading ? "Submitting..." : "Post Confession"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}