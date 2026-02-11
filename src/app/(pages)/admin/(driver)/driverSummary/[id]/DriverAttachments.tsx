/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useRef, useState } from "react";
import {
    alpha,
    Box,
    Button,
    Dialog,
    DialogContent,
    Divider,
    IconButton,
    Typography,
} from "@mui/material";
import { IoClose } from "react-icons/io5";
import { MdOutlineAttachFile, MdError, MdPictureAsPdf } from "react-icons/md";
import { Trash2, Upload } from "lucide-react";
import { RootState, useAppSelector } from "@/redux/store";

type AttachmentItem = {
    id: string;
    name: string;
    size?: number;
    url?: string;
};

type Props = {
    attachments?: AttachmentItem[];
    onUpload?: (files: File[]) => Promise<void> | void;
    onDelete?: (id: string) => Promise<void> | void;
};

export default function DriverAttachments({
    attachments = [],
    onUpload,
    onDelete,
}: Props) {
    const theme = useAppSelector((state: RootState) => state.palette);

    const [open, setOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState<string>("");
    const [selectedDocuments, setSelectedDocuments] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const inputRef = useRef<HTMLInputElement | null>(null);

    const docsCountLabel = useMemo(() => {
        return attachments.map((a, idx) => ({
            ...a,
            displayName: `Document ${idx + 1}`,
        }));
    }, [attachments]);

    const resetDialog = () => {
        setSelectedDocuments([]);
        setUploadError("");
        setIsDragging(false);
    };

    const openDialog = () => {
        setOpen(true);
        resetDialog();
    };

    const closeDialog = () => {
        setOpen(false);
        resetDialog();
    };

    const validateFiles = (files: File[]) => {
        const onlyPdf = files.every(
            (f) =>
                f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
        );
        if (!onlyPdf) return "Only PDF files are allowed";
        return "";
    };
    // const validateFiles = (files: File[]) => {
    //     const allowedTypes = [
    //         "application/pdf",
    //         "image/jpeg",
    //         "image/png",
    //         "image/webp",
    //     ];

    //     const isValid = files.every(
    //         (f) =>
    //             allowedTypes.includes(f.type) ||
    //             /\.(pdf|jpg|jpeg|png|webp)$/i.test(f.name)
    //     );

    //     if (!isValid) {
    //         return "Only PDF or image files (JPG, PNG, WEBP) are allowed";
    //     }

    //     return "";
    // };

    const addFiles = (files: File[]) => {
        const merged = [...selectedDocuments, ...files]; // ✅ no slice, unlimited
        const errorMsg = validateFiles(merged);
        if (errorMsg) {
            setUploadError(errorMsg);
            return;
        }
        setUploadError("");
        setSelectedDocuments(merged);
    };

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        addFiles(files);
        e.target.value = "";
    };

    const onRemoveFile = (idx: number) => {
        setSelectedDocuments((prev) => prev.filter((_, i) => i !== idx));
    };

    const onDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files ?? []);
        if (!files.length) return;
        addFiles(files);
    };

    const handleUpload = async () => {
        if (!selectedDocuments.length) return;

        const err = validateFiles(selectedDocuments);
        if (err) {
            setUploadError(err);
            return;
        }

        try {
            setIsUploading(true);
            await onUpload?.(selectedDocuments);
            closeDialog();
        } catch (e: any) {
            setUploadError(e?.message ?? "Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Box
            sx={{
                border: `1px solid ${alpha(theme.currentPalette.primary, 0.25)}`,
                borderRadius: 2,
                backgroundColor: theme.currentPalette.background,
                overflow: "hidden",
                mt: 3,
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    px: 2.5,
                    py: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,

                }}
            >
                <Box>
                    <Typography sx={{ fontWeight: 800, color: theme.currentPalette.primary }}>
                        Driver Attachments
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: alpha(theme.currentPalette.text, 0.7) }}>
                        Upload documents of drivers
                    </Typography>
                </Box>

                <Button
                    onClick={openDialog}
                    variant="contained"
                    sx={{
                        textTransform: "none",
                        fontWeight: 800,
                        borderRadius: 1.5,
                        px: 2.5,
                        backgroundColor: theme.currentPalette.primary,
                        color: theme.currentPalette.background,
                        "&:hover": { backgroundColor: alpha(theme.currentPalette.primary, 0.9) },
                    }}
                >
                    Add Document
                </Button>
            </Box>

            <Divider sx={{ borderColor: alpha(theme.currentPalette.primary, 0.15) }} />

            {/* List */}
            <Box sx={{ p: 2 }}>
                {docsCountLabel.length ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        {docsCountLabel.map((doc) => (
                            <Box
                                key={doc.id}
                                sx={{
                                    border: `1px solid ${alpha(theme.currentPalette.primary, 0.25)}`,
                                    borderRadius: 2,
                                    px: 2,
                                    py: 1.5,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    backgroundColor: theme.currentPalette.background,
                                }}
                            >
                                <Typography sx={{ fontWeight: 800, color: theme.currentPalette.primary }}>
                                    {doc.displayName}
                                </Typography>

                                <IconButton
                                    onClick={() => onDelete?.(doc.id)}
                                    sx={{
                                        color: "#DC2626",
                                        "&:hover": { backgroundColor: alpha("#DC2626", 0.08) },
                                    }}
                                >
                                    <Trash2 size={18} />
                                </IconButton>
                            </Box>
                        ))}
                    </Box>
                ) : (
                    <Box sx={{ px: 1, py: 2 }}>
                        <Typography sx={{ color: alpha(theme.currentPalette.text, 0.75), fontSize: 13, textAlign: "center" }}>
                            No documents yet.
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Upload Dialog */}
            <Dialog open={open} onClose={closeDialog} maxWidth="sm" fullWidth>
                <DialogContent sx={{ p: 0 }}>
                    {/* Header */}
                    <Box
                        sx={{
                            px: 2.5,
                            py: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                            <Box
                                sx={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: "50%",
                                    display: "grid",
                                    placeItems: "center",
                                    backgroundColor: alpha(theme.currentPalette.primary, 0.12),
                                    color: theme.currentPalette.primary,
                                }}
                            >
                                <MdOutlineAttachFile size={18} />
                            </Box>
                            <Typography sx={{ fontWeight: 900, color: "#0F172A" }}>
                                Upload Driver Documents
                            </Typography>
                        </Box>

                        <IconButton onClick={closeDialog}>
                            <IoClose />
                        </IconButton>
                    </Box>

                    <Divider sx={{ borderColor: alpha(theme.currentPalette.primary, 0.12) }} />

                    {/* Dropzone */}
                    <Box sx={{ p: 2.5 }}>
                        <Box
                            onDragEnter={onDragEnter}
                            onDragLeave={onDragLeave}
                            onDragOver={onDragOver}
                            onDrop={onDrop}
                            sx={{
                                border: `2px solid ${isDragging ? theme.currentPalette.primary : alpha(theme.currentPalette.primary, 0.25)
                                    }`,
                                borderRadius: 2,
                                p: 3,
                                textAlign: "center",
                                backgroundColor: isDragging
                                    ? alpha(theme.currentPalette.primary, 0.08)
                                    : theme.currentPalette.background,
                                transition: "all .15s ease",
                            }}
                        >
                            <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
                                <Upload color={alpha(theme.currentPalette.primary, 0.75)} />
                            </Box>

                            <input
                                ref={inputRef}
                                type="file"
                                accept=".pdf,application/pdf"
                                multiple
                                onChange={onFileSelect}
                                style={{ display: "none" }}
                            />
                            
                            {/* <input
                                ref={inputRef}
                                type="file"
                                multiple
                                accept=".pdf,image/*"
                                onChange={onFileSelect}
                                style={{ display: "none" }}
                            /> */}

                            <Button
                                onClick={() => inputRef.current?.click()}
                                variant="contained"
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 800,
                                    borderRadius: 2,
                                    px: 3,
                                    backgroundColor: theme.currentPalette.primary,
                                    "&:hover": { backgroundColor: alpha(theme.currentPalette.primary, 0.9) },
                                }}
                            >
                                Select Files
                            </Button>

                            <Typography sx={{ mt: 1.5, fontSize: 13, color: alpha("#0F172A", 0.65) }}>
                                Select one or more files to upload <br /> or drag and drop files here
                            </Typography>

                            {uploadError && (
                                <Box
                                    sx={{
                                        mt: 2,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 1,
                                        color: "#DC2626",
                                        fontSize: 13,
                                    }}
                                >
                                    <MdError size={16} />
                                    <span>{uploadError}</span>
                                </Box>
                            )}

                            {/* Preview */}
                            {selectedDocuments.length > 0 && (
                                <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                                    {selectedDocuments.map((f, idx) => (
                                        <Box
                                            key={`${f.name}-${idx}`}
                                            sx={{
                                                border: `1px solid ${alpha("#0F172A", 0.12)}`,
                                                borderRadius: 2,
                                                px: 1.5,
                                                py: 1,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                backgroundColor: "#fff",
                                            }}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <MdPictureAsPdf size={18} color="#DC2626" />
                                                <Box sx={{ textAlign: "left" }}>
                                                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>
                                                        {f.name}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: 12, color: alpha("#0F172A", 0.6) }}>
                                                        {Math.round((f.size / 1024) * 100) / 100} KB
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <IconButton
                                                onClick={() => onRemoveFile(idx)}
                                                sx={{
                                                    color: "#DC2626",
                                                    "&:hover": { backgroundColor: alpha("#DC2626", 0.08) },
                                                }}
                                            >
                                                <IoClose />
                                            </IconButton>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </Box>

                        {/* Footer */}
                        <Box sx={{ display: "flex", gap: 2, mt: 2.5 }}>
                            <Button
                                fullWidth
                                onClick={closeDialog}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 800,
                                    borderRadius: 2,
                                    backgroundColor: alpha("#94A3B8", 0.15),
                                    color: "#0F172A",
                                    py: 1.2,
                                    "&:hover": { backgroundColor: alpha("#94A3B8", 0.22) },
                                }}
                            >
                                Cancel
                            </Button>

                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handleUpload}
                                disabled={!selectedDocuments.length || isUploading}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 900,
                                    borderRadius: 2,
                                    py: 1.2,
                                    backgroundColor: alpha(theme.currentPalette.primary, 0.55),
                                    "&:hover": { backgroundColor: alpha(theme.currentPalette.primary, 0.75) },
                                    "&.Mui-disabled": {
                                        backgroundColor: alpha(theme.currentPalette.primary, 0.35),
                                        color: alpha("#fff", 0.8),
                                    },
                                }}
                            >
                                {isUploading ? "Uploading..." : "Upload"}
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
}
