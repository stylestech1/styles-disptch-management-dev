/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useGetTrucksQuery } from "@/redux/slices/apiSlice";
import { RootState, useAppSelector } from "@/redux/store";
import {
  AssignmentTabProps,
  TDriver,
  TTruck,
  TTruckType,
} from "@/types/globalTypes";
import {
  Alert,
  alpha,
  Box,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { IoCheckmark } from "react-icons/io5";
import { User, Truck as TruckIcon, Snowflake, Thermometer } from "lucide-react";

const INPUT_HEIGHT = 56;

const helperSx = (theme: any) => ({
  mb: 2,
  fontSize: 13,
  color: alpha(theme.currentPalette.text, 0.45),
});

const iconPillSx = (theme: any) => ({
  display: "grid",
  placeItems: "center",
  color: theme.currentPalette.primary,
  flexShrink: 0,
});

const outlinedSx = (theme: any) => ({
  height: INPUT_HEIGHT,
  borderRadius: 2,
  "& fieldset": { borderColor: alpha(theme.currentPalette.text, 0.22) },
  "&:hover fieldset": { borderColor: alpha(theme.currentPalette.text, 0.35) },
  "&.Mui-focused fieldset": {
    borderColor: theme.currentPalette.primary,
    borderWidth: 2,
  },
  "& .MuiOutlinedInput-input": {
    height: INPUT_HEIGHT,
    padding: "0 14px",
    display: "flex",
    alignItems: "center",
  },
});

const labelFloatingSx = (theme: any) => ({
  fontSize: 13,
  lineHeight: 1,
  color: alpha(theme.currentPalette.text, 0.55),
  "&.Mui-focused": { color: theme.currentPalette.primary },
  "&.MuiInputLabel-shrink": {
    fontSize: 13,
    transform: "translate(14px, -8px) scale(1)",
  },
});

type LabeledSelectProps = {
  theme: any;
  label: string;
  required?: boolean;
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
  onOpen?: () => void;
  placeholder: string;
  startIcon: React.ReactNode;
  children: React.ReactNode;
  onMenuScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  mb?: number;
  isLoading?: boolean;
  hasMore?: boolean;
  loadingText?: string;
  noMoreText?: string;
};

const LabeledSelect = ({
  theme,
  label,
  required,
  value,
  disabled,
  onChange,
  onOpen,
  placeholder,
  startIcon,
  children,
  onMenuScroll,
  mb = 0,
  isLoading = false,
  hasMore = true,
  loadingText = "Loading...",
  noMoreText = "No more items",
}: LabeledSelectProps) => {

  const id = `${label.replace(/\s+/g, "-").toLowerCase()}-select`;

  return (
    <FormControl
      fullWidth
      disabled={disabled}
      variant="outlined"
      sx={{
        mb,
        "& .MuiFormLabel-asterisk": { display: "none" },
      }}
    >
      <InputLabel shrink id={`${id}-label`} sx={labelFloatingSx(theme)}>
        {label}
        {required ? <span style={{ color: "#d32f2f" }}> *</span> : null}
      </InputLabel>

      <Select
        labelId={`${id}-label`}
        id={id}
        value={value}
        label={label}
        onOpen={onOpen}
        onChange={(e: SelectChangeEvent) => onChange(String(e.target.value))}
        displayEmpty
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: 300,
              overflowY: "auto",
            },
          },
          MenuListProps: {
            onScroll: onMenuScroll as any,
            sx: {
              maxHeight: 300,
              overflowY: "auto",
            },
          },
        }}
        sx={{
          "&.MuiOutlinedInput-root": outlinedSx(theme),
          "& .MuiSelect-select": {
            display: "flex",
            alignItems: "center",
            gap: 10,
            height: INPUT_HEIGHT,
            padding: "0 10px",
            lineHeight: 1,
          },
        }}
        startAdornment={
          <InputAdornment position="start">
            <Box sx={iconPillSx(theme)}>{startIcon}</Box>
          </InputAdornment>
        }
        renderValue={(selected) => {
          if (!selected) return placeholder;

          const items = Array.isArray(children) ? children : [children];
          const match = items.find((c: any) => c?.props?.value === selected);

          return match?.props?.children ?? selected;
        }}
      >
        <MenuItem value="" disabled>
          {placeholder}
        </MenuItem>
        {children}
        {isLoading && (
          <MenuItem disabled sx={{ justifyContent: "center", display: "flex", gap: 1 }}>
            <CircularProgress size={20} />
            <span>{loadingText}</span>
          </MenuItem>
        )}
        {!hasMore && !isLoading && (
          <MenuItem disabled sx={{ justifyContent: "center", opacity: 0.7 }}>
            {noMoreText}
          </MenuItem>
        )}
      </Select>
    </FormControl>
  );
};

// Interface for pagination response
interface PaginationResult {
  currentPage: number;
  limit: number;
  totalDocs: number;
  totalPages: number;
  next: number | null;
  prev: number | null;
}

interface DriversResponse {
  data: TDriver[];
  results: number;
  paginationResult: PaginationResult;
}

const AssignmentTab: React.FC<AssignmentTabProps> = ({
  isEditing,
  editingLoad,
  driverId,
  truckId,
  truckType,
  truckTemp,
  onDriverIdChange,
  onTruckIdChange,
  onTruckTypeChange,
  onTruckTempChange,
}) => {
  const token = useAppSelector((state: RootState) => state.auth.token);
  const theme = useAppSelector((state: RootState) => state.palette);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const { data: trucksData, refetch: truckRefetch } = useGetTrucksQuery(
    { skip: !token } as any
  );

  const trucks: TTruck[] = trucksData?.data || [];

  // State for drivers with pagination
  const [driversState, setDriversState] = useState<{ driverList: TDriver[] }>({
    driverList: [],
  });

  const [paginationInfo, setPaginationInfo] = useState<PaginationResult>({
    currentPage: 1,
    limit: 10,
    totalDocs: 0,
    totalPages: 0,
    next: null,
    prev: null,
  });

  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  const isFetchingRef = useRef(false);

  // Function to fetch drivers with pagination using native fetch
  const fetchDriversPage = useCallback(async (pageNumber: number, isInitial = false) => {
    if (!token) return;
    if (isFetchingRef.current) return;

    // Check if we already have all pages
    if (!isInitial && paginationInfo.currentPage >= paginationInfo.totalPages && paginationInfo.totalPages > 0) {
      console.log("No more pages available");
      return;
    }

    isFetchingRef.current = true;
    if (isInitial) {
      setIsInitialLoading(true);
    } else {
      setIsLoadingDrivers(true);
    }

    try {
      // Build URL with query parameters
      const url = new URL(`${baseUrl}/api/v1/drivers`);
      url.searchParams.append('status', 'available');
      url.searchParams.append('page', pageNumber.toString());
      url.searchParams.append('limit', '10');

      console.log("Fetching drivers from:", url.toString());

      // Make API request using native fetch
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const newDrivers: TDriver[] = result?.data || [];
      const pagination = result?.paginationResult;

      console.log("Fetched drivers:", {
        page: pageNumber,
        driversCount: newDrivers.length,
        pagination: pagination
      });

      // Update pagination info
      if (pagination) {
        setPaginationInfo(pagination);
      }

      // Merge new drivers with existing ones, avoiding duplicates
      setDriversState((prev) => {
        if (isInitial) {
          // For initial load, replace the list
          return { driverList: newDrivers };
        }

        // For subsequent loads, append and remove duplicates
        const existingIds = new Set(prev.driverList.map(d => d.id));
        const uniqueNewDrivers = newDrivers.filter(d => !existingIds.has(d.id));

        console.log(`Adding ${uniqueNewDrivers.length} new drivers to existing ${prev.driverList.length}`);

        return {
          driverList: [...prev.driverList, ...uniqueNewDrivers]
        };
      });

    } catch (error) {
      console.error("Error fetching drivers:", error);
    } finally {
      isFetchingRef.current = false;
      if (isInitial) {
        setIsInitialLoading(false);
      } else {
        setIsLoadingDrivers(false);
      }
    }
  }, [token, baseUrl, paginationInfo.currentPage, paginationInfo.totalPages]);

  // Initial fetch when token is available or when dropdown opens
  const loadInitialDrivers = useCallback(() => {
    if (token && driversState.driverList.length === 0 && !isFetchingRef.current) {
      fetchDriversPage(1, true);
    }
  }, [token, fetchDriversPage, driversState.driverList.length]);

  // Handle scroll in dropdown menu - load next page
  const handleMenuScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 50;

    // Check if we should load more
    const hasMorePages = paginationInfo.next !== null &&
      paginationInfo.currentPage < paginationInfo.totalPages;

    console.log("Scroll check:", {
      isBottom,
      hasMorePages,
      currentPage: paginationInfo.currentPage,
      totalPages: paginationInfo.totalPages,
      next: paginationInfo.next,
      isFetching: isFetchingRef.current,
      isLoading: isLoadingDrivers
    });

    if (isBottom && hasMorePages && !isFetchingRef.current && !isLoadingDrivers) {
      const nextPage = paginationInfo.next || paginationInfo.currentPage + 1;
      console.log(`Loading page ${nextPage}`);
      fetchDriversPage(nextPage, false);
    }
  }, [paginationInfo, isLoadingDrivers, fetchDriversPage]);

  // Auto-load initial drivers when component mounts or token changes
  useEffect(() => {
    if (token) {
      loadInitialDrivers();
    }
  }, [token, loadInitialDrivers]);

  const selectedTruck = useMemo(
    () => trucks.find((t) => String(t.id) === String(truckId)),
    [trucks, truckId]
  );

  const isReefer = (selectedTruck?.type || truckType || "")
    .toLowerCase()
    .includes("reefer");

  // Check if there are more pages to load
  const hasMoreDrivers = paginationInfo.next !== null &&
    paginationInfo.currentPage < paginationInfo.totalPages;

  if (isEditing) {
    const readonlyFieldSx = {
      "& .MuiOutlinedInput-root": outlinedSx(theme),
      "& .MuiOutlinedInput-input": {
        height: INPUT_HEIGHT,
        padding: "0 14px",
        display: "flex",
        alignItems: "center",
      },
    };

    const readOnlyLabel = (text: string) => (
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 900,
          color: theme.currentPalette.primary,
          mb: 1,
        }}
      >
        {text}{" "}
        <Box
          component="span"
          sx={{ color: alpha(theme.currentPalette.text, 0.55), fontWeight: 800 }}
        >
          ✓ Assigned
        </Box>
      </Typography>
    );

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2.5,
          }}
        >
          <Box>
            {readOnlyLabel("Driver")}
            <TextField
              fullWidth
              value={editingLoad?.driverId?.name || "No driver assigned"}
              inputProps={{ readOnly: true }}
              sx={readonlyFieldSx}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={iconPillSx(theme)}>
                        <User size={16} />
                      </Box>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IoCheckmark className="h-5 w-5 text-green-600" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Box>
            {readOnlyLabel("Truck")}
            <TextField
              fullWidth
              value={
                editingLoad?.truckId
                  ? `${editingLoad.truckId.model} (${editingLoad.truckId.plateNumber})`
                  : "No truck assigned"
              }
              inputProps={{ readOnly: true }}
              sx={readonlyFieldSx}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={iconPillSx(theme)}>
                        <TruckIcon size={16} />
                      </Box>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IoCheckmark className="h-5 w-5 text-green-600" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Box>
            {readOnlyLabel("Truck Type")}
            <TextField
              fullWidth
              value={
                editingLoad?.truckType
                  ? editingLoad.truckType.charAt(0).toUpperCase() +
                  editingLoad.truckType.slice(1)
                  : "No type assigned"
              }
              inputProps={{ readOnly: true }}
              sx={readonlyFieldSx}
            />
          </Box>

          <Box>
            {readOnlyLabel("Required Temperature (°F)")}
            <TextField
              fullWidth
              value={editingLoad?.truckTemp ? `${editingLoad.truckTemp}` : "-"}
              inputProps={{ readOnly: true }}
              sx={readonlyFieldSx}
            />
          </Box>
        </Box>

        <Alert
          severity="info"
          sx={{
            borderRadius: 2,
            border: `1px solid ${alpha(theme.currentPalette.primary, 0.18)}`,
          }}
        >
          <Typography sx={{ mb: 0.5 }}>
            Driver & Truck Information
          </Typography>
          <Typography sx={{ fontSize: 13 }}>
            Driver and truck assignments cannot be modified for existing loads.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <LabeledSelect
        theme={theme}
        label="Driver"
        required
        value={driverId}
        mb={2}
        onOpen={() => {
          // Load drivers when dropdown opens if empty
          if (driversState.driverList.length === 0) {
            loadInitialDrivers();
          }
          // Optional: refresh trucks when opening driver select
          truckRefetch();
        }}
        onChange={onDriverIdChange}
        placeholder="Select Driver"
        startIcon={<User size={16} />}
        onMenuScroll={handleMenuScroll}
        isLoading={isLoadingDrivers}
        hasMore={hasMoreDrivers}
        loadingText="Loading more drivers..."
        noMoreText="No more drivers available"
      >
        {driversState.driverList.map((d) => (
          <MenuItem key={d.id} value={String(d.id)}>
            {d.name} ({d.driverId})
          </MenuItem>
        ))}
      </LabeledSelect>

      <LabeledSelect
        theme={theme}
        label="Truck Type"
        required
        value={truckType}
        mb={2}
        onChange={(v) => onTruckTypeChange(v as TTruckType)}
        placeholder="Select type"
        startIcon={<Snowflake size={16} />}
      >
        <MenuItem value="reefer">Reefer</MenuItem>
        <MenuItem value="van">Van</MenuItem>
      </LabeledSelect>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
        <LabeledSelect
          theme={theme}
          label="Truck"
          required
          value={truckId}
          disabled={!truckType}
          onChange={onTruckIdChange}
          placeholder="Select Truck"
          startIcon={<TruckIcon size={16} />}
        >
          {trucks
            .filter((t) => !truckType || t.type === truckType)
            .map((t) => (
              <MenuItem key={t.id} value={String(t.id)}>
                {t.model} ({t.plateNumber})
              </MenuItem>
            ))}
        </LabeledSelect>

        <Typography sx={helperSx(theme)}>
          Select from dropdown or type your own
        </Typography>
      </Box>

      {/* Temperature */}
      <Box sx={{ mt: 1 }}>
        <FormControl
          fullWidth
          variant="outlined"
          sx={{
            "& .MuiFormLabel-asterisk": { display: "none" },
          }}
        >
          <InputLabel shrink id="temp-label" sx={labelFloatingSx(theme)}>
            Required Temperature (°F)<span style={{ color: "#d32f2f" }}> *</span>
          </InputLabel>

          <OutlinedInput
            id="temp"
            label="Required Temperature (°F)"
            type="number"
            value={truckTemp}
            onChange={(e) => onTruckTempChange(e.target.value)}
            placeholder="-10"
            startAdornment={
              <InputAdornment position="start">
                <Box sx={iconPillSx(theme)}>
                  <Thermometer size={16} />
                </Box>
              </InputAdornment>
            }
            sx={outlinedSx(theme)}
          />
        </FormControl>

        {!isReefer && truckType && (
          <Typography sx={{ ...helperSx(theme), mt: 0.5 }}>
            Temperature is usually required for Reefer trucks, but you can still set it.
          </Typography>
        )}
      </Box>
    </Box >
  );
};

export default AssignmentTab;