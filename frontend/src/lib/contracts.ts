export type DashboardApiResponse = never

export interface DashboardContractBoundary {
  status: "blocked"
  reason: string
}

export const DASHBOARD_CONTRACT_BOUNDARY: DashboardContractBoundary = {
  status: "blocked",
  reason:
    "No dashboard API endpoints are currently exposed by the backend service.",
}
