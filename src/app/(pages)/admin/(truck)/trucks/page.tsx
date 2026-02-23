"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Erros from "@/components/ui/Erros";
import { RootState, useAppSelector } from "@/redux/store";
import { TTruck } from "@/types/globalTypes";
import Loading from "@/components/ui/Loading";
import toast, { Toaster } from "react-hot-toast";
import { IoAdd, IoPencil, IoTrash } from "react-icons/io5";
import {
  Dialog,
  Button,
  TableRow,
  Box,
  IconButton,
  Tooltip,
  Typography,
  CircularProgress,
  SxProps,
  alpha,
  Chip,
  darken,
} from "@mui/material";
import { getErrorMessage } from "@/utils/getErrorMessage";
import Pagination from "@/components/ui/Pagination";
import {
  useCreateTruckMutation,
  useDeleteTruckMutation,
  useGetTrucksWithPaginationQuery,
  useGetTruckWithSearchQuery,
  useLazyGetDriversQuery,
  useLazyGetTruckByTruckIdQuery,
  useUpdateTruckMutation,
} from "@/redux/slices/apiSlice";
import { TruckForm } from "@/components/truck/TruckForm";
import StatsCard from "@/components/ui/StatsCard";
import { FaTruck, FaUserCheck, FaUserMinus } from "react-icons/fa";
import { FaUserLargeSlash } from "react-icons/fa6";
import { Dayjs } from "dayjs";
import useError from "@/hook/useError";
import { StatusChip } from "@/components/ui/TablesMUI";
import { useSearchSubmit } from "@/hook/useSearchSubmit";
import { setLoading } from "@/redux/slices/uiSlice";
import SearchInput from "@/components/ui/SearchInput";
import DataTable from "@/components/ui/DataTable";
import { truckColumns } from "@/data/truckTables";

const TrucksPage: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);

  // ✅ Search And Filter
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [isFiltered, setIsFiltered] = useState(false);
  const [page, setPage] = useState(1);
  const [deleteToast, setDeleteToast] = useState({ open: false, message: "" });
  const { error, setError } = useError();
  const theme = useAppSelector((state: RootState) => state.palette);

  // RTK Query
  const {
    data: trucksData,
    isLoading: trucksLoading,
    refetch: refetchTrucks,
  } = useGetTrucksWithPaginationQuery(
    { page, limit: 10 },
    {
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: false,
    }
  );
  const [
    triggerSearchQuery,
    {
      data: truckByIdData,
      isLoading: truckByIdLoading,
      error: truckByIdError,
      reset: resetSearchQuery,
    },
  ] = useLazyGetTruckByTruckIdQuery();

  const [triggerDriverForTruck, { data: allDriversAvailable }] =
    useLazyGetDriversQuery();
  useEffect(() => {
    triggerDriverForTruck({
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: false,
    });
  }, []);

  const { data: filteredData } = useGetTruckWithSearchQuery(
    {
      from: fromDate ? fromDate.format("YYYY-MM-DD") : undefined,
      to: toDate ? toDate.format("YYYY-MM-DD") : undefined,
      page,
      limit: 10,
    },
    { skip: !isFiltered }
  );

  // Search Hook
  const searchHook = useSearchSubmit({
    onSearch: (term) => {
      setPage(1);
      if (term.trim()) {
        triggerSearchQuery(encodeURIComponent(term));
      }
    },
    onReset: () => {
      setPage(1);
      resetSearchQuery();
      refetchTrucks();
    },
  });
  const { searchTerm, isSearching } = searchHook;

  // Mutations
  const [createTruck, { isLoading: isCreating }] = useCreateTruckMutation();
  const [updateTruck, { isLoading: isUpdating }] = useUpdateTruckMutation();
  const [deleteTruck, { isLoading: isDeleting }] = useDeleteTruckMutation();

  const truck = useMemo(() => {
    if (isSearching && Array.isArray(truckByIdData?.data)) {
      return Array.isArray(truckByIdData.data)
        ? truckByIdData.data
        : [truckByIdData.data];
    }
    if (isFiltered && filteredData?.data) {
      return filteredData.data;
    }
    return trucksData?.data || [];
  }, [isSearching, isFiltered, truckByIdData, filteredData, trucksData]);

  const pagination = isFiltered
    ? filteredData?.paginationResult || null
    : trucksData?.paginationResult || null;

  // Loading state
  useEffect(() => {
    setLoading(trucksLoading && !trucksData);
  }, [trucksLoading, trucksData]);

  // Stats cards
  const statsData = useMemo(() => {
    const statsTruckData = trucksData?.stats || [];
    if (!statsTruckData || statsTruckData.length === 0)
      return { totalTrucks: 0, available: 0, busy: 0, inactive: 0 };
    return {
      totalTrucks: statsTruckData.total,
      available: statsTruckData.available,
      busy: statsTruckData.busy,
      inactive: statsTruckData.inactive,
    };
  }, [trucksData?.stats]);

  // Modal states
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<TTruck>>({});
  const [editMode, setEditMode] = useState(false);

  // Delete flow state
  const [truckToDelete, setTruckToDelete] = useState<{
    id: string;
    truckId?: number;
  } | null>(null);

  // HANDLE open add
  const handleOpenAdd = useCallback(() => {
    setFormData({});
    setEditMode(false);
    setOpen(true);
  }, []);

  // HANDLE edit click
  const handleEditClick = useCallback((truck: TTruck) => {
    const assignedDriverId =
      typeof truck.assignedDriver === "object"
        ? truck.assignedDriver.id
        : truck.assignedDriver;
    setFormData({
      id: truck.id,
      model: truck.model,
      plateNumber: truck.plateNumber,
      type: truck.type,
      year: truck.year,
      capacity: truck.capacity,
      fuelPerMile: truck.fuelPerMile,
      totalMileage: truck.totalMileage,
      status: truck.status,
      assignedDriver: assignedDriverId,
      source: truck.source,
    });
    setEditMode(true);
    setOpen(true);
  }, []);

  // form change
  const handleFormChange = useCallback(
    <K extends keyof TTruck>(field: K, value: TTruck[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Create truck
  const handleCreate = useCallback(async () => {
    if (!user?.id) {
      toast.error("User not found!");
      return;
    }
    try {
      await createTruck({
        ...formData,
        createdBy: user.id,
      }).unwrap();

      toast.success("✅ Truck created successfully!");
      setOpen(false);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage || "Creating truck failed ❌");
    }
  }, [createTruck, formData, user?.id]);

  // Update truck
  const handleUpdate = useCallback(async () => {
    if (!formData?.id) {
      toast.error("Missing truck ID");
      return;
    }
    if (!user?.id) {
      toast.error("User not found!");
      return;
    }
    try {
      await updateTruck({
        id: formData.id,
        ...formData,
        updatedBy: user.id,
      }).unwrap();

      toast.success("✅ Truck updated successfully!");
      setOpen(false);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage || "Updating truck failed ❌");
    }
  }, [updateTruck, formData, user?.id]);

  // Delete flow
  const handleDelete = useCallback((id: string, truckId?: number) => {
    setDeleteToast({
      open: true,
      message: `Are you sure you want to delete truck #${truckId}?`,
    });
    setTruckToDelete({ id, truckId });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!truckToDelete) return;
    try {
      await deleteTruck(truckToDelete.id).unwrap();
      refetchTrucks();
      toast.success(`✅ Truck #${truckToDelete.truckId} deleted successfully!`);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage || "Deleting truck failed ❌");
    } finally {
      setDeleteToast({ open: false, message: "" });
      setTruckToDelete(null);
    }
  }, [truckToDelete, deleteTruck]);

  const cancelDelete = useCallback(() => {
    setDeleteToast({ open: false, message: "" });
    setTruckToDelete(null);
  }, []);

  // ✅ Render Table Row - Similar to LoadsPage
  const renderTruckRow = (truck: TTruck) => {
    // Styles
    const tableRowSx: SxProps = {
      bgcolor: theme.currentPalette.background,
      "&:hover": {
        backgroundColor: alpha(theme.currentPalette.primary, 0.05),
        cursor: "pointer",
      },
      transition: "all 0.2s ease-in-out",
    };

    return (
      <TableRow
        sx={tableRowSx}
        key={truck.id || truck.truckId}
        className="transition-colors group"
      >
        {/* Plate Number */}
        <td className="p-4 text-center text-slate-700 font-medium">
          {truck.plateNumber || "-"}
        </td>

        {/* Modal */}
        <td className="p-4 text-center">{truck.model || "-"}</td>

        {/* Truck Type */}
        <td className="p-4 text-center text-slate-700">
          <Chip label={truck.type} variant="outlined" size="small" />
        </td>

        {/* Truck Year */}
        <td className="p-4 text-center font-semibold">{truck.year || "-"}</td>

        {/* Truck Source */}
        <td className="p-4 text-center text-slate-700">
          <Chip label={truck.source} variant="outlined" size="small" />
        </td>

        {/* Truck Capacity */}
        <td className="p-4 text-center">{truck.capacity}</td>

        {/* Fuel Per Mile */}
        <td className="p-4 text-center">{truck.fuelPerMile ?? "N/A"}</td>

         {/* Total Mileage */}
        <td className="p-4 text-center">{truck.totalMileage ?? "N/A"}</td>

        {/* Assign To Driver */}
        <td className="p-4 text-center">
          {typeof truck.assignedDriver === "object"
            ? truck.assignedDriver.name
            : truck.assignedDriver || "Unassigned"}
          {typeof truck.assignedDriver === "object" &&
            truck.assignedDriver.driverId && (
              <Box
                component="span"
                sx={{
                  fontSize: "0.75rem",
                  color: "text.secondary",
                  display: "block",
                }}
              >
                ID: {truck.assignedDriver.driverId}
              </Box>
            )}
        </td>

        <td className="p-4 text-center">
          <StatusChip status={truck.status} />
        </td>

        {/* Actions */}
        <td className="p-4 text-center">
          <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
            <Tooltip title="Edit Truck">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleEditClick(truck)}
                disabled={isUpdating}
              >
                <IoPencil />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Truck">
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDelete(truck.id, truck.truckId)}
                disabled={isDeleting}
              >
                {isDeleting ? <CircularProgress size={16} /> : <IoTrash />}
              </IconButton>
            </Tooltip>
          </Box>
        </td>
      </TableRow>
    );
  };

  // Loading state
  const isInitialLoading = truckByIdLoading && !trucksData;
  if (isInitialLoading) return <Loading />;

  // Container styles
  const containerSx: SxProps = {
    p: 3,
  };
  const searchFilterContainerSx: SxProps = {
    display: "flex",
    flexDirection: { xs: "column", md: "row" },
    alignItems: { xs: "flex-start", md: "center" },
    justifyContent: "space-between",
    gap: { xs: 2, md: 0 },
    p: 2,
    my: 2,
    border: `1px solid ${alpha(theme.currentPalette.primary, 0.3)}`,
    borderRadius: 1,
    backgroundColor: theme.currentPalette.background,
    width: "100%",
  };
  const newLoadButtonSx: SxProps = {
    py: 1.5,
    px: 4,
    fontWeight: "bold",
    fontSize: "1rem",
    borderRadius: 1,
    width: { xs: "100%", md: "auto" },
    background: theme.currentPalette.primary,
    color: theme.currentPalette.background,
    textTransform: "capitalize",
    "&:hover": {
      background: darken(theme.currentPalette.primary, 0.1),
    },
  };

  return (
    <Box sx={containerSx}>
      <Toaster position="top-center" />

      {/* Stats Summary */}
      <Box sx={{ mt: 4, mb: 5 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 my-10">
          <StatsCard
            title="Total Trucks"
            value={statsData.totalTrucks}
            icon={FaTruck}
            iconColor={theme.currentPalette.primary}
          />

          <StatsCard
            title="Available"
            value={statsData.available}
            icon={FaUserCheck}
            iconColor={theme.currentPalette.primary}
          />

          <StatsCard
            title="Busy"
            value={statsData.busy}
            icon={FaUserMinus}
            iconColor={theme.currentPalette.primary}
          />

          <StatsCard
            title="Inactive"
            value={statsData.inactive}
            icon={FaUserLargeSlash}
            iconColor={theme.currentPalette.primary}
          />
        </div>
      </Box>

      {/* Search & Filter */}
      <Box sx={searchFilterContainerSx}>
        {/* Search */}
        <Box>
          <Typography
            variant="h6"
            sx={{ color: theme.currentPalette.primary, fontWeight: 500 }}
          >
            Truck Details
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.currentPalette.primary, fontWeight: 400 }}
          >
            Ckeck list of all trucks
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            gap: 2,
            width: { xs: "100%", md: "auto" },
          }}
        >
          {/* Search */}
          <SearchInput
            searchHook={searchHook}
            placeholder="Search trucks by ID...."
            showClearButton
            sx={{
              width: { xs: "100%", md: 280, lg: 350 },
            }}
            inputSx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1,
                backgroundColor: theme.currentPalette.background,
                py: 0.5,
                "&:hover": {
                  borderColor: theme.currentPalette.primary,
                },
              },
            }}
          />

          {/* Add Button */}
          <Box>
            <Button
              onClick={handleOpenAdd}
              variant="contained"
              startIcon={<IoAdd size={22} />}
              sx={newLoadButtonSx}
            >
              Add Truck
            </Button>
          </Box>
        </Box>
      </Box>

      {error && (
        <Box sx={{ mb: 3 }}>
          <Erros message={error} />
        </Box>
      )}

      {/* Table */}
      <DataTable
        columns={truckColumns}
        data={truck}
        renderRow={renderTruckRow}
        loading={
          (isSearching && truckByIdLoading) ||
          (isFiltered && filteredData) ||
          (trucksLoading && !trucksData)
        }
      />

      {/* Pagination */}
      {!isFiltered && !isSearching && pagination && truck.length > 0 && (
        <Pagination
          pagination={pagination}
          page={page}
          setPage={setPage}
          pageSize={10}
          showInfo={true}
        />
      )}

      {/* Truck Form*/}
      <TruckForm
        open={open}
        onClose={() => setOpen(false)}
        formData={formData}
        onChange={handleFormChange}
        onSubmit={editMode ? handleUpdate : handleCreate}
        editMode={editMode}
        isLoading={isCreating || isUpdating}
        allDrivers={
          Array.isArray(allDriversAvailable?.data)
            ? allDriversAvailable.data
            : []
        }
        allTrucks={trucksData?.data?.data || []}
        refetch={refetchTrucks}
      />

      {/* Delete Confirmation */}
      {deleteToast.open && (
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
      )}

      <Dialog
        open={deleteToast.open}
        onClose={cancelDelete}
        PaperProps={{
          sx: {
            borderRadius: 1,
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
            sx={{ fontWeight: 600, color: "text.primary" }}
          >
            Confirm Delete
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            {deleteToast.message}
          </Typography>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={cancelDelete}
              sx={{
                borderRadius: 1,
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
                borderRadius: 1,
                minWidth: 80,
                backgroundColor: "error.main",
                "&:hover": { backgroundColor: "error.dark" },
              }}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};

export default TrucksPage;
