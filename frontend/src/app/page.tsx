import {
  BlockedContractState,
  EmptyState,
  ErrorState,
  LoadingState,
  StaleState,
} from "@/components/dashboard/view-states"
import { DASHBOARD_CONTRACT_BOUNDARY } from "@/lib/contracts"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm text-muted-foreground">AI Gateway</p>
            <h1 className="text-lg font-semibold">Frontend Dashboard Shell</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-6 py-6">
        <BlockedContractState reason={DASHBOARD_CONTRACT_BOUNDARY.reason} />

        <section className="grid gap-4 md:grid-cols-2">
          <LoadingState />
          <EmptyState />
          <ErrorState />
          <StaleState />
        </section>
      </main>
    </div>
  )
}
