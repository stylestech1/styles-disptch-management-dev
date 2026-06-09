import { Column } from "@/components/ui/DataTable";

export const revenueColumns: Column[] = [
  { key: "truckNumber", header: "Truck Number", align: "center" },
  { key: "source", header: "Ownership", align: "center" },
  { key: "revenue", header: "Revenue", align: "center" },
  { key: "loads", header: "Loads", align: "center" },
  { key: "avgPerLoad", header: "Avg/Load", align: "center" },
 ];