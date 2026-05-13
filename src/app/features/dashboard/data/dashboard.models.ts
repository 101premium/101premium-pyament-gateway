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

export interface DashboardGraphResponse {
  code: string;
  description: string;
  data: DashboardGraphPoint[];
}

export interface DashboardGraphPoint {
  month: string;
  totalAmount: number;
}

export interface DashboardChartBar {
  height: number;
  label: string;
  amount: number;
  monthKey: string;
}
