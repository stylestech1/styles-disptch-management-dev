/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { RootState, useAppSelector } from "@/redux/store";
import { tDriverHiring } from "@/types/globalTypes";
import toast, { Toaster } from "react-hot-toast";
import Erros from "@/components/ui/Erros";
import Loading from "@/components/ui/Loading";
import StatsCard from "@/components/ui/StatsCard";
import useError from "@/hook/useError";

import {
    useGetDriverApplicantsQuery,
    useUpdateDriverApplicantMutation,
    useGetDriverApplicantByIdQuery,
    useGetApplicantFileTicketMutation,
} from "@/redux/slices/apiSlice";

import {
    Box,
    Button,
    Chip,
    Dialog,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    SxProps,
    TextField,
    Typography,
    alpha,
} from "@mui/material";
import Pagination from "@mui/material/Pagination";

import {
    X,
    User,
    Phone,
    CalendarDays,
    FileText,
    AlertTriangle,
    MapPinned,
    Briefcase,
    UserPlus,
    CircleEllipsis,
    UserRoundCheck,
    UserRoundX,
    UsersRound,
    Plus,
    Clock,
    ShieldCheck,
    Ban,
    GripVertical,
    SquarePen,
} from "lucide-react";

import { IoMdEye } from "react-icons/io";
import { DriverHirringForm } from "@/components/drivers/DriverHiringForm";
import { getErrorMessage } from "@/utils/getErrorMessage";

type DriverHiringFormData = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    state: string;
    status: string;
    notes: string;
    violations: string;
    documents?: FileList | File[] | null;
    experienceYears: string;
    readyDate: string;
    reminder: {
        date: string;
        time: string;
        reason: string;
        isDone: boolean;
    };
};

type ApplicantStatus = "New" | "Pending" | "Qualified" | "Disqualified" | "Rejected";

const KANBAN_COLUMNS: {
    key: ApplicantStatus;
    title: string;
    icon: React.ElementType;
    description: string;
}[] = [
        { key: "New", title: "New", icon: Plus, description: "Fresh applicants waiting for review" },
        { key: "Pending", title: "Pending", icon: Clock, description: "Applicants waiting for review" },
        { key: "Qualified", title: "Qualified", icon: ShieldCheck, description: "Applicants approved for next step" },
        { key: "Disqualified", title: "Disqualified", icon: UserRoundX, description: "Applicants not matching requirements" },
        { key: "Rejected", title: "Rejected", icon: Ban, description: "Rejected applicants" },
    ];

const normalizeStatus = (status?: string): ApplicantStatus => {
    const value = String(status || "").toLowerCase();

    if (value === "new") return "New";
    if (value === "pending") return "Pending";
    if (value === "qualified") return "Qualified";
    if (value === "disqualified") return "Disqualified";
    if (value === "rejected") return "Rejected";

    return "New";
};


const HiringDriversPage = () => {
    const theme = useAppSelector((state: RootState) => state.palette);
    const { error, setError } = useError();

    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [minimumExperience, setMinimumExperience] = useState("");

    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<Partial<tDriverHiring>>({});

    const [selectedDriver, setSelectedDriver] = useState<tDriverHiring | null>(
        null,
    );
    const [viewOpen, setViewOpen] = useState(false);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuDriver, setMenuDriver] = useState<tDriverHiring | null>(null);

    const [draggedDriverId, setDraggedDriverId] = useState<string | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<ApplicantStatus | null>(
        null,
    );

    const [localApplicants, setLocalApplicants] = useState<tDriverHiring[]>([]);
    const [dismissedReminderIds, setDismissedReminderIds] = useState<Record<string, boolean>>({});

    const {
        data: driversData,
        isLoading: driversLoading,
        error: driverError,
        refetch: refetchDrivers,
    } = useGetDriverApplicantsQuery(
        {
            page,
            limit: 100,
            keyword: debouncedSearch || undefined,
            status: statusFilter || undefined,
            experienceYearsGte: minimumExperience
                ? Number(minimumExperience)
                : undefined,
        },
        {
            refetchOnFocus: true,
            refetchOnReconnect: true,
            refetchOnMountOrArgChange: true,
        },
    );

    const [updateDriverApplicant, { isLoading: isUpdating }] =
        useUpdateDriverApplicantMutation();

    const [getApplicantFileTicket] = useGetApplicantFileTicketMutation();

    const { data: driverDetailsResponse, isLoading: driverDetailsLoading } =
        useGetDriverApplicantByIdQuery(selectedDriver?._id!, {
            skip: !selectedDriver?._id,
        });

    const selectedDriverDetails = driverDetailsResponse?.data;
    const document = selectedDriverDetails?.document || selectedDriver?.document;

    useEffect(() => {
        if (driversData?.data) {
            setLocalApplicants(driversData.data);
        }
    }, [driversData?.data]);

    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
        return () => window.clearTimeout(timer);
    }, [searchTerm]);

    const filteredApplicants = useMemo(() => {
        return localApplicants || [];
    }, [localApplicants]);

    const applicantsByStatus = useMemo(() => {
        return KANBAN_COLUMNS.reduce(
            (acc, column) => {
                acc[column.key] = filteredApplicants.filter(
                    (driver) => normalizeStatus(driver.status) === column.key,
                );

                return acc;
            },
            {} as Record<ApplicantStatus, tDriverHiring[]>,
        );
    }, [filteredApplicants]);

    const statsData = driversData?.stats || {
        total: localApplicants.length,
        newApplicants: localApplicants.filter(
            (driver) => normalizeStatus(driver.status) === "New",
        ).length,
        pending: localApplicants.filter(
            (driver) => normalizeStatus(driver.status) === "Pending",
        ).length,
        qualified: localApplicants.filter(
            (driver) => normalizeStatus(driver.status) === "Qualified",
        ).length,
        disqualified: localApplicants.filter(
            (driver) => normalizeStatus(driver.status) === "Disqualified",
        ).length,
        rejected: localApplicants.filter(
            (driver) => normalizeStatus(driver.status) === "Rejected",
        ).length,
    };

    const formatDate = (date?: string) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString("en-GB").replace(/\//g, "-");
    };

    const buildDriverUpdateBody = (data: DriverHiringFormData) => {
        const reminderPayload = {
            date: data.reminder?.date || "",
            time: data.reminder?.time || "",
            reason: data.reminder?.reason || "",
            isDone: Boolean(data.reminder?.isDone || false),
        };
        const files = data.documents ? Array.from(data.documents) : [];
        if (files.length) {
            const formDataBody = new FormData();
            formDataBody.append("status", data.status || "New");
            formDataBody.append("notes", data.notes || "");
            formDataBody.append("reminder", JSON.stringify(reminderPayload));
            files.forEach((file) => {
                formDataBody.append("documents", file, file.name);
            });
            return formDataBody;
        }
        return {
            status: data.status || "New",
            notes: data.notes || "",
            reminder: reminderPayload,
        };
    };

    const handleViewClick = (driver: tDriverHiring) => {
        setSelectedDriver(driver);
        setViewOpen(true);
    };

    const handleEditClick = (driver: tDriverHiring) => {
        setFormData({
            _id: driver._id,
            firstName: driver.firstName,
            lastName: driver.lastName,
            email: driver.email,
            state: driver.state,
            phone: driver.phone,
            status: driver.status || "New",
            readyDate: driver.readyDate ? String(driver.readyDate).split("T")[0] : "",
            reminder: {
                date: driver.reminder?.date || driver.reminderDate || "",
                time: driver.reminder?.time || driver.reminderTime || "",
                reason: driver.reminder?.reason || driver.reminderReason || "",
                isDone: Boolean(driver.reminder?.isDone ?? driver.isDone ?? false),
            },
            createdBy: driver.createdBy,
            experienceYears: driver.experienceYears,
            notes: driver.notes,
            violations: driver.violations,
            document: driver.document,
        });


        setEditMode(true);
        setOpen(true);
    };

    const handleUpdate = async (data: DriverHiringFormData) => {
        if (!formData._id) return;

        try {
            const updateBody = buildDriverUpdateBody(data);

            await updateDriverApplicant({
                id: formData._id,
                body: updateBody,
            }).unwrap();

            setLocalApplicants((prev) =>
                prev.map((driver) =>
                    driver._id === formData._id
                        ? {
                            ...driver,
                            status: data.status || "New",
                            reminder: {
                                date: data.reminder?.date || "",
                                time: data.reminder?.time || "",
                                reason: data.reminder?.reason || "",
                                isDone: Boolean(data.reminder?.isDone || false),
                            },
                            notes: data.notes,
                        }
                        : driver,
                ),
            );

            toast.success("Driver applicant updated successfully!");
            setOpen(false);
            refetchDrivers();
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const handleDragStart = (driverId?: string) => {
        if (!driverId) return;
        setDraggedDriverId(driverId);
    };

    const handleDragEnd = () => {
        setDraggedDriverId(null);
        setDragOverStatus(null);
    };

    const handleDrop = async (newStatus: ApplicantStatus) => {
        if (!draggedDriverId) return;

        const draggedApplicant = localApplicants.find(
            (driver) => driver._id === draggedDriverId,
        );

        if (!draggedApplicant?._id) {
            handleDragEnd();
            return;
        }

        const oldStatus = normalizeStatus(draggedApplicant.status);

        if (oldStatus === newStatus) {
            handleDragEnd();
            return;
        }

        const oldApplicants = localApplicants;

        setLocalApplicants((prev) =>
            prev.map((driver) =>
                driver._id === draggedApplicant._id
                    ? {
                        ...driver,
                        status: newStatus,
                    }
                    : driver,
            ),
        );

        try {
            await updateDriverApplicant({
                id: draggedApplicant._id,
                body: { status: newStatus },
            }).unwrap();

            toast.success(`Applicant moved to ${newStatus}`);
            refetchDrivers();
        } catch (err) {
            setLocalApplicants(oldApplicants);
            toast.error(getErrorMessage(err));
        } finally {
            handleDragEnd();
        }
    };

    const openActionMenu = (
        event: React.MouseEvent<HTMLButtonElement>,
        driver: tDriverHiring,
    ) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setMenuDriver(driver);
    };

    const closeActionMenu = () => {
        setAnchorEl(null);
        setMenuDriver(null);
    };

    const getStatusChipSx = (status?: string) => {
        const normalized = normalizeStatus(status);

        if (normalized === "Qualified") {
            return {
                bgcolor: alpha("#16A34A", 0.12),
                color: "#15803D",
            };
        }

        if (normalized === "Disqualified") {
            return {
                bgcolor: alpha("#F59E0B", 0.15),
                color: "#B45309",
            };
        }

        if (normalized === "Rejected") {
            return {
                bgcolor: alpha("#DC2626", 0.12),
                color: "#B91C1C",
            };
        }

        return {
            bgcolor: alpha(theme.currentPalette.primary, 0.12),
            color: theme.currentPalette.primary,
        };
    };

    const DetailCard = ({
        icon,
        label,
        value,
    }: {
        icon: React.ReactNode;
        label: string;
        value: React.ReactNode;
    }) => (
        <Box
            sx={{
                border: "1px solid #E5EAF3",
                borderRadius: "14px",
                p: 1.5,
                minHeight: 92,
                bgcolor: "#fff",
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Box
                    sx={{
                        width: 30,
                        height: 30,
                        borderRadius: "8px",
                        bgcolor: "#EEF4FB",
                        color: theme.currentPalette.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </Box>

                <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
                    {label}
                </Typography>
            </Box>

            <Typography
                sx={{
                    fontSize: 15,
                    color: "#111827",

                    wordBreak: "break-word",
                }}
            >
                {value || "-"}
            </Typography>
        </Box>
    );

    const formatReminderDateTime = (date?: string, time?: string) => {
        if (!date || !time) return "-";

        const dateOnly = new Date(date).toISOString().split("T")[0];

        const reminderDateTime = new Date(
            `${dateOnly}T${time}:00`
        );

        return reminderDateTime.toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const DriverCard = ({ driver }: { driver: tDriverHiring }) => {
        const reminder = driver.reminder || {
            date: driver.reminderDate || "",
            time: driver.reminderTime || "",
            reason: driver.reminderReason || "",
            isDone: Boolean(driver.isDone ?? false),
        };

        const reminderDate = reminder.date;
        const reminderTime = reminder.time;
        const reminderReason = reminder.reason;

        const hasReminder = Boolean(
            reminderDate &&
            reminderTime &&
            reminderReason
        );

        let reminderDateTime: number | null = null;

        if (reminderDate && reminderTime) {
            const dateOnly = new Date(reminderDate)
                .toISOString()
                .split("T")[0];

            reminderDateTime = new Date(
                `${dateOnly}T${reminderTime}:00`
            ).getTime();
        }

        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        const isReminderUpcoming = Boolean(
            reminderDateTime &&
            now >= reminderDateTime - twentyFourHours &&
            now <= reminderDateTime &&
            !reminder.isDone &&
            !dismissedReminderIds[driver._id]
        );
        return (
            <Box
                draggable
                onDragStart={() => handleDragStart(driver._id)}
                onDragEnd={handleDragEnd}
                onClick={() => handleViewClick(driver)}
                sx={{
                    bgcolor: "#fff",
                    border: `1px solid ${alpha(theme.currentPalette.primary, 0.16)}`,
                    borderRadius: "16px",
                    p: 1.6,
                    cursor: "grab",
                    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.1)",
                        borderColor: alpha(theme.currentPalette.primary, 0.35),
                    },
                    "&:active": {
                        cursor: "grabbing",
                    },
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 1,
                        mb: 1.4,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                            sx={{
                                width: 38,
                                height: 38,
                                borderRadius: "12px",
                                bgcolor: alpha(theme.currentPalette.primary, 0.1),
                                color: theme.currentPalette.primary,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <User size={19} />
                        </Box>

                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                sx={{
                                    fontSize: 15,
                                    color: "#111827",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    maxWidth: 160,
                                }}
                            >
                                {driver.firstName || ""} {driver.lastName || ""}
                            </Typography>

                            <Typography
                                sx={{
                                    fontSize: 12,
                                    color: "#6B7280",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.4,
                                    mt: 0.2,
                                }}
                            >
                                <Phone size={12} />
                                {driver.phone || "-"}
                            </Typography>
                        </Box>
                    </Box>

                    <IconButton
                        size="small"
                        onClick={(event) => {
                            event.stopPropagation();
                            handleEditClick(driver);
                        }}
                        sx={{
                            color: theme.currentPalette.primary,
                            "&:hover": {
                                bgcolor: alpha(theme.currentPalette.primary, 0.1),
                            },
                        }}
                    >
                        <SquarePen size={19} />
                    </IconButton>
                </Box>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, mb: 1.4 }}>
                    <Chip
                        size="small"
                        label={normalizeStatus(driver.status)}
                        sx={{
                            ...getStatusChipSx(driver.status),
                            borderRadius: "8px",
                            textTransform: "capitalize",

                            height: 24,
                        }}
                    />

                    <Chip
                        size="small"
                        label={`${driver.experienceYears || 0} years`}
                        sx={{
                            bgcolor: "#F3F4F6",
                            color: "#374151",
                            borderRadius: "8px",

                            height: 24,
                        }}
                    />
                </Box>

                <Box
                    sx={{
                        display: "grid",
                        gap: 0.9,
                        fontSize: 13,
                        color: "#4B5563",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <MapPinned size={15} />
                        <Typography sx={{ fontSize: 13 }}>
                            {driver.state || "No state"}
                        </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <CalendarDays size={15} />
                        <Typography sx={{ fontSize: 13 }}>
                            Ready: {formatDate(driver.readyDate)}
                        </Typography>
                    </Box>

                    {/* <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <FileText size={15} />
                        <Typography
                            sx={{
                                fontSize: 13,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {driver.notes || "No notes"}
                        </Typography>
                    </Box> */}
                </Box>

                {hasReminder && isReminderUpcoming && (
                    <Box
                        sx={{
                            mt: 1.2,
                            p: 1.1,
                            borderRadius: "10px",
                            bgcolor: alpha("#dc2626", 0.1),
                            border: "1px solid rgba(220, 38, 38, 0.2)",
                            color: "#b91c1c",
                        }}
                    >
                        <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.5 }}>
                            Reminder: {reminderReason || "Please review this applicant"}
                        </Typography>
                        <Typography sx={{ fontSize: 11, mb: 0.7 }}>
                            {/* {reminderDate} {reminderTime} */}
                            {formatReminderDateTime(reminderDate, reminderTime)}
                        </Typography>
                        <Button
                            size="small"
                            variant="contained"
                            onClick={async (event) => {
                                event.stopPropagation();
                                setDismissedReminderIds((prev) => ({ ...prev, [driver._id]: true }));
                                setLocalApplicants((prev) =>
                                    prev.map((item) =>
                                        item._id === driver._id
                                            ? {
                                                ...item,
                                                reminder: item.reminder
                                                    ? { ...item.reminder, isDone: true }
                                                    : { date: "", time: "", reason: "", isDone: true },
                                                isDone: true,
                                            }
                                            : item,
                                    ),
                                );
                                try {
                                    const formDataBody = new FormData();
                                    const doneReminder = {
                                        date: reminder.date || "",
                                        time: reminder.time || "",
                                        reason: reminder.reason || "",
                                        isDone: true,
                                    };
                                    formDataBody.append("reminder", JSON.stringify(doneReminder));
                                    formDataBody.append("reminderDate", doneReminder.date);
                                    formDataBody.append("reminderTime", doneReminder.time);
                                    formDataBody.append("reminderReason", doneReminder.reason);
                                    formDataBody.append("isDone", "true");
                                    await updateDriverApplicant({ id: driver._id, body: formDataBody }).unwrap();
                                } catch (error) {
                                    toast.error("Failed to mark reminder as done");
                                }
                            }}
                            sx={{
                                minHeight: 26,
                                px: 1.2,
                                py: 0.2,
                                bgcolor: "#dc2626",
                                color: "#fff",
                                borderRadius: "999px",
                                textTransform: "capitalize",
                                fontSize: 11,
                                boxShadow: "none",
                                "&:hover": { bgcolor: "#b91c1c", boxShadow: "none" },
                            }}
                        >
                            Done
                        </Button>
                    </Box>
                )}

                <Box
                    sx={{
                        mt: 1.4,
                        pt: 1.2,
                        borderTop: "1px solid #EEF2F7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        color: "#9CA3AF",
                    }}
                >
                    <Typography sx={{ fontSize: 11, }}>
                        Drag to change status
                    </Typography>

                    <GripVertical size={16} />
                </Box>
            </Box>
        );
    };

    const KanbanColumn = ({
        status,
        title,
        icon: Icon,
        description,
    }: {
        status: ApplicantStatus;
        title: string;
        icon: React.ElementType;
        description: string;
    }) => {
        const applicants = applicantsByStatus[status] || [];
        const isActiveDrop = dragOverStatus === status;

        return (
            <Box
                onDragOver={(event) => {
                    event.preventDefault();
                    setDragOverStatus(status);
                }}
                onDragLeave={() => setDragOverStatus(null)}
                onDrop={(event) => {
                    event.preventDefault();
                    handleDrop(status);
                }}
                sx={{
                    minHeight: 520,
                    bgcolor: isActiveDrop
                        ? alpha(theme.currentPalette.primary, 0.08)
                        : "#F8FAFC",
                    border: `1px solid ${isActiveDrop
                        ? alpha(theme.currentPalette.primary, 0.45)
                        : "#E5EAF3"
                        }`,
                    borderRadius: "18px",
                    p: 1.5,
                    transition: "all 0.2s ease",
                }}
            >
                <Box
                    sx={{
                        bgcolor: "#fff",
                        borderRadius: "14px",
                        p: 1.5,
                        mb: 1.5,
                        border: "1px solid #EEF2F7",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box
                                sx={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: "10px",
                                    bgcolor: alpha(theme.currentPalette.primary, 0.1),
                                    color: theme.currentPalette.primary,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Icon size={18} />
                            </Box>

                            <Box>
                                <Typography
                                    sx={{
                                        fontSize: 15,

                                        color: "#111827",
                                    }}
                                >
                                    {title}
                                </Typography>

                                <Typography
                                    sx={{
                                        fontSize: 11,
                                        color: "#6B7280",
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {description}
                                </Typography>
                            </Box>
                        </Box>

                        <Box
                            sx={{
                                minWidth: 28,
                                height: 28,
                                px: 1,
                                borderRadius: "999px",
                                bgcolor: alpha(theme.currentPalette.primary, 0.1),
                                color: theme.currentPalette.primary,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 13,

                            }}
                        >
                            {applicants.length}
                        </Box>
                    </Box>
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.3,
                    }}
                >
                    {applicants.length ? (
                        applicants.map((driver) => (
                            <DriverCard key={driver._id} driver={driver} />
                        ))
                    ) : (
                        <Box
                            sx={{
                                height: 180,
                                border: "1px dashed #CBD5E1",
                                borderRadius: "14px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                                p: 2,
                                color: "#94A3B8",
                                bgcolor: "#fff",
                            }}
                        >
                            <Typography sx={{ fontSize: 13, }}>
                                Drop applicants here
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        );
    };

    const containerSx: SxProps = {
        p: { xs: 1.5, md: 3 },
    };

    if (driversLoading) {
        return (
            <Box sx={containerSx}>
                <Loading />
            </Box>
        );
    }

    return (
        <Box sx={containerSx}>
            <Toaster position="top-center" />

            <Box sx={{ mt: 2, mb: 3 }}>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            sm: "1fr 1fr",
                            lg: "repeat(4, 1fr)",
                        },
                        gap: 2,
                    }}
                >
                    <StatsCard
                        title="Total Applicants"
                        value={statsData.total}
                        icon={UsersRound}
                    />

                    <StatsCard
                        title="New"
                        value={statsData.newApplicants}
                        icon={Plus}
                    />

                    <StatsCard
                        title="Qualified"
                        value={statsData.qualified}
                        icon={UserRoundCheck}
                    />

                    <StatsCard
                        title="Pending"
                        value={statsData.pending}
                        icon={Clock}
                    />

                    <StatsCard
                        title="Rejected"
                        value={statsData.rejected}
                        icon={UserRoundX}
                    />
                </Box>
            </Box>

            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    p: 2.5,
                    mb: 3,
                    border: `1px solid ${alpha(theme.currentPalette.primary, 0.3)}`,
                    borderRadius: 2,
                    backgroundColor: theme.currentPalette.background,
                    width: "100%",
                }}
            >
                <Box
                    sx={{
                        minWidth: { xs: "100%", md: 260 },
                        flex: "1 1 260px",
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            color: theme.currentPalette.primary,

                        }}
                    >
                        Driver Applicants Board
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            color: theme.currentPalette.primary,
                            mt: 0.5,
                            lineHeight: 1.5,
                        }}
                    >
                        Drag applicant cards between columns to update their status
                    </Typography>
                </Box>

                <TextField
                    size="small"
                    value={searchTerm}
                    placeholder="Search by name, email, phone..."
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                    }}
                    label="Search applicants"
                    sx={{
                        flex: "1 1 320px",
                        minWidth: { xs: "100%", sm: 250, md: 320 },
                        maxWidth: { xs: "100%", md: 420 },
                        "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            backgroundColor: "#fff",
                        },
                    }}
                />
                <TextField
                    select
                    size="small"
                    label="Status"
                    value={statusFilter}
                    onChange={(event) => {
                        setStatusFilter(event.target.value);
                        setPage(1);
                    }}
                    sx={{ minWidth: { xs: "100%", sm: 150 } }}
                >
                    <MenuItem value="">All statuses</MenuItem>
                    {KANBAN_COLUMNS.map(({ key }) => (
                        <MenuItem value={key} key={key}>{key}</MenuItem>
                    ))}
                </TextField>
                <TextField
                    select
                    size="small"
                    label="Minimum experience"
                    value={minimumExperience}
                    onChange={(event) => {
                        setMinimumExperience(event.target.value);
                        setPage(1);
                    }}
                    sx={{ minWidth: { xs: "100%", sm: 190 } }}
                >
                    <MenuItem value="">Any experience</MenuItem>
                    <MenuItem value="2">2+ years</MenuItem>
                    <MenuItem value="5">5+ years</MenuItem>
                    <MenuItem value="10">10+ years</MenuItem>
                </TextField>
            </Box>

            {(error || driverError) && (
                <Box sx={{ mb: 3 }}>
                    <Erros message={error || getErrorMessage(driverError)} />
                </Box>
            )}

            <Box
                sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "flex-start",
                    overflowX: "auto",
                    overflowY: "hidden",
                    pb: 2,

                    "&::-webkit-scrollbar": {
                        height: 8,
                    },

                    "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "#cbd5e1",
                        borderRadius: 999,
                    },
                }}
            >
                {KANBAN_COLUMNS.map((column) => (
                    <Box
                        key={column.key}
                        sx={{
                            flexShrink: 0,
                            width: {
                                xs: 300,
                                sm: 320,
                                md: 340,
                                lg: "15%",
                            },
                            minWidth: {
                                xs: 300,
                                sm: 320,
                            },
                        }}
                    >
                        <KanbanColumn
                            status={column.key}
                            title={column.title}
                            icon={column.icon}
                            description={column.description}
                        />
                    </Box>
                ))}
            </Box>
            {(driversData?.paginationResult?.totalPages || 1) > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                    <Pagination
                        page={page}
                        count={driversData?.paginationResult?.totalPages || 1}
                        onChange={(_, nextPage) => setPage(nextPage)}
                        color="primary"
                    />
                </Box>
            )}

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={closeActionMenu}
                sx={{ zIndex: 999 }}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        mt: 1,
                        bgcolor: "#fff",
                    },
                }}
            >
                <MenuItem
                    onClick={() => {
                        if (menuDriver) handleViewClick(menuDriver);
                        closeActionMenu();
                    }}
                    sx={{ fontSize: "14px" }}
                >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                        <IoMdEye size={18} color={theme.currentPalette.primary} />
                    </ListItemIcon>

                    <ListItemText
                        primary="View"
                        slotProps={{
                            primary: {
                                sx: { color: theme.currentPalette.primary },
                            },
                        }}
                    />
                </MenuItem>

                <MenuItem
                    onClick={() => {
                        if (menuDriver) handleEditClick(menuDriver);
                        closeActionMenu();
                    }}
                    sx={{ fontSize: "14px" }}
                >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                        <SquarePen size={18} color={theme.currentPalette.primary} />
                    </ListItemIcon>

                    <ListItemText
                        primary="Edit Details"
                        slotProps={{
                            primary: {
                                sx: { color: theme.currentPalette.primary },
                            },
                        }}
                    />
                </MenuItem>

            </Menu>

            <DriverHirringForm
                open={open}
                onClose={() => {
                    setOpen(false);
                    setEditMode(false);
                    setFormData({});
                }}
                formData={formData as Partial<tDriverHiring>}
                onSubmit={handleUpdate}
                editMode={editMode}
                isLoading={isUpdating}
            />

            <Dialog
                open={viewOpen}
                onClose={() => setViewOpen(false)}
                maxWidth={false}
                PaperProps={{
                    sx: {
                        width: { xs: "92vw", sm: 620 },
                        borderRadius: 2,
                        overflow: "auto",
                    },
                }}
            >
                <Box
                    sx={{
                        px: 2.5,
                        py: 2,
                        borderBottom: "1px solid #EEF2F7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        bgcolor: "#FAFBFD",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: "12px",
                                bgcolor: "#EEF4FB",
                                color: theme.currentPalette.primary,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <UserPlus size={21} />
                        </Box>

                        <Box>
                            <Typography sx={{ fontSize: 18, }}>
                                Driver Applicant Information
                            </Typography>

                            <Typography sx={{ fontSize: 12, color: "#6B7280" }}>
                                Applicant details and attachments
                            </Typography>
                        </Box>
                    </Box>

                    <IconButton size="small" onClick={() => setViewOpen(false)}>
                        <X size={20} />
                    </IconButton>
                </Box>

                {driverDetailsLoading ? (
                    <Box sx={{ p: 4 }}>
                        <Loading />
                    </Box>
                ) : selectedDriver ? (
                    <Box sx={{ p: 2.5, bgcolor: "#F8FAFC" }}>
                        <Box
                            sx={{
                                border: "1px solid #DDE7F3",
                                borderRadius: "16px",
                                p: 2,
                                bgcolor: "#fff",
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    mb: 2,
                                    gap: 2,
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: 20,

                                        color: theme.currentPalette.primary,
                                    }}
                                >
                                    {selectedDriverDetails?.firstName && selectedDriverDetails.lastName !== "" ?
                                        `${selectedDriverDetails.firstName} ${selectedDriverDetails.lastName}` :
                                        selectedDriver.firstName || "Driver Applicant"}
                                </Typography>

                                <Chip
                                    label={normalizeStatus(
                                        selectedDriverDetails?.status || selectedDriver.status,
                                    )}
                                    sx={{
                                        ...getStatusChipSx(
                                            selectedDriverDetails?.status || selectedDriver.status,
                                        ),
                                        borderRadius: "999px",

                                        textTransform: "capitalize",
                                    }}
                                />
                            </Box>

                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                    gap: 1.5,
                                }}
                            >
                                <DetailCard
                                    icon={<User size={17} />}
                                    label="Name"
                                    value={selectedDriverDetails?.firstName && selectedDriverDetails.lastName !== "" ?
                                        `${selectedDriverDetails.firstName} ${selectedDriverDetails.lastName}` :
                                        selectedDriver.firstName || "Driver Applicant"}
                                />

                                <DetailCard
                                    icon={<MapPinned size={17} />}
                                    label="State"
                                    value={selectedDriverDetails?.state || selectedDriver.state}
                                />

                                <DetailCard
                                    icon={<Phone size={17} />}
                                    label="Phone"
                                    value={selectedDriverDetails?.phone || selectedDriver.phone}
                                />

                                <DetailCard
                                    icon={<CalendarDays size={17} />}
                                    label="Ready Date"
                                    value={formatDate(
                                        selectedDriverDetails?.readyDate || selectedDriver.readyDate,
                                    )}
                                />

                                <DetailCard
                                    icon={<Briefcase size={17} />}
                                    label="Experience"
                                    value={
                                        selectedDriverDetails?.experienceYears ||
                                            selectedDriver.experienceYears
                                            ? `${selectedDriverDetails?.experienceYears ||
                                            selectedDriver.experienceYears
                                            } years`
                                            : "-"
                                    }
                                />

                                <DetailCard
                                    icon={<AlertTriangle size={17} />}
                                    label="Violations"
                                    value={
                                        selectedDriverDetails?.violations ||
                                        selectedDriver.violations
                                    }
                                />

                                <DetailCard
                                    icon={<FileText size={17} />}
                                    label="Notes"
                                    value={selectedDriverDetails?.notes || selectedDriver.notes}
                                />
                            </Box>

                            <Box sx={{ mt: 1.5 }}>
                                {document?.fileId ? (
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<FileText size={20} />}
                                        onClick={async () => {
                                            const popup = window.open("about:blank", "_blank");
                                            if (!popup) {
                                                toast.error("Allow pop-ups to view the applicant document.");
                                                return;
                                            }
                                            try {
                                                const ticket = await getApplicantFileTicket(document.fileId).unwrap();
                                                popup.location.href = ticket.url;
                                            } catch {
                                                popup.close();
                                                toast.error("Could not securely open the applicant document.");
                                            }
                                        }}
                                        sx={{ minHeight: 52 }}
                                    >
                                        View Resume / CDL (PDF)
                                    </Button>
                                ) : (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1.5,
                                            border: "1px dashed #CBD5E1",
                                            borderRadius: "10px",
                                            p: 2,
                                            color: "#94A3B8",
                                            bgcolor: "#fff",
                                        }}
                                    >
                                        <FileText size={20} />

                                        <Typography sx={{}}>
                                            No document attached
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </Box>
                ) : null}
            </Dialog>

        </Box>
    );
};

export default HiringDriversPage;