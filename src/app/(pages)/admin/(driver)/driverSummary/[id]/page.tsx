"use client";
import Loading from "@/components/ui/Loading";
import { TLoads } from "@/types/globalTypes";
import { useState, useEffect, useMemo, useRef } from "react";
import Erros from "@/components/ui/Erros";
import toast, { Toaster } from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import useError from "@/hook/useError";
import DataTable from "@/components/ui/DataTable";
import { driverSummaryColumns } from "@/data/driverSummaryTable";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import {
  useGetDriverByIdQuery,
  useGetDriverSummaryWithFilterQuery,
  useGetSpecificDriverSummaryQuery,
} from "@/redux/slices/apiSlice";
import { getErrorMessage } from "@/utils/getErrorMessage";
import {
  alpha,
  Box,
  Chip,
  Divider,
  Popover,
  Stack,
  SxProps,
  TableRow,
  Typography,
} from "@mui/material";
import { RootState, useAppSelector } from "@/redux/store";
import Breadcrumb from "@/components/ui/Breadcrumb";
import {
  Banknote,
  Boxes,
  Calendar,
  CircleDollarSign,
  CircleUserRound,
  CreditCard,
  LandPlot,
  Mail,
  Phone,
} from "lucide-react";
import { useFilter } from "@/providers/FilterProvider";

const DriverSummary = () => {
  const { id } = useParams();
  const router = useRouter();
  const { error, setError } = useError();
  const theme = useAppSelector((state: RootState) => state.palette);

  // ✅ Filter
  const { fromDate, toDate, isFiltered } = useFilter();
  const [isFilterActive, setIsFilterActive] = useState(false);

  // ✅ Profile Query
  const { data: profileData, isLoading: profileLoading } =
    useGetDriverByIdQuery(id as string, { skip: !id });

  const earningsRef = useRef(null);

  // ✅ Lazy Query for filtered data with refetch capability
  const { 
    data: driverSummaryData, 
    error: summaryError,
    refetch: refetchFilteredSummary  // Add refetch capability
  } = useGetDriverSummaryWithFilterQuery({
    id: id as string,
    from: fromDate ? fromDate.format("YYYY-MM-DD") : undefined,
    to: toDate ? toDate.format("YYYY-MM-DD") : undefined,
  });

  const [earningsAnchorEl, setEarningsAnchorEl] = useState<HTMLElement | null>(
    null,
  );

  const handleEarningsEnter = (event: React.MouseEvent<HTMLElement>) => {
    setEarningsAnchorEl(event.currentTarget);
  };

  const handleEarningsLeave = () => {
    setEarningsAnchorEl(null);
  };

  const isEarningsOpen = Boolean(earningsAnchorEl);

  // ✅ Specific Driver Summary with refetch capability
  const {
    data: specificDriverSummaryData,
    isLoading: specificDriverSummaryLoading,
    refetch: refetchDriverSummary  // Add refetch capability
  } = useGetSpecificDriverSummaryQuery(id as string, {
    skip: !id,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: true,  // Changed to true for auto-refetch
  });

  // Get Truck Summary data based on filter state
  const displayedData = useMemo(() => {
    if (isFiltered && driverSummaryData) {
      return driverSummaryData?.data?.loads;
    }
    return specificDriverSummaryData?.data?.loads;
  }, [isFiltered, driverSummaryData, specificDriverSummaryData]);

  // ✅ Error handling
  useEffect(() => {
    if (summaryError) {
      const errorMessage = getErrorMessage(summaryError);
      setError(errorMessage);
      toast.error(errorMessage || "Failed to load summary ❌", {
        style: { background: "#dc2626", color: "#fff" },
      });
    }
  }, [summaryError, setError]);

  // ✅ Auto-refetch when driver data might have changed (toggle updated)
  useEffect(() => {
    // Set up a refetch interval to check for updates
    const interval = setInterval(() => {
      if (isFiltered) {
        refetchFilteredSummary();
      } else {
        refetchDriverSummary();
      }
    }, 10000); // Refetch every 10 seconds

    return () => clearInterval(interval);
  }, [isFiltered, refetchFilteredSummary, refetchDriverSummary]);

  // ✅ Listen for driver toggle changes (if using event-based approach)
  useEffect(() => {
    const handleDriverUpdated = () => {
      // When driver is updated, refetch the summary data
      if (isFiltered) {
        refetchFilteredSummary();
      } else {
        refetchDriverSummary();
      }
    };

    // Listen for custom event if using event-based approach
    window.addEventListener('driver-updated', handleDriverUpdated);

    return () => {
      window.removeEventListener('driver-updated', handleDriverUpdated);
    };
  }, [isFiltered, refetchFilteredSummary, refetchDriverSummary]);

  const profile = profileData?.data;
  const summaryData = isFiltered ? driverSummaryData?.data : specificDriverSummaryData?.data;

  // ✅ Table Row Renderer for Loads
  const renderDriverSummaryRow = (load: TLoads, index: number) => {
    const tableRowSx: SxProps = {
      bgcolor: theme.currentPalette.background!,
      color: theme.currentPalette.primary,
      "&:hover": {
        bgcolor: alpha(theme.currentPalette.primary, 0.1),
      },
      transition: "all 0.2s ease-in-out",
    };

    return (
      <TableRow sx={tableRowSx} key={load.loadId || index}>
        {/* Load ID */}
        <td className="p-4 text-center">
          <span className="text-sm px-2 py-1 rounded">{load.loadId}</span>
        </td>

        {/* Plate Number */}
        <td className="p-4 text-left">{load.truckId.plateNumber}</td>

        {/* Delivered */}
        <td className="p-4 text-left">
          {load.deliveredAt ? load.deliveredAt.split("T")[0] : "-"}
        </td>

        {/* Origin */}
        <td className="p-4 text-left max-w-10">
          <div className="truncate" title={load.origin}>
            {load.origin}
          </div>
        </td>

        {/* Destination */}
        <td className="p-4 text-left max-w-10">
          <div
            className="truncate"
            title={
              Array.isArray(load.destination)
                ? load.destination.join(", ")
                : load.destination
            }
          >
            {Array.isArray(load.destination)
              ? load.destination.join(", ")
              : load.destination}
          </div>
        </td>

        {/* Miles */}
        <td className="p-4 text-center">
          {load.distanceMiles?.toLocaleString()}
        </td>

        {/* Price/Mile */}
        <td className="p-4 text-center">$ {load.pricePerMile?.toFixed(2)}</td>

        {/* Total */}
        <td className="p-4 text-center">
          ${load.totalPrice?.toLocaleString()}
        </td>
      </TableRow>
    );
  };

  // ✅ Intelligent Loading
  const isInitialLoading = profileLoading || specificDriverSummaryLoading;

  if (isInitialLoading) return <Loading />;

  // profile-cards
  const profileCards = [
    {
      id: 1,
      icon: <Mail size={25} />,
      name: "Email",
      value: profile?.email || "N/A",
    },
    {
      id: 2,
      icon: <Phone size={25} />,
      name: "Phone",
      value: profile?.phone || "N/A",
    },
    {
      id: 3,
      icon: <CreditCard size={25} />,
      name: "License Number",
      value: profile?.licenseNumber || "N/A",
    },
    {
      id: 4,
      icon: <Calendar size={25} />,
      name: "Hire Date",
      value: profile?.hireDate?.split("T")[0] || "N/A",
    },
  ];

  const searchFilterContainerSx: SxProps = {
    display: "flex",
    flexDirection: { xs: "column" },
    alignItems: "flex-start",
    p: 2,
    my: 2,
    border: `1px solid ${alpha(theme.currentPalette.primary, 0.3)}`,
    borderRadius: 2,
    backgroundColor: theme.currentPalette.background,
  };

  return (
    <section className="container mx-auto p-6">
      <Toaster position="top-center" />

      {/* Bread Crumb */}
      <Breadcrumb
        items={[
          { label: "Drivers", href: "/admin/drivers" },
          { label: "Driver Summary" },
        ]}
        color={theme.currentPalette.primary}
        textColor={alpha(theme.currentPalette.text, 0.8)}
        separatorColor={alpha(theme.currentPalette.text, 0.5)}
      />

      {/* Errors */}
      {error && (
        <div className="mb-6">
          <Erros message={error} />
        </div>
      )}

      {/* Profile */}
      <Box className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        {/* LEFT BIG CARD */}
        <Box
          sx={{
            border: 1,
            borderRadius: 2,
            borderColor: alpha(theme.currentPalette.primary, 0.3),
            p: 3,
          }}
          className="lg:col-span-2"
        >
          {/* Title + Status */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2 items-center">
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: alpha(theme.currentPalette.primary, 0.1),
                  color: theme.currentPalette.primary,
                  borderRadius: 2,
                }}
              >
                <CircleUserRound size={25} />
              </Box>

              <div className="flex flex-col">
                <Typography
                  sx={{ color: theme.currentPalette.title, fontSize: "24px" }}
                >
                  {profile?.name}
                </Typography>
                <Typography sx={{ color: theme.currentPalette.text }}>
                  Driver ID: {profile?.driverId}
                </Typography>
              </div>
            </div>

            <Chip
              style={{ textTransform: "capitalize" }}
              label={profile?.status || "unknown"}
              variant="filled"
              color={profile?.status === "available" ? "success" : "error"}
            />
          </div>

          {/* GRID INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-16">
            {profileCards.map((card) => (
              <div key={card.id} className="flex items-center gap-3">
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: alpha(theme.currentPalette.primary, 0.1),
                    color: theme.currentPalette.primary,
                    borderRadius: 2,
                  }}
                >
                  {card.icon}
                </Box>

                <div className="flex flex-col">
                  <Typography sx={{ color: theme.currentPalette.primary }}>
                    {card.name}
                  </Typography>
                  <Typography sx={{ color: theme.currentPalette.text }}>
                    {card.value}
                  </Typography>
                </div>
              </div>
            ))}
          </div>
        </Box>

        <div className="grid grid-cols-2 gap-5">
          {/* Total Earnings */}
          <Box sx={{ position: "relative", overflow: "visible" }}>
            <Box
              onMouseEnter={handleEarningsEnter}
              onMouseLeave={handleEarningsLeave}
              sx={{
                p: 3,
                border: 1,
                borderColor: alpha(theme.currentPalette.primary, 0.3),
                borderRadius: 2,
                cursor: "pointer",
              }}
              className="flex flex-col justify-center"
            >
              <Typography
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <span style={{ color: theme.currentPalette.text }}>
                  Total Earnings
                </span>
                <Banknote color={theme.currentPalette.primary} />
              </Typography>

              <Typography
                sx={{
                  fontSize: "30px",
                  color: theme.currentPalette.text,
                  display: "inline-block",
                  paddingBottom: "2px",
                  cursor: "pointer",
                }}
                ref={earningsRef}
                onMouseEnter={() => setEarningsAnchorEl(earningsRef.current)}
                onMouseLeave={handleEarningsLeave}
              >
                $
                <span style={{ borderBottom: "2px dotted #08172B" }}>
                  {summaryData?.earnings?.totalEarnings?.toFixed(2) || "0.00"}
                </span>
              </Typography>
            </Box>
            <Popover
              open={Boolean(earningsAnchorEl)}
              anchorEl={earningsAnchorEl}
              onClose={handleEarningsLeave}
              disableRestoreFocus
              PaperProps={{
                onMouseEnter: () => setEarningsAnchorEl(earningsRef.current),
                onMouseLeave: handleEarningsLeave,
                sx: {
                  p: 2,
                  borderRadius: 2,
                  boxShadow: 6,
                  minWidth: 220,
                  textAlign: "left",
                },
              }}
            >
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  mb: 1,
                  textAlign: "center",
                  color: "#666666",
                }}
              >
                <p> DRIVER EARNINGS </p>
                <p>BREAKDOWN</p>
              </Typography>

              <Divider
                sx={{
                  mb: 1,
                  borderColor: alpha(theme.currentPalette.text, 0.25),
                }}
              />
              <Stack spacing={0.8}>
                <Typography
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: theme.currentPalette.primary,
                  }}
                >
                  <span>Base Pay</span>
                  <span>
                    $
                    {Number(summaryData?.earnings?.baseEarnings).toFixed(2) ||
                      "0.00"}
                  </span>
                </Typography>

                <Typography
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#317435",
                  }}
                >
                  <span>Bonus</span>
                  <span>
                    +$
                    {Number(summaryData?.earnings?.totalBonus).toFixed(2) || "0.00"}
                  </span>
                </Typography>

                <Typography
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#317435",
                  }}
                >
                  <span>Detention</span>
                  <span>
                    +$
                    {Number(summaryData?.earnings?.totalDetention).toFixed(2) ||
                      "0.00"}
                  </span>
                </Typography>

                <Typography
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#B3261E",
                  }}
                >
                  <span>Deduction (15% toggle)</span>
                  <span>
                    -$
                    {Number(summaryData?.earnings?.totalDeduction).toFixed(2) ||
                      "0.00"}
                  </span>
                </Typography>
              </Stack>
            </Popover>
          </Box>
          {/* Total Loads */}
          <Box
            sx={{
              p: 3,
              border: 1,
              borderColor: alpha(theme.currentPalette.primary, 0.3),
              borderRadius: 2,
            }}
            className="flex flex-col justify-center"
          >
            <Typography
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <span style={{ color: theme.currentPalette.text }}>
                Total Loads
              </span>
              <Boxes color={theme.currentPalette.primary} />
            </Typography>

            <Typography
              sx={{ fontSize: "30px", color: theme.currentPalette.text }}
            >
              {summaryData?.totalLoads || 0}
            </Typography>
          </Box>

          {/* Avg Price/Mile */}
          <Box
            sx={{
              p: 3,
              border: 1,
              borderColor: alpha(theme.currentPalette.primary, 0.3),
              borderRadius: 2,
            }}
            className="flex flex-col justify-center"
          >
            <Typography
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <span style={{ color: theme.currentPalette.text }}>
                Avg Price/Mile
              </span>
              <CircleDollarSign color={theme.currentPalette.primary} />
            </Typography>

            <Typography
              sx={{ fontSize: "30px", color: theme.currentPalette.text }}
            >
              ${summaryData?.avgPricePerMile?.toFixed(2) || "0.00"}
            </Typography>
          </Box>

          {/* Total Miles */}
          <Box
            sx={{
              p: 3,
              border: 1,
              borderColor: alpha(theme.currentPalette.primary, 0.3),
              borderRadius: 2,
            }}
            className="flex flex-col justify-center"
          >
            <Typography
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <span style={{ color: theme.currentPalette.text }}>
                Total Miles
              </span>
              <LandPlot color={theme.currentPalette.primary} />
            </Typography>

            <Typography
              sx={{ fontSize: "30px", color: theme.currentPalette.text }}
            >
              {summaryData?.totalMiles?.toLocaleString() || 0}
            </Typography>
          </Box>
        </div>
      </Box>

      <Box sx={searchFilterContainerSx}>
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
          Complete list of all loads assigned to this driver
        </Typography>
      </Box>

      {/* ✅ Loads Table Section */}
      {displayedData && (
        <Box className="overflow-hidden">
          {/* Table For Driver Loads Summary */}
          {displayedData.length > 0 ? (
            <DataTable
              columns={driverSummaryColumns}
              data={displayedData}
              renderRow={renderDriverSummaryRow}
              loading={isInitialLoading}
            />
          ) : (
            <div className="px-4 py-12 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="text-3xl mb-3">📦</div>
                <Typography sx={{ color: theme.currentPalette.primary }}>
                  {isFiltered
                    ? "No load records found for the selected date range"
                    : "No load records found"}
                </Typography>
                <Typography
                  sx={{
                    color: alpha(theme.currentPalette.text, 0.8),
                    fontSize: "14px",
                  }}
                >
                  {isFiltered
                    ? "Please adjust your date filter"
                    : "There are no loads available for this driver"}
                </Typography>
              </div>
            </div>
          )}
        </Box>
      )}

      {/* ✅ Summary Footer */}
      {displayedData && (
        <div className="mt-6 flex justify-end">
          <Box
            sx={{
              borderRadius: 2,
              borderColor: alpha(theme.currentPalette.primary, 0.3),
            }}
            className="px-4 py-3 border"
          >
            <Typography
              sx={{
                color: alpha(theme.currentPalette.primary, 0.8),
                fontSize: "14px",
              }}
            >
              Showing {displayedData.length} loads
              {isFiltered && " (filtered)"}
            </Typography>
          </Box>
        </div>
      )}

      {!profile && !isInitialLoading && (
        <div className="rounded-xl border p-12 text-center">
          <div className="text-4xl mb-4">👨‍💼</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            Driver Not Found
          </h3>
          <p className="text-slate-600 mb-4">
            {
              "The driver you're looking for doesn't exist or you don't have access to it."
            }
          </p>
          <button
            onClick={() => router.push("/admin/drivers")}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Back to Drivers
          </button>
        </div>
      )}
    </section>
  );
};

export default DriverSummary;