
"use client";

import { tDriverHiring } from "@/types/globalTypes";
import { RootState, useAppSelector } from "@/redux/store";
import {
    Box,
    Button,
    Dialog,
    TextField,
    Typography,
    MenuItem,
    IconButton,
    Collapse,
    alpha,
    darken
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Upload, ChevronDown, ChevronUp, FileText, X } from "lucide-react";
import toast from "react-hot-toast";

type DriverHiringFormData = {
    firstName: string;
    lastName: string;
    email: string;
    state: string;
    phone: string;
    experienceYears: string;
    readyDate: string;
    reminder: {
        date: string;
        time: string;
        reason: string;
        isDone: boolean;
    };
    notes: string;
    violations: string;
    status: string;
    documents?: FileList | File[] | null;
};

export const DriverHirringForm = ({
    open,
    onClose,
    formData,
    onSubmit,
    editMode,
    isLoading,
}: {
    open: boolean;
    onClose: () => void;
    formData: Partial<tDriverHiring>;
    onSubmit: (data: DriverHiringFormData) => void | Promise<void>;
    editMode: boolean;
    isLoading: boolean;
}) => {
    const theme = useAppSelector((state: RootState) => state.palette);
    const fieldSx = {
        "& .MuiOutlinedInput-root": {
            minHeight: 52,
            borderRadius: 2,
            backgroundColor: "#fff",

        },
        "& .MuiInputLabel-root": {
            color: "#666",
            backgroundColor: "#fff",
            px: 0.5,
        },
        "& .MuiInputLabel-asterisk": {
            color: "red",
        },
        "& .MuiInputBase-input": {
            px: 1,
            py: 1,
            color: "#111",
        },
        "& .MuiInputBase-input::placeholder": {
            color: "#9ca3af",
            opacity: 1,
        },
    };
    const {
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
    } = useForm<DriverHiringFormData>({
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            state: "",
            phone: "",
            experienceYears: "",
            readyDate: "",
            reminder: {
                date: "",
                time: "",
                reason: "",
                isDone: false,
            },
            notes: "",
            violations: "",
            status: "New",
            
        }
    });

    const reminderDateValue = watch("reminder.date");
    const reminderTimeValue = watch("reminder.time");
    const reminderReasonValue = watch("reminder.reason");

    useEffect(() => {
        if (open) {
            reset({
                firstName: formData.firstName || "",
                lastName: formData.lastName || "",
                email: formData.email || "",
                state: formData.state || "",
                phone: formData.phone || "",
                experienceYears: String(formData.experienceYears || ""),
                readyDate: formData.readyDate
                    ? String(formData.readyDate).split("T")[0]
                    : "",
                reminder: {
                    date: formData.reminder?.date || formData.reminderDate || "",
                    time: formData.reminder?.time || formData.reminderTime || "",
                    reason: formData.reminder?.reason || formData.reminderReason || "",
                    isDone: Boolean(formData.reminder?.isDone ?? formData.isDone ?? false),
                },
                notes: formData.notes || "",
                violations: formData.violations || "",
                status: formData.status || "New",
            });
        }
    }, [open, formData, reset]);

    const submitForm = (data: DriverHiringFormData) => {
        onSubmit(data);
    };
    const [documents, setDocuments] = useState<File[]>([]);
    const [documentsOpen, setDocumentsOpen] = useState(editMode);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        const pdfFiles = files.filter(
            (file) =>
                file.type === "application/pdf" ||
                file.name.toLowerCase().endsWith(".pdf")
        );

        if (pdfFiles.length !== files.length) {
            toast.error("Only PDF files are allowed");
        }

        const newDocuments = [...documents, ...pdfFiles];

        setDocuments(newDocuments);
        setValue("documents", newDocuments, {
            shouldDirty: true,
            shouldValidate: true,
        });

        e.target.value = "";
    };
    const removeDocument = (index: number) => {
        const newDocuments = documents.filter((_, i) => i !== index);

        setDocuments(newDocuments);
        setValue("documents", newDocuments, {
            shouldDirty: true,
            shouldValidate: true,
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <Box
                component="form"
                onSubmit={handleSubmit((data) => submitForm(data as DriverHiringFormData))}
                sx={{
                    p: 3,
                    bgcolor: theme.currentPalette.background,
                    borderRadius: 2,
                }}
            >
                <div className="flex justify-between items-center mb-4">
                    <Typography
                        variant="h6"
                        sx={{
                            mb: 3,
                            fontWeight: 700,
                            color: theme.currentPalette.primary,
                        }}
                    >
                        {editMode ? "Edit Hiring Driver" : "Add Hiring Driver"}
                    </Typography>
                    <IconButton onClick={onClose}>
                        <X color="red" size={20} />
                    </IconButton>
                </div>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                        gap: 3,
                        mt: 2,
                    }}
                >
                    {/* First Name */}
                    <Controller
                        name="firstName"
                        control={control}
                        rules={{ required: "First name is required" }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                fullWidth
                                required
                                label="First Name"
                                placeholder="Enter first name"
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        )}
                    />
                    {/* Last Name */}
                    <Controller
                        name="lastName"
                        control={control}
                        rules={{ required: "Last name is required" }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                fullWidth
                                required
                                label="Last Name"
                                placeholder="Enter last name"
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        )}
                    />
                    {/* email */}
                    <Controller
                        name="email"
                        control={control}
                        rules={{ required: "Email is required" }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                fullWidth
                                required
                                label="Email"
                                placeholder="Enter email"
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        )}
                    />

                    {/* State */}
                    <Controller
                        name="state"
                        control={control}
                        rules={{ required: "State is required" }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                value={field.value || ""}
                                fullWidth
                                required
                                label="State"
                                placeholder="Enter state"
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        )}
                    />

                    {/* Phone */}
                    <Controller
                        name="phone"
                        control={control}
                        rules={{ required: "Phone number is required" }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                fullWidth
                                required
                                label="Phone Number"
                                placeholder="Enter phone number"
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        )}
                    />

                    {/* Experience */}
                    <Controller
                        name="experienceYears"
                        control={control}
                        rules={{ required: "Years of experience is required" }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                fullWidth
                                required

                                label="Years of Experience"
                                placeholder="Enter years of experience"
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        )}
                    />

                    {/* Ready Date */}
                    <Controller
                        name="readyDate"
                        control={control}
                        rules={{ required: "Ready date is required" }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                value={field.value || ""}
                                fullWidth
                                required
                                type="date"
                                label="Ready Date"
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        )}
                    />

                    {/* Reminder Date */}
                    <Controller
                        name="reminder.date"
                        control={control}
                        rules={{
                            validate: (value) => {
                                if (!value) return true;
                                if (!reminderTimeValue?.trim()) {
                                    return "Reminder time is required when reminder date is set";
                                }
                                if (!reminderReasonValue?.trim()) {
                                    return "Reminder reason is required when reminder date is set";
                                }
                                return true;
                            },
                        }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                value={field.value || ""}
                                fullWidth
                                type="date"
                                label="Reminder Date"
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        )}
                    />

                    {/* Reminder Time */}
                    <Controller
                        name="reminder.time"
                        control={control}
                        rules={{
                            validate: (value) => {
                                if (!reminderDateValue) return true;
                                if (!value?.trim()) {
                                    return "Reminder time is required when reminder date is set";
                                }
                                return true;
                            },
                        }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                value={field.value || ""}
                                fullWidth
                                type="time"
                                label="Reminder Time"
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        )}
                    />

                    {/* Reminder Reason */}
                    <Controller
                        name="reminder.reason"
                        control={control}
                        rules={{
                            validate: (value) => {
                                if (!reminderDateValue) return true;
                                if (!value?.trim()) {
                                    return "Reminder reason is required when reminder date is set";
                                }
                                return true;
                            },
                        }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                value={field.value || ""}
                                fullWidth
                                label="Reminder Reason"
                                placeholder="Enter the reason"
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        )}
                    />

                    {/* Status */}
                    <Controller
                        name="status"
                        control={control}
                        defaultValue="New"
                        rules={{ required: "Status is required" }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                value={field.value || "New"}
                                select
                                fullWidth
                                required
                                label="Status"
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            >
                                <MenuItem value="New">New</MenuItem>
                                <MenuItem value="Pending">Pending</MenuItem>
                                <MenuItem value="Qualified">Qualified</MenuItem>
                                <MenuItem value="Disqualified">Disqualified</MenuItem>
                                <MenuItem value="Rejected">Rejected</MenuItem>
                            </TextField>
                        )}
                    />
                </Box>
                {/* Violations */}
                <Controller
                    name="violations"
                    control={control}
                    rules={{ required: "Violations is required" }}
                    render={({ field, fieldState }) => (
                        <TextField
                            {...field}
                            required
                            fullWidth
                            label="Violations"
                            placeholder="Enter violations"
                            multiline
                            rows={3}
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                ...fieldSx,
                                mt: 2,
                                "& .MuiOutlinedInput-root": {
                                    minHeight: 110,
                                    borderRadius: "6px",
                                    alignItems: "flex-start",
                                    backgroundColor: "#fff",
                                    mb: 2,
                                },
                            }}
                        />
                    )}
                />
                {/* Notes */}
                <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            fullWidth
                            label="Notes"
                            placeholder="Enter notes"
                            multiline
                            rows={3}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                ...fieldSx,
                                "& .MuiOutlinedInput-root": {
                                    minHeight: 110,
                                    borderRadius: "6px",
                                    alignItems: "flex-start",
                                    backgroundColor: "#fff",
                                    mb: 2,
                                },
                            }}
                        />
                    )}
                />
                {/* attachments */}
                <Box
                    sx={{
                        gridColumn: "1 / -1",
                        border: `1px solid ${alpha(theme.currentPalette.primary, 0.3)}`,
                        borderRadius: 2,
                        p: 2,
                        mt: 1,
                        bgcolor: "#fff",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                            flexWrap: "wrap",
                        }}
                    >
                        <Box>
                            <Typography
                                sx={{
                                    color: theme.currentPalette.primary,
                                    fontWeight: 700,
                                    fontSize: "18px",
                                }}
                            >
                                Driver Attachments
                            </Typography>

                            <Typography
                                sx={{
                                    color: "#666",
                                    fontSize: "14px",
                                }}
                            >
                                Upload PDF documents of drivers
                            </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="application/pdf,.pdf"
                                multiple
                                hidden
                                onChange={handleSelectFiles}
                            />

                            <Button
                                variant="contained"
                                startIcon={<Upload size={18} />}
                                onClick={() => fileInputRef.current?.click()}
                                sx={{
                                    px: 3,
                                    py: 1.2,
                                    borderRadius: 2,
                                    fontWeight: 700,
                                    textTransform: "capitalize",
                                    bgcolor: theme.currentPalette.primary,
                                    color: theme.currentPalette.background,
                                    "&:hover": {
                                        bgcolor: darken(theme.currentPalette.primary, 0.1),
                                    },
                                }}
                            >
                                Add Document
                            </Button>

                            {editMode && (
                                <IconButton
                                    onClick={() => setDocumentsOpen((prev) => !prev)}
                                    sx={{
                                        color: theme.currentPalette.primary,
                                    }}
                                >
                                    {documentsOpen ? <ChevronUp /> : <ChevronDown />}
                                </IconButton>
                            )}
                        </Box>
                    </Box>

                    <Collapse in={!editMode || documentsOpen}>
                        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                            {documents.length === 0 ? (
                                <Typography sx={{ color: "#777", fontSize: "14px" }}>
                                    No documents selected
                                </Typography>
                            ) : (
                                documents.map((file, index) => (
                                    <Box
                                        key={`${file.name}-${index}`}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 2,
                                            border: `1px solid ${alpha(theme.currentPalette.primary, 0.2)}`,
                                            borderRadius: 2,
                                            px: 2,
                                            py: 1.2,
                                            bgcolor: alpha(theme.currentPalette.primary, 0.04),
                                        }}
                                    >
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <FileText size={18} color={theme.currentPalette.primary} />

                                            <Typography
                                                sx={{
                                                    color: theme.currentPalette.primary,
                                                    fontWeight: 500,
                                                    wordBreak: "break-word",
                                                }}
                                            >
                                                {file.name}
                                            </Typography>
                                        </Box>

                                        <IconButton size="small" onClick={() => removeDocument(index)}>
                                            <X size={16} color="red" />
                                        </IconButton>
                                    </Box>
                                ))
                            )}
                        </Box>
                    </Collapse>
                </Box>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 2,
                        mt: 3,
                    }}
                >


                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isLoading}
                        sx={{
                            bgcolor: theme.currentPalette.primary,
                            color: theme.currentPalette.background,
                        }}
                    >
                        {editMode ? "Update" : "Add"}
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
};