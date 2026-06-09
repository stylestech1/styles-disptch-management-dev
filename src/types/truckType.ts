export type TMaintenanceStatus = "upcoming" | "overdue";

export type TStatusPerTruck = {
  truckId: string;
  truckNumber: string;
  totalMileage: number;
  status: TMaintenanceStatus;
  nextDueMile?: number;
  lastDoneMile?: number;
  nextDueDate?: string;
  lastDoneAt?: string;
};

export type TMaintenance = {
  id: string;
  type: string;
  repeatBy: "mile" | "time";
  intervalMile?: number;
  intervalDays?: number;
  remindBeforeMile?: number;
  remindBeforeDays?: number;
  serviceCenter: string;
  createdBy: string;
  statusPerTruck: TStatusPerTruck[];
  createdAt: string;
  updatedAt?: string;
};
