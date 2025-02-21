import { create } from 'zustand';
import { Task } from '@shared/schema';
import { CustomField } from '@/lib/customFields';
import { useTaskStore } from './taskStore';

// Command interface for all operations
interface Command {
  execute(): void;
  undo(): void;
  description: string;
}

// Specific commands for different operations
class AddTaskCommand implements Command {
  constructor(
    private task: Task,
    private addFn: (task: Task) => void,
    private deleteFn: (id: number) => void
  ) {}

  execute() {
    this.addFn(this.task);
  }

  undo() {
    this.deleteFn(this.task.id);
  }

  description = `Add task "${this.task.title}"`;
}

class UpdateTaskCommand implements Command {
  private previousState: Task;

  constructor(
    private task: Task,
    private updateFn: (task: Task) => void,
    previousState: Task
  ) {
    this.previousState = { ...previousState };
  }

  execute() {
    this.updateFn(this.task);
  }

  undo() {
    this.updateFn(this.previousState);
  }

  description = `Update task "${this.task.title}"`;
}

class DeleteTaskCommand implements Command {
  private store = useTaskStore.getState();

  constructor(private task: Task) {}

  execute() {
    this.store.deleteTask(this.task.id);
  }

  undo() {
    this.store.restoreTask(this.task);
  }

  description = `Delete task "${this.task.title}"`;
}

class UpdateCustomFieldsCommand implements Command {
  constructor(
    private newFields: CustomField[],
    private previousFields: CustomField[],
    private updateFn: (fields: CustomField[]) => void
  ) {}

  execute() {
    this.updateFn(this.newFields);
  }

  undo() {
    this.updateFn(this.previousFields);
  }

  description = "Update custom fields";
}

interface HistoryState {
  undoStack: Command[];
  redoStack: Command[];
  addCommand: (command: Command) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getLastAction: () => string;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],

  addCommand: (command: Command) => {
    command.execute();
    set((state) => ({
      undoStack: [...state.undoStack, command],
      redoStack: [], // Clear redo stack when new command is added
    }));
  },

  undo: () => {
    const { undoStack, redoStack } = get();
    if (undoStack.length === 0) return;

    const command = undoStack[undoStack.length - 1];
    command.undo();

    set((state) => ({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, command],
    }));
  },

  redo: () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return;

    const command = redoStack[redoStack.length - 1];
    command.execute();

    set((state) => ({
      undoStack: [...state.undoStack, command],
      redoStack: state.redoStack.slice(0, -1),
    }));
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,
  getLastAction: () => {
    const { undoStack } = get();
    return undoStack.length > 0 
      ? undoStack[undoStack.length - 1].description 
      : "";
  },

  clear: () => set({ undoStack: [], redoStack: [] }),
}));

// Command factories
export const createAddTaskCommand = (
  task: Task,
  addFn: (task: Task) => void,
  deleteFn: (id: number) => void
): Command => {
  return new AddTaskCommand(task, addFn, deleteFn);
};

export const createUpdateTaskCommand = (
  task: Task,
  updateFn: (task: Task) => void,
  previousState: Task
): Command => {
  return new UpdateTaskCommand(task, updateFn, previousState);
};

export const createDeleteTaskCommand = (task: Task): Command => {
  return new DeleteTaskCommand(task);
};

export const createUpdateCustomFieldsCommand = (
  newFields: CustomField[],
  previousFields: CustomField[],
  updateFn: (fields: CustomField[]) => void
): Command => {
  return new UpdateCustomFieldsCommand(newFields, previousFields, updateFn);
}; 