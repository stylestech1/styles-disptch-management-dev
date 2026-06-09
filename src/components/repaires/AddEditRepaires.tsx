/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useGetAllTrucksQuery } from "@/redux/slices/apiSlice";
import { RootState, useAppSelector } from "@/redux/store";
import {
    Box,
    Button,
    Collapse,
    Dialog,
    IconButton,
    MenuItem,
    TextField,
    Typography,
} from "@mui/material";
import {
    ChevronDown,
    ChevronUp,
    ExternalLink,
    FileText,
    ImageIcon,
    Upload,
    X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import LocationAutocomplete, { TPlace } from "../sections/LocationAutocomplete";

type TruckOption = {
    _id?: string;
    id?: string;
    truckId?: number;
    truckNumber?: string;
    model?: string;
    type?: string;
};

export type ExistingRepairFile = {
    viewLink?: string;
    downloadLink?: string;
    uploadedAt?: string;
    fileName?: string;
};

export type RepairFormData = {
    truckId: string;
    truck?: TruckOption;
    title: string;
    description: string;
    status: "pending" | "in_progress" | "completed";
    cost: string;
    repairDate: string;
    note: string;
    repairLocation: {
        type: "on_road" | "repair_shop";
        location: string;
        phoneNumber: string;
        shopName: string;
    };
    uploadedReceipts?: File[];
    additionalPhotos?: File[];
    existingReceipts?: ExistingRepairFile[];
    existingPhotos?: ExistingRepairFile[];
};

type Props = {
    open: boolean;
    onClose: () => void;
    formData?: Partial<RepairFormData>;
    onSubmit: (data: RepairFormData) => void | Promise<void>;
    editMode?: boolean;
    isLoading?: boolean;
};

const getLocationText = (place: TPlace | null) => {
    if (!place) return "";
    if (typeof place === "string") return place;

    return (
        place.display_name ||
        (place as any).description ||
        (place as any).formatted_address ||
        (place as any).name ||
        ""
    );
};

export const CreateEditRepaires = ({
    open,
    onClose,
    formData,
    onSubmit,
    editMode,
    isLoading,
}: Props) => {
    const theme = useAppSelector((state: RootState) => state.palette);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [receipts, setReceipts] = useState<File[]>([]);
    const [photos, setPhotos] = useState<File[]>([]);
    const [existingReceipts, setExistingReceipts] = useState<ExistingRepairFile[]>([]);
    const [existingPhotos, setExistingPhotos] = useState<ExistingRepairFile[]>([]);
    const [filesOpen, setFilesOpen] = useState(true);
    const [repairPlace, setRepairPlace] = useState<TPlace | null>(null);

    const { data: trucksData } = useGetAllTrucksQuery({});
    const trucks: TruckOption[] = trucksData?.data || [];
    const handleCloseModal = () => {
        reset({
            truckId: "",
            title: "",
            description: "",
            status: "pending",
            cost: "",
            repairDate: "",
            note: "",
            repairLocation: {
                type: "repair_shop",
                location: "",
                phoneNumber: "",
                shopName: "",
            },
            uploadedReceipts: [],
            additionalPhotos: [],
        });

        setReceipts([]);
        setPhotos([]);
        setExistingReceipts([]);
        setExistingPhotos([]);
        setRepairPlace(null);
        setFilesOpen(true);

        onClose();
    };

    const { control, handleSubmit, reset, setValue, watch } =
        useForm<RepairFormData>({
            defaultValues: {
                truckId: "",
                title: "",
                description: "",
                status: "pending",
                cost: "",
                repairDate: "",
                note: "",
                repairLocation: {
                    type: "repair_shop",
                    location: "",
                    phoneNumber: "",
                    shopName: "",
                },
                uploadedReceipts: [],
                additionalPhotos: [],
            },
        });

    const repairType = watch("repairLocation.type");
    const selectedTruckId = watch("truckId");

    const selectedTruck = useMemo(() => {
        if (!editMode && !selectedTruckId) return null;

        return (
            trucks.find((truck) => {
                const value = truck.id || truck._id || String(truck.truckId);
                return String(value) === String(selectedTruckId);
            }) ||
            (editMode ? formData?.truck : null) ||
            null
        );
    }, [trucks, selectedTruckId, formData?.truck, editMode]);

    useEffect(() => {
        if (!open) return;

        // CREATE MODE => clear everything
        if (!editMode) {
            reset({
                truckId: "",
                truck: undefined,
                title: "",
                description: "",
                status: "pending",
                cost: "",
                repairDate: "",
                note: "",
                repairLocation: {
                    type: "repair_shop",
                    location: "",
                    phoneNumber: "",
                    shopName: "",
                },
                uploadedReceipts: [],
                additionalPhotos: [],
                existingReceipts: [],
                existingPhotos: [],
            });

            setReceipts([]);
            setPhotos([]);
            setExistingReceipts([]);
            setExistingPhotos([]);
            setRepairPlace(null);
            setFilesOpen(true);
            return;
        }

        // EDIT MODE => fill data
        const locationString = formData?.repairLocation?.location || "";

        reset({
            truckId:
                formData?.truck?.id ||
                formData?.truck?._id ||
                String(formData?.truck?.truckId || formData?.truckId || ""),
            truck: formData?.truck,
            title: formData?.title || "",
            description: formData?.description || "",
            status: formData?.status || "pending",
            cost: formData?.cost || "",
            repairDate: formData?.repairDate ? formData.repairDate.slice(0, 10) : "",
            note: formData?.note || "",
            repairLocation: {
                type: formData?.repairLocation?.type || "repair_shop",
                location: locationString,
                phoneNumber: formData?.repairLocation?.phoneNumber || "",
                shopName: formData?.repairLocation?.shopName || "",
            },
            uploadedReceipts: [],
            additionalPhotos: [],
        });

        setRepairPlace(
            locationString
                ? ({
                    display_name: locationString,
                    description: locationString,
                    formatted_address: locationString,
                    name: locationString,
                } as any)
                : null
        );

        setReceipts([]);
        setPhotos([]);
        setExistingReceipts(formData?.existingReceipts || []);
        setExistingPhotos(formData?.existingPhotos || []);
    }, [open, editMode, formData, reset]);

    const fieldSx = {
        "& .MuiOutlinedInput-root": {
            minHeight: 56,
            borderRadius: "12px",
            backgroundColor: "#fff",
            alignItems: "center",
        },
        "& .MuiInputBase-input": {
            py: "14px",
        },
        "& .MuiInputLabel-root": {
            backgroundColor: "#fff",
            px: 0.6,
            color: "#4b5563",
        },
        "& .MuiFormLabel-asterisk": {
            color: "red",
        },
    };

    const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        const pdfFiles = files.filter((file) => file.type === "application/pdf");
        const imageFiles = files.filter((file) => file.type.startsWith("image/"));

        const invalidFiles = files.filter(
            (file) =>
                file.type !== "application/pdf" && !file.type.startsWith("image/")
        );

        if (invalidFiles.length > 0) {
            toast.error("Only images and PDF files are allowed");
        }

        const nextReceipts = [...receipts, ...pdfFiles];
        const nextPhotos = [...photos, ...imageFiles];

        setReceipts(nextReceipts);
        setPhotos(nextPhotos);

        setValue("uploadedReceipts", nextReceipts);
        setValue("additionalPhotos", nextPhotos);

        e.target.value = "";
    };

    const submitForm = (data: RepairFormData) => {
        const locationText =
            getLocationText(repairPlace) ||
            String(data.repairLocation.location || "");

        onSubmit({
            ...data,
            repairLocation: {
                ...data.repairLocation,
                location: locationText,
            },
            uploadedReceipts: receipts,
            additionalPhotos: photos,
            existingReceipts,
            existingPhotos,
        });
    };

    return (
        <Dialog
            open={open}
            onClose={handleCloseModal}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    maxHeight: "92vh",
                },
            }}
        >
            <Box
                component="form"
                onSubmit={handleSubmit(submitForm)}
                sx={{
                    p: { xs: 2, md: 3 },
                    bgcolor: "#fff",
                    maxHeight: "92vh",
                    overflowY: "auto",
                }}
            >
                <Box className="flex justify-between items-center mb-4">
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 800,
                            color: theme.currentPalette.primary,
                        }}
                    >
                        {editMode ? "Edit Repair" : "Add Repair"}
                    </Typography>

                    <IconButton onClick={handleCloseModal}>
                        <X color="red" size={20} />
                    </IconButton>
                </Box>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                        columnGap: 3,
                        rowGap: 4,
                        alignItems: "start",
                    }}
                >
                    <Controller
                        name="truckId"
                        control={control}
                        rules={{ required: "Truck is required" }}
                        render={({ field, fieldState }) => {
                            const editTruck = editMode ? formData?.truck : undefined;

                            const fieldValue =
                                field.value ||
                                editTruck?.id ||
                                editTruck?._id ||
                                String(editTruck?.truckId || "");

                            const currentTruck =
                                trucks.find((truck) => {
                                    const value = truck.id || truck._id || String(truck.truckId);
                                    return String(value) === String(fieldValue);
                                }) || editTruck;

                            return (
                                <TextField
                                    {...field}
                                    value={fieldValue}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    select
                                    label="Truck"
                                    required
                                    fullWidth
                                    error={!!fieldState.error}
                                    helperText={fieldState.error?.message}
                                    InputLabelProps={{ shrink: true }}
                                    sx={fieldSx}
                                    SelectProps={{
                                        displayEmpty: true,
                                        renderValue: () => (
                                            <span className="font-semibold">
                                                {selectedTruck?.truckNumber || "Select Truck"}
                                            </span>
                                        ),
                                    }}
                                >
                                    {editTruck?.id && (
                                        <MenuItem value={editTruck.id}>
                                            {editTruck.truckNumber}
                                        </MenuItem>
                                    )}

                                    {trucks.map((truck) => {
                                        const value = truck.id || truck._id || String(truck.truckId);

                                        return (
                                            <MenuItem key={value} value={value}>
                                                {truck.truckNumber}
                                            </MenuItem>
                                        );
                                    })}
                                </TextField>
                            );
                        }}
                    />

                    <Controller
                        name="title"
                        control={control}
                        rules={{ required: "Title is required" }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                label="Title"
                                required
                                fullWidth
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        )}
                    />

                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                select
                                label="Status"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            >
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="in_progress">In Progress</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                            </TextField>
                        )}
                    />

                    <Controller
                        name="repairLocation.type"
                        control={control}
                        rules={{ required: "Repair type is required" }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                select
                                label="Repair Type"
                                required
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            >
                                <MenuItem value="on_road">On Road</MenuItem>
                                <MenuItem value="repair_shop">Repair Shop</MenuItem>
                            </TextField>
                        )}
                    />

                    <Controller
                        name="cost"
                        control={control}
                        rules={{ required: "Cost is required" }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                type="number"
                                label="Cost"
                                required
                                fullWidth
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        )}
                    />

                    <Controller
                        name="repairDate"
                        control={control}
                        rules={{ required: "Repair date is required" }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                type="date"
                                label="Repair Date"
                                required
                                fullWidth
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        )}
                    />

                    <Controller
                        name="repairLocation.location"
                        control={control}
                        rules={{ required: "Location is required" }}
                        render={({ fieldState }) => (
                            <Box>
                                <LocationAutocomplete
                                    key={formData?.repairLocation?.location || "empty-location"}
                                    label={
                                        repairType === "on_road"
                                            ? "On Road Location"
                                            : "Repair Shop Location"
                                    }
                                    value={repairPlace}
                                    required
                                    setValue={(place: TPlace | null) => {
                                        setRepairPlace(place);

                                        const locationText = getLocationText(place);

                                        setValue("repairLocation.location", locationText, {
                                            shouldValidate: true,
                                            shouldDirty: true,
                                        });
                                    }}
                                    placeholder={formData?.repairLocation?.location || "Enter repair location"}
                                    showZipCode
                                />

                                {fieldState.error && (
                                    <Typography sx={{ color: "error.main", fontSize: 12, mt: 0.5, ml: 1 }}>
                                        {fieldState.error.message}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    />

                    <Controller
                        name="repairLocation.phoneNumber"
                        control={control}
                        rules={{ required: "Phone number is required" }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                label="Phone Number"
                                required
                                fullWidth
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        )}
                    />

                    {repairType === "repair_shop" && (
                        <Controller
                            name="repairLocation.shopName"
                            control={control}
                            rules={{ required: "Shop name is required" }}
                            render={({ field, fieldState }) => (
                                <TextField
                                    {...field}
                                    label="Shop Name"
                                    required
                                    fullWidth
                                    error={!!fieldState.error}
                                    helperText={fieldState.error?.message}
                                    InputLabelProps={{ shrink: true }}
                                    sx={fieldSx}
                                />
                            )}
                        />
                    )}
                </Box>

                <Box sx={{ mt: 4 }}>
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Description"
                                fullWidth
                                multiline
                                rows={3}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        )}
                    />
                </Box>

                <Box sx={{ mt: 3 }}>
                    <Controller
                        name="note"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Note"
                                fullWidth
                                multiline
                                rows={2}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        )}
                    />
                </Box>

                <Box
                    sx={{
                        border: `1px solid ${theme.currentPalette.primary}`,
                        borderRadius: 2,
                        p: 2,
                        mt: 3,
                        bgcolor: "#fff",
                    }}
                >
                    <Box className="flex items-center justify-between gap-3 flex-wrap">
                        <Box>
                            <Typography sx={{ color: theme.currentPalette.primary, fontWeight: 800 }}>
                                Repair Files
                            </Typography>
                            <Typography sx={{ color: "#666", fontSize: 14 }}>
                                Upload PDF documents and photos from one button
                            </Typography>
                        </Box>

                        <Box className="flex items-center gap-2">
                            <input
                                ref={fileInputRef}
                                hidden
                                type="file"
                                multiple
                                accept="image/*,application/pdf"
                                onChange={handleSelectFiles}
                            />

                            <Button
                                variant="contained"
                                startIcon={<Upload size={17} />}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Upload Files
                            </Button>

                            <IconButton onClick={() => setFilesOpen((prev) => !prev)}>
                                {filesOpen ? <ChevronUp /> : <ChevronDown />}
                            </IconButton>
                        </Box>
                    </Box>

                    <Collapse in={filesOpen}>
                        <Box sx={{ mt: 2 }}>
                            <Typography sx={{ fontWeight: 700, mb: 1 }}>
                                Documents ({existingReceipts.length + receipts.length})
                            </Typography>

                            {existingReceipts.map((file, index) => (
                                <ExistingFileRow
                                    key={`receipt-${index}`}
                                    file={file}
                                    label={`Document ${index + 1}`}
                                    icon="document"
                                />
                            ))}

                            {receipts.map((file, index) => (
                                <NewFileRow
                                    key={`${file.name}-${index}`}
                                    file={file}
                                    onRemove={() => {
                                        const next = receipts.filter((_, i) => i !== index);
                                        setReceipts(next);
                                        setValue("uploadedReceipts", next);
                                    }}
                                />
                            ))}

                            {existingReceipts.length === 0 && receipts.length === 0 && (
                                <Typography sx={{ color: "#777", fontSize: 14 }}>
                                    No documents selected
                                </Typography>
                            )}

                            <Typography sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
                                Photos ({existingPhotos.length + photos.length})
                            </Typography>

                            {existingPhotos.map((file, index) => (
                                <ExistingFileRow
                                    key={`photo-${index}`}
                                    file={file}
                                    label={`Photo ${index + 1}`}
                                    icon="photo"
                                />
                            ))}

                            {photos.map((file, index) => (
                                <NewFileRow
                                    key={`${file.name}-${index}`}
                                    file={file}
                                    onRemove={() => {
                                        const next = photos.filter((_, i) => i !== index);
                                        setPhotos(next);
                                        setValue("additionalPhotos", next);
                                    }}
                                />
                            ))}

                            {existingPhotos.length === 0 && photos.length === 0 && (
                                <Typography sx={{ color: "#777", fontSize: 14 }}>
                                    No photos selected
                                </Typography>
                            )}
                        </Box>
                    </Collapse>
                </Box>

                <Box className="flex justify-end gap-3 mt-6">
                    {/* <Button onClick={handleCloseModal} variant="outlined">
                        Cancel
                    </Button> */}

                    <Button type="submit" variant="contained" disabled={isLoading}>
                        {isLoading ? "Saving..." : editMode ? "Update Repair" : "Add Repair"}
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
};

const ExistingFileRow = ({
    file,
    label,
    icon,
}: {
    file: ExistingRepairFile;
    label: string;
    icon: "document" | "photo";
}) => {
    const link = file.viewLink || file.downloadLink;

    return (
        <Box className="flex items-center justify-between gap-2 border rounded-lg p-2 mb-2">
            <Box className="flex items-center gap-2 min-w-0">
                {icon === "photo" ? <ImageIcon size={18} /> : <FileText size={18} />}
                <Typography sx={{ fontSize: 13, wordBreak: "break-word" }}>
                    {file.fileName || label}
                </Typography>
            </Box>

            {link && (
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ExternalLink size={15} />}
                    onClick={() => window.open(link, "_blank", "noopener,noreferrer")}
                >
                    View
                </Button>
            )}
        </Box>
    );
};

const NewFileRow = ({
    file,
    onRemove,
}: {
    file: File;
    onRemove: () => void;
}) => (
    <Box className="flex items-center justify-between gap-2 border rounded-lg p-2 mb-2">
        <Box className="flex items-center gap-2 min-w-0">
            <FileText size={18} />
            <Typography sx={{ fontSize: 13, wordBreak: "break-word" }}>
                {file.name}
            </Typography>
        </Box>

        <IconButton size="small" onClick={onRemove}>
            <X size={16} color="red" />
        </IconButton>
    </Box>
);