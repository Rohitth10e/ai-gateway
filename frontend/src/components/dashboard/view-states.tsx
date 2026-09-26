import { AlertTriangle, Clock3, Inbox, LoaderCircle } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ViewStateProps = {
  title: string
  description: string
  className?: string
  children?: ReactNode
}

function StateContainer({
  title,
  description,
  className,
  children,
}: ViewStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-36 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-4 py-6 text-center",
        className
      )}
    >
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {children}
    </div>
  )
}

export function LoadingState() {
  return (
    <StateContainer
      title="Loading data"
      description="We are fetching the latest dashboard data."
      className="text-muted-foreground"
    >
      <LoaderCircle className="size-4 animate-spin" />
    </StateContainer>
  )
}

export function EmptyState() {
  return (
    <StateContainer
      title="No usage data yet"
      description="Connect traffic to AI Gateway to populate this dashboard."
    />
  )
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <StateContainer
      title="Unable to load data"
      description="A request failed while loading dashboard metrics."
      className="gap-3"
    >
      <AlertTriangle className="size-4 text-destructive" />
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </StateContainer>
  )
}

export function StaleState() {
  return (
    <StateContainer
      title="Showing cached data"
      description="Data may be outdated while the gateway refreshes metrics."
    >
      <Clock3 className="size-4 text-muted-foreground" />
    </StateContainer>
  )
}

export function BlockedContractState({ reason }: { reason: string }) {
  return (
    <StateContainer
      title="Backend contract required"
      description={reason}
      className="gap-3"
    >
      <Inbox className="size-4 text-muted-foreground" />
    </StateContainer>
  )
}
