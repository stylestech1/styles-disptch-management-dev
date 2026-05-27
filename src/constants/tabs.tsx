import { FaCirclePlus } from "react-icons/fa6";
import { TUserRole } from "@/types/globalTypes";
import {
  Boxes,
  Building,
  ChartNoAxesCombined,
  CircleDivide,
  Handshake,
  ShieldUser,
  Truck,
  Users,
  UserStar,
  Wrench,
  UserPlus
} from "lucide-react";
import { MdOutlineHandyman } from "react-icons/md";

type TabItem = {
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
  path?: string;
  children?: TabItem[];
};
export function findTabByPath(tabs: TabItem[], targetPath: string): TabItem | null {
  for (const tab of tabs) {
    if (tab.path === targetPath) return tab;

    if (tab.children?.length) {
      const found = findTabByPath(tab.children, targetPath);
      if (found) return found;
    }
  }
  return null;
}
export const TABS_CONFIG: Record<TUserRole, TabItem[]> = {
  admin: [
    {
      label: "Loads",
      subtitle:
        "Manage and track all your shipments and deliveries in one place.",
      icon: <Boxes />,
    },
    {
      label: "Rate Calculator",
      subtitle:
        "Calculate rates and plan your routes with real-time distance measurements",
      icon: <CircleDivide />,
    },
    {
      label: "Trucks",
      subtitle: "Manage your trucks and their access",
      icon: <Truck />,
    },
    {
      label: "Maintenance",
      icon: <Wrench />,
      children: [
        {
          label: "Truck Maintenance",
          subtitle: "Monitor and manage maintenance schedules across your entire fleet",
          // icon: <HandymanIcon />,
          path: "trucksmaintenance",
        },
        {
          label: "Maintenance Centers",
          subtitle: "Manage and monitor maintenance facilities across the United States",
          // icon: <Building2 />,
          path: "centermaintenance",
        },
      ],
    },
    {
      label: "Repaires",
      subtitle: "Manage and track all your truck repairs in one place.",
      icon: <MdOutlineHandyman size={20} />,
    },
    {
      label: "Drivers",
      subtitle: "Manage your driver team members and their access",
      icon: <ShieldUser />,
    },
    {
      label: "Hiring Drivers",
      subtitle: "Review, approve, and manage driver recruitment requests",
      icon: <UserPlus />,
    },
    {
      label: "Users",
      subtitle: "Manage your dispatch team members and their access",
      icon: <Users />,
    },
    {
      label: "Truck Dashboard",
      subtitle:
        "View detailed revenue metrics per truck to track earnings. Identify high-performing vehicles and monitor overall fleet performance.",
      icon: <ChartNoAxesCombined />,
    },

    {
      label: "Customers",
      subtitle: "Handle your customers with love",
      icon: <UserStar />,
    },
    {
      label: "Broker",
      subtitle: "Manage your broker team members and their access",
      icon: <Handshake />,
    },
    {
      label: "Truck Summary",
      subtitle: "Detailed overview of truck information and performance.",
    },
    {
      label: "Load Details",
      subtitle:
        "Manage and track all your shipments and deliveries in one place.",
    },
    {
      label: "Notifications",
      subtitle: "Manage your notifications and stay updated.",
    },
    {
      label: "Driver Summary",
      subtitle: "Detailed overview of driver information and performance.",
    },
  ],
  employee: [
    {
      label: "Loads",
      subtitle: "Manage your dispatch team members and their access",
      icon: <Boxes />,
    },
    {
      label: "Rate Calculator",
      subtitle:
        "Calculate rates and plan your routes with real-time distance measurements",
      icon: <CircleDivide />,
    },
    {
      label: "Repaires",
      subtitle: "Manage and track all your truck repairs in one place.",
      icon: <MdOutlineHandyman />,
    },
    {
      label: "Customers",
      subtitle: "Handle your customers with love",
      icon: <UserStar />,
    },
    {
      label: "Load Details",
      subtitle:
        "Manage and track all your shipments and deliveries in one place.",
    },
    {
      label: "Notifications",
      subtitle: "Manage your notifications and stay updated.",
    },
  ],
  driver: [
    {
      label: "Loads",
      subtitle: "Manage your dispatch team members and their access",
      icon: <FaCirclePlus />,
    },
  ],
  superAdmin: [
    {
      label: "Companies",
      subtitle: "Manage your companies and their access",
      icon: <Building />
    }
  ],
  manager: [
    {
      label: "Hiring Drivers",
      subtitle: "Review, approve, and manage driver recruitment requests",
      icon: <UserPlus />,
    },
    {
      label: "Maintenance",
      icon: <Wrench />,
      children: [
        {
          label: "Truck Maintenance",
          subtitle: "Monitor and manage maintenance schedules across your entire fleet",
          // icon: <HandymanIcon />,
          path: "trucksmaintenance",
        },
        {
          label: "Maintenance Centers",
          subtitle: "Manage and monitor maintenance facilities across the United States",
          // icon: <Building2 />,
          path: "centermaintenance",
        },
      ],
    },
    {
      label: "Users",
      subtitle: "Manage your dispatch team members and their access",
      icon: <Users />,
    },
    {
      label: "Customers",
      subtitle: "Handle your customers with love",
      icon: <UserStar />,
    },
  ]
};
