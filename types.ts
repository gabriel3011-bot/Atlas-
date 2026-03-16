
export type TaskStatus = 'TODO' | 'DOING' | 'REVIEW' | 'DONE';
export type TransactionType = 'income' | 'expense';
export type MarketingStatus = 'idea' | 'scheduled' | 'posted';
export type DocumentStatus = 'signed' | 'pending';
export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical';

// Novos cargos definidos conforme solicitação
export type UserRole = 'ADM' | 'FINANCEIRO' | 'MARKETING' | 'EVENTOS' | 'JURIDICO' | 'MEMBER';

export interface ViewProps {
  isEditable: boolean;
  userRoles?: UserRole[]; // Alterado de userRole?: UserRole para array
}

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  category: string;
  assigned_to: string;
  deadline?: string;
  urgency?: UrgencyLevel;
  created_at?: string;
  completed_at?: string; 
}

export interface Transaction {
  id: number;
  amount: number;
  type: TransactionType;
  category: string;
  event_context?: string; // 'launch', 'pre_event_1', 'pre_event_2', 'prom', 'activations', 'general'
  date: string;
  description: string;
  file_url?: string;
}

export interface EventCost {
  id: number;
  event_name: string;
  category: string;
  item_name: string;
  quantity: number;
  unit_price: number | null;
  total_price: number;
  receipt_url?: string;
  status: 'planned' | 'paid';
  created_at?: string;
  updated_at?: string;
}

export interface AppEvent {
  id: number;
  title: string;
  event_date: string;
  location: string;
  description: string;
  status: string;
  capacity?: number;
  category?: string;
}

export interface MarketingPost {
  id: number;
  image_url: string;
  caption: string;
  scheduled_date: string;
  platform: string;
  status: MarketingStatus;
  likes_count?: number;
  comments_count?: number;
}

export interface LegalDocument {
  id: number;
  title: string;
  file_url: string;
  status: DocumentStatus;
  related_party: string;
}

export interface Member {
  id: number;
  name: string;
  role: string;
  phone: string;
  photo_url: string;
  cpf?: string;
  address?: string;
}

export interface Poll {
  id: number;
  title: string;
  description: string;
  deadline: string;
  options: string[];
  total_votes?: number;
  user_voted_option?: string | null;
  results?: Record<string, number>;
}

export interface MeetingMinute {
  id: number;
  title: string;
  date: string;
  file_url?: string | null;
  content?: string | null;
  created_at?: string;
}

export interface MeetingLink {
  id: number;
  title: string;
  url: string;
  date: string;
  created_at?: string;
}

// Navigation Types
export enum View {
  HOME = 'HOME',
  DASHBOARD = 'DASHBOARD',
  FINANCE = 'FINANCE',
  EVENTS = 'EVENTS',
  MARKETING = 'MARKETING',
  LEGAL = 'LEGAL',
  MEMBERS = 'MEMBERS',
  MEETINGS = 'MEETINGS',
  VOTING = 'VOTING',
  GAME = 'GAME'
}
