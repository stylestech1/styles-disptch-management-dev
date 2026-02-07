/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    alpha,
    Autocomplete,
    Box,
    Button,
    Dialog,
    DialogContent,
    FormControl,
    FormHelperText,
    IconButton,
    InputAdornment,
    MenuItem,
    Select,
    TextField,
    Typography,
    useMediaQuery,
} from "@mui/material";

import { IoAdd, IoClose } from "react-icons/io5";
import { MdOutlineEmail, MdOutlineLocationOn, MdOutlinePhone } from "react-icons/md";
import { CiCircleCheck, CiEdit } from "react-icons/ci";
import { PiBuildingOfficeLight } from "react-icons/pi";

import LocationAutocomplete, { TPlace } from "@/components/sections/LocationAutocomplete";
import { useAppSelector, RootState } from "@/redux/store";

export type DayKey = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

export type MaintenanceCenterForm = {
    name: string;
    location: TPlace | null;
    phone: string;
    status: "Active" | "Inactive";
    email: string;
    services: string[];

    workStartDay: DayKey;
    workEndDay: DayKey;
    workFrom: string;
    workTo: string;
    notes: string;
};

export type AddEditMode = "add" | "edit";

type Props = {
    open: boolean;
    mode: AddEditMode;
    primaryColor: string;
    initialValues?: Partial<MaintenanceCenterForm>;
    onClose: () => void;
    initialKey?: string;
    onSubmit: (payload: MaintenanceCenterForm) => Promise<void> | void;
    servicesOptions?: string[];
};

const DAYS: DayKey[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const defaultForm: MaintenanceCenterForm = {
    name: "",
    location: null,
    phone: "",
    status: "Active",
    email: "",
    services: [],
    workStartDay: "SUN",
    workEndDay: "THU",
    workFrom: "",
    workTo: "",
    notes: "",
};

type FormErrors = Partial<Record<keyof MaintenanceCenterForm, string>>;

const normalizePhone = (v: string) => v.replace(/[^\d+]/g, "");

const isValidPhone = (v: string) => {
    if (!v) return false;
    if (v === "+") return false;
    // optional + at start, then digits
    if (!/^\+?\d+$/.test(v)) return false;
    // not multiple +
    if (/\+.+\+/.test(v)) return false;
    return true;
};

const isValidEmailCom = (email: string) => {
    const e = email.trim().toLowerCase();
    if (!e) return true; // optional
    return /^[^\s@]+@[^\s@]+\.com$/.test(e);
};

const timeToMinutes = (t: string) => {
    if (!t) return NaN;
    const [hh, mm] = t.split(":").map(Number);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return NaN;
    return hh * 60 + mm;
};

export default function AddEditMaintenanceCenterDialog({
    open,
    mode,
    primaryColor,
    initialValues,
    onClose,
    onSubmit,
    initialKey,
    servicesOptions = [
        "General Maintenance",
        "Oil Change",
        "Brake Repair",
        "Engine Service",
        "Tire Services",
        "Battery Replacement",
        "AC Repair",
    ],
}: Props) {
    const theme = useAppSelector((state: RootState) => state.palette);
    const isXs = useMediaQuery("(max-width:480px)");

    const [step, setStep] = useState<1 | 2>(1);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [dayPickPhase, setDayPickPhase] = useState<"start" | "end">("start");

    const mergedInitial = useMemo(() => {
        return { ...defaultForm, ...(initialValues ?? {}) } as MaintenanceCenterForm;
    }, [initialValues]);

    const [form, setForm] = useState<MaintenanceCenterForm>(mergedInitial);

    const stepsDriver = ["General Information", "Operational Details"];
    const activeStep = step === 1 ? 0 : 1;

    useEffect(() => {
        if (!open) return;
        setStep(1);
        setSaving(false);
        setErrors({});
        setDayPickPhase("start");
        setForm({ ...defaultForm, ...(initialValues ?? {}) } as MaintenanceCenterForm);
    }, [open, mode, initialKey]);

    const title = mode === "add" ? "Add Maintenance Center" : "Edit Maintenance Center";
    const icon = mode === "add" ? <IoAdd size={16} /> : <CiEdit size={16} />;

    const setField = <K extends keyof MaintenanceCenterForm>(key: K, value: MaintenanceCenterForm[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: "" }));
    };

    const hasLocation =
        !!form.location?.display_name?.trim() || !!(form.location as any)?.place_id;

    const validateStep1 = () => {
        const e: FormErrors = {};

        if (!form.name.trim()) e.name = "Center name is required";
        if (!hasLocation) e.location = "Location is required";
        if (form.location && !(form.location as any)?.place_id)
            e.location = "Please choose from dropdown (place_id missing)";

        if (!form.phone.trim()) e.phone = "Phone is required";
        else if (!isValidPhone(form.phone.trim()))
            e.phone = "Phone must contain only numbers and optional + at start";

        if (!isValidEmailCom(form.email)) e.email = "Email must include @ and end with .com";

        setErrors((prev) => ({ ...prev, ...e }));
        return Object.keys(e).length === 0;
    };

    const validateStep2 = () => {
        const e: FormErrors = {};

        const fromMin = timeToMinutes(form.workFrom);
        const toMin = timeToMinutes(form.workTo);

        if (!form.workFrom) e.workFrom = "Start time is required";
        if (!form.workTo) e.workTo = "End time is required";

        if (form.workFrom && form.workTo) {
            if (!Number.isFinite(fromMin) || !Number.isFinite(toMin)) {
                e.workFrom = "Invalid time";
                e.workTo = "Invalid time";
            } else if (fromMin === toMin) {
                e.workTo = "End time must be different from start time";
            } else if (toMin < fromMin) {
                e.workTo = "End time must be after start time";
            }
        }

        setErrors((prev) => ({ ...prev, ...e }));
        return Object.keys(e).length === 0;
    };

    const handleNext = () => {
        if (!validateStep1()) return;
        setStep(2);
    };

    const handleSave = async () => {
        const ok1 = validateStep1();
        const ok2 = validateStep2();
        if (!ok1 || !ok2) return;

        setSaving(true);
        try {
            await onSubmit(form);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            scroll="paper"
            fullScreen={isXs}
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
            {/* Header */}
            <Box
                sx={{
                    px: 2,
                    py: 1.6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #EEF2F7",
                    backgroundColor: "#fff",
                    flex: "0 0 auto",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                        sx={{
                            width: 28,
                            height: 28,
                            borderRadius: "8px",
                            display: "grid",
                            placeItems: "center",
                            backgroundColor: "#EAF2FF",
                            border: "1px solid #D6E6FF",
                            color: primaryColor,
                        }}
                    >
                        {icon}
                    </Box>

                    <Typography sx={{ fontWeight: 800, color: "#0F172A", fontSize: 14 }}>
                        {title}
                    </Typography>
                </Box>

                <IconButton onClick={onClose} sx={{ borderRadius: "10px" }}>
                    <IoClose />
                </IconButton>
            </Box>

            {/* Stepper */}
            <Box sx={{ px: 2, pt: 2, backgroundColor: "#fff", flex: "0 0 auto" }}>
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", position: "relative", px: 0.5 }}>
                        {/* line */}
                        <Box
                            sx={{
                                position: "absolute",
                                top: "22px",
                                left: "11%",
                                width: "78%",
                                height: 2,
                                bgcolor: alpha(theme.currentPalette.primary, 0.15),
                                zIndex: 0,
                            }}
                        />

                        {stepsDriver.map((label, i) => {
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
                                        zIndex: 1,
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

            <DialogContent
                sx={{
                    px: 2,
                    pb: 2,
                    pt: 0,
                    overflowY: "auto",
                    flex: "1 1 auto",
                    WebkitOverflowScrolling: "touch",
                }}
            >
                {step === 1 ? (
                    <>
                        <FieldBlock>
                            <FieldLabel label="Center Name" required />
                            <TextField
                                fullWidth
                                placeholder="e.g. FixIt Auto Center"
                                value={form.name}
                                onChange={(e) => setField("name", e.target.value)}
                                error={!!errors.name}
                                helperText={errors.name}
                                FormHelperTextProps={{ sx: { mt: 0.5 } }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PiBuildingOfficeLight color={theme.currentPalette.primary} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={inputSx}
                            />
                        </FieldBlock>

                        <FieldBlock>
                            <FieldLabel label="Location" required />
                            <LocationAutocomplete
                                value={form.location}
                                setValue={(place) => setField("location", place)}
                                placeholder="Search for city or street"
                                startAdornment={<MdOutlineLocationOn size={20} color="#2563EB" />}
                            />
                            {!!errors.location && (
                                <FormHelperText error sx={{ mt: 0.5 }}>
                                    {errors.location}
                                </FormHelperText>
                            )}
                        </FieldBlock>

                        <FieldBlock>
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                    gap: 2,
                                }}
                            >
                                <Box>
                                    <FieldLabel label="Phone" required />
                                    <TextField
                                        fullWidth
                                        value={form.phone}
                                        placeholder="e.g. +1234567890"
                                        onChange={(e) => {
                                            const raw = e.target.value;
                                            const cleaned = normalizePhone(raw);
                                            const fixed = cleaned.startsWith("+")
                                                ? "+" + cleaned.slice(1).replace(/\+/g, "")
                                                : cleaned.replace(/\+/g, "");
                                            setField("phone", fixed);
                                        }}
                                        inputProps={{ inputMode: "tel" }}
                                        error={!!errors.phone}
                                        helperText={errors.phone}
                                        FormHelperTextProps={{ sx: { mt: 0.5 } }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <MdOutlinePhone color={theme.currentPalette.primary} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={inputSx}
                                    />
                                </Box>

                                <Box>
                                    <FieldLabel label="Status" />
                                    <FormControl fullWidth error={!!errors.status}>
                                        <Select
                                            value={form.status}
                                            onChange={(e) => setField("status", e.target.value as any)}
                                            sx={selectSx}
                                            startAdornment={
                                                <InputAdornment position="start">
                                                    <CiCircleCheck color={theme.currentPalette.primary} />
                                                </InputAdornment>
                                            }
                                        >
                                            <MenuItem value="Active">Active</MenuItem>
                                            <MenuItem value="Inactive">Inactive</MenuItem>
                                        </Select>

                                        {!!errors.status && (
                                            <FormHelperText sx={{ mt: 0.5 }}>{errors.status}</FormHelperText>
                                        )}
                                    </FormControl>
                                </Box>
                            </Box>
                        </FieldBlock>

                        <FieldBlock>
                            <FieldLabel label="Email" />
                            <TextField
                                fullWidth
                                placeholder="example@gmail.com"
                                value={form.email}
                                onChange={(e) => setField("email", e.target.value)}
                                error={!!errors.email}
                                helperText={errors.email}
                                FormHelperTextProps={{ sx: { mt: 0.5 } }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <MdOutlineEmail color={theme.currentPalette.primary} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={inputSx}
                            />
                        </FieldBlock>

                        <FieldBlock>
                            <FieldLabel label="Maintenance Services" />
                            <Autocomplete
                                multiple
                                options={servicesOptions}
                                value={form.services}
                                onChange={(_, value) => setField("services", value as string[])}
                                renderInput={(params) => (
                                    <TextField {...params} placeholder="e.g. Oil Change, Brake Repair" sx={inputSx} />
                                )}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "10px",
                                        backgroundColor: "#fff",
                                        minHeight: 48,
                                    },
                                }}
                            />
                        </FieldBlock>

                        <Button
                            fullWidth
                            onClick={handleNext}
                            variant="contained"
                            sx={{
                                mt: 1,
                                borderRadius: "10px",
                                height: 44,
                                textTransform: "none",
                                fontWeight: 800,
                                backgroundColor: primaryColor,
                                "&:hover": { backgroundColor: primaryColor, opacity: 0.9 },
                            }}
                        >
                            Next
                        </Button>
                    </>
                ) : (
                    <>
                        <FieldBlock>
                            <Typography sx={{ fontWeight: 900, color: "#0F172A", fontSize: 16, mb: 0.5 }}>
                                Working Days
                            </Typography>
                            <Typography sx={{ color: "#64748B", fontSize: 12, mb: 1.2 }}>
                                Select the first and last days of the center&apos;s work week
                            </Typography>

                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "repeat(4, 1fr)", sm: "repeat(7, 1fr)" },
                                    gap: 0.8,
                                }}
                            >
                                {DAYS.map((d) => {
                                    const startIdx = DAYS.indexOf(form.workStartDay);
                                    const endIdx = DAYS.indexOf(form.workEndDay);
                                    const dIdx = DAYS.indexOf(d);

                                    const hasRange = startIdx !== -1 && endIdx !== -1;
                                    const inRange =
                                        hasRange && dIdx >= Math.min(startIdx, endIdx) && dIdx <= Math.max(startIdx, endIdx);

                                    const isStart = d === form.workStartDay;
                                    const isEnd = d === form.workEndDay;

                                    return (
                                        <Button
                                            key={d}
                                            onClick={() => {
                                                if (dayPickPhase === "start") {
                                                    setField("workStartDay", d);
                                                    setField("workEndDay", d);
                                                    setDayPickPhase("end");
                                                    return;
                                                }

                                                const sIdx = DAYS.indexOf(form.workStartDay);
                                                const eIdx = DAYS.indexOf(d);

                                                if (eIdx < sIdx) {
                                                    setField("workStartDay", d);
                                                    setField("workEndDay", form.workStartDay);
                                                } else {
                                                    setField("workEndDay", d);
                                                }

                                                setDayPickPhase("start");
                                            }}
                                            sx={{
                                                borderRadius: "8px",
                                                minWidth: 0,
                                                py: 1,
                                                fontWeight: 900,
                                                fontSize: 11,
                                                border: `1px solid ${isStart || isEnd ? primaryColor : "#E5E7EB"}`,
                                                backgroundColor: isStart || isEnd ? "#EAF2FF" : inRange ? "#F3F8FF" : "#fff",
                                                color: "#0F172A",
                                            }}
                                        >
                                            {d}
                                        </Button>
                                    );
                                })}
                            </Box>
                        </FieldBlock>

                        <FieldBlock>
                            <Typography sx={{ fontWeight: 900, color: "#0F172A", fontSize: 16, mb: 0.8 }}>
                                Working Hours
                            </Typography>

                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                    gap: 2,
                                }}
                            >
                                <Box>
                                    <FieldLabel label="FROM" />
                                    <TextField
                                        fullWidth
                                        type="time"
                                        value={form.workFrom}
                                        onChange={(e) => setField("workFrom", e.target.value)}
                                        error={!!errors.workFrom}
                                        helperText={errors.workFrom || " "}
                                        sx={inputSx}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Box>

                                <Box>
                                    <FieldLabel label="TO" />
                                    <TextField
                                        fullWidth
                                        type="time"
                                        value={form.workTo}
                                        onChange={(e) => setField("workTo", e.target.value)}
                                        error={!!errors.workTo}
                                        helperText={errors.workTo || " "}
                                        sx={inputSx}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Box>
                            </Box>
                        </FieldBlock>

                        <FieldBlock>
                            <Typography sx={{ fontWeight: 900, color: "#0F172A", fontSize: 16, mb: 0.8 }}>
                                Additional Information
                            </Typography>

                            <FieldLabel label="Notes" />
                            <TextField
                                fullWidth
                                multiline
                                minRows={4}
                                placeholder="Add any additional information here..."
                                value={form.notes}
                                onChange={(e) => setField("notes", e.target.value)}
                                sx={inputSx}
                            />
                        </FieldBlock>

                        <Box sx={{ display: "flex", gap: 2, mt: 1, flexDirection: { xs: "column", sm: "row" } }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => setStep(1)}
                                sx={{
                                    borderRadius: "10px",
                                    height: 44,
                                    textTransform: "none",
                                    fontWeight: 900,
                                    borderColor: "#BFD7FF",
                                    color: primaryColor,
                                    backgroundColor: "#fff",
                                    "&:hover": { borderColor: "#BFD7FF", backgroundColor: "#F8FBFF" },
                                }}
                            >
                                Back
                            </Button>

                            <Button
                                fullWidth
                                variant="contained"
                                disabled={saving}
                                onClick={handleSave}
                                sx={{
                                    borderRadius: "10px",
                                    height: 44,
                                    textTransform: "none",
                                    fontWeight: 900,
                                    backgroundColor: primaryColor,
                                    "&:hover": { backgroundColor: primaryColor, opacity: 0.9 },
                                }}
                            >
                                {saving ? "Saving..." : "Save Center"}
                            </Button>
                        </Box>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

function FieldBlock({ children }: { children: React.ReactNode }) {
    return <Box sx={{ mb: 2.4 }}>{children}</Box>;
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
    return (
        <Typography sx={{ fontSize: 13, color: "#64748B", fontWeight: 600, mb: 0.8 }}>
            {label} {required ? <span style={{ color: "#EF4444" }}>*</span> : null}
        </Typography>
    );
}

const inputSx = {
    backgroundColor: "#fff",
    "& .MuiOutlinedInput-root": {
        borderRadius: "10px",
        minHeight: 48,
    },
};

const selectSx = {
    borderRadius: "10px",
    backgroundColor: "#fff",
    minHeight: 48,
    "& .MuiSelect-select": { display: "flex", alignItems: "center", gap: 8 },
};
