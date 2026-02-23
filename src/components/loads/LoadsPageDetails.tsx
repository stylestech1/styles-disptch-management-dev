"use client";
import { useEffect, useMemo, useState } from "react";
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
import {
  IoAdd,
  IoCheckmark,
  IoTime,
  IoCar,
  IoNavigate,
  IoLocationSharp,
  IoChatbubbleEllipses,
} from "react-icons/io5";

// MUI
import {
  alpha,
  Box,
  Button,
  Chip,
  SxProps,
  TableRow,
  Typography,
} from "@mui/material";

// Styles
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const LoadsPageDetails = () => {
  const [page, setPage] = useState(1);
  const router = useRouter();
  const userRole = useAppSelector((state: RootState) => state.auth.user?.role);
  const theme = useAppSelector((state: RootState) => state.palette);

  const { fromDate, toDate, isFiltered } = useFilter();

  // Modal states
  const [showCreateEditModal, setShowCreateEditModal] = useState(false);
  const [selectedLoadForNotes, setSelectedLoadForNotes] =
    useState<TLoads | null>(null);
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
      if (term.trim()) {
        triggerSearchQuery(encodeURIComponent(term));
      }
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

  const { isLoading: notesLoading } = useGetNotesQuery(
    selectedLoadForNotes?.id || "",
    { skip: !selectedLoadForNotes?.id }
  );

  const { data: filteredData, isLoading: filterLoading } =
    useGetLoadsWithFilterQuery(
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
    if (isFiltered && fromDate && toDate) {
      setPage(1);
    }
  }, [isFiltered, fromDate, toDate]);

  // Process data
  const load = useMemo(() => {
    if (isSearching && Array.isArray(loadByIdData?.data)) {
      return loadByIdData.data.flat();
    }
    if (isFiltered && filteredData?.data) {
      return filteredData.data;
    }
    return loadsData?.data || [];
  }, [isSearching, isFiltered, loadByIdData, filteredData, loadsData]);

  const pagination = isFiltered
    ? filteredData?.paginationResult || null
    : loadsData?.paginationResult || null;

  // Loading state
  useEffect(() => {
    setLoading(loadsLoading && !loadsData);
  }, [loadsLoading, loadsData, setLoading]);

  // Error handling
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
    const statLoadData = loadsData?.stats || [];
    if (!statLoadData || statLoadData.length === 0)
      return { totalLoads: 0, pending: 0, inTransit: 0, delivered: 0 };
    return {
      totalLoads: statLoadData.total,
      pending: statLoadData.pending,
      inTransit: statLoadData.inTransit,
      delivered: statLoadData.delivered,
    };
  }, [loadsData?.stats]);

  // Loading state
  const isInitialLoading = loadsLoading && !loadsData;
  if (isInitialLoading) return <Loading />;

  // Table row renderer
  const renderLoadRow = (loadItem: TLoads) => {
    const hasComments = loadItem.comments && loadItem.comments.length > 0;
    const commentsCount = loadItem.comments?.length || 0;

    const navigateToLoadDetails = (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
      }

      const path =
        userRole === "admin"
          ? `/admin/loadDetails/${encodeURIComponent(String(loadItem.id))}`
          : `/dispatchers/loadDetails/${encodeURIComponent(
              String(loadItem.id)
            )}`;

      router.push(path);
    };

    // Styles
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

    return (
      <TableRow
        sx={tableRowSx}
        key={loadItem.id ? String(loadItem.id) : String(loadItem.loadId)}
        onClick={navigateToLoadDetails}
      >
        {/* Load ID */}
        <td className="p-4 text-center">
          <span className="text-sm px-2 py-1 rounded text-slate-700 font-medium">
            {loadItem.loadId}
          </span>
        </td>

        {/* Route */}
        <td className="p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-700">
              <IoLocationSharp size={14} className="text-slate-400" />
              <span
                className="text-sm max-w-[120px] truncate"
                title={loadItem.DHO}
              >
                {loadItem.DHO || "-"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <IoNavigate size={14} className="text-slate-400" />
              <span
                className="text-sm max-w-[120px] truncate"
                title={loadItem.origin}
              >
                {loadItem.origin || "-"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <IoCheckmark size={14} className="text-slate-400" />
              <span
                className="text-sm max-w-[120px] truncate"
                title={
                  Array.isArray(loadItem.destination)
                    ? loadItem.destination.join(", ")
                    : loadItem.destination
                }
              >
                {Array.isArray(loadItem.destination)
                  ? loadItem.destination.join(", ")
                  : loadItem.destination || "-"}
              </span>
            </div>
          </div>
        </td>

        {/* Distance */}
        <td className="p-4 text-center text-slate-700 font-medium">
          {loadItem.distanceMiles ? `${loadItem.distanceMiles} mi` : "-"}
        </td>

        {/* Price Per Mile */}
        <td className="p-4 text-center text-slate-700">
          {loadItem.pricePerMile ? `$${loadItem.pricePerMile.toFixed(2)}` : "-"}
        </td>

        {/* Total */}
        <td className="p-4 text-center font-semibold text-emerald-700">
          {loadItem.totalPrice ? `$${loadItem.totalPrice}` : "-"}
        </td>

        {/* Status */}
        <td className="p-4 text-center">
          {/* <StatusBadge status={loadItem.status} size="md" />  */}
          {loadItem.status === "pending" && (
            <Chip
              label={loadItem.status}
              variant="filled"
              sx={{
                bgcolor: theme.currentPalette.background,
                color: "#E2852E",
                border: "1px solid #E2852E",
                borderRadius: 1,
                pl: 0.5,
              }}
              size="small"
              icon={
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#E2852E",
                  }}
                />
              }
            />
          )}
          {loadItem.status === "delivered" && (
            <Chip
              label={loadItem.status}
              variant="filled"
              sx={{
                bgcolor: alpha(theme.currentPalette.primary, 0.5),
                color: theme.currentPalette.primary,
                borderRadius: 1,
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
          {loadItem.status === "in_transit" && (
            <Chip
              label={loadItem.status}
              variant="filled"
              sx={{
                bgcolor: theme.currentPalette.primary,
                color: theme.currentPalette.background,
                borderRadius: 1,
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
          {loadItem.status === "cancelled" && (
            <Chip
              label={loadItem.status}
              variant="filled"
              sx={{
                bgcolor: theme.currentPalette.background,
                color: "#dc2626",
                border: "1px solid #dc2626",
                borderRadius: 1,
                pl: 0.5,
              }}
              size="small"
              icon={
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#dc2626",
                  }}
                />
              }
            />
          )}
        </td>

        {/* Driver */}
        <td className="p-4 text-center">
          <div>
            <div className="font-medium text-slate-900 text-sm">
              {loadItem.driverId?.name || "-"}
            </div>
            <div className="text-xs text-slate-500">
              {loadItem.driverId?.phone || "-"}
            </div>
          </div>
        </td>

        {/* Note */}
        <td className="p-4 text-center">
          <div className="flex items-center justify-center">
            {hasComments ? (
              <div
                className="relative cursor-pointer group/note"
                title={`${commentsCount} comment(s) - Click to view`}
              >
                <Box
                  sx={commentButtonSx}
                  className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                >
                  <IoChatbubbleEllipses size={16} className="text-white" />
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
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center opacity-50 cursor-pointer transition-opacity">
                <IoChatbubbleEllipses size={16} className="text-slate-500" />
              </div>
            )}
          </div>
        </td>
      </TableRow>
    );
  };

  // Container styles
  const containerSx: SxProps = {
    p: 3,
  };
  const headerContainerSx: SxProps = {
    mb: 4,
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

  return (
    <Box sx={containerSx}>
      {/* Header Section */}
      <Box sx={headerContainerSx}>
        {/* Stats Cards */}
        <Box sx={{ mt: 4, mb: 5 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Loads"
              value={statsData.totalLoads}
              icon={IoCar}
              iconColor={theme.currentPalette.primary}
            />
            <StatsCard
              title="Pending"
              value={statsData.pending}
              icon={IoTime}
              iconColor={theme.currentPalette.primary}
            />
            <StatsCard
              title="In Transit"
              value={statsData.inTransit}
              icon={IoNavigate}
              iconColor={theme.currentPalette.primary}
            />
            <StatsCard
              title="Delivered"
              value={statsData.delivered}
              icon={IoCheckmark}
              iconColor={theme.currentPalette.primary}
            />
          </div>
        </Box>
      </Box>

      {/* Search & Filter */}
      <Box sx={searchFilterContainerSx}>
        {/* Search */}
        <Box>
          <Typography
            variant="h6"
            sx={{ color: theme.currentPalette.primary, fontWeight: 500 }}
          >
            Load Details
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.currentPalette.primary, fontWeight: 400 }}
          >
            Check list of all loads
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "flex-end",
            gap: 2,
            width: { xs: "100%", md: "auto" },
          }}
        >
          {/* Search */}
          <SearchInput
            searchHook={searchHook}
            placeholder="Search loads by ID...."
            showClearButton
            inputSx={{
              "& .MuiOutlinedInput-root": {
                width: { xs: "100%", md: 250 },
                borderRadius: 1,
                backgroundColor: theme.currentPalette.background,
                py: 0.5,
                "&:hover": {
                  borderColor: theme.currentPalette.primary,
                },
              },
            }}
          />

          {/* Action Button */}
          <Button
            onClick={() => {
              setEditingLoad(null);
              setShowCreateEditModal(true);
            }}
            variant="contained"
            startIcon={<IoAdd size={22} />}
            sx={{
              width: { xs: "100%", md: "100%" },
              borderRadius: 1,
              px: 3,
              py: 2,
            }}
          >
            New Load
          </Button>
        </Box>
      </Box>

      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "8px",
            fontSize: "14px",
          },
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
          <Pagination
            pagination={pagination}
            page={page}
            setPage={setPage}
            pageSize={10}
            showInfo={true}
          />
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
