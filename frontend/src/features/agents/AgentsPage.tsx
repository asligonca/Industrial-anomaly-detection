import { PageHeader } from '@/components/ui/PageHeader'
import { AgentPipeline } from './AgentPipeline'
import { RecentDecisions } from './RecentDecisions'

/** Ajan akışı: ajan hattının durumu ve son kararlar (canlı alarm mesajıyla yenilenir). */
export function AgentsPage() {
  return (
    <section className="flex max-w-[1100px] flex-col gap-6">
      <PageHeader title="Ajan akışı" />
      <AgentPipeline />
      <RecentDecisions />
    </section>
  )
}
