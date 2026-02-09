import { Column } from "@/components/ui/DataTable";

export const truckMaintenanceMilesColumns: Column[] = [
  { key: "type", header: "Service Type", align: "center" },
  { key: "serviceCenter", header: "Service Center", align: "center" },
  { key: "intervalMile", header: "Mileage Interval", align: "right" },
  { key: "remindBeforeMile", header: "Reminder Threshold", align: "right" },
  { key: "view", header: "Actions", align: "center" },
];

export const truckMaintenanceTimesColumns: Column[] = [
  { key: "type", header: "Service Type", align: "center" },
  { key: "serviceCenter", header: "Service Center", align: "center" },
  { key: "intervalDays", header: "Time Interval", align: "right" },
  { key: "remindBeforeMile", header: "Reminder Threshold", align: "right" },
  { key: "view", header: "Actions", align: "center" },
];
