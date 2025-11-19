export interface Transaction {
  [key: string]: string | number;
}

export interface BaAggregatedData {
  baId: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  stdDevAmount: number;
  cluster?: string; // Assigned by AI
}

export interface ClusterDefinition {
  name: string;
  description: string;
  color: string;
}

export interface AnalysisResult {
  clusters: ClusterDefinition[];
  assignments: { baId: string; clusterName: string }[];
}