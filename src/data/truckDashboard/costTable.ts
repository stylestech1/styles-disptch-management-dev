import { Column } from "@/components/ui/DataTable";

export const costColumns: Column[] = [
  { key: "plateNumber", header: "Plate Number", align: "center" },
  { key: "source", header: "Ownership", align: "center" },
  { key: "fuel", header: "Fuel", align: "center" },
  { key: "maintenance", header: "Maintenance", align: "center" },
  { key: "driverPay", header: "Driver Pay", align: "center" },
  { key: "insurance", header: "Insurance", align: "center" },
  { key: "Cost", header: "Cost", align: "center" },
 ];