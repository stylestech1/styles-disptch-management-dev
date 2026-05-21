/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    alpha,
    Box,
    Button,
    darken,
    IconButton,
    SxProps,
    TableRow,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import toast, { Toaster } from "react-hot-toast";

import Loading from "@/components/ui/Loading";
import StatsCard from "@/components/ui/StatsCard";
import Erros from "@/components/ui/Erros";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";

import useError from "@/hook/useError";
import useLoading from "@/hook/useLoading";
import { useFilter } from "@/providers/FilterProvider";

import {
    useCreateMaintenanceMutation,
    useDeleteMaintenanceMutation,
    useGetAllMaintenancesQuery,
    useGetAllTrucksQuery,
    useGetMaintenanceWithFilterQuery,
    useGetServiceCentersQuery,
    useLazySearchMaintenancesWithTypeQuery,
    useUpdateMaintenanceMutation,
} from "@/redux/slices/apiSlice";

import { RootState, useAppSelector } from "@/redux/store";
import { TMaintenance } from "@/types/truckType";
import { TPagination, TTruck } from "@/types/globalTypes";
import { getErrorMessage } from "@/utils/getErrorMessage";

import {
    AlertCircle,
    CalendarCog,
    CheckCircle,
    CircleAlert,
    CircleEllipsis,
    Cog,
} from "lucide-react";

// dialogs
import TrucksDialog from "@/components/truck/truckMaintenance/TrucksDialog";
import ActionsMenu from "@/components/truck/truckMaintenance/ActionsMenu";
import DeleteDialog from "@/components/truck/truckMaintenance/DeleteDialog";

import {
    truckMaintenanceMilesColumns,
    truckMaintenanceTimesColumns,
} from "@/data/trucksMaintenanceTable";
import AddEditMaintenanceRecordDialog from "../../admin/(truck)/trucksmaintenance/AddEditMaintenanceRecordDialog";

type TogglePage = "Miles" | "Times";

const TruckMaintenance = () => {
    const theme = useAppSelector((state: RootState) => state.palette);

    const [page, setPage] = useState(1);
    const { fromDate, toDate, isFiltered } = useFilter();
    const { setLoading } = useLoading();
    const { error, setError } = useError();

    const [togglePage, setTogglePage] = useState<TogglePage>("Miles");

    const [openTrucksDialog, setOpenTrucksDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openCreateEditDialog, setOpenCreateEditDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");

    const [selectedMaintenance, setSelectedMaintenance] =
        useState<TMaintenance | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    // ✅ search state
    const [searchTerm, setSearchTerm] = useState("");
    const isSearching = !!searchTerm.trim();

    const repeatBy = togglePage === "Miles" ? "mile" : "time";

    // ======== Queries ========
    const {
        data: trucksData,
        isLoading: isTrucksLoading,
        error: trucksError,
    } = useGetAllTrucksQuery(
        {
            refetchOnFocus: false,
            refetchOnReconnect: false,
            refetchOnMountOrArgChange: false,
        } as any,
    );

    const {
        data: centersData,
        error: centersError,
    } = useGetServiceCentersQuery(
        { page: 1, limit: 200 },
        {
            refetchOnFocus: false,
            refetchOnReconnect: false,
            refetchOnMountOrArgChange: false,
        },
    );

    const maintenanceCenters = useMemo(() => {
        const list = (centersData as any)?.data ?? [];
        return list.map((c: any) => ({
            id: String(c.id),
            name: c.name ?? c.centerName ?? c.title ?? "--",
        }));
    }, [centersData]);

    const centerIdToNameMap = useMemo(() => {
        const map: Record<string, string> = {};
        maintenanceCenters.forEach((c: { id: string | number; name: string; }) => (map[c.id] = c.name));
        return map;
    }, [maintenanceCenters]);

    const {
        data: maintenanceData,
        isLoading: isMaintenanceLoading,
        error: isMaintenanceError,
        refetch: maintenanceFetch,
    } = useGetAllMaintenancesQuery(
        { page, limit: 10, repeatBy },
        {
            refetchOnFocus: false,
            refetchOnReconnect: false,
            refetchOnMountOrArgChange: false,
        },
    );

    const { data: filteredData } = useGetMaintenanceWithFilterQuery(
        {
            from: fromDate ? fromDate.format("YYYY-MM-DD") : undefined,
            to: toDate ? toDate.format("YYYY-MM-DD") : undefined,
            page,
            limit: 10,
            repeatBy,
        } as any,
        { skip: !isFiltered || !fromDate || !toDate, refetchOnFocus: false },
    );

    // ✅ server search (if you have it)
    const [
        triggerSearchQuery,
        {
            data: maintenanceSearchData,
            isLoading: isSearchLoading,
            error: searchError,
            reset: resetSearchQuery,
        },
    ] = useLazySearchMaintenancesWithTypeQuery();

    // ======== Mutations ========
    const [createMaintenance, { isLoading: isCreating }] =
        useCreateMaintenanceMutation();
    const [updateMaintenance, { isLoading: isUpdating }] =
        useUpdateMaintenanceMutation();
    const [deleteMaintenance, { isLoading: isDeleting }] =
        useDeleteMaintenanceMutation();

    const serviceTypes = [
        "Oil Change",
        "Tire Rotation",
        "Brake Inspection",
        "Engine Tune-up",
        "Transmission Service",
        "Electrical Check",
        "Preventive Maintenance",
        "Emergency Repair",
    ];

    // ======== Search (debounced) ========
    useEffect(() => {
        const t = setTimeout(() => {
            const term = searchTerm.trim();

            // empty => back to normal
            if (!term) {
                resetSearchQuery();
                return;
            }

            // ✅ if your endpoint expects object:
            triggerSearchQuery({ term, repeatBy, page: 1, limit: 10 } as any);

            // ❗ if your endpoint expects string ONLY, use:
            // triggerSearchQuery(term as any);
        }, 400);

        return () => clearTimeout(t);
    }, [searchTerm, repeatBy]);

    // reset page when date filter changes
    useEffect(() => {
        if (isFiltered && fromDate && toDate) setPage(1);
    }, [isFiltered, fromDate, toDate, repeatBy]);

    // reset search when toggle changes (recommended)
    useEffect(() => {
        setPage(1);
        setSearchTerm("");
        resetSearchQuery();
    }, [togglePage]);

    // ======== Trucks options ========
    const trucks = useMemo(() => {
        if (!(trucksData as any)?.data) return [];
        return (trucksData as any).data.map((truck: TTruck) => ({
            id: (truck as any).id,
            plateNumber: (truck as any).plateNumber || "--",
        }));
    }, [trucksData]);

    // ======== Choose base data source ========
    const baseData = useMemo(() => {
        // priority: date filter > normal list
        if (isFiltered && (filteredData as any)?.data) return (filteredData as any).data as TMaintenance[];
        return ((maintenanceData as any)?.data ?? []) as TMaintenance[];
    }, [isFiltered, filteredData, maintenanceData]);

    /**
     * ✅ Final rows logic:
     * 1) If searching and server returned results => use them
     * 2) Else fallback to CLIENT filter on current baseData (so typing always shows matching rows)
     */
    const maintenance: TMaintenance[] = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        if (isSearching) {
            const serverRows = (maintenanceSearchData as any)?.data;
            if (Array.isArray(serverRows)) return serverRows;

            // fallback: local filter
            return baseData.filter((x: any) =>
                String(x?.type ?? "").toLowerCase().includes(term),
            );
        }

        return baseData;
    }, [isSearching, searchTerm, maintenanceSearchData, baseData]);

    const pagination: TPagination = useMemo(() => {
        // hide pagination during search (because search results may not match current page)
        if (isSearching) return null;

        if (isFiltered) return (filteredData as any)?.paginationResult ?? null;
        return (maintenanceData as any)?.paginationResult ?? null;
    }, [isSearching, isFiltered, filteredData, maintenanceData]);

    // ======== Loading / Errors ========
    useEffect(() => {
        setLoading(isMaintenanceLoading && !maintenanceData);
    }, [isMaintenanceLoading, maintenanceData, setLoading]);

    useEffect(() => {
        if (isMaintenanceError) {
            const msg = getErrorMessage(isMaintenanceError);
            setError(msg);
            toast.error(msg || "Failed to load maintenance data ❌");
        }
    }, [isMaintenanceError, setError]);

    useEffect(() => {
        if (trucksError) toast.error(`Failed to load trucks: ${getErrorMessage(trucksError)}`);
    }, [trucksError]);

    useEffect(() => {
        if (centersError) toast.error(`Failed to load centers: ${getErrorMessage(centersError)}`);
    }, [centersError]);

    useEffect(() => {
        if (searchError) {
            // not fatal (we fallback to local filter)
            console.warn("search error:", searchError);
        }
    }, [searchError]);

    // ======== Toggle ========
    const handleToggleChange = (
        _event: React.MouseEvent<HTMLElement>,
        newToggle: TogglePage,
    ) => {
        if (!newToggle || newToggle === togglePage) return;
        setTogglePage(newToggle);
    };

    // ======== Dialogs helpers ========
    const handleViewTrucks = (maintenanceItem: TMaintenance) => {
        setSelectedMaintenance(maintenanceItem);
        setOpenTrucksDialog(true);
    };

    const handleEditClick = (maintenanceItem: TMaintenance) => {
        setSelectedMaintenance(maintenanceItem);
        setDialogMode("edit");
        setOpenCreateEditDialog(true);
        setAnchorEl(null);
    };

    const handleDeleteClick = (maintenanceItem: TMaintenance) => {
        setSelectedMaintenance(maintenanceItem);
        setOpenDeleteDialog(true);
        setAnchorEl(null);
    };

    const handleDelete = async () => {
        if (!selectedMaintenance) return;

        const loadingId = toast.loading("Deleting...");
        try {
            await deleteMaintenance((selectedMaintenance as any).id!).unwrap();
            toast.success("Maintenance record deleted successfully!", { id: loadingId });
            setOpenDeleteDialog(false);
            setSelectedMaintenance(null);
            maintenanceFetch();
        } catch (err: any) {
            toast.error(getErrorMessage(err), { id: loadingId });
        }
    };

    const handleCreateEditSubmit = async (payload: any) => {
        const loadingId = toast.loading(dialogMode === "add" ? "Creating..." : "Updating...");

        try {
            if (dialogMode === "add") {
                await createMaintenance(payload).unwrap();
                toast.success("Created successfully", { id: loadingId });
            } else {
                if (!(selectedMaintenance as any)?.id) {
                    toast.error("No maintenance selected", { id: loadingId });
                    return;
                }
                await updateMaintenance({ id: (selectedMaintenance as any).id, ...payload }).unwrap();
                toast.success("Updated successfully", { id: loadingId });
            }

            setOpenCreateEditDialog(false);
            setSelectedMaintenance(null);
            maintenanceFetch();
        } catch (err: any) {
            toast.error(getErrorMessage(err), { id: loadingId });
        }
    };

    const handleCloseTrucksDialog = () => {
        setOpenTrucksDialog(false);
        setSelectedMaintenance(null);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setSelectedMaintenance(null);
    };

    // Status badge helper
    const getStatusInfo = (status: string) => {
        switch (status?.toLowerCase()) {
            case "upcoming":
                return { bg: "#FFFBEB", color: "#D97706", icon: <AlertCircle size={18} />, text: "Upcoming" };
            case "overdue":
                return { bg: "#FEF2F2", color: "#DC2626", icon: <AlertCircle size={18} />, text: "Overdue" };
            case "completed":
                return { bg: "#F0FDF4", color: "#16A34A", icon: <CheckCircle size={18} />, text: "Completed" };
            default:
                return { bg: "#F3F4F6", color: "#6B7280", icon: <AlertCircle size={18} />, text: status || "Unknown" };
        }
    };

    // ======== Table renderers ========
    const renderMileRow = (item: TMaintenance, index: number) => {
        const tableRowSx: SxProps = {
            bgcolor: theme.currentPalette.background,
            "&:hover": { bgcolor: alpha(theme.currentPalette.primary, 0.1) },
            transition: "all 0.2s ease-in-out",
        };

        return (
            <TableRow sx={tableRowSx} key={index}>
                <td style={{ color: theme.currentPalette.primary }} className="p-4 text-center">
                    <span
                        style={{ backgroundColor: alpha(theme.currentPalette.primary, 0.1) }}
                        className="py-1 px-2 rounded-md"
                    >
                        {(item as any).type}
                    </span>
                </td>

                <td style={{ color: theme.currentPalette.primary }} className="p-4 text-center">
                    {/* show center name even if backend returns id */}
                    {centerIdToNameMap[String((item as any).serviceCenter ?? (item as any).maintenanceCenterId ?? "")] ||
                        (item as any).serviceCenter ||
                        "-"}
                </td>

                <td style={{ color: theme.currentPalette.primary }} className="p-4 text-right">
                    {(item as any).intervalMile || "--"} Miles
                </td>

                <td style={{ color: theme.currentPalette.primary }} className="p-4 text-right">
                    {(item as any).remindBeforeMile || "--"} Miles
                </td>

                <td style={{ color: theme.currentPalette.primary }} className="p-4 text-center">
                    <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                setAnchorEl(e.currentTarget);
                                setSelectedMaintenance(item);
                            }}
                            sx={{
                                color: theme.currentPalette.primary,
                                "&:hover": { backgroundColor: alpha(theme.currentPalette.primary, 0.1) },
                            }}
                        >
                            <CircleEllipsis fontSize="small" />
                        </IconButton>
                    </Box>
                </td>
            </TableRow>
        );
    };

    const renderTimeRow = (item: TMaintenance, index: number) => {
        const tableRowSx: SxProps = {
            bgcolor: theme.currentPalette.background,
            "&:hover": { bgcolor: alpha(theme.currentPalette.primary, 0.1) },
            transition: "all 0.2s ease-in-out",
        };

        return (
            <TableRow sx={tableRowSx} key={index}>
                <td style={{ color: theme.currentPalette.primary }} className="p-4 text-center">
                    <span
                        style={{ backgroundColor: alpha(theme.currentPalette.primary, 0.1) }}
                        className="py-1 px-2 rounded-md"
                    >
                        {(item as any).type}
                    </span>
                </td>

                <td style={{ color: theme.currentPalette.primary }} className="p-4 text-center">
                    {centerIdToNameMap[String((item as any).serviceCenter ?? (item as any).maintenanceCenterId ?? "")] ||
                        (item as any).serviceCenter ||
                        "-"}
                </td>

                <td style={{ color: theme.currentPalette.primary }} className="p-4 text-right">
                    {(item as any).intervalDays || "--"} Days
                </td>

                <td style={{ color: theme.currentPalette.primary }} className="p-4 text-right">
                    {(item as any).remindBeforeDays || "--"} Days
                </td>

                <td style={{ color: theme.currentPalette.primary }} className="p-4 text-center">
                    <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                setAnchorEl(e.currentTarget);
                                setSelectedMaintenance(item);
                            }}
                            sx={{
                                color: theme.currentPalette.primary,
                                "&:hover": { backgroundColor: alpha(theme.currentPalette.primary, 0.1) },
                            }}
                        >
                            <CircleEllipsis fontSize="small" />
                        </IconButton>
                    </Box>
                </td>
            </TableRow>
        );
    };

    // ======== Stats ========
    const statsData = useMemo(() => {
        const statLoadData = (maintenanceData as any)?.stats || {};
        return {
            totalMaintenance: statLoadData.total || 0,
            upcoming: statLoadData.upcoming || 0,
            overdue: statLoadData.overdue || 0,
        };
    }, [(maintenanceData as any)?.stats]);

    // initial loading
    const isInitialLoading = (isMaintenanceLoading && !maintenanceData) || isTrucksLoading;
    if (isInitialLoading) return <Loading />;

    const isLoading =
        isMaintenanceLoading ||
        isSearchLoading;

    const containerSx: SxProps = { p: 3 };

    const searchFilterContainerSx: SxProps = {
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
        alignItems: { xs: "flex-start", lg: "center" },
        justifyContent: "space-between",
        gap: { xs: 3, lg: 0 },
        p: 2,
        my: 2,
        border: `1px solid ${alpha(theme.currentPalette.primary, 0.3)}`,
        borderRadius: 2,
        backgroundColor: theme.currentPalette.background,
        width: "100%",
    };

    return (
        <Box sx={containerSx}>
            <Toaster position="top-center" />

            {error && (
                <Box sx={{ mb: 3 }}>
                    <Erros message={error} />
                </Box>
            )}

            {/* Toggle */}
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <ToggleButtonGroup
                    value={togglePage}
                    exclusive
                    onChange={handleToggleChange}
                    aria-label="view type"
                    size="medium"
                    sx={{
                        "& .MuiToggleButton-root": {
                            borderColor: theme.currentPalette.primary,
                            color: theme.currentPalette.text,
                            "&.Mui-selected": {
                                backgroundColor: theme.currentPalette.primary,
                                color: theme.currentPalette.background,
                                "&:hover": { backgroundColor: darken(theme.currentPalette.primary, 0.1) },
                            },
                        },
                    }}
                >
                    <ToggleButton value="Miles" aria-label="miles" sx={{ px: 5 }}>
                        Miles
                    </ToggleButton>
                    <ToggleButton value="Times" aria-label="times" sx={{ px: 5 }}>
                        Time
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Stats */}
            <Box sx={{ mt: 4, mb: 5 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-10">
                    <StatsCard
                        title={togglePage === "Miles" ? "Active Maintenance" : "Total Maintenance"}
                        value={statsData.totalMaintenance}
                        icon={Cog}
                        iconColor={theme.currentPalette.primary}
                    />
                    <StatsCard
                        title="Trucks Upcoming for Service"
                        value={statsData.upcoming}
                        icon={CalendarCog}
                        iconColor={theme.currentPalette.primary}
                    />
                    <StatsCard
                        title="Trucks Overdue for Service"
                        value={statsData.overdue}
                        icon={CircleAlert}
                        iconColor={theme.currentPalette.primary}
                    />
                </div>
            </Box>

            {/* Header/Search/Add */}
            <Box sx={searchFilterContainerSx}>
                <Box>
                    <Typography variant="h6" sx={{ color: theme.currentPalette.primary, fontWeight: 700 }}>
                        Fleet Maintenance Status
                    </Typography>
                    <Typography variant="body2" sx={{ color: alpha(theme.currentPalette.text, 0.7), fontWeight: 400 }}>
                        Real-time maintenance tracking across all vehicles
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        flexDirection: { xs: "column", lg: "row" },
                        gap: 2,
                        width: { xs: "100%", lg: "auto" },
                    }}
                >
                    <SearchInput
                        value={searchTerm}
                        onChange={(val: any) => {
                            const next = typeof val === "string" ? val : val?.target?.value ?? "";
                            setPage(1);
                            setSearchTerm(next);
                        }}
                        placeholder="Search By Service Type..."
                        showClearButton
                        sx={{ width: { xs: "100%", sm: "100%", md: 280, lg: 350 } }}
                        inputSx={{
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                backgroundColor: theme.currentPalette.background,
                                height: 36,
                                "&:hover": { borderColor: theme.currentPalette.primary },
                            },
                        }}
                    />

                    <Button
                        variant="contained"
                        onClick={() => {
                            setDialogMode("add");
                            setSelectedMaintenance(null);
                            setOpenCreateEditDialog(true);
                        }}
                        sx={{
                            bgcolor: theme.currentPalette.primary,
                            color: theme.currentPalette.background,
                            borderRadius: 2,
                            px: 5,
                            fontWeight: 800,
                            textTransform: "none",
                            display: "flex",
                            flexDirection: "row",
                            height: 36,
                            gap: "4px",
                            "&:hover": { bgcolor: darken(theme.currentPalette.primary, 0.1) },
                            width: { xs: "100%", lg: "auto" },
                        }}
                    >
                        <span>Add</span>
                        <span>Record</span>
                    </Button>
                </Box>
            </Box>

            {/* Table */}
            <DataTable
                columns={togglePage === "Miles" ? truckMaintenanceMilesColumns : truckMaintenanceTimesColumns}
                data={maintenance}
                renderRow={togglePage === "Miles" ? renderMileRow : renderTimeRow}
                loading={isLoading}
            />

            {/* Pagination (hide during search) */}
            {!isSearching && pagination && maintenance.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Pagination pagination={pagination} page={page} setPage={setPage} pageSize={10} showInfo />
                </Box>
            )}

            {/* Dialogs */}
            <TrucksDialog
                open={openTrucksDialog}
                onClose={handleCloseTrucksDialog}
                selectedMaintenance={selectedMaintenance}
                getStatusInfo={getStatusInfo}
            />

            <ActionsMenu
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                selectedMaintenance={selectedMaintenance}
                onViewTrucks={handleViewTrucks}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
            />

            <DeleteDialog
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
                onDelete={handleDelete}
                selectedMaintenance={selectedMaintenance}
                isDeleting={isDeleting}
            />

            <AddEditMaintenanceRecordDialog
                open={openCreateEditDialog}
                mode={dialogMode}
                repeatBy={dialogMode === "edit" ? ((selectedMaintenance?.repeatBy as any) || repeatBy) : repeatBy}
                primaryColor={theme.currentPalette.primary}
                isSubmitting={isCreating || isUpdating}
                serviceTypes={serviceTypes}
                trucks={trucks}
                maintenanceCenters={maintenanceCenters}
                initialValues={
                    dialogMode === "edit" && selectedMaintenance
                        ? {
                            type: (selectedMaintenance as any).type,
                            serviceCenter: String(
                                (selectedMaintenance as any).serviceCenter ??
                                (selectedMaintenance as any).maintenanceCenterId ??
                                "",
                            ),
                            intervalMile: (selectedMaintenance as any).intervalMile,
                            remindBeforeMile: (selectedMaintenance as any).remindBeforeMile,
                            intervalDays: (selectedMaintenance as any).intervalDays,
                            remindBeforeDays: (selectedMaintenance as any).remindBeforeDays,
                            statusPerTruck: ((selectedMaintenance as any).statusPerTruck ?? []).map((t: any) => ({
                                truckId: t.truckId,
                                lastDoneMile: t.lastDoneMile,
                                lastDoneAt: t.lastDoneAt || null,
                            })),
                        }
                        : undefined
                }
                onClose={() => {
                    setOpenCreateEditDialog(false);
                    setSelectedMaintenance(null);
                }}
                onSubmit={handleCreateEditSubmit}
            />
        </Box>
    );
};

export default TruckMaintenance;
