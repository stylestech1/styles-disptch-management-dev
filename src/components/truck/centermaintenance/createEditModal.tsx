/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    IconButton,
    TextField,
    Typography,
    InputAdornment,
    MenuItem,
    Select,
    FormControl,
    Autocomplete,
    useMediaQuery,
} from "@mui/material";
import { IoAdd, IoClose } from "react-icons/io5";
import { MdOutlineLocationOn, MdOutlineEmail, MdOutlinePhone } from "react-icons/md";
import { CiCircleCheck, CiEdit } from "react-icons/ci";
import { PiBuildingOfficeLight } from "react-icons/pi";
import LocationAutocomplete, { TPlace } from "@/components/sections/LocationAutocomplete";

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
    startAdornment?: React.ReactNode;
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
    const isXs = useMediaQuery("(max-width:480px)");

    const [step, setStep] = useState<1 | 2>(1);
    const [saving, setSaving] = useState(false);

    const mergedInitial = useMemo(() => {
        return { ...defaultForm, ...(initialValues ?? {}) } as MaintenanceCenterForm;
    }, [initialValues]);

    const [form, setForm] = useState<MaintenanceCenterForm>(mergedInitial);
    const [dayPickPhase, setDayPickPhase] = useState<"start" | "end">("start");

    useEffect(() => {
        if (!open) return;
        setStep(1);
        setDayPickPhase("start"); 
        setForm({ ...defaultForm, ...(initialValues ?? {}) } as MaintenanceCenterForm);
    }, [open, mode, initialKey]);

    const DAY_LABEL: Record<DayKey, string> = {
        SUN: "Sun",
        MON: "Mon",
        TUE: "Tue",
        WED: "Wed",
        THU: "Thu",
        FRI: "Fri",
        SAT: "Sat",
    };

    const to12h = (hhmm: string) => {
        // expects "HH:mm"
        if (!hhmm) return "";
        const [hStr, mStr] = hhmm.split(":");
        const h = Number(hStr);
        const m = Number(mStr);
        if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;

        const suffix = h >= 12 ? "PM" : "AM";
        const h12 = ((h + 11) % 12) + 1; // 0 -> 12, 13 -> 1
        return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
    };

    const buildAvailability = (form: MaintenanceCenterForm) => {
        const start = DAY_LABEL[form.workStartDay];
        const end = DAY_LABEL[form.workEndDay];

        const from = to12h(form.workFrom);
        const to = to12h(form.workTo);

        if (!from || !to) return "";

        return `${start}-${end}: ${from} - ${to}`;
    };

    const title = mode === "add" ? "Add Maintenance Center" : "Edit Maintenance Center";
    const icon = mode === "add" ? <IoAdd size={16} /> : <CiEdit size={16} />;

    const setField = <K extends keyof MaintenanceCenterForm>(key: K, value: MaintenanceCenterForm[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };
    const hasLocation =
        !!form.location?.display_name?.trim() || !!form.location?.place_id;

    const canGoNext =
        form.name.trim().length > 0 &&
        hasLocation &&
        form.phone.trim().length > 0;

    // useEffect(() => {
    //     console.log("form.name:", form.name);
    //     console.log("form.phone:", form.phone);
    //     console.log("form.location:", form.location);
    //     console.log("hasLocation:", hasLocation, "canGoNext:", canGoNext);
    // }, [form, hasLocation, canGoNext]);

    const handleNext = () => {
        if (!canGoNext) return;
        setStep(2);
    };

    const handleSave = async () => {
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

            <Box sx={{ px: 2, pt: 2, backgroundColor: "#fff", flex: "0 0 auto" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "grid", gap: 0.4 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box
                                sx={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: "999px",
                                    display: "grid",
                                    placeItems: "center",
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: step === 1 ? "#fff" : primaryColor,
                                    backgroundColor: step === 1 ? primaryColor : "#EAF2FF",
                                    border: `1px solid ${step === 1 ? primaryColor : "#D6E6FF"}`,
                                }}
                            >
                                1
                            </Box>
                            <Typography
                                sx={{
                                    fontWeight: 800,
                                    fontSize: 12,
                                    color: step === 1 ? "#0F172A" : "#94A3B8",
                                }}
                            >
                                General Information
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: "grid", gap: 0.4, textAlign: "right" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "flex-end" }}>
                            <Typography
                                sx={{
                                    fontWeight: 800,
                                    fontSize: 12,
                                    color: step === 2 ? "#0F172A" : "#94A3B8",
                                }}
                            >
                                Operational Details
                            </Typography>
                            <Box
                                sx={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: "999px",
                                    display: "grid",
                                    placeItems: "center",
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: step === 2 ? "#fff" : primaryColor,
                                    backgroundColor: step === 2 ? primaryColor : "#EAF2FF",
                                    border: `1px solid ${step === 2 ? primaryColor : "#D6E6FF"}`,
                                }}
                            >
                                2
                            </Box>
                        </Box>
                    </Box>
                </Box>

                <Box
                    sx={{
                        mt: 1.2,
                        mb: 2,
                        position: "relative",
                        height: 6,
                        borderRadius: "999px",
                        backgroundColor: "#EAF2FF",
                    }}
                >
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            width: step === 1 ? "50%" : "100%",
                            borderRadius: "999px",
                            backgroundColor: primaryColor,
                            transition: "width .2s ease",
                        }}
                    />
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
                        <FieldLabel label="Center Name" required />
                        <TextField
                            fullWidth
                            placeholder="e.g. FixIt Auto Center"
                            value={form.name}
                            onChange={(e) => setField("name", e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PiBuildingOfficeLight />
                                    </InputAdornment>
                                ),
                            }}
                            sx={inputSx}
                        />
                        <FieldLabel label="Location" required />
                        <LocationAutocomplete
                            value={form.location}
                            setValue={(place) => setField("location", place)}
                            placeholder="Search for city or street"
                            startAdornment={<MdOutlineLocationOn size={20} color="#2563EB" />}
                        />
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                gap: 1.2,
                            }}
                        >
                            <Box>
                                <FieldLabel label="Phone" required />
                                <TextField
                                    fullWidth
                                    placeholder="e.g. +1 215567890"
                                    value={form.phone}
                                    onChange={(e) => setField("phone", e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <MdOutlinePhone />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={inputSx}
                                />
                            </Box>

                            <Box>
                                <FieldLabel label="Status" />
                                <FormControl fullWidth>
                                    <Select
                                        value={form.status}
                                        onChange={(e) => setField("status", e.target.value as any)}
                                        sx={selectSx}
                                        startAdornment={
                                            <InputAdornment position="start">
                                                <CiCircleCheck />
                                            </InputAdornment>
                                        }
                                    >
                                        <MenuItem value="Active">Active</MenuItem>
                                        <MenuItem value="Inactive">Inactive</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>

                        <FieldLabel label="Email" />
                        <TextField
                            fullWidth
                            placeholder="example@mail.com"
                            value={form.email}
                            onChange={(e) => setField("email", e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <MdOutlineEmail />
                                    </InputAdornment>
                                ),
                            }}
                            sx={inputSx}
                        />

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
                                },
                            }}
                        />

                        <Button
                            fullWidth
                            disabled={!canGoNext}
                            onClick={handleNext}
                            variant="contained"
                            sx={{
                                mt: 2,
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
                                const inRange = hasRange && dIdx >= Math.min(startIdx, endIdx) && dIdx <= Math.max(startIdx, endIdx);

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

                        <Box sx={{ mt: 2 }}>
                            <Typography sx={{ fontWeight: 900, color: "#0F172A", fontSize: 16, mb: 0.5 }}>
                                Working Hours
                            </Typography>

                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                    gap: 1.2,
                                }}
                            >
                                <Box>
                                    <FieldLabel label="FROM" />
                                    <TextField
                                        fullWidth
                                        type="time"
                                        value={form.workFrom}
                                        onChange={(e) => setField("workFrom", e.target.value)}
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
                                        sx={inputSx}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ mt: 2 }}>
                            <Typography sx={{ fontWeight: 900, color: "#0F172A", fontSize: 16, mb: 0.5 }}>
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
                        </Box>

                        <Box sx={{ display: "flex", gap: 1.2, mt: 2, flexDirection: { xs: "column", sm: "row" } }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={onClose}
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
                                CANCEL
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

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
    return (
        <Typography sx={{ fontSize: 11, color: "#64748B", fontWeight: 800, mt: 1.1, mb: 0.6 }}>
            {label} {required ? <span style={{ color: "#EF4444" }}>*</span> : null}
        </Typography>
    );
}

const inputSx = {
    backgroundColor: "#fff",
    "& .MuiOutlinedInput-root": {
        borderRadius: "10px",
    },
};

const selectSx = {
    borderRadius: "10px",
    backgroundColor: "#fff",
    "& .MuiSelect-select": { display: "flex", alignItems: "center", gap: 8 },
};
