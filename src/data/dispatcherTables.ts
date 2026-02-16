import { Column } from "@/components/ui/DataTable";

export const dispatcherColumns: Column[] = [
  { key: "id", header: "ID", align: "center" },
  { key: "name", header: "Name", align: "left" },
  { key: "email", header: "Email", align: "left" },
  { key: "phone", header: "Phone", align: "left" },
  { key: "role", header: "Role", align: "center" },
  // { key: "position", header: "Position", align: "left" },
  { key: "status", header: "Status", align: "center" },
  { key: "setting", header: "Actions", align: "center" },
];