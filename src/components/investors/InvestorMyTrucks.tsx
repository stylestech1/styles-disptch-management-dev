"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import LocalShippingOutlined from "@mui/icons-material/LocalShippingOutlined";
import { FaBoxOpen, FaTruck } from "react-icons/fa";
import DataTable, { Column } from "@/components/ui/DataTable";
import StatsCard from "@/components/ui/StatsCard";
import {
  useGetAllLoadsQuery,
  useGetAllTruckQuery,
  useGetTruckByIdQuery,
} from "@/redux/slices/apiSlice";
import { RootState, useAppSelector } from "@/redux/store";
import { InvestorTruckItem, TLoads, TTruck } from "@/types/globalTypes";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { getInvestorTrucks } from "@/utils/investorTrucks";

type PortfolioRow = {
  id: string;
  type: "Truck" | "Load";
  reference: string;
  details: string;
  status: string;
  value: string;
  truckId?: string;
};

const portfolioColumns: Column[] = [
  { key: "type", header: "Type" },
  { key: "reference", header: "Truck / Load" },
  { key: "details", header: "Details", align: "left" },
  { key: "status", header: "Status" },
  { key: "value", header: "Value", align: "right" },
  { key: "action", header: "Action" },
];

function truckName(truck: TTruck) {
  return truck.truckNumber || "-";
}

function getTrucks(response: unknown): TTruck[] {
  if (Array.isArray(response)) {
    return getInvestorTrucks(response as InvestorTruckItem[]);
  }
  if (!response || typeof response !== "object") return [];

  const result = response as {
    data?: InvestorTruckItem[] | { trucks?: InvestorTruckItem[] };
    trucks?: InvestorTruckItem[];
  };
  if (Array.isArray(result.data)) return getInvestorTrucks(result.data);
  if (result.data && !Array.isArray(result.data) && Array.isArray(result.data.trucks)) {
    return getInvestorTrucks(result.data.trucks);
  }
  return Array.isArray(result.trucks) ? getInvestorTrucks(result.trucks) : [];
}

function getLoads(response: unknown): TLoads[] {
  if (Array.isArray(response)) return response as TLoads[];
  if (!response || typeof response !== "object") return [];

  const result = response as {
    data?: TLoads[] | { loads?: TLoads[] };
    loads?: TLoads[];
  };
  if (Array.isArray(result.data)) return result.data;
  if (result.data && !Array.isArray(result.data) && Array.isArray(result.data.loads)) {
    return result.data.loads;
  }
  return Array.isArray(result.loads) ? result.loads : [];
}

function EmptyTableState({
  colSpan,
  message,
}: {
  colSpan: number;
  message: string;
}) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center" sx={{ py: 5 }}>
        <Typography color="text.secondary">{message}</Typography>
      </TableCell>
    </TableRow>
  );
}

export default function InvestorMyTrucks() {
  const [selectedTruckId, setSelectedTruckId] = useState("");
  const theme = useAppSelector((state: RootState) => state.palette);
  const {
    data: truckResponse,
    isLoading: isLoadingTrucks,
    isError: trucksIsError,
    error: trucksError,
  } = useGetAllTruckQuery(undefined);
  const {
    data: loadResponse,
    isLoading: isLoadingLoads,
    isError: loadsIsError,
    error: loadsError,
  } = useGetAllLoadsQuery(undefined);
  const {
    data: truckDetailResponse,
    isLoading: isLoadingTruckDetail,
    isError: truckDetailIsError,
    error: truckDetailError,
  } = useGetTruckByIdQuery(selectedTruckId, { skip: !selectedTruckId });

  const trucks = getTrucks(truckResponse);
  const loads = getLoads(loadResponse);
  const truckDetailResponseData = truckDetailResponse?.data as
    | InvestorTruckItem
    | undefined;
  const truckDetail = truckDetailResponseData
    ? getInvestorTrucks([truckDetailResponseData])[0]
    : undefined;

  const portfolioRows: PortfolioRow[] = [
    ...trucks.map((truck) => ({
      id: `truck-${truck.id}`,
      type: "Truck" as const,
      reference: truck.truckNumber || "-",
      details:
        [truck.model, truck.year, truck.type].filter(Boolean).join(" · ") || "-",
      status: truck.status || "Unknown",
      value: `${Number(truck.totalMileage || 0).toLocaleString()} mi`,
      truckId: truck.id,
    })),
    ...loads.map((load) => ({
      id: `load-${load.id || load._id || load.loadId}`,
      type: "Load" as const,
      reference: load.loadId || load.id || load._id || "-",
      details: `${load.origin || "-"} → ${load.destination || "-"}`,
      status: load.status || "Unknown",
      value: `${load.currency || "$"}${Number(load.totalPrice || 0).toLocaleString()}`,
    })),
  ];

  const renderPortfolioRow = (row: PortfolioRow) => (
    <TableRow
      key={row.id}
      sx={{
        bgcolor: theme.currentPalette.background,
        "&:hover": { bgcolor: alpha(theme.currentPalette.primary, 0.06) },
      }}
    >
      <TableCell align="center">
        <Chip
          size="small"
          label={row.type}
          color={row.type === "Truck" ? "primary" : "default"}
          variant="outlined"
        />
      </TableCell>
      <TableCell align="center">{row.reference}</TableCell>
      <TableCell align="left">{row.details}</TableCell>
      <TableCell align="center">
        <Chip size="small" label={row.status} variant="outlined" />
      </TableCell>
      <TableCell align="right">
        {row.value}
      </TableCell>
      <TableCell align="center">
        {row.truckId ? (
          <Button
            size="small"
            variant="outlined"
            startIcon={<LocalShippingOutlined />}
            onClick={() => {
              if (row.truckId) setSelectedTruckId(row.truckId);
            }}
          >
            View
          </Button>
        ) : (
          "-"
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
        }}
      >
        <StatsCard
          title="Trucks"
          value={trucks.length}
          icon={FaTruck}
          loading={isLoadingTrucks}
        />
        <StatsCard
          title="Loads"
          value={loads.length}
          icon={FaBoxOpen}
          loading={isLoadingLoads}
        />
      </Box>

      <Box>
        <Box sx={{ mb: 1.5 }}>
          <Typography
            variant="h6"
            sx={{ color: theme.currentPalette.primary, fontWeight: 600 }}
          >
            Portfolio Activity
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Trucks and loads are displayed together. Investor access is read-only.
          </Typography>
        </Box>
        {trucksIsError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {getErrorMessage(trucksError) || "Unable to load trucks."}
          </Alert>
        )}
        {loadsIsError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {getErrorMessage(loadsError) || "Unable to load loads."}
          </Alert>
        )}
        <DataTable
          columns={portfolioColumns}
          data={portfolioRows}
          renderRow={renderPortfolioRow}
          loading={isLoadingTrucks || isLoadingLoads}
          emptyState={
            <EmptyTableState
              colSpan={portfolioColumns.length}
              message="No trucks or loads found."
            />
          }
        />
      </Box>

      <Dialog
        open={Boolean(selectedTruckId)}
        onClose={() => setSelectedTruckId("")}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Truck details</DialogTitle>
        <DialogContent dividers>
          {truckDetailIsError ? (
            <Alert severity="error">
              {getErrorMessage(truckDetailError) ||
                "Unable to load truck details."}
            </Alert>
          ) : isLoadingTruckDetail ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <Typography>Loading truck details...</Typography>
            </Box>
          ) : truckDetail ? (
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <Typography><strong>Truck:</strong> {truckName(truckDetail)}</Typography>
              <Typography><strong>Status:</strong> {truckDetail.status || "-"}</Typography>
              <Typography><strong>Type:</strong> {truckDetail.type || "-"}</Typography>
              <Typography><strong>Capacity:</strong> {truckDetail.capacity || "-"}</Typography>
              <Typography>
                <strong>Total mileage:</strong>{" "}
                {truckDetail.totalMileage?.toLocaleString() || "-"}
              </Typography>
            </Box>
          ) : (
            <Typography color="text.secondary">No truck details found.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTruckId("")}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box> 
  );
}
