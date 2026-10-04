/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  useState,
  useEffect,
  lazy,
  Suspense,
  useCallback,
  useMemo,
} from "react";
import toast from "react-hot-toast";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  InputAdornment,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Tooltip,
  IconButton,
  Fade,
  alpha,
  useTheme,
  useMediaQuery,
  Popover,
  MenuItem,
  Table as MuiTable,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableBody,
} from "@mui/material";
import { Check, Route as RouteIcon } from "@mui/icons-material";
import LocationAutocomplete, {
  TPlace,
} from "@/components/sections/LocationAutocomplete";
import {
  calculateDhoToOriginDistance,
  calculateFullRouteDistance,
} from "@/utils/googleDistanceCalculator";
import {
  RootState,
  useAppDispatch,
  useAppSelector,
} from "@/redux/store";

import {
  addRateCalculation,
  removeRateCalculation,
} from "@/redux/slices/rateCalculationSlice";
import {
  DollarSign,
  LandPlot,
  MapPinMinus,
  MapPinPlus,
  PackageX,
  Copy,
  RefreshCcw,
  MapPinHouse,
  MapPinCheck,
  MapPinned,
  Send,
  Trash2,
  Truck,
  Navigation,
} from "lucide-react";
import {
  useAddMessageMutation,
  useCreateOrGetConversationMutation,
  useGetTrucksQuery,
  useLazyGetTruckPreviewQuery,
} from "@/redux/slices/apiSlice";
import { UserChat } from "../chat/UserChats";
import { socketService } from "@/services/socketService";
import { useChatSocket } from "@/hook/chatSys/useChatSocket";

// Lazy load the map components
const LazyGoogleMapsLoader = lazy(
  () => import("@/components/ui/GoogleMapsLoader"),
);
const LazyMapWithRoute = lazy(() => import("@/components/ui/MapWithRoute"));

const useRouteCalculations = (
  dho: TPlace | null,
  origin: TPlace | null,
  destinations: (TPlace | null)[],
) => {
  const [dhoToOriginDistance, setDhoToOriginDistance] = useState<number | null>(
    null,
  );
  const [dhoToOriginTime, setDhoToOriginTime] = useState<number | null>(null);
  const [totalDistance, setTotalDistance] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState<number | null>(null);

  const calculateDhoToOrigin = useCallback(async () => {
    if (!dho || !origin) {
      setDhoToOriginDistance(null);
      setDhoToOriginTime(null);
      return;
    }

    try {
      const result = await calculateDhoToOriginDistance(
        { lat: parseFloat(dho.lat), lng: parseFloat(dho.lon) },
        { lat: parseFloat(origin.lat), lng: parseFloat(origin.lon) },
      );
      setDhoToOriginDistance(result.distance);
      setDhoToOriginTime(result.duration);
    } catch (error) {
      console.error("Error calculating DHO to Origin distance:", error);
      setDhoToOriginDistance(null);
      setDhoToOriginTime(null);
      toast.error("Failed to calculate distance");
    }
  }, [dho, origin]);

  const calculateTotalRoute = useCallback(async () => {
    const validDestinations = destinations.filter(
      (dest): dest is TPlace => dest !== null,
    );

    if (
      (dho && origin && validDestinations.length > 0) ||
      (origin && validDestinations.length > 0)
    ) {
      try {
        const destinationsCoords = validDestinations.map((dest) => ({
          lat: parseFloat(dest.lat),
          lng: parseFloat(dest.lon),
        }));

        const result = await calculateFullRouteDistance(
          dho ? { lat: parseFloat(dho.lat), lng: parseFloat(dho.lon) } : null,
          origin
            ? { lat: parseFloat(origin.lat), lng: parseFloat(origin.lon) }
            : null,
          destinationsCoords,
        );

        setTotalDistance(result.distance);
        setTotalTime(result.duration);
      } catch (error) {
        console.error("Error calculating total distance:", error);
        setTotalDistance(null);
        setTotalTime(null);
        toast.error("Failed to calculate total route distance");
      }
    } else {
      setTotalDistance(null);
      setTotalTime(null);
    }
  }, [dho, origin, destinations]);

  useEffect(() => {
    calculateDhoToOrigin();
  }, [calculateDhoToOrigin]);

  useEffect(() => {
    calculateTotalRoute();
  }, [calculateTotalRoute]);

  return {
    dhoToOriginDistance,
    dhoToOriginTime,
    totalDistance,
    totalTime,
  };
};

const useRateCalculation = (
  dhoToOriginDistance: number | null,
  totalDistance: number | null,
) => {
  const [dh, setDh] = useState<number | "">("");
  const [loadMiles, setLoadMiles] = useState<number | "">("");
  const [rate, setRate] = useState<number | "">("");
  const [calc, setCalc] = useState<number | "">("");

  useEffect(() => {
    if (dhoToOriginDistance !== null) {
      setDh(Number(dhoToOriginDistance.toFixed(1)));
    } else {
      setDh("");
    }
  }, [dhoToOriginDistance]);

  useEffect(() => {
    if (totalDistance === null) {
      setLoadMiles("");
      return;
    }
    if (dhoToOriginDistance === null) {
      setLoadMiles(Number(totalDistance.toFixed(1)));
      return;
    }

    const load = totalDistance - dhoToOriginDistance;

    setLoadMiles(Number(Math.max(0, load).toFixed(1)));
  }, [totalDistance, dhoToOriginDistance]);

  useEffect(() => {
    const dhNum = Number(dh);
    const loadMilesNum = Number(loadMiles);
    const rateNum = Number(rate);

    if (dh === "" || loadMiles === "" || rate === "") return;
    if (isNaN(dhNum) || isNaN(loadMilesNum) || isNaN(rateNum)) return;
    const denom = loadMilesNum + dhNum;
    if (denom === 0) return;

    const result = rateNum / denom;
    setCalc(Number(result.toFixed(3)));
  }, [dh, loadMiles, rate]);

  const clearCalculation = useCallback(() => {
    setDh("");
    setLoadMiles("");
    setRate("");
    setCalc("");
  }, []);

  return {
    dh,
    setDh,
    loadMiles,
    setLoadMiles,
    rate,
    setRate,
    calc,
    clearCalculation,
  };
};

const formatTime = (hours: number): string => {
  const totalMinutes = hours * 60;
  const hoursPart = Math.floor(totalMinutes / 60);
  const minutesPart = Math.round(totalMinutes % 60);

  if (hoursPart === 0) return `${minutesPart} minutes`;
  if (minutesPart === 0) return `${hoursPart} hours`;
  return `${hoursPart}h ${minutesPart}m`;
};

const formatRouteStop = (stop: string): string => {
  const parts = stop.split(",").map((part) => part.trim());
  if (parts.length < 3) return stop;

  const hasCountry = /^(USA|United States(?: of America)?)$/i.test(
    parts[parts.length - 1],
  );
  const cityIndex = hasCountry ? parts.length - 3 : parts.length - 2;
  const regionIndex = cityIndex + 1;
  const region = parts[regionIndex].replace(/\s+\d[\w-]*.*$/, "").trim();

  return `${parts[cityIndex]}, ${region}`;
};

const MapFallback = () => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: 500,
      bgcolor: "grey.50",
      borderRadius: 2,
      border: "1px solid",
      borderColor: "divider",
    }}
  >
    <Stack spacing={2} alignItems="center">
      <CircularProgress size={32} />
      <Typography variant="body2" color="text.secondary">
        Loading Maps...
      </Typography>
    </Stack>
  </Box>
);

const MetricBox = ({
  title,
  icon,
  value,
  sub,
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  sub?: string;
}) => {
  const theme = useAppSelector((state: RootState) => state.palette);
  const primary = theme.currentPalette.primary;

  return (
    <Box
      sx={{
        border: "3px solid",
        borderColor: alpha(primary, 0.35),
        borderRadius: 2,
        p: 2,
        minHeight: 130,
        bgcolor: theme.currentPalette.background || "#fff",
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              color: primary,
              display: "flex",
              alignItems: "center",
              "& svg": { width: 22, height: 22 },
            }}
          >
            {icon}
          </Box>

          <Typography
            sx={{ fontSize: 15, fontWeight: 600, color: "text.secondary" }}
          >
            {title}
          </Typography>
        </Stack>

        <Typography
          sx={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: primary }}
        >
          {value}
        </Typography>

        {sub ? (
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 600,
              color: alpha("#0F172A", 0.55),
            }}
          >
            {sub}
          </Typography>
        ) : (
          <Typography sx={{ fontSize: 16, color: "transparent" }}>.</Typography>
        )}
      </Stack>
    </Box>
  );
};


const CalculationPage = () => {
  const theme = useAppSelector((state: RootState) => state.palette);
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const [addMessage, { isLoading: isSendingMessage }] = useAddMessageMutation();

  const [dho, setDho] = useState<TPlace | null>(null);
  const [origin, setOrigin] = useState<TPlace | null>(null);
  const [destinations, setDestinations] = useState<(TPlace | null)[]>([null]);
  const [resetKey, setResetKey] = useState(0);

  const [shareSearch, setShareSearch] = useState("");

  const [notes, setNotes] = useState("");

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const { isSocketReady } = useChatSocket();
  const dispatch = useAppDispatch();

  const rateCalculationRows = useAppSelector(
    (state: RootState) =>
      state.rateCalculation.rows,
  );

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const getFridayToThursdayPeriod = () => {
    const today = new Date();

    // JS:
    // Sunday = 0
    // Monday = 1
    // ...
    // Friday = 5
    // Saturday = 6

    const currentDay = today.getDay();

    // Number of days since the most recent Friday
    const daysSinceFriday = (currentDay - 5 + 7) % 7;

    const friday = new Date(today);
    friday.setHours(0, 0, 0, 0);
    friday.setDate(today.getDate() - daysSinceFriday);

    const thursday = new Date(friday);
    thursday.setDate(friday.getDate() + 6);

    return {
      from: formatDate(friday),
      to: formatDate(thursday),
    };
  };
  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };
  const [createOrGetConversation, { isLoading: isCreatingConversation }] =
    useCreateOrGetConversationMutation();
  const [shareAnchorEl, setShareAnchorEl] =
    useState<HTMLElement | null>(null);

  const openShare = (event: React.MouseEvent<HTMLElement>) => {
    setShareAnchorEl(event.currentTarget);
  };

  const closeShare = () => {
    setShareAnchorEl(null);
    setShareSearch("");
    setSelectedUserIds([]);
  };

  const shareOpen = Boolean(shareAnchorEl);

  const { dhoToOriginDistance, dhoToOriginTime, totalDistance, totalTime } =
    useRouteCalculations(dho, origin, destinations);

  const {
    dh,
    setDh,
    loadMiles,
    setLoadMiles,
    rate,
    setRate,
    calc,
    clearCalculation,
  } = useRateCalculation(dhoToOriginDistance, totalDistance);

  const handleAddDestination = useCallback(() => {
    setDestinations((prev) => [...prev, null]);
  }, []);

  const handleUpdateDestination = useCallback(
    (index: number, place: TPlace | null) => {
      setDestinations((prev) => {
        const next = [...prev];
        next[index] = place;
        return next;
      });
    },
    [],
  );

  const handleRemoveDestination = useCallback((index: number) => {
    setDestinations((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
    );
  }, []);

  const clearAllRoutes = useCallback(() => {
    setDho(null);
    setOrigin(null);
    setDestinations([null]);
  }, []);

  const { data: trucksData, isLoading: isLoadingTrucks } =
    useGetTrucksQuery(undefined);

  const [
    getTruckPreview,
    { isLoading: isSavingPreview },
  ] = useLazyGetTruckPreviewQuery();

  const [selectedTruckId, setSelectedTruckId] = useState("");
  // const [fromDate, setFromDate] = useState("");
  // const [toDate, setToDate] = useState("");
  const [truckPreview, setTruckPreview] = useState<any>(null);

  const visibleRateCalculationRows = useMemo(
    () =>
      selectedTruckId
        ? rateCalculationRows.filter(
          (row) => String(row.truckId) === String(selectedTruckId),
        )
        : rateCalculationRows,
    [rateCalculationRows, selectedTruckId],
  );

  const clearRateInputs = useCallback(() => {
    setDho(null);
    setOrigin(null);
    setDestinations([null]);
    setNotes("");
    clearCalculation();
    setResetKey((prev) => prev + 1);
  }, [clearCalculation]);

  const handleGetTruckPreview = async (
    truckId: string,
    inputs = { dh, loadMiles, rate, calc, dho, origin, destinations },
  ) => {
    if (!truckId) {
      setTruckPreview(null);
      return;
    }

    // if (
    //   !hasNum(dh) ||
    //   !hasNum(loadMiles) ||
    //   !hasNum(rate)
    // ) {
    //   toast.error(
    //     "Please fill Dead Head Miles, Load Miles and Rate first",
    //   );

    //   setTruckPreview(null);
    //   return;
    // }

    // if (calc === "") {
    //   toast.error("Price Per Mile is required");

    //   setTruckPreview(null);
    //   return;
    // }

    try {
      const { from, to } =
        getFridayToThursdayPeriod();

      const response = await getTruckPreview({
        truckId,

        distanceMiles:
          Number(inputs.dh) + Number(inputs.loadMiles),

        pricePerMile: Number(inputs.calc),

        totalPrice: Number(inputs.rate),

        from,
        to,
      }).unwrap();

      const preview =
        response?.data || response;

      setTruckPreview(preview);

      const selectedTruck =
        availableTrucks.find(
          (truck: any) =>
            (truck.id || truck._id) === truckId,
        );


      const validDestinations =
        inputs.destinations.filter(
          (destination): destination is TPlace =>
            destination !== null,
        );

      const routeParts: string[] = [];

      if (inputs.dho?.display_name) {
        routeParts.push(inputs.dho.display_name);
      }

      if (inputs.origin?.display_name) {
        routeParts.push(inputs.origin.display_name);
      }

      validDestinations.forEach(
        (destination) => {
          if (destination.display_name) {
            routeParts.push(
              destination.display_name,
            );
          }
        },
      );

      const route =
        routeParts.length > 0
          ? routeParts.join(" → ")
          : "—";


      dispatch(
        addRateCalculation({
          id: `${truckId}-${Date.now()}`,

          truckId,

          truckNumber:
            selectedTruck?.truckNumber ||
            preview?.truck?.truckNumber ||
            truckId,

          totalMiles: Number(dh) + Number(loadMiles),

          pricePerMile: Number(calc),

          totalPrice: Number(rate),

          totalPricePerWeek: Number(
            preview?.projected?.totalPricePerWeek ??
            preview?.projected?.totalPrice ??
            preview?.projected?.averagePerMile ??
            0,
          ),

          pricePerMilePerWeek: Number(
            preview?.projected?.averagePerMile ?? 0,
          ),

          route,
        }),
      );

      clearCalculation();

      clearAllRoutes();

      setResetKey((prev) => prev + 1);

      toast.success("Rate calculation added to table");
      toast.success(
        "Rate calculation added to table",
      );
    } catch (error) {
      // console.error(
      //   "Truck preview error:",
      //   error,
      // );

      setTruckPreview(null);

      // toast.error(
      //   "Failed to load truck preview",
      // );
    }
  };

  const availableTrucks = useMemo(() => {
    if (Array.isArray(trucksData)) {
      return trucksData;
    }

    if (Array.isArray(trucksData?.data)) {
      return trucksData.data;
    }

    if (Array.isArray(trucksData?.data?.trucks)) {
      return trucksData.data.trucks;
    }

    if (Array.isArray(trucksData?.trucks)) {
      return trucksData.trucks;
    }

    return [];
  }, [trucksData]);

  const validDestinationsCount = useMemo(
    () => destinations.filter((dest) => dest !== null).length,
    [destinations],
  );

  const hasNum = (v: number | "" | null | undefined) =>
    v !== "" && v !== null && v !== undefined && !Number.isNaN(Number(v));

  const getMissingRateFields = () => {
    const missing: string[] = [];
    if (!hasNum(dh)) missing.push("Dead Head Miles");
    if (!hasNum(loadMiles)) missing.push("Load Miles");
    if (!hasNum(rate)) missing.push("Rate");
    if (!hasNum(calc)) missing.push("Price Per Mile");
    return missing;
  };

  const getMissingRouteFields = () => {
    const missing: string[] = [];
    if (!dho) missing.push("DHO (Driver Home Origin)");
    if (!origin) missing.push("Pick Up (Origin)");
    const validDests = destinations.filter((d): d is TPlace => !!d);
    if (validDests.length === 0) missing.push("At least one Destination");

    if (!hasNum(dhoToOriginDistance)) missing.push("DHO to Origin Miles");
    if (!hasNum(totalDistance)) missing.push("Total Route Miles");
    return missing;
  };

  const buildShareMessage = useCallback(() => {
    const missingRate = getMissingRateFields();
    const missingRoute = getMissingRouteFields();

    const rateOk = missingRate.length === 0;
    const routeOk = missingRoute.length === 0;

    if (!rateOk && !routeOk) return null;

    const parts: string[] = [];

    if (rateOk) {
      parts.push(
        `Rate Calculation`,
        `• Dead Head Miles: ${dh}`,
        `• Load Miles: ${loadMiles}`,
        `• Rate ($): $${rate}`,
        `• Price Per Mile: $${calc}`,
        `• Total Route: $${totalDistance}`,
        ``,
        `Calculation: $${rate} / (${loadMiles} + ${dh}) = $${calc} per mile`,
        ``,
      );
    }

    if (routeOk) {
      const validDests = destinations.filter((d): d is TPlace => !!d);
      parts.push(
        `Route Planning`,
        `• DHO: ${dho!.display_name}`,
        `• Pick Up (Origin): ${origin!.display_name}`,
        ``,
        `• DHO to Origin: ${Number(dhoToOriginDistance).toFixed(1)} miles${dhoToOriginTime ? ` • ${formatTime(dhoToOriginTime)}` : ""
        }`,
        `• Total Route: ${Number(totalDistance).toFixed(1)} miles${totalTime ? ` • ${formatTime(totalTime)}` : ""
        }`,
        ``,
        `Destinations (${validDests.length}):`,
        ...validDests.map(
          (d, i) => `- Destination ${i + 1}: ${d.display_name}`,
        ),
        ``,
        `Notes: ${notes?.trim() ? notes.trim() : "—"}`,
      );
    }

    return parts.join("\n");
  }, [
    dh,
    loadMiles,
    rate,
    calc,
    destinations,
    dho,
    origin,
    dhoToOriginDistance,
    dhoToOriginTime,
    totalDistance,
    totalTime,
    notes,
  ]);

  const copyGlobalFields = useCallback(async () => {
    const text = buildShareMessage();
    if (!text) {
      toast.error("Please complete Route Planning or Rate Calculation first");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied!");
    } catch {
      toast.error("Failed to copy");
    }
  }, [buildShareMessage]);

  const sendChatMessage = async (conversationId: string, text: string) => {
    const clean = text.trim();
    if (!clean) return;

    if (isSocketReady) {
      socketService.sendMessage(conversationId, clean);
      return;
    }

    await addMessage({ conversationId, text: clean }).unwrap();
  };

  const handleShare = useCallback(async () => {
    if (selectedUserIds.length === 0) {
      toast.error("Select at least one user");
      return;
    }

    const text = buildShareMessage();
    if (!text) {
      toast.error("Nothing to share, please fill calculations first");
      return;
    }

    try {
      for (const userId of selectedUserIds) {
        const conversation = await createOrGetConversation({ userId }).unwrap();

        await sendChatMessage(conversation.id, text);
      }

      toast.success("Sent successfully!");
      closeShare();
    } catch (e) {
      console.error(e);
      toast.error("Failed to send message");
    }
  }, [
    selectedUserIds,
    buildShareMessage,
    createOrGetConversation,
    addMessage,
    isSocketReady,
  ]);

  const resetAllBtn = useCallback(() => {
    clearRateInputs();
    toast.success("All inputs reset successfully");
  }, [clearRateInputs]);

  const handleMapLocationChange = useCallback(
    (
      type: "dho" | "origin" | "destination",
      place: TPlace | null,
      index?: number,
    ) => {
      if (type === "dho") setDho(place);
      if (type === "origin") setOrigin(place);
      if (type === "destination" && index !== undefined)
        handleUpdateDestination(index, place);
    },
    [],
  );

  const borderBlue = alpha(theme.currentPalette.primary, 0.35);

  const iconBtnSx = (theme: any) => ({
    width: 36,
    height: 36,
    borderRadius: "10px",
    border: "1px solid",
    borderColor: alpha(theme.currentPalette.primary, 0.25),
    backgroundColor: "#fff",
    color: theme.currentPalette.primary,
    boxShadow: "0 1px 2px rgba(16,24,40,0.06)",
    transition: "all 150ms ease",
    "&:hover": {
      backgroundColor: alpha(theme.currentPalette.primary, 0.06),
      borderColor: alpha(theme.currentPalette.primary, 0.45),
      boxShadow: "0 4px 12px rgba(16,24,40,0.12)",
    },
    "&:active": {
      transform: "translateY(1px)",
      boxShadow: "0 1px 2px rgba(16,24,40,0.06)",
    },
    "&.Mui-disabled": {
      backgroundColor: "#fff",
      borderColor: "divider",
      color: alpha("#0F172A", 0.35),
    },
    "& svg": { width: 18, height: 18, strokeWidth: 2 },
  });

  return (
    <>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Stack
          direction="row"
          justifyContent="flex-end"
          gap={1}
          marginBottom={2}
        >
          <Tooltip title="Send Message">
            <span>
              <IconButton sx={iconBtnSx(theme)} onClick={openShare}>
                <Send />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Copy all fields">
            <span>
              <IconButton sx={iconBtnSx(theme)} onClick={copyGlobalFields}>
                <Copy />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Reset All">
            <span>
              <IconButton sx={iconBtnSx(theme)} onClick={resetAllBtn}>
                <RefreshCcw />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Stack spacing={3}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: borderBlue,
                  bgcolor: "#fff",
                  p: 2.25,
                  "& .MuiInputLabel-root": {
                    fontSize: 13,
                  },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: theme.currentPalette.primary,
                  }}
                >
                  Route Planning
                </Typography>

                {/* ROUTE METRICS */}
                <Grid container spacing={1.5} sx={{ mt: 2 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <MetricBox
                      title="DHO to Origin"
                      icon={<RouteIcon fontSize="small" />}
                      value={
                        dhoToOriginDistance
                          ? `${dhoToOriginDistance.toFixed(1)} miles`
                          : "—"
                      }
                      sub={
                        dhoToOriginTime
                          ? formatTime(dhoToOriginTime)
                          : ""
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <MetricBox
                      title="Total Route"
                      icon={<Truck size={18} />}
                      value={
                        totalDistance
                          ? `${totalDistance.toFixed(1)} miles`
                          : "—"
                      }
                      sub={
                        totalTime
                          ? formatTime(totalTime)
                          : validDestinationsCount
                            ? `${validDestinationsCount} stops`
                            : ""
                      }
                    />
                  </Grid>
                </Grid>

                <Stack spacing={2} sx={{ mt: 2 }}>
                  {/* DHO */}
                  <LocationAutocomplete
                    key={`dho-${resetKey}`}
                    label="DHO(Driver Home Origin)"
                    value={dho}
                    required
                    setValue={setDho}
                    placeholder="e.g. FixIt Auto Center"
                    showZipCode={true}
                    startAdornment={
                      <MapPinHouse
                        size={18}
                        color={theme.currentPalette.primary}
                      />
                    }
                  />

                  {/* ORIGIN */}
                  <LocationAutocomplete
                    key={`origin-${resetKey}`}
                    label="Pick Up (Origin)"
                    value={origin}
                    setValue={setOrigin}
                    required
                    placeholder="e.g. FixIt Auto Center"
                    showZipCode={true}
                    startAdornment={
                      <MapPinCheck
                        size={18}
                        color={theme.currentPalette.primary}
                      />
                    }
                  />

                  {/* DESTINATIONS HEADER */}
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography
                      sx={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: theme.currentPalette.primary,
                      }}
                    >
                      Destinations
                    </Typography>

                    <div className="flex gap-2">
                      <Tooltip title="Clear all routes">
                        <span>
                          <IconButton
                            sx={iconBtnSx(theme)}
                            onClick={clearAllRoutes}
                            size="small"
                          >
                            <MapPinMinus />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title="Add destination">
                        <span>
                          <IconButton
                            sx={iconBtnSx(theme)}
                            onClick={handleAddDestination}
                            size="small"
                          >
                            <MapPinPlus />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </div>
                  </Stack>

                  {/* DESTINATION INPUTS */}
                  {destinations.map((destination, index) => (
                    <Stack
                      key={`dest-${index}-${resetKey}`}
                      direction="row"
                      spacing={1}
                      alignItems="flex-end"
                    >
                      <Box sx={{ flex: 1 }}>
                        <LocationAutocomplete
                          label={`Destination ${index + 1}`}
                          value={destination}
                          required
                          setValue={(place) =>
                            handleUpdateDestination(index, place)
                          }
                          placeholder="e.g. FixIt Auto Center"
                          showZipCode={true}
                          startAdornment={
                            <MapPinned
                              size={18}
                              color={theme.currentPalette.primary}
                            />
                          }
                        />
                      </Box>

                      {destinations.length > 1 && (
                        <Tooltip title="Remove destination">
                          <IconButton
                            onClick={() =>
                              handleRemoveDestination(index)
                            }
                            size="small"
                            sx={{ mb: 0.5 }}
                          >
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <Trash2 size={18} color="red" />
                            </span>
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  ))}

                  {/* LOAD DETAILS */}
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: theme.currentPalette.primary,
                      }}
                    >
                      Load Details
                    </Typography>

                    <TextField
                      sx={{ mt: 1.25 }}
                      label="Notes"
                      placeholder="Add any additional information here..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      fullWidth
                      multiline
                      minRows={4}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </Stack>
              </Paper>

              {/* ================= RATE CALCULATION ================= */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: borderBlue,
                  bgcolor: "#fff",
                  p: 2.25,

                  "& .MuiInputLabel-root": {
                    fontSize: 13,
                  },

                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              >
                {/* ================= HEADER ================= */}
                <Typography
                  sx={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: theme.currentPalette.primary,
                  }}
                >
                  Rate Calculation
                </Typography>

                <Typography
                  sx={{
                    mt: 0.5,
                    fontSize: 12,
                    color: "text.secondary",
                  }}
                >
                  Price Per Mile = Rate / ( Dead Head Miles + Load Miles )
                </Typography>

                {/* ================= RATE FIELDS ================= */}
                <Grid container spacing={1.5} sx={{ mt: 2 }}>
                  {/* DEAD HEAD MILES */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      label="Dead Head Miles"
                      placeholder="0.00"
                      value={dh}
                      type="number"
                      sx={{
                        "& .MuiFormLabel-asterisk": {
                          color: "red",
                        },
                      }}
                      onChange={(e) => {
                        setDh(
                          e.target.value
                            ? Number(e.target.value)
                            : "",
                        );

                        setTruckPreview(null);
                      }}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <PackageX size={18} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>

                  {/* LOAD MILES */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      label="Load Miles"
                      placeholder="0.00"
                      value={loadMiles}
                      type="number"
                      sx={{
                        "& .MuiFormLabel-asterisk": {
                          color: "red",
                        },
                      }}
                      onChange={(e) => {
                        setLoadMiles(
                          e.target.value
                            ? Number(e.target.value)
                            : "",
                        );

                        setTruckPreview(null);
                      }}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <LandPlot size={18} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>

                  {/* RATE */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      label="Rate"
                      placeholder="0.00"
                      value={rate}
                      type="number"
                      sx={{
                        "& .MuiFormLabel-asterisk": {
                          color: "red",
                        },
                      }}
                      onChange={(e) => {
                        setRate(
                          e.target.value
                            ? Number(e.target.value)
                            : "",
                        );

                        setTruckPreview(null);
                      }}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <DollarSign size={18} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>
                </Grid>

                {/* ================= CALCULATION RESULT ================= */}
                {calc !== "" && (
                  <Fade in>
                    <Alert
                      severity="success"
                      sx={{
                        mt: 2,
                        width: "100%",
                      }}
                      icon={<Check />}
                    >
                      <Typography variant="body2">
                        Calculation: ${rate} / ({loadMiles} + {dh} miles) ={" "}
                        <strong>
                          ${Number(calc).toFixed(2)} per mile
                        </strong>
                      </Typography>
                    </Alert>
                  </Fade>
                )}

                <Divider sx={{ my: 3 }} />

                <Box>
                  <Typography
                    sx={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: theme.currentPalette.primary,
                    }}
                  >
                    Available Trucks
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,
                      fontSize: 12,
                      color: "text.secondary",
                    }}
                  >
                    Select an available truck to calculate the truck preview
                  </Typography>

                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {/* TRUCK SELECT */}
                    <TextField
                      select
                      fullWidth
                      required
                      label="Available Truck"
                      value={selectedTruckId}
                      disabled={isLoadingTrucks || isSavingPreview}
                      onChange={async (e) => {
                        const truckId = e.target.value;
                        const inputs = {
                          dh,
                          loadMiles,
                          rate,
                          calc,
                          dho,
                          origin,
                          destinations,
                        };

                        setSelectedTruckId(truckId);
                        setTruckPreview(null);
                        clearRateInputs();

                        await handleGetTruckPreview(truckId, inputs);
                      }}
                      sx={{
                        "& .MuiFormLabel-asterisk": {
                          color: "red",
                        },
                      }}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Truck size={18} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    >
                      {isLoadingTrucks && (
                        <MenuItem disabled>
                          Loading trucks...
                        </MenuItem>
                      )}

                      {!isLoadingTrucks &&
                        availableTrucks.length === 0 && (
                          <MenuItem disabled>
                            No available trucks
                          </MenuItem>
                        )}

                      {availableTrucks.map((truck: any) => {
                        const id = truck.id || truck._id;

                        return (
                          <MenuItem
                            key={id}
                            value={id}
                          >
                            Truck ({truck.truckNumber})
                          </MenuItem>
                        );
                      })}
                    </TextField>

                    {isSavingPreview && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                          py: 1,
                        }}
                      >
                        <CircularProgress size={18} />

                        <Typography
                          sx={{
                            fontSize: 13,
                            color: "text.secondary",
                          }}
                        >
                          Loading truck preview...
                        </Typography>
                      </Box>
                    )}
                    <Box
                      sx={{
                        width: "100%",
                        px: 2.5,
                        py: 2,
                        borderRadius: 2,

                        bgcolor: alpha(
                          theme.currentPalette.primary,
                          0.06,
                        ),

                        border: "1px solid",

                        borderColor: alpha(
                          theme.currentPalette.primary,
                          0.25,
                        ),
                      }}
                    >
                      <Grid
                        container
                        spacing={2}
                        alignItems="flex-start"
                      >
                        <Grid size={{ xs: 6 }}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-start",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 14,
                                fontWeight: 700,
                                color:
                                  theme.currentPalette.primary,
                              }}
                            >
                              Price Per Mile Per Week
                            </Typography>

                            <Typography
                              sx={{
                                mt: 0.75,
                                fontSize: 20,
                                fontWeight: 800,
                                lineHeight: 1.2,
                                color:
                                  theme.currentPalette.primary,
                              }}
                            >
                              {truckPreview?.projected
                                ?.averagePerMile != null
                                ? `$${Number(
                                  truckPreview.projected
                                    .averagePerMile,
                                ).toFixed(2)}`
                                : "$0.00"}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid size={{ xs: 6 }}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              textAlign: "right",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 14,
                                fontWeight: 700,
                                color:
                                  theme.currentPalette.primary,
                              }}
                            >
                              Price Per Mile
                            </Typography>

                            <Typography
                              sx={{
                                mt: 0.75,
                                fontSize: 20,
                                fontWeight: 800,
                                lineHeight: 1.2,
                                color:
                                  theme.currentPalette.primary,
                              }}
                            >
                              {calc !== ""
                                ? `$${Number(calc).toFixed(2)}`
                                : "$0.00"}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Stack>
                </Box>
              </Paper>

            </Stack>
          </Grid>

          <Grid
            size={{ xs: 12, lg: 6 }}
            sx={{
              minWidth: 0,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2.25,
                borderRadius: 2,
                border: "1px solid",
                borderColor: borderBlue,
                bgcolor: "#fff",
                width: "100%",
                minWidth: 0,
                overflow: "hidden",

                height: {
                  xs: 450,
                  md: 520,
                  lg: 650,
                },
              }}
            >
              {/* MAP HEADER */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  mb: 2,
                  minWidth: 0,
                  gap: 1,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: theme.currentPalette.primary,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  Route Map
                </Typography>

                <Chip
                  label={`${validDestinationsCount} Stops`}
                  variant="outlined"
                  sx={{
                    flexShrink: 0,
                    color: theme.currentPalette.primary,
                    backgroundColor: alpha(
                      theme.currentPalette.primary,
                      0.02,
                    ),
                    maxWidth: 140,
                    "& .MuiChip-label": {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                  }}
                />
              </Stack>

              {/* MAP */}
              <Box
                sx={{
                  width: "100%",
                  height: "calc(100% - 48px)",
                  minHeight: 0,
                  overflow: "hidden",
                  borderRadius: 2,
                }}
              >
                <Suspense fallback={<MapFallback />}>
                  <LazyGoogleMapsLoader>
                    <LazyMapWithRoute
                      dho={dho}
                      origin={origin}
                      destinations={destinations}
                      height="100%"
                      onLocationChange={handleMapLocationChange}
                    />
                  </LazyGoogleMapsLoader>
                </Suspense>
              </Box>
            </Paper>

            {selectedTruckId && visibleRateCalculationRows.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  mt: 3,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: borderBlue,
                  bgcolor: "#fff",
                  p: 2.25,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: theme.currentPalette.primary,
                  }}
                >
                  Rate History
                </Typography>

                <Typography
                  sx={{ mt: 0.5, mb: 2, fontSize: 12, color: "text.secondary" }}
                >
                  Saved rate calculations
                </Typography>

                <TableContainer
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    maxHeight: 500,
                    overflowX: "hidden",
                    width: "100%",
                  }}
                >
                  <MuiTable
                    stickyHeader
                    size="small"
                    sx={{
                      tableLayout: "fixed",
                      width: "100%",
                      "& th, & td": {
                        px: 0.5,
                        py: 1,
                        fontSize: 12,
                        verticalAlign: "middle",
                      },

                      "& th": {
                        height: 58,
                        fontWeight: 800,
                        lineHeight: 1.3,
                      },
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            width: "36%",
                            fontWeight: 800,
                          }}
                        >
                          Route
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{
                            width: "12%",
                            fontWeight: 800,
                          }}
                        >
                          Total
                          <br />
                          Miles
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{
                            width: "11%",
                            fontWeight: 800,
                          }}
                        >
                          Price
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{
                            width: "14%",
                            fontWeight: 800,
                          }}
                        >
                          Total
                          <br />
                          Price
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{
                            width: "18%",
                            fontWeight: 800,
                          }}
                        >
                          Total Price
                          <br />
                          / Week
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{
                            width: "9%",
                            fontWeight: 800,
                            px: 0.25,
                          }}
                        >
                          Action
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {visibleRateCalculationRows.map((row) => (
                        <TableRow key={row.id} hover>
                          {/* ROUTE */}
                          <TableCell
                            sx={{
                              overflowWrap: "anywhere",
                              pl: 1.5,
                            }}
                          >
                            <Stack spacing={0.6}>
                              {row.route
                                .split(/\s*→\s*/)
                                .filter((stop) => stop && stop !== "—")
                                .map((stop, index, stops) => {
                                  const StopIcon =
                                    index === 0
                                      ? MapPinHouse
                                      : index === stops.length - 1
                                        ? MapPinned
                                        : Navigation;

                                  return (
                                    <Stack
                                      key={`${index}-${stop}`}
                                      direction="row"
                                      spacing={0.7}
                                      alignItems="center"
                                      sx={{ minWidth: 0 }}
                                    >
                                      <StopIcon
                                        size={14}
                                        color={theme.currentPalette.primary}
                                        style={{ flexShrink: 0 }}
                                      />
                                      <Typography
                                        sx={{
                                          fontSize: 11,
                                          lineHeight: 1.4,
                                          minWidth: 0,
                                          overflowWrap: "anywhere",
                                          wordBreak: "break-word",
                                        }}
                                      >
                                        {formatRouteStop(stop)}
                                      </Typography>
                                    </Stack>
                                  );
                                })}

                              {(!row.route || row.route === "—") && (
                                <Typography
                                  sx={{
                                    fontSize: 11,
                                    color: "text.secondary",
                                  }}
                                >
                                  —
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>

                          {/* TOTAL MILES */}
                          <TableCell
                            align="center"
                            sx={{
                              whiteSpace: "nowrap",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {Number(row.totalMiles ?? 0).toFixed(1)}
                          </TableCell>

                          {/* PRICE */}
                          <TableCell
                            align="center"
                            sx={{
                              whiteSpace: "nowrap",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            ${Number(row.pricePerMile ?? 0).toFixed(2)}
                          </TableCell>

                          {/* TOTAL PRICE */}
                          <TableCell
                            align="center"
                            sx={{
                              whiteSpace: "nowrap",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            ${Number(row.totalPrice ?? 0).toFixed(2)}
                          </TableCell>

                          {/* TOTAL PRICE / WEEK */}
                          <TableCell
                            align="center"
                            sx={{
                              whiteSpace: "nowrap",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            $
                            {Number(
                              row.totalPricePerWeek ??
                              row.pricePerMilePerWeek ??
                              0,
                            ).toFixed(2)}
                          </TableCell>

                          {/* ACTION */}
                          <TableCell
                            align="center"
                            sx={{
                              px: 0.5,
                            }}
                          >
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  dispatch(removeRateCalculation(row.id))
                                }
                              >
                                <Trash2 size={17} color="red" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </MuiTable>

                </TableContainer>
              </Paper>
            )}
          </Grid>
        </Grid>

      </Container>

      <Popover
        open={shareOpen}
        anchorEl={shareAnchorEl}
        onClose={closeShare}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            width: isMobile ? 300 : 380,
            borderRadius: 2,
          },
        }}
      >
        <Box sx={{ p: 0 }}>
          <Box sx={{ px: 3, py: 2 }}>
            <Typography
              sx={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}
            >
              Share Calculations to chat
            </Typography>

            {selectedUserIds.length > 0 && (
              <Typography
                sx={{ mt: 0.5, fontSize: 12, color: "text.secondary" }}
              >
                Selected: {selectedUserIds.length}
              </Typography>
            )}
          </Box>

          <Divider />

          <Box sx={{ p: 3 }}>
            <TextField
              fullWidth
              value={shareSearch}
              onChange={(e) => setShareSearch(e.target.value)}
              placeholder="Search and select users .."
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "#fff",
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <span style={{ display: "flex" }}>🔍</span>
                  </InputAdornment>
                ),
              }}
            />

            <Box
              sx={{
                mt: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: alpha(theme.currentPalette.primary, 0.35),
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              <Box sx={{ maxHeight: 260, overflow: "auto" }}>
                <UserChat
                  searchQuery={shareSearch}
                  selectedUserIds={selectedUserIds}
                  onToggleUser={toggleUser}
                />
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                mt: 3,
                gap: 1,
              }}
            >
              <Button
                variant="outlined"
                onClick={closeShare}
                sx={{ borderRadius: 2, textTransform: "none" }}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                onClick={handleShare}
                disabled={isCreatingConversation || isSendingMessage}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.2,
                  fontWeight: 700,
                  bgcolor: theme.currentPalette.primary,
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: alpha(theme.currentPalette.primary, 0.9),
                  },
                }}
              >
                {isCreatingConversation || isSendingMessage
                  ? "Sharing..."
                  : "Share"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default CalculationPage;
