import { useState } from "react";
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
import { Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import type { CustomField } from "@/lib/customFields";
import { customFieldSchema } from "@/lib/customFields";
import { Switch } from "@/components/ui/switch";
import { getDefaultValueForType } from "@/lib/customFields";
import { motion, AnimatePresence } from "framer-motion";
import { useHistoryStore, createUpdateCustomFieldsCommand } from "@/lib/historyManager";

interface CustomFieldsDialogProps {
  fields: CustomField[];
  onSave: (fields: CustomField[]) => void;
  trigger: React.ReactNode;
}

const newFieldSchema = customFieldSchema.omit({ order: true }).extend({
  sortable: z.boolean().default(true),
  filterable: z.boolean().default(true),
});
type NewFieldSchema = z.infer<typeof newFieldSchema>;

export function CustomFieldsDialog({ fields, onSave, trigger }: CustomFieldsDialogProps) {
  const { toast } = useToast();
  const history = useHistoryStore();
  const [localFields, setLocalFields] = useState<CustomField[]>(fields);
  
  const form = useForm<NewFieldSchema>({
    resolver: zodResolver(newFieldSchema),
    defaultValues: {
      name: "",
      type: "text",
      sortable: true,
      filterable: true,
    },
  });

  const addField = (data: NewFieldSchema) => {
    const existingField = localFields.find(
      (f) => f.name.toLowerCase() === data.name.toLowerCase()
    );

    if (existingField) {
      toast({
        title: "Field already exists",
        description: "Please use a different field name",
        variant: "destructive",
      });
      return;
    }

    const newField: CustomField = {
      ...data,
      order: localFields.length,
    };

    setLocalFields([...localFields, newField]);
    form.reset();
  };

  const removeField = (index: number) => {
    const newFields = localFields.filter((_, i) => i !== index);
    // Reorder remaining fields
    const reorderedFields = newFields.map((field, i) => ({
      ...field,
      order: i,
    }));
    setLocalFields(reorderedFields);
  };

  const handleSave = () => {
    const command = createUpdateCustomFieldsCommand(
      localFields,
      fields,
      onSave
    );
    history.addCommand(command);
    toast({
      title: "Custom fields saved",
      description: "Your changes have been saved successfully.",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Custom Fields</DialogTitle>
          <DialogDescription>
            Add or remove custom fields for your tasks. These fields will be available
            when creating or editing tasks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(addField)}
              className="space-y-4"
            >
              <div className="flex items-end gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Field Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter field name..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="w-[180px]">
                      <FormLabel>Field Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="checkbox">Checkbox</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-6">
                <FormField
                  control={form.control}
                  name="sortable"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Allow sorting</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="filterable"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Allow filtering</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>

          <div className="rounded-md border">
            <AnimatePresence mode="popLayout">
              {localFields.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 text-center text-muted-foreground"
                >
                  No custom fields added yet
                </motion.div>
              ) : (
                <div className="divide-y">
                  {localFields.map((field, index) => (
                    <motion.div
                      key={field.name}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between p-4"
                    >
                      <div>
                        <motion.div layout="position" className="font-medium">
                          {field.name}
                        </motion.div>
                        <motion.div layout="position" className="text-sm text-muted-foreground space-x-2">
                          <span>Type: {field.type}</span>
                          {field.sortable && <span>• Sortable</span>}
                          {field.filterable && <span>• Filterable</span>}
                        </motion.div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
