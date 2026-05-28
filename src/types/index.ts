export type UserRole =
  | "user"
  | "seller"
  | "affiliate"
  | "agency"
  | "influencer"
  | "white_label"
  | "admin"
  | "superadmin";

export type PlanType = "free" | "pro" | "agency" | "enterprise" | "white_label";

export type SubscriptionStatus = "active" | "cancelled" | "past_due" | "trialing";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  plan: PlanType;
  planStatus: SubscriptionStatus;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  icon: string;
  color: string;
  features: string[];
  downloadUrl?: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  type: "download" | "invoice" | "purchase" | "support" | "plan" | "login";
  title: string;
  subtitle: string;
  date: string;
  icon: string;
  color: string;
}

export interface StatCard {
  label: string;
  value: string;
  sublabel: string;
  icon: string;
  color: string;
  trend?: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  date: string;
  dueDate: string;
}

export interface SupportTicket {
  id: string;
  number: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  updatedAt: string;
}

export interface AffiliateStats {
  totalEarnings: number;
  pendingPayout: number;
  totalReferrals: number;
  conversionRate: number;
  level: "bronze" | "silver" | "gold" | "platinum" | "vip";
}

export interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  seller: Pick<User, "id" | "name" | "avatar">;
  rating: number;
  reviewCount: number;
  deliveryDays: number;
  tags: string[];
  thumbnail?: string;
}
