
import type { ReactNode } from "react";
import type { TUserRole } from "@/types/globalTypes";

import {
  Boxes,
  Building2,
  Calculator,
  ChartNoAxesCombined,
  Truck,
  TruckElectric,
  UserRoundPlus,
  UsersRound,
  UserRoundCog,
  UserRoundCheck,
  UserRound,
  Handshake,
  Wrench,
  Settings,
  ClipboardList,
  ClipboardCheck,
  FileText,
  Bell,
  CircleDollarSign,
  Gauge,
  Clock,
  ContactRound,
  TruckIcon,
} from "lucide-react";

type TabItem = {
  label: string;
  subtitle?: string;
  icon?: ReactNode;
  path?: string;
  children?: TabItem[];
};

export function findTabByPath(
  tabs: TabItem[],
  targetPath: string
): TabItem | null {
  for (const tab of tabs) {
    if (tab.path === targetPath) return tab;

    if (tab.children?.length) {
      const found = findTabByPath(tab.children, targetPath);
      if (found) return found;
    }
  }

  return null;
}

const ICON_SIZE = 20;
const ICON_STROKE = 1.8;

const icons = {
  loads: <Boxes size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  rateCalculator: <Calculator size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  truckDashboard: (
    <ChartNoAxesCombined size={ICON_SIZE} strokeWidth={ICON_STROKE} />
  ),
  trucks: <Truck size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  assignDispatchers: (
    <UserRoundCog size={ICON_SIZE} strokeWidth={ICON_STROKE} />
  ),
  truckStatus: <Gauge size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  detention: <Clock size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  investors: (
    <CircleDollarSign size={ICON_SIZE} strokeWidth={ICON_STROKE} />
  ),
  maintenance: <Wrench size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  truckMaintenance: (
    <TruckElectric size={ICON_SIZE} strokeWidth={ICON_STROKE} />
  ),
  maintenanceCenters: (
    <Building2 size={ICON_SIZE} strokeWidth={ICON_STROKE} />
  ),
  repairs: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  drivers: <ContactRound size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  hiringDrivers: (
    <UserRoundCheck size={ICON_SIZE} strokeWidth={ICON_STROKE} />
  ),
  recruitment: (
    <UserRoundPlus size={ICON_SIZE} strokeWidth={ICON_STROKE} />
  ),
  ownerOperators: <TruckIcon size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  users: <UsersRound size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  customers: <UserRound size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  broker: <Handshake size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  truckSummary: (
    <ClipboardList size={ICON_SIZE} strokeWidth={ICON_STROKE} />
  ),
  loadDetails: <FileText size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  notifications: <Bell size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  driverSummary: (
    <ClipboardCheck size={ICON_SIZE} strokeWidth={ICON_STROKE} />
  ),
  companies: <Building2 size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
};

export const TABS_CONFIG: Record<TUserRole, TabItem[]> = {
  admin: [
    {
      label: "Loads",
      subtitle:
        "Manage and track all your shipments and deliveries in one place.",
      icon: icons.loads,
    },
    {
      label: "Rate Calculator",
      subtitle:
        "Calculate rates and plan your routes with real-time distance measurements",
      icon: icons.rateCalculator,
    },
    {
      label: "Truck Dashboard",
      subtitle:
        "View detailed revenue metrics per truck to track earnings. Identify high-performing vehicles and monitor overall fleet performance.",
      icon: icons.truckDashboard,
    },
    {
      label: "Trucks",
      subtitle: "Manage your trucks and their access",
      icon: icons.trucks,
    },
    {
      label: "Assign Dispatchers",
      subtitle: "Assign Dispatchers to trucks and manage their assignments",
      icon: icons.assignDispatchers,
    },
    {
      label: "Truck Status",
      subtitle: "View and edit truck status",
      icon: icons.truckStatus,
      path: "truck-dispatchers",
    },
    {
      label: "Detention / layover",
      subtitle: "View and edit truck Detention / layover",
      icon: icons.detention,
      path: "loads-claims",
    },
    {
      label: "Investors",
      subtitle: "Manage investors and their assigned trucks",
      icon: icons.investors,
    },
    {
      label: "Maintenance",
      icon: icons.maintenance,
      children: [
        {
          label: "Truck Maintenance",
          subtitle:
            "Monitor and manage maintenance schedules across your entire fleet",
          icon: icons.truckMaintenance,
          path: "trucksmaintenance",
        },
        {
          label: "Maintenance Centers",
          subtitle:
            "Manage and monitor maintenance facilities across the United States",
          icon: icons.maintenanceCenters,
          path: "centermaintenance",
        },
      ],
    },
    {
      label: "Repaires",
      subtitle: "Manage and track all your truck repairs in one place.",
      icon: icons.repairs,
    },
    {
      label: "Drivers",
      subtitle: "Manage your driver team members and their access",
      icon: icons.drivers,
    },
    {
      label: "Hiring Drivers",
      subtitle: "Review, approve, and manage driver recruitment requests",
      icon: icons.hiringDrivers,
    },
    {
      label: "Recruitment",
      subtitle: "Manage your public driver application link and availability",
      icon: icons.recruitment,
    },
    {
      label: "Owner Operators",
      subtitle: "Review, approve, and manage owner operator applications",
      icon: icons.ownerOperators,
    },
    {
      label: "Users",
      subtitle: "Manage your dispatch team members and their access",
      icon: icons.users,
    },
    {
      label: "Customers",
      subtitle: "Handle your customers with love",
      icon: icons.customers,
    },
    {
      label: "Broker",
      subtitle: "Manage your broker team members and their access",
      icon: icons.broker,
    },
    {
      label: "Truck Summary",
      subtitle: "Detailed overview of truck information and performance.",
      icon: icons.truckSummary,
    },
    {
      label: "Load Details",
      subtitle:
        "Manage and track all your shipments and deliveries in one place.",
      icon: icons.loadDetails,
    },
    {
      label: "Notifications",
      subtitle: "Manage your notifications and stay updated.",
      icon: icons.notifications,
    },
    {
      label: "Driver Summary",
      subtitle: "Detailed overview of driver information and performance.",
      icon: icons.driverSummary,
    },
  ],

  employee: [
    {
      label: "Loads",
      subtitle: "Manage your dispatch team members and their access",
      icon: icons.loads,
    },
    {
      label: "Detention / layover",
      subtitle: "View and edit truck Detention / layover",
      icon: icons.detention,
      path: "loads-claims",
    },
    {
      label: "My Trucks",
      subtitle: "View the trucks assigned to you",
      icon: icons.trucks,
      path: "truck-dispatchers",
    },
    {
      label: "Rate Calculator",
      subtitle:
        "Calculate rates and plan your routes with real-time distance measurements",
      icon: icons.rateCalculator,
    },
    {
      label: "Repaires",
      subtitle: "Manage and track all your truck repairs in one place.",
      icon: icons.repairs,
    },
    {
      label: "Customers",
      subtitle: "Handle your customers with love",
      icon: icons.customers,
    },
    {
      label: "Load Details",
      subtitle:
        "Manage and track all your shipments and deliveries in one place.",
      icon: icons.loadDetails,
    },
    {
      label: "Notifications",
      subtitle: "Manage your notifications and stay updated.",
      icon: icons.notifications,
    },
  ],

  driver: [
    {
      label: "Loads",
      subtitle: "Manage your dispatch team members and their access",
      icon: icons.loads,
    },
  ],

  superAdmin: [
    {
      label: "Companies",
      subtitle: "Manage your companies and their access",
      icon: icons.companies,
    },
  ],

  manager: [
    {
      label: "Loads",
      subtitle:
        "Manage and track all your shipments and deliveries in one place.",
      icon: icons.loads,
    },
    {
      label: "Detention / layover",
      subtitle: "View and edit truck Detention / layover",
      icon: icons.detention,
      path: "loads-claims",
    },
    {
      label: "Recruitment",
      subtitle: "View your public driver application link and availability",
      icon: icons.recruitment,
    },
    {
      label: "Hiring Drivers",
      subtitle: "Review, approve, and manage driver recruitment requests",
      icon: icons.hiringDrivers,
    },
    {
      label: "Owner Operators",
      subtitle: "Review, approve, and manage owner operator applications",
      icon: icons.ownerOperators,
    },
    {
      label: "Drivers",
      subtitle: "Manage your driver team members and their access",
      icon: icons.drivers,
    },
    {
      label: "Repaires",
      subtitle: "Manage and track all your truck repairs in one place.",
      icon: icons.repairs,
    },
    {
      label: "Maintenance",
      icon: icons.maintenance,
      children: [
        {
          label: "Truck Maintenance",
          subtitle:
            "Monitor and manage maintenance schedules across your entire fleet",
          icon: icons.truckMaintenance,
          path: "trucksmaintenance",
        },
        {
          label: "Maintenance Centers",
          subtitle:
            "Manage and monitor maintenance facilities across the United States",
          icon: icons.maintenanceCenters,
          path: "centermaintenance",
        },
      ],
    },
    {
      label: "Users",
      subtitle: "Manage your dispatch team members and their access",
      icon: icons.users,
    },
    {
      label: "Customers",
      subtitle: "Handle your customers with love",
      icon: icons.customers,
    },
  ],

  investor: [
    {
      label: "Investors",
      subtitle: "View trucks and loads",
      icon: icons.investors,
      path: "trucks",
    },
  ],
};
