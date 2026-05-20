// DriverHirringForm.tsx

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
    name: string;
    state: string;
    phone: string;
    experienceYears: string;
    readyDate: string;
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
            name: "",
            state: "",
            phone: "",
            experienceYears: "",
            readyDate: "",
            notes: "",
            violations: "",
            status: "pending",
        },
    });

    useEffect(() => {
        if (open) {
            reset({
                name: formData.name || "",
                state: formData.state || "",
                phone: formData.phone || "",
                experienceYears: String(formData.experienceYears || ""),
                readyDate: formData.readyDate
                    ? String(formData.readyDate).split("T")[0]
                    : "",
                notes: formData.notes || "",
                violations: formData.violations || "",
                status: formData.status || "pending",
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
                    {/* Driver Name */}
                    <Controller
                        name="name"
                        control={control}
                        rules={{ required: "Driver name is required" }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                fullWidth
                                required
                                label="Driver Name"
                                placeholder="Enter driver name"
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

                    {/* Status */}
                    <Controller
                        name="status"
                        control={control}
                        rules={{ required: "Status is required" }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                select
                                fullWidth
                                required
                                label="Status"
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            >
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="accepted">Accepted</MenuItem>
                                <MenuItem value="rejected">Rejected</MenuItem>
                            </TextField>
                        )}
                    />

                    {/* Violations */}
                    <Controller
                        name="violations"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                label="Violations"
                                placeholder="Enter violations"
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
                                    },
                                }}
                            />
                        )}
                    />
                </Box>
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