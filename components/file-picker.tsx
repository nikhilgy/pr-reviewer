"use client"

import { useState, useTransition } from "react"
import { useReview } from "@/contexts/review-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { FileChange } from "@/lib/types"
import { File, FileText, FileCode, ImageIcon, Settings, CheckSquare, Square, Info, Loader2 } from "lucide-react"
import { prepareReviewData } from "@/actions/review"
import { getFileDiff } from "@/actions/review"
import DiffModal from "./diff-modal"

interface FilePickerProps {
  files: FileChange[]
  repoId: string
  prId: string
}

export function FilePicker({ files, repoId, prId }: FilePickerProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [prContext, setPrContext] = useState("")
  const { startReview, isReviewing } = useReview()
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false)
  const [diffContent, setDiffContent] = useState<{
    oldContent: string
    newContent: string
  } | null>(null)
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null)
  const [isDiffLoading, startDiffTransition] = useTransition()

  const getFileIcon = (path: string) => {
    const ext = path.split(".").pop()?.toLowerCase()

    switch (ext) {
      case "js":
      case "ts":
      case "jsx":
      case "tsx":
      case "py":
      case "java":
      case "cs":
      case "cpp":
      case "c":
        return <FileCode className="h-4 w-4" />
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
      case "svg":
        return <ImageIcon className="h-4 w-4" />
      case "json":
      case "xml":
      case "yml":
      case "yaml":
        return <Settings className="h-4 w-4" />
      case "md":
      case "txt":
        return <FileText className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  const getChangeTypeBadge = (changeType: string) => {
    switch (changeType) {
      case "add":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Added
          </Badge>
        )
      case "edit":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Modified
          </Badge>
        )
      case "delete":
        return <Badge variant="destructive">Deleted</Badge>
      default:
        return <Badge variant="secondary">{changeType}</Badge>
    }
  }

  const handleShowDiff = (file: FileChange) => {
    setSelectedFilePath(file.item.path)
    setIsDiffModalOpen(true)
    setDiffContent(null)

    startDiffTransition(async () => {
      const content = await getFileDiff(repoId, prId, file.item.path, file.changeType)
      setDiffContent(content)
    })
  }

  const handleFileToggle = (filePath: string) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath)
    } else {
      newSelected.add(filePath)
    }
    setSelectedFiles(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(files.map((f) => f.item.path)))
    }
  }

  const handleReview = async () => {
    const selectedPaths = Array.from(selectedFiles)
    
    // The review context expects the actual file data, so we fetch it here
    const selectedFileData = await prepareReviewData(repoId, prId, selectedPaths)
    
    // Pass the PR context along with the file data
    await startReview(selectedFileData, prContext)
  }

  return (
    <div className="space-y-6">
      {/* PR Context Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>PR Context</CardTitle>
              <CardDescription>
                Provide additional context about this PR to help with the review
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="pr-context">
              What is this PR about? What changes are being made to the pipeline?
            </Label>
            <Textarea
              id="pr-context"
              placeholder="Describe the purpose of this PR, the changes being made, and any important context for the reviewer..."
              value={prContext}
              onChange={(e) => setPrContext(e.target.value)}
              className="min-h-[100px] resize-y"
            />
          </div>
        </CardContent>
      </Card>

      {/* File Selection Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Changed Files</CardTitle>
              <CardDescription>
                Select files to review with AI ({selectedFiles.size} of {files.length} selected)
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll} className="flex items-center space-x-1">
                {selectedFiles.size === files.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                <span>Select All</span>
              </Button>
              <Button onClick={handleReview} disabled={selectedFiles.size === 0 || isReviewing} size="sm">
                {isReviewing ? "Reviewing..." : "Review with AI"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.item.path}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedFiles.has(file.item.path)}
                    onCheckedChange={() => handleFileToggle(file.item.path)}
                  />

                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {getFileIcon(file.item.path)}
                    <span className="font-mono text-sm truncate">{file.item.path}</span>
                  </div>

                  <div className="flex flex-shrink-0 items-center space-x-2">
                    {getChangeTypeBadge(file.changeType)}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleShowDiff(file)}
                    >
                      <FileText className="h-3 w-3" />
                      <span className="sr-only">Show diff</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      {isDiffModalOpen && selectedFilePath && (
        <DiffModal
          isOpen={isDiffModalOpen}
          onClose={() => setIsDiffModalOpen(false)}
          fileName={selectedFilePath}
          oldContent={diffContent?.oldContent || ""}
          newContent={diffContent?.newContent || ""}
        >
          {isDiffLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </DiffModal>
      )}
    </div>
  )
}
