/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Divider,
  Button,
  useTheme,
  useMediaQuery,
  Avatar,
  CircularProgress,
  Link,
  alpha,
  Tooltip,
} from "@mui/material";
import NextLink from "next/link";
import { IoLogOutOutline } from "react-icons/io5";
import { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector, RootState } from "@/redux/store";
import { logout } from "@/redux/slices/authSlice";
import { TABS_CONFIG } from "@/constants/tabs";
import { useGoogleMaps } from "@/hook/useGoogleMaps";
import Navbar from "@/components/layout/Header";
import { FilterProvider } from "@/providers/FilterProvider";
import { socketService } from "@/services/socketService";
import { InfoIcon } from "lucide-react";
import { useGetUserInfoQuery } from "@/redux/slices/apiSlice";

const DRAWER_WIDTH = 300;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const themePalette = useAppSelector((state: RootState) => state.palette);
  const pathname = usePathname();
  const user = useAppSelector((state: RootState) => state.auth.user);
  const token = useAppSelector((state: RootState) => state.auth.token);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(isDesktop);
  const isGoogleMapsLoaded = useGoogleMaps();

  const { data: userInfoData, isLoading: userInfoLoading } =
    useGetUserInfoQuery(undefined as any, {
      skip: !token,
      refetchOnMountOrArgChange: true,
    });

  const currentUser = userInfoData?.data || user;

  const base = useMemo(() => {
    if (pathname.startsWith("/superAdmin")) return "/superAdmin";
    if (pathname.startsWith("/admin")) return "/admin";
    if (pathname.startsWith("/manager")) return "/manager";
    return "/dispatchers";
  }, [pathname]);

  useEffect(() => {
    setIsSidebarOpen(isDesktop);
  }, [isDesktop]);

  if (!currentUser || userInfoLoading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const roleKey = (currentUser?.role || "").toLowerCase() as keyof typeof TABS_CONFIG;
  const tabs = Array.isArray(TABS_CONFIG[roleKey]) ? TABS_CONFIG[roleKey] : [];

  const handleLogout = () => {
    socketService.disconnect();
    dispatch(logout());
    router.replace("/");
  };

  const getActiveTabInfo = () => {
    const cleanedPath = pathname.split("/").pop();

    if (pathname.includes("/dispatchers/loadDetails")) {
      return {
        label: "Load Details",
        subtitle: "Manage and track all your shipments and deliveries in one place.",
      };
    }

    const activeTab = tabs.find(
      (tab: any) =>
        tab.label.replace(/\s+/g, "").toLowerCase() === cleanedPath
    );

    return activeTab || { label: "", subtitle: "" };
  };

  const { label: title, subtitle } = getActiveTabInfo();

  const getInitials = (fullName: string) => {
    const names = fullName.split(" ").filter(Boolean);
    return names.map((n) => n[0]?.toUpperCase()).join("").slice(0, 2);
  };

  const SidebarContent = (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: themePalette.currentPalette.background,
        color: themePalette.currentPalette.text,
      }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Link
          href={`${base}/${currentUser.id}`}
          display="flex"
          alignItems="center"
          gap={2}
          underline="none"
        >
          <Avatar sx={{ bgcolor: themePalette.currentPalette.primary }}>
            {getInitials(currentUser.name)}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography
                variant="subtitle1"
                fontWeight={600}
                sx={{ color: themePalette.currentPalette.text }}
                noWrap
              >
                {currentUser.name}
              </Typography>

              {!currentUser?.emailVerifiedAt && (
                <Tooltip title="Email not verified" arrow>
                  <Box sx={{ display: "flex", cursor: "pointer" }}>
                    <InfoIcon color="#f59e0b" size={18} />
                  </Box>
                </Tooltip>
              )}
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: alpha(themePalette.currentPalette.text, 0.8),
                textTransform: "capitalize",
              }}
            >
              {currentUser.role}
            </Typography>
          </Box>
        </Link>
      </Box>

      <List sx={{ flex: 1, overflowY: "auto", pt: 2, pb: 1 }}>
        {tabs.map(({ label, icon }: any, i: number) => {
          if (label === "Load Details" || label === "Notifications") return null;

          const link = `${base}/${label.replace(/\s+/g, "").toLowerCase()}`;
          const active = pathname.startsWith(link);

          return (
            <ListItemButton
              key={i}
              component={NextLink}
              href={link}
              onClick={() => !isDesktop && setIsSidebarOpen(false)}
              sx={{
                borderTopLeftRadius: 6,
                borderBottomLeftRadius: 6,
                ml: 1,
                my: 0.5,
                bgcolor: active
                  ? themePalette.currentPalette.primary
                  : "transparent",
                color: active ? "#fff" : themePalette.currentPalette.primary,
              }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>{icon}</ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          );
        })}
      </List>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          startIcon={<IoLogOutOutline />}
          variant="contained"
          onClick={handleLogout}
          sx={{
            bgcolor: themePalette.currentPalette.primary,
            textTransform: "none",
            py: 1,
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <FilterProvider>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <Drawer
          variant={isDesktop ? "permanent" : "temporary"}
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              bgcolor: themePalette.currentPalette.background,
              borderRight: `1px solid ${theme.palette.divider}`,
              overflowX: "hidden",
            },
          }}
        >
          {SidebarContent}
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            ml: isDesktop ? `${DRAWER_WIDTH}px` : 0,
            width: isDesktop ? `calc(100% - ${DRAWER_WIDTH}px)` : "100%",
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
          }}
        >
          {isGoogleMapsLoaded ? (
            <>
              {pathname !== `${base}/chat` ? (
                <>
                  <Navbar
                    title={title}
                    subtitle={subtitle}
                    onMenuClick={() => setIsSidebarOpen(true)}
                  />

                  <Box
                    sx={{
                      flex: 1,
                      overflowY: "auto",
                      pt: "96px",
                      px: { xs: 3, md: 4 },
                    }}
                  >
                    {children}
                  </Box>
                </>
              ) : (
                <Box sx={{ flex: 1, overflowY: "auto" }}>{children}</Box>
              )}
            </>
          ) : (
            <Box
              sx={{
                height: "60vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress color="primary" />
            </Box>
          )}
        </Box>
      </Box>
    </FilterProvider>
  );
}