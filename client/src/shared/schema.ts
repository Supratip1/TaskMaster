export interface Task {
  id: number;
  title: string;
  priority: "High" | "Medium" | "Low";
  status: "Todo" | "In Progress" | "Done";
  createdAt: string; // Change from Date to string since we're using ISO strings
  customFields?: Record<string, any>;
} 