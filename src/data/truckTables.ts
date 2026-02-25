import { Column } from "@/components/ui/DataTable";

export const truckColumns: Column[] = [
  { key: "plateNumber", header: "Truck Number", align: "center" },
  { key: "assignToDriver", header: "Driver", align: "center" },
  { key: "fuelPerMile", header: "Fuel/Mile", align: "center" },
  { key: "totalMileage", header: "Total Mileage", align: "center" },
  { key: "status", header: "Status", align: "center" },
  { key: "actions", header: "Actions", align: "center" },

  // { key: "model", header: "Model", align: "center" },
  // { key: "type", header: "Type", align: "center" },
  // { key: "year", header: "Year", align: "center" },
  // { key: "source", header: "Source", align: "center" },
  // { key: "truckCapacity", header: "Capacity (kg)", align: "center" },

];