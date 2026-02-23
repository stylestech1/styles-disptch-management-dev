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
} from "@mui/material";
import NextLink from "next/link";
import { IoLogOutOutline } from "react-icons/io5";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector, RootState } from "@/redux/store";
import { logout } from "@/redux/slices/authSlice";
import { TABS_CONFIG } from "@/constants/tabs";
import { useGoogleMaps } from "@/hook/useGoogleMaps";
import { PiPaintBrushBroad } from "react-icons/pi";
import Navbar from "@/components/layout/Header";
import { FilterProvider } from "@/providers/FilterProvider";
import { socketService } from "@/services/socketService";
import { Collapse } from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

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
  const [openTabs, setOpenTabs] = useState<Record<string, boolean>>({});

  const toggleTab = (label: string) => {
    setOpenTabs((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(isDesktop);

  // Google hook
  const isGoogleMapsLoaded = useGoogleMaps();

  // Sync sidebar when breakpoint changes
  useEffect(() => {
    setIsSidebarOpen(isDesktop);
  }, [isDesktop]);

  if (!user) return null;

  const roleKey = (user?.role || "").toLowerCase() as keyof typeof TABS_CONFIG;
  const tabs = Array.isArray(TABS_CONFIG[roleKey]) ? TABS_CONFIG[roleKey] : [];
  const base = user.role === "admin" ? "/admin" : "/dispatchers";

  const handleLogout = () => {
    // 🔴 Disconnect Socket
    socketService.disconnect();

    // 🔴 Clear auth token
    dispatch(logout());

    // 🔴 return to login
    router.replace("/");
  };

  const findTabByPath = (items: any[], cleanedPath: string) => {
    for (const item of items) {
      // root link style: label-based
      const itemPath = item.label?.replace(/\s+/g, "").toLowerCase();
      if (itemPath === cleanedPath) return item;

      // children link style: path-based (segment)
      if (item.children?.length) {
        const foundChild = item.children.find(
          (c: any) => c.path?.toLowerCase() === cleanedPath,
        );
        if (foundChild) return foundChild;
      }
    }
    return null;
  };

  const getActiveTabInfo = () => {
    const cleanedPath = pathname.split("/").filter(Boolean).pop()?.toLowerCase() || "";

    // dynamic routes
    if (pathname.includes("/admin/truckSummary")) {
      return {
        label: "Truck Summary",
        subtitle: "Detailed overview of truck information and performance.",
      };
    }
    if (pathname.includes("/admin/loadDetails")) {
      return {
        label: "Load Details",
        subtitle: "Manage and track all your shipments and deliveries in one place.",
      };
    }
    if (pathname.includes("/admin/driverSummary")) {
      return {
        label: "Driver Summary",
        subtitle: "Detailed overview of driver information and performance.",
      };
    }

    // ✅ search root + children
    for (const tab of tabs) {
      const tabKey = tab?.label?.replace(/\s+/g, "").toLowerCase();
      if (tabKey === cleanedPath) return tab;

      if (tab.children?.length) {
        const child = tab.children.find(
          (c) => c.path?.toLowerCase() === cleanedPath,
        );
        if (child) return child; // ✅ return child info to navbar
      }
    }

    return { label: "", subtitle: "" };
  };

  const { label: title, subtitle } = getActiveTabInfo();

  const getInitials = (fullName: string) => {
    const names = fullName.split(" ");
    const initials = names.map((n) => n[0].toUpperCase()).join("");
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
      <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Link
          href={`${base}/${user.id}`}
          display="flex"
          alignItems="center"
          gap={2}
          underline="none"
        >
          <Avatar sx={{ bgcolor: themePalette.currentPalette.primary }}>
            {getInitials(user.name)}
          </Avatar>
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{ color: themePalette.currentPalette.text }}
              noWrap
            >
              {user.name}
            </Typography>
            <div className="flex items-center gap-2">
              <Typography
                variant="body2"
                sx={{
                  color: alpha(themePalette.currentPalette.text, 0.8),
                  textTransform: "capitalize",
                }}
              >
                {user.role}
              </Typography>
            </div>
          </Box>
        </Link>
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1, overflowY: "auto", py: 1 }}>
        {tabs.map((tab, i) => {
          const hasChildren = !!tab.children?.length;

          if (
            [
              "Truck Summary",
              "Load Details",
              "Driver Summary",
              "Notifications",
            ].includes(tab.label)
          ) {
            return null;
          }

          if (hasChildren) {
            return (
              <Box key={i}>
                <ListItemButton
                  onClick={() => toggleTab(tab.label)}
                  sx={{
                    mx: 1,
                    my: 0.5,
                    borderRadius: 0.5,
                    color: themePalette.currentPalette.primary,

                    pl: 4,
                    pr: 2,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: "inherit",
                      minWidth: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {tab.icon}
                  </ListItemIcon>

                  <ListItemText sx={{
                    ml: 3,
                  }}
                    primary={tab.label} />

                  {openTabs[tab.label] ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>


                <Collapse in={openTabs[tab.label]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {tab.children!.map((child, idx) => {
                      const childLink = `${base}/${child.path}`;
                      const childActive = pathname === childLink;

                      return (
                        <ListItemButton
                          key={idx}
                          component={NextLink}
                          href={childLink}
                          sx={{
                            ml: 4,
                            borderTopLeftRadius: 6,
                            borderBottomLeftRadius: 6,
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,


                            color: childActive
                              ? theme.palette.primary.contrastText
                              : themePalette.currentPalette.primary,
                            bgcolor: childActive
                              ? themePalette.currentPalette.primary
                              : "transparent",

                            "&:hover": {
                              bgcolor: alpha(themePalette.currentPalette.primary, 0.08),
                              color: themePalette.currentPalette.primary,
                            },

                            transition: "background-color 0.2s ease, color 0.2s ease",
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              color: "inherit",
                              minWidth: 36,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {/* {tab.icon} */}
                          </ListItemIcon>

                          <ListItemText primary={child.label} />
                        </ListItemButton>
                      );
                    })}

                  </List>
                </Collapse>
              </Box>
            );
          }

          const link = `${base}/${tab.label.replace(/\s+/g, "").toLowerCase()}`;
          const active = pathname === link;

          return (
            <ListItemButton
              key={i}
              component={NextLink}
              href={link}
              sx={{
                ml: 4,
                borderTopLeftRadius: 6,
                borderBottomLeftRadius: 6,
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,

                color: active
                  ? theme.palette.primary.contrastText
                  : themePalette.currentPalette.primary,
                bgcolor: active
                  ? themePalette.currentPalette.primary
                  : "transparent",

                "&:hover": {
                  bgcolor: alpha(themePalette.currentPalette.primary, 0.08),
                  color: themePalette.currentPalette.primary,
                },

                transition: "background-color 0.2s ease, color 0.2s ease",
              }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>{tab.icon}</ListItemIcon>
              <ListItemText primary={tab.label} />
            </ListItemButton>
          );
        })}
      </List>

      {/* Logout */}
      <Divider />
      <Box sx={{ p: 2, display: "flex", gap: 2, flexDirection: "column" }}>
        {user.role === "admin" && (
          <Button
            component={NextLink}
            href="/admin/settings"
            fullWidth
            startIcon={<PiPaintBrushBroad />}
            variant="outlined"
            className="!rounded-[6px]"
            sx={{
              color: themePalette.currentPalette.primary,
              textTransform: "capitalize",
              // borderRadius: 0.5,
            }}
          // className="border rounded-lg"
          >
            Theme
          </Button>
        )}
        <Button
          fullWidth
          startIcon={<IoLogOutOutline />}
          variant="contained"
          onClick={handleLogout}
          className="!rounded-[6px]"
          sx={{
            // borderRadius: 0.5,
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
      <Box sx={{ display: "flex", height: "100vh" }}>
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
            minHeight: "inherit",
            // bgcolor: alpha(themePalette.currentPalette.primary, 0.02),
          }}
        >
          {/* Page content */}
          <Box>
            {isGoogleMapsLoaded ? (
              <>
                {/* Navbar */}
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
                  <>
                    <div className="flex lg:hidden mb-15">
                      <Navbar
                        title={title}
                        subtitle={subtitle}
                        onMenuClick={() => setIsSidebarOpen(true)}
                      />
                    </div>
                    <Box
                      sx={{
                        flex: 1,
                        overflowY: "auto",
                      }}
                    >
                      {children}
                    </Box>
                  </>
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
