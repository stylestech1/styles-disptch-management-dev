import { Column } from "@/components/ui/DataTable";

export const dispatcherColumns: Column[] = [
  { key: "id", header: "ID", align: "center" },
  { key: "name", header: "Name", align: "center" },
  { key: "role", header: "Role", align: "center" },
  { key: "email", header: "Email", align: "center" },
  { key: "phone", header: "Phone", align: "center" },
  // { key: "position", header: "Position", align: "left" },
  { key: "status", header: "Status", align: "center" },
  { key: "setting", header: "Actions", align: "center" },
];