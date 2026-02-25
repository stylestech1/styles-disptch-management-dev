"use client";
import { useState, useEffect, useRef } from "react";
import { DateRange, Range, RangeKeyDict } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import dayjs, { Dayjs } from "dayjs";
import { useSearchParams } from "next/navigation";
import { alpha, Box, Button } from "@mui/material";
import { RootState, useAppSelector } from "@/redux/store";
import { FaRegCalendarAlt } from "react-icons/fa";

type DateRangeFilterProps = {
  onApply?: (from: Dayjs | null, to: Dayjs | null) => void;
  onClear?: () => void;
  onFilterApplied?: (applied: boolean) => void;
};

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  onApply,
  onClear,
  onFilterApplied,
}) => {
  const searchParams = useSearchParams();

  const [showPicker, setShowPicker] = useState(false);
  const [dateRange, setDateRange] = useState<Range[]>([
    {
      startDate: undefined,
      endDate: undefined,
      key: "selection",
    },
  ]);

  const theme = useAppSelector((state: RootState) => state.palette);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close when clicking everywher
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ✅ Load initial values from URL if available
  useEffect(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (from && to) {
      setDateRange([
        {
          startDate: new Date(from),
          endDate: new Date(to),
          key: "selection",
        },
      ]);
    } else {
      setDateRange([
        {
          startDate: undefined,
          endDate: undefined,
          key: "selection",
        },
      ]);
    }
  }, [searchParams]);

  // ✅ when selecting range
  const handleRangeSelect = (ranges: RangeKeyDict) => {
    const selection = ranges.selection;

    if (selection.startDate && !selection.endDate) {
      const endOfMonth = dayjs(selection.startDate).endOf("month").toDate();
      selection.endDate = endOfMonth;
    }

    setDateRange([selection]);
  };

  // ✅ Apply
  const handleApply = () => {
    if (!dateRange?.[0]?.startDate) return;

    const start = dayjs(dateRange[0].startDate);
    const end = dateRange?.[0]?.endDate
      ? dayjs(dateRange[0].endDate)
      : start.endOf("month");

    onApply?.(start, end);
    onFilterApplied?.(true);
    setShowPicker(false);
  };

  // ✅ Clear
  const handleClear = () => {
    setDateRange([
      {
        startDate: undefined,
        endDate: undefined,
        key: "selection",
      },
    ]);
    onClear?.();
    onApply?.(null, null);
    onFilterApplied?.(false);
    setShowPicker(false);
  };

  // ✅ Display label
  const from = dateRange?.[0]?.startDate
    ? dayjs(dateRange[0].startDate).format("MMM D, YYYY")
    : "";

  const to = dateRange?.[0]?.endDate
    ? dayjs(dateRange[0].endDate).format("MMM D, YYYY")
    : dateRange?.[0]?.startDate
    ? dayjs(dateRange[0].startDate).endOf("month").format("MMM D, YYYY")
    : "";

  const label = from && to ? `${from} → ${to}` : "Date";

  return (
    <div className="relative inline-block" ref={pickerRef}>
      <Button
        onClick={() => setShowPicker(!showPicker)}
        startIcon={<FaRegCalendarAlt size={18} />}
        sx={{
          maxWidth: "100%",
          textAlign: "left",
          cursor: "pointer",
          fontSize: "14px",
          py: 1,
          px: 2,
          border: `1px solid ${alpha(theme.currentPalette.text, 0.3)}`,
          borderRadius: 2,
          color: theme.currentPalette.primary,
          textTransform: "none",
          display: "flex",
          alignItems: "center",
          gap: 0,
          "&:hover": {
            color: "#fff",
            backgroundColor: theme.currentPalette.primary,
            borderColor: theme.currentPalette.primary,
          },
        }}
      >
        {label}
      </Button>

      {showPicker && (
        <Box
          sx={{
            bgcolor: theme.currentPalette.background,
            "--date-range-bg": theme.currentPalette.background,
          }}
          className="date-range-container absolute top-12 -right-15 md:right-0 z-50 border border-gray-200 rounded-xl shadow-xl p-4 w-[370px]"
        >
          {dateRange[0].startDate === undefined &&
          dateRange[0].endDate === undefined ? (
            <DateRange
              onChange={handleRangeSelect}
              moveRangeOnFirstSelection={false}
              ranges={[
                {
                  startDate: new Date(),
                  endDate: new Date(),
                  key: "selection",
                },
              ]}
              rangeColors={[theme.currentPalette.primary]}
              showDateDisplay={false}
              months={1}
              direction="horizontal"
              showMonthAndYearPickers={true}
              editableDateInputs={true}
            />
          ) : (
            <DateRange
              onChange={handleRangeSelect}
              moveRangeOnFirstSelection={false}
              ranges={dateRange}
              rangeColors={[theme.currentPalette.primary]}
              showDateDisplay={false}
              months={1}
              direction="horizontal"
              showMonthAndYearPickers={true}
              editableDateInputs={true}
            />
          )}

          <div className="flex justify-between mt-3">
            <Button
              sx={{ color: theme.currentPalette.primary }}
              onClick={handleClear}
              className="px-3 py-1.5 text-gray-600 rounded-md text-sm"
            >
              Clear
            </Button>
            <div className="flex gap-2">
              <Button
                sx={{ color: theme.currentPalette.primary }}
                onClick={() => setShowPicker(false)}
                className="px-3 py-1.5 text-gray-600 rounded-md text-sm"
              >
                Cancel
              </Button>
              <Button
                sx={{
                  bgcolor: theme.currentPalette.primary,
                  color: theme.currentPalette.background,
                }}
                onClick={handleApply}
                className="px-4 py-1.5 text-white rounded-md text-sm"
              >
                Apply
              </Button>
            </div>
          </div>
        </Box>
      )}
    </div>
  );
};

export default DateRangeFilter;
