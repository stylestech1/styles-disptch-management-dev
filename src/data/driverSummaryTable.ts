import { Column } from "@/components/ui/DataTable";

export const driverSummaryColumns: Column[] = [
  { key: "loadId", header: "Load ID", align: "center" },
  { key: "plateNumber", header: "Plate Number", align: "center" },
  { key: "delivered", header: "Delivery Date", align: "center" },
  { key: "origin", header: "Origin", align: "center" },
  { key: "destination", header: "Destination", align: "center" },
  { key: "miles", header: "Miles", align: "center" },
  { key: "pricePerMile", header: "Price/Mile", align: "center" },
  { key: "total", header: "Driver Pay", align: "center" },
];