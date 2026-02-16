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
import { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector, RootState } from "@/redux/store";
import { logout } from "@/redux/slices/authSlice";
import { TABS_CONFIG } from "@/constants/tabs";
import { useGoogleMaps } from "@/hook/useGoogleMaps";
import Navbar from "@/components/layout/Header";
import { FilterProvider } from "@/providers/FilterProvider";
import { socketService } from "@/services/socketService";

const DRAWER_WIDTH = 300;

function normalizeRole(role?: string) {
    const r = (role || "").trim().toLowerCase();
    if (r === "super-admin" || r === "superadmin" || r === "super_admin")
        return "superadmin";
    if (r === "admin") return "admin";
    return r;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
    const themePalette = useAppSelector((state: RootState) => state.palette);
    const pathname = usePathname();
    const user = useAppSelector((state: RootState) => state.auth.user);
    const dispatch = useAppDispatch();
    const router = useRouter();

    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(isDesktop);

    // Google hook
    const isGoogleMapsLoaded = useGoogleMaps();

    // Sync sidebar when breakpoint changes
    useEffect(() => {
        setIsSidebarOpen(isDesktop);
    }, [isDesktop]);

    // ✅ detect base from current route
    const base = useMemo(() => {
        if (pathname.startsWith("/superadmin")) return "/superadmin";
        if (pathname.startsWith("/admin")) return "/admin";
        return "/superadmin";
    }, [pathname]);

    const isSuperAdminRoute = pathname.startsWith("/superadmin");

    // ✅ Show loader while redux/user hydrates (avoid blank screen)
    if (!user) {
        return (
            <Box
                sx={{
                    minHeight: "60vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                }}
            >
                <CircularProgress />
                <Typography sx={{ color: themePalette.currentPalette.text }}>
                    Loading user...
                </Typography>
            </Box>
        );
    }

    // ✅ Tabs resolving
    const roleKey = normalizeRole(user.role);
    const roleTabs = TABS_CONFIG[roleKey as keyof typeof TABS_CONFIG] ?? [];

    // ✅ SUPERADMIN => Companies ONLY
    const tabs = isSuperAdminRoute
        ? roleTabs.filter((t) => t.label.toLowerCase() === "companies")
        : roleTabs;

    const handleLogout = () => {
        socketService.disconnect();
        dispatch(logout());
        router.replace("/");
    };

    const getActiveTabInfo = () => {
        const cleanedPath = pathname.split("/").pop();

        // keep special case if you still use it
        if (pathname.includes("/dispatchers/loadDetails")) {
            return {
                label: "Load Details",
                subtitle: "Manage and track all your shipments and deliveries in one place.",
            };
        }

        const activeTab = tabs.find(
            (tab: { label: string; }) => tab.label.replace(/\s+/g, "").toLowerCase() === cleanedPath
        );

        return activeTab || { label: "", subtitle: "" };
    };

    const { label: title, subtitle } = getActiveTabInfo();

    const getInitials = (fullName: string) => {
        const names = fullName.split(" ").filter(Boolean);
        return names.map((n) => n[0].toUpperCase()).join("").slice(0, 2);
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

                        <Typography
                            variant="body2"
                            sx={{
                                color: themePalette.currentPalette.text,
                                textTransform: "capitalize",
                            }}
                        >
                            {user.role}
                        </Typography>
                    </Box>
                </Link>
            </Box>

            {/* Navigation */}
            <List sx={{ flex: 1, overflowY: "auto", py: 1 }}>
                {tabs.map(({ label, icon }, i) => {
                    // you can keep these guards (won’t matter since tabs is Companies only on superadmin)
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
                                borderRadius: 2,
                                mx: 1,
                                my: 0.5,
                                backgroundColor: active ? themePalette.currentPalette.primary : "transparent",
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
                                primaryTypographyProps={{ fontWeight: 500 }}
                            />
                        </ListItemButton>
                    );
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
                    sx={{
                        borderRadius: 2,
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
                        bgcolor: alpha(themePalette.currentPalette.primary, 0.02),
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
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <CircularProgress color="primary" />
                            <Typography sx={{ mt: 2, color: themePalette.currentPalette.text }}>
                                Loading Google Maps...
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </FilterProvider>
    );
}
