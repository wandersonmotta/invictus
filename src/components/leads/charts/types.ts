export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface PlatformMetric {
  label: string;
  value: string;
  change?: number;
}

export interface RegionData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface DualLineDataPoint {
  date: string;
  meta: number;
  google: number;
}
