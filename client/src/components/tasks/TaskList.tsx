import { useHistoryStore, createAddTaskCommand, createUpdateTaskCommand, createDeleteTaskCommand } from "@/lib/historyManager";
import { TaskToolbar } from "./TaskToolbar";
import { useTaskStore } from "@/lib/taskStore";
import type { Task } from "@shared/schema";

export function TaskList() {
  const history = useHistoryStore();
  const store = useTaskStore();
  
  const handleAddTask = (task: Task) => {
    const command = createAddTaskCommand(
      task,
      store.addTask,
      store.deleteTask
    );
    history.addCommand(command);
  };

  const handleUpdateTask = (task: Task) => {
    const previousState = store.tasks.find(t => t.id === task.id);
    if (!previousState) return;

    const command = createUpdateTaskCommand(
      task,
      store.updateTask,
      previousState
    );
    history.addCommand(command);
  };

  const handleDeleteTask = (task: Task) => {
    const command = createDeleteTaskCommand(task);
    history.addCommand(command);
  };

  return (
    <div>
      <TaskToolbar />
      <TaskTable 
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
} 