"use client";
import {
  useGetAllTruckSummaryWithFilterQuery,
  useGetTruckSummaryQuery,
} from "@/redux/slices/apiSlice";
import { RootState, useAppSelector } from "@/redux/store";
import {
  alpha,
  Box,
  Chip,
  SxProps,
  TableRow,
  Typography,
  MenuItem,
  FormControl,
} from "@mui/material";
import { AiFillTool } from "react-icons/ai";
import { FiDollarSign } from "react-icons/fi";
import { MdOutlineShield } from "react-icons/md";
import { LuFuel } from "react-icons/lu";
import Select from "@mui/material/Select";
import { useRouter } from "next/navigation";
import Erros from "@/components/ui/Erros";
import { FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6";
import BarChartTruckDashboard from "@/components/truck/BarChartTruckDashboard";
import { TTruckSummary, TTruckWithSummary } from "@/types/globalTypes";
import SearchInput from "@/components/ui/SearchInput";
import DataTable from "@/components/ui/DataTable";
import { profitabilityColumns } from "@/data/truckDashboard/profitabilityTable";
import { revenueColumns } from "@/data/truckDashboard/revenueTable";
import { costColumns } from "@/data/truckDashboard/costTable";
import { useEffect, useMemo, useState } from "react";
import { useFilter } from "@/providers/FilterProvider";
import { setError, setLoading } from "@/redux/slices/uiSlice";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/utils/getErrorMessage";

type TableType = "Profit" | "Revenue" | "cost";

const TruckDashboard = () => {
  const router = useRouter();
  const token = useAppSelector((state: RootState) => state.auth.token);
  const theme = useAppSelector((state: RootState) => state.palette);
  const [page, setPage] = useState(1);
  const [currentTable, setCurrentTable] = useState<TableType>("Profit");
  const { fromDate, toDate, isFiltered } = useFilter();
  const [searchTerm, setSearchTerm] = useState("");

  // API Queries
  const {
    data: allTrucksData,
    isLoading: trucksLoading,
    error: trucksError,
    isFetching: trucksFetching,
  } = useGetTruckSummaryQuery(undefined, {
    skip: !token,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: false,
  });

  const {
    data: filteredData,
    isLoading: filterLoading,
    error: filterError,
  } = useGetAllTruckSummaryWithFilterQuery(
    {
      from: fromDate ? fromDate.format("YYYY-MM-DD") : undefined,
      to: toDate ? toDate.format("YYYY-MM-DD") : undefined,
    },
    {
      skip: !isFiltered || !fromDate || !toDate,
      refetchOnFocus: false,
    }
  );

  // Search function
  const searchTrucks = (
    trucks: TTruckWithSummary[] | TTruckSummary[],
    term: string
  ): TTruckWithSummary[] => {
    if (!term.trim()) return trucks as TTruckWithSummary[];

    const searchTermLower = term.toLowerCase().trim();

    return (trucks as TTruckWithSummary[]).filter(
      (truck) =>
        truck.plateNumber.toLowerCase().includes(searchTermLower) ||
        (truck.source &&
          truck.source.toLowerCase().includes(searchTermLower)) ||
        (truck.truckId &&
          String(truck.truckId).toLowerCase().includes(searchTermLower))
    );
  };

  // Get Truck Summary data based on filter state
  const TrucksSummaryData = useMemo(() => {
    if (isFiltered && filteredData) {
      return filteredData?.data?.trucksSummary || [];
    }
    return allTrucksData?.data?.trucksSummary || [];
  }, [isFiltered, filteredData, allTrucksData]);

  // Get Total Summary data based on filter state
  const totalSummaryData = useMemo(() => {
    if (isFiltered && filteredData) {
      return filteredData?.data?.totalSummary;
    }
    return allTrucksData?.data?.totalSummary;
  }, [isFiltered, filteredData, allTrucksData]);

  // Debounced search for better performance
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const finalDisplayTruckData = useMemo(() => {
    return searchTrucks(TrucksSummaryData, debouncedSearchTerm);
  }, [TrucksSummaryData, debouncedSearchTerm]);

  const isLoading = useMemo(() => {
    return trucksLoading || (isFiltered && filterLoading);
  }, [trucksLoading, isFiltered, filterLoading]);

  const error = useMemo(() => {
    return trucksError || filterError;
  }, [trucksError, filterError]);

  // Handle search
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
  };

  // Stat Card Component
  const StatCard = ({
    title,
    value,
    change,
  }: {
    title: string;
    value: string;
    change: number;
  }) => {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          padding: 2.5,
          borderRight: {
            lg: `1px solid ${alpha(theme.currentPalette.primary, 0.1)}`,
          },
          borderBottom: {
            xs: `1px solid ${alpha(theme.currentPalette.primary, 0.1)}`,
          },
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: `${theme.currentPalette.primary}`, fontSize: "16px" }}
        >
          {title}
        </Typography>

        <Typography sx={{ fontSize: "35px", fontWeight: "normal" }}>
          {value}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: change > 0 ? "#16a34a" : "#dc2626",
            fontSize: "14px",
          }}
        >
          {change > 0 ? <FaArrowTrendUp /> : <FaArrowTrendDown />}
          {change != 0 ? (change > 0 ? "+" : "") : ""}
          {change}% vs last month
        </Typography>
      </Box>
    );
  };

  // Table Profitability renderer
  const renderProfitabilityRow = (truckItem: TTruckWithSummary) => {
    const tableRowSx: SxProps = {
      bgcolor: theme.currentPalette.background,
      color: theme.currentPalette.primary,
      "&:hover": {
        bgcolor: alpha(theme.currentPalette.primary, 0.1),
        cursor: "pointer",
      },
      transition: "all 0.2s ease-in-out",
    };

    const summary = truckItem.summary;
    const profitMargin = summary?.totalRevenue
      ? (summary.netProfit / summary?.totalRevenue) * 100
      : 0;

    return (
      <TableRow
        sx={tableRowSx}
        key={truckItem._id}
        onClick={() => {
          router.push(`/admin/truckSummary/${truckItem._id}`);
        }}
      >
        {/* Plate Number */}
        <td className="p-4 text-center">
          <span className="text-sm px-2 py-1 rounded">
            {truckItem.plateNumber}
          </span>
        </td>

        {/* Source */}
        <td className="p-4 text-center">
          <Chip
            sx={{
              borderRadius: 1,
              bgcolor: alpha(theme.currentPalette.primary, 0.1),
              color: theme.currentPalette.primary,
            }}
            label={truckItem.source === "other" ? "Owner-Operator" : "Company"}
          />
        </td>

        {/* Revenue */}
        <td className="p-4 text-center">
          <span className="text-sm px-2 py-1 rounded">
            {`$${summary?.avgRevenuePerMile?.toFixed(2) || "0.00"}`}
          </span>
        </td>

        {/* Cost */}
        <td className="p-4 text-center">
          <span className="text-sm px-2 py-1 rounded">
            {`$${summary?.avgExpensePerMile?.toFixed(2) || "0.00"}`}
          </span>
        </td>

        {/* Net Profit */}
        <td className="p-4 text-center">
          <span className="text-sm px-2 py-1 rounded">
            {`$${summary?.netProfit?.toFixed(2) || "0.00"}`}
          </span>
        </td>

        {/* Profit Margin */}
        <td className="p-4 text-center">
          <Chip
            sx={{
              borderRadius: 1,
              bgcolor: alpha(theme.currentPalette.primary, 0.1),
              color: theme.currentPalette.primary,
            }}
            label={`${profitMargin.toFixed(0)}%`}
          />
        </td>
      </TableRow>
    );
  };

  // Table Revenue renderer
  const renderRevenueRow = (truckItem: TTruckWithSummary) => {
    const tableRowSx: SxProps = {
      color: theme.currentPalette.primary,
      bgcolor: theme.currentPalette.background,
      "&:hover": {
        bgcolor: alpha(theme.currentPalette.primary, 0.1),
        cursor: "pointer",
      },
      transition: "all 0.2s ease-in-out",
    };

    const summary = truckItem.summary;

    return (
      <TableRow
        sx={tableRowSx}
        key={truckItem._id}
        onClick={() => {
          router.push(`/admin/truckSummary/${truckItem._id}`);
        }}
      >
        {/* Plate Number */}
        <td className="p-4 text-center">
          <span className="text-sm px-2 py-1 rounded">
            {truckItem.plateNumber}
          </span>
        </td>

        {/* Source */}
        <td className="p-4 text-center">
          <Chip
            sx={{
              borderRadius: 1,
              bgcolor: alpha(theme.currentPalette.primary, 0.1),
              color: theme.currentPalette.primary,
            }}
            label={truckItem.source === "other" ? "Owner-Operator" : "Company"}
          />
        </td>

        {/* Net Rev/Mile  */}
        <td className="p-4 text-center">
          <span className="text-sm px-2 py-1 rounded">
            {`$${summary?.avgRevenuePerMile?.toFixed(2) || "0.00"}`}
          </span>
        </td>

        {/* Loads */}
        <td className="p-4 text-center">
          <span className="text-sm px-2 py-1 rounded">
            {`${summary?.totalLoads || "0"}`}
          </span>
        </td>

        {/* Avg/Load */}
        <td className="p-4 text-center">
          <span className="text-sm px-2 py-1 rounded">
            {`$${(summary && summary.totalLoads > 0
              ? summary.totalRevenue / summary.totalLoads
              : 0
            ).toFixed(2)}`}
          </span>
        </td>
      </TableRow>
    );
  };

  // Table cost renderer
  const renderCostRow = (truckItem: TTruckWithSummary) => {
    const tableRowSx: SxProps = {
      color: theme.currentPalette.primary,
      bgcolor: theme.currentPalette.background,
      "&:hover": {
        bgcolor: alpha(theme.currentPalette.primary, 0.1),
        cursor: "pointer",
      },
      transition: "all 0.2s ease-in-out",
    };

    const summary = truckItem.summary;

    return (
      <TableRow
        sx={tableRowSx}
        key={truckItem._id}
        onClick={() => {
          router.push(`/admin/truckSummary/${truckItem._id}`);
        }}
      >
        {/* Plate Number */}
        <td className="p-4 text-center">
          <span className="text-sm px-2 py-1 rounded">
            {truckItem.plateNumber}
          </span>
        </td>

        {/* Source */}
        <td className="p-4 text-center">
          <Chip
            sx={{
              borderRadius: 1,
              bgcolor: alpha(theme.currentPalette.primary, 0.1),
              color: theme.currentPalette.primary,
            }}
            label={truckItem.source === "other" ? "Owner-Operator" : "Company"}
          />
        </td>

        {/* Fuel  */}
        <td className="p-4 text-center">
          <span className="text-sm px-2 py-1 rounded">
            {`$${summary?.fuelCost?.toFixed(2) || "0.00"}`}
          </span>
        </td>

        {/* Maintenance */}
        <td className="p-4 text-center">
          <span className="text-sm px-2 py-1 rounded">
            {`$${summary?.repairCost?.toFixed(2) || "0.00"}`}
          </span>
        </td>

        {/* Driver Pay */}
        <td className="p-4 text-center">
          <span className="text-sm px-2 py-1 rounded">
            {`$${summary?.driverPay?.toFixed(2) || "0.00"}`}
          </span>
        </td>

        {/* Insurance */}
        <td className="p-4 text-center">
          <span className="text-sm px-2 py-1 rounded">
            {`$${summary?.insuranceCost?.toFixed(2) || "0.00"}`}
          </span>
        </td>

        {/* Total Cost */}
        <td className="p-4 text-center">
          <span className="text-sm px-2 py-1 rounded">
            {`$${summary?.totalExpenses?.toFixed(2) || "0.00"}`}
          </span>
        </td>
      </TableRow>
    );
  };

  const tableConfig = {
    Profit: {
      columns: profitabilityColumns,
      render: renderProfitabilityRow,
    },
    Revenue: {
      columns: revenueColumns,
      render: renderRevenueRow,
    },
    cost: {
      columns: costColumns,
      render: renderCostRow,
    },
  } as const;
  const selectedConfig = tableConfig[currentTable];

  // Operational Cost Cards
  const operationalCostCards = [
    {
      id: 1,
      icon: <AiFillTool size={20} />,
      title: "Maintenance & Repairs",
      totalCost: `$${totalSummaryData?.repairCost}`,
      changeVsLastMonth: `${totalSummaryData?.repairCostChange}%`,
    },
    {
      id: 2,
      icon: <FiDollarSign size={20} />,
      title: "Driver Pay",
      totalCost: `$${totalSummaryData?.driverPay}`,
      changeVsLastMonth: `${totalSummaryData?.driverPayChange}%`,
    },
    {
      id: 3,
      icon: <MdOutlineShield size={20} />,
      title: "Insurance",
      totalCost: `$${totalSummaryData?.insuranceCost}`,
      changeVsLastMonth: `${totalSummaryData?.insuranceCostChange}%`,
    },
    {
      id: 4,
      icon: <LuFuel size={20} />,
      title: "Fuel Costs",
      totalCost: `$${totalSummaryData?.fuelCost}`,
      changeVsLastMonth: `${totalSummaryData?.fuelCostChange}%`,
    },
  ];

  // handling Loading
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  // handling Errors
  useEffect(() => {
    if (error) {
      const errorMessage = getErrorMessage(error);
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
  }, [error, setError]);

  // Error state
  if (trucksError && !allTrucksData) {
    return (
      <Box p={3}>
        <Erros message="Failed to load truck data. Please try again later." />
      </Box>
    );
  }

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

  return (
    <Box sx={containerSx}>
      {/* Stats Cards */}
      <Box>
        <Typography
          variant="h5"
          sx={{ color: theme.currentPalette.primary, fontWeight: 500 }}
        >
          Performance Overview
        </Typography>

        <Box
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          sx={{
            my: 3,
            border: `1px solid ${alpha(theme.currentPalette.primary, 0.3)}`,
            borderRadius: "12px",
            overflow: "hidden",
            bgcolor: theme.currentPalette.background,
          }}
        >
          <StatCard
            title="Total Revenue/Mile"
            value={`$${totalSummaryData?.avgRevenuePerMile || "0.00"}`}
            change={totalSummaryData?.avgRevenuePerMileChange || 0}
          />

          <StatCard
            title="Total Cost/Mile"
            value={`$${totalSummaryData?.avgExpensePerMile || "0.00"}`}
            change={totalSummaryData?.avgExpensePerMileChange || 0}
          />

          <StatCard
            title="Total Profit/Mile"
            value={`$${totalSummaryData?.avgProfitPerMile}`}
            change={totalSummaryData?.avgProfitPerMileChange || 0}
          />

          <StatCard
            title="Profit Margin %"
            value={`${totalSummaryData?.profitMargin}%`}
            change={totalSummaryData?.profitMarginChange || 0}
          />
        </Box>
      </Box>

      {/* Profitability Analysis */}
      <Box sx={{ my: 5 }}>
        <Typography
          variant="h5"
          sx={{ color: theme.currentPalette.primary, fontWeight: 500 }}
        >
          Profitability Analysis
        </Typography>

        <Box sx={{ my: 3 }}>
          <BarChartTruckDashboard data={finalDisplayTruckData} />
        </Box>
      </Box>

      {/* Tables Section */}
      <Box sx={searchFilterContainerSx}>
        <Box>
          <Typography
            variant="h6"
            sx={{ color: theme.currentPalette.primary, fontWeight: 500 }}
          >
            {currentTable === "Profit" && "Profitability Breakdown per Truck"}
            {currentTable === "Revenue" && "Revenue Breakdown per Truck"}
            {currentTable === "cost" && "Cost Breakdown per Truck"}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.currentPalette.primary, fontWeight: 400 }}
          >
            {currentTable === "Profit" &&
              "Net profit margins and profitability metrics"}
            {currentTable === "Revenue" && "Total revenue and rates per truck"}
            {currentTable === "cost" &&
              "Full costs for Company-owned, driver pay % for O/O trucks"}
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
          {/* Search Input */}
          <Box
            sx={{
              width: { xs: "100%", md: 300, lg: 350 },
            }}
          >
            <SearchInput
              value={searchTerm}
              onChange={handleSearchChange}
              onClear={handleClearSearch}
              placeholder="Search by plate number..."
              fullWidth
              showClearButton
              inputSx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1,
                  backgroundColor: theme.currentPalette.background,
                  borderColor: theme.currentPalette.primary,
                },
              }}
            />
          </Box>

          {/* Table Type Selector */}
          <FormControl size="small">
            <Select
              displayEmpty
              value={currentTable}
              onChange={(e) => setCurrentTable(e.target.value as TableType)}
              renderValue={(selected) => {
                if (!selected) {
                  return (
                    <span style={{ color: theme.currentPalette.primary }}>
                      Select table type...
                    </span>
                  );
                }
                return selected;
              }}
              sx={{
                py: 0.5,
                borderRadius: 1,
                color: theme.currentPalette.primary,
              }}
            >
              <MenuItem
                sx={{ color: theme.currentPalette.primary }}
                disabled
                value=""
              >
                <em>Select table type...</em>
              </MenuItem>

              <MenuItem
                sx={{ color: theme.currentPalette.primary }}
                value="Profit"
              >
                Profit
              </MenuItem>
              <MenuItem
                sx={{ color: theme.currentPalette.primary }}
                value="Revenue"
              >
                Revenue
              </MenuItem>
              <MenuItem
                sx={{ color: theme.currentPalette.primary }}
                value="cost"
              >
                Cost
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Search Results Info */}
      {debouncedSearchTerm && (
        <Box sx={{ mb: 2, p: 1 }}>
          <Typography
            variant="body2"
            sx={{ color: theme.currentPalette.primary }}
          >
            Showing {finalDisplayTruckData.length} results for{" "}
            {debouncedSearchTerm}
            {finalDisplayTruckData.length === 0 &&
              " - No matching trucks found"}
          </Typography>
        </Box>
      )}

      {/* Data Table */}
      <DataTable
        columns={selectedConfig.columns}
        data={finalDisplayTruckData}
        renderRow={selectedConfig.render}
        loading={isLoading}
      />

      {/* Operational Costs */}
      <Box sx={{ my: 5 }}>
        <Typography
          variant="h5"
          sx={{ color: theme.currentPalette.primary, fontWeight: 500 }}
        >
          Operational Costs
        </Typography>

        <Box className="grid grid-cols-1 md:grid-cols-2 gap-5 my-5">
          {operationalCostCards.map((cost) => (
            <Box
              key={cost.id}
              sx={{
                p: 3,
                border: 1,
                borderColor: alpha(theme.currentPalette.primary, 0.3),
                borderRadius: 1,
                bgcolor: theme.currentPalette.background,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: theme.currentPalette.primary,
                  mb: 2,
                }}
              >
                <span
                  className="p-2 rounded-md"
                  style={{
                    backgroundColor: alpha(theme.currentPalette.primary, 0.1),
                    color: theme.currentPalette.primary,
                  }}
                >
                  {cost.icon}
                </span>
                <span
                  style={{ color: theme.currentPalette.primary }}
                  className="text-lg"
                >
                  {cost.title}
                </span>
              </Typography>

              <Box
                sx={{ borderColor: alpha(theme.currentPalette.text, 0.1) }}
                className={`flex justify-between items-center py-2 border-b`}
              >
                <Typography
                  variant="body2"
                  sx={{ color: theme.currentPalette.primary, fontSize: "16px" }}
                >
                  Total Cost
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: theme.currentPalette.primary, fontSize: "16px" }}
                >
                  {cost.totalCost}
                </Typography>
              </Box>

              <Box className={`flex justify-between items-center py-2`}>
                <Typography
                  variant="body2"
                  sx={{ color: theme.currentPalette.primary, fontSize: "16px" }}
                >
                  Change vs Last Month
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "16px",
                    color:
                      Number(cost.changeVsLastMonth) === 0
                        ? theme.currentPalette.primary
                        : parseFloat(cost.changeVsLastMonth) > 0
                        ? "#b91c1c"
                        : "#065f46",
                  }}
                >
                  {cost.changeVsLastMonth}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default TruckDashboard;
