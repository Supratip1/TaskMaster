import { Task } from '@shared/schema';

export const mockTasks: Task[] = [
  {
    id: 1,
    title: "Write project proposal",
    status: "In Progress", // Note: We'll normalize the status
    priority: "High",      // and priority values
    createdAt: new Date("2024-01-01").toISOString()
  },
  // ... more tasks
];

// Helper function to normalize the data
export function normalizeMockData(data: any[]): Task[] {
  try {
    return data.map((task, index) => {
      if (!task) {
        console.error(`Invalid task at index ${index}:`, task);
        throw new Error(`Invalid task at index ${index}`);
      }

      // Normalize status
      let status: Task['status'] = "Todo";
      if (task.status === "in_progress") status = "In Progress";
      else if (task.status === "completed") status = "Done";
      else if (task.status === "not_started") status = "Todo";

      // Normalize priority
      let priority: Task['priority'] = "Medium";
      if (task.priority === "high" || task.priority === "urgent") priority = "High";
      else if (task.priority === "medium") priority = "Medium";
      else if (task.priority === "low" || task.priority === "none") priority = "Low";

      const normalizedTask: Task = {
        id: task.id,
        title: task.title,
        status,
        priority,
        createdAt: task.createdAt || new Date().toISOString()
      };

      // Validate the normalized task
      if (!normalizedTask.id || !normalizedTask.title) {
        console.error('Invalid task data:', task);
        throw new Error(`Missing required fields in task at index ${index}`);
      }

      return normalizedTask;
    });
  } catch (error) {
    console.error('Error normalizing tasks:', error);
    throw error;
  }
} 