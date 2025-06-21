import { PullRequestTable } from "@/components/pull-request-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { listPullRequests, getRepositoryByName } from "@/actions/azure-devops"
import { Breadcrumb } from "@/components/breadcrumb"
import { notFound } from "next/navigation"

interface RepoPageProps {
  params: { repo: string }
}

export default async function RepoPage({ params }: RepoPageProps) {
  const repoName = decodeURIComponent(params.repo)
  const repository = await getRepositoryByName(repoName)
  
  if (!repository) {
    notFound()
  }

  const pullRequests = await listPullRequests(repository.id)

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Repositories", href: "/" },
          { label: repoName, href: `/${params.repo}` },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Pull Requests</CardTitle>
          <CardDescription>Select a pull request to review with AI</CardDescription>
        </CardHeader>
        <CardContent>
          <PullRequestTable pullRequests={pullRequests} repoName={repoName} repoId={repository.id} />
        </CardContent>
      </Card>
    </div>
  )
}
