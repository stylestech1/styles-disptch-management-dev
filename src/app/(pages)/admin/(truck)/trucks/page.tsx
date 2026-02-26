/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Erros from "@/components/ui/Erros";
import { RootState, useAppSelector } from "@/redux/store";
import { TTruck } from "@/types/globalTypes";
import Loading from "@/components/ui/Loading";
import toast, { Toaster } from "react-hot-toast";
import { IoAdd } from "react-icons/io5";
import {
  Dialog,
  Button,
  TableRow,
  Box,
  IconButton,
  Tooltip,
  Typography,
  SxProps,
  alpha,
  darken,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  FormControl,
  InputAdornment,
  Select,
  TextField,
} from "@mui/material";
import Pagination from "@/components/ui/Pagination";
import {
  useCreateTruckMutation,
  useDeleteTruckMutation,
  useGetTrucksWithPaginationQuery,
  useGetTruckWithSearchQuery,
  useLazyGetDriversQuery,
  useLazyGetTruckByTruckIdQuery,
  useUpdateTruckMutation,
  useGetSettingsQuery,
  useUpdateSettingMutation,
} from "@/redux/slices/apiSlice";
import { TruckForm } from "@/components/truck/TruckForm";
import StatsCard from "@/components/ui/StatsCard";
import { Dayjs } from "dayjs";
import useError from "@/hook/useError";
import { StatusChip } from "@/components/ui/TablesMUI";
import { useSearchSubmit } from "@/hook/useSearchSubmit";
import { setLoading } from "@/redux/slices/uiSlice";
import SearchInput from "@/components/ui/SearchInput";
import DataTable from "@/components/ui/DataTable";
import { truckColumns } from "@/data/truckTables";
import {
  Ban,
  CircleCheckBig,
  Navigation,
  Truck,
  Eye,
  SquarePen,
  Trash2,
  CircleEllipsis,
  X,
  Building2,
  Calendar,
  IdCard,
  Fuel,
  Weight,
  ShieldUser,
  CarFront,
  Wrench,
} from "lucide-react";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { ViewTruckDialog } from "@/components/truck/ViewPopup";

type TStatusFilter = "all" | "available" | "busy" | "inactive";

const TrucksPage: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);

  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [isFiltered, setIsFiltered] = useState(false);
  const [page, setPage] = useState(1);
  const [deleteToast, setDeleteToast] = useState({ open: false, message: "" });
  const { error } = useError();
  const theme = useAppSelector((state: RootState) => state.palette);

  const [statusFilter, setStatusFilter] = useState<TStatusFilter>("all");

  const [actionsAnchorEl, setActionsAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTruck, setSelectedTruck] = useState<TTruck | null>(null);
  const actionsOpen = Boolean(actionsAnchorEl);

  const [viewOpen, setViewOpen] = useState(false);

  const openActionsMenu = (e: React.MouseEvent<HTMLElement>, truck: TTruck) => {
    e.stopPropagation();
    setSelectedTruck(truck);
    setActionsAnchorEl(e.currentTarget);
  };

  const closeActionsMenu = () => setActionsAnchorEl(null);

  const handleViewClick = () => {
    closeActionsMenu();
    setViewOpen(true);
  };

  const handleCloseView = () => setViewOpen(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [maintenanceRate, setMaintenanceRate] = useState("");
  const [insuranceRate, setInsuranceRate] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [maintenanceError, setMaintenanceError] = useState("");
  const [insuranceError, setInsuranceError] = useState("");

  const [initialMaintenanceRate, setInitialMaintenanceRate] = useState("");
  const [initialInsuranceRate, setInitialInsuranceRate] = useState("");
  const [repairSettingId, setRepairSettingId] = useState("");
  const [insuranceSettingId, setInsuranceSettingId] = useState("");

  const sanitizeDecimal = (v: string) => {
    let s = v.replace(/[^\d.]/g, "");
    const parts = s.split(".");
    if (parts.length > 2) s = parts[0] + "." + parts.slice(1).join("");
    return s;
  };

  const validateNumber = (v: string) => {
    if (!v.trim()) return "Required";
    if (!/^\d+(\.\d+)?$/.test(v)) return "Must be a valid number";
    return "";
  };

  const {
    data: settingsResp,
    isFetching: settingsFetching,
    isLoading: settingsLoading,
    refetch: refetchSettings,
  } = useGetSettingsQuery(undefined, {
    skip: !settingsOpen,
    refetchOnMountOrArgChange: true,
  });

  const openSettings = () => {
    // optional: clear previous values while opening
    setMaintenanceError("");
    setInsuranceError("");

    setSettingsOpen(true);

    setTimeout(() => {
      refetchSettings?.();
    }, 0);
  };

  const closeSettings = () => setSettingsOpen(false);

  useEffect(() => {
    // if (!settingsOpen) return;

    const raw = settingsResp?.raw ?? [];
    const dataObj = settingsResp?.data;

    if (!raw.length && !dataObj) return;

    const repairRow = raw.find((x: any) => x?.key === "repairPerMile");
    const insuranceRow = raw.find((x: any) => x?.key === "insurancePerMile");

    const repairId = repairRow?.id ? String(repairRow.id) : "";
    const insuranceId = insuranceRow?.id ? String(insuranceRow.id) : "";

    setRepairSettingId(repairId);
    setInsuranceSettingId(insuranceId);

    const m =
      dataObj?.repairPerMile != null
        ? String(dataObj.repairPerMile)
        : repairRow?.value != null
          ? String(repairRow.value)
          : "";

    const i =
      dataObj?.insurancePerMile != null
        ? String(dataObj.insurancePerMile)
        : insuranceRow?.value != null
          ? String(insuranceRow.value)
          : "";

    setMaintenanceRate(m);
    setInsuranceRate(i);

    setInitialMaintenanceRate(m);
    setInitialInsuranceRate(i);

    setMaintenanceError("");
    setInsuranceError("");
  }, [settingsOpen, settingsResp]);

  const isDirty =
    maintenanceRate !== initialMaintenanceRate ||
    insuranceRate !== initialInsuranceRate;

  const idsReady = !!repairSettingId && !!insuranceSettingId;

  const isSaveDisabled =
    settingsSaving ||
    settingsFetching ||
    settingsLoading ||
    !idsReady ||
    !isDirty ||
    !!maintenanceError ||
    !!insuranceError;

  const [updateSetting] = useUpdateSettingMutation();

  const handleSaveSettings = async () => {
    const repair = Number(maintenanceRate);
    const insurance = Number(insuranceRate);

    const mErr = validateNumber(maintenanceRate);
    const iErr = validateNumber(insuranceRate);

    setMaintenanceError(mErr);
    setInsuranceError(iErr);

    if (mErr || iErr) return;

    const repairChanged = maintenanceRate !== initialMaintenanceRate;
    const insuranceChanged = insuranceRate !== initialInsuranceRate;

    if (!repairChanged && !insuranceChanged) return;

    if (repairChanged && !repairSettingId)
      return toast.error("Repair setting ID not found. Please re-open settings.");

    if (insuranceChanged && !insuranceSettingId)
      return toast.error("Insurance setting ID not found. Please re-open settings.");

    try {
      setSettingsSaving(true);

      const tasks: Promise<any>[] = [];

      if (repairChanged) {
        tasks.push(
          updateSetting({
            id: repairSettingId,
            key: "repairPerMile",
            value: repair,
          }).unwrap()
        );
      }

      if (insuranceChanged) {
        tasks.push(
          updateSetting({
            id: insuranceSettingId,
            key: "insurancePerMile",
            value: insurance,
          }).unwrap()
        );
      }

      await Promise.all(tasks);

      toast.success("Settings saved successfully");

      await refetchSettings();

      setInitialMaintenanceRate(String(repair));
      setInitialInsuranceRate(String(insurance));
      setSettingsOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to save settings");
    } finally {
      setSettingsSaving(false);
    }
  };

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
    { data: truckByIdData, isLoading: truckByIdLoading, reset: resetSearchQuery },
  ] = useLazyGetTruckByTruckIdQuery();

  const [triggerDriverForTruck, { data: allDriversAvailable }] = useLazyGetDriversQuery();

  useEffect(() => {
    triggerDriverForTruck({} as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (term.trim()) triggerSearchQuery(encodeURIComponent(term));
    },
    onReset: () => {
      setPage(1);
      resetSearchQuery();
      refetchTrucks();
    },
  });
  const { isSearching } = searchHook;

  // Mutations
  const [createTruck, { isLoading: isCreating }] = useCreateTruckMutation();
  const [updateTruck, { isLoading: isUpdating }] = useUpdateTruckMutation();
  const [deleteTruck] = useDeleteTruckMutation();

  const truck = useMemo(() => {
    if (isSearching && truckByIdData?.data) {
      return Array.isArray(truckByIdData.data) ? truckByIdData.data : [truckByIdData.data];
    }
    if (isFiltered && filteredData?.data) return filteredData.data;
    return trucksData?.data || [];
  }, [isSearching, isFiltered, truckByIdData, filteredData, trucksData]);

  const tableData = useMemo(() => {
    if (statusFilter === "all") return truck;
    const wanted = statusFilter.toLowerCase();
    return (truck || []).filter((t: any) => String(t?.status || "").toLowerCase() === wanted);
  }, [truck, statusFilter]);

  const pagination = isFiltered
    ? filteredData?.paginationResult || null
    : trucksData?.paginationResult || null;

  useEffect(() => {
    setLoading(trucksLoading && !trucksData);
  }, [trucksLoading, trucksData]);

  const statsData = useMemo(() => {
    const statsTruckData = (trucksData as any)?.stats || [];
    if (!statsTruckData || statsTruckData.length === 0)
      return { totalTrucks: 0, available: 0, busy: 0, inactive: 0 };
    return {
      totalTrucks: statsTruckData.total,
      available: statsTruckData.available,
      busy: statsTruckData.busy,
      inactive: statsTruckData.inactive,
    };
  }, [(trucksData as any)?.stats]);

  // Modal states
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<TTruck>>({});
  const [editMode, setEditMode] = useState(false);

  // Delete flow state
  const [truckToDelete, setTruckToDelete] = useState<{ id: string; truckId?: number } | null>(null);

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
        ? (truck.assignedDriver as any)?.id
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
      assignedDriver: assignedDriverId as any,
      source: (truck as any)?.source,
    });
    setEditMode(true);
    setOpen(true);
  }, []);

  const handleFormChange = useCallback(<K extends keyof TTruck>(field: K, value: TTruck[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleCreate = useCallback(async () => {
    if (!user?.id) return toast.error("User not found!");
    try {
      await createTruck({ ...(formData as any), createdBy: user.id }).unwrap();
      toast.success("Truck created successfully!");
      setOpen(false);
      refetchTrucks();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || "Creating truck failed ");
    }
  }, [createTruck, formData, user?.id, refetchTrucks]);

  const handleUpdate = useCallback(async () => {
    if (!formData?.id) return toast.error("Missing truck ID");
    if (!user?.id) return toast.error("User not found!");

    try {
      await updateTruck({
        id: formData.id as any,
        ...(formData as any),
        updatedBy: user.id,
      }).unwrap();

      toast.success(" Truck updated successfully!");
      setOpen(false);
      refetchTrucks();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || "Updating truck failed ");
    }
  }, [updateTruck, formData, user?.id, refetchTrucks]);

  const handleDelete = useCallback((id: string, truckId?: number) => {
    setDeleteToast({
      open: true,
      message: `Are you sure you want to delete truck #${truckId ?? ""}?`,
    });
    setTruckToDelete({ id, truckId });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!truckToDelete) return;
    try {
      await deleteTruck(truckToDelete.id).unwrap();
      refetchTrucks();
      toast.success(` Truck #${truckToDelete.truckId} deleted successfully!`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || "Deleting truck failed ");
    } finally {
      setDeleteToast({ open: false, message: "" });
      setTruckToDelete(null);
    }
  }, [truckToDelete, deleteTruck, refetchTrucks]);

  const cancelDelete = useCallback(() => {
    setDeleteToast({ open: false, message: "" });
    setTruckToDelete(null);
  }, []);

  // View popup UI helpers
  const driverName =
    selectedTruck &&
    (typeof selectedTruck.assignedDriver === "object"
      ? (selectedTruck.assignedDriver as any)?.name
      : selectedTruck.assignedDriver);

  const driverId =
    selectedTruck && typeof selectedTruck.assignedDriver === "object"
      ? (selectedTruck.assignedDriver as any)?.driverId
      : undefined;

  const statusLabel = (selectedTruck as any)?.status ?? "N/A";

  // Render Table Row
  const renderTruckRow = (t: TTruck) => {
    const tableRowSx: SxProps = {
      bgcolor: theme.currentPalette.background,
      "&:hover": {
        backgroundColor: alpha(theme.currentPalette.primary, 0.05),
        cursor: "pointer",
      },
      transition: "all 0.2s ease-in-out",
    };

    return (
      <TableRow sx={tableRowSx} key={t.id || (t as any).truckId}>
        <td className="p-4 text-center text-slate-700 font-medium">{t.plateNumber || "-"}</td>

        <td className="p-4 text-center">
          {typeof t.assignedDriver === "object"
            ? (t.assignedDriver as any)?.name
            : t.assignedDriver || "Unassigned"}
          {typeof t.assignedDriver === "object" && (t.assignedDriver as any)?.driverId && (
            <Box component="span" sx={{ fontSize: "0.75rem", color: "text.secondary", display: "block" }}>
              ID: {(t.assignedDriver as any)?.driverId}
            </Box>
          )}
        </td>

        <td className="p-4 text-center">{t.fuelPerMile ?? "N/A"}</td>
        <td className="p-4 text-center">{t.totalMileage ?? "N/A"}</td>

        <td className="p-4 text-center">
          <StatusChip status={t.status as any} />
        </td>

        <td className="p-4 text-center">
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Tooltip title="Actions">
              <IconButton
                onClick={(e) => openActionsMenu(e, t)}
                size="small"
                sx={{ width: 34, height: 34, color: theme.currentPalette.primary }}
              >
                <CircleEllipsis size={24} />
              </IconButton>
            </Tooltip>
          </Box>
        </td>
      </TableRow>
    );
  };

  const isInitialLoading = truckByIdLoading && !trucksData;
  if (isInitialLoading) return <Loading />;

  const containerSx: SxProps = { p: 3 };

  const searchFilterContainerSx: SxProps = {
    display: "flex",
    flexDirection: { xs: "column", md: "row" },
    alignItems: { xs: "flex-start", md: "center" },
    justifyContent: "space-between",
    gap: { xs: 2, md: 0 },
    p: 2,
    my: 2,
    border: `1px solid ${alpha(theme.currentPalette.primary, 0.25)}`,
    borderRadius: 2,
    backgroundColor: theme.currentPalette.background,
    width: "100%",
  };
  const CONTROL_H = 46;

  const newLoadButtonSx: SxProps = {
    height: CONTROL_H,
    px: 3,
    fontWeight: 700,
    fontSize: "0.95rem",
    borderRadius: 2,
    width: { xs: "100%", md: "auto" },
    background: theme.currentPalette.primary,
    color: theme.currentPalette.background,
    textTransform: "capitalize",
    "&:hover": { background: darken(theme.currentPalette.primary, 0.1) },
  };


  const controlSx: SxProps = {
    height: CONTROL_H,
    borderRadius: 2,
    bgcolor: "#fff",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: alpha(theme.currentPalette.primary, 0.25),
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: alpha(theme.currentPalette.primary, 0.5),
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.currentPalette.primary,
    },

    "& .MuiSelect-select": {
      display: "flex",
      alignItems: "center",
      height: CONTROL_H,
      paddingTop: 0,
      paddingBottom: 0,
    },
  };

  return (
    <Box sx={containerSx}>
      <Toaster position="top-center" />

      {/* Stats */}
      <Box sx={{ mt: 4, mb: 5 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 my-10">
          <StatsCard title="Total Trucks" value={statsData.totalTrucks} icon={Truck} iconColor={theme.currentPalette.primary} />
          <StatsCard title="Available" value={statsData.available} icon={CircleCheckBig} iconColor={theme.currentPalette.primary} />
          <StatsCard title="Busy" value={statsData.busy} icon={Navigation} iconColor={theme.currentPalette.primary} />
          <StatsCard title="Inactive" value={statsData.inactive} icon={Ban} iconColor={theme.currentPalette.primary} />
        </div>
      </Box>

      {/* Search & Filter */}
      <Box sx={searchFilterContainerSx}>
        <Box>
          <Typography variant="h6" sx={{ color: theme.currentPalette.primary, fontWeight: 700 }}>
            Trucks Details
          </Typography>
          <Typography variant="body2" sx={{ color: alpha(theme.currentPalette.primary, 0.8), fontWeight: 400 }}>
            Check list of all trucks
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: { xs: "stretch", md: "flex-end" },
            gap: 1.2,
            width: { xs: "100%", md: "auto" },
          }}
        >
          <SearchInput
            searchHook={searchHook}
            placeholder="Search trucks by ID.."
            showClearButton
            sx={{ width: { xs: "100%", sm: 260, md: 260, lg: 320 } }}
            inputSx={{
              "& .MuiOutlinedInput-root": {
                ...controlSx,
                px: 0.5,
              },
              "& .MuiOutlinedInput-input": {
                paddingTop: 0,
                paddingBottom: 0,
                height: CONTROL_H,
                display: "flex",
                alignItems: "center",
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

          <div className="flex gap-3">
            <Button onClick={handleOpenAdd} variant="contained" startIcon={<IoAdd size={20} />} sx={newLoadButtonSx}>
              Add Truck
            </Button>

            {/* Settings Icon */}
            <Tooltip title="Global Trucks Settings">
              <IconButton
                onClick={openSettings}
                sx={{
                  width: CONTROL_H,         
                  height: CONTROL_H,       
                  borderRadius: 2,
                  bgcolor: "#fff",
                  border: `1px solid ${alpha(theme.currentPalette.primary, 0.25)}`,
                  color: theme.currentPalette.primary,
                  "&:hover": { bgcolor: alpha(theme.currentPalette.primary, 0.06) },
                }}
              >
                <Wrench size={18} />
              </IconButton>
            </Tooltip>
          </div>
        </Box>
      </Box>

      {error && (
        <Box sx={{ mb: 3 }}>
          <Erros message={error} />
        </Box>
      )}

      <DataTable
        columns={truckColumns}
        data={tableData}
        renderRow={renderTruckRow}
        loading={(isSearching && truckByIdLoading) || (isFiltered && !!filteredData) || (trucksLoading && !trucksData)}
      />

      {!isFiltered && !isSearching && pagination && tableData.length > 0 && (
        <Pagination pagination={pagination} page={page} setPage={setPage} pageSize={10} showInfo={true} />
      )}

      {/* Actions menu */}
      <Menu
        anchorEl={actionsAnchorEl}
        open={actionsOpen}
        onClose={closeActionsMenu}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: {
            borderRadius: 1.5,
            mt: 1,
            bgcolor: "#fff",
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            border: `1px solid ${alpha(theme.currentPalette.primary, 0.12)}`,
          },
        }}
      >
        <MenuItem onClick={() => selectedTruck && handleViewClick()} sx={{ fontSize: "14px" }}>
          <ListItemIcon sx={{ minWidth: 34, color: theme.currentPalette.primary }}>
            <Eye size={18} />
          </ListItemIcon>
          <ListItemText primary="View" slotProps={{ primary: { sx: { color: theme.currentPalette.primary } } }} />
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (selectedTruck) handleEditClick(selectedTruck);
            closeActionsMenu();
          }}
          sx={{ fontSize: "14px" }}
        >
          <ListItemIcon sx={{ minWidth: 34, color: theme.currentPalette.primary }}>
            <SquarePen size={18} />
          </ListItemIcon>
          <ListItemText primary="Edit Details" slotProps={{ primary: { sx: { color: theme.currentPalette.primary } } }} />
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (selectedTruck) handleDelete(selectedTruck.id, (selectedTruck as any).truckId);
            closeActionsMenu();
          }}
          sx={{ fontSize: "14px" }}
        >
          <ListItemIcon sx={{ minWidth: 34, color: "error.main" }}>
            <Trash2 size={18} />
          </ListItemIcon>
          <ListItemText primary="Delete" slotProps={{ primary: { sx: { color: "error.main" } } }} />
        </MenuItem>
      </Menu>

      {/* SETTINGS MODAL */}
      <Dialog
        open={settingsOpen}
        onClose={closeSettings}
        PaperProps={{
          sx: {
            borderRadius: 3,
            width: "min(600px, calc(100vw - 28px))",
            overflow: "auto",
            bgcolor: "#fff",
            boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, bgcolor: "#fff" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.4 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                bgcolor: "#EEF4FF",
                border: "1px solid #E6EEFF",
                color: theme.currentPalette.primary,
              }}
            >
              <Wrench size={18} />
            </Box>
            <Typography sx={{ fontSize: 22, fontWeight: 800 }}>
              Global Trucks Settings
            </Typography>
          </Box>

          <IconButton onClick={closeSettings} sx={{ color: "#111827", "&:hover": { bgcolor: alpha(theme.currentPalette.primary, 0.06) } }}>
            <X size={18} />
          </IconButton>
        </Box>

        <Divider />

        <Box sx={{ px: 3, pb: 3, mt: 1 }}>
          <Typography sx={{ mt: 0.5, mb: 2.5, color: theme.currentPalette.primary }}>
            Global rate configurations for cost estimation.
          </Typography>

          <Box sx={{ display: "grid", gap: 1 }}>
            <TextField
              fullWidth
              label="Maintenance Rate"
              required
              value={maintenanceRate}
              onChange={(e) => {
                const next = sanitizeDecimal(e.target.value);
                setMaintenanceRate(next);
                setMaintenanceError(validateNumber(next));
              }}
              onBlur={() => setMaintenanceError(validateNumber(maintenanceRate))}
              placeholder="e.g. 0.45"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              inputProps={{ inputMode: "decimal", pattern: "[0-9.]*" }}
              error={!!maintenanceError}
              helperText={maintenanceError || " "}
              sx={{
                "& .MuiOutlinedInput-root": { height: 64, borderRadius: 2, bgcolor: "#fff" },
                "& .MuiInputLabel-root": { fontSize: 14 },
                "& .MuiFormLabel-asterisk": { color: "red" },
                "& .MuiOutlinedInput-input": { color: theme.currentPalette.primary, },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: alpha(theme.currentPalette.primary, 0.5),
                },
                "&:hover": { borderColor: alpha(theme.currentPalette.primary, 0.06) }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography>$ / Mile</Typography>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Insurance Rate"
              value={insuranceRate}
              required
              onChange={(e) => {
                const next = sanitizeDecimal(e.target.value);
                setInsuranceRate(next);
                setInsuranceError(validateNumber(next));
              }}
              onBlur={() => setInsuranceError(validateNumber(insuranceRate))}
              placeholder="e.g. 0.45"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              inputProps={{ inputMode: "decimal", pattern: "[0-9.]*" }}
              error={!!insuranceError}
              helperText={insuranceError || " "}
              sx={{
                "& .MuiOutlinedInput-root": { height: 64, borderRadius: 2, bgcolor: "#fff" },
                "& .MuiInputLabel-root": { fontSize: 14 },
                "& .MuiFormLabel-asterisk": { color: "red" },
                "& .MuiOutlinedInput-input": { color: theme.currentPalette.primary, },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: alpha(theme.currentPalette.primary, 0.5),
                },
                "&:hover": { borderColor: alpha(theme.currentPalette.primary, 0.06) }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography>$ / Mile</Typography>
                  </InputAdornment>
                ),
              }}
            />

            <Typography sx={{ fontSize: 12 }}>
              Note: Calculations are based on (Cost = Total Mileage × Rate)
            </Typography>

            <Button
              onClick={handleSaveSettings}
              disabled={isSaveDisabled}
              variant="contained"
              sx={{
                mt: 1,
                height: 54,
                borderRadius: 2,
                fontWeight: 800,
                bgcolor: theme.currentPalette.primary,
                "&:hover": { bgcolor: darken(theme.currentPalette.primary, 0.1) },
              }}
            >
              {settingsSaving ? "Saving..." : settingsFetching ? "Loading..." : "Save"}
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Truck Form */}
      <TruckForm
        open={open}
        onClose={() => setOpen(false)}
        formData={formData}
        onChange={handleFormChange}
        onSubmit={editMode ? handleUpdate : handleCreate}
        editMode={editMode}
        isLoading={isCreating || isUpdating}
        allDrivers={Array.isArray((allDriversAvailable as any)?.data) ? ((allDriversAvailable as any).data as any) : []}
        allTrucks={(trucksData as any)?.data?.data || []}
        refetch={refetchTrucks}
      />
      <ViewTruckDialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        selectedTruck={selectedTruck}
        theme={theme}
      />
      {/* Delete overlay */}
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

      {/* Delete dialog */}
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
          "& .MuiDialog-container": { display: "flex", alignItems: "center", justifyContent: "center" },
        }}
      >
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "text.primary" }}>
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
                "&:hover": { borderColor: "grey.600", backgroundColor: "grey.50" },
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