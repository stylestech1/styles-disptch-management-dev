import { Box, Chip, Skeleton, styled, TableBody, TableCell, TableRow } from "@mui/material";
// @/components/ui/TablesMUI.tsx
import React from "react";
import { alpha, darken } from "@mui/material";
import { RootState, useAppSelector } from "@/redux/store";

export const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${theme.components?.MuiTableCell?.styleOverrides?.root}`]: {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  '&[class*="MuiTableCell-head"]': {
    backgroundColor: "#f8fafc",
    color: "#56677a",
    fontSize: 14,
  },
  '&[class*="MuiTableCell-body"]': {
    fontSize: 14,
  },
}));
export const StyledTableRow = styled(TableRow)(() => ({
  "&:last-child td, &:last-child th": {
    border: 0,
  },
  "&:hover": {
    backgroundColor: "#fcf9fa",
  },
}));

type Status = "available" | "inactive" | "busy" | string;

export const StatusChip: React.FC<{ status: Status }> = ({ status }) => {
  const theme = useAppSelector((state: RootState) => state.palette);
  const primary = theme.currentPalette.primary;

  const s = String(status || "").toLowerCase();

  const styles = (() => {
    if (s === "available") {
      return {
        bgcolor: alpha(primary, 0.75),
        color: "#fff",
        border: `1px solid ${alpha(primary, 0.18)}`,
      };
    }

    if (s === "inactive") {
      return {
        bgcolor: alpha(primary, 0.10),
        color: primary,
        border: `1px solid ${alpha(primary, 0.10)}`,
      };
    }

    if (s === "busy") {
      return {
        bgcolor: darken(primary, 0.18),
        color: "#fff",
        border: `1px solid ${alpha(primary, 0.22)}`,
      };
    }

    // fallback
    return {
      bgcolor: alpha(primary, 0.10),
      color: primary,
      border: `1px solid ${alpha(primary, 0.10)}`,
    };
  })();

  const label =
    s === "available" ? "Available" : s === "inactive" ? "Inactive" : s === "busy" ? "Busy" : status;

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        ...styles,
        height: 34,
        px: 1.4,
        borderRadius: 2,
        // fontWeight: 800,
        fontSize: 14,
        letterSpacing: 0.2,
        "& .MuiChip-label": { px: 1.2 },
      }}
    />
  );
};
  

// Skeleton Loader Component
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <TableBody>
    {Array.from({ length: rows }).map((_, index) => (
      <TableRow key={index}>
        <TableCell>
          <Skeleton variant="text" width={20} />
        </TableCell>
        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Skeleton variant="circular" width={18} height={18} />
            <Skeleton variant="text" width={80} />
          </Box>
        </TableCell>
        <TableCell align="right">
          <Skeleton variant="text" width={60} />
        </TableCell>
        <TableCell align="right">
          <Skeleton variant="text" width={60} />
        </TableCell>
        <TableCell align="right">
          <Skeleton variant="text" width={80} />
        </TableCell>
        <TableCell align="right">
          <Skeleton variant="text" width={60} />
        </TableCell>
        <TableCell align="right">
          <Skeleton variant="text" width={60} />
        </TableCell>
        <TableCell align="right">
          <Skeleton variant="text" width={60} />
        </TableCell>
        <TableCell align="right">
          <Skeleton variant="text" width={60} />
        </TableCell>
        <TableCell align="right">
          <Skeleton variant="text" width={80} />
        </TableCell>
        <TableCell align="center">
          <Skeleton variant="rectangular" width={80} height={32} />
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
);