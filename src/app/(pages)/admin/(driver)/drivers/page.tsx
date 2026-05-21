/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RootState, useAppSelector } from "@/redux/store";
import { TDriver } from "@/types/globalTypes";
import Loading from "@/components/ui/Loading";
import toast, { Toaster } from "react-hot-toast";
import Erros from "@/components/ui/Erros";
import {
  Dialog,
  Button,
  TableRow,
  Box,
  IconButton,
  Chip,
  Typography,
  alpha,
  SxProps,
  ToggleButtonGroup,
  ToggleButton,
  ToggleButtonGroupProps,
  darken,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  FormControl,
  Select,
  Switch,
  Tooltip,
  TextField,
  InputAdornment,
} from "@mui/material";
import { getErrorMessage } from "@/utils/getErrorMessage";
import Pagination from "@/components/ui/Pagination";
import {
  useCreateDriverMutation,
  useDeleteDriverMutation,
  useGetAllTimeOffsQuery,
  useGetDriversWithPaginationQuery,
  useGetDriverWithFilterQuery,
  useGetFilterTimeOffsQuery,
  useLazyGetDriverByDriverIdQuery,
  useLazyGetSpecificTimeOffsQuery,
  useUpdateDriverMutation,
  useUpdateTimeOffStatusMutation,
} from "@/redux/slices/apiSlice";
import { DriverForm } from "@/components/drivers/DriverForm";
import useError from "@/hook/useError";
import StatsCard from "@/components/ui/StatsCard";
import DataTable from "@/components/ui/DataTable";
import { driverColumns, timeOffColumns } from "@/data/driverTables";
import { useSearchSubmit } from "@/hook/useSearchSubmit";
import SearchInput from "@/components/ui/SearchInput";
import { IoMdEye } from "react-icons/io";
import LinkDriverPopup from "@/components/drivers/Stepper";
import {
  BadgeCheck,
  Calendar,
  Check,
  CircleEllipsis,
  ClipboardCheck,
  ClipboardClock,
  ClipboardX,
  Clock3,
  Eye,
  Link,
  NotebookText,
  OctagonX,
  Pen,
  StickyNote,
  Trash2,
  UserRoundCheck,
  UserRoundX,
  UsersRound,
  X,
} from "lucide-react";
import { TTimeOffs, TTimeOffStatus } from "@/types/driverType";
import { useFilter } from "@/providers/FilterProvider";
type TStatusFilter = "all" | "available" | "busy" | "inactive";

const DriversPage = () => {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const { error, setError } = useError();
  const theme = useAppSelector((state: RootState) => state.palette);

  // ✅ Search And Filter
  const [page, setPage] = useState(1);
  const [deleteToast, setDeleteToast] = useState({ open: false, message: "" });
  const [openStepper, setOpenStepper] = useState(false);
  const [togglePage, setTogglePage] = useState<"drivers" | "timeoff">(
    "drivers",
  );
  const [keyword, setKeyword] = useState("");
  const [activeKeyword, setActiveKeyword] = useState("");
  const controlSx: SxProps = {
    py: 0.5,
    width: 150,
    borderRadius: 2,
    color: theme.currentPalette.primary,
  };
  const [timeOffFilter, setTimeOffFilter] = useState<TTimeOffStatus>("all");
  const [openTimeOffDialog, setOpenTimeOffDialog] = useState(false);
  const [selectedTimeOff, setSelectedTimeOff] = useState<TTimeOffs | null>(
    null,
  );
  const { fromDate, toDate, isFiltered } = useFilter();
  const [statusFilter, setStatusFilter] = useState<TStatusFilter>("all");

  // 🔹 API Driver Management Queries
  const {
    data: driversData,
    isLoading: driversLoading,
    error: driverError,
    refetch: refetchDrivers,
  } = useGetDriversWithPaginationQuery(
    {
      page,
      limit: 10,
      status: statusFilter !== "all" ? statusFilter : undefined,
    },
    {
      skip: togglePage !== "drivers",
      refetchOnFocus: togglePage === "drivers",
      refetchOnReconnect: togglePage === "drivers",
      refetchOnMountOrArgChange: true,
    },
  );

  const { data: filteredData } = useGetDriverWithFilterQuery(
    {
      from: fromDate ? fromDate.format("YYYY-MM-DD") : undefined,
      to: toDate ? toDate.format("YYYY-MM-DD") : undefined,
      page,
      limit: 10,
    },
    { skip: togglePage !== "drivers" || !isFiltered || !fromDate || !toDate, refetchOnFocus: false },
  );

  const { data: timeOffsFilteredData } = useGetFilterTimeOffsQuery(
    {
      from: fromDate ? fromDate.format("YYYY-MM-DD") : undefined,
      to: toDate ? toDate.format("YYYY-MM-DD") : undefined,
      page,
      limit: 10,
    },
    {
      skip: togglePage !== "timeoff" || !isFiltered || !fromDate || !toDate,
      refetchOnFocus: false,
    },
  );

  useEffect(() => {
    if (isFiltered && fromDate && toDate) {
      setPage(1);
      if (searchHook.isSearching) {
        searchHook.handleSearchReset();
      }
    }
  }, [isFiltered, fromDate, toDate, togglePage]);

  const [
    triggerSearchQuery,
    {
      data: driverByIdData,
      isLoading: driverByIdLoading,
      error: driverByIdError,
      reset: resetSearchQuery,
    },
  ] = useLazyGetDriverByDriverIdQuery();

  // 🔹 API Time Off Requests Queries
  const {
    data: timeOffsData,
    isLoading: timeOffsLoading,
    error: timeOffsError,
    refetch: refetchTimeOffs,
  } = useGetAllTimeOffsQuery(
    { page, limit: 10 },
    {
      skip: togglePage !== "timeoff",
      refetchOnFocus: togglePage === "timeoff",
      refetchOnReconnect: togglePage === "timeoff",
      refetchOnMountOrArgChange: true,
    },
  );

  const [
    triggerTimeOffSearch,
    {
      data: timeOffSearchData,
      isLoading: timeOffSearchLoading,
      error: timeOffSearchError,
      reset: resetTimeOffSearch,
    },
  ] = useLazyGetSpecificTimeOffsQuery();

  // Search Hook
  const searchHook = useSearchSubmit({
    onSearch: (term) => {
      if (!term.trim()) return;

      setPage(1);

      if (togglePage === "drivers") {
        triggerSearchQuery(encodeURIComponent(term));
      } else if (togglePage === "timeoff") {
        triggerTimeOffSearch(encodeURIComponent(term));
      }
    },
    onReset: () => {
      setPage(1);

      resetSearchQuery();
      resetTimeOffSearch();

      if (togglePage === "drivers") {
        refetchDrivers();
      }

      if (togglePage === "timeoff") {
        refetchTimeOffs();
      }
    },
  });

  // 🔹 API Mutations
  const [createDriver, { isLoading: isCreating }] = useCreateDriverMutation();
  const [updateDriver, { isLoading: isUpdating }] = useUpdateDriverMutation();
  const [deleteDriver] = useDeleteDriverMutation();
  const [updateTimeOffs] = useUpdateTimeOffStatusMutation();
  const [originalData, setOriginalData] = useState<Partial<TDriver>>({});

  // 🔹 Dynamic Data toggle
  const currentData = useMemo(() => {
    if (togglePage === "drivers") {
      if (activeKeyword && driverByIdData?.data) {
        return Array.isArray(driverByIdData.data)
          ? driverByIdData.data.flat()
          : [driverByIdData.data];
      }

      if (!activeKeyword && isFiltered && filteredData?.data) {
        return filteredData.data;
      }

      return driversData?.data || [];
    }

    if (togglePage === "timeoff") {
      let data: TTimeOffs[] = [];

      if (activeKeyword && timeOffSearchData?.data) {
        data = Array.isArray(timeOffSearchData.data)
          ? timeOffSearchData.data.flat()
          : [timeOffSearchData.data];
      } else if (!activeKeyword && isFiltered && timeOffsFilteredData?.data) {
        data = timeOffsFilteredData.data;
      } else {
        data = timeOffsData?.data || [];
      }

      if (timeOffFilter !== "all") {
        data = data.filter((item) => item.status === timeOffFilter);
      }

      return data;
    }

    return [];
  }, [
    togglePage,
    activeKeyword,
    driverByIdData,
    timeOffSearchData,
    isFiltered,
    filteredData,
    timeOffsFilteredData,
    driversData,
    timeOffsData,
    timeOffFilter,
  ]);

  // 🔹 Dynamic Pagination
  const currentPagination = useMemo(() => {
    if (togglePage === "drivers") {
      if (activeKeyword) return (driverByIdData as any)?.paginationResult || null;
      if (isFiltered) return filteredData?.paginationResult || null;
      return driversData?.paginationResult || null;
    }

    if (togglePage === "timeoff") {
      if (activeKeyword) return (timeOffSearchData as any)?.paginationResult || null;
      if (isFiltered) return timeOffsFilteredData?.paginationResult || null;
      return timeOffsData?.paginationResult || null;
    }

    return null;
  }, [
    togglePage,
    activeKeyword,
    driverByIdData,
    timeOffSearchData,
    isFiltered,
    filteredData,
    timeOffsFilteredData,
    driversData,
    timeOffsData,
  ]);

  // Loading
  const isLoading = useMemo(() => {
    if (togglePage === "drivers") {
      return (
        driversLoading ||
        (searchHook.isSearching && driverByIdLoading) ||
        (isFiltered && !filteredData)
      );
    }

    if (togglePage === "timeoff") {
      return (
        timeOffsLoading ||
        (searchHook.isSearching && timeOffSearchLoading) ||
        (isFiltered && !timeOffsFilteredData)
      );
    }

    return false;
  }, [
    togglePage,
    driversLoading,
    timeOffsLoading,
    searchHook.isSearching,
    driverByIdLoading,
    timeOffSearchLoading,
    isFiltered,
    filteredData,
    timeOffsFilteredData,
  ]);

  // Stats cards
  const statsData = useMemo(() => {
    if (togglePage === "drivers") {
      const stats = isFiltered ? filteredData?.stats : driversData?.stats;
      return stats
        ? {
          total: stats?.total || 0,
          available: stats?.available || 0,
          busy: stats?.busy || 0,
          inactive: stats?.inactive || 0,
        }
        : { total: 0, available: 0, busy: 0, inactive: 0 };
    } else {
      const stats = isFiltered
        ? timeOffsFilteredData?.stats
        : timeOffsData?.stats || {};
      return {
        total: stats?.total || 0,
        approved: stats?.approved || 0,
        pending: stats?.pending || 0,
        rejected: stats?.rejected || 0,
      };
    }
  }, [
    togglePage,
    isFiltered,
    driversData?.stats,
    filteredData?.stats,
    timeOffsData?.stats,
    timeOffsFilteredData?.stats,
  ]);

  // 🔹 Dynamic Columns
  const currentColumns =
    togglePage === "drivers" ? driverColumns : timeOffColumns;

  // 🔹 Toggle Handler
  const handleToggleChange: ToggleButtonGroupProps["onChange"] = (
    _,
    newValue,
  ) => {
    if (newValue !== null) {
      setTogglePage(newValue);
      setPage(1);

      // reset search cache only, do not refetch drivers
      resetSearchQuery();
      resetTimeOffSearch();
    }
  };

  const handleDriverToggle = async (driver: TDriver) => {
    const newToggleValue = !driver.toggle;

    try {
      // Optimistic UI update - RTK Query will automatically refetch driver summary
      const formData = new FormData();
      formData.append("toggle", String(newToggleValue));

      await updateDriver({
        id: driver.id,
        body: formData,
      }).unwrap();

      // 🔄 Refetch driver list to show updated toggle state
      refetchDrivers();

      toast.success(
        newToggleValue
          ? "15% deduction enabled - Driver summary will update automatically"
          : "Standard mileage calculation applied - Driver summary will update automatically",
      );
    } catch (err) {
      toast.error("Failed to update toggle");
    }
  };

  // ✅ Modal States
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<TDriver>>({});
  const [editMode, setEditMode] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ✅ Handle Edit
  const handleEditClick = (driver: TDriver) => {
    setOriginalData(driver);
    setFormData({
      id: driver.id,
      driverId: driver.driverId,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      status: driver.status,
      hireDate: driver.hireDate,
      pricePerMile: driver.pricePerMile,
      createdBy: driver.createdBy,
      toggle: driver.toggle,
    });
    setEditMode(true);
    setOpen(true);
  };

  // ✅ Handle Form Change
  const handleFormChange = <K extends keyof TDriver>(
    field: K,
    value: TDriver[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getChangedFields = (
    original: Partial<TDriver>,
    updated: Partial<TDriver>,
  ): Partial<TDriver> => {
    const changedFields: Record<string, unknown> = {};

    Object.entries(updated).forEach(([key, value]) => {
      const k = key as keyof TDriver;
      if (value !== original[k] && value !== undefined) {
        changedFields[key] = value;
      }
    });

    return changedFields as Partial<TDriver>;
  };

  // handling Errors
  useEffect(() => {
    const currentError = driverError || driverByIdError;
    if (currentError) {
      const errorMessage = getErrorMessage(currentError);
      setError(errorMessage);
      toast.error(errorMessage || "Failed to load data ❌", {
        style: {
          background: "#dc2626",
          color: "#fff",
          borderRadius: "8px",
          fontSize: "14px",
        },
        duration: 4000,
      });
    }
  }, [driverError, driverByIdError, setError]);

  // ✅ Navigate to Driver Summary
  const handleViewStats = (id: string) => {
    router.push(`/admin/driverSummary/${id}`);
  };

  // ✅ Create Driver
  const handleCreate = async () => {
    if (!user?.id) {
      toast.error("User not found!");
      return;
    }

    try {
      await createDriver({
        ...formData,
        createdBy: user.id,
      }).unwrap();
      toast.success("✅ Driver created successfully!");
      setOpen(false);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage || "Creating driver failed ❌");
      throw err;
    }
  };

  // ✅ Update Driver
  const handleUpdate = async () => {
    if (!formData?.id) {
      toast.error("Missing driver ID");
      return;
    }

    const changedFields = getChangedFields(originalData, formData);

    if (Object.keys(changedFields).length === 0) {
      toast("⚠️ No changes detected.");
      return;
    }

    try {
      const formDataBody = new FormData();
      Object.entries(changedFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formDataBody.append(key, String(value));
        }
      });

      await updateDriver({
        id: formData.id,
        body: formDataBody,
      }).unwrap();
      toast.success("✅ Driver updated successfully!");
      setOpen(false);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage || "Updating driver failed ❌");
      throw err;
    }
  };

  // ✅ handling TimeOffs Status
  const handleTimeOffStatus = async (
    id: string,
    status: "approved" | "rejected",
    adminNote?: string,
  ) => {
    if (updatingId) return;
    setUpdatingId(id);
    try {
      await updateTimeOffs({
        id,
        body: { status, adminNote: adminNote?.trim() || undefined },
      }).unwrap();

      toast.success(
        status === "approved"
          ? "Time off request approved successfully"
          : "Time off request rejected successfully",
      );
      refetchTimeOffs();
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      toast.error(msg || `Failed to ${status} the request`);
    } finally {
      setUpdatingId(null);
    }
  };

  // ✅ Delete Driver with MUI Toast
  const [driverToDelete, setDriverToDelete] = useState<{
    id: string;
    driverId?: number;
  } | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDriver, setSelectedDriver] = useState<TDriver | null>(null);

  // ✅ Delete Driver handler
  const handleDelete = async (id: string, driverId?: number) => {
    setDeleteToast({
      open: true,
      message: `Are you sure you want to delete driver #${driverId}?`,
    });
    setDriverToDelete({ id, driverId });
  };

  // ✅ Confirm Delete
  const confirmDelete = async () => {
    if (!driverToDelete) return;

    try {
      await deleteDriver(driverToDelete.id).unwrap();
      toast.success(
        `✅ Driver #${driverToDelete.driverId} deleted successfully!`,
      );
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage || "Deleting driver failed ❌");
      throw err;
    } finally {
      setDeleteToast({ open: false, message: "" });
      setDriverToDelete(null);
    }
  };

  // ✅ Cancel Delete
  const cancelDelete = () => {
    setDeleteToast({ open: false, message: "" });
    setDriverToDelete(null);
  };

  const renderDriverRow = (driver: TDriver) => {
    // Styles
    const tableRowSx: SxProps = {
      bgcolor: theme.currentPalette.background,
      "&:hover": {
        bgcolor: alpha(theme.currentPalette.primary, 0.1),
      },
      transition: "all 0.2s ease-in-out",
    };

    return (
      <TableRow
        sx={tableRowSx}
        key={driver.id || driver.driverId}
        className="transition-colors group"
      >
        {/* Driver ID */}
        <td className="p-4 text-center">
          <span
            className="text-sm px-2 py-1 rounded font-medium"
            style={{
              background: alpha(theme.currentPalette.primary, 0.1),
              color: theme.currentPalette.primary,
            }}
          >
            {driver.driverId}
          </span>
        </td>

        {/* Name */}
        <td className="p-4">
          <div className="flex items-center gap-2">
            <div
              className="font-medium text-sm"
              style={{
                color: theme.currentPalette.primary,
              }}
            >
              {driver.name || "-"}
            </div>
          </div>
        </td>

        {/* Phone */}
        <td
          className="p-4 text-center font-medium"
          style={{
            color: theme.currentPalette.primary,
          }}
        >
          {driver.phone || "-"}
        </td>

        {/* License Number */}
        <td
          className="p-4 text-center"
          style={{
            color: theme.currentPalette.primary,
          }}
        >
          {driver.licenseNumber || "-"}
        </td>

        {/* Price Per Mile */}
        <td
          className="p-4 text-center"
          style={{
            color: theme.currentPalette.primary,
          }}
        >
          {driver.pricePerMile ? `${driver.pricePerMile}$` : "-"}
        </td>

        {/* Hire Date */}
        <td className="p-4 text-center">
          <Chip
            label={driver.hireDate?.split("T")[0] || "-"}
            variant="filled"
            sx={{
              bgcolor: alpha(theme.currentPalette.primary, 0.1),
              color: theme.currentPalette.primary,
              borderRadius: 2,
            }}
            size="small"
          />
        </td>

        {/* Status */}
        <td className="p-4 text-center">
          {driver.status === "available" && (
            <Chip
              label={driver.status}
              variant="filled"
              sx={{
                bgcolor: alpha(theme.currentPalette.primary, 0.2),
                color: theme.currentPalette.primary,
                borderRadius: 2,
                pl: 0.5,
              }}
              size="small"
              icon={
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: theme.currentPalette.primary,
                  }}
                />
              }
            />
          )}
          {driver.status === "busy" && (
            <Chip
              label={driver.status}
              variant="filled"
              sx={{
                bgcolor: theme.currentPalette.primary,
                color: theme.currentPalette.background,
                borderRadius: 2,
                pl: 0.5,
              }}
              size="small"
              icon={
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: theme.currentPalette.background,
                  }}
                />
              }
            />
          )}
          {driver.status === "inactive" && (
            <Chip
              label={driver.status}
              variant="filled"
              sx={{
                bgcolor: alpha(theme.currentPalette.primary, 0.1),
                color: theme.currentPalette.primary,
                borderRadius: 2,
                pl: 0.5,
              }}
              size="small"
              icon={
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: theme.currentPalette.primary,
                  }}
                />
              }
            />
          )}
        </td>
        {/* Reduced Rate */}
        <td className="p-4 text-center">
          <Tooltip
            title={
              driver.toggle
                ? "15% deduction is applied to total miles"
                : "Standard mileage calculation (No deduction)"
            }
            arrow
          >
            <Switch
              checked={Boolean(driver.toggle)}
              onChange={() => handleDriverToggle(driver)}
            />
          </Tooltip>
        </td>

        {/* Actions */}
        <td className="p-4 text-center">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setAnchorEl(e.currentTarget);
              setSelectedDriver(driver);
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

          {/* Menu */}
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
                if (selectedDriver) handleViewStats(selectedDriver.id);
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
                if (selectedDriver) handleEditClick(selectedDriver);
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

            <MenuItem
              onClick={() => {
                if (selectedDriver)
                  handleDelete(selectedDriver.id, selectedDriver.driverId);
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
            </MenuItem>
          </Menu>
        </td>
      </TableRow>
    );
  };

  // ✅ Render TimeOff Table Row
  const renderTimeOffRow = (timeOffs: TTimeOffs) => {
    // Styles
    const tableRowSx: SxProps = {
      bgcolor: theme.currentPalette.background,
      "&:hover": {
        bgcolor: alpha(theme.currentPalette.primary, 0.1),
      },
      transition: "all 0.2s ease-in-out",
    };

    const isUpdating = updatingId === timeOffs.id;

    return (
      <TableRow
        sx={tableRowSx}
        key={timeOffs.id}
        className="transition-colors group"
      >
        {/* Request ID */}
        <td className="p-4 text-center">
          <span
            className="text-sm px-2 py-1 rounded font-medium"
            style={{
              background: alpha(theme.currentPalette.primary, 0.1),
              color: theme.currentPalette.primary,
            }}
          >
            {timeOffs.requestId}
          </span>
        </td>

        {/* Name */}
        <td className="p-4">
          <div className="flex items-center gap-2">
            <div
              className="font-medium text-sm"
              style={{
                color: theme.currentPalette.primary,
              }}
            >
              {timeOffs.driver.split("(")[0] || "-"}
            </div>
          </div>
        </td>

        {/* Phone */}
        <td
          className="p-4 text-center font-medium"
          style={{
            color: theme.currentPalette.primary,
          }}
        >
          {timeOffs.phone || "-"}
        </td>

        {/* Reason */}
        <td
          className="p-4 text-center truncate block max-w-[150px]"
          style={{
            color: theme.currentPalette.primary,
          }}
        >
          {timeOffs.reason || "-"}
        </td>

        {/* Date From / To */}
        <td className="p-4 text-center">
          <span
            style={{
              backgroundColor: alpha(theme.currentPalette.primary, 0.1),
              color: theme.currentPalette.primary,
              borderRadius: "5px",
              padding: "5px",
            }}
          >
            {`${timeOffs.from.split("T")[0]} - ${timeOffs.to.split("T")[0]}`}
          </span>
        </td>

        {/* Status */}
        <td className="p-4 text-center">
          {timeOffs.status === "pending" && (
            <Chip
              label={timeOffs.status}
              variant="filled"
              sx={{
                bgcolor: alpha(theme.currentPalette.primary, 0.2),
                color: theme.currentPalette.primary,
                borderRadius: 2,
              }}
              size="small"
            />
          )}
          {timeOffs.status === "approved" && (
            <Chip
              label={timeOffs.status}
              variant="filled"
              sx={{
                bgcolor: theme.currentPalette.primary,
                color: theme.currentPalette.background,
                borderRadius: 2,
              }}
              size="small"
            />
          )}
          {timeOffs.status === "rejected" && (
            <Chip
              label={timeOffs.status}
              variant="filled"
              sx={{
                bgcolor: "#FFE2E2",
                color: "#C10007",
                borderRadius: 2,
              }}
              size="small"
            />
          )}
          {timeOffs.status === "cancelled" && (
            <Chip
              label={timeOffs.status}
              variant="filled"
              sx={{
                bgcolor: theme.currentPalette.background,
                color: "#C10007",
                borderRadius: 2,
                border: "1px solid #C10007",
              }}
              size="small"
            />
          )}
        </td>

        {/* Actions */}
        <td className="p-4 text-center">
          {timeOffs.status === "pending" ? (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={1}
            >
              {/* Approve */}
              <IconButton
                size="small"
                disabled={!!isUpdating}
                onClick={() => {
                  handleTimeOffStatus(timeOffs.id, "approved", "Yes");
                }}
                sx={{
                  color: "success.main",
                  "&:hover": { bgcolor: alpha("#4caf50", 0.1) },
                }}
              >
                {isUpdating ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Check fontSize="small" />
                )}
              </IconButton>

              {/* Reject */}
              <IconButton
                size="small"
                disabled={!!isUpdating}
                onClick={() => {
                  handleTimeOffStatus(timeOffs.id, "rejected", "No");
                }}
                sx={{
                  color: "error.main",
                  "&:hover": { bgcolor: alpha("#f44336", 0.1) },
                }}
              >
                <X fontSize="small" />
              </IconButton>

              <IconButton
                size="small"
                sx={{ color: theme.currentPalette.primary }}
                onClick={() => {
                  setSelectedTimeOff(timeOffs);
                  setOpenTimeOffDialog(true);
                }}
              >
                <Eye fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <IconButton
              size="small"
              sx={{ color: theme.currentPalette.primary }}
              onClick={() => {
                setSelectedTimeOff(timeOffs);
                setOpenTimeOffDialog(true);
              }}
            >
              <Eye fontSize="small" />
            </IconButton>
          )}
        </td>
      </TableRow>
    );
  };

  const renderRow = (item: TDriver | TTimeOffs) => {
    if (togglePage === "drivers") {
      return renderDriverRow(item as TDriver);
    }
    return renderTimeOffRow(item as TTimeOffs);
  };

  // Loading state
  const isInitialLoading = driverByIdLoading && !driversData;
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
    borderRadius: 2,
    backgroundColor: theme.currentPalette.background,
    width: "100%",
  };
  const newLoadButtonSx: SxProps = {
    py: 1.5,
    px: 4,
    fontWeight: "bold",
    fontSize: "1rem",
    borderRadius: 2,
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

      {/* Toggle Button */}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <ToggleButtonGroup
          value={togglePage}
          exclusive
          onChange={handleToggleChange}
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            border: `1px solid ${alpha(theme.currentPalette.primary, 0.5)}`,
          }}
        >
          <ToggleButton
            value="drivers"
            sx={{
              textTransform: "none",
              px: 2,
              py: 1,
              "&.Mui-selected": {
                backgroundColor: alpha(theme.currentPalette.primary, 0.9),
                color: theme.currentPalette.background,
              },
              "&.Mui-selected:hover": {
                backgroundColor: alpha(theme.currentPalette.primary, 0.5),
              },
            }}
          >
            Driver Management
          </ToggleButton>

          <ToggleButton
            value="timeoff"
            sx={{
              textTransform: "none",
              px: 2,
              py: 1,
              "&.Mui-selected": {
                backgroundColor: alpha(theme.currentPalette.primary, 0.9),
                color: theme.currentPalette.background,
              },
              "&.Mui-selected:hover": {
                backgroundColor: alpha(theme.currentPalette.primary, 0.5),
              },
            }}
          >
            Time off requests
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Dynamic Stats Cards */}
      <Box sx={{ mt: 4, mb: 5 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {togglePage === "drivers" ? (
            <>
              <StatsCard
                title="Total Drivers"
                value={statsData.total}
                icon={UsersRound}
              />
              <StatsCard
                title="Available"
                value={statsData.available}
                icon={UserRoundCheck}
              />
              <StatsCard
                title="Busy"
                value={statsData.busy}
                icon={UserRoundX}
              />
            </>
          ) : (
            <>
              <StatsCard
                title="Approved Requests"
                value={statsData.approved}
                icon={ClipboardCheck}
              />
              <StatsCard
                title="Pending Requests"
                value={statsData.pending}
                icon={ClipboardClock}
              />
              <StatsCard
                title="Rejected Requests"
                value={statsData.rejected}
                icon={ClipboardX}
              />
            </>
          )}
        </div>
      </Box>

      {/* Search & Filter */}
      <Box sx={searchFilterContainerSx}>
        <Box>
          <Typography
            variant="h6"
            sx={{ color: theme.currentPalette.primary, fontWeight: 500 }}
          >
            {togglePage === "drivers" ? "Driver Details" : "Time off requests"}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.currentPalette.primary, fontWeight: 400 }}
          >
            {togglePage === "drivers"
              ? "Check the list of all drivers"
              : "Manage your driver time off requests"}
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
          {/* <SearchInput
            searchHook={searchHook}
            placeholder={
              togglePage === "drivers"
                ? "Search By Driver Id..."
                : "Search By Request Id..."
            }
            showClearButton
            sx={{
              width: { xs: "100%", md: 300, lg: 350 },
            }}
            inputSx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: theme.currentPalette.background,
                py: 0.5,
                "&:hover": {
                  borderColor: theme.currentPalette.primary,
                },
              },
            }}
          /> */}

          <TextField
            size="small"
            value={keyword}
            placeholder={
              togglePage === "drivers"
                ? "Search by driver Id..."
                : "Search by timeoff Id..."
            }
            onChange={(e) => {
              setKeyword(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const value = keyword.trim();

                setPage(1);

                if (value) {
                  setActiveKeyword(value);

                  if (togglePage === "drivers") {
                    triggerSearchQuery(value);
                  } else {
                    triggerTimeOffSearch(value);
                  }
                } else {
                  setActiveKeyword("");
                  resetSearchQuery();
                  resetTimeOffSearch();

                  if (togglePage === "drivers") refetchDrivers();
                  if (togglePage === "timeoff") refetchTimeOffs();
                }
              }
            }}
            InputProps={{
              endAdornment: keyword ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setKeyword("");
                      setActiveKeyword("");
                      setPage(1);
                      resetSearchQuery();
                      if (togglePage === "drivers") refetchDrivers();
                      if (togglePage === "timeoff") refetchTimeOffs();
                    }}
                  >
                    <X size={16} color="red" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              width: { xs: "100%", md: 300, lg: 350 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: theme.currentPalette.background,
                py: 0.5,
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 110, width: { xs: "100%", sm: "auto" } }}>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as TStatusFilter);
                setPage(1);
              }}
              sx={controlSx}
              displayEmpty
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="busy">Busy</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          {/* Add Button */}
          {togglePage === "drivers" ? (
            <Box>
              <Button
                onClick={() => setOpenStepper(true)}
                variant="contained"
                startIcon={<Link size={18} />}
                sx={newLoadButtonSx}
              >
                Link Driver
              </Button>

              {/* Stepper Popup */}
              <Dialog
                open={openStepper}
                onClose={() => setOpen(false)}
                slotProps={{
                  paper: {
                    sx: { borderRadius: "10px" },
                  },
                }}
              >
                <LinkDriverPopup onClose={() => setOpenStepper(false)} />
              </Dialog>
            </Box>
          ) : (
            <FormControl size="small">
              <Select
                displayEmpty
                value={timeOffFilter}
                onChange={(e) =>
                  setTimeOffFilter(e.target.value as TTimeOffStatus)
                }
                renderValue={(selected) => {
                  if (!selected) {
                    return (
                      <span style={{ color: theme.currentPalette.primary }}>
                        Select table status...
                      </span>
                    );
                  }
                  return selected;
                }}
                sx={{
                  py: 0.5,
                  width: 150,
                  textAlign: "center",
                  borderRadius: 2,
                  color: theme.currentPalette.primary,
                  textTransform: "capitalize",
                }}
              >
                <MenuItem
                  sx={{ color: theme.currentPalette.primary }}
                  disabled
                  value=""
                >
                  <em>Select table status...</em>
                </MenuItem>

                <MenuItem
                  sx={{ color: theme.currentPalette.primary }}
                  value="all"
                >
                  All
                </MenuItem>
                <MenuItem
                  sx={{ color: theme.currentPalette.primary }}
                  value="pending"
                >
                  Pending
                </MenuItem>
                <MenuItem
                  sx={{ color: theme.currentPalette.primary }}
                  value="approved"
                >
                  Approved
                </MenuItem>
                <MenuItem
                  sx={{ color: theme.currentPalette.primary }}
                  value="rejected"
                >
                  Rejected
                </MenuItem>
                <MenuItem
                  sx={{ color: theme.currentPalette.primary }}
                  value="cancelled"
                >
                  Cancelled
                </MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>

      {error && (
        <Box sx={{ mb: 3 }}>
          <Erros message={error} />
        </Box>
      )}

      {/* Dynamic Table */}
      <DataTable
        columns={currentColumns}
        data={currentData}
        renderRow={renderRow}
        loading={isLoading}
      />

      {/* Pagination */}
      {currentPagination &&
        timeOffFilter === "all" &&
        currentData.length > 0 && (
          <Pagination
            pagination={currentPagination}
            page={page}
            setPage={setPage}
            pageSize={10}
          />
        )}

      {/* Driver Form Modal */}
      <DriverForm
        open={open}
        onClose={() => setOpen(false)}
        formData={formData}
        onChange={handleFormChange}
        onSubmit={editMode ? handleUpdate : handleCreate}
        editMode={editMode}
        isLoading={isCreating || isUpdating}
      />

      {/* MUI Delete Confirmation Toast */}
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

      {/* Delete Confirmation Dialog - Centered */}
      <Dialog
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
      </Dialog>

      {/* Time Off Details Dialog */}
      <Dialog
        open={openTimeOffDialog}
        onClose={() => setOpenTimeOffDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: "hidden",
            width: 400,
            bgcolor: "#fff"
          },
        }}
      >
        {selectedTimeOff && selectedTimeOff.from && selectedTimeOff.to && (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                p: 2,
                borderBottom: 1,
                borderColor: alpha(theme.currentPalette.text, 0.1),
                bgcolor: "#fff"
              }}
            >
              <Typography
                sx={{
                  color: darken(theme.currentPalette.primary, 0.5),
                  fontWeight: 600,
                  fontSize: "24px",
                }}
              >
                Request details
              </Typography>

              <IconButton
                onClick={() => setOpenTimeOffDialog(false)}
                sx={{
                  position: "absolute",
                  right: 12,
                  top: 12,
                  color: theme.currentPalette.text,
                }}
              >
                <X size={20} />
              </IconButton>
            </Box>

            <Box sx={{ p: 4 }}>
              <Box>
                {/* Status */}
                <Box
                  display={"flex"}
                  flexDirection={"column"}
                  alignItems={"flex-start"}
                  gap={1}
                >
                  <Typography
                    color={theme.currentPalette.primary}
                    display={"flex"}
                    alignItems={"center"}
                    gap={1}
                  >
                    <span>
                      <StickyNote />
                    </span>
                    <span className="font-semibold">Status</span>
                  </Typography>
                  {selectedTimeOff.status === "approved" && (
                    <Chip
                      sx={{
                        bgcolor: theme.currentPalette.primary,
                        color: theme.currentPalette.background,
                        px: 0.5,
                        py: 0.5,
                      }}
                      icon={
                        <BadgeCheck
                          style={{ color: theme.currentPalette.background }}
                        />
                      }
                      label={selectedTimeOff.status}
                    />
                  )}
                  {selectedTimeOff.status === "pending" && (
                    <Chip
                      sx={{
                        bgcolor: alpha(theme.currentPalette.primary, 0.1),
                        color: theme.currentPalette.primary,
                        px: 0.5,
                        py: 0.5,
                      }}
                      icon={
                        <Clock3
                          style={{ color: theme.currentPalette.primary }}
                        />
                      }
                      label={selectedTimeOff.status}
                    />
                  )}
                  {(selectedTimeOff.status === "rejected" ||
                    selectedTimeOff.status === "cancelled") && (
                      <Chip
                        sx={{
                          bgcolor: "#B52C17",
                          color: theme.currentPalette.background,
                          px: 0.5,
                          py: 0.5,
                        }}
                        icon={
                          <OctagonX
                            style={{ color: theme.currentPalette.background }}
                          />
                        }
                        label={selectedTimeOff.status}
                      />
                    )}
                </Box>

                {/* Requested Dates */}
                <Box
                  sx={{ my: 2 }}
                  display={"flex"}
                  flexDirection={"column"}
                  alignItems={"flex-start"}
                  gap={1}
                >
                  <Typography
                    color={theme.currentPalette.primary}
                    display={"flex"}
                    alignItems={"center"}
                    gap={1}
                  >
                    <span>
                      <Calendar />
                    </span>
                    <span className="font-semibold">Requested dates</span>
                  </Typography>

                  <Box display={"flex"} alignItems={"center"} gap={1}>
                    <Chip
                      label={(() => {
                        const from = new Date(selectedTimeOff.from);
                        const to = new Date(selectedTimeOff.to);
                        if (isNaN(from.getTime()) || isNaN(to.getTime()))
                          return "Invalid date";
                        const diffTime = Math.abs(
                          to.getTime() - from.getTime(),
                        );
                        const diffDays = Math.ceil(
                          diffTime / (1000 * 60 * 60 * 24),
                        );
                        return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
                      })()}
                      sx={{
                        color: theme.currentPalette.primary,
                        fontWeight: "bold",
                        bgcolor: alpha(theme.currentPalette.primary, 0.1),
                        borderRadius: 2,
                      }}
                    />
                    <span style={{ color: theme.currentPalette.primary }}>
                      {new Date(selectedTimeOff.from).toLocaleDateString()} -{" "}
                      {new Date(selectedTimeOff.to).toLocaleDateString()}
                    </span>
                  </Box>
                </Box>

                {/* Reason */}
                <Box
                  display={"flex"}
                  flexDirection={"column"}
                  alignItems={"flex-start"}
                  gap={1}
                >
                  <Typography
                    color={theme.currentPalette.primary}
                    display={"flex"}
                    alignItems={"center"}
                    gap={1}
                  >
                    <span>
                      <NotebookText />
                    </span>
                    <span className="font-semibold">Reason</span>
                  </Typography>
                  <Typography
                    sx={{
                      color: theme.currentPalette.text,
                      bgcolor: alpha(theme.currentPalette.primary, 0.1),
                      p: 2,
                      width: "100%",
                      borderRadius: 2,
                    }}
                  >
                    {selectedTimeOff.reason}
                  </Typography>
                </Box>
              </Box>

              {/* pending */}
              {selectedTimeOff.status === "pending" && (
                <Box
                  sx={{
                    mt: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    justifyContent: "center",
                  }}
                >
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: theme.currentPalette.primary,
                      color: theme.currentPalette.background,
                      borderRadius: 2,
                      width: "full",
                      py: 1,
                      textTransform: "capitalize",
                    }}
                    disabled={updatingId === selectedTimeOff.id}
                    onClick={() => {
                      handleTimeOffStatus(
                        selectedTimeOff.id,
                        "approved",
                        "Approved by admin",
                      );
                      setOpenTimeOffDialog(false);
                    }}
                  >
                    {updatingId === selectedTimeOff.id
                      ? "Approving..."
                      : "Approve"}
                  </Button>

                  <Button
                    variant="outlined"
                    sx={{
                      border: `1px solid ${theme.currentPalette.primary}`,
                      color: theme.currentPalette.primary,
                      borderRadius: 2,
                      width: "full",
                      py: 1,
                      textTransform: "capitalize",
                    }}
                    disabled={updatingId === selectedTimeOff.id}
                    onClick={() => {
                      handleTimeOffStatus(
                        selectedTimeOff.id,
                        "rejected",
                        "Not available",
                      );
                      setOpenTimeOffDialog(false);
                    }}
                  >
                    Reject
                  </Button>
                </Box>
              )}
            </Box>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default DriversPage;
