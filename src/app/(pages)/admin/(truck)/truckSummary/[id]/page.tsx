"use client";
import Loading from "@/components/ui/Loading";
import {
  useGetSpecificTruckSummaryQuery,
  useGetTruckByIdQuery,
  useGetTruckSummaryWithFilterQuery,
} from "@/redux/slices/apiSlice";
import { RootState, useAppSelector } from "@/redux/store";
import { useParams } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { alpha, Box, Chip, Typography } from "@mui/material";
import {
  IdCard,
  Calendar,
  CarFront,
  User,
  Truck,
  BicepsFlexed,
  Fuel,
  Building2,
  TrendingUp,
  DollarSign,
  Boxes,
  LandPlot,
} from "lucide-react";
import NetProfitTrend from "@/components/truck/NetProfitTrend";
import ProfitMarginChart from "@/components/truck/ProfitMarginChart";
import CostBreakdownChart from "@/components/truck/CostBreakdownChart";
import { useFilter } from "@/providers/FilterProvider";
import { useMemo } from "react";
import Breadcrumb from "@/components/ui/Breadcrumb";

const TruckSummary = () => {
  const { id } = useParams();
  const theme = useAppSelector((state: RootState) => state.palette);
  const { fromDate, toDate, isFiltered } = useFilter();

  // ✅ RTK Query hooks
  const { data: profileData, isLoading: profileLoading } = useGetTruckByIdQuery(
    id as string,
    {
      skip: !id,
    }
  );
  const profile = profileData?.data;

  const {
    data: specificTruckSummaryData,
    isLoading: specificTruckSummaryLoading,
  } = useGetSpecificTruckSummaryQuery(id as string, {
    skip: !id,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: false,
  });

  const { data: truckSummaryFilterData, isLoading: summaryFilterLoading } =
    useGetTruckSummaryWithFilterQuery(
      {
        id: id as string,
        from: fromDate ? fromDate.format("YYYY-MM-DD") : undefined,
        to: toDate ? toDate.format("YYYY-MM-DD") : undefined,
      },
      {
        skip: !isFiltered || !fromDate || !toDate,
        refetchOnFocus: false,
      }
    );

  // Get Truck Summary data based on filter state
  const TrucksSummaryData = useMemo(() => {
    if (isFiltered && truckSummaryFilterData) {
      return truckSummaryFilterData?.data?.summary;
    }
    return specificTruckSummaryData?.data?.summary;
  }, [isFiltered, truckSummaryFilterData, specificTruckSummaryData]);

  // Get Truck NetProfit data based on filter state
  const NetProfitData = useMemo(() => {
    if (isFiltered && truckSummaryFilterData) {
      return truckSummaryFilterData?.data?.netProfitHistory;
    }
    return specificTruckSummaryData?.data?.netProfitHistory;
  }, [isFiltered, truckSummaryFilterData, specificTruckSummaryData]);

  // Get Period data based on filter state
  const currentPeriod = useMemo(() => {
    if (isFiltered && truckSummaryFilterData?.data?.period) {
      return truckSummaryFilterData.data.period;
    }
    return specificTruckSummaryData?.data?.period;
  }, [isFiltered, truckSummaryFilterData, specificTruckSummaryData]);

  const loading =
    profileLoading || summaryFilterLoading || specificTruckSummaryLoading;
  if (loading) return <Loading />;

  // profile-cards
  const profileCards = [
    {
      id: 1,
      icon: <IdCard size={25} />,
      name: "Plate Number",
      value: profile?.plateNumber || "N/A",
    },
    {
      id: 2,
      icon: <Calendar size={25} />,
      name: "Year",
      value: profile?.year || "N/A",
    },
    {
      id: 3,
      icon: <CarFront size={25} />,
      name: "Model",
      value: profile?.model || "N/A",
    },
    {
      id: 4,
      icon: <User size={25} />,
      name: "Driver",
      value: profile?.assignedDriver
        ? `${profile.assignedDriver.name} ID: ${profile.assignedDriver.driverId}`
        : "Not Assigned",
    },
    {
      id: 5,
      icon: <Truck size={25} />,
      name: "Vehicle Type",
      value: profile?.type || "N/A",
    },
    {
      id: 6,
      icon: <BicepsFlexed size={25} />,
      name: "Capacity",
      value: profile?.capacity || "N/A",
    },
    {
      id: 7,
      icon: <Fuel size={25} />,
      name: "Fuel/Mile",
      value: profile?.fuelPerMile || "N/A",
    },
    {
      id: 8,
      icon: <Building2 size={25} />,
      name: "Ownership",
      value: profile?.source || "N/A",
    },
  ];

  return (
    <section className="container mx-auto p-6">
      <Toaster position="top-center" />

      {/* Bread Crumb */}
      <Breadcrumb
        items={[
          { label: "Financial Dashboard", href: "/admin/truckdashboard" },
          { label: "Truck Summary" },
        ]}
        color={theme.currentPalette.primary}
        textColor={alpha(theme.currentPalette.text, 0.8)}
        separatorColor={alpha(theme.currentPalette.text, 0.5)}
      />

      {/* Profile */}
      <Box className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        {/* LEFT BIG CARD */}
        <Box
          sx={{
            border: 1,
            borderRadius: 1,
            borderColor: alpha(theme.currentPalette.primary, 0.3),
            p: 3,
            bgcolor: theme.currentPalette.background,
          }}
          className="lg:col-span-2"
        >
          {/* Title + Status */}
          <div className="flex items-center justify-between mb-6">
            <Typography
              sx={{
                color: theme.currentPalette.primary,
                fontWeight: "bold",
                fontSize: "26px",
              }}
            >
              Truck - ({profile?.truckId || "N/A"})
            </Typography>

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
                    borderRadius: 1,
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

        {/* RIGHT SMALL STAT CARDS */}
        <div className="grid grid-cols-2 gap-5">
          {/* Net Profit */}
          <Box
            sx={{
              p: 3,
              border: 1,
              borderColor: alpha(theme.currentPalette.primary, 0.3),
              borderRadius: 1,
              bgcolor: theme.currentPalette.background,
            }}
            className="flex flex-col justify-center"
          >
            <Typography
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <span style={{ color: theme.currentPalette.text }}>
                Net Profit
              </span>
              <TrendingUp color={theme.currentPalette.primary} />
            </Typography>

            <Typography
              sx={{ fontSize: "30px", color: theme.currentPalette.text }}
            >
              ${TrucksSummaryData?.netProfit?.toLocaleString() || 0}
            </Typography>
          </Box>

          {/* Revenue */}
          <Box
            sx={{
              p: 3,
              border: 1,
              borderColor: alpha(theme.currentPalette.primary, 0.3),
              borderRadius: 1,
              bgcolor: theme.currentPalette.background,
            }}
            className="flex flex-col justify-center"
          >
            <Typography
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <span style={{ color: theme.currentPalette.text }}>
                Total Revenue
              </span>
              <DollarSign color={theme.currentPalette.primary} />
            </Typography>

            <Typography
              sx={{ fontSize: "30px", color: theme.currentPalette.text }}
            >
              ${TrucksSummaryData?.totalRevenue?.toLocaleString() || 0}
            </Typography>
          </Box>

          {/* Total Loads */}
          <Box
            sx={{
              p: 3,
              border: 1,
              borderColor: alpha(theme.currentPalette.primary, 0.3),
              borderRadius: 1,
              bgcolor: theme.currentPalette.background,
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
              {TrucksSummaryData?.totalLoads || 0}
            </Typography>
          </Box>

          {/* Total Miles */}
          <Box
            sx={{
              p: 3,
              border: 1,
              borderColor: alpha(theme.currentPalette.primary, 0.3),
              borderRadius: 1,
              bgcolor: theme.currentPalette.background,
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
              {TrucksSummaryData?.totalMiles?.toLocaleString() || 0}
            </Typography>
          </Box>
        </div>
      </Box>

      {/* Profit Analytics */}
      <Box sx={{ my: 5 }}>
        <Box>
          <Typography
            variant="h5"
            sx={{ color: theme.currentPalette.primary, fontWeight: 500 }}
          >
            Profit Analytics
          </Typography>
          <Typography sx={{ color: theme.currentPalette.primary }}>
            Track profitability trends and cost diagnostics
          </Typography>
        </Box>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 my-5">
          <div className="col-span-2">
            <NetProfitTrend
              netProfitHistory={NetProfitData}
              period={currentPeriod}
            />
          </div>
          <div className="flex flex-col gap-5">
            <ProfitMarginChart
              profitMargin={TrucksSummaryData?.profitMargin || 0}
            />
            <CostBreakdownChart
              costs={{
                fuel: TrucksSummaryData?.fuelCost ?? 0,
                driverPay: TrucksSummaryData?.driverPay ?? 0,
                maintenance: TrucksSummaryData?.repairCost ?? 0,
                insurance: TrucksSummaryData?.insuranceCost ?? 0,
              }}
            />
          </div>
        </div>
      </Box>
    </section>
  );
};

export default TruckSummary;
