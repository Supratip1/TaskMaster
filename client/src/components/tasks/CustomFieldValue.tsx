import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { CustomField, CustomFieldType } from "@/lib/customFields";

interface CustomFieldValueProps {
  field: CustomField;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export function CustomFieldValue({
  field,
  value,
  onChange,
  disabled = false,
}: CustomFieldValueProps) {
  switch (field.type) {
    case "text":
      return (
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
    case "number":
      return (
        <Input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
        />
      );
    case "checkbox":
      return (
        <Switch
          checked={Boolean(value)}
          onCheckedChange={onChange}
          disabled={disabled}
        />
      );
    default:
      return null;
  }
} 