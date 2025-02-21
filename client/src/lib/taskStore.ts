import { create } from 'zustand';
import { Task } from '@shared/schema';

type SortField = 'title' | 'priority' | 'status' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface TaskStore {
  tasks: Task[];
  deletedTasks: Task[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  priorityFilter: string[];
  setPriorityFilter: (priorities: string[]) => void;
  statusFilter: string[];
  setStatusFilter: (statuses: string[]) => void;
  sortField: SortField;
  setSortField: (field: SortField) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: number) => void;
  restoreTask: (task: Task) => void;
  selectedTasks: Set<number>;
  selectTask: (id: number) => void;
  deselectTask: (id: number) => void;
  toggleTaskSelection: (id: number) => void;
  selectAllTasks: () => void;
  clearSelection: () => void;
  bulkUpdateTasks: (updates: Partial<Task>) => void;
  bulkDeleteTasks: () => void;
  totalItems: number;
  setTotalItems: (count: number) => void;
  getFilteredTasks: () => Task[];
  getPaginatedTasks: () => Task[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  deletedTasks: [],
  searchTerm: '',
  setSearchTerm: (term) => set({ searchTerm: term }),
  priorityFilter: [],
  setPriorityFilter: (priorities) => set({ priorityFilter: priorities }),
  statusFilter: [],
  setStatusFilter: (statuses) => set({ statusFilter: statuses }),
  sortField: 'createdAt',
  setSortField: (field) => set({ sortField: field }),
  sortOrder: 'desc',
  setSortOrder: (order) => set({ sortOrder: order }),
  currentPage: 1,
  setCurrentPage: (page) => set({ currentPage: page }),
  pageSize: 10,
  setPageSize: (size) => set({ pageSize: size, currentPage: 1 }),
  setTasks: (tasks: Task[]) => {
    try {
      console.log('Setting tasks in store:', tasks);
      if (!Array.isArray(tasks)) {
        console.error('Tasks must be an array:', tasks);
        return;
      }

      const validTasks = tasks.filter(task => {
        const isValid = 
          typeof task.id === 'number' &&
          typeof task.title === 'string' &&
          ['Todo', 'In Progress', 'Done'].includes(task.status) &&
          ['High', 'Medium', 'Low'].includes(task.priority);
        
        if (!isValid) {
          console.warn('Invalid task found:', task);
        }
        return isValid;
      });

      console.log('Setting valid tasks:', validTasks);
      
      set((state) => ({ 
        tasks: validTasks,
        totalItems: validTasks.length,
        currentPage: 1
      }));
    } catch (error) {
      console.error('Error setting tasks:', error);
    }
  },
  addTask: (task) => {
    set((state) => ({
      tasks: [...state.tasks, task],
    }));
  },
  updateTask: (task) => {
    console.log('Updating task in store:', task);
    set((state) => {
      const updatedTasks = state.tasks.map((t) => {
        if (t.id === task.id) {
          console.log('Found task to update:', t);
          console.log('Updated version:', { ...t, ...task });
          return { ...t, ...task };
        }
        return t;
      });
      console.log('New tasks state:', updatedTasks);
      return {
        tasks: updatedTasks,
        totalItems: updatedTasks.length
      };
    });
  },
  deleteTask: (id) => {
    set((state) => {
      const taskToDelete = state.tasks.find((t) => t.id === id);
      if (!taskToDelete) return state;

      return {
        tasks: state.tasks.filter((t) => t.id !== id),
        deletedTasks: [...state.deletedTasks, taskToDelete],
      };
    });
  },
  restoreTask: (task) => {
    set((state) => ({
      tasks: [...state.tasks, task],
      deletedTasks: state.deletedTasks.filter((t) => t.id !== task.id),
    }));
  },
  selectedTasks: new Set<number>(),
  selectTask: (id) => 
    set((state) => ({
      selectedTasks: new Set([...state.selectedTasks, id])
    })),
  deselectTask: (id) =>
    set((state) => {
      const newSelection = new Set(state.selectedTasks);
      newSelection.delete(id);
      return { selectedTasks: newSelection };
    }),
  toggleTaskSelection: (id) =>
    set((state) => {
      const newSelection = new Set(state.selectedTasks);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return { selectedTasks: newSelection };
    }),
  selectAllTasks: () =>
    set((state) => ({
      selectedTasks: new Set(state.tasks.map(t => t.id))
    })),
  clearSelection: () =>
    set({ selectedTasks: new Set() }),
  bulkUpdateTasks: (updates) =>
    set((state) => ({
      tasks: state.tasks.map(task =>
        state.selectedTasks.has(task.id)
          ? { ...task, ...updates }
          : task
      ),
      selectedTasks: new Set() // Clear selection after update
    })),
  bulkDeleteTasks: () =>
    set((state) => {
      const tasksToDelete = state.tasks.filter(t => state.selectedTasks.has(t.id));
      return {
        tasks: state.tasks.filter(t => !state.selectedTasks.has(t.id)),
        deletedTasks: [...state.deletedTasks, ...tasksToDelete],
        selectedTasks: new Set() // Clear selection after delete
      };
    }),
  totalItems: 0,
  setTotalItems: (count) => set({ totalItems: count }),
  getFilteredTasks: () => {
    const state = get();
    console.log('Getting filtered tasks, total tasks:', state.tasks.length); // Debug log
    return state.tasks
      .filter((task) => {
        const matchesSearch = task.title
          .toLowerCase()
          .includes(state.searchTerm.toLowerCase());
        const matchesPriority = state.priorityFilter.length === 0 || 
          state.priorityFilter.includes(task.priority);
        const matchesStatus = state.statusFilter.length === 0 || 
          state.statusFilter.includes(task.status);
        
        return matchesSearch && matchesPriority && matchesStatus;
      })
      .sort((a, b) => {
        const aValue = a[state.sortField];
        const bValue = b[state.sortField];
        const comparison = String(aValue).localeCompare(String(bValue));
        return state.sortOrder === 'asc' ? comparison : -comparison;
      });
  },
  getPaginatedTasks: () => {
    const state = get();
    const filteredTasks = state.getFilteredTasks();
    const start = (state.currentPage - 1) * state.pageSize;
    return filteredTasks.slice(start, start + state.pageSize);
  },
}));
