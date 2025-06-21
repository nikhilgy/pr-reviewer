"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown, GitBranch } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { listRepositories } from "@/actions/azure-devops"
import type { Repo } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"

export function RepoCombobox() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadRepos = async () => {
      try {
        console.log("Loading repositories...")
        setError(null)
        const data = await listRepositories()
        console.log("Repositories loaded:", data)
        setRepos(data)

        // Load last selected repo from localStorage
        const lastRepo = localStorage.getItem("lastSelectedRepo")
        if (lastRepo) {
          setValue(lastRepo)
        }
      } catch (error) {
        console.error("Failed to load repositories:", error)
        setError(error instanceof Error ? error.message : "Failed to load repositories")
        // Show error state to user
        setRepos([])
      } finally {
        setLoading(false)
      }
    }

    loadRepos()
  }, [])

  const handleSelect = (repoName: string) => {
    setValue(repoName)
    setOpen(false)
    localStorage.setItem("lastSelectedRepo", repoName)
    router.push(`/${encodeURIComponent(repoName)}`)
  }

  if (loading) {
    return <Skeleton className="h-10 w-full" />
  }

  if (error) {
    return (
      <div className="w-full p-3 border border-red-200 rounded-md bg-red-50">
        <p className="text-sm text-red-700">
          <strong>Error loading repositories:</strong> {error}
        </p>
        <p className="text-xs text-red-600 mt-1">
          Please check your Azure DevOps configuration in .env.local
        </p>
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {value ? (
            <div className="flex items-center space-x-2">
              <GitBranch className="h-4 w-4" />
              <span>{repos.find((repo) => repo.name === value)?.name}</span>
            </div>
          ) : (
            "Select repository..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search repositories..." />
          <CommandList>
            <CommandEmpty>No repository found.</CommandEmpty>
            <CommandGroup>
              {repos.map((repo) => (
                <CommandItem key={repo.id} value={repo.name} onSelect={() => handleSelect(repo.name)}>
                  <Check className={cn("mr-2 h-4 w-4", value === repo.name ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <GitBranch className="h-4 w-4" />
                      <span className="font-medium">{repo.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Updated {new Date(repo.lastUpdateTime).toLocaleDateString()}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
