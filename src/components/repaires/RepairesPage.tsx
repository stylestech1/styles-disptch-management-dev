/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

import DataTable from "@/components/ui/DataTable";
import Erros from "@/components/ui/Erros";
import Loading from "@/components/ui/Loading";
import Pagination from "@/components/ui/Pagination";
import StatsCard from "@/components/ui/StatsCard";

import { RootState, useAppSelector } from "@/redux/store";
import {
    useCreateRepairMutation,
    useGetRepairsQuery,
    useGetRepairByIdQuery,
    useUpdateRepairMutation,
} from "@/redux/slices/apiSlice";

import { getErrorMessage } from "@/utils/getErrorMessage";
import { repairColumns } from "@/data/repairsTable";
import {
    CreateEditRepaires,
    RepairFormData,
} from "@/components/repaires/AddEditRepaires";

import {
    alpha,
    Box,
    Button,
    Chip,
    FormControl,
    IconButton,
    MenuItem,
    Select,
    SelectChangeEvent,
    TableRow,
    TextField,
    Typography,
    Menu,
    Tooltip,
} from "@mui/material";

import {
    Edit,
    Wrench,
    Clock,
    CheckCircle,
    X,
    LoaderCircle,
    MoreHorizontal,
    Eye,
} from "lucide-react";

type RepairStatusFilter = "all" | "pending" | "in_progress" | "completed";
type ExistingRepairFile = {
    viewLink?: string;
    downloadLink?: string;
    uploadedAt?: string;
    fileName?: string;
};

type RepairItem = {
    _id?: string;
    id?: string;
    truck?: {
        id?: string;
        _id?: string;
        truckId?: number;
        truckNumber?: string;
        model?: string;
    };
    truckId?: string;
    title?: string;
    description?: string;
    status?: "pending" | "in_progress" | "completed";
    cost?: number;
    repairDate?: string;
    note?: string;
    repairLocation?: {
        type?: "on_road" | "repair_shop";
        location?: string;
        phoneNumber?: string;
        shopName?: string;
    };
    uploadedReceipts?: ExistingRepairFile[];
    additionalPhotos?: ExistingRepairFile[];
};

const CONTROL_H = 42;

const toTitle = (value?: string) =>
    (value || "-")
        .replaceAll("_", " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

const StatusChip = ({ status, theme }: { status?: string; theme: any }) => {
    const primary = theme.currentPalette.primary;

    const label = toTitle(status);

    return (
        <Chip
            label={label}
            size="small"
            sx={{
                height: 26,
                borderRadius: 2,
                bgcolor:
                    status === "completed"
                        ? primary
                        : status === "in_progress"
                            ? alpha(primary, 0.75)
                            : alpha(primary, 0.1),
                color: status === "pending" ? primary : "#fff",
                border: `1px solid ${alpha(primary, 0.25)}`,
                "& .MuiChip-label": {
                    fontWeight: 800,
                    fontSize: 12,
                },
            }}
        />
    );
};

const buildRepairFormData = (values: RepairFormData) => {
    const formData = new FormData();

    formData.append("truckId", values.truckId);
    formData.append("title", values.title);
    formData.append("description", values.description || "");
    formData.append("status", values.status || "pending");
    formData.append("cost", String(values.cost));

    const isoRepairDate = values.repairDate
        ? new Date(values.repairDate).toISOString()
        : "";

    formData.append("repairDate", isoRepairDate);
    formData.append("note", values.note || "");

    formData.append("repairLocation[type]", values.repairLocation.type);
    formData.append(
        "repairLocation[location]",
        values.repairLocation.location || ""
    );
    formData.append(
        "repairLocation[phoneNumber]",
        values.repairLocation.phoneNumber || ""
    );
    formData.append(
        "repairLocation[shopName]",
        values.repairLocation.shopName || ""
    );

    values.uploadedReceipts?.forEach((file) => {
        formData.append("uploadedReceipts", file);
    });

    values.additionalPhotos?.forEach((file) => {
        formData.append("additionalPhotos", file);
    });

    return formData;
};

const mapRepairToFormData = (repair: RepairItem): Partial<RepairFormData> => ({
    truckId:
        repair.truck?.id ||
        repair.truck?._id ||
        repair.truckId ||
        "",
    truck: repair.truck,
    title: repair.title || "",
    description: repair.description || "",
    status: repair.status || "pending",
    cost: repair.cost != null ? String(repair.cost) : "",
    repairDate: repair.repairDate || "",
    note: repair.note || "",
    repairLocation: {
        type: repair.repairLocation?.type || "repair_shop",
        location: repair.repairLocation?.location || "",
        phoneNumber: repair.repairLocation?.phoneNumber || "",
        shopName: repair.repairLocation?.shopName || "",
    },
    existingReceipts: repair.uploadedReceipts || [],
    existingPhotos: repair.additionalPhotos || [],
});

const shortText = (value?: string, max = 20) => {
    if (!value) return "-";
    return value.length > max ? `${value.slice(0, max)}...` : value;
};

const RepairPage = () => {
    const theme = useAppSelector((state: RootState) => state.palette);

    const [page, setPage] = useState(1);
    const [keyword, setKeyword] = useState("");
    const [activeKeyword, setActiveKeyword] = useState("");
    const [statusFilter, setStatusFilter] =
        useState<RepairStatusFilter>("all");

    const [showCreateEditModal, setShowCreateEditModal] = useState(false);
    const [editingRepairId, setEditingRepairId] = useState<string | null>(null);
    const [actionAnchorEl, setActionAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedActionRepair, setSelectedActionRepair] =
        useState<RepairItem | null>(null);

    const actionMenuOpen = Boolean(actionAnchorEl);

    const {
        data: repairDetailsData,
        isFetching: isFetchingRepairDetails,
    } = useGetRepairByIdQuery(editingRepairId!, {
        skip: !editingRepairId,
    });


    const editingRepair = repairDetailsData?.data || null;

    const {
        data: repairsData,
        isLoading,
        error,
        refetch,
    } = useGetRepairsQuery(
        { page, limit: 10 },
        {
            refetchOnFocus: false,
            refetchOnReconnect: false,
        }
    );

    const [createRepair, { isLoading: isCreating }] =
        useCreateRepairMutation();

    const [updateRepair, { isLoading: isUpdating }] =
        useUpdateRepairMutation();

    const allRepairs: RepairItem[] = useMemo(() => {
        return repairsData?.data || [];
    }, [repairsData]);

    const repairs = useMemo(() => {
        let result = allRepairs;

        if (statusFilter !== "all") {
            result = result.filter((item) => item.status === statusFilter);
        }

        if (activeKeyword.trim()) {
            const search = activeKeyword.toLowerCase();

            result = result.filter((item) => {
                return (
                    item.title?.toLowerCase().includes(search) ||
                    item.truckId?.toLowerCase().includes(search) ||
                    item.repairLocation?.location?.toLowerCase().includes(search) ||
                    item.repairLocation?.shopName?.toLowerCase().includes(search)
                );
            });
        }

        return result;
    }, [allRepairs, statusFilter, activeKeyword]);

    const pagination = repairsData?.paginationResult || null;

    const statsData = useMemo(() => {
        return {
            total: allRepairs.length,
            pending: allRepairs.filter((item) => item.status === "pending").length,
            inProgress: allRepairs.filter((item) => item.status === "in_progress")
                .length,
            completed: allRepairs.filter((item) => item.status === "completed")
                .length,
        };
    }, [allRepairs]);

    const handleCreateRepair = async (data: RepairFormData) => {
        try {
            const formData = buildRepairFormData(data);
            await createRepair(formData).unwrap();

            toast.success("Repair created successfully");
            setShowCreateEditModal(false);
            setEditingRepairId(null);
            refetch();
        } catch (err) {
            toast.error(getErrorMessage(err) || "Failed to create repair");
        }
    };

    const handleUpdateRepair = async (data: RepairFormData) => {
        if (!editingRepairId) {
            toast.error("Repair ID is missing");
            return;
        }

        try {
            const formData = buildRepairFormData(data);

            await updateRepair({
                id: editingRepairId,
                body: formData,
            }).unwrap();

            toast.success("Repair updated successfully");
            setShowCreateEditModal(false);
            setEditingRepairId(null);
            refetch();
        } catch (err) {
            toast.error(getErrorMessage(err) || "Failed to update repair");
        }
    };

    const onChangeStatus = (e: SelectChangeEvent) => {
        setPage(1);
        setStatusFilter(e.target.value as RepairStatusFilter);
    };

    const renderRepairRow = (repair: RepairItem) => {
        const id = repair._id || repair.id;

        return (
            <TableRow
                key={id}
                sx={{
                    bgcolor: theme.currentPalette.background,
                    "&:hover": {
                        bgcolor: alpha(theme.currentPalette.primary, 0.08),
                    },
                }}
            >
                <td className="p-4 text-center">
                    <Typography sx={{ fontWeight: 700, color: theme.currentPalette.primary }}>
                        {repair?.truck?.truckNumber || "-"}
                    </Typography>
                </td>
                <td className="p-4 text-center">
                    <Tooltip title={repair.title || ""}>
                        <Typography sx={{ fontWeight: 700, color: theme.currentPalette.primary }}>
                            {shortText(repair.title, 20)}
                        </Typography>
                    </Tooltip>
                </td>

                <td className="p-4 text-center">
                    <Tooltip title={repair.description || ""}>
                        <Typography sx={{ fontWeight: 700, color: theme.currentPalette.primary }}>
                            {shortText(repair.description, 20)}
                        </Typography>
                    </Tooltip>
                </td>


                <td className="p-4 text-center">
                    <StatusChip status={repair.status} theme={theme} />
                </td>
                <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                        <Typography
                            sx={{
                                fontWeight: 700,
                                color: theme.currentPalette.primary,
                                fontSize: 13,
                            }}
                        >
                            {repair.repairLocation?.location || "-"}
                        </Typography>

                        {repair.repairLocation?.shopName && (
                            <Typography
                                sx={{
                                    fontSize: 12,
                                    color: "#666",
                                }}
                            >
                                {repair.repairLocation.shopName}
                            </Typography>
                        )}

                        {repair.repairLocation?.phoneNumber && (
                            <Typography
                                sx={{
                                    fontSize: 12,
                                    color: "#999",
                                }}
                            >
                                {repair.repairLocation.phoneNumber}
                            </Typography>
                        )}
                    </div>
                </td>
                <td className="p-4 text-center">
                    {repair.cost != null ? `$${repair.cost}` : "-"}
                </td>

                <td className="p-4 text-center">
                    {repair.repairDate
                        ? new Date(repair.repairDate).toLocaleDateString()
                        : "-"}
                </td>

                <td className="p-4 text-center">
                    <Tooltip title={repair.note || ""}>
                        <Typography>
                            {shortText(repair.note, 20)}
                        </Typography>
                    </Tooltip>
                </td>

                {/* <td className="p-4 text-center">
          <IconButton
            onClick={(e) => {
              setActionAnchorEl(e.currentTarget);
              setSelectedActionRepair(repair);
            }}
          >
            <MoreHorizontal size={20} color={theme.currentPalette.primary} />
          </IconButton>
        </td> */}
                <td className="p-4 text-center">
                    <IconButton
                        onClick={() => {
                            setEditingRepairId(repair._id || repair.id || null);
                            setShowCreateEditModal(true);
                        }}
                    >
                        <Edit size={18} color={theme.currentPalette.primary} />
                    </IconButton>
                </td>

            </TableRow>
        );
    };

    if (isLoading) return <Loading />;

    return (
        <Box sx={{ p: 3 }}>
            <Toaster position="top-center" />

            <Box sx={{ mt: 4, mb: 5 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title="Total Repairs"
                        value={statsData.total}
                        icon={Wrench}
                        iconColor={theme.currentPalette.primary}
                    />
                    <StatsCard
                        title="Pending"
                        value={statsData.pending}
                        icon={Clock}
                        iconColor={theme.currentPalette.primary}
                    />
                    <StatsCard
                        title="In Progress"
                        value={statsData.inProgress}
                        icon={LoaderCircle}
                        iconColor={theme.currentPalette.primary}
                    />
                    <StatsCard
                        title="Completed"
                        value={statsData.completed}
                        icon={CheckCircle}
                        iconColor={theme.currentPalette.primary}
                    />
                </div>
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 3fr" },
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    my: 2,
                    border: `1px solid ${alpha(theme.currentPalette.primary, 0.25)}`,
                    borderRadius: 2,
                }}
            >
                <Box>
                    <Typography
                        variant="h6"
                        sx={{ color: theme.currentPalette.primary, fontWeight: 900 }}
                    >
                        Repair Details
                    </Typography>
                    <Typography variant="body2" sx={{ color: alpha(theme.currentPalette.text, 0.55) }}>
                        Check list of all repairs
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        flexWrap: "wrap",
                        gap: 1.2,
                    }}
                >
                    <TextField
                        size="small"
                        value={keyword}
                        placeholder="Search repairs..."
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                setPage(1);
                                setActiveKeyword(keyword.trim());
                            }
                        }}
                        InputProps={{
                            endAdornment: keyword ? (
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setKeyword("");
                                        setActiveKeyword("");
                                    }}
                                >
                                    <X size={16} color="red" />
                                </IconButton>
                            ) : null,
                        }}
                        sx={{
                            width: { xs: "100%", sm: 300 },
                            "& .MuiOutlinedInput-root": {
                                height: CONTROL_H,
                                borderRadius: 2,
                                backgroundColor: "#fff",
                            },
                        }}
                    />

                    <FormControl size="small" sx={{ width: { xs: "100%", sm: 150 } }}>
                        <Select
                            value={statusFilter}
                            onChange={onChangeStatus}
                            sx={{
                                height: CONTROL_H,
                                borderRadius: 2,
                                backgroundColor: "#fff",
                            }}
                        >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="in_progress">In Progress</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        sx={{ height: CONTROL_H, width: { xs: "100%", sm: 130 } }}
                        onClick={() => {
                            setEditingRepairId(null);
                            setShowCreateEditModal(false);

                            setTimeout(() => {
                                setShowCreateEditModal(true);
                            }, 0);
                        }}
                    >
                        Add Repair
                    </Button>
                </Box>
            </Box>

            {error && (
                <Box sx={{ mb: 3 }}>
                    <Erros message={getErrorMessage(error)} />
                </Box>
            )}

            <DataTable
                columns={repairColumns}
                data={repairs}
                renderRow={renderRepairRow}
                loading={isLoading}
            />

            {pagination && repairs.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Pagination
                        pagination={pagination}
                        page={page}
                        setPage={setPage}
                        pageSize={10}
                        showInfo
                    />
                </Box>
            )}

            <CreateEditRepaires
                key={editingRepairId ? `edit-${editingRepairId}` : "create"}
                open={showCreateEditModal}
                onClose={() => {
                    setShowCreateEditModal(false);
                    setEditingRepairId(null);
                }}
                editMode={!!editingRepairId}
                formData={
                    editingRepairId && editingRepair
                        ? mapRepairToFormData(editingRepair)
                        : undefined
                }
                isLoading={isCreating || isUpdating || isFetchingRepairDetails}
                onSubmit={editingRepairId ? handleUpdateRepair : handleCreateRepair}
            />
            {/* <Menu
        anchorEl={actionAnchorEl}
        open={actionMenuOpen}
        onClose={() => {
          setActionAnchorEl(null);
          setSelectedActionRepair(null);
        }}
      >
        <MenuItem
          onClick={() => {
            const id = selectedActionRepair?._id || selectedActionRepair?.id;

            if (!id) {
              toast.error("Repair ID is missing");
              return;
            }

            setEditingRepairId(id);
            setShowCreateEditModal(true);
            setActionAnchorEl(null);
            setSelectedActionRepair(null);
          }}
        >
          <Edit size={16} className="mr-2" />
          Edit
        </MenuItem>

        <MenuItem
          onClick={() => {
            const id = selectedActionRepair?._id || selectedActionRepair?.id;

            if (!id) {
              toast.error("Repair ID is missing");
              return;
            }

            // change this route if your view page route is different
            window.open(`/admin/repairs/${id}`, "_blank");
            setActionAnchorEl(null);
            setSelectedActionRepair(null);
          }}
        >
          <Eye size={16} className="mr-2" />
          View
        </MenuItem>
      </Menu> */}

        </Box>
    );
};

export default RepairPage;