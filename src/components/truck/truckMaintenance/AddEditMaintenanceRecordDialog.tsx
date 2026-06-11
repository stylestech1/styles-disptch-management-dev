/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    alpha,
    Box,
    Button,
    Dialog,
    DialogContent,
    Divider,
    IconButton,
    Typography,
    TextField,
    MenuItem,
    Stack,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    InputAdornment,
    useMediaQuery,
} from "@mui/material";

import {
    Plus,
    X,
    ChevronDown,
    Save,
    Goal,
    Watch,
    SquarePen,
    Wrench,
    Building2,
    LandPlot,
    CalendarFold,
    Trash,
    Truck,
} from "lucide-react";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { RootState, useAppSelector } from "@/redux/store";
import { CiCircleCheck } from "react-icons/ci";

type RepeatBy = "mile" | "time";

type TruckOption = { id: string; truckNumber: string };
type CenterOption = { id: string; name: string };

type TruckRow = {
    rowId: string;
    truckId: string;
    lastDoneMile?: string;
    lastDoneAt?: string; // YYYY-MM-DD
};

export type AddEditMaintenancePayload = {
    type: string;
    repeatBy: RepeatBy;
    serviceCenter?: string;
    intervalMile?: number;
    remindBeforeMile?: number;
    intervalDays?: number;
    remindBeforeDays?: number;

    statusPerTruck: Array<{
        truck: string;
        lastDoneMile?: number;
        lastDoneAt?: string;
    }>;
};

type Props = {
    open: boolean;
    mode: "add" | "edit";
    repeatBy: RepeatBy;
    primaryColor: string;
    isSubmitting?: boolean;

    serviceTypes: string[];
    maintenanceCenters: CenterOption[];
    trucks: TruckOption[];

    initialValues?: {
        type?: string;
        serviceCenter?: string;

        intervalMile?: number;
        remindBeforeMile?: number;
        intervalDays?: number;
        remindBeforeDays?: number;

        statusPerTruck?: Array<{
            truckId: string;
            lastDoneMile?: number;
            lastDoneAt?: string | null;
        }>;
    };

    onClose: () => void;
    onSubmit: (payload: AddEditMaintenancePayload) => Promise<void> | void;
};

const steps = ["General Information", "Operational Details"];
const uid = () => Math.random().toString(36).slice(2, 9);

export default function AddEditMaintenanceRecordDialog({
    open,
    mode,
    repeatBy,
    primaryColor,
    isSubmitting,
    serviceTypes,
    maintenanceCenters,
    trucks,
    initialValues,
    onClose,
    onSubmit,
}: Props) {
    const theme = useAppSelector((state: RootState) => state.palette);
    const isXs = useMediaQuery("(max-width:480px)");

    const [activeStep, setActiveStep] = useState(0);

    // Step 1 fields
    const [type, setType] = useState("");
    const [serviceCenter, setServiceCenter] = useState<string>("");

    const [intervalMile, setIntervalMile] = useState("");
    const [remindBeforeMile, setRemindBeforeMile] = useState("");
    const [intervalDays, setIntervalDays] = useState("");
    const [remindBeforeDays, setRemindBeforeDays] = useState("");
    const actionBtnSx = {
        height: 52,
        minWidth: 190,
        borderRadius: 2,
        textTransform: "none",
        fontWeight: 700,
        fontSize: 16,
    };

    // Step 2 rows
    const [rows, setRows] = useState<TruckRow[]>([
        { rowId: uid(), truckId: "", lastDoneMile: "", lastDoneAt: "" },
    ]);
    const textFieldSx = useMemo(
        () => ({
            "& .MuiInputLabel-root": {
                color: theme.currentPalette.primary,
                fontWeight: 600,
            },
            "& .MuiInputLabel-root.Mui-focused": {
                color: theme.currentPalette.primary,
            },
            "& .MuiInputLabel-asterisk": {
                color: "#EF4444",
            },
            "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                backgroundColor: "#fff",
                minHeight: 56,
                "& fieldset": { borderColor: "rgba(0,0,0,0.2)" },
                "&:hover fieldset": { borderColor: theme.currentPalette.primary },
                "&.Mui-focused fieldset": {
                    borderColor: theme.currentPalette.primary,
                    borderWidth: 1,
                },
            },
            "& .MuiInputBase-input::placeholder": {
                opacity: 1,
                color: alpha(theme.currentPalette.text, 0.65),
            },
        }),
        [theme]
    );

    const selectSx = useMemo(
        () => ({
            ...textFieldSx,
            "& .MuiSelect-select": {
                minHeight: 56,
                display: "flex",
                alignItems: "center",
                py: 0,
            },
        }),
        [textFieldSx]
    );

    // fill initial values in edit
    useEffect(() => {
        if (!open) return;

        setActiveStep(0);

        setType(initialValues?.type ?? "");
        setServiceCenter(initialValues?.serviceCenter ?? "");

        setIntervalMile(
            initialValues?.intervalMile !== undefined
                ? String(initialValues.intervalMile)
                : ""
        );
        setRemindBeforeMile(
            initialValues?.remindBeforeMile !== undefined
                ? String(initialValues.remindBeforeMile)
                : ""
        );
        setIntervalDays(
            initialValues?.intervalDays !== undefined
                ? String(initialValues.intervalDays)
                : ""
        );
        setRemindBeforeDays(
            initialValues?.remindBeforeDays !== undefined
                ? String(initialValues.remindBeforeDays)
                : ""
        );

        const initRows =
            initialValues?.statusPerTruck?.length
                ? initialValues.statusPerTruck.map((t) => ({
                    rowId: uid(),
                    truckId: t.truckId,
                    lastDoneMile:
                        t.lastDoneMile !== undefined ? String(t.lastDoneMile) : "",
                    lastDoneAt: t.lastDoneAt
                        ? dayjs(t.lastDoneAt).format("YYYY-MM-DD")
                        : "",
                }))
                : [{ rowId: uid(), truckId: "", lastDoneMile: "", lastDoneAt: "" }];

        setRows(initRows);
    }, [open, initialValues]);

    const selectedTruckIds = useMemo(
        () => rows.map((r) => r.truckId).filter(Boolean),
        [rows]
    );

    const availableTrucksForRow = (rowId: string) => {
        const current = rows.find((r) => r.rowId === rowId)?.truckId;
        return trucks.filter(
            (t) => t.id === current || !selectedTruckIds.includes(t.id)
        );
    };

    const canGoNext = useMemo(() => {
        if (!type.trim()) return false;

        if (repeatBy === "mile") {
            const a = Number(intervalMile);
            const b = Number(remindBeforeMile);
            if (!intervalMile || !remindBeforeMile) return false;
            if (!Number.isFinite(a) || a <= 0) return false;
            if (!Number.isFinite(b) || b < 0) return false;
            return true;
        }

        const a = Number(intervalDays);
        const b = Number(remindBeforeDays);
        if (!intervalDays || !remindBeforeDays) return false;
        if (!Number.isFinite(a) || a <= 0) return false;
        if (!Number.isFinite(b) || b < 0) return false;
        return true;
    }, [type, repeatBy, intervalMile, remindBeforeMile, intervalDays, remindBeforeDays]);

    const canSave = useMemo(() => {
        if (!canGoNext) return false;

        const validRows = rows.filter((r) => r.truckId);
        if (!validRows.length) return false;

        if (repeatBy === "mile") {
            return validRows.every(
                (r) =>
                    r.lastDoneMile !== undefined &&
                    r.lastDoneMile !== "" &&
                    Number(r.lastDoneMile) >= 0
            );
        }
        return validRows.every((r) => r.lastDoneAt && dayjs(r.lastDoneAt).isValid());
    }, [canGoNext, rows, repeatBy]);

    const handleAddTruck = () => {
        setRows((prev) => [
            ...prev,
            { rowId: uid(), truckId: "", lastDoneMile: "", lastDoneAt: "" },
        ]);
    };

    const handleRemoveTruck = (rowId: string) => {
        setRows((prev) =>
            prev.length === 1 ? prev : prev.filter((r) => r.rowId !== rowId)
        );
    };

    const handleSubmit = async () => {
        const valid = rows.filter((r) => r.truckId);

        const statusPerTruck = valid.map((r) => {
            if (repeatBy === "mile") return { truck: r.truckId, lastDoneMile: Number(r.lastDoneMile) };
            return { truck: r.truckId, lastDoneAt: String(r.lastDoneAt) };
        });

        const payload: AddEditMaintenancePayload =
            repeatBy === "mile"
                ? {
                    type: type.trim(),
                    repeatBy,
                    serviceCenter: String(serviceCenter),
                    intervalMile: Number(intervalMile),
                    remindBeforeMile: Number(remindBeforeMile),
                    statusPerTruck,
                }
                : {
                    type: type.trim(),
                    repeatBy,
                    serviceCenter: String(serviceCenter),
                    intervalDays: Number(intervalDays),
                    remindBeforeDays: Number(remindBeforeDays),
                    statusPerTruck,
                };

        await onSubmit(payload);
    };

    const headerIcon =
        mode === "add"
            ? repeatBy === "mile"
                ? <Goal color={primaryColor} size={18} />
                : <Watch color={primaryColor} size={18} />
            : <SquarePen color={primaryColor} size={18} />;

    const headerTitle =
        mode === "add"
            ? `Record ${repeatBy === "mile" ? "mile" : "time"} - based maintenance`
            : `Edit ${repeatBy === "mile" ? "mile" : "time"} - based maintenance`;

    const centerName =
        maintenanceCenters.find((c) => String(c.id) === String(serviceCenter))?.name ?? "";

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            scroll="paper"
            fullScreen={isXs}
            sx={{
                zIndex: 999,
            }}
            PaperProps={{
                sx: {
                    borderRadius: isXs ? 0 : "14px",
                    overflow: "hidden",
                    boxShadow: "0 18px 50px rgba(2,8,23,.18)",
                    display: "flex",
                    flexDirection: "column",
                    maxHeight: isXs ? "100dvh" : "calc(100dvh - 64px)",
                },
            }}
        >
            <DialogContent sx={{ p: 0, bgcolor: "#fff", }}>
                {/* Header */}
                <Box sx={{ px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
                        <Box
                            sx={{
                                width: 34,
                                height: 34,
                                borderRadius: 2,
                                bgcolor: alpha(primaryColor, 0.08),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {headerIcon}
                        </Box>

                        <Typography sx={{ fontWeight: 900, color: primaryColor, fontSize: 16 }} noWrap>
                            {headerTitle}
                        </Typography>
                    </Box>

                    <IconButton
                        onClick={onClose}
                        sx={{
                            borderRadius: 2,
                            bgcolor: alpha(theme.currentPalette.text, 0.05),
                            "&:hover": { bgcolor: alpha(theme.currentPalette.text, 0.08) },
                        }}
                    >
                        <X size={18} />
                    </IconButton>
                </Box>

                <Divider />

                {/* Stepper (custom like your screenshot) */}
                <Box sx={{ px: 2, pt: 2, backgroundColor: "#fff", flex: "0 0 auto" }}>
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", position: "relative", px: 0.5 }}>
                            <Box
                                sx={{
                                    position: "absolute",
                                    top: "22px",
                                    left: "11%",
                                    width: "78%",
                                    height: 2,
                                    bgcolor: alpha(theme.currentPalette.primary, 0.15),
                                    zIndex: 999,
                                }}
                            />
                            {steps.map((label, i) => {
                                const isActive = i === activeStep;
                                const isCompleted = i < activeStep;

                                const borderColor =
                                    isActive || isCompleted
                                        ? theme.currentPalette.primary
                                        : alpha(theme.currentPalette.text, 0.2);

                                const bgColor = isCompleted
                                    ? theme.currentPalette.primary
                                    : isActive
                                        ? theme.currentPalette.primary
                                        : theme.currentPalette.background;

                                const textColor = isCompleted || isActive ? "#fff" : theme.currentPalette.text;

                                return (
                                    <Box
                                        key={i}
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            zIndex: 999,
                                            minWidth: 110,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: "50%",
                                                border: "3px solid",
                                                borderColor,
                                                bgcolor: bgColor,
                                                color: textColor,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontWeight: 800,
                                            }}
                                        >
                                            {isCompleted ? <CiCircleCheck size={22} /> : i + 1}
                                        </Box>

                                        <Typography
                                            sx={{
                                                mt: 1,
                                                fontSize: 13,
                                                fontWeight: 600,
                                                textAlign: "center",
                                                color: isActive
                                                    ? theme.currentPalette.primary
                                                    : alpha(theme.currentPalette.text, 0.6),
                                            }}
                                        >
                                            {label}
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                </Box>

                {/* Body */}
                <Box sx={{ px: 3, py: 2 }}>
                    {activeStep === 0 ? (
                        <>
                            {/* Service Type (Select with TextField design) */}
                            <TextField
                                fullWidth
                                required
                                select
                                label="Service Type"
                                value={type}
                                onChange={(e) => setType(String(e.target.value))}
                                sx={selectSx}
                                SelectProps={{
                                    displayEmpty: true,
                                    renderValue: (val: any) =>
                                        val ? (
                                            String(val)
                                        ) : (
                                            <span style={{ color: alpha(theme.currentPalette.text, 0.65) }}>
                                                Search for city or street
                                            </span>
                                        ),
                                }}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start" sx={{ mr: 1.5 }}>
                                                <Wrench color={theme.currentPalette.primary} size={20} />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            >
                                {serviceTypes.map((s) => (
                                    <MenuItem key={s} value={s}>
                                        {s}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <Box sx={{ height: 16 }} />

                            {/* Maintenance Center (Select with same design) */}
                            <TextField
                                fullWidth
                                select
                                label="Maintenance Center"
                                value={serviceCenter}
                                onChange={(e) => setServiceCenter(String(e.target.value))}
                                sx={selectSx}
                                SelectProps={{
                                    displayEmpty: true,
                                    renderValue: (val: any) =>
                                        val ? (
                                            centerName || String(val)
                                        ) : (
                                            <span style={{ color: alpha(theme.currentPalette.text, 0.65) }}>
                                                Select Center
                                            </span>
                                        ),
                                }}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start" sx={{ mr: 1.5 }}>
                                                <Building2 color={theme.currentPalette.primary} size={20} />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            >
                                {maintenanceCenters.map((c) => (
                                    <MenuItem key={c.id} value={c.id}>
                                        {c.name}
                                    </MenuItem>
                                ))}
                            </TextField>


                            <Box sx={{ height: 16 }} />

                            {/* Intervals */}
                            {repeatBy === "mile" ? (
                                <>
                                    <TextField
                                        fullWidth
                                        required
                                        label="Mileage Interval"
                                        placeholder="e.g. 5000"
                                        type="number"
                                        value={intervalMile}
                                        onChange={(e) => setIntervalMile(e.target.value)}
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start" sx={{ mr: 1.5 }}>
                                                        <LandPlot color={theme.currentPalette.primary} />
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                        sx={textFieldSx}
                                    />

                                    <Box sx={{ height: 16 }} />

                                    <TextField
                                        fullWidth
                                        required
                                        label="Reminder Threshold"
                                        placeholder="e.g. 500"
                                        type="number"
                                        value={remindBeforeMile}
                                        onChange={(e) => setRemindBeforeMile(e.target.value)}
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start" sx={{ mr: 1.5 }}>
                                                        <LandPlot color={theme.currentPalette.primary} />
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                        sx={textFieldSx}
                                    />
                                </>
                            ) : (
                                <>
                                    <TextField
                                        fullWidth
                                        required
                                        label="Time Interval"
                                        placeholder="e.g. 50"
                                        type="number"
                                        value={intervalDays}
                                        onChange={(e) => setIntervalDays(e.target.value)}
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start" sx={{ mr: 1.5 }}>
                                                        <CalendarFold color={theme.currentPalette.primary} />
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                        sx={textFieldSx}
                                    />

                                    <Box sx={{ height: 16 }} />

                                    <TextField
                                        fullWidth
                                        required
                                        label="Reminder Threshold"
                                        placeholder="e.g. 5"
                                        type="number"
                                        value={remindBeforeDays}
                                        onChange={(e) => setRemindBeforeDays(e.target.value)}
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start" sx={{ mr: 1.5 }}>
                                                        <CalendarFold color={theme.currentPalette.primary} />
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                        sx={textFieldSx}
                                    />
                                </>
                            )}

                            <Button
                                fullWidth
                                variant="contained"
                                disabled={!canGoNext}
                                onClick={() => setActiveStep(1)}
                                sx={{
                                    mt: 2,
                                    height: 56,
                                    borderRadius: 2,
                                    textTransform: "none",
                                    fontWeight: 800,
                                    bgcolor: primaryColor,
                                    "&:hover": { bgcolor: primaryColor },
                                    "&.Mui-disabled": {
                                        bgcolor: alpha(primaryColor, 0.22),
                                        color: alpha(theme.currentPalette.background, 0.95),
                                    },
                                }}
                            >
                                Next
                            </Button>
                        </>
                    ) : (
                        <Box>
                            {/* Step 2 */}
                            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                                <Button
                                    variant="outlined"
                                    onClick={handleAddTruck}
                                    startIcon={<Plus size={18} />}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: "none",
                                        fontWeight: 800,
                                        borderColor: alpha(primaryColor, 0.5),
                                        color: primaryColor,
                                        "&:hover": { borderColor: primaryColor, bgcolor: alpha(primaryColor, 0.08) },
                                    }}
                                >
                                    Add Truck
                                </Button>
                            </Box>

                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                {rows.map((row, idx) => (
                                    <Accordion
                                        key={row.rowId}
                                        defaultExpanded
                                        disableGutters
                                        sx={{
                                            borderRadius: 2,
                                            border: `1px solid ${alpha(primaryColor, 0.22)}`,
                                            boxShadow: "none",
                                            "&:before": { display: "none" },
                                            overflow: "hidden",
                                            gap: 1,

                                        }}
                                    >
                                        <AccordionSummary
                                            expandIcon={<ChevronDown size={18} />}
                                            sx={{
                                                px: 1,
                                                minHeight: 52,
                                                // bgcolor: alpha(primaryColor, 0.04),
                                                "& .MuiAccordionSummary-content": { alignItems: "center", my: 0 },
                                            }}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                <Box
                                                    sx={{
                                                        width: 30,
                                                        height: 30,
                                                        borderRadius: "50%",
                                                        bgcolor: alpha(primaryColor, 0.12),
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <Truck size={16} color={primaryColor} />
                                                </Box>

                                                <Typography sx={{ color: primaryColor, fontSize: 18, lineHeight: 1 }}>
                                                    Truck {idx + 1}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ flex: 1 }} />

                                            {rows.length > 1 && (
                                                <IconButton
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveTruck(row.rowId);
                                                    }}
                                                    sx={{
                                                        borderRadius: 2,
                                                        px: 2,
                                                        // bgcolor: alpha(theme.currentPalette.text, 0.05),
                                                        "&:hover": { bgcolor: alpha(theme.currentPalette.text, 0.08) },

                                                    }}
                                                >
                                                    <Trash size={16} color="#EF4444" />
                                                </IconButton>
                                            )}
                                        </AccordionSummary>

                                        <AccordionDetails sx={{ px: 2, pb: 2, pt: 1.5 }}>
                                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                                <TextField
                                                    fullWidth
                                                    required
                                                    select
                                                    label="Truck"
                                                    value={row.truckId}
                                                    onChange={(e) => {
                                                        const v = String(e.target.value);
                                                        setRows((prev) =>
                                                            prev.map((r) =>
                                                                r.rowId === row.rowId ? { ...r, truckId: v } : r
                                                            )
                                                        );
                                                    }}
                                                    sx={selectSx}
                                                    InputLabelProps={{ shrink: true }}
                                                    SelectProps={{
                                                        displayEmpty: true,
                                                        renderValue: (val: any) =>
                                                            val ? (
                                                                trucks.find((t) => t.id === val)?.truckNumber ?? String(val)
                                                            ) : (
                                                                <span style={{ color: alpha(theme.currentPalette.text, 0.65) }}>
                                                                    Select Truck
                                                                </span>
                                                            ),
                                                    }}
                                                >
                                                    {availableTrucksForRow(row.rowId).map((t) => (
                                                        <MenuItem key={t.id} value={t.id}>
                                                            {t.truckNumber}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>

                                                {repeatBy === "mile" ? (
                                                    <TextField
                                                        fullWidth
                                                        required
                                                        placeholder="e.g. 30000"
                                                        label="Last Done Mileage"
                                                        type="number"
                                                        value={row.lastDoneMile ?? ""}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            setRows((prev) =>
                                                                prev.map((r) =>
                                                                    r.rowId === row.rowId ? { ...r, lastDoneMile: v } : r
                                                                )
                                                            );
                                                        }}
                                                        slotProps={{
                                                            input: {
                                                                startAdornment: (
                                                                    <InputAdornment position="start" sx={{ mr: 1.5 }}>
                                                                        <LandPlot color={theme.currentPalette.primary} />
                                                                    </InputAdornment>
                                                                ),
                                                            },
                                                        }}
                                                        sx={textFieldSx}
                                                    />
                                                ) : (
                                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                        <DatePicker
                                                            label="Last Done Date"
                                                            value={row.lastDoneAt ? dayjs(row.lastDoneAt) : null}
                                                            onChange={(d) => {
                                                                setRows((prev) =>
                                                                    prev.map((r) =>
                                                                        r.rowId === row.rowId
                                                                            ? { ...r, lastDoneAt: d ? d.format("YYYY-MM-DD") : "" }
                                                                            : r
                                                                    )
                                                                );
                                                            }}
                                                            slotProps={{
                                                                textField: {
                                                                    fullWidth: true,
                                                                    required: true,
                                                                    sx: textFieldSx,
                                                                    slotProps: {
                                                                        input: {
                                                                            startAdornment: (
                                                                                <InputAdornment position="start" sx={{ mr: 1.5 }}>
                                                                                    <CalendarFold color={theme.currentPalette.primary} />
                                                                                </InputAdornment>
                                                                            ),
                                                                        },
                                                                    },
                                                                } as any,
                                                            }}
                                                            format="MM/DD/YYYY"
                                                        />
                                                    </LocalizationProvider>
                                                )}
                                            </Stack>
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 3,
                                    justifyContent: "center",
                                    mt: 3,
                                }}
                            >
                                <Button
                                    variant="outlined"
                                    onClick={() => setActiveStep(0)}
                                    sx={{
                                        ...actionBtnSx,
                                        borderColor: alpha(primaryColor, 0.55),
                                        color: primaryColor,
                                        bgcolor: "#fff",
                                        "&:hover": {
                                            borderColor: primaryColor,
                                            bgcolor: alpha(primaryColor, 0.06),
                                        },
                                    }}
                                >
                                    CANCEL
                                </Button>

                                <Button
                                    variant="contained"
                                    disabled={!canSave || !!isSubmitting}
                                    onClick={handleSubmit}
                                    sx={{
                                        ...actionBtnSx,
                                        bgcolor: primaryColor,
                                        boxShadow: "none",
                                        "&:hover": {
                                            bgcolor: primaryColor,
                                            boxShadow: "none",
                                        },
                                        "&.Mui-disabled": {
                                            bgcolor: alpha(primaryColor, 0.25),
                                            color: "#fff",
                                        },
                                    }}
                                >
                                    {isSubmitting ? "Saving..." : "Save"}
                                </Button>

                            </Box>
                        </Box>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
}
