"use client";

import { RootState, useAppSelector } from "@/redux/store";
import { alpha, Button, Typography } from "@mui/material";

interface PaginationProps {
  pagination: {
    currentPage: number;
    totalPages: number;
    total?: number;
  } | null;
  page: number;
  setPage: (page: number) => void;
  pageSize?: number;
  showInfo?: boolean;
  variant?: "default" | "minimal";
}

const Pagination = ({
  pagination,
  page,
  setPage,
  variant = "default",
}: PaginationProps) => {
  const theme = useAppSelector((state: RootState) => state.palette);

  if (!pagination) return null;
  const { currentPage, totalPages } = pagination;

  if (variant === "minimal") {
    return (
      <div className="flex justify-end items-center mt-6">
        <div className="flex items-center justify-end gap-1">
          <Button
            sx={{
              bgcolor: theme.currentPalette.background,
            }}
            disabled={page <= 1}
            onClick={() => setPage(Math.max(1, page - 1))}
            className="flex items-center gap-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </Button>

          <Typography className="px-3 py-2 text-sm" sx={{ color: theme.currentPalette.primary }}>
            {currentPage} / {totalPages}
          </Typography>

          <Button
            sx={{
              bgcolor: theme.currentPalette.background,
            }}
            disabled={page >= totalPages}
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            className="flex items-center gap-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end items-center mt-6">
      <div className="flex items-center justify-end gap-2">
        <Button
          sx={{
            bgcolor: theme.currentPalette.primary,
            color: theme.currentPalette.background,
            "&.Mui-disabled": {
              bgcolor: alpha(theme.currentPalette.primary, 0.4),
              color: "white",
              cursor: "not-allowed",
            },
          }}
          disabled={page <= 1}
          onClick={() => setPage(Math.max(1, page - 1))}
          className="flex items-center gap-1 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium transition-colors"
        >
          Previous
        </Button>


        <Typography className="px-3 py-2 text-sm" sx={{ color: theme.currentPalette.primary }}>
          Page {currentPage} of {totalPages}
        </Typography>

        <Button
          sx={{
            bgcolor: theme.currentPalette.primary,
            color: theme.currentPalette.background,
            "&.Mui-disabled": {
              bgcolor: alpha(theme.currentPalette.primary, 0.4),
              color: "white",
              cursor: "not-allowed",
            },
          }}
          disabled={page >= totalPages}
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          className="flex items-center gap-1 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
