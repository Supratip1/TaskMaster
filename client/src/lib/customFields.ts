import { z } from 'zod';

export const customFieldTypes = ["text", "number", "checkbox"] as const;
export type CustomFieldType = (typeof customFieldTypes)[number];

export const customFieldSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(customFieldTypes),
  order: z.number().int().min(0),
  sortable: z.boolean().default(true),
  filterable: z.boolean().default(true),
});

export type CustomField = z.infer<typeof customFieldSchema>;

export const getDefaultValueForType = (type: CustomFieldType) => {
  switch (type) {
    case "text":
      return "";
    case "number":
      return 0;
    case "checkbox":
      return false;
  }
};

const CUSTOM_FIELDS_KEY = 'taskCustomFields';

export function saveCustomFields(fields: CustomField[]) {
  try {
    localStorage.setItem(CUSTOM_FIELDS_KEY, JSON.stringify(fields));
  } catch (error) {
    console.error('Failed to save custom fields:', error);
  }
}

export function getCustomFields(): CustomField[] {
  try {
    const stored = localStorage.getItem(CUSTOM_FIELDS_KEY);
    if (!stored) return [];

    const fields = JSON.parse(stored);
    if (!Array.isArray(fields)) return [];

    return fields.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Failed to load custom fields:', error);
    return [];
  }
}

// Store custom field values per task
export interface TaskCustomFields {
  [taskId: number]: Record<string, any>;
}

const TASK_CUSTOM_FIELDS_KEY = 'taskCustomFieldValues';

export function saveTaskCustomFields(customFields: TaskCustomFields) {
  try {
    localStorage.setItem(TASK_CUSTOM_FIELDS_KEY, JSON.stringify(customFields));
  } catch (error) {
    console.error('Failed to save task custom fields:', error);
  }
}

export function getTaskCustomFields(): TaskCustomFields {
  try {
    const stored = localStorage.getItem(TASK_CUSTOM_FIELDS_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load task custom fields:', error);
    return {};
  }
}