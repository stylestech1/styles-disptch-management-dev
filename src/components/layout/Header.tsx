"use client";

import { RootState, useAppSelector } from "@/redux/store";
import {
  alpha,
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
} from "@mui/material";
import NotificationProvider from "@/providers/NotificationProvider";
import HeaderSourceTruckDashboard from "../truck/HeaderSourceTruckDashboard";
import { usePathname } from "next/navigation";
import { IoMenu } from "react-icons/io5";
import GlobalFilter from "@/components/ui/GlobalFilter";
import ChatBubble from "../chat/ChatBubble";

interface NavbarProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
}

export default function Navbar({ title, subtitle, onMenuClick }: NavbarProps) {
  const theme = useAppSelector((state: RootState) => state.palette);
  const pathname = usePathname();

  const role = useAppSelector((state: RootState) => state.auth?.user?.role);

  const isSuperAdmin =
    String(role || "").toLowerCase() === "superadmin" ||
    String(role || "").toLowerCase() === "super-admin";

  const isDriver =
    String(role || "").toLowerCase() === "driver"

  const shouldShowFilter = [
    "/admin/loads",
    "/admin/truckdashboard",
    "/admin/driverSummary",
    "/admin/truckSummary",
    "/admin/trucksmaintenance",
    "/admin/centermaintenance",
    "admin/drivers",
    "/dispatchers/loads",
  ].some((path) => pathname.includes(path));

  const getFilterType = () => {
    if (pathname.includes("loads")) return "loads";
    if (pathname.includes("driverSummary")) return "drivers";
    if (pathname.includes("drivers")) return "drivers";
    if (pathname.includes("truckSummary")) return "trucks";
    if (pathname.includes("trucksmaintenance")) return "trucks";
    if (pathname.includes("centermaintenance")) return "trucks";
    return "default";
  };

  const getFilterScope = () => {
    if (pathname.includes("driverSummary")) return "driver-summary";
    if (pathname.includes("drivers")) return "driver-page";
    return "global";
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        borderBottom: 1,
        bgcolor: theme.currentPalette.background,
        borderColor: alpha(theme.currentPalette.text, 0.1),
        color: theme.currentPalette.text,
        boxShadow: "none",
        top: 0,
        zIndex: 10,
        width: { xs: "100%", md: "calc(100% - 300px)" },
        ml: { xs: 0, md: "300px" },
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: { xs: 1.5, sm: 2 },
          px: { xs: 2, sm: 4, md: 7 },
          gap: 2,
        }}
      >
        {/* Left Side */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 1.5, sm: 2 },
            minWidth: 0,
          }}
        >
          <IconButton
            edge="start"
            onClick={onMenuClick}
            aria-label="open menu"
            sx={{
              color: theme.currentPalette.text,
              display: { md: "none" },
            }}
          >
            <IoMenu size={22} />
          </IconButton>

          <Box>
            <Typography
              variant="h1"
              sx={{
                fontWeight: "bold",
                color: theme.currentPalette.primary,
                fontSize: { xs: "18px", sm: "22px", md: "24px" },
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </Typography>

            {subtitle && (
              <Typography
                variant="body2"
                sx={{
                  color: theme.currentPalette.text,
                  fontSize: "14px",
                  maxWidth: 450,
                  display: { xs: "none", md: "block" },
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Right Side */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 } }}>
          {(pathname === "/admin/truckdashboard" || pathname === "/admin/trucksmaintenance") && (
            <div className="hidden sm:flex">
              <HeaderSourceTruckDashboard />
            </div>
          )}

          {shouldShowFilter && pathname !== "/admin/centermaintenance" && (
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <GlobalFilter filterType={getFilterType()} filterScope={getFilterScope()} />
            </Box>
          )}
          {!isSuperAdmin && !isDriver && <ChatBubble />}
          {!isSuperAdmin && !isDriver && <NotificationProvider />}
        </Box>
      </Toolbar>
    </AppBar>
  );
}