/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RootState, useAppSelector } from "@/redux/store";
import { tDriverHiring } from "@/types/globalTypes";
import toast, { Toaster } from "react-hot-toast";
import Erros from "@/components/ui/Erros";
import Pagination from "@/components/ui/Pagination";
import Loading from "@/components/ui/Loading";
import DataTable from "@/components/ui/DataTable";
import StatsCard from "@/components/ui/StatsCard";
import { getErrorMessage } from "@/utils/getErrorMessage";
import useError from "@/hook/useError";

import {
    useCreateDriverApplicantMutation,
    useDeleteDriverApplicantMutation,
    useGetDriverApplicantsQuery,
    useUpdateDriverApplicantMutation,
    useGetDriverApplicantByIdQuery,
} from "@/redux/slices/apiSlice";

import {
    Box,
    Button,
    Chip,
    Dialog,
    FormControl,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Select,
    SxProps,
    TableRow,
    TextField,
    Typography,
    alpha,
    darken,
} from "@mui/material";
import {
    X,
    User,
    Phone,
    CalendarDays,
    FileText,
    AlertTriangle,
    Paperclip,
    MapPinned,
    Briefcase,
    ShieldCheck,
    UserPlus,
    CircleEllipsis,
    Pen,
    Trash2,
    UserRoundCheck,
    UserRoundX,
    UsersRound,
    Plus,
} from "lucide-react";


import { IoMdEye } from "react-icons/io";
import { DriverHirringForm } from "@/components/drivers/DriverHiringForm";
import { driverHiringColumns } from "@/data/driverhirring";


type DriverHiringFormData = {
    name: string;
    phone: string;
    state: string;
    status: string;
    notes: string;
    violations: string;
    documents?: FileList | File[] | null;
    experienceYears: string;
    readyDate: string;
};
type TStatusFilter = "all" | "accepted" | "rejected";
const HiringDrivers = () => {
    const router = useRouter();
    const user = useAppSelector((state) => state.auth.user);
    const theme = useAppSelector((state: RootState) => state.palette);
    const { error, setError } = useError();

    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");

    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<Partial<tDriverHiring>>({});
    const [originalData, setOriginalData] = useState<Partial<tDriverHiring>>({});

    const [deleteToast, setDeleteToast] = useState({
        open: false,
        message: "",
    });

    const [selectedDriver, setSelectedDriver] = useState<tDriverHiring | null>(null);
    const [statusFilter, setStatusFilter] = useState<TStatusFilter>("all");
    const [driverToDelete, setDriverToDelete] = useState<{
        _id: string;
        name?: string;
    } | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const {
        data: driversData,
        isLoading: driversLoading,
        error: driverError,
        refetch: refetchDrivers,
    } = useGetDriverApplicantsQuery(
        { page, limit: 10 },
        {
            refetchOnFocus: true,
            refetchOnReconnect: true,
            refetchOnMountOrArgChange: true,
        },
    );

    const [createDriverApplicant, { isLoading: isCreating }] =
        useCreateDriverApplicantMutation();

    const [updateDriverApplicant, { isLoading: isUpdating }] =
        useUpdateDriverApplicantMutation();

    const [deleteDriverApplicant] = useDeleteDriverApplicantMutation();

    const currentData = useMemo(() => {
        let data = driversData?.data || [];

        if (statusFilter !== "all") {
            data = data.filter(
                (driver) => driver.status?.toLowerCase() === statusFilter
            );
        }

        if (!searchTerm.trim()) return data;

        const value = searchTerm.toLowerCase();

        return data.filter((driver) =>
            Object.values(driver).some((item) =>
                String(item || "")
                    .toLowerCase()
                    .includes(value)
            )
        );
    }, [driversData?.data, searchTerm, statusFilter]);
    const statsData = useMemo(() => {
        const stats = driversData?.stats;

        return {
            total: stats?.total || driversData?.data?.length || 0,
            accepted: stats?.accepted || 0,
            pending: stats?.pending || 0,
        };
    }, [driversData]);

    const isLoading = driversLoading;

    const [viewOpen, setViewOpen] = useState(false);

    const handleViewClick = (driver: tDriverHiring) => {
        setSelectedDriver(driver);
        setViewOpen(true);
    };

    const handleOpenCreate = () => {
        setEditMode(false);
        setFormData({});
        setOriginalData({});
        setOpen(true);
    };

    const handleEditClick = (driver: tDriverHiring) => {

        setOriginalData(driver);

        setFormData({
            _id: driver._id,
            name: driver.name,
            state: driver.state,
            phone: driver.phone,
            status: driver.status,
            readyDate: driver.readyDate
                ? String(driver.readyDate).split("T")[0]
                : "",
            createdBy: driver.createdBy,
            experienceYears: driver.experienceYears,
            notes: driver.notes,
            violations: driver.violations,
            document: driver.document,
        });

        setEditMode(true);
        setOpen(true);
    };
    const {
        data: driverDetailsResponse,
        isLoading: driverDetailsLoading,
    } = useGetDriverApplicantByIdQuery(selectedDriver?._id!, {
        skip: !selectedDriver?._id,
    });

    const selectedDriverDetails = driverDetailsResponse?.data;
    const document = selectedDriverDetails?.document || selectedDriver?.document;

    const getChangedFields = (
        original: Partial<tDriverHiring>,
        updated: Partial<tDriverHiring>,
    ): Partial<tDriverHiring> => {
        const changedFields: Record<string, unknown> = {};

        Object.entries(updated).forEach(([key, value]) => {
            const k = key as keyof tDriverHiring;

            if (value !== original[k] && value !== undefined) {
                changedFields[key] = value;
            }
        });

        return changedFields as Partial<tDriverHiring>;
    };
    const formatDate = (date?: string) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString("en-GB").replace(/\//g, "-");
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

                <Typography sx={{ fontSize: 13, color: "#6B7280", fontWeight: 600 }}>
                    {label}
                </Typography>
            </Box>

            <Typography
                sx={{
                    fontSize: 15,
                    color: "#111827",
                    fontWeight: 600,
                    wordBreak: "break-word",
                }}
            >
                {value || "-"}
            </Typography>
        </Box>
    );
    const buildDriverFormData = (data: DriverHiringFormData) => {
        const formDataBody = new FormData();

        formDataBody.append("name", data.name || "");
        formDataBody.append("phone", data.phone || "");
        formDataBody.append("state", data.state || "");
        formDataBody.append("status", data.status || "");
        formDataBody.append("notes", data.notes || "");
        formDataBody.append("violations", data.violations || "");
        formDataBody.append("experienceYears", String(Number(data.experienceYears || 0)));
        formDataBody.append("readyDate", data.readyDate || "");

        if (data.documents?.length) {
            Array.from(data.documents).forEach((file) => {
                formDataBody.append("documents", file);
            });
        }

        return formDataBody;
    };
    const handleCreate = async (data: DriverHiringFormData) => {
        const formDataBody = buildDriverFormData(data);

        await createDriverApplicant(formDataBody as any).unwrap();

        toast.success("Driver applicant created successfully!");
        setOpen(false);
        refetchDrivers();
    };
    const handleUpdate = async (data: DriverHiringFormData) => {
        if (!formData._id) return;

        const formDataBody = buildDriverFormData(data);

        await updateDriverApplicant({
            id: formData._id,
            body: formDataBody,
        }).unwrap();
        console.log("documents:", data.documents);
        toast.success("Driver applicant updated successfully!");
        setOpen(false);
        refetchDrivers();
    };

    const handleDelete = (_id: string, name?: string) => {
        setDeleteToast({
            open: true,
            message: `Are you sure you want to delete driver applicant ${name ? `"${name}"` : ""}?`,
        });

        setDriverToDelete({ _id, name });
    };

    const confirmDelete = async () => {
        if (!driverToDelete?._id) return;

        await deleteDriverApplicant(driverToDelete._id).unwrap();

        toast.success(
            `Driver applicant ${driverToDelete.name ? `"${driverToDelete.name}"` : ""} deleted successfully!`,
        );

        refetchDrivers();
        setDeleteToast({ open: false, message: "" });
        setDriverToDelete(null);
    };

    const cancelDelete = () => {
        setDeleteToast({ open: false, message: "" });
        setDriverToDelete(null);
    };

    const renderDriverRow = (driver: tDriverHiring) => {
        const tableRowSx: SxProps = {
            bgcolor: theme.currentPalette.background,
            "&:hover": {
                bgcolor: alpha(theme.currentPalette.primary, 0.1),
            },
            transition: "all 0.2s ease-in-out",
        };

        return (
            <>
                <TableRow
                    sx={tableRowSx}
                    key={driver._id}
                    className="transition-colors group"
                >
                    <td className="p-4 text-center">
                        <span
                            style={{
                                color: theme.currentPalette.primary,
                            }}
                        >
                            {driver.name || "-"}
                        </span>
                    </td>
                    <td
                        className="p-4 text-center font-medium"
                        style={{ color: theme.currentPalette.primary }}
                    >
                        {driver.phone || "-"}
                    </td>

                    <td className="p-4">
                        <div
                            className="font-medium text-sm"
                            style={{ color: theme.currentPalette.primary }}
                        >
                            {driver.state || "-"}
                        </div>
                    </td>



                    <td
                        className="p-4 text-center"
                        style={{ color: theme.currentPalette.primary }}
                    >
                        {driver.experienceYears || "-"}
                    </td>

                    <td
                        className="p-4 text-center"
                        style={{ color: theme.currentPalette.primary }}
                    >
                        {
                            driver.readyDate
                                ? new Date(driver.readyDate)
                                    .toLocaleDateString("en-GB")
                                    .replace(/\//g, "-")
                                : "-"
                        }
                    </td>

                    <td className="p-4 text-center">
                        {driver.notes || "-"}
                    </td>

                    <td className="p-4 text-center">
                        {driver.violations || "-"}
                    </td>

                    <td className="p-4 text-center">
                        <Chip
                            label={driver.status || "-"}
                            variant="filled"
                            sx={{
                                bgcolor:
                                    driver.status === "accepted"
                                        ? theme.currentPalette.primary
                                        : alpha(theme.currentPalette.primary, 0.1),
                                color:
                                    driver.status === "accepted"
                                        ? theme.currentPalette.background
                                        : theme.currentPalette.primary,
                                borderRadius: 2,
                                textTransform: "capitalize",
                            }}
                            size="small"
                        />
                    </td>

                    <td className="p-4 text-center">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                setAnchorEl(e.currentTarget);
                            }}
                            sx={{
                                color: theme.currentPalette.primary,
                                "&:hover": {
                                    backgroundColor: alpha(theme.currentPalette.primary, 0.1),
                                },
                            }}
                        >
                            <CircleEllipsis fontSize="small" />
                        </IconButton>

                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={() => setAnchorEl(null)}
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
                                    handleViewClick(driver);
                                    setAnchorEl(null);
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
                                    handleEditClick(driver);
                                    setAnchorEl(null);
                                }}
                                sx={{ fontSize: "14px" }}
                            >
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <Pen size={18} color={theme.currentPalette.primary} />
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

                            {/* <MenuItem
                                onClick={() => {
                                    handleDelete(driver._id);
                                    setAnchorEl(null);
                                }}
                                sx={{ fontSize: "14px", color: "#dc2626" }}
                            >
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <Trash2 size={18} color="#dc2626" />
                                </ListItemIcon>

                                <ListItemText
                                    primary="Delete"
                                    slotProps={{
                                        primary: {
                                            sx: { color: "#dc2626" },
                                        },
                                    }}
                                />
                            </MenuItem> */}

                        </Menu>
                    </td>
                </TableRow>
                <Dialog
                    open={viewOpen}
                    onClose={() => setViewOpen(false)}
                    maxWidth={false}
                    PaperProps={{
                        sx: {
                            width: { xs: "92vw", sm: 560 },
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
                                <Typography sx={{ fontSize: 18, fontWeight: 800 }}>
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

                    {selectedDriver && (
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
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: 20,
                                            fontWeight: 800,
                                            color: theme.currentPalette.primary,
                                        }}
                                    >
                                        {selectedDriver.name || "Driver Applicant"}
                                    </Typography>

                                    <Box
                                        sx={{
                                            px: 1.5,
                                            py: 0.6,
                                            borderRadius: "999px",
                                            bgcolor: theme.currentPalette.primary,
                                            color: "#fff",
                                            fontSize: 12,
                                            fontWeight: 700,
                                            textTransform: "capitalize",
                                        }}
                                    >
                                        {selectedDriver.status || "-"}
                                    </Box>
                                </Box>

                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                        gap: 1.5,
                                    }}
                                >
                                    <DetailCard icon={<User size={17} />} label="Name" value={selectedDriver.name} />

                                    <DetailCard icon={<MapPinned size={17} />} label="State" value={selectedDriver.state} />

                                    <DetailCard icon={<Phone size={17} />} label="Phone" value={selectedDriver.phone} />

                                    <DetailCard
                                        icon={<CalendarDays size={17} />}
                                        label="Ready Date"
                                        value={formatDate(selectedDriver.readyDate)}
                                    />

                                    <DetailCard
                                        icon={<Briefcase size={17} />}
                                        label="Experience"
                                        value={
                                            selectedDriver.experienceYears
                                                ? `${selectedDriver.experienceYears} years`
                                                : "-"
                                        }
                                    />

                                    <DetailCard
                                        icon={<AlertTriangle size={17} />}
                                        label="Violations"
                                        value={selectedDriver.violations}
                                    />

                                    <DetailCard
                                        icon={<FileText size={17} />}
                                        label="Notes"
                                        value={selectedDriver.notes}
                                    />
                                </Box>

                                <Box sx={{ mt: 1.5 }}>
                                    {document?.viewLink ? (
                                        <Box
                                            component="a"
                                            href={document.viewLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1.5,
                                                border: "1px solid #BFD3F0",
                                                borderRadius: "10px",
                                                p: 2,
                                                textDecoration: "none",
                                                color: theme.currentPalette.primary,
                                                fontWeight: 700,
                                                bgcolor: "#fff",
                                                cursor: "pointer",
                                                "&:hover": {
                                                    bgcolor: "#F3F7FF",
                                                },
                                            }}
                                        >
                                            <FileText size={20} />
                                            <Typography sx={{ fontWeight: 700 }}>
                                                Document
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Box
                                            sx={{
                                                border: "1px solid #E5EAF3",
                                                borderRadius: "10px",
                                                p: 2,
                                                color: "#6B7280",
                                                bgcolor: "#fff",
                                            }}
                                        >
                                            No documents uploaded
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Dialog>
            </>
        );

    };

    if (driversLoading && !driversData) return <Loading />;

    if (driverError) {
        const errorMessage = getErrorMessage(driverError);

        if (errorMessage && errorMessage !== error) {
            setError(errorMessage);
        }
    }

    const containerSx: SxProps = {
        p: 3,
    };
    return (
        <Box sx={containerSx}>
            <Toaster position="top-center" />

            <Box sx={{ mt: 4, mb: 5 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatsCard
                        title="Total Applicants"
                        value={statsData.total}
                        icon={UsersRound}
                    />

                    <StatsCard
                        title="Accepted"
                        value={statsData.accepted}
                        icon={UserRoundCheck}
                    />

                    <StatsCard
                        title="Pending"
                        value={statsData.pending}
                        icon={UserRoundX}
                    />
                </div>
            </Box>

            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    p: 2.5,
                    my: 2,
                    border: `1px solid ${alpha(theme.currentPalette.primary, 0.3)}`,
                    borderRadius: 2,
                    backgroundColor: theme.currentPalette.background,
                    width: "100%",
                }}
            >
                {/* Left Section */}
                <Box
                    sx={{
                        minWidth: { xs: "100%", md: 220 },
                        flex: "1 1 220px",
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            color: theme.currentPalette.primary,
                            fontWeight: 700,
                        }}
                    >
                        Driver Applicants
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            color: theme.currentPalette.primary,
                            mt: 0.5,
                            lineHeight: 1.5,
                        }}
                    >
                        Check the list of all hiring driver applicants
                    </Typography>
                </Box>

                {/* Search */}
                <TextField
                    size="small"
                    value={searchTerm}
                    placeholder="Search by applicant id, name..."
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                    }}
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
                <FormControl
                    size="small"
                    sx={{ minWidth: 130, width: { xs: "100%", sm: "auto" } }}
                >
                    <Select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value as TStatusFilter);
                            setPage(1);
                        }}
                        sx={{
                            height: 40,
                            borderRadius: 2,
                            backgroundColor: "#fff",
                            color: theme.currentPalette.primary,
                        }}
                        displayEmpty
                    >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="accepted">Accepted</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                </FormControl>
                {/* Button */}
                <Button
                    onClick={handleOpenCreate}
                    variant="contained"
                    startIcon={<Plus size={20} />}
                    sx={{
                        flex: "0 1 auto",
                        minWidth: { xs: "100%", sm: 180 },
                        height: 48,
                        fontWeight: 700,
                        borderRadius: 2,
                        background: theme.currentPalette.primary,
                        color: theme.currentPalette.background,
                        textTransform: "capitalize",
                        whiteSpace: "nowrap",
                        boxShadow: "none",
                        "&:hover": {
                            background: darken(theme.currentPalette.primary, 0.1),
                            boxShadow: "none",
                        },
                    }}
                >
                    Add Applicant
                </Button>
            </Box>

            {error && (
                <Box sx={{ mb: 3 }}>
                    <Erros message={error} />
                </Box>
            )}

            <DataTable
                columns={driverHiringColumns}
                data={currentData}
                renderRow={renderDriverRow}
                loading={isLoading}
            />

            {driversData?.paginationResult && currentData.length > 0 && (
                <Pagination
                    pagination={driversData.paginationResult}
                    page={page}
                    setPage={setPage}
                    pageSize={10}
                />
            )}

            <DriverHirringForm
                open={open}
                onClose={() => setOpen(false)}
                formData={formData as Partial<tDriverHiring>}
                onSubmit={editMode ? handleUpdate : handleCreate}
                editMode={editMode}
                isLoading={isCreating || isUpdating}
            />

            {/* {deleteToast.open && (
                <Box
                    sx={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.1)",
                        backdropFilter: "blur(2px)",
                        zIndex: 1299,
                    }}
                />
            )} */}

            {/* <Dialog
                open={deleteToast.open}
                onClose={cancelDelete}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                        minWidth: 300,
                        maxWidth: 400,
                        margin: 2,
                    },
                }}
                sx={{
                    zIndex: 1300,
                    "& .MuiDialog-container": {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    },
                }}
            >
                <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                            fontWeight: 600,
                            color: "text.primary",
                        }}
                    >
                        Confirm Delete
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            mb: 3,
                            color: "text.secondary",
                        }}
                    >
                        {deleteToast.message}
                    </Typography>

                    <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={cancelDelete}
                            sx={{
                                borderRadius: 2,
                                minWidth: 80,
                                borderColor: "grey.400",
                                "&:hover": {
                                    borderColor: "grey.600",
                                    backgroundColor: "grey.50",
                                },
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="contained"
                            color="error"
                            onClick={confirmDelete}
                            sx={{
                                borderRadius: 2,
                                minWidth: 80,
                                backgroundColor: "error.main",
                                "&:hover": {
                                    backgroundColor: "error.dark",
                                },
                            }}
                        >
                            Delete
                        </Button>
                    </Box>
                </Box>
            </Dialog> */
            }
        </Box>
    );
};

export default HiringDrivers;