import { useState } from "react";
import { useTaskStore } from "@/lib/taskStore";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

export function BulkActions() {
  const store = useTaskStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const selectedCount = store.selectedTasks.size;

  if (selectedCount === 0) return null;

  const handleStatusChange = (status: string) => {
    store.bulkUpdateTasks({ status });
  };

  const handlePriorityChange = (priority: string) => {
    store.bulkUpdateTasks({ priority });
  };

  const handleDelete = () => {
    store.bulkDeleteTasks();
    setShowDeleteDialog(false);
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
      <span className="text-sm text-muted-foreground">
        {selectedCount} task{selectedCount > 1 ? 's' : ''} selected
      </span>

      <Select onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Set status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Todo">Todo</SelectItem>
          <SelectItem value="In Progress">In Progress</SelectItem>
          <SelectItem value="Done">Done</SelectItem>
        </SelectContent>
      </Select>

      <Select onValueChange={handlePriorityChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Set priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="High">High</SelectItem>
          <SelectItem value="Medium">Medium</SelectItem>
          <SelectItem value="Low">Low</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="destructive"
        size="sm"
        onClick={() => setShowDeleteDialog(true)}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete Selected
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => store.clearSelection()}
      >
        Clear Selection
      </Button>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Tasks</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} selected task
              {selectedCount > 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 