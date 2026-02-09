/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Loading from "@/components/ui/Loading";
import StatsCard from "@/components/ui/StatsCard";
import useError from "@/hook/useError";
import useLoading from "@/hook/useLoading";
import Erros from "@/components/ui/Erros";
import { useFilter } from "@/providers/FilterProvider";
import {
  useGetAllMaintenancesQuery,
  useGetMaintenanceWithFilterQuery,
  useGetAllTrucksQuery,
  useCreateMaintenanceMutation,
  useUpdateMaintenanceMutation,
  useDeleteMaintenanceMutation,
  useLazySearchMaintenancesWithTypeQuery,
  useLazyFilterMaintenancesWithTypeQuery,
} from "@/redux/slices/apiSlice";
import { RootState, useAppSelector } from "@/redux/store";
import { TMaintenance } from "@/types/truckType";
import { getErrorMessage } from "@/utils/getErrorMessage";
import {
  alpha,
  Box,
  Button,
  darken,
  SxProps,
  TableRow,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
} from "@mui/material";
import {
  ClockAlert,
  TriangleAlert,
  TruckElectric,
  CircleEllipsis,
  AlertCircle,
  CheckCircle,
  Cog,
  CalendarCog,
  CircleAlert,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import DataTable from "@/components/ui/DataTable";
import {
  truckMaintenanceMilesColumns,
  truckMaintenanceTimesColumns,
} from "@/data/trucksMaintenanceTable";
import { TPagination, TTruck } from "@/types/globalTypes";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import { useSearchSubmit } from "@/hook/useSearchSubmit";

// Existing separated components
import TrucksDialog from "@/components/truck/truckMaintenance/TrucksDialog";
import ActionsMenu from "@/components/truck/truckMaintenance/ActionsMenu";
import DeleteDialog from "@/components/truck/truckMaintenance/DeleteDialog";
import AddEditMaintenanceRecordDialog from "./AddEditMaintenanceRecordDialog";


type TogglePage = "Miles" | "Times";

const TruckMaintenance = () => {
  const theme = useAppSelector((state: RootState) => state.palette);

  const [page, setPage] = useState(1);
  const { fromDate, toDate, isFiltered } = useFilter();
  const { setLoading } = useLoading();
  const { error, setError } = useError();

  const [togglePage, setTogglePage] = useState<TogglePage>("Miles");

  // Dialogs state
  const [openTrucksDialog, setOpenTrucksDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // ✅ New create/edit dialog state
  const [openCreateEditDialog, setOpenCreateEditDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");

  const [selectedMaintenance, setSelectedMaintenance] =
    useState<TMaintenance | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Get all trucks
  const {
    data: trucksData,
    isLoading: isTrucksLoading,
    error: trucksError,
  } = useGetAllTrucksQuery({
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: false,
  });

  // CRUD mutations
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

  const {
    data: maintenanceData,
    isLoading: isMaintenanceLoading,
    error: isMaintenanceError,
    refetch: maintenanceFetch,
  } = useGetAllMaintenancesQuery(
    { page, limit: 10, repeatBy: togglePage === "Miles" ? "mile" : "time" },
    {
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: false,
    }
  );
  const [isSwitchingType, setIsSwitchingType] = useState(false);

  const { data: filteredData } = useGetMaintenanceWithFilterQuery(
    {
      from: fromDate ? fromDate.format("YYYY-MM-DD") : undefined,
      to: toDate ? toDate.format("YYYY-MM-DD") : undefined,
      page,
      limit: 10,
    },
    { skip: !isFiltered || !fromDate || !toDate, refetchOnFocus: false }
  );

  useEffect(() => {
    if (isFiltered && fromDate && toDate) setPage(1);
  }, [isFiltered, fromDate, toDate, togglePage]);

  const [
    triggerSearchQuery,
    {
      data: maintenanceType,
      isLoading: maintenanceTypeLoading,
      error: maintenanceTypeError,
      reset: resetSearchQuery,
    },
  ] = useLazySearchMaintenancesWithTypeQuery();

  const [
    triggerSearchByType,
    {
      data: filteredByTypeData,
      isLoading: isFilteringByType,
      error: filterByTypeError,
    },
  ] = useLazyFilterMaintenancesWithTypeQuery();

  const searchHook = useSearchSubmit({
    onSearch: (term) => {
      setPage(1);
      if (term.trim()) triggerSearchQuery(term);
    },
    onReset: () => {
      setPage(1);
      resetSearchQuery();
      maintenanceFetch();
    },
  });

  const { isSearching } = searchHook;

  // Trucks options
  const trucks = useMemo(() => {
    if (!trucksData?.data) return [];
    return trucksData.data.map((truck: TTruck) => ({
      id: truck.id || truck.id,
      plateNumber: truck.plateNumber || "--",
    }));
  }, [trucksData]);

  const maintenance = useMemo(() => {
    let data: TMaintenance[] = [];

    if (isSearching && maintenanceType?.data) data = maintenanceType.data;
    else if (isFiltered && filteredData?.data) data = filteredData.data;
    else if (filteredByTypeData?.data) data = filteredByTypeData.data;
    else if (maintenanceData?.data) data = maintenanceData.data;

    return data;
  }, [
    isSearching,
    maintenanceType?.data,
    isFiltered,
    filteredData?.data,
    filteredByTypeData?.data,
    maintenanceData?.data,
  ]);

  const pagination: TPagination = useMemo(() => {
    if (isSearching && maintenanceType?.paginationResult)
      return maintenanceType.paginationResult;
    if (isFiltered && filteredData?.paginationResult)
      return filteredData.paginationResult;
    if (filteredByTypeData?.paginationResult)
      return filteredByTypeData.paginationResult;
    if (maintenanceData?.paginationResult) return maintenanceData.paginationResult;
    return null;
  }, [
    isSearching,
    maintenanceType?.paginationResult,
    isFiltered,
    filteredData?.paginationResult,
    filteredByTypeData?.paginationResult,
    maintenanceData?.paginationResult,
  ]);

  useEffect(() => {
    setLoading(isMaintenanceLoading && !maintenanceData);
  }, [isMaintenanceLoading, maintenanceData, setLoading]);

  useEffect(() => {
    const currentError = isMaintenanceError;
    if (currentError) {
      const msg = getErrorMessage(currentError);
      setError(msg);
      toast.error(msg || "Failed to load maintenance data ❌", {
        style: {
          background: "#dc2626",
          color: "#fff",
          borderRadius: "8px",
          fontSize: "14px",
        },
        duration: 4000,
      });
    }
  }, [isMaintenanceError, setError]);

  useEffect(() => {
    if (trucksError) {
      const msg = getErrorMessage(trucksError);
      toast.error(`Failed to load trucks: ${msg}`, {
        style: {
          background: "#dc2626",
          color: "#fff",
          borderRadius: "8px",
          fontSize: "14px",
        },
        duration: 4000,
      });
    }
  }, [trucksError]);

  useEffect(() => {
    if (maintenanceTypeError) console.error("search error", maintenanceTypeError);
    if (filterByTypeError) console.error("filterByType error", filterByTypeError);
  }, [maintenanceTypeError, filterByTypeError]);

  const handleToggleChange = async (
    _event: React.MouseEvent<HTMLElement>,
    newToggle: "Miles" | "Times"
  ) => {
    if (!newToggle || newToggle === togglePage) return;

    setIsSwitchingType(true);
    setTogglePage(newToggle);
    setPage(1);

    const repeatBy = newToggle === "Miles" ? "mile" : "time";
    triggerSearchByType({ repeatBy, page: 1, limit: 10 });
  };
  useEffect(() => {
    if (!isSwitchingType) return;
    if (filteredByTypeData?.data) {
      setIsSwitchingType(false);
    }
    if (filterByTypeError) {
      setIsSwitchingType(false);
    }
  }, [isSwitchingType, filteredByTypeData?.data, filterByTypeError]);


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
      await deleteMaintenance(selectedMaintenance.id!).unwrap();

      toast.success("Maintenance record deleted successfully!", {
        id: loadingId,
        style: {
          background: "#16a34a",
          color: "#fff",
          borderRadius: "8px",
          fontSize: "14px",
        },
      });

      setOpenDeleteDialog(false);
      setSelectedMaintenance(null);
      maintenanceFetch();
    } catch (err: any) {
      toast.error(getErrorMessage(err), {
        id: loadingId,
        style: {
          background: "#dc2626",
          color: "#fff",
          borderRadius: "8px",
          fontSize: "14px",
        },
      });
    }
  };

  const handleCreateEditSubmit = async (payload: any) => {
    const loadingId = toast.loading(
      dialogMode === "add" ? "Creating..." : "Updating..."
    );

    try {
      if (dialogMode === "add") {
        await createMaintenance(payload).unwrap();
        toast.success("Created successfully", {
          id: loadingId,
          style: {
            background: "#16a34a",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "14px",
          },
        });
      } else {
        if (!selectedMaintenance?.id) {
          toast.error("No maintenance selected", { id: loadingId });
          return;
        }
        await updateMaintenance({
          id: selectedMaintenance.id,
          ...payload,
        }).unwrap();

        toast.success("Updated successfully", {
          id: loadingId,
          style: {
            background: "#16a34a",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "14px",
          },
        });
      }

      setOpenCreateEditDialog(false);
      setSelectedMaintenance(null);
      maintenanceFetch();
    } catch (err: any) {
      toast.error(getErrorMessage(err), {
        id: loadingId,
        style: {
          background: "#dc2626",
          color: "#fff",
          borderRadius: "8px",
          fontSize: "14px",
        },
      });
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
        return {
          bg: "#FFFBEB",
          color: "#D97706",
          icon: <AlertCircle size={18} />,
          text: "Upcoming",
        };
      case "overdue":
        return {
          bg: "#FEF2F2",
          color: "#DC2626",
          icon: <AlertCircle size={18} />,
          text: "Overdue",
        };
      case "completed":
        return {
          bg: "#F0FDF4",
          color: "#16A34A",
          icon: <CheckCircle size={18} />,
          text: "Completed",
        };
      default:
        return {
          bg: "#F3F4F6",
          color: "#6B7280",
          icon: <AlertCircle size={18} />,
          text: status || "Unknown",
        };
    }
  };

  // Table row renderers
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
            {item.type}
          </span>
        </td>

        <td style={{ color: theme.currentPalette.primary }} className="p-4 text-center">
          {item.serviceCenter || "-"}
        </td>

        <td style={{ color: theme.currentPalette.primary }} className="p-4 text-right">
          {item.intervalMile || "--"} Miles
        </td>

        <td style={{ color: theme.currentPalette.primary }} className="p-4 text-right">
          {item.remindBeforeMile || "--"} Miles
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
            {item.type}
          </span>
        </td>

        <td style={{ color: theme.currentPalette.primary }} className="p-4 text-center">
          {item.repeatBy || "--"}
        </td>

        <td style={{ color: theme.currentPalette.primary }} className="p-4 text-right">
          {item.intervalDays || "--"} Days
        </td>

        <td style={{ color: theme.currentPalette.primary }} className="p-4 text-right">
          {item.remindBeforeDays || "--"} Days
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

  // Stats cards
  const statsData = useMemo(() => {
    const statLoadData = maintenanceData?.stats || {};
    return {
      totalMaintenance: statLoadData.total || 0,
      upcoming: statLoadData.upcoming || 0,
      overdue: statLoadData.overdue || 0,
    };
  }, [maintenanceData?.stats]);

  // Global loading
  const isInitialLoading = (isMaintenanceLoading && !maintenanceData) || isTrucksLoading;
  if (isInitialLoading) return <Loading />;

  const isLoading =
    isSwitchingType ||
    isMaintenanceLoading ||
    isFilteringByType ||
    (isSearching && maintenanceTypeLoading);

  const tableData = isSwitchingType ? [] : maintenance;


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

      {/* Toggle (Miles/Time) */}
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
                "&:hover": {
                  backgroundColor: darken(theme.currentPalette.primary, 0.1),
                },
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

      {/* Header/Search/Add Record */}
      <Box sx={searchFilterContainerSx}>
        <Box>
          <Typography
            variant="h6"
            sx={{ color: theme.currentPalette.primary, fontWeight: 700 }}
          >
            Fleet Maintenance Status
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: alpha(theme.currentPalette.text, 0.7), fontWeight: 400 }}
          >
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
            searchHook={searchHook}
            placeholder={"Search By Service Type..."}
            showClearButton
            sx={{
              width: { xs: "100%", sm: "100%", md: 280, lg: 350 },
            }}
            inputSx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: theme.currentPalette.background,
                height: 36,
                "&:hover": {
                  borderColor: theme.currentPalette.primary,
                },
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
              // py: 1.2,
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
        data={tableData}
        renderRow={togglePage === "Miles" ? renderMileRow : renderTimeRow}
        loading={isLoading}
      />


      {/* Pagination */}
      {!isSearching && pagination && maintenance.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Pagination
            pagination={pagination}
            page={page}
            setPage={setPage}
            pageSize={10}
            showInfo={true}
          />
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
        repeatBy={dialogMode === "edit"
          ? ((selectedMaintenance?.repeatBy as any) ||
            (togglePage === "Miles" ? "mile" : "time"))
          : togglePage === "Miles"
            ? "mile"
            : "time"}
        primaryColor={theme.currentPalette.primary}
        isSubmitting={isCreating || isUpdating}
        serviceTypes={serviceTypes}
        trucks={trucks}
        initialValues={dialogMode === "edit" && selectedMaintenance
          ? {
            type: selectedMaintenance.type,
            intervalMile: selectedMaintenance.intervalMile,
            remindBeforeMile: selectedMaintenance.remindBeforeMile,
            intervalDays: selectedMaintenance.intervalDays,
            remindBeforeDays: selectedMaintenance.remindBeforeDays,
            statusPerTruck: selectedMaintenance.statusPerTruck.map((t) => ({
              truckId: t.truckId,
              lastDoneMile: t.lastDoneMile,
              lastDoneAt: t.lastDoneAt || null,
            })),
          }
          : undefined}
        onClose={() => {
          setOpenCreateEditDialog(false);
          setSelectedMaintenance(null);
        } }
        onSubmit={handleCreateEditSubmit} maintenanceCenters={[]}      />
    </Box>
  );
};

export default TruckMaintenance;
