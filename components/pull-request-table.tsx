"use client"

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { PullRequest } from "@/lib/types"
import { GitPullRequest, Calendar } from "lucide-react"

interface PullRequestTableProps {
  pullRequests: PullRequest[]
  repoName: string
  repoId: string
}

export function PullRequestTable({ pullRequests, repoName, repoId }: PullRequestTableProps) {
  const router = useRouter()

  const handleSelectPR = (prId: number) => {
    localStorage.setItem("lastSelectedPR", prId.toString())
    router.push(`/${encodeURIComponent(repoName)}/${prId}`)
  }

  const getStatusBadge = (status: string, isDraft: boolean) => {
    if (isDraft) {
      return <Badge variant="secondary">Draft</Badge>
    }

    switch (status) {
      case "active":
        return <Badge variant="default">Open</Badge>
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        )
      case "abandoned":
        return <Badge variant="destructive">Abandoned</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {pullRequests.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <GitPullRequest className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No pull requests found in this repository.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PR</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pullRequests.map((pr) => (
              <TableRow key={pr.pullRequestId}>
                <TableCell className="font-mono">#{pr.pullRequestId}</TableCell>
                <TableCell>
                  <div className="max-w-md">
                    <p className="font-medium truncate">{pr.title}</p>
                    {pr.description && <p className="text-sm text-muted-foreground truncate">{pr.description}</p>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={pr.createdBy.imageUrl || "/placeholder.svg"} />
                      <AvatarFallback>{pr.createdBy.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{pr.createdBy.displayName}</span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(pr.status, pr.isDraft)}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(pr.creationDate).toLocaleDateString()}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button size="sm" onClick={() => handleSelectPR(pr.pullRequestId)}>
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
