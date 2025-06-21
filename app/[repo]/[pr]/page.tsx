import { FilePicker } from "@/components/file-picker"
import { ReviewPanel } from "@/components/review-panel"
import { Breadcrumb } from "@/components/breadcrumb"
import { listChangedFiles, getRepositoryByName } from "@/actions/azure-devops"
import { ReviewProvider } from "@/contexts/review-context"
import { notFound } from "next/navigation"

interface PrPageProps {
  params: { repo: string; pr: string }
}

export default async function PrPage({ params }: PrPageProps) {
  const repoName = decodeURIComponent(params.repo)
  const repository = await getRepositoryByName(repoName)
  
  if (!repository) {
    notFound()
  }

  const files = await listChangedFiles(repository.id, params.pr)

  return (
    <ReviewProvider>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: "Repositories", href: "/" },
            { label: repoName, href: `/${params.repo}` },
            { label: `PR #${params.pr}`, href: `/${params.repo}/${params.pr}` },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <FilePicker files={files} repoId={repository.id} prId={params.pr} />
          </div>
          <div className="lg:col-span-1">
            <ReviewPanel />
          </div>
        </div>
      </div>
    </ReviewProvider>
  )
}
