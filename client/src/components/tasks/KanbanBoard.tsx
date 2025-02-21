import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';
import { useTaskStore } from '@/lib/taskStore';
import { Card } from '@/components/ui/card';
import { TaskDialog } from './TaskDialog';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Plus, ChevronsUpDown } from 'lucide-react';
import type { Task } from '@shared/schema';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface KanbanBoardProps {
  onUpdate: (data: Partial<Task> & { customFields?: Record<string, any> }) => void;
  onDelete: (id: number) => void;
  onCreate?: (data: Partial<Task>) => void;
}

// Define the three priority columns.
const priorityColumns = ['High', 'Medium', 'Low'] as const;

const priorityColors = {
  High: 'bg-red-50 text-red-700 border-red-200',
  Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Low: 'bg-green-50 text-green-700 border-green-200',
};

// Template for creating a new task. Pre-populates the priority; default status is fetched from the task table (or set to a default value such as "Todo").
const createTaskTemplate = (priority: Task['priority']): Task => ({
  id: -1,
  title: '',
  status: 'Todo', // Default status – this can be modified later via TaskDialog.
  priority,
  createdAt: new Date(),
  order: 1000,
});

type SortField = 'order' | 'title' | 'status';

export function KanbanBoard({ onUpdate, onDelete, onCreate }: KanbanBoardProps) {
  const store = useTaskStore();
  const [isDragging, setIsDragging] = useState(false);

  // Maintain sort field for each column (default is 'order').
  const [columnSort, setColumnSort] = useState<Record<typeof priorityColumns[number], SortField>>({
    High: 'order',
    Medium: 'order',
    Low: 'order',
  });

  // Global filtering (by search term or other filters) is applied here.
  const filteredTasks = store.tasks
    .filter((task) =>
      task.title.toLowerCase().includes((store.searchTerm ?? '').toLowerCase())
    )
    .filter((task) =>
      store.priorityFilter.length ? store.priorityFilter.includes(task.priority) : true
    );

  // Group tasks by their priority.
  const tasksByPriority = priorityColumns.reduce(
    (acc, priority) => ({
      ...acc,
      [priority]: filteredTasks.filter((task) => task.priority === priority),
    }),
    {} as Record<typeof priorityColumns[number], Task[]>
  );

  // Called when dragging starts.
  const onDragStart = () => {
    setIsDragging(true);
  };

  // Handle drag end, computing new order and updating task (including the task id).
  // Note: Dragging only updates the priority and order. To update status, use the TaskDialog.
  const onDragEnd = (result: DropResult) => {
    setIsDragging(false);
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the dragged task.
    const task = store.tasks.find((t) => t.id === Number(draggableId));
    if (!task) return;

    const sourceColumn = tasksByPriority[source.droppableId as Task['priority']];
    const destinationColumn = tasksByPriority[destination.droppableId as Task['priority']];

    // Calculate new order based on surrounding tasks.
    const getNewOrder = () => {
      const prevTask = destination.index > 0 
        ? destinationColumn[destination.index - 1] 
        : null;
      const nextTask = destination.index < destinationColumn.length 
        ? destinationColumn[destination.index] 
        : null;
      
      const defaultOrder = 1000;
      const orderStep = 1000;
      if (!prevTask && !nextTask) return defaultOrder;
      if (!prevTask) return (nextTask?.order ?? defaultOrder) / 2;
      if (!nextTask) return (prevTask?.order ?? defaultOrder) + orderStep;
      return ((prevTask?.order ?? 0) + (nextTask?.order ?? 0)) / 2;
    };

    // Build update payload including the task id.
    const updates: Partial<Task> & { customFields?: Record<string, any> } = {
      id: task.id,
      priority: destination.droppableId as Task['priority'],
      order: getNewOrder(),
    };

    onUpdate(updates);
  };

  // Sort tasks within each column according to the selected sort field.
  const getSortedTasks = (priority: typeof priorityColumns[number]) => {
    const sortField = columnSort[priority];
    const tasks = [...tasksByPriority[priority]];
    if (sortField === 'order') {
      return tasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    if (sortField === 'title') {
      return tasks.sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortField === 'status') {
      return tasks.sort((a, b) => a.status.localeCompare(b.status));
    }
    return tasks;
  };

  // Handler to update sort field for a column.
  const handleSortChange = (priority: typeof priorityColumns[number], field: SortField) => {
    setColumnSort(prev => ({ ...prev, [priority]: field }));
  };

  return (
    <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {priorityColumns.map((priority) => {
          const sortedTasks = getSortedTasks(priority);
          return (
            <div key={priority} className="flex flex-col gap-4">
              <motion.div
                layout
                className={cn(
                  "p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between",
                  priorityColors[priority]
                )}
              >
                <div>
                  <h3 className="font-semibold">{priority} Priority</h3>
                  <div className="text-sm text-muted-foreground">
                    {sortedTasks.length} task{sortedTasks.length !== 1 && 's'}
                  </div>
                </div>
                {/* Column-specific sort dropdown */}
                <div className="flex items-center gap-1 mt-2 sm:mt-0">
                  <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={columnSort[priority]}
                    onChange={(e) => handleSortChange(priority, e.target.value as SortField)}
                    className="p-1 rounded border text-sm"
                  >
                    <option value="order">Order</option>
                    <option value="title">Title</option>
                    <option value="status">Status</option>
                  </select>
                </div>
              </motion.div>

              <Droppable droppableId={priority}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex flex-col gap-3 min-h-[200px] p-2 rounded-lg transition-colors",
                      snapshot.isDraggingOver && "bg-muted/50"
                    )}
                  >
                    <AnimatePresence>
                      {sortedTasks.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={String(task.id)}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Card className={cn(
                                  "p-4 shadow-sm hover:shadow-md transition-all",
                                  snapshot.isDragging && "shadow-lg scale-105"
                                )}>
                                  <div className="space-y-3">
                                    <div className="font-medium">{task.title}</div>
                                    <div className="flex items-center gap-2">
                                      <span className={cn(
                                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                        priorityColors[task.priority]
                                      )}>
                                        {task.priority}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {task.status}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 pt-2">
                                      <TaskDialog
                                        task={task}
                                        trigger={
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                          >
                                            <Edit2 className="h-4 w-4" />
                                          </Button>
                                        }
                                        onSubmit={onUpdate}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onDelete(task.id)}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              </motion.div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </AnimatePresence>
                    {provided.placeholder}

                    {/* Inline Task Creation Button */}
                    {onCreate && (
                      <TaskDialog
                        task={createTaskTemplate(priority)}
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "w-full border-2 border-dashed h-20 hover:border-primary hover:bg-primary/5",
                              "flex items-center justify-center gap-2"
                            )}
                          >
                            <Plus className="h-4 w-4" />
                            <span>New Task</span>
                          </Button>
                        }
                        onSubmit={onCreate}
                      />
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
