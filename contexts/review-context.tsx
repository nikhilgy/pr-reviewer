"use client"

import { createContext, useContext, useReducer, type ReactNode } from "react"
import { reviewFiles } from "@/actions/review"

interface ReviewChunk {
  file: string
  severity: "BLOCKER" | "MAJOR" | "MINOR" | "NIT"
  message: string
}

interface FileMeta {
  path: string
  language: string
  diff: string
  fullText: string
}

interface ReviewState {
  reviews: ReviewChunk[]
  isReviewing: boolean
  progress: number
  lastMessage: string
}

type ReviewAction =
  | { type: "START_REVIEW" }
  | { type: "UPDATE_PROGRESS"; payload: number }
  | { type: "FINISH_REVIEW"; payload: { message: string; reviews: ReviewChunk[] } }
  | { type: "RESET" }

const initialState: ReviewState = {
  reviews: [],
  isReviewing: false,
  progress: 0,
  lastMessage: "",
}

function reviewReducer(state: ReviewState, action: ReviewAction): ReviewState {
  switch (action.type) {
    case "START_REVIEW":
      return {
        ...state,
        isReviewing: true,
        progress: 0,
        reviews: [],
        lastMessage: "",
      }
    case "UPDATE_PROGRESS":
      return {
        ...state,
        progress: action.payload,
      }
    case "FINISH_REVIEW":
      return {
        ...state,
        isReviewing: false,
        progress: 100,
        lastMessage: action.payload.message,
        reviews: action.payload.reviews,
      }
    case "RESET":
      return initialState
    default:
      return state
  }
}

interface ReviewContextType extends ReviewState {
  startReview: (files: FileMeta[], prContext?: string) => Promise<void>
  reset: () => void
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined)

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reviewReducer, initialState)

  const startReview = async (files: FileMeta[], prContext?: string) => {
    dispatch({ type: "START_REVIEW" })

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        dispatch({ type: "UPDATE_PROGRESS", payload: Math.min(state.progress + 10, 90) })
      }, 500)

      const result = await reviewFiles(files, prContext)
      
      clearInterval(progressInterval)
      
      if (result.success) {
        dispatch({ type: "FINISH_REVIEW", payload: { message: result.message, reviews: result.reviews } })
      } else {
        const errorReviews = [{
          file: "error",
          severity: "BLOCKER" as const,
          message: result.message
        }]
        dispatch({ type: "FINISH_REVIEW", payload: { message: result.message, reviews: errorReviews } })
      }
    } catch (error) {
      console.error("Review failed:", error)
      const errorReviews = [{
        file: "error",
        severity: "BLOCKER" as const,
        message: `Review failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
      dispatch({ type: "FINISH_REVIEW", payload: { message: "Review failed", reviews: errorReviews } })
    }
  }

  const reset = () => {
    dispatch({ type: "RESET" })
  }

  return <ReviewContext.Provider value={{ ...state, startReview, reset }}>{children}</ReviewContext.Provider>
}

export function useReview() {
  const context = useContext(ReviewContext)
  if (context === undefined) {
    throw new Error("useReview must be used within a ReviewProvider")
  }
  return context
}
