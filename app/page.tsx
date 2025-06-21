import { RepoCombobox } from "@/components/repo-combobox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="flex flex-col items-center space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Nikhil's PR Reviewer</h1>
          <p className="text-muted-foreground">AI-powered code review for Azure DevOps pull requests</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Repository</CardTitle>
          <CardDescription>Choose a repository to start reviewing pull requests</CardDescription>
        </CardHeader>
        <CardContent>
          <RepoCombobox />
        </CardContent>
      </Card>
    </div>
  )
}
