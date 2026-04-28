export interface Vendor {
  id: string
  name: string
  email: string
  role: string
  avgRating: number | null
}

export interface FeedbackItem {
  id: string
  rating: number
  comment: string | null
  vendor: { id: string; name: string } | null
  reviewed: boolean
  reviewedAt: string | null
  createdAt: string
  alerts: { id: string; status: string }[]
}

export interface DashboardStats {
  total: number
  avgRating: number | null
  pending: number
  openAlerts: number
}

export interface AlertRuleItem {
  id: string
  name: string
  type: string
  operator: string | null
  value: string
  vendorId: string | null
  active: boolean
  vendor: { id: string; name: string } | null
}

export interface AlertItem {
  id: string
  status: string
  createdAt: string
  rule: { id: string; name: string }
  feedback: FeedbackItem
}
