import { useEffect, KeyboardEvent, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useTaskStore } from '@/lib/taskStore';
import { TaskTable } from '@/components/tasks/TaskTable';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { CustomFieldsDialog } from '@/components/tasks/CustomFieldsDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, X, Settings, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Task } from '@shared/schema';
import { saveTasksToLocalStorage, getTasksFromLocalStorage } from '@/lib/localStorage';
import {
  getCustomFields,
  saveCustomFields,
  getTaskCustomFields,
  saveTaskCustomFields,
  type CustomField
} from '@/lib/customFields';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import mockTasksData from '@/data/tasks.json';
import { normalizeMockData } from '@/data/mockTasks';

// Add type assertion if needed
const typedMockData = mockTasksData as { id: number; title: string; status: string; priority: string; createdAt: string; }[];

export default function TasksPage() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const store = useTaskStore();
  const customFields = getCustomFields();
  const [view, setView] = useState<'table' | 'kanban'>('table');

  // Force clear localStorage to ensure we load fresh data
  useEffect(() => {
    localStorage.clear();
  }, []);

  useEffect(() => {
    try {
      // Log the imported data
      console.log('Imported mock data:', mockTasksData);
      if (!Array.isArray(mockTasksData)) {
        throw new Error('Mock data is not an array');
      }

      const normalizedTasks = normalizeMockData(mockTasksData);
      console.log('Normalized tasks:', normalizedTasks);

      // Update store with the normalized tasks
      store.setTasks(normalizedTasks);

      toast({
        title: 'Tasks loaded',
        description: `Loaded ${normalizedTasks.length} tasks`,
      });
    } catch (error) {
      console.error('Error loading mock data:', error);
      toast({
        title: 'Error loading tasks',
        description: String(error),
        variant: 'destructive',
      });
    }
  }, []);

  const createMutation = useMutation({
    mutationFn: async (data: Omit<Task, 'id' | 'createdAt'> & { customFields?: Record<string, any> }) => {
      const { customFields: fieldValues, ...taskData } = data;
      
      // Create a new task with generated ID
      const newTask: Task = {
        ...taskData,
        id: Math.max(0, ...store.tasks.map(t => t.id)) + 1,
        createdAt: new Date().toISOString(), // Store as ISO string
      };

      // Save custom fields if present
      if (fieldValues) {
        const allCustomFields = getTaskCustomFields();
        allCustomFields[newTask.id] = fieldValues;
        saveTaskCustomFields(allCustomFields);
      }

      // Update store
      store.addTask(newTask);
      saveTasksToLocalStorage([...store.tasks, newTask]);

      return Promise.resolve(newTask); // Return a Promise to match MutationFunction type
    },
    onSuccess: (response) => {
      toast({ title: 'Task created successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create task',
        description: String(error),
        variant: 'destructive'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Task> & { customFields?: Record<string, any> }) => {
      if (!data.id) {
        throw new Error('Task ID is required for updates');
      }

      const { id, customFields: fieldValues, ...updates } = data;
      const existingTask = store.tasks.find(t => t.id === id);
      
      if (!existingTask) {
        throw new Error(`Task ${id} not found`);
      }

      const updatedTask: Task = {
        ...existingTask,
        ...updates,
        id,
        createdAt: existingTask.createdAt,
        title: updates.title || existingTask.title,
        status: updates.status || existingTask.status,
        priority: updates.priority || existingTask.priority,
      };

      // Save custom fields if present
      if (fieldValues) {
        const allCustomFields = getTaskCustomFields();
        allCustomFields[id] = fieldValues;
        saveTaskCustomFields(allCustomFields);
      }

      // Update store first
      store.updateTask(updatedTask);

      // Then update localStorage
      const updatedTasks = store.tasks.map(t => t.id === id ? updatedTask : t);
      saveTasksToLocalStorage(updatedTasks);

      return updatedTask;
    },
    onSuccess: (updatedTask) => {
      // Force a store update to ensure UI reflects changes
      store.setTasks([...store.tasks]);
      toast({ 
        title: 'Task updated successfully',
        description: `Updated: ${updatedTask.title}`
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update task',
        description: String(error),
        variant: 'destructive'
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/tasks/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: 'Task deleted successfully' });

      // Remove custom field values for the deleted task
      const customFields = getTaskCustomFields();
      delete customFields[id];
      saveTaskCustomFields(customFields);

      // Update localStorage
      const updatedTasks = store.tasks.filter(task => task.id !== id);
      saveTasksToLocalStorage(updatedTasks);
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete task',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleCustomFieldsSave = (fields: CustomField[]) => {
    saveCustomFields(fields);
    toast({
      title: 'Custom fields saved',
      description: 'Your changes have been saved successfully.',
    });
  };

  const handleSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleClearFilters = () => {
    store.setSearchTerm('');
    store.setPriorityFilter([]);
    store.setStatusFilter([]);
  };

  const handlePriorityChange = (value: string) => {
    store.setPriorityFilter(value === "all" ? [] : [value]);
  };

  const handleStatusChange = (value: string) => {
    store.setStatusFilter(value === "all" ? [] : [value]);
  };

  const hasActiveFilters = store.searchTerm || store.priorityFilter.length > 0 || store.statusFilter.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col gap-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold tracking-tight">Tasks</h1>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant={!isMobile && view === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('table')}
                  className="h-8"
                  disabled={isMobile}
                >
                  <TableIcon className="h-4 w-4 mr-2" />
                  Table
                </Button>
                <Button
                  variant={view === 'kanban' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('kanban')}
                  className="h-8"
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Kanban
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CustomFieldsDialog
                fields={customFields}
                onSave={handleCustomFieldsSave}
                trigger={
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    <Settings className="h-4 w-4" />
                  </Button>
                }
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TaskDialog
                      trigger={
                        <Button size="lg" className="gap-2 transition-colors hover:bg-primary/90">
                          <Plus className="w-5 h-5" />
                          Create task
                        </Button>
                      }
                      onSubmit={(data) => createMutation.mutate(data)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create a new task</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
              <div className="w-full md:w-64 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={store.searchTerm}
                  onChange={(e) => store.setSearchTerm(e.target.value)}
                  onKeyDown={handleSearch}
                  className="pl-9 h-10"
                />
              </div>
              <Select
                value={store.priorityFilter.length ? store.priorityFilter[0] : "all"}
                onValueChange={handlePriorityChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={store.statusFilter.length ? store.statusFilter[0] : "all"}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Todo">Todo</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {isMobile ? (
              <TaskCard
                onUpdate={(task) => updateMutation.mutate(task)}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ) : view === 'table' ? (
              <TaskTable
                onUpdate={(task) => updateMutation.mutate(task)}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ) : (
              <KanbanBoard
                onUpdate={(task) => updateMutation.mutate(task)}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            )}
          </div>
        </div>
      </div>

      {isMobile && (
        <div className="fixed bottom-6 right-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <TaskDialog
                  trigger={
                    <Button
                      size="icon"
                      className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
                    >
                      <Plus className="h-6 w-6" />
                    </Button>
                  }
                  onSubmit={(data) => createMutation.mutate(data)}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Create a new task</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}