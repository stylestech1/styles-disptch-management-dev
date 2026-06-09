import { Column } from "@/components/ui/DataTable";

export const profitabilityColumns: Column[] = [
  { key: "truckNumber", header: "Truck Number", align: "center" },
  { key: "source", header: "Ownership", align: "center" },
  { key: "revenue", header: "Revenue", align: "center" },
  { key: "Expenses", header: "Expenses", align: "center" },
  { key: "netProfit", header: "Net Profit", align: "center" },
  { key: "profitMargin", header: "Profit Margin", align: "center" },
];