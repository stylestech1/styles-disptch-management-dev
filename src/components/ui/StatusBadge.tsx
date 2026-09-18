import { TStatusLoad } from "@/types/globalTypes";
import { 
  IoTime, 
  IoNavigate, 
  IoCheckmark, 
  IoClose 
} from "react-icons/io5";

interface StatusBadgeProps {
  status: TStatusLoad;
  size?: "sm" | "md" | "lg";
}

const StatusBadge = ({ status, size = "md" }: StatusBadgeProps) => {
  const statusConfig = {
    pending: {
      color: "bg-amber-100 text-amber-800 border-amber-300",
      icon: <IoTime className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />,
      text: "Pending"
    },
    in_transit: {
      color: "bg-blue-100 text-blue-800 border-blue-300",
      icon: <IoNavigate className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />,
      text: "In Transit"
    },
    delivered: {
      color: "bg-emerald-100 text-emerald-800 border-emerald-300",
      icon: <IoCheckmark className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />,
      text: "Delivered"
    },
    cancelled: {
      color: "bg-red-100 text-red-800 border-red-300",
      icon: <IoClose className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />,
      text: "Cancelled"
    },
    truck_order_not_used: {
      color: "bg-gray-100 text-gray-800 border-gray-300",
      icon: <IoClose className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />,
      text: "TONU"
    }
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-2.5 py-1 text-xs", 
    lg: "px-3 py-1.5 text-sm"
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium border ${config.color} ${sizeClasses[size]}`}
    >
      {config.icon}
      {config.text}
    </span>
  );
};

export default StatusBadge;