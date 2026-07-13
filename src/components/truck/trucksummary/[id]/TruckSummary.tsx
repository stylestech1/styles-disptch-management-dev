"use client";
import Loading from "@/components/ui/Loading";
import {
  useGetSpecificTruckSummaryQuery,
  useGetTruckByIdQuery,
  useGetTruckSummaryWithFilterQuery,
} from "@/redux/slices/apiSlice";
import { RootState, useAppSelector } from "@/redux/store";
import { useParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  alpha,
  Box,
  Chip,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  CircularProgress,
} from "@mui/material";

import html2pdf from "html2pdf.js";
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
import { useMemo, useState } from "react";
import NetProfitTrend from "@/components/truck/NetProfitTrend";
import ProfitMarginChart from "@/components/truck/ProfitMarginChart";
import CostBreakdownChart from "@/components/truck/CostBreakdownChart";
import { useFilter } from "@/providers/FilterProvider";
import Breadcrumb from "@/components/ui/Breadcrumb";
type SummaryMode = "total" | "perMile";
const TruckSummary = () => {
  const { id } = useParams();
  const theme = useAppSelector((state: RootState) => state.palette);
  const { fromDate, toDate, isFiltered } = useFilter("truck-summary");
  const [summaryMode, setSummaryMode] = useState<SummaryMode>("total");
  const token = useAppSelector((state: RootState) => state.auth.token);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportHtml, setReportHtml] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const handlePreviewTruckReport = async () => {
    try {
      setReportLoading(true);

      const from = fromDate ? fromDate.format("YYYY-MM-DD") : "2026-05-01";
      const to = toDate ? toDate.format("YYYY-MM-DD") : "2026-05-30";

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const url = `${baseUrl}/api/v1/summary/truck/${id}/pdf?from=${from}&to=${to}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch truck report");
      }

      const html = await response.text();

      setReportHtml(html);
      setReportOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to open truck report");
    } finally {
      setReportLoading(false);
    }
  };
  const handleDownloadReportPdf = async () => {
    const iframe = document.getElementById(
      "truck-report-preview"
    ) as HTMLIFrameElement | null;

    const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;

    if (!iframeDoc) return;

    const from = fromDate ? fromDate.format("YYYY-MM-DD") : "2026-05-01";
    const to = toDate ? toDate.format("YYYY-MM-DD") : "2026-05-30";

    await html2pdf()
      .set({
        margin: 8,
        filename: `trucks-summary-${from}-to-${to}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          windowWidth: 1400,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "landscape",
        },
      })
      .from(iframeDoc.documentElement)
      .save();
  };

  // const handlePreviewTruckPdf = async () => {
  //   try {
  //     const from = fromDate ? fromDate.format("YYYY-MM-DD") : "2026-05-01";
  //     const to = toDate ? toDate.format("YYYY-MM-DD") : "2026-05-30";

  //     const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  //     const url = `${baseUrl}/api/v1/summary/truck/${id}/pdf?from=${from}&to=${to}`;

  //     const response = await fetch(url, {
  //       method: "GET",
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     if (!response.ok) {
  //       throw new Error("Failed to preview PDF");
  //     }

  //     const blob = await response.blob();
  //     const pdfUrl = window.URL.createObjectURL(blob);

  //     window.open(pdfUrl, "_blank");

  //     setTimeout(() => {
  //       window.URL.revokeObjectURL(pdfUrl);
  //     }, 10000);
  //   } catch (error) {
  //     toast.error("Failed to preview truck PDF");
  //   }
  // };

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
    refetch: refetchSpecificTruckSummary,
  } = useGetSpecificTruckSummaryQuery(id as string, {
    skip: !id,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: false,
  });
  const {
    data: truckSummaryFilterData,
    isLoading: summaryFilterLoading,
    refetch: refetchTruckSummaryFilter,
  } = useGetTruckSummaryWithFilterQuery(
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

  const money = (value?: number) => `$${Number(value || 0).toLocaleString()}`;

  const statCards =
    summaryMode === "total"
      ? [
        {
          title: "Net Profit",
          value: money(TrucksSummaryData?.netProfit),
          icon: <TrendingUp color={theme.currentPalette.primary} />,
        },
        {
          title: "Total Revenue",
          value: money(TrucksSummaryData?.totalRevenue),
          icon: <DollarSign color={theme.currentPalette.primary} />,
        },
        {
          title: "Total Loads",
          value: TrucksSummaryData?.totalLoads || 0,
          icon: <Boxes color={theme.currentPalette.primary} />,
        },
        {
          title: "Total Miles",
          value: TrucksSummaryData?.totalMiles?.toLocaleString() || 0,
          icon: <LandPlot color={theme.currentPalette.primary} />,
        },
      ]
      : [
        {
          title: "Profit / Mile",
          value: money(TrucksSummaryData?.avgProfitPerMile),
          icon: <TrendingUp color={theme.currentPalette.primary} />,
        },
        {
          title: "Revenue / Mile",
          value: money(TrucksSummaryData?.avgRevenuePerMile),
          icon: <DollarSign color={theme.currentPalette.primary} />,
        },
        {
          title: "Cost / Mile",
          value: money(TrucksSummaryData?.avgExpensePerMile),
          icon: <Boxes color={theme.currentPalette.primary} />,
        },
        {
          title: "Profit Margin",
          value: `${Number(TrucksSummaryData?.profitMargin || 0).toFixed(0)}%`,
          icon: <LandPlot color={theme.currentPalette.primary} />,
        },
      ];

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
      name: "Truck Number",
      value: profile?.truckNumber || "N/A",
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
    <>
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
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "flex-end",
            alignItems: { xs: "stretch", sm: "center" },
            gap: 2,
            mt: 3,
            width: "100%",
          }}
        >
          <ToggleButtonGroup
            value={summaryMode}
            exclusive
            onChange={(_, value: SummaryMode | null) => {
              if (!value) return;

              setSummaryMode(value);

              if (isFiltered && fromDate && toDate) {
                refetchTruckSummaryFilter();
              } else {
                refetchSpecificTruckSummary();
              }
            }}
            sx={{
              width: { xs: "100%", sm: "fit-content" },
              height: 44,
              flexShrink: 0,
            }}
          >
            <ToggleButton
              value="total"
              sx={{
                minWidth: 90,
                height: 44,
                px: 3,
                whiteSpace: "nowrap",
                textTransform: "none",
                color: theme.currentPalette.primary,
                "&.Mui-selected": {
                  backgroundColor: alpha(theme.currentPalette.primary, 0.9),
                  color: theme.currentPalette.background,
                },
              }}
            >
              Total
            </ToggleButton>

            <ToggleButton
              value="perMile"
              sx={{
                minWidth: 110,
                height: 44,
                px: 3,
                whiteSpace: "nowrap",
                textTransform: "none",
                color: theme.currentPalette.primary,
                "&.Mui-selected": {
                  backgroundColor: alpha(theme.currentPalette.primary, 0.9),
                  color: theme.currentPalette.background,
                },
              }}
            >
              Per Mile
            </ToggleButton>
          </ToggleButtonGroup>

          <Button
            variant="contained"
            onClick={handlePreviewTruckReport}
            disabled={!id || !token || reportLoading}
            sx={{
              height: 44,
              width: { xs: "100%", sm: "auto" },
              whiteSpace: "nowrap",
              textTransform: "none",
              borderRadius: 2,
              bgcolor: theme.currentPalette.primary,
              color: theme.currentPalette.background,
              "&:hover": {
                bgcolor: alpha(theme.currentPalette.primary, 0.8),
              },
            }}
          >
            {reportLoading ? "Loading..." : "Preview Reports "}
          </Button>
        </Box>

        {/* Profile */}
        <Box className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
          {/* LEFT BIG CARD */}
          <Box
            sx={{
              border: 1,
              borderRadius: 2,
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
                Truck - ({profile?.truckNumber || "N/A"})
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

          {/* RIGHT SMALL STAT CARDS */}
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((card) => (
              <Box
                key={card.title}
                sx={{
                  p: 1,
                  border: 1,
                  borderColor: alpha(theme.currentPalette.primary, 0.3),
                  borderRadius: 2,
                  bgcolor: theme.currentPalette.background,
                }}
                className="flex flex-col justify-center"
              >
                <Typography
                  sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
                >
                  <span style={{ color: theme.currentPalette.text }}>{card.title}</span>
                  {card.icon}
                </Typography>

                <Typography sx={{ fontSize: "24px", color: theme.currentPalette.text }}>
                  {card.value}
                </Typography>
              </Box>
            ))}
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

      <Dialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogContent sx={{ p: 0, height: "80vh" }}>
          {reportHtml ? (
            <iframe
              id="truck-report-preview"
              srcDoc={reportHtml}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                background: "white",
              }}
              title="Truck Report Preview"
            />
          ) : (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReportOpen(false)}>Close</Button>

          <Button
            variant="contained"
            onClick={handleDownloadReportPdf}
            sx={{
              textTransform: "none",
              bgcolor: theme.currentPalette.primary,
              color: theme.currentPalette.background,
            }}
          >
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>

    </>
  );
};

export default TruckSummary;
