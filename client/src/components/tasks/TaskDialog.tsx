import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { type Task, insertTaskSchema } from "@shared/schema";
import { ReactNode, useEffect, useState } from "react";
import { getCustomFields, getTaskCustomFields, type CustomField } from "@/lib/customFields";

interface TaskDialogProps {
  task?: Task;
  trigger: React.ReactNode;
  onSubmit: (data: Omit<Task, 'id' | 'createdAt'> & { customFields?: Record<string, any> }) => void;
}

export function TaskDialog({ trigger, task, onSubmit }: TaskDialogProps) {
  const [open, setOpen] = useState(false);
  const customFields = getCustomFields();
  const taskCustomFields = getTaskCustomFields();

  const form = useForm({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: task?.title ?? "",
      priority: task?.priority ?? "Medium",
      status: task?.status ?? "Todo",
      customFields: task ? taskCustomFields[task.id] ?? {} : {},
    },
  });

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        priority: task.priority,
        status: task.status,
        customFields: taskCustomFields[task.id] ?? {},
      });
    }
  }, [task, form]);

  const handleSubmit = (data: any) => {
    const { customFields: fieldValues, ...taskData } = data;
    
    onSubmit({
      ...taskData,
      ...(task ? { id: task.id } : {}),
      customFields: fieldValues,
    });

    setOpen(false);
    form.reset();
  };

  const renderCustomField = (field: CustomField) => {
    switch (field.type) {
      case 'text':
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={`customFields.${field.name}` as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.name}</FormLabel>
                <FormControl>
                  <Input {...formField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'select':
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={`customFields.${field.name}` as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.name}</FormLabel>
                <Select
                  onValueChange={formField.onChange}
                  defaultValue={formField.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${field.name}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'checkbox':
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={`customFields.${field.name}` as any}
            render={({ field: formField }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4">
                <FormControl>
                  <Checkbox
                    checked={formField.value as boolean}
                    onCheckedChange={formField.onChange}
                  />
                </FormControl>
                <FormLabel>{field.name}</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create Task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Edit the details of your task below.' : 'Add a new task with the form below.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter task title..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Todo">Todo</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {customFields.map(renderCustomField)}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="submit" className="min-w-[100px]">
                {task ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}