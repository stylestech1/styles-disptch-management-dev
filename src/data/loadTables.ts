import { Column } from "@/components/ui/DataTable";

export const loadColumns: Column[] = [
  { key: "loadId", header: "Load ID", align: "center" },
  { key: "driver", header: "Driver", align: "center" },
  { key: "route", header: "Route", align: "center" },
  { key: "distance", header: "Distance", align: "center" },
  { key: "pricePerMile", header: "Price/Mile", align: "center" },
  { key: "total", header: "Total", align: "center" },
  { key: "status", header: "Status", align: "center" },
  { key: "note", header: "HasNote", align: "center" },

];