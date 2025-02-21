import { format } from 'date-fns';
import { useTaskStore } from '@/lib/taskStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskDialog } from './TaskDialog';
import { Trash2 } from 'lucide-react';
import type { Task } from '@shared/schema';
import { motion, AnimatePresence } from "framer-motion";

interface TaskCardProps {
  onUpdate: (task: Task) => void;
  onDelete: (id: number) => void;
}

const priorityColors = {
  High: 'text-red-500',
  Medium: 'text-yellow-500',
  Low: 'text-green-500',
};

const statusColors = {
  Todo: 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-orange-100 text-orange-800',
  Done: 'bg-green-100 text-green-800',
};

export function TaskCard({ onUpdate, onDelete }: TaskCardProps) {
  const store = useTaskStore();

  const filteredTasks = store.tasks
    .filter((task) =>
      task.title.toLowerCase().includes(store.searchTerm.toLowerCase())
    )
    .filter((task) =>
      store.priorityFilter.length ? store.priorityFilter.includes(task.priority) : true
    )
    .filter((task) =>
      store.statusFilter.length ? store.statusFilter.includes(task.status) : true
    )
    .sort((a, b) => {
      const aValue = a[store.sortField];
      const bValue = b[store.sortField];
      return store.sortOrder === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

  const start = (store.currentPage - 1) * store.pageSize;
  const paginatedTasks = filteredTasks.slice(start, start + store.pageSize);

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {paginatedTasks.map((task) => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <motion.h3 
                    layout="position"
                    className="font-medium"
                  >
                    {task.title}
                  </motion.h3>
                  <div className="flex gap-2">
                    <TaskDialog
                      task={task}
                      trigger={<Button variant="ghost" size="sm">Edit</Button>}
                      onSubmit={onUpdate}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <motion.span
                    layout
                    className={priorityColors[task.priority]}
                  >
                    {task.priority} Priority
                  </motion.span>
                  <motion.span
                    layout
                    className={`${
                      statusColors[task.status]
                    } px-2 py-1 rounded-full text-xs font-medium`}
                  >
                    {task.status}
                  </motion.span>
                  <motion.span 
                    layout
                    className="text-gray-500"
                  >
                    Created {format(new Date(task.createdAt), 'MMM d, yyyy')}
                  </motion.span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Rows per page:</span>
          <select
            value={store.pageSize}
            onChange={(e) => store.setPageSize(Number(e.target.value))}
            className="border rounded p-1"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={store.currentPage === 1}
            onClick={() => store.setCurrentPage(store.currentPage - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={
              store.currentPage ===
              Math.ceil(filteredTasks.length / store.pageSize)
            }
            onClick={() => store.setCurrentPage(store.currentPage + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
