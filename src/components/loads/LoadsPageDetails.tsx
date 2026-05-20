/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

// Components
import DataTable from "@/components/ui/DataTable";
import Erros from "@/components/ui/Erros";
import Loading from "@/components/ui/Loading";
import Pagination from "@/components/ui/Pagination";
import StatsCard from "@/components/ui/StatsCard";
import SearchInput from "@/components/ui/SearchInput";
import CreateEditLoadModal from "@/components/loads/CreateEditLoadModal";

// Hooks
import useError from "@/hook/useError";
import useLoading from "@/hook/useLoading";
import { useSearchSubmit } from "@/hook/useSearchSubmit";
import { useFilter } from "@/providers/FilterProvider";

// Types
import { TLoads } from "@/types/globalTypes";

// API & Data
import { loadColumns } from "@/data/loadTables";
import {
  useGetLoadsQuery,
  useGetNotesQuery,
  useGetLoadsWithFilterQuery,
  useLazyGetLoadByIdQuery,
} from "@/redux/slices/apiSlice";

// Utils
import { getErrorMessage } from "@/utils/getErrorMessage";

// Store
import { RootState, useAppSelector } from "@/redux/store";

// Icons
import { IoAdd, IoCheckmark, IoNavigate, IoLocationSharp } from "react-icons/io5";

// MUI
import {
  alpha,
  Box,
  Button,
  Chip,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  SxProps,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

// Styles
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { Boxes, Clock, Goal, LandPlot, MapPin, NotepadText } from "lucide-react";

type LoadStatusFilter = "all" | "pending" | "in_transit" | "delivered";
const CONTROL_H = 42;

// ---------- helpers ----------
const toTitle = (v: string) =>
  v
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");

const formatLocationShort = (value?: string) => {
  const v = (value || "").trim();
  if (!v) return "-";

  const parts = v
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 3) {
    const city = parts[1];
    const stateChunk = parts[2];
    const state = stateChunk.split(/\s+/)[0];

    if (city && state) return `${city}, ${state}`;
    if (city) return city;
  }

  // If already "City, ST"
  if (parts.length === 2) {
    const city = parts[0];
    const state = parts[1].split(/\s+/)[0];
    return `${city}, ${state}`;
  }

  return v;
};

const LocationLine = ({
  icon,
  value,
  theme,
}: {
  icon: React.ReactNode;
  value?: string;
  theme: any;
}) => {
  const full = (value || "").trim();
  const short = formatLocationShort(full);

  return (
    <Tooltip
      title={full || "-"}
      placement="right"
      arrow
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: "#0f172a",
            fontSize: 12,
            borderRadius: 2,
            px: 1.2,
            py: 0.8,
          },
        },
        arrow: { sx: { color: "#0f172a" } },
      }}
    >
      {/* خلي العرض كله ثابت */}
      <div className="flex items-start gap-2 max-w-[180px]">
        {/* ✅ أيقونة ثابتة بدون mt */}
        <span className="w-[18px] flex justify-center shrink-0 leading-[20px]">
          {icon}
        </span>

        {/* ✅ أهم حاجة: min-w-0 عشان يلف */}
        <span
          className="min-w-0 text-sm font-medium whitespace-normal break-words leading-[20px]"
          style={{ color: theme.currentPalette.primary }}
        >
          {short}
        </span>
      </div>
    </Tooltip>
  );
};
const StatusChip = ({ status, theme }: { status?: string; theme: any }) => {
  const s = (status || "").toLowerCase();
  const primary = theme.currentPalette.primary;
  const white = theme.currentPalette.background;

  // const dot = (bg: string) => (
  //   <span
  //     style={{
  //       width: 8,
  //       height: 8,
  //       borderRadius: "50%",
  //       backgroundColor: bg,
  //     }}
  //   />
  // );
  if (s === "pending") {
    return (
      <Chip
        label="Pending"
        size="small"
        // icon={dot(primary)}
        sx={{
          height: 26,
          borderRadius: 2,
          bgcolor: alpha(primary, 0.10),
          color: primary,
          border: `1px solid ${alpha(primary, 0.25)}`,
          pl: 0.25,
          "& .MuiChip-label": { fontWeight: 800, fontSize: 12 },
        }}
      />
    );
  }
  if (s === "in_transit") {
    return (
      <Chip
        label="In Transit"
        size="small"
        // icon={dot(white)}
        sx={{
          height: 26,
          borderRadius: 2,
          bgcolor: alpha(primary, 0.75),
          color: white,
          border: `1px solid ${alpha(primary, 0.75)}`,
          pl: 0.25,
          "& .MuiChip-label": { fontWeight: 800, fontSize: 12 },
        }}
      />
    );
  }
  if (s === "delivered") {
    return (
      <Chip
        label="Delivered"
        size="small"
        // icon={dot(white)}
        sx={{
          height: 26,
          borderRadius: 2,
          bgcolor: primary,
          color: white,
          border: `1px solid ${primary}`,
          pl: 0.25,
          "& .MuiChip-label": { fontWeight: 800, fontSize: 12 },
        }}
      />
    );
  }
  return (
    <Chip
      label={toTitle(s || "unknown")}
      size="small"
      // icon={dot(alpha(primary, 0.6))}
      sx={{
        height: 26,
        borderRadius: 2,
        bgcolor: alpha(primary, 0.08),
        color: primary,
        border: `1px solid ${alpha(primary, 0.18)}`,
        pl: 0.25,
        "& .MuiChip-label": { fontWeight: 800, fontSize: 12 },
      }}
    />
  );
};
// ---------- page ----------
const LoadsPageDetails = () => {
  const [page, setPage] = useState(1);
  const router = useRouter();
  const userRole = useAppSelector((state: RootState) => state.auth.user?.role);
  const theme = useAppSelector((state: RootState) => state.palette);

  const { fromDate, toDate, isFiltered } = useFilter();

  const [statusFilter, setStatusFilter] = useState<LoadStatusFilter>("all");

  // Modal states
  const [showCreateEditModal, setShowCreateEditModal] = useState(false);
  const [selectedLoadForNotes, setSelectedLoadForNotes] = useState<TLoads | null>(null);
  const [editingLoad, setEditingLoad] = useState<TLoads | null>(null);

  // Loading & Error states
  const { setLoading } = useLoading();
  const { error, setError } = useError();

  const [
    triggerSearchQuery,
    {
      data: loadByIdData,
      isLoading: loadByIdLoading,
      error: loadByIdError,
      reset: resetSearchQuery,
    },
  ] = useLazyGetLoadByIdQuery();

  // Search Hook
  const searchHook = useSearchSubmit({
    onSearch: (term) => {
      setPage(1);
      if (term.trim()) triggerSearchQuery(encodeURIComponent(term));
    },
    onReset: () => {
      setPage(1);
      resetSearchQuery();
      refetchLoads();
    },
  });

  const { isSearching } = searchHook;

  const {
    data: loadsData,
    isLoading: loadsLoading,
    error: loadsError,
    refetch: refetchLoads,
  } = useGetLoadsQuery(
    { page, limit: 10 },
    {
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: false,
    }
  );

  useGetNotesQuery(selectedLoadForNotes?.id || "", { skip: !selectedLoadForNotes?.id });

  const { data: filteredData, isLoading: filterLoading } = useGetLoadsWithFilterQuery(
    {
      from: fromDate ? fromDate.format("YYYY-MM-DD") : undefined,
      to: toDate ? toDate.format("YYYY-MM-DD") : undefined,
      page,
      limit: 10,
    },
    {
      skip: !isFiltered || !fromDate || !toDate,
      refetchOnFocus: false,
    }
  );

  useEffect(() => {
    if (isFiltered && fromDate && toDate) setPage(1);
  }, [isFiltered, fromDate, toDate]);
  const [keyword, setKeyword] = useState("");
  // Base data (search/date-filter/default)
  const baseLoads = useMemo<TLoads[]>(() => {
    if (isFiltered && filteredData?.data) return filteredData.data;
    return loadsData?.data || [];
  }, [isFiltered, filteredData, loadsData]);

  const load = useMemo(() => {
    const searchValue = keyword.trim().toLowerCase();

    let data = baseLoads;

    if (statusFilter !== "all") {
      data = data.filter(
        (item) => (item.status || "").toLowerCase() === statusFilter
      );
    }

    if (searchValue) {
      data = data.filter((item: any) =>
        Object.values(item).some((value) => {
          if (typeof value === "object" && value !== null) {
            return Object.values(value).some((nestedValue) =>
              String(nestedValue || "")
                .toLowerCase()
                .includes(searchValue)
            );
          }

          return String(value || "")
            .toLowerCase()
            .includes(searchValue);
        })
      );
    }

    return data;
  }, [baseLoads, statusFilter, keyword]);

  const pagination = isFiltered ? filteredData?.paginationResult || null : loadsData?.paginationResult || null;

  useEffect(() => {
    setLoading(loadsLoading && !loadsData);
  }, [loadsLoading, loadsData, setLoading]);

  useEffect(() => {
    const currentError = loadsError || loadByIdError;
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
  }, [loadsError, loadByIdError, setError]);

  // Stats cards
  const statsData = useMemo(() => {
    const statLoadData: any = loadsData?.stats || [];
    if (!statLoadData || statLoadData.length === 0)
      return { totalLoads: 0, pending: 0, inTransit: 0, delivered: 0 };
    return {
      totalLoads: statLoadData.total,
      pending: statLoadData.pending,
      inTransit: statLoadData.inTransit,
      delivered: statLoadData.delivered,
    };
  }, [loadsData?.stats]);

  if (loadsLoading && !loadsData) return <Loading />;

  const renderLoadRow = (loadItem: TLoads) => {
    const hasComments = loadItem.comments && loadItem.comments.length > 0;
    const commentsCount = loadItem.comments?.length || 0;

    const navigateToLoadDetails = (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();

      const path =
        userRole === "admin"
          ? `/admin/loadDetails/${encodeURIComponent(String(loadItem.id))}`
          : `/dispatchers/loadDetails/${encodeURIComponent(String(loadItem.id))}`;

      router.push(path);
    };

    const tableRowSx: SxProps = {
      bgcolor: theme.currentPalette.background,
      "&:hover": {
        bgcolor: alpha(theme.currentPalette.primary, 0.1),
        cursor: "pointer",
      },
      transition: "all 0.2s ease-in-out",
    };

    const commentButtonSx: SxProps = {
      backgroundColor: theme.currentPalette.primary,
      transition: "all 0.2s ease-in-out",
    };

    const destinationFull = Array.isArray(loadItem.destination)
      ? loadItem.destination.join(" • ")
      : (loadItem.destination as any);

    const goToLoadDetails = (tab?: "notes") => {
      const base =
        userRole === "admin"
          ? `/admin/loadDetails/${encodeURIComponent(String(loadItem.id))}`
          : `/dispatchers/loadDetails/${encodeURIComponent(String(loadItem.id))}`;

      // tab=1 => Notes
      const withTab = tab === "notes" ? `${base}?tab=1` : base;

      router.push(withTab);
    };
    return (
      <TableRow
        sx={tableRowSx}
        key={loadItem.id ? String(loadItem.id) : String(loadItem.loadId)}
        onClick={() => goToLoadDetails()}
      >
        {/* load Id  */}
        <td className="p-4 text-center">
          <span className="text-sm px-2 py-1 rounded font-medium" style={{ color: theme.currentPalette.primary }}>
            {loadItem.loadId}
          </span>
        </td>
        {/* driver name and phone  */}
        <td className="p-4 text-center">
          <div>
            <div className="font-medium text-[14px] text-sm mb-1">
              {loadItem.driverId?.name || "-"}
            </div>
            <div className="text-xs text-slate-500">{loadItem.driverId?.phone || "-"}</div>
          </div>
        </td>
        {/* route */}
        <td className="p-4 align-middle">
          <div className="flex justify-center">
            <div className="flex flex-col items-start gap-2 w-[150px]">
              <LocationLine
                theme={theme}
                icon={<MapPin size={14} color={theme.currentPalette.primary} />}
                value={loadItem.DHO}
              />
              <LocationLine
                theme={theme}
                icon={<IoNavigate size={14} color={theme.currentPalette.primary} />}
                value={loadItem.origin}
              />
              <LocationLine
                theme={theme}
                icon={<LandPlot size={14} color={theme.currentPalette.primary} />}
                value={destinationFull}
              />
            </div>
          </div>
        </td>
        {/* distance */}
        <td className="p-4 text-center" style={{ color: theme.currentPalette.primary }} >
          {loadItem.distanceMiles != null
            ? `${Math.trunc(Number(loadItem.distanceMiles))} miles`
            : "-"}
        </td>
        {/* price per mile  */}
        <td className="p-4 text-center" style={{ color: theme.currentPalette.primary }}>
          {loadItem.pricePerMile ? `$${loadItem.pricePerMile.toFixed(2)}` : "-"}
        </td>
        {/* total price  */}
        <td className="p-4 text-center font-bold text-[14px]">
          {loadItem.totalPrice ? `$${loadItem.totalPrice}` : "-"}
        </td>

        {/* Status*/}
        <td className="p-4 text-center">
          <StatusChip status={loadItem.status} theme={theme} />
        </td>
        {/* has notes */}
        <td className="p-4 text-center">
          <div className="flex items-center justify-center">
            {hasComments ? (
              <div
                className="relative cursor-pointer group/note"
                title={`${commentsCount} comment(s)`}
                onClick={(e) => {
                  e.stopPropagation();
                  goToLoadDetails("notes");
                }}
              >
                <Box
                  sx={commentButtonSx}
                  className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                >
                  <NotepadText size={18} className="text-white" />
                </Box>

                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-xs text-white font-bold">
                    {commentsCount > 9 ? "9+" : commentsCount}
                  </span>
                </div>

                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover/note:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {commentsCount} comment(s)
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
              </div>
            ) : (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  goToLoadDetails("notes");
                }}
                className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center opacity-50 cursor-pointer transition-opacity">
                <NotepadText size={18} color={theme.currentPalette.primary} />
              </div>
            )}
          </div>
        </td>
      </TableRow>
    );
  };

  const containerSx: SxProps = { p: 3 };
  const headerContainerSx: SxProps = { mb: 4 };

  const searchFilterContainerSx: SxProps = {
    display: "grid",
    gridTemplateColumns: { xs: "1fr", md: "1fr 3fr" },
    alignItems: { xs: "start", md: "center" },
    gap: 2,
    p: 2,
    my: 2,
    border: `1px solid ${alpha(theme.currentPalette.primary, 0.25)}`,
    borderRadius: 2,
    // backgroundColor: alpha(theme.currentPalette.primary, 0.02),
    width: "100%",
    overflow: "hidden",
  };

  const controlsRowSx: SxProps = {
    display: "flex",
    flexDirection: { xs: "column", sm: "row" },
    alignItems: { xs: "stretch", sm: "center" },
    justifyContent: "flex-end",
    gap: 1.5,
    width: { xs: "100%", md: "auto" },
  };

  const searchInputSx = {
    "& .MuiOutlinedInput-root": {
      width: { xs: "100%", md: 360 },
      height: CONTROL_H,
      borderRadius: 2,
      backgroundColor: "#fff",
      "& fieldset": { borderColor: alpha(theme.currentPalette.primary, 0.28) },
      "&:hover fieldset": { borderColor: alpha(theme.currentPalette.primary, 0.55) },
      "&.Mui-focused fieldset": { borderColor: theme.currentPalette.primary },
    },
  };

  const filterSx: SxProps = {
    width: { xs: "100%", sm: 110 },
    height: CONTROL_H,
    borderRadius: 2,
    backgroundColor: "#fff",
    "& .MuiSelect-select": {
      height: CONTROL_H,
      display: "flex",
      alignItems: "center",
      py: 0,
      fontSize: 14,
      fontWeight: 800,
      color: alpha(theme.currentPalette.text, 0.8),
    },
    "& fieldset": { borderColor: alpha(theme.currentPalette.primary, 0.38) },
    "&:hover fieldset": { borderColor: alpha(theme.currentPalette.primary, 0.6) },
    "&.Mui-focused fieldset": { borderColor: theme.currentPalette.primary },
  };

  const addButtonSx: SxProps = {
    height: CONTROL_H,
    minHeight: CONTROL_H,
    borderRadius: 2,
    px: 2.25,
    fontWeight: 900,
    letterSpacing: 0.2,
    width: { xs: "100%", sm: 130 },
    textTransform: "uppercase",
    boxShadow: "0 10px 20px rgba(2, 56, 140, 0.18)",
  };

  const onChangeStatus = (e: SelectChangeEvent) => {
    setPage(1);
    setStatusFilter(e.target.value as LoadStatusFilter);
  };

  return (
    <Box sx={containerSx}>
      {/* Header Section */}
      <Box sx={headerContainerSx}>
        <Box sx={{ mt: 4, mb: 5 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total Loads" value={statsData.totalLoads} icon={Boxes} iconColor={theme.currentPalette.primary} />
            <StatsCard title="Pending" value={statsData.pending} icon={Clock} iconColor={theme.currentPalette.primary} />
            <StatsCard title="In Transit" value={statsData.inTransit} icon={IoNavigate} iconColor={theme.currentPalette.primary} />
            <StatsCard title="Delivered" value={statsData.delivered} icon={Goal} iconColor={theme.currentPalette.primary} />
          </div>
        </Box>
      </Box>

      {/* Search & Filter */}
      <Box sx={searchFilterContainerSx}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ color: theme.currentPalette.primary, fontWeight: 900 }}>
            Load Details
          </Typography>
          <Typography variant="body2" sx={{ color: alpha(theme.currentPalette.text, 0.55), fontWeight: 500 }}>
            Check list of all loads
          </Typography>
        </Box>
        <Box
          sx={{
            minWidth: 0,
            justifySelf: "end",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            flexWrap: "wrap",
            gap: 1.2,
          }}
        >

          <Box sx={{ flex: "1 1 220px", minWidth: 260, maxWidth: 340 }}>
            {/* <SearchInput
              searchHook={searchHook}
              placeholder="Search Loads by ID, Driver"
              showClearButton
              inputSx={{
                "& .MuiOutlinedInput-root": {
                  width: "100%",
                  height: CONTROL_H,
                  borderRadius: 2,
                  backgroundColor: "#fff",
                  "& fieldset": { borderColor: alpha(theme.currentPalette.primary, 0.28) },
                  "&:hover fieldset": { borderColor: alpha(theme.currentPalette.primary, 0.55) },
                  "&.Mui-focused fieldset": { borderColor: theme.currentPalette.primary },
                },
              }}
            /> */}

            <TextField
              size="small"
              value={keyword}
              placeholder="Search Loads by ID, Driver"
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              sx={{
                width: "100%",
                "& .MuiOutlinedInput-root": {
                  height: CONTROL_H,
                  borderRadius: 2,
                  backgroundColor: "#fff",
                  "& fieldset": {
                    borderColor: alpha(theme.currentPalette.primary, 0.28),
                  },
                  "&:hover fieldset": {
                    borderColor: alpha(theme.currentPalette.primary, 0.55),
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: theme.currentPalette.primary,
                  },
                },
              }}
            />
          </Box>
          <FormControl size="small" sx={{ width: 140, flexShrink: 0 }}>
            <Select
              value={statusFilter}
              onChange={onChangeStatus}
              displayEmpty
              fullWidth
              sx={{
                height: CONTROL_H,
                borderRadius: 2,
                backgroundColor: "#fff",
                color: theme.currentPalette.primary,
                "& .MuiSelect-select": {
                  height: CONTROL_H,
                  display: "flex",
                  alignItems: "center",

                },
                "& fieldset": { borderColor: alpha(theme.currentPalette.primary, 0.4) },
                "&:hover fieldset": { borderColor: alpha(theme.currentPalette.primary, 0.6) },
                "&.Mui-focused fieldset": { borderColor: theme.currentPalette.primary },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    mt: 1,
                    borderRadius: 2,
                    backgroundColor: "#fff",
                    border: `1px solid ${alpha(theme.currentPalette.primary, 0.25)}`,
                  },
                },
              }}
            >
              {["all", "pending", "in_transit", "delivered"].map((item) => (
                <MenuItem
                  key={item}
                  value={item}
                  sx={{
                    color: theme.currentPalette.primary,
                    justifyContent: "flex-start",

                    "&.Mui-selected": { backgroundColor: alpha(theme.currentPalette.primary, 0.06) },
                  }}
                >
                  {item === "all" ? "All" : item.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            onClick={() => {
              setEditingLoad(null);
              setShowCreateEditModal(true);
            }}
            variant="contained"
            // startIcon={<IoAdd size={18} />}
            sx={{ width: 120, flexShrink: 0, height: CONTROL_H }}
          >
            ADD LOAD
          </Button>
        </Box>
      </Box>

      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: "8px", fontSize: "14px" },
        }}
      />

      {/* Error Display */}
      {error && (
        <Box sx={{ mb: 3 }}>
          <Erros message={error} />
        </Box>
      )}

      {/* Data Table */}
      <DataTable
        columns={loadColumns}
        data={load}
        renderRow={renderLoadRow}
        loading={
          (isSearching && loadByIdLoading) ||
          (isFiltered && filterLoading) ||
          (loadsLoading && !loadsData)
        }
      />

      {/* Pagination */}
      {!isSearching && pagination && load.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Pagination pagination={pagination} page={page} setPage={setPage} pageSize={10} showInfo />
        </Box>
      )}

      {/* Create/Edit Load Modal */}
      <CreateEditLoadModal
        isOpen={showCreateEditModal}
        onClose={() => {
          setShowCreateEditModal(false);
          setEditingLoad(null);
          refetchLoads();
        }}
        editingLoad={editingLoad}
      />
    </Box>
  );
};

export default LoadsPageDetails;