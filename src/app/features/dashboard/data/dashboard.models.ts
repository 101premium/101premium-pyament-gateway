export interface DashboardStatsResponse {
  code: string;
  description: string;
  data: DashboardStatsData;
}

export interface DashboardStatsData {
  totalCount: number;
  pendingCount: number;
  failedCount: number;
  successfulCount: number;
  totalTransaction: number;
  pendingTransaction: number;
  failedTransaction: number;
  successfulTransaction: number;
}
