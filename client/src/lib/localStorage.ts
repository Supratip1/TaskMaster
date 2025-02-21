import { Task } from '@shared/schema';

const TASKS_STORAGE_KEY = 'tasks';

export function saveTasksToLocalStorage(tasks: Task[]) {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks to localStorage:', error);
  }
}

export function getTasksFromLocalStorage(): Task[] {
  try {
    const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!storedTasks) return [];
    
    const parsedTasks = JSON.parse(storedTasks);
    if (!Array.isArray(parsedTasks)) return [];
    
    return parsedTasks;
  } catch (error) {
    console.error('Failed to load tasks from localStorage:', error);
    return [];
  }
}
