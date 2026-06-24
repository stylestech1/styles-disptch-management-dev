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
import { useState, useEffect } from "react";
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const themePalette = useAppSelector((state: RootState) => state.palette);
  const pathname = usePathname();
  const user = useAppSelector((state: RootState) => state.auth.user);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(isDesktop);
  const token = useAppSelector((state: RootState) => state.auth.token);

  const { data: userInfoData } = useGetUserInfoQuery(undefined as any, {
    skip: !token,
    refetchOnMountOrArgChange: true,
  });

  const currentUser = userInfoData?.data || user;

  // Google hook
  const isGoogleMapsLoaded = useGoogleMaps();

  // Sync sidebar when breakpoint changes
  useEffect(() => {
    setIsSidebarOpen(isDesktop);
  }, [isDesktop]);

  if (!currentUser) return null;

  const roleKey = (currentUser?.role || "").toLowerCase() as keyof typeof TABS_CONFIG;
  const base = currentUser.role === "admin" ? "/admin" : "/dispatchers";

  const tabs = Array.isArray(TABS_CONFIG[roleKey]) ? TABS_CONFIG[roleKey] : [];
  const handleLogout = () => {
    // 🔴 Disconnect Socket
    socketService.disconnect();

    // 🔴 Clear auth token
    dispatch(logout());

    // 🔴 return to login
    router.replace("/");
  };

  const getActiveTabInfo = () => {
    const cleanedPath = pathname.split("/").pop();
    if (pathname.includes("/dispatchers/loadDetails")) {
      return {
        label: "Load Details",
        subtitle:
          "Manage and track all your shipments and deliveries in one place.",
      };
    }
    const activeTab = tabs.find(
      (tab) => tab.label.replace(/\s+/g, "").toLowerCase() === cleanedPath
    );
    return activeTab || { label: "", subtitle: "" };
  };
  const { label: title, subtitle } = getActiveTabInfo();

  const getInitials = (fullName: string) => {
    const names = fullName.split(" ");
    const initials = names.map((n) => n[0]?.toUpperCase()).join("");
    return initials;
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
      {/* User Header */}
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
          <Box sx={{ flex: 1 }}>
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
                  <InfoIcon

                    color="#f59e0b"
                    fontSize="small"
                  // sx={{ cursor: "pointer" }}
                  />
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

      {/* Navigation */}
      <List sx={{ flex: 1, overflowY: "auto", pt: 2, pb: 1 }}>
        {tabs.map(({ label, icon }, i) => {
          if (label !== "Load Details" && label !== "Notifications") {
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
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                  ml: 1,
                  my: 0.5,
                  backgroundColor: active
                    ? themePalette.currentPalette.primary
                    : "transparent",
                  color: active
                    ? theme.palette.primary.contrastText || "#fff"
                    : themePalette.currentPalette.primary,
                  "&:hover": {
                    backgroundColor: active
                      ? alpha(themePalette.currentPalette.primary, 0.9)
                      : alpha(themePalette.currentPalette.primary, 0.1),
                    color: active
                      ? themePalette.currentPalette.background
                      : themePalette.currentPalette.primary,
                  },
                }}
              >
                <ListItemIcon sx={{ color: "inherit" }}>{icon}</ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            );
          }
        })}
      </List>

      {/* Logout */}
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          startIcon={<IoLogOutOutline />}
          variant="contained"
          onClick={handleLogout}
          className="!rounded-[6px]"
          sx={{
            // borderRadius: 2,
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
        {/* Sidebar Drawer */}
        <Drawer
          variant={isDesktop ? "permanent" : "temporary"}
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            zIndex: (theme) =>
              isDesktop ? theme.zIndex.drawer - 1200 : theme.zIndex.modal + 1,
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              bgcolor: themePalette.currentPalette.background,
              borderRight: `1px solid ${theme.palette.divider}`,
              boxShadow: isDesktop ? "none" : undefined,
              overflowX: "hidden",
            },
          }}
        >
          {SidebarContent}
        </Drawer>

        {/* Main content area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            ml: isDesktop ? `${DRAWER_WIDTH}px` : 0,
            width: isDesktop ? `calc(100% - ${DRAWER_WIDTH}px)` : "100%",
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            bgcolor: themePalette.currentPalette.background,
          }}
        >
          {/* Page content */}
          <Box>
            {isGoogleMapsLoaded ? (
              <>
                {pathname !== `${base}/chat` && (
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
                )}
                {pathname === `${base}/chat` && (
                  <Box
                    sx={{
                      flex: 1,
                      overflowY: "auto",
                    }}
                  >
                    {children}
                  </Box>
                )}
              </>
            ) : (
              <Box
                sx={{
                  height: "60vh",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CircularProgress color="primary" />
                <Typography
                  sx={{ mt: 2, color: themePalette.currentPalette.text }}
                >
                  Loading Google Maps...
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </FilterProvider>
  );
}
