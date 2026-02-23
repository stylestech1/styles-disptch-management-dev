/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Loading from "@/components/ui/Loading";
import { TLoads } from "@/types/globalTypes";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Erros from "@/components/ui/Erros";
import toast, { Toaster } from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import useError from "@/hook/useError";
import DataTable from "@/components/ui/DataTable";
import { driverSummaryColumns } from "@/data/driverSummaryTable";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import {
  useGetDriverByIdQuery,
  useGetDriverSummaryWithFilterQuery,
  useGetSpecificDriverSummaryQuery,
  useUpdateDriverMutation,
} from "@/redux/slices/apiSlice";
import { getErrorMessage } from "@/utils/getErrorMessage";
import {
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Popover,
  Stack,
  SxProps,
  TableRow,
  Typography,
  Collapse,
} from "@mui/material";
import { RootState, useAppSelector } from "@/redux/store";
import Breadcrumb from "@/components/ui/Breadcrumb";
import {
  Banknote,
  Boxes,
  Calendar,
  Check,
  CircleDollarSign,
  CircleUserRound,
  CreditCard,
  FileText,
  LandPlot,
  Mail,
  Phone,
  Trash2,
  Upload,
  ChevronDown, ChevronUp
} from "lucide-react";

import { IoClose } from "react-icons/io5";
import { MdError, MdOutlineAttachFile } from "react-icons/md";
import { useFilter } from "@/providers/FilterProvider";


type AttachmentItem = {
  id: string;
  name: string;
  size?: number;
  url?: string;
};

const MAX_FILES = 2;
const FIELD_NAME = "documents";

const formatKB = (bytes: number) => `${(bytes / 1024).toFixed(2)} KB`;

const sanitizeAttachments = (docs: any[]): AttachmentItem[] => {
  if (!Array.isArray(docs)) return [];
  return docs
    .filter(Boolean)
    .map((d: any) => ({
      id: String(d?.id ?? d?._id ?? "").trim(),
      name: String(d?.name ?? d?.fileName ?? d?.filename ?? "Document").trim(),
      url: d?.url ? String(d.url).trim() : undefined,
      size: typeof d?.size === "number" ? d.size : undefined,
    }))
    .filter((d: AttachmentItem) => !!d.id && (!!d.name || !!d.url));
};

const isValidAttachment = (a?: AttachmentItem | null) => {
  if (!a) return false;
  const hasId = !!String(a.id ?? "").trim();
  const hasName = !!String(a.name ?? "").trim();
  const hasUrl = !!String(a.url ?? "").trim();
  return hasId && (hasName || hasUrl);
};

const dedupeFiles = (files: File[]) => {
  const map = new Map<string, File>();
  for (const f of files) {
    const key = `${f.name}-${f.size}-${f.lastModified}`;
    if (!map.has(key)) map.set(key, f);
  }
  return Array.from(map.values());
};

const validatePdfOnly = (files: File[]) => {
  const onlyPdf = files.every(
    (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
  );
  if (!onlyPdf) return "Only PDF files are allowed";
  return "";
};

const DriverSummary = () => {
  const { id } = useParams();
  const router = useRouter();
  const { error, setError } = useError();
  const theme = useAppSelector((state: RootState) => state.palette);

  const { fromDate, toDate, isFiltered } = useFilter();

  const uploading = useRef(false);
  const earningsRef = useRef<any>(null);

  const [updateDriver] = useUpdateDriverMutation();

  const {
    data: profileData,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useGetDriverByIdQuery(id as string, { skip: !id });

  const {
    data: driverSummaryData,
    error: summaryError,
    refetch: refetchFilteredSummary,
  } = useGetDriverSummaryWithFilterQuery({
    id: id as string,
    from: fromDate ? fromDate.format("YYYY-MM-DD") : undefined,
    to: toDate ? toDate.format("YYYY-MM-DD") : undefined,
  });

  const {
    data: specificDriverSummaryData,
    isLoading: specificDriverSummaryLoading,
    refetch: refetchDriverSummary,
  } = useGetSpecificDriverSummaryQuery(id as string, {
    skip: !id,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: true,
  });

  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [earningsAnchorEl, setEarningsAnchorEl] = useState<HTMLElement | null>(null);

  const [openUpload, setOpenUpload] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [selectedDocuments, setSelectedDocuments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const toggleAttachments = () => setAttachmentsOpen((v) => !v);

  const profile = profileData?.data as any;
  const summaryData = isFiltered ? driverSummaryData?.data : specificDriverSummaryData?.data;

  useEffect(() => {
    const raw = profileData?.data as any;
    const docsRaw = (raw?.documents ?? raw?.attachments ?? []) as any[];
    setAttachments(sanitizeAttachments(docsRaw));
  }, [profileData]);

  const docsLabel = useMemo(() => {
    return (attachments ?? [])
      .filter(isValidAttachment)
      .map((a) => ({
        ...a,
        displayName: (a.name?.trim() || "Document").trim(),
      }));
  }, [attachments]);

  const displayedData = useMemo(() => {
    if (isFiltered && driverSummaryData) return driverSummaryData?.data?.loads;
    return specificDriverSummaryData?.data?.loads;
  }, [isFiltered, driverSummaryData, specificDriverSummaryData]);


  const handleEarningsEnter = (event: React.MouseEvent<HTMLElement>) => {
    setEarningsAnchorEl(event.currentTarget);
  };
  const handleEarningsLeave = () => {
    setEarningsAnchorEl(null);
  };

  useEffect(() => {
    if (summaryError) {
      const errorMessage = getErrorMessage(summaryError);
      setError(errorMessage);
      toast.error(errorMessage || "Failed to load summary ", {
        style: { background: "#dc2626", color: "#fff" },
      });
    }
  }, [summaryError, setError]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isFiltered) refetchFilteredSummary();
      else refetchDriverSummary();
    }, 10000);
    return () => clearInterval(interval);
  }, [isFiltered, refetchFilteredSummary, refetchDriverSummary]);

  useEffect(() => {
    const handleDriverUpdated = () => {
      if (isFiltered) refetchFilteredSummary();
      else refetchDriverSummary();
    };
    window.addEventListener("driver-updated", handleDriverUpdated);
    return () => window.removeEventListener("driver-updated", handleDriverUpdated);
  }, [isFiltered, refetchFilteredSummary, refetchDriverSummary]);


  const canAddMore = selectedDocuments.length < MAX_FILES;

  const resetUploadDialog = () => {
    setSelectedDocuments([]);
    setUploadError("");
    setIsDragging(false);
  };

  const openUploadDialog = () => {
    setOpenUpload(true);
    resetUploadDialog();
  };

  const closeUploadDialog = () => {
    setOpenUpload(false);
    resetUploadDialog();
  };

  const addFiles = (files: File[]) => {
    if (!canAddMore) {
      setUploadError(`You can upload up to ${MAX_FILES} PDF files only`);
      return;
    }

    const pdfError = validatePdfOnly(files);
    if (pdfError) {
      setUploadError(pdfError);
      return;
    }

    setSelectedDocuments((prev) => {
      const merged = dedupeFiles([...prev, ...files]);
      if (merged.length > MAX_FILES) {
        setUploadError(`You can upload up to ${MAX_FILES} PDF files only`);
        return merged.slice(0, MAX_FILES);
      }
      setUploadError("");
      return merged;
    });
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    addFiles(files);
    e.target.value = "";
  };

  const onRemoveSelectedFile = (idx: number) => {
    setSelectedDocuments((prev) => prev.filter((_, i) => i !== idx));
    setUploadError("");
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canAddMore) return;
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
    if (!canAddMore) return;
    setIsDragging(true);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!canAddMore) {
      setUploadError(`You can upload up to ${MAX_FILES} PDF files only`);
      return;
    }

    const files = Array.from(e.dataTransfer.files ?? []);
    if (!files.length) return;
    addFiles(files);
  };

  const handleConfirmUpload = async () => {
    if (isUploading) return;
    if (!selectedDocuments.length) return;

    const err = validatePdfOnly(selectedDocuments);
    if (err) {
      setUploadError(err);
      return;
    }

    if (uploading.current) return;
    uploading.current = true;

    try {
      setIsUploading(true);

      const form = new FormData();
      const safeFiles = selectedDocuments.slice(0, MAX_FILES);
      safeFiles.forEach((f) => form.append(FIELD_NAME, f));

      form.append("id", String(id));

      await updateDriver({ id: String(id), body: form } as any).unwrap();

      await refetchProfile();

      toast.success("Uploaded successfully");
      closeUploadDialog();
    } catch (e: any) {
      const msg = e?.data?.message ?? e?.message ?? "Upload failed";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      uploading.current = false;
      setIsUploading(false);
    }
  };

  // const [deleteDriverDocument] = useDeleteDriverDocumentMutation();

  // const handleDeleteDoc = async (docId: string) => {
  //   try {
  //     setAttachments((prev) => prev.filter((d) => String(d.id) !== String(docId)));

  //     await deleteDriverDocument(String(docId)).unwrap();

  //     await refetchProfile();

  //     toast.success("Deleted");
  //   } catch (e: any) {
  //     await refetchProfile(); 
  //     toast.error(e?.data?.message ?? e?.message ?? "Delete failed");
  //   }
  // };

  const renderDriverSummaryRow = (load: TLoads, index: number) => {
    const tableRowSx: SxProps = {
      bgcolor: theme.currentPalette.background!,
      color: theme.currentPalette.primary,
      "&:hover": { bgcolor: alpha(theme.currentPalette.primary, 0.1) },
      transition: "all 0.2s ease-in-out",
    };

    const l: any = load;

    return (
      <TableRow sx={tableRowSx} key={l.loadId || index}>
        <td className="p-4 text-center">
          <span className="text-sm px-2 py-1 rounded">{l.loadId}</span>
        </td>
        <td className="p-4 text-center">{l.truckId?.plateNumber}</td>
        <td className="p-4 text-center">{l.deliveredAt ? l.deliveredAt.split("T")[0] : "-"}</td>
        <td className="p-4 text-center max-w-10">
          <div className="truncate" title={l.origin}>
            {l.origin}
          </div>
        </td>
        <td className="p-4 text-center max-w-10">
          <div
            className="truncate"
            title={Array.isArray(l.destination) ? l.destination.join(", ") : l.destination}
          >
            {Array.isArray(l.destination) ? l.destination.join(", ") : l.destination}
          </div>
        </td> 
        <td className="p-4 text-center">{l.distanceMiles?.toLocaleString()}</td>
        {/* <td className="p-4 text-center">$ {l.pricePerMile?.toFixed(2)}</td> */}
        <td className="p-4 text-center">${l.totalPrice?.toLocaleString()}</td>
      </TableRow>
    );
  };

  const isInitialLoading = profileLoading || specificDriverSummaryLoading;
  if (isInitialLoading) return <Loading />;

  const profileCards = [
    { id: 1, icon: <Mail size={25} />, name: "Email", value: profile?.email || "N/A" },
    { id: 2, icon: <Phone size={25} />, name: "Phone", value: profile?.phone || "N/A" },
    {
      id: 3,
      icon: <CreditCard size={25} />,
      name: "License Number",
      value: profile?.licenseNumber || "N/A",
    },
    {
      id: 4,
      icon: <Calendar size={25} />,
      name: "Hire Date",
      value: profile?.hireDate?.split("T")[0] || "N/A",
    },
  ];

  const searchFilterContainerSx: SxProps = {
    display: "flex",
    flexDirection: { xs: "column" },
    alignItems: "flex-start",
    p: 2,
    my: 2,
    border: `1px solid ${alpha(theme.currentPalette.primary, 0.3)}`,
    borderRadius: 1,
    backgroundColor: theme.currentPalette.background,
  };

  return (
    <section className="container mx-auto p-6">
      <Toaster position="top-center" />

      <Breadcrumb
        items={[
          { label: "Drivers", href: "/admin/drivers" },
          { label: "Driver Summary" },
        ]}
        color={theme.currentPalette.primary}
        textColor={alpha(theme.currentPalette.text, 0.8)}
        separatorColor={alpha(theme.currentPalette.text, 0.5)}
      />

      {error && (
        <div className="mb-6">
          <Erros message={error} />
        </div>
      )}

      <Box className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        <Box
          sx={{
            border: 1,
            borderRadius: 1,
            borderColor: alpha(theme.currentPalette.primary, 0.3),
            p: 3,
          }}
          className="lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2 items-center">
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: alpha(theme.currentPalette.primary, 0.1),
                  color: theme.currentPalette.primary,
                  borderRadius: 1,
                }}
              >
                <CircleUserRound size={25} />
              </Box>

              <div className="flex flex-col">
                <Typography sx={{ color: theme.currentPalette.title, fontSize: "24px" }}>
                  {profile?.name}
                </Typography>
                <Typography sx={{ color: theme.currentPalette.text }}>
                  Driver ID: {profile?.driverId}
                </Typography>
              </div>
            </div>

            <Chip
              style={{ textTransform: "capitalize" }}
              label={profile?.status || "unknown"}
              variant="filled"
              color={profile?.status === "available" ? "success" : "error"}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-16">
            {profileCards.map((card) => (
              <div key={card.id} className="flex items-center gap-3">
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: alpha(theme.currentPalette.primary, 0.1),
                    color: theme.currentPalette.primary,
                    borderRadius: 1,
                  }}
                >
                  {card.icon}
                </Box>

                <div className="flex flex-col">
                  <Typography sx={{ color: theme.currentPalette.primary }}>{card.name}</Typography>
                  <Typography sx={{ color: theme.currentPalette.text }}>{card.value}</Typography>
                </div>
              </div>
            ))}
          </div>
        </Box>

        <div className="grid grid-cols-2 gap-5">
          <Box sx={{ position: "relative", overflow: "visible" }}>
            <Box
              onMouseEnter={handleEarningsEnter}
              onMouseLeave={handleEarningsLeave}
              sx={{
                p: 3,
                border: 1,
                borderColor: alpha(theme.currentPalette.primary, 0.3),
                borderRadius: 1,
                cursor: "pointer",
              }}
              className="flex flex-col justify-center"
            >
              <Typography sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <span style={{ color: theme.currentPalette.text }}>Total Earnings</span>
                <Banknote color={theme.currentPalette.primary} />
              </Typography>

              <Typography
                sx={{
                  fontSize: "30px",
                  color: theme.currentPalette.text,
                  display: "inline-block",
                  paddingBottom: "2px",
                  cursor: "pointer",
                }}
                ref={earningsRef}
                onMouseEnter={() => setEarningsAnchorEl(earningsRef.current)}
                onMouseLeave={handleEarningsLeave}
              >
                $<span style={{ borderBottom: "2px dotted #08172B" }}>
                  {summaryData?.earnings?.totalEarnings?.toFixed(2) || "0.00"}
                </span>
              </Typography>
            </Box>

            <Popover
              open={Boolean(earningsAnchorEl)}
              anchorEl={earningsAnchorEl}
              onClose={handleEarningsLeave}
              disableRestoreFocus
              PaperProps={{
                onMouseEnter: () => setEarningsAnchorEl(earningsRef.current),
                onMouseLeave: handleEarningsLeave,
                sx: { p: 2, borderRadius: 1, boxShadow: 6, minWidth: 220, textAlign: "left" },
              }}
            >
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  mb: 1,
                  textAlign: "center",
                  color: "#666666",
                }}
              >
                <p> DRIVER EARNINGS </p>
                <p>BREAKDOWN</p>
              </Typography>

              <Divider sx={{ mb: 1, borderColor: alpha(theme.currentPalette.text, 0.25) }} />
              <Stack spacing={0.8}>
                <Typography
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: theme.currentPalette.primary,
                  }}
                >
                  <span>Base Pay</span>
                  <span>${Number(summaryData?.earnings?.baseEarnings).toFixed(2) || "0.00"}</span>
                </Typography>
                <Typography sx={{ display: "flex", justifyContent: "space-between", color: "#317435" }}>
                  <span>Bonus</span>
                  <span>+${Number(summaryData?.earnings?.totalBonus).toFixed(2) || "0.00"}</span>
                </Typography>
                <Typography sx={{ display: "flex", justifyContent: "space-between", color: "#317435" }}>
                  <span>Detention</span>
                  <span>+${Number(summaryData?.earnings?.totalDetention).toFixed(2) || "0.00"}</span>
                </Typography>
                <Typography sx={{ display: "flex", justifyContent: "space-between", color: "#B3261E" }}>
                  <span>Deduction</span>
                  <span>-${Number(summaryData?.earnings?.totalDeduction).toFixed(2) || "0.00"}</span>
                </Typography>
              </Stack>
            </Popover>
          </Box>

          <Box
            sx={{ p: 3, border: 1, borderColor: alpha(theme.currentPalette.primary, 0.3), borderRadius: 1 }}
            className="flex flex-col justify-center"
          >
            <Typography sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <span style={{ color: theme.currentPalette.text }}>Total Loads</span>
              <Boxes color={theme.currentPalette.primary} />
            </Typography>
            <Typography sx={{ fontSize: "30px", color: theme.currentPalette.text }}>
              {summaryData?.totalLoads || 0}
            </Typography>
          </Box>

          <Box
            sx={{ p: 3, border: 1, borderColor: alpha(theme.currentPalette.primary, 0.3), borderRadius: 1 }}
            className="flex flex-col justify-center"
          >
            <Typography sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <span style={{ color: theme.currentPalette.text }}>Price/Mile</span>
              <CircleDollarSign color={theme.currentPalette.primary} />
            </Typography>
            <Typography sx={{ fontSize: "30px", color: theme.currentPalette.text }}>
              ${summaryData?.pricePerMile?.toFixed(2) || "0.00"}
            </Typography>
          </Box>

          <Box
            sx={{ p: 3, border: 1, borderColor: alpha(theme.currentPalette.primary, 0.3), borderRadius: 1 }}
            className="flex flex-col justify-center"
          >
            <Typography sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <span style={{ color: theme.currentPalette.text }}>Total Miles</span>
              <LandPlot color={theme.currentPalette.primary} />
            </Typography>
            <Typography sx={{ fontSize: "30px", color: theme.currentPalette.text }}>
              {summaryData?.totalMiles?.toLocaleString() || 0}
            </Typography>
          </Box>
        </div>
      </Box>

      <Box
        sx={{
          border: `1px solid ${alpha(theme.currentPalette.primary, 0.25)}`,
          borderRadius: 1,
          backgroundColor: theme.currentPalette.background,
          overflow: "hidden",
          mt: 3,
        }}
      >
        {/* Header */}
        <Box
          onClick={toggleAttachments}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") toggleAttachments();
          }}
          sx={{
            px: 2.5,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            cursor: "pointer",
            userSelect: "none",
            "&:hover": {
              backgroundColor: alpha(theme.currentPalette.primary, 0.04),
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, color: theme.currentPalette.primary }}>
                Driver Attachments
              </Typography>
              <Typography sx={{ fontSize: 13, color: alpha(theme.currentPalette.text, 0.7) }}>
                Upload documents of drivers
              </Typography>
            </Box>


          </Box>
          <div className="flex items-center gap-2">

            <Button
              onClick={(e) => {
                e.stopPropagation();
                openUploadDialog();
              }}
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
            {/* Arrow */}
            <Box
              sx={{
                // width: 34,
                // height: 34,
                // borderRadius: 1.5,
                display: "grid",
                placeItems: "center",
                // border: `1px solid ${alpha(theme.currentPalette.primary, 0.18)}`,
                // backgroundColor: theme.currentPalette.background,
                color: alpha(theme.currentPalette.primary, 0.9),
                flexShrink: 0,
              }}
            >
              {attachmentsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </Box>
          </div>
        </Box>


        <Divider sx={{ borderColor: alpha(theme.currentPalette.primary, 0.15) }} />

        <Collapse in={attachmentsOpen} timeout={180} unmountOnExit>
          {/* List */}
          <Box sx={{ p: 2 }}>
            {docsLabel.length ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {docsLabel.map((doc) => (
                  <Box
                    key={doc.id}
                    sx={{
                      border: `1px solid ${alpha(theme.currentPalette.primary, 0.25)}`,
                      borderRadius: 1,
                      px: 2,
                      py: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: theme.currentPalette.background,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0 }}>
                      <FileText size={18} color={alpha(theme.currentPalette.primary, 0.9)} />
                      <Typography
                        sx={{
                          fontWeight: 800,
                          color: theme.currentPalette.primary,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: { xs: 220, sm: 420 },
                        }}
                        title={doc.displayName}
                      >
                        {doc.displayName}
                      </Typography>
                    </Box>
                    {/* <IconButton
                    onClick={() => handleDeleteDoc(doc.id)}
                    sx={{
                      color: "#DC2626",
                      "&:hover": { backgroundColor: alpha("#DC2626", 0.08) },
                    }}
                  >
                    <Trash2 size={18} />
                  </IconButton> */}
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ px: 1, py: 2 }}>
                <Typography
                  sx={{
                    color: alpha(theme.currentPalette.text, 0.75),
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  No documents yet.
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>


        {/* Upload Dialog */}
        <Dialog open={openUpload} onClose={closeUploadDialog} maxWidth="sm" fullWidth>
          <DialogContent sx={{ p: 0 ,  bgcolor: "#fff" }}>
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
                <Typography sx={{ fontWeight: 900, color: "#0F172A", fontSize: 18 }}>
                  Upload Driver Documents
                </Typography>
              </Box>

              <IconButton onClick={closeUploadDialog} disabled={isUploading}>
                <IoClose />
              </IconButton>
            </Box>

            <Divider sx={{ borderColor: alpha(theme.currentPalette.primary, 0.12) }} />

            <Box sx={{ p: 2.5 }}>
              {/* Dropzone */}
              <Box
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDragOver={onDragOver}
                onDrop={onDrop}
                sx={{
                  border: `2px solid ${isDragging
                    ? alpha(theme.currentPalette.primary, 0.9)
                    : alpha(theme.currentPalette.primary, 0.35)
                    }`,
                  borderRadius: 1,
                  p: 3,
                  textAlign: "center",
                  backgroundColor: "#fff",
                  transition: "all .15s ease",
                  opacity: canAddMore ? 1 : 0.6,
                  pointerEvents: canAddMore ? "auto" : "none",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
                  <Upload size={40} color={alpha(theme.currentPalette.primary, 0.8)} />
                </Box>

                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  onChange={onFileSelect}
                  style={{ display: "none" }}
                  disabled={!canAddMore}
                />

                <Button
                  onClick={() => inputRef.current?.click()}
                  variant="contained"
                  disabled={!canAddMore}
                  sx={{
                    textTransform: "none",
                    fontWeight: 800,
                    borderRadius: 1,
                    px: 3.5,
                    backgroundColor: theme.currentPalette.primary,
                    "&:hover": { backgroundColor: alpha(theme.currentPalette.primary, 0.9) },
                    "&.Mui-disabled": {
                      backgroundColor: alpha(theme.currentPalette.primary, 0.35),
                      color: alpha("#fff", 0.85),
                    },
                  }}
                >
                  Select Files
                </Button>

                <Typography sx={{ mt: 1.5, fontSize: 13, color: alpha("#0F172A", 0.6) }}>
                  Select one or more files to upload <br /> or drag and drop files here
                </Typography>
              </Box>

              {/* Error */}
              {uploadError && (
                <Box
                  sx={{
                    mt: 1.5,
                    display: "flex",
                    alignItems: "center",
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
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {selectedDocuments.map((file, index) => (
                      <Box
                        key={`${file.name}-${file.lastModified}-${index}`}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          px: 2,
                          py: 1.6,
                          borderRadius: 1,
                          border: `1px solid ${alpha(theme.currentPalette.primary, 0.18)}`,
                          backgroundColor: alpha(theme.currentPalette.primary, 0.08),
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.6, minWidth: 0 }}>
                          <FileText size={18} color={alpha(theme.currentPalette.primary, 0.9)} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontWeight: 800,
                                fontSize: 14,
                                color: theme.currentPalette.primary,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: { xs: 220, sm: 360 },
                              }}
                              title={file.name}
                            >
                              {file.name}
                            </Typography>
                            <Typography sx={{ fontSize: 12.5, color: alpha("#0F172A", 0.55) }}>
                              {formatKB(file.size)}
                            </Typography>
                          </Box>
                        </Box>

                        <IconButton
                          onClick={() => onRemoveSelectedFile(index)}
                          sx={{
                            color: alpha("#0F172A", 0.45),
                            "&:hover": { backgroundColor: alpha("#0F172A", 0.06) },
                          }}
                          disabled={isUploading}
                        >
                          <IoClose />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>

                  {!canAddMore && (
                    <Typography sx={{ mt: 1.2, fontSize: 12.5, color: alpha("#0F172A", 0.6) }}>
                      Max {MAX_FILES} files selected. File picker is disabled.
                    </Typography>
                  )}
                </Box>
              )}

              {/* Footer */}
              <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                <Button
                  fullWidth
                  onClick={closeUploadDialog}
                  disabled={isUploading}
                  sx={{
                    textTransform: "none",
                    fontWeight: 800,
                    borderRadius: 1,
                    backgroundColor: alpha("#94A3B8", 0.15),
                    color: "#0F172A",
                    py: 1.25,
                    "&:hover": { backgroundColor: alpha("#94A3B8", 0.22) },
                  }}
                >
                  Cancel
                </Button>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleConfirmUpload}
                  disabled={!selectedDocuments.length || isUploading}
                  startIcon={isUploading ? <CircularProgress size={18} /> : <Check size={18} />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 900,
                    borderRadius: 1,
                    py: 1.25,
                    backgroundColor: theme.currentPalette.primary,
                    "&:hover": { backgroundColor: alpha(theme.currentPalette.primary, 0.9) },
                    "&.Mui-disabled": {
                      backgroundColor: alpha(theme.currentPalette.primary, 0.35),
                      color: alpha("#fff", 0.85),
                    },
                  }}
                >
                  {isUploading ? "Uploading..." : `Confirm (${selectedDocuments.length}/${MAX_FILES})`}
                </Button>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>
      </Box>

      {/* Loads */}
      <Box sx={searchFilterContainerSx}>
        <Typography variant="h6" sx={{ color: theme.currentPalette.primary, fontWeight: 500 }}>
          Load Details
        </Typography>
        <Typography variant="body2" sx={{ color: theme.currentPalette.primary, fontWeight: 400 }}>
          Complete list of all loads assigned to this driver
        </Typography>
      </Box>

      {displayedData && (
        <Box className="overflow-hidden">
          {displayedData.length > 0 ? (
            <DataTable
              columns={driverSummaryColumns}
              data={displayedData}
              renderRow={renderDriverSummaryRow}
              loading={isInitialLoading}
            />
          ) : (
            <div className="px-4 py-12 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="text-3xl mb-3">📦</div>
                <Typography sx={{ color: theme.currentPalette.primary }}>
                  {isFiltered ? "No load records found for the selected date range" : "No load records found"}
                </Typography>
                <Typography sx={{ color: alpha(theme.currentPalette.text, 0.8), fontSize: "14px" }}>
                  {isFiltered ? "Please adjust your date filter" : "There are no loads available for this driver"}
                </Typography>
              </div>
            </div>
          )}
        </Box>
      )}

      {displayedData && (
        <div className="mt-6 flex justify-end">
          <Box sx={{ borderRadius: 1, borderColor: alpha(theme.currentPalette.primary, 0.3) }} className="px-4 py-3 border">
            <Typography sx={{ color: alpha(theme.currentPalette.primary, 0.8), fontSize: "14px" }}>
              Showing {displayedData.length} loads {isFiltered && " (filtered)"}
            </Typography>
          </Box>
        </div>
      )}

      {!profile && !isInitialLoading && (
        <div className="rounded-xl border p-12 text-center">
          <div className="text-4xl mb-4">👨‍💼</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Driver Not Found</h3>
          <p className="text-slate-600 mb-4">
            {"The driver you're looking for doesn't exist or you don't have access to it."}
          </p>
          <button
            onClick={() => router.push("/admin/drivers")}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Back to Drivers
          </button>
        </div>
      )}
    </section>
  );
};

export default DriverSummary;
