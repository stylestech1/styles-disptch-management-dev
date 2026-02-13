// /* ===========================
//    DriverAttachments.tsx
// =========================== */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";

// import React, { useMemo, useRef, useState } from "react";
// import {
//     alpha,
//     Box,
//     Button,
//     Dialog,
//     DialogContent,
//     Divider,
//     IconButton,
//     Typography,
//     CircularProgress,
// } from "@mui/material";
// import { IoClose } from "react-icons/io5";
// import { MdOutlineAttachFile, MdError } from "react-icons/md";
// import { Trash2, Upload, Check, FileText } from "lucide-react";
// import { RootState, useAppSelector } from "@/redux/store";
// import {
//     useGetDriverByDriverIdQuery,
//     useUpdateDriverMutation,
// } from "@/redux/slices/apiSlice";

// export type AttachmentItem = {
//     id: string;
//     name: string;
//     size?: number;
//     url?: string;
// };

// type Props = {
//     driverId: string; // ✅ driverId (query param)
//     onDelete?: (id: string) => Promise<void> | void; // optional (لو عندك endpoint delete)
// };

// const MAX_FILES = 2;
// const FIELD_NAME = "documents";
// const formatKB = (bytes: number) => `${(bytes / 1024).toFixed(2)} KB`;

// const isValidAttachment = (a?: AttachmentItem | null) => {
//     if (!a) return false;
//     const hasId = !!String(a.id ?? "").trim();
//     const hasName = !!String(a.name ?? "").trim();
//     const hasUrl = !!String(a.url ?? "").trim();
//     return hasId && (hasName || hasUrl);
// };

// const dedupeFiles = (files: File[]) => {
//     const map = new Map<string, File>();
//     for (const f of files) {
//         const key = `${f.name}-${f.size}-${f.lastModified}`;
//         if (!map.has(key)) map.set(key, f);
//     }
//     return Array.from(map.values());
// };

// const sanitizeAttachments = (docs: any[]): AttachmentItem[] => {
//     if (!Array.isArray(docs)) return [];
//     return docs
//         .filter(Boolean)
//         .map((d: any) => ({
//             id: String(d?.id ?? d?._id ?? "").trim(),
//             name: String(d?.name ?? d?.fileName ?? d?.filename ?? "Document").trim(),
//             url: d?.url ? String(d.url).trim() : undefined,
//             size: typeof d?.size === "number" ? d.size : undefined,
//         }))
//         .filter((d: AttachmentItem) => !!d.id && (!!d.name || !!d.url));
// };

// export default function DriverAttachments({ driverId, onDelete }: Props) {
//     const theme = useAppSelector((state: RootState) => state.palette);

//     // ✅ query: /api/v1/drivers?driverId=...
//     const {
//         data: driverRes,
//         isFetching,
//         refetch,
//         isLoading,
//     } = useGetDriverByDriverIdQuery(String(driverId), {
//         skip: !driverId,
//         refetchOnFocus: false,
//         refetchOnReconnect: true,
//         refetchOnMountOrArgChange: true,
//     });

//     // ✅ mutation for upload (PATCH)
//     const [updateDriver] = useUpdateDriverMutation();

//     const [open, setOpen] = useState(false);
//     const [isDragging, setIsDragging] = useState(false);
//     const [uploadError, setUploadError] = useState<string>("");
//     const [selectedDocuments, setSelectedDocuments] = useState<File[]>([]);
//     const [isUploading, setIsUploading] = useState(false);

//     const inputRef = useRef<HTMLInputElement | null>(null);

//     // 👇 driver object is in driverRes.data
//     const attachments = useMemo(() => {
//         const raw = (driverRes?.data ?? null) as any;
//         const docsRaw = (raw?.documents ?? raw?.attachments ?? []) as any[];
//         return sanitizeAttachments(docsRaw);
//     }, [driverRes]);

//     const docsLabel = useMemo(() => {
//         return (attachments ?? [])
//             .filter(isValidAttachment)
//             .map((a) => ({
//                 ...a,
//                 displayName: (a.name?.trim() || "Document").trim(),
//             }));
//     }, [attachments]);

//     const canAddMore = selectedDocuments.length < MAX_FILES;

//     const resetDialog = () => {
//         setSelectedDocuments([]);
//         setUploadError("");
//         setIsDragging(false);
//     };

//     const openDialog = () => {
//         setOpen(true);
//         resetDialog();
//     };

//     const closeDialog = () => {
//         setOpen(false);
//         resetDialog();
//     };

//     const validatePdfOnly = (files: File[]) => {
//         const onlyPdf = files.every(
//             (f) =>
//                 f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
//         );
//         if (!onlyPdf) return "Only PDF files are allowed";
//         return "";
//     };

//     const addFiles = (files: File[]) => {
//         if (!canAddMore) {
//             setUploadError(`You can upload up to ${MAX_FILES} PDF files only`);
//             return;
//         }

//         const pdfError = validatePdfOnly(files);
//         if (pdfError) {
//             setUploadError(pdfError);
//             return;
//         }

//         setSelectedDocuments((prev) => {
//             const merged = dedupeFiles([...prev, ...files]);
//             if (merged.length > MAX_FILES) {
//                 setUploadError(`You can upload up to ${MAX_FILES} PDF files only`);
//                 return merged.slice(0, MAX_FILES);
//             }
//             setUploadError("");
//             return merged;
//         });
//     };

//     const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const files = Array.from(e.target.files ?? []);
//         if (!files.length) return;
//         addFiles(files);
//         e.target.value = "";
//     };

//     const onRemoveFile = (idx: number) => {
//         setSelectedDocuments((prev) => prev.filter((_, i) => i !== idx));
//         setUploadError("");
//     };

//     const onDragEnter = (e: React.DragEvent) => {
//         e.preventDefault();
//         e.stopPropagation();
//         if (!canAddMore) return;
//         setIsDragging(true);
//     };
//     const onDragLeave = (e: React.DragEvent) => {
//         e.preventDefault();
//         e.stopPropagation();
//         setIsDragging(false);
//     };
//     const onDragOver = (e: React.DragEvent) => {
//         e.preventDefault();
//         e.stopPropagation();
//         if (!canAddMore) return;
//         setIsDragging(true);
//     };
//     const onDrop = (e: React.DragEvent) => {
//         e.preventDefault();
//         e.stopPropagation();
//         setIsDragging(false);

//         if (!canAddMore) {
//             setUploadError(`You can upload up to ${MAX_FILES} PDF files only`);
//             return;
//         }

//         const files = Array.from(e.dataTransfer.files ?? []);
//         if (!files.length) return;
//         addFiles(files);
//     };

//     // ✅ upload + refetch driver => attachments تظهر فوراً
//     const handleConfirmUpload = async () => {
//         if (isUploading) return;
//         if (!selectedDocuments.length) return;

//         const err = validatePdfOnly(selectedDocuments);
//         if (err) {
//             setUploadError(err);
//             return;
//         }

//         try {
//             setIsUploading(true);

//             const form = new FormData();
//             selectedDocuments.slice(0, MAX_FILES).forEach((f) => {
//                 form.append(FIELD_NAME, f);
//             });

//             // 👇 لو الباك محتاج driverId في body
//             form.append("driverId", String(driverId));

//             await updateDriver({
//                 id: String(driverId), // ⚠️ لو updateDriver عندك بياخد id مختلف (mongo _id) قولي وهعدلها
//                 body: form,
//             } as any).unwrap();

//             await refetch(); // ✅ يجيب attachments من endpoint ويعمل map

//             closeDialog();
//         } catch (e: any) {
//             setUploadError(e?.data?.message ?? e?.message ?? "Upload failed");
//         } finally {
//             setIsUploading(false);
//         }
//     };

//     const handleDelete = async (docId: string) => {
//         // لو عندك endpoint delete حقيقي، استدعيه هنا وبعدين refetch()
//         // حالياً هنستدعي onDelete لو موجودة وبعدين refetch
//         try {
//             await onDelete?.(docId);
//             await refetch();
//         } catch (e) {
//             // optional: show toast/error
//         }
//     };

//     const isBusy = isLoading || isFetching;

//     return (
//         <Box
//             sx={{
//                 border: `1px solid ${alpha(theme.currentPalette.primary, 0.25)}`,
//                 borderRadius: 2,
//                 backgroundColor: theme.currentPalette.background,
//                 overflow: "hidden",
//                 mt: 3,
//             }}
//         >
//             {/* Header */}
//             <Box
//                 sx={{
//                     px: 2.5,
//                     py: 2,
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "space-between",
//                     gap: 2,
//                 }}
//             >
//                 <Box>
//                     <Typography sx={{ fontWeight: 800, color: theme.currentPalette.primary }}>
//                         Driver Attachments
//                     </Typography>
//                     <Typography sx={{ fontSize: 13, color: alpha(theme.currentPalette.text, 0.7) }}>
//                         Upload documents of drivers
//                     </Typography>
//                 </Box>

//                 <Button
//                     onClick={openDialog}
//                     variant="contained"
//                     sx={{
//                         textTransform: "none",
//                         fontWeight: 800,
//                         borderRadius: 1.5,
//                         px: 2.5,
//                         backgroundColor: theme.currentPalette.primary,
//                         color: theme.currentPalette.background,
//                         "&:hover": { backgroundColor: alpha(theme.currentPalette.primary, 0.9) },
//                     }}
//                     disabled={!driverId}
//                 >
//                     Add Document
//                 </Button>
//             </Box>

//             <Divider sx={{ borderColor: alpha(theme.currentPalette.primary, 0.15) }} />

//             {/* List */}
//             <Box sx={{ p: 2 }}>
//                 {isBusy ? (
//                     <Typography sx={{ fontSize: 13, textAlign: "center", color: alpha(theme.currentPalette.text, 0.7) }}>
//                         Loading documents...
//                     </Typography>
//                 ) : docsLabel.length ? (
//                     <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
//                         {docsLabel.map((doc) => (
//                             <Box
//                                 key={doc.id}
//                                 sx={{
//                                     border: `1px solid ${alpha(theme.currentPalette.primary, 0.25)}`,
//                                     borderRadius: 2,
//                                     px: 2,
//                                     py: 1.5,
//                                     display: "flex",
//                                     alignItems: "center",
//                                     justifyContent: "space-between",
//                                     backgroundColor: theme.currentPalette.background,
//                                 }}
//                             >
//                                 <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0 }}>
//                                     <FileText size={18} color={alpha(theme.currentPalette.primary, 0.9)} />
//                                     <Typography
//                                         sx={{
//                                             fontWeight: 800,
//                                             color: theme.currentPalette.primary,
//                                             whiteSpace: "nowrap",
//                                             overflow: "hidden",
//                                             textOverflow: "ellipsis",
//                                             maxWidth: { xs: 220, sm: 420 },
//                                         }}
//                                         title={doc.displayName}
//                                     >
//                                         {doc.displayName}
//                                     </Typography>
//                                 </Box>

//                                 <IconButton
//                                     onClick={() => handleDelete(doc.id)}
//                                     sx={{
//                                         color: "#DC2626",
//                                         "&:hover": { backgroundColor: alpha("#DC2626", 0.08) },
//                                     }}
//                                 >
//                                     <Trash2 size={18} />
//                                 </IconButton>
//                             </Box>
//                         ))}
//                     </Box>
//                 ) : (
//                     <Box sx={{ px: 1, py: 2 }}>
//                         <Typography
//                             sx={{
//                                 color: alpha(theme.currentPalette.text, 0.75),
//                                 fontSize: 13,
//                                 textAlign: "center",
//                             }}
//                         >
//                             No documents yet.
//                         </Typography>
//                     </Box>
//                 )}
//             </Box>

//             {/* Upload Dialog */}
//             <Dialog open={open} onClose={closeDialog} maxWidth="sm" fullWidth>
//                 <DialogContent sx={{ p: 0 }}>
//                     {/* Header */}
//                     <Box
//                         sx={{
//                             px: 2.5,
//                             py: 2,
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "space-between",
//                         }}
//                     >
//                         <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
//                             <Box
//                                 sx={{
//                                     width: 34,
//                                     height: 34,
//                                     borderRadius: "50%",
//                                     display: "grid",
//                                     placeItems: "center",
//                                     backgroundColor: alpha(theme.currentPalette.primary, 0.12),
//                                     color: theme.currentPalette.primary,
//                                 }}
//                             >
//                                 <MdOutlineAttachFile size={18} />
//                             </Box>
//                             <Typography sx={{ fontWeight: 900, color: "#0F172A", fontSize: 18 }}>
//                                 Upload Driver Documents
//                             </Typography>
//                         </Box>

//                         <IconButton onClick={closeDialog} disabled={isUploading}>
//                             <IoClose />
//                         </IconButton>
//                     </Box>

//                     <Divider sx={{ borderColor: alpha(theme.currentPalette.primary, 0.12) }} />

//                     <Box sx={{ p: 2.5 }}>
//                         {/* Dropzone */}
//                         <Box
//                             onDragEnter={onDragEnter}
//                             onDragLeave={onDragLeave}
//                             onDragOver={onDragOver}
//                             onDrop={onDrop}
//                             sx={{
//                                 border: `2px solid ${isDragging
//                                         ? alpha(theme.currentPalette.primary, 0.9)
//                                         : alpha(theme.currentPalette.primary, 0.35)
//                                     }`,
//                                 borderRadius: 2,
//                                 p: 3,
//                                 textAlign: "center",
//                                 backgroundColor: "#fff",
//                                 transition: "all .15s ease",
//                                 opacity: canAddMore ? 1 : 0.6,
//                                 pointerEvents: canAddMore ? "auto" : "none",
//                             }}
//                         >
//                             <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
//                                 <Upload size={40} color={alpha(theme.currentPalette.primary, 0.8)} />
//                             </Box>

//                             <input
//                                 ref={inputRef}
//                                 type="file"
//                                 accept=".pdf,application/pdf"
//                                 multiple
//                                 onChange={onFileSelect}
//                                 style={{ display: "none" }}
//                                 disabled={!canAddMore}
//                             />

//                             <Button
//                                 onClick={() => inputRef.current?.click()}
//                                 variant="contained"
//                                 disabled={!canAddMore}
//                                 sx={{
//                                     textTransform: "none",
//                                     fontWeight: 800,
//                                     borderRadius: 2,
//                                     px: 3.5,
//                                     backgroundColor: theme.currentPalette.primary,
//                                     "&:hover": { backgroundColor: alpha(theme.currentPalette.primary, 0.9) },
//                                     "&.Mui-disabled": {
//                                         backgroundColor: alpha(theme.currentPalette.primary, 0.35),
//                                         color: alpha("#fff", 0.85),
//                                     },
//                                 }}
//                             >
//                                 Select Files
//                             </Button>

//                             <Typography sx={{ mt: 1.5, fontSize: 13, color: alpha("#0F172A", 0.6) }}>
//                                 Select one or more files to upload <br /> or drag and drop files here
//                             </Typography>
//                         </Box>

//                         {/* Error */}
//                         {uploadError && (
//                             <Box
//                                 sx={{
//                                     mt: 1.5,
//                                     display: "flex",
//                                     alignItems: "center",
//                                     gap: 1,
//                                     color: "#DC2626",
//                                     fontSize: 13,
//                                 }}
//                             >
//                                 <MdError size={16} />
//                                 <span>{uploadError}</span>
//                             </Box>
//                         )}

//                         {/* Preview */}
//                         {selectedDocuments.length > 0 && (
//                             <Box sx={{ mt: 2 }}>
//                                 <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
//                                     {selectedDocuments.map((file, index) => (
//                                         <Box
//                                             key={`${file.name}-${file.lastModified}-${index}`}
//                                             sx={{
//                                                 display: "flex",
//                                                 alignItems: "center",
//                                                 justifyContent: "space-between",
//                                                 px: 2,
//                                                 py: 1.6,
//                                                 borderRadius: 2,
//                                                 border: `1px solid ${alpha(theme.currentPalette.primary, 0.18)}`,
//                                                 backgroundColor: alpha(theme.currentPalette.primary, 0.08),
//                                             }}
//                                         >
//                                             <Box sx={{ display: "flex", alignItems: "center", gap: 1.6, minWidth: 0 }}>
//                                                 <FileText size={18} color={alpha(theme.currentPalette.primary, 0.9)} />
//                                                 <Box sx={{ minWidth: 0 }}>
//                                                     <Typography
//                                                         sx={{
//                                                             fontWeight: 800,
//                                                             fontSize: 14,
//                                                             color: theme.currentPalette.primary,
//                                                             whiteSpace: "nowrap",
//                                                             overflow: "hidden",
//                                                             textOverflow: "ellipsis",
//                                                             maxWidth: { xs: 220, sm: 360 },
//                                                         }}
//                                                         title={file.name}
//                                                     >
//                                                         {file.name}
//                                                     </Typography>
//                                                     <Typography sx={{ fontSize: 12.5, color: alpha("#0F172A", 0.55) }}>
//                                                         {formatKB(file.size)}
//                                                     </Typography>
//                                                 </Box>
//                                             </Box>

//                                             <IconButton
//                                                 onClick={() => onRemoveFile(index)}
//                                                 sx={{
//                                                     color: alpha("#0F172A", 0.45),
//                                                     "&:hover": { backgroundColor: alpha("#0F172A", 0.06) },
//                                                 }}
//                                                 disabled={isUploading}
//                                             >
//                                                 <IoClose />
//                                             </IconButton>
//                                         </Box>
//                                     ))}
//                                 </Box>

//                                 {!canAddMore && (
//                                     <Typography sx={{ mt: 1.2, fontSize: 12.5, color: alpha("#0F172A", 0.6) }}>
//                                         Max {MAX_FILES} files selected. File picker is disabled.
//                                     </Typography>
//                                 )}
//                             </Box>
//                         )}

//                         {/* Footer */}
//                         <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
//                             <Button
//                                 fullWidth
//                                 onClick={closeDialog}
//                                 disabled={isUploading}
//                                 sx={{
//                                     textTransform: "none",
//                                     fontWeight: 800,
//                                     borderRadius: 2,
//                                     backgroundColor: alpha("#94A3B8", 0.15),
//                                     color: "#0F172A",
//                                     py: 1.25,
//                                     "&:hover": { backgroundColor: alpha("#94A3B8", 0.22) },
//                                 }}
//                             >
//                                 Cancel
//                             </Button>

//                             <Button
//                                 fullWidth
//                                 variant="contained"
//                                 onClick={handleConfirmUpload}
//                                 disabled={!selectedDocuments.length || isUploading}
//                                 startIcon={
//                                     isUploading ? <CircularProgress size={18} /> : <Check size={18} />
//                                 }
//                                 sx={{
//                                     textTransform: "none",
//                                     fontWeight: 900,
//                                     borderRadius: 2,
//                                     py: 1.25,
//                                     backgroundColor: theme.currentPalette.primary,
//                                     "&:hover": { backgroundColor: alpha(theme.currentPalette.primary, 0.9) },
//                                     "&.Mui-disabled": {
//                                         backgroundColor: alpha(theme.currentPalette.primary, 0.35),
//                                         color: alpha("#fff", 0.85),
//                                     },
//                                 }}
//                             >
//                                 {isUploading ? "Uploading..." : `Confirm (${selectedDocuments.length}/${MAX_FILES})`}
//                             </Button>
//                         </Box>
//                     </Box>
//                 </DialogContent>
//             </Dialog>
//         </Box>
//     );
// }
