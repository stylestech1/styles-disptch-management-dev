"use client";
import React, { ReactNode } from "react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Box,
  Typography,
  Skeleton,
  alpha,
} from "@mui/material";
import { RootState, useAppSelector } from "@/redux/store";
import { usePathname } from "next/navigation";

export type AlignType = "left" | "center" | "right";

export interface Column {
  key: string;
  header: string;
  align?: AlignType;
  width?: string;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  columns: Column[];
  data: T[];
  renderRow: (item: T, index: number) => ReactNode;
  emptyState?: ReactNode;
  loading?: boolean;
  className?: string;
}

const DataTable = <T,>({
  columns,
  data,
  renderRow,
  emptyState,
  loading = false,
  className = "",
}: DataTableProps<T>) => {
  const theme = useAppSelector((state: RootState) => state.palette);
  const pathname = usePathname();

  if (loading) {
    return (
      <Paper
        elevation={1}
        sx={{
          borderRadius: 1,
          border: "1px solid",
          borderColor: theme.currentPalette.primary,
          overflow: "hidden",
        }}
        className={className}
      >
        <TableContainer>
          <Table size="small">
            <TableHead
              sx={{ bgcolor: alpha(theme.currentPalette.primary, 0.05) }}
            >
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align || "center"}
                    sx={{
                      fontWeight: 600,
                      color: theme.currentPalette.primary,
                      borderBottom: 1,
                      borderColor: alpha(theme.currentPalette.primary, 0.2),
                      py: 2,
                    }}
                  >
                    {column.header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {[...Array(6)].map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((col, colIndex) => (
                    <TableCell key={col.key} align={col.align || "center"}>
                      <Skeleton
                        animation="wave"
                        variant="rectangular"
                        height={20}
                        width={`${80 - colIndex * 5}%`}
                        sx={{
                          mx: "auto",
                          borderRadius: 1,
                          bgcolor: alpha(theme.currentPalette.primary, 0.15),
                        }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  const defaultEmptyState = (
    <TableRow>
      <TableCell
        colSpan={columns.length}
        align="center"
        sx={{ py: 6, color: "text.secondary" }}
      >
        <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
          {pathname.endsWith("customers") ? (
            <Typography variant="h4">🤵</Typography>
          ) : (
            <Typography variant="h4">📦</Typography>
          )}
          <Typography variant="body1">No records found</Typography>
          <Typography variant="body2" color="text.disabled">
            Get started by creating your first record
          </Typography>
        </Box>
      </TableCell>
    </TableRow>
  );

  return (
    <Paper
      elevation={1}
      sx={{
        borderRadius: 1,
        border: "1px solid",
        borderColor:  alpha(theme.currentPalette.primary, 0.3),
        overflowX: "auto",
        boxShadow: 'none'
      }}
    >
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align || "center"}
                  sx={{
                    fontWeight: 600,
                    color: theme.currentPalette.primary,
                    backgroundColor: alpha(theme.currentPalette.text, 0.05),
                    width: column.width,
                    py: 2,
                  }}
                >
                  {column.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {data.length > 0
              ? data.map((item, index) => renderRow(item, index))
              : emptyState || defaultEmptyState}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default DataTable;
