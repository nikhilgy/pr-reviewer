"use client"

import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-semibold">Nikhil's PR Reviewer</h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <a
              href="https://github.com/your-org/nikhil-pr-reviewer"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4" />
            </a>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
