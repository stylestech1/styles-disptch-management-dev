/* eslint-disable @typescript-eslint/no-explicit-any */

import {
    Dialog,
    Box,
    Typography,
    IconButton,
    Divider,
    alpha,
} from "@mui/material";
import {
    X,
    Truck as TruckIcon,
    Building2,
    IdCard,
    CarFront,
    Calendar,
    Weight,
    Fuel,
    ShieldUser,
} from "lucide-react";
import { StatusChip } from "../ui/TablesMUI";

function InfoItem({
    icon,
    label,
    value,
    theme,
}: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    theme: any;
}) {
    return (
        <Box sx={{ display: "flex", gap: 1.4, alignItems: "flex-start" }}>
            <Box
                sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: alpha(theme.currentPalette.primary, 0.08),
                    color: theme.currentPalette.primary,
                    flexShrink: 0,
                }}
            >
                {icon}
            </Box>

            <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 12, }}>
                    {label}
                </Typography>
                <Typography sx={{ fontSize: 15, color: "#000", mt: 0.2 }}>
                    {value || "-"}
                </Typography>
            </Box>
        </Box>
    );
}

function StatusPill({
    status,
    theme,
}: {
    status: string;
    theme: any;
}) {
    const normalized = String(status || "").toLowerCase();
    const isAvailable = normalized === "available";

    return (
        <Box
            sx={{
                px: 2.3,
                py: 0.9,
                borderRadius: 2,
                fontWeight: 900,
                fontSize: 14,
                color: "#fff",
                bgcolor: isAvailable ? theme.currentPalette.primary : theme.currentPalette.primary,
                minWidth: 120,
                textAlign: "center",
            }}
        >
            {status || "N/A"}
        </Box>
    );
}

export function ViewTruckDialog({
    open,
    onClose,
    selectedTruck,
    theme,
}: {
    open: boolean;
    onClose: () => void;
    selectedTruck: any;
    theme: any;
}) {
    const truckId = selectedTruck?.truckId ?? selectedTruck?.id ?? "—";
    const status = selectedTruck?.status ?? "N/A";

    const driverName =
        typeof selectedTruck?.assignedDriver === "object"
            ? selectedTruck?.assignedDriver?.name
            : selectedTruck?.assignedDriver;

    const driverCode =
        typeof selectedTruck?.assignedDriver === "object"
            ? selectedTruck?.assignedDriver?.driverId
            : undefined;

    const ownership = selectedTruck?.ownership ?? "Company";

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    width: "min(720px, calc(100vw - 28px))",
                    overflow: "auto",
                    bgcolor: "#fff",
                },
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    px: 3,
                    py: 2.2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: "#fff",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.4 }}>
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            display: "grid",
                            placeItems: "center",
                            bgcolor: alpha(theme.currentPalette.primary, 0.08),
                            color: theme.currentPalette.primary,
                            border: `1px solid ${alpha(theme.currentPalette.primary, 0.12)}`,
                        }}
                    >
                        <TruckIcon size={20} />
                    </Box>

                    <Typography sx={{ fontSize: 22 }}>
                        Truck Details
                    </Typography>
                </Box>

                <IconButton
                    onClick={onClose}
                    sx={{ color: "#111827", "&:hover": { bgcolor: alpha(theme.currentPalette.primary, 0.06) } }}
                >
                    <X size={20} />
                </IconButton>
            </Box>

            <Divider />

            {/* Body */}
            <Box sx={{ p: 3 }}>
                <Box
                    sx={{
                        borderRadius: 2.5,
                        border: `1px solid ${alpha(theme.currentPalette.primary, 0.18)}`,
                        bgcolor: "#fff",
                        p: 2.8,
                    }}
                >
                    {/* Title row inside card */}
                    <Box
                        sx={{
                            display: { xs: "block", sm: "flex" },
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                        }}
                    >
                        <Typography sx={{ fontSize: 22, fontWeight: 500, color: theme.currentPalette.primary }}>
                            Truck - ({truckId})
                        </Typography>
                        <Typography className="p-4 text-center">
                            <StatusChip status={status as any} />
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 2.2 }} />

                    {/* Info grid */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                            columnGap: 6,
                            rowGap: 2.4,
                        }}
                    >
                        <InfoItem
                            theme={theme}
                            icon={<ShieldUser size={24} />}
                            label="Driver"
                            value={
                                driverName
                                    ? `ID: ${driverCode} | ${driverName}`
                                    : "Unassigned"
                            }
                        />

                        <InfoItem
                            theme={theme}
                            icon={<Building2 size={24} />}
                            label="Ownership"
                            value={ownership}
                        />

                        <InfoItem
                            theme={theme}
                            icon={<IdCard size={24} />}
                            label="Plate Number"
                            value={selectedTruck?.plateNumber ?? "-"}
                        />

                        <InfoItem
                            theme={theme}
                            icon={<CarFront size={24} />}
                            label="Model"
                            value={selectedTruck?.model ?? "-"}
                        />

                        <InfoItem
                            theme={theme}
                            icon={<TruckIcon size={24} />}
                            label="Vehicle Type"
                            value={selectedTruck?.type ?? "-"}
                        />

                        <InfoItem
                            theme={theme}
                            icon={<Calendar size={24} />}
                            label="Year"
                            value={selectedTruck?.year ?? "-"}
                        />

                        <InfoItem
                            theme={theme}
                            icon={<Weight size={24} />}
                            label="Capacity"
                            value={selectedTruck?.capacity ? `${selectedTruck.capacity} kg` : "-"}
                        />

                        <InfoItem
                            theme={theme}
                            icon={<Fuel size={24} />}
                            label="Fuel/Mile"
                            value={selectedTruck?.fuelPerMile ?? "-"}
                        />
                    </Box>
                </Box>
            </Box>
        </Dialog>
    );
}