import { useState } from 'react';
import { format } from 'date-fns';
import { useTaskStore } from '@/lib/taskStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { TaskDialog } from './TaskDialog';
import { ArrowUpDown, ChevronDown, ChevronUp, Trash2, Edit2 } from 'lucide-react';
import { tasks, type Task } from '@shared/schema';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActions } from "./BulkActions";

interface TaskTableProps {
  onUpdate: (task: Task) => void;
  onDelete: (id: number) => void;
}

const priorityColors = {
  High: 'bg-red-50 text-red-700 border-red-200',
  Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Low: 'bg-green-50 text-green-700 border-green-200',
};

const statusColors = {
  Todo: 'bg-blue-100 text-blue-800 border-blue-200',
  'In Progress': 'bg-orange-100 text-orange-800 border-orange-200',
  Done: 'bg-green-100 text-green-800 border-green-200',
};

export function TaskTable({ onUpdate, onDelete }: TaskTableProps) {
  const store = useTaskStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const filteredTasks = store.getFilteredTasks();
  const paginatedTasks = store.getPaginatedTasks();
  const pageCount = Math.ceil(filteredTasks.length / store.pageSize);

  // Debug logging
  console.log('Store tasks:', store.tasks);
  console.log('Filtered tasks:', filteredTasks);
  console.log('Paginated tasks:', paginatedTasks);

  const toggleSort = (field: typeof store.sortField) => {
    if (store.sortField === field) {
      store.setSortOrder(store.sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      store.setSortField(field);
      store.setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: typeof store.sortField }) => {
    if (store.sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    return store.sortOrder === 'asc' ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  const handleUpdate = (taskData: Partial<Task>) => {
    try {
      if (!taskData.id) return;
      
      onUpdate({
        id: taskData.id,
        title: taskData.title || '',
        status: taskData.status || 'Todo',
        priority: taskData.priority || 'Medium',
        customFields: taskData.customFields,
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  return (
    <div className="space-y-4">
      <BulkActions />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px]">
              <Checkbox
                checked={
                  paginatedTasks.length > 0 &&
                  paginatedTasks.every(task => 
                    store.selectedTasks.has(task.id)
                  )
                }
                onCheckedChange={(checked) => {
                  if (checked) {
                    paginatedTasks.forEach(task => 
                      store.selectTask(task.id)
                    );
                  } else {
                    paginatedTasks.forEach(task => 
                      store.deselectTask(task.id)
                    );
                  }
                }}
              />
            </TableHead>
            <TableHead className="w-[40%]">
              <Button
                variant="ghost"
                onClick={() => toggleSort('title')}
                className={cn(
                  "h-8 text-left font-medium hover:bg-muted/80",
                  store.sortField === 'title' && "text-primary"
                )}
              >
                Title
                <SortIcon field="title" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => toggleSort('priority')}
                className={cn(
                  "h-8 text-left font-medium hover:bg-muted/80",
                  store.sortField === 'priority' && "text-primary"
                )}
              >
                Priority
                <SortIcon field="priority" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => toggleSort('status')}
                className={cn(
                  "h-8 text-left font-medium hover:bg-muted/80",
                  store.sortField === 'status' && "text-primary"
                )}
              >
                Status
                <SortIcon field="status" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => toggleSort('createdAt')}
                className={cn(
                  "h-8 text-left font-medium hover:bg-muted/80",
                  store.sortField === 'createdAt' && "text-primary"
                )}
              >
                Created At
                <SortIcon field="createdAt" />
              </Button>
            </TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {paginatedTasks.map((task, index) => (
              <motion.tr
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "transition-colors hover:bg-muted/50",
                  index % 2 === 0 ? "bg-white" : "bg-muted/20",
                  store.selectedTasks.has(task.id) && "bg-muted"
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={store.selectedTasks.has(task.id)}
                    onCheckedChange={() => 
                      store.toggleTaskSelection(task.id)
                    }
                  />
                </TableCell>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>
                  <motion.span
                    layout
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                      priorityColors[task.priority]
                    )}
                  >
                    {task.priority}
                  </motion.span>
                </TableCell>
                <TableCell>
                  <motion.span
                    layout
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                      statusColors[task.status]
                    )}
                  >
                    {task.status}
                  </motion.span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(task.createdAt), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <TaskDialog
                      task={task}
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTask(task)}
                          className="h-8 w-8 p-0 hover:bg-muted"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      }
                      onSubmit={handleUpdate}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(task.id)}
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
          {paginatedTasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  No tasks found. Try clearing your filters or adding a new task.
                </motion.div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between border-t p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {paginatedTasks.length} of {filteredTasks.length} tasks
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <select
              value={store.pageSize}
              onChange={(e) => store.setPageSize(Number(e.target.value))}
              className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <Pagination
          currentPage={store.currentPage}
          pageCount={pageCount}
          onPageChange={(page) => store.setCurrentPage(page)}
        />
      </div>
    </div>
  );
}