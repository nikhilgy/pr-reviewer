"use client"

import { useState, useEffect } from "react"
import { useReview } from "@/contexts/review-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, AlertTriangle, AlertCircle, Info, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ReviewPanel() {
  const { reviews, isReviewing, progress, lastMessage } = useReview()
  const { toast } = useToast()

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "BLOCKER":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "MAJOR":
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case "MINOR":
        return <Info className="h-4 w-4 text-blue-500" />
      case "NIT":
        return <Zap className="h-4 w-4 text-gray-500" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "BLOCKER":
        return <Badge variant="destructive">Blocker</Badge>
      case "MAJOR":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Major
          </Badge>
        )
      case "MINOR":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Minor
          </Badge>
        )
      case "NIT":
        return <Badge variant="secondary">Nit</Badge>
      default:
        return <Badge variant="secondary">{severity}</Badge>
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "Review comment has been copied to your clipboard.",
    })
  }

  const groupedReviews = reviews.reduce(
    (acc, review) => {
      if (!acc[review.file]) {
        acc[review.file] = []
      }
      acc[review.file].push(review)
      return acc
    },
    {} as Record<string, typeof reviews>,
  )

  const severityCounts = reviews.reduce(
    (acc, review) => {
      acc[review.severity] = (acc[review.severity] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const fileKeys = Object.keys(groupedReviews)
  const [selectedFile, setSelectedFile] = useState<string | undefined>()

  useEffect(() => {
    // Select the first file if no file is selected or if the selected file is no longer valid
    if (fileKeys.length > 0 && (!selectedFile || !fileKeys.includes(selectedFile))) {
      setSelectedFile(fileKeys[0])
    }
  }, [fileKeys, selectedFile])


  if (!isReviewing && reviews.length === 0) {
    return (
      <Card className="sticky top-6">
        <CardHeader>
          <CardTitle>AI Review</CardTitle>
          <CardDescription>Select files and click "Review with AI" to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No reviews yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>AI Review Results</CardTitle>
        {isReviewing && (
          <div className="space-y-2">
            <CardDescription>Analyzing code...</CardDescription>
            <Progress value={progress} className="w-full" />
          </div>
        )}
        {!isReviewing && reviews.length > 0 && (
          <CardDescription>
            Found {reviews.length} issues across {Object.keys(groupedReviews).length} files
          </CardDescription>
        )}
        {!isReviewing && reviews.length > 0 && (
          <CardDescription>
            {lastMessage}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {!isReviewing && reviews.length > 0 && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(severityCounts).map(([severity, count]) => (
                <div key={severity} className="flex items-center space-x-1">
                  {getSeverityIcon(severity)}
                  <span className="text-sm">{count}</span>
                </div>
              ))}
            </div>

            {/* Reviews by file dropdown */}
            <Select onValueChange={setSelectedFile} value={selectedFile}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a file to view feedback" />
              </SelectTrigger>
              <SelectContent>
                {fileKeys.map((file) => (
                  <SelectItem key={file} value={file} className="truncate">
                    <span className="truncate">{file}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedFile && groupedReviews[selectedFile] && (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {groupedReviews[selectedFile].map((review, index) => (
                      <div key={index} className="p-3 rounded-lg border bg-card space-y-2">
                        <div className="flex items-center justify-between">
                          {getSeverityBadge(review.severity)}
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(review.message)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm leading-relaxed">{review.message}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
