export const STATUS_OPTIONS = [
  { value: "TODO", label: "TODO", color: "secondary" },
  { value: "IN_PROGRESS", label: "IN PROGRESS", color: "default" },
  { value: "IN_REVIEW", label: "IN REVIEW", color: "outline" },
  { value: "DONE", label: "DONE", color: "secondary" },
] as const;

export const PRIORITY_OPTIONS = [
  { value: "LOW", label: "LOW", color: "outline" as const, borderColor: "border-l-gray-300" },
  { value: "MEDIUM", label: "MEDIUM", color: "secondary" as const, borderColor: "border-l-blue-500" },
  { value: "HIGH", label: "HIGH", color: "default" as const, borderColor: "border-l-orange-500" },
  { value: "URGENT", label: "URGENT", color: "destructive" as const, borderColor: "border-l-red-500" },
] as const;

export function getPriorityColor(priority: string): "destructive" | "default" | "secondary" | "outline" {
  const option = PRIORITY_OPTIONS.find((p) => p.value === priority);
  return option?.color ?? "secondary";
}

export function getPriorityBorderColor(priority: string): string {
  const option = PRIORITY_OPTIONS.find((p) => p.value === priority);
  return option?.borderColor ?? "border-l-gray-300";
}
