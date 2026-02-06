"use client";
import {
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
  Card,
  CardContent,
  Divider,
  Tooltip,
  IconButton,
  Fade,
  alpha,
} from "@mui/material";
import {
  AttachMoney,
  DirectionsCar,
  Speed,
  Add,
  Close,
  Check,
  Refresh,
  MyLocation,
  Route,
} from "@mui/icons-material";
import LocationAutocomplete, {
  TPlace,
} from "@/components/sections/LocationAutocomplete";
import {
  calculateDhoToOriginDistance,
  calculateFullRouteDistance,
} from "@/utils/googleDistanceCalculator";
import { muiTheme } from "@/theme/theme";
import { RootState, useAppSelector } from "@/redux/store";
import { MdContentCopy } from "react-icons/md";

// Lazy load the map components
const LazyGoogleMapsLoader = lazy(
  () => import("@/components/ui/GoogleMapsLoader"),
);
const LazyMapWithRoute = lazy(() => import("@/components/ui/MapWithRoute"));

// FIXME: Custom hook for distance calculations
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
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate DHO ➡ Origin
  const calculateDhoToOrigin = useCallback(async () => {
    if (!dho || !origin) {
      setDhoToOriginDistance(null);
      setDhoToOriginTime(null);
      return;
    }

    setIsCalculating(true);
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
    } finally {
      setIsCalculating(false);
    }
  }, [dho, origin]);

  // Calculate DHO ➡ Origin ➡ All Destinations
  const calculateTotalRoute = useCallback(async () => {
    const validDestinations = destinations.filter(
      (dest): dest is TPlace => dest !== null,
    );

    if (
      (dho && origin && validDestinations.length > 0) ||
      (origin && validDestinations.length > 0)
    ) {
      setIsCalculating(true);
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
      } finally {
        setIsCalculating(false);
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

  const recalculateAll = useCallback(async () => {
    await Promise.all([calculateDhoToOrigin(), calculateTotalRoute()]);
  }, [calculateDhoToOrigin, calculateTotalRoute]);

  return {
    dhoToOriginDistance,
    dhoToOriginTime,
    totalDistance,
    totalTime,
    isCalculating,
    recalculateAll,
  };
};

// TODO: Custom hook for rate calculation
const useRateCalculation = (
  dhoToOriginDistance: number | null,
  totalDistance: number | null,
) => {
  const [dh, setDh] = useState<number | "">("");
  const [loadMiles, setLoadMiles] = useState<number | "">("");
  const [rate, setRate] = useState<number | "">("");
  const [calc, setCalc] = useState<number | "">("");

  // FIXME: Auto-update dh when dhoToOriginDistance changes
  useEffect(() => {
    if (dhoToOriginDistance !== null) {
      setDh(Number(dhoToOriginDistance.toFixed(1)));
    }
  }, [dhoToOriginDistance]);

  // FIXME: Auto-update loadMiles when totalDistance changes
  useEffect(() => {
    if (totalDistance !== null) {
      setLoadMiles(Number(totalDistance.toFixed(1)));
    }
  }, [totalDistance]);

  useEffect(() => {
    const dhNum = Number(dh);
    const loadMilesNum = Number(loadMiles);
    const rateNum = Number(rate);

    if (dh === "" || loadMiles === "" || rate === "") return;

    if (isNaN(dhNum) || isNaN(loadMilesNum) || isNaN(rateNum)) {
      toast.error("Please enter valid numbers to calculate", {
        style: { background: "#dc2626", color: "#fff" },
      });
      return;
    }

    if (loadMilesNum + dhNum === 0) {
      toast.error("Total miles cannot be zero", {
        style: { background: "#dc2626", color: "#fff" },
      });
      return;
    }

    const result = rateNum / (loadMilesNum + dhNum);
    setCalc(Number(result.toFixed(3)));
  }, [dh, loadMiles, rate]);

  const copyCalculationToClipboard = () => {
    const text = `Rate Calculation

•  Dead Head (Miles): ${dh || "0"}
•  Load Miles: ${loadMiles || "0"}
•  Rate ($): $${rate || "0"}

• Price Per Mile: $${calc || "0"}

 Calculation: $${rate || "0"} / (${loadMiles || "0"} + ${dh || "0"} miles) = $${calc || "0"} per mile`;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("Rate Calculation copied !");
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        toast.error("Failed to copy calculation");
      });
  };

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
    copyCalculationToClipboard,
  };
};

// TODO: Format time function
const formatTime = (hours: number): string => {
  const totalMinutes = hours * 60;
  const hoursPart = Math.floor(totalMinutes / 60);
  const minutesPart = Math.round(totalMinutes % 60);

  if (hoursPart === 0) {
    return `${minutesPart} minutes`;
  } else if (minutesPart === 0) {
    return `${hoursPart} hours`;
  } else {
    return `${hoursPart}h ${minutesPart}m`;
  }
};

// FIXME: Map fallback component
const MapFallback = () => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: 400,
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

// FIXME: Statistics Card Component
const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  color = "primary",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color?: "primary" | "secondary" | "success" | "info";
}) => (
  <Card
    variant="outlined"
    sx={{
      height: "100%",
      borderColor: `${color}.light`,
      backgroundColor: `${color}.50`,
    }}
  >
    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
      <Stack spacing={1}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ color: `${color}.main` }}>{icon}</Box>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            fontWeight="500"
          >
            {title}
          </Typography>
        </Box>
        <Typography variant="h6" fontWeight="600" color={`${color}.dark`}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Stack>
    </CardContent>
  </Card>
);

const CalculationPage = () => {
  // Map related states
  const [dho, setDho] = useState<TPlace | null>(null);
  const [origin, setOrigin] = useState<TPlace | null>(null);
  const [destinations, setDestinations] = useState<(TPlace | null)[]>([null]);
  const theme = useAppSelector((state: RootState) => state.palette);
  const [resetKey, setResetKey] = useState(0);

  const {
    dhoToOriginDistance,
    dhoToOriginTime,
    totalDistance,
    totalTime,
    isCalculating,
    recalculateAll,
  } = useRouteCalculations(dho, origin, destinations);

  // FIXME: Pass distances to rate calculation hook
  const {
    dh,
    setDh,
    loadMiles,
    setLoadMiles,
    rate,
    setRate,
    calc,
    clearCalculation,
    copyCalculationToClipboard,
  } = useRateCalculation(dhoToOriginDistance, totalDistance);

  // Destination management
  const handleAddDestination = useCallback(() => {
    setDestinations((prev) => [...prev, null]);
  }, []);

  const handleUpdateDestination = useCallback(
    (index: number, place: TPlace | null) => {
      setDestinations((prev) => {
        const newDestinations = [...prev];
        newDestinations[index] = place;
        return newDestinations;
      });
    },
    [],
  );

  const handleRemoveDestination = useCallback(
    (index: number) => {
      if (destinations.length > 1) {
        setDestinations((prev) => prev.filter((_, i) => i !== index));
      }
    },
    [destinations.length],
  );

  const clearAllRoutes = useCallback(() => {
    setDho(null);
    setOrigin(null);
    setDestinations([null]);
  }, []);

  const hasValidRoute = useMemo(
    () => dho && origin && destinations.some((dest) => dest !== null),
    [dho, origin, destinations],
  );

  const validDestinationsCount = useMemo(
    () => destinations.filter((dest) => dest !== null).length,
    [destinations],
  );

  const copyRouteDetailsToClipboard = () => {
    const text = `Route Planning

**DHO (Driver Home Origin) ***
${dho ? `${dho.display_name}` : "No Location"}

**Pick Up (Origin) ***
${origin ? `${origin.display_name}` : "No Location"}


**DHO to Origin**
${dhoToOriginDistance ? `${dhoToOriginDistance.toFixed(1)} miles` : "0 miles"}
${dhoToOriginTime ? formatTime(dhoToOriginTime) : "0 minutes"}

**Total Route**
${totalDistance ? `${totalDistance.toFixed(1)} miles` : "0 miles"}
${totalTime ? formatTime(totalTime) : "0 minutes"}

---

** Destinations (${validDestinationsCount})

${
  destinations
    .filter((dest) => dest !== null)
    .map(
      (dest, index) =>
        `Destination-${index}-${resetKey} *\n\n${dest.display_name}`,
    )
    .join("\n\n") || "No destinations"
}
${destinations.filter((d) => d).length > 0 ? "" : ""}`;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("Route Planning copied !");
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        toast.error("Failed to copy route details");
      });
  };

  // Reset All Button
  const resetAllBtn = useCallback(() => {
    setDho(null);
    setOrigin(null);
    setDestinations([null]);
    clearCalculation();
    setResetKey((prev) => prev + 1);
    toast.success("All inputs reset successfully");
  }, [clearCalculation]);

  // FIXME: Handle map location changes
  const handleMapLocationChange = useCallback(
    (
      type: "dho" | "origin" | "destination",
      place: TPlace | null,
      index?: number,
    ) => {
      if (type === "dho") {
        setDho(place);
      } else if (type === "origin") {
        setOrigin(place);
      } else if (type === "destination" && index !== undefined) {
        handleUpdateDestination(index, place);
      }
    },
    [handleUpdateDestination],
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Stack
        sx={{
          mb: 6,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "start",
          flexDirection: "row",
        }}
      >
        <Button
          sx={{
            width: { xs: "100%", lg: "10%" },
            mt: 2,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 500,
            color: "#fff",
            background: theme.currentPalette.primary,
            "&:hover": {
              background: alpha(theme.currentPalette.primary, 0.85),
            },
          }}
          onClick={resetAllBtn}
        >
          Reset All
        </Button>
      </Stack>

      <Grid container spacing={4}>
        {/* Left Column - Forms and Calculations */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Stack spacing={4}>
            {/* Rate Calculation Section */}
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: theme.currentPalette.background,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography variant="h5" color="primary.main" fontWeight="600">
                  Rate Calculation
                </Typography>
                <div className="flex items-center gap-1">
                  <Tooltip title="Clear all fields">
                    <IconButton
                      onClick={clearCalculation}
                      size="small"
                      color="inherit"
                    >
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="copy all fields">
                    <IconButton
                      onClick={copyCalculationToClipboard}
                      size="small"
                      color="inherit"
                      disabled={!dh && !loadMiles && !rate}
                    >
                      <MdContentCopy />
                    </IconButton>
                  </Tooltip>
                </div>
              </Box>

              <Box>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Dead Head (Miles)"
                      placeholder="0.00"
                      value={dh}
                      onChange={(e) =>
                        setDh(e.target.value ? Number(e.target.value) : "")
                      }
                      type="number"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <DirectionsCar />
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
                      placeholder="0.00"
                      value={loadMiles}
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
                              <Speed />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Rate ($)"
                      placeholder="0.00"
                      value={rate}
                      onChange={(e) =>
                        setRate(e.target.value ? Number(e.target.value) : "")
                      }
                      type="number"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <AttachMoney />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>
                </Grid>

                <Stack
                  direction="row"
                  gap={3}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  {/* Result */}
                  <TextField
                    label="Price Per Mile"
                    value={calc !== "" ? `$${calc}` : ""}
                    slotProps={{
                      input: {
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <AttachMoney />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{
                      minWidth: 200,
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "success.50",
                        borderColor: "success.light",
                      },
                      [muiTheme.breakpoints.down("md")]: {
                        width: "100%",
                      },
                    }}
                  />
                </Stack>

                {calc !== "" && (
                  <Fade in={true}>
                    <Alert severity="success" sx={{ mt: 2 }} icon={<Check />}>
                      <Typography variant="body2">
                        Calculation: ${rate} / ({loadMiles} + {dh} miles) ={" "}
                        <strong>${calc} per mile</strong>
                      </Typography>
                    </Alert>
                  </Fade>
                )}
              </Box>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: theme.currentPalette.background,
                height: "fit-content",
                minHeight: 600,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography variant="h5" color="primary.main" fontWeight="600">
                  Route Map
                </Typography>
                <Chip
                  icon={<Route />}
                  label={`${validDestinationsCount} Stops`}
                  color="primary"
                  variant="outlined"
                />
              </Box>

              <Suspense fallback={<MapFallback />}>
                <LazyGoogleMapsLoader
                  onLoad={() => console.log("Maps loaded successfully")}
                  onError={(error) =>
                    console.error("Failed to load maps:", error)
                  }
                >
                  <LazyMapWithRoute
                    dho={dho}
                    origin={origin}
                    destinations={destinations}
                    height="500px"
                    {...{
                      onLocationChange: handleMapLocationChange,
                    }}
                  />
                </LazyGoogleMapsLoader>
              </Suspense>

              {/* Route Summary */}
              <Fade in={!!hasValidRoute}>
                <Box>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    <Divider />
                    <Typography
                      variant="subtitle2"
                      fontWeight="600"
                      color="text.primary"
                    >
                      Route Summary
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {dho && (
                        <Chip
                          label="DHO"
                          size="small"
                          color="primary"
                          variant="filled"
                        />
                      )}
                      {origin && (
                        <Chip
                          label="Origin"
                          size="small"
                          color="secondary"
                          variant="filled"
                        />
                      )}
                      {destinations
                        .filter((d) => d !== null)
                        .map((_, index) => (
                          <Chip
                            key={index}
                            label={`Dest ${index + 1}`}
                            size="small"
                            color="success"
                            variant="filled"
                          />
                        ))}
                    </Stack>
                    {totalDistance && (
                      <Typography variant="body2" color="text.secondary">
                        Total distance:{" "}
                        <strong>{totalDistance.toFixed(1)} miles</strong>
                        {totalTime &&
                          ` • Estimated time: ${formatTime(totalTime)}`}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Fade>
            </Paper>
          </Stack>
        </Grid>

        {/* Right Column - Map */}
        <Grid size={{ xs: 12, lg: 6 }}>
          {/* Route Planning Section */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              backgroundColor: theme.currentPalette.background,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h5" color="primary.main" fontWeight="600">
                Route Planning
              </Typography>
              <div className="flex items-center gap-1">
                <Tooltip title="Recalculate distances">
                  <IconButton
                    onClick={recalculateAll}
                    size="small"
                    disabled={isCalculating}
                  >
                    <MyLocation />
                  </IconButton>
                </Tooltip>
                <Tooltip title="copy all fields">
                  <IconButton
                    onClick={copyRouteDetailsToClipboard}
                    size="small"
                    color="inherit"
                    disabled={!dho && !origin && destinations.every((d) => !d)}
                  >
                    <MdContentCopy />
                  </IconButton>
                </Tooltip>
              </div>
            </Box>

            <Stack spacing={3}>
              {/* DHO Input */}
              <LocationAutocomplete
                key={`dho-${resetKey}`}
                label="DHO (Driver Home Origin)"
                value={dho}
                setValue={setDho}
                placeholder="Enter driver's starting location"
                showZipCode={true}
              />

              {/* Origin Input */}
              <LocationAutocomplete
                key={`origin-${resetKey}`}
                label="Pick Up (Origin)"
                value={origin}
                setValue={setOrigin}
                placeholder="Enter origin address"
                showZipCode={true}
              />

              {/* Distance Statistics */}
              {(dhoToOriginDistance !== null || totalDistance !== null) && (
                <Grid container spacing={2}>
                  {dhoToOriginDistance !== null && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <StatCard
                        title="DHO to Origin"
                        value={`${dhoToOriginDistance.toFixed(1)} miles`}
                        subtitle={
                          dhoToOriginTime ? formatTime(dhoToOriginTime) : ""
                        }
                        icon={<Route />}
                        color="info"
                      />
                    </Grid>
                  )}
                  {totalDistance !== null && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <StatCard
                        title="Total Route"
                        value={`${totalDistance.toFixed(1)} miles`}
                        subtitle={
                          totalTime
                            ? formatTime(totalTime)
                            : `${validDestinationsCount} stops`
                        }
                        icon={<DirectionsCar />}
                        color="success"
                      />
                    </Grid>
                  )}
                </Grid>
              )}

              <Divider />

              {/* Destinations Section */}
              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6" fontWeight="500">
                    Destinations ({validDestinationsCount})
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Clear all routes">
                      <IconButton
                        onClick={clearAllRoutes}
                        size="small"
                        color="error"
                      >
                        <Close />
                      </IconButton>
                    </Tooltip>
                    <Button
                      startIcon={<Add />}
                      onClick={handleAddDestination}
                      variant="outlined"
                      size="medium"
                    >
                      Add
                    </Button>
                  </Stack>
                </Stack>

                <Stack spacing={2}>
                  {destinations.map((destination, index) => (
                    <Stack
                      key={`dest-stack-${index}-${resetKey}`}
                      direction="row"
                      spacing={1}
                      alignItems="flex-end"
                    >
                      <Box sx={{ flex: 1 }}>
                        <LocationAutocomplete
                          label={`Destination-${index}-${resetKey}`}
                          value={destination}
                          setValue={(place) =>
                            handleUpdateDestination(index, place)
                          }
                          placeholder={`Enter destination ${index + 1} address`}
                          showZipCode={true}
                        />
                      </Box>
                      {destinations.length > 1 && (
                        <Tooltip title="Remove destination">
                          <IconButton
                            onClick={() => handleRemoveDestination(index)}
                            sx={{ mb: 0.5 }}
                            color="error"
                            size="small"
                          >
                            <Close />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  ))}
                </Stack>
              </Box>

              {isCalculating && (
                <Fade in={true}>
                  <Alert severity="info">
                    <Stack direction="row" spacing={2} alignItems="center">
                      <CircularProgress size={20} />
                      <Typography variant="body2">
                        Calculating distances and travel times...
                      </Typography>
                    </Stack>
                  </Alert>
                </Fade>
              )}

              {!hasValidRoute && (
                <Fade in={true}>
                  <Alert severity="warning">
                    Please enter DHO, Origin, and at least one destination to
                    see the complete route.
                  </Alert>
                </Fade>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CalculationPage;
