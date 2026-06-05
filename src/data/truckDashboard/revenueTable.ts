import { Column } from "@/components/ui/DataTable";

export const revenueColumns: Column[] = [
  { key: "plateNumber", header: "Plate Number", align: "center" },
  { key: "source", header: "Ownership", align: "center" },
  { key: "revenue", header: "Revenue", align: "center" },
  { key: "loads", header: "Loads", align: "center" },
  { key: "avgPerLoad", header: "Avg/Load", align: "center" },
 ];