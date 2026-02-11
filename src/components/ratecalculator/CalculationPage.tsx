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
  Dialog,
  useTheme,
  useMediaQuery,
  Popover,
} from "@mui/material";
import { DirectionsCar, Check, Route as RouteIcon } from "@mui/icons-material";
import LocationAutocomplete, {
  TPlace,
} from "@/components/sections/LocationAutocomplete";
import {
  calculateDhoToOriginDistance,
  calculateFullRouteDistance,
} from "@/utils/googleDistanceCalculator";
import { RootState, useAppSelector } from "@/redux/store";
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
} from "lucide-react";
import { UsersList } from "@/components/chat/UsersList";
import {
  useAddMessageMutation,
  useCreateOrGetConversationMutation,
} from "@/redux/slices/apiSlice";

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
    if (dhoToOriginDistance !== null)
      setDh(Number(dhoToOriginDistance.toFixed(1)));
  }, [dhoToOriginDistance]);

  useEffect(() => {
    if (totalDistance !== null) setLoadMiles(Number(totalDistance.toFixed(1)));
  }, [totalDistance]);

  useEffect(() => {
    const dhNum = Number(dh);
    const loadMilesNum = Number(loadMiles);
    const rateNum = Number(rate);

    if (dh === "" || loadMiles === "" || rate === "") return;
    if (isNaN(dhNum) || isNaN(loadMilesNum) || isNaN(rateNum)) return;
    if (loadMilesNum + dhNum === 0) return;

    const result = rateNum / (loadMilesNum + dhNum);
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
        borderRadius: 3,
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

  const selectedConversationId = useAppSelector(
    (state: RootState) => state.chat.selectedConversationId,
  );
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
      // send to all selected users
      for (const userId of selectedUserIds) {
        const conversation = await createOrGetConversation({ userId }).unwrap();
        await addMessage({ conversationId: conversation.id, text }).unwrap();
      }

      toast.success("Sent successfully!");
      closeShare();
    } catch (e) {
      console.error(e);
      toast.error("Failed to send message");
    }
  }, [selectedUserIds, buildShareMessage, createOrGetConversation, addMessage]);

  const resetAllBtn = useCallback(() => {
    setDho(null);
    setOrigin(null);
    setDestinations([null]);
    setNotes("");
    clearCalculation();
    setResetKey((prev) => prev + 1);
    toast.success("All inputs reset successfully");
  }, [clearCalculation]);

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
          {/* LEFT */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Stack spacing={3}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: borderBlue,
                  bgcolor: "#fff",
                  p: 2.25,
                  "& .MuiInputLabel-root": { fontSize: 13 },
                  "& .MuiOutlinedInput-root": { borderRadius: 2 },
                }}
              >
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
                  sx={{ mt: 0.5, fontSize: 12, color: "text.secondary" }}
                >
                  Price Per Mile = Rate / ( Dead Head Miles + Load Miles)
                </Typography>

                <Stack sx={{ mt: 2 }}>
                  <Box
                    component="button"
                    type="button"
                    sx={{
                      width: "100%",
                      height: 56,
                      px: 2,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      bgcolor: alpha(theme.currentPalette.primary, 0.06),
                      border: "1px solid",
                      borderColor: alpha(theme.currentPalette.primary, 0.25),
                      color: theme.currentPalette.primary,
                      cursor: "default",
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{ fontSize: 14, fontWeight: 700 }}
                    >
                      Price Per Mile
                    </Typography>
                    <Typography
                      component="span"
                      sx={{ fontSize: 16, fontWeight: 800 }}
                    >
                      {calc !== "" ? `$${Number(calc).toFixed(2)}` : "$0.00"}
                    </Typography>
                  </Box>
                </Stack>

                <Grid container spacing={1.5} sx={{ mt: 2 }}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Dead Head Miles"
                      placeholder="0.00"
                      value={dh}
                      required
                      sx={{
                        "& .MuiFormLabel-asterisk": {
                          color: "red",
                        },
                      }}
                      onChange={(e) =>
                        setDh(e.target.value ? Number(e.target.value) : "")
                      }
                      type="number"
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

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Load Miles"
                      placeholder="e.g. 50"
                      value={loadMiles}
                      required
                      sx={{
                        "& .MuiFormLabel-asterisk": {
                          color: "red",
                        },
                      }}
                      onChange={(e) =>
                        setLoadMiles(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      type="number"
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

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Rate"
                      placeholder="e.g. 50"
                      value={rate}
                      onChange={(e) =>
                        setRate(e.target.value ? Number(e.target.value) : "")
                      }
                      type="number"
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

                  {calc !== "" && (
                    <Fade in={true}>
                      <Alert
                        severity="success"
                        sx={{ mt: 2, width: "100%" }}
                        icon={<Check />}
                      >
                        <Typography variant="body2">
                          Calculation: ${rate} / ({loadMiles} + {dh} miles) ={" "}
                          <strong>${calc} per mile</strong>
                        </Typography>
                      </Alert>
                    </Fade>
                  )}
                </Grid>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: borderBlue,
                  bgcolor: "#fff",
                  p: 2.25,
                  "& .MuiInputLabel-root": { fontSize: 13 },
                  "& .MuiOutlinedInput-root": { borderRadius: 2 },
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
                      sub={dhoToOriginTime ? formatTime(dhoToOriginTime) : ""}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <MetricBox
                      title="Total Route"
                      icon={<Truck fontSize="small" />}
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
                            onClick={() => handleRemoveDestination(index)}
                            size="small"
                            sx={{ mb: 0.5 }}
                          >
                            <span
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              <Trash2 size={18} color="red" />
                            </span>
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  ))}

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
            </Stack>
          </Grid>

          {/* RIGHT */}
          <Grid size={{ xs: 12, lg: 6 }} sx={{ minWidth: 0, display: "flex" }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.25,
                borderRadius: 3,
                border: "1px solid",
                borderColor: borderBlue,
                bgcolor: "#fff",

                width: "100%",
                flex: 1,
                display: "flex",
                flexDirection: "column",

                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2, minWidth: 0, gap: 1 }}
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
                    backgroundColor: alpha(theme.currentPalette.primary, 0.02),
                    maxWidth: 140,
                    "& .MuiChip-label": {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                  }}
                />
              </Stack>

              <Box sx={{ flex: 1, minHeight: 0, width: "100%" }}>
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
                <UsersList
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
