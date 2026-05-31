/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  lazy,
  Suspense,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import {
  alpha,
  Box,
  Button,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { IoAdd, IoClose } from "react-icons/io5";
import { DollarSign, KeyRound, ShieldUser } from "lucide-react";

import LocationAutocomplete, {
  TPlace,
} from "@/components/sections/LocationAutocomplete";
import {
  calculateDhoToOriginDistance,
  calculateFullRouteDistance,
} from "@/utils/googleDistanceCalculator";
import { geocodeAddress } from "@/utils/geocoding";

import {
  setDho,
  setOrigin,
  setDestinations,
  addDestination,
  updateDestination,
  removeDestination,
  setPrice,
  setFees,
  setLoadIDInp,
  setPickupAt,
  setCompletedAt,
  setArrivalAtShipper,
  setArrivalAtReceiver,
  setLeftShipper,
  setLeftReceiver,
  setDriverId,
  setTruckId,
  setTruckType,
  setTruckTemp,
  setIsEditing,
  setEditingLoad,
  resetForm,
} from "@/redux/slices/loadsFormSlice";

import {
  useCreateLoadsMutation,
  useGetDriversQuery,
  useUpdateLoadsMutation,
} from "@/redux/slices/apiSlice";

import { RootState, useAppSelector } from "@/redux/store";
import {
  Adjustment,
  CreateEditLoadModalProps,
  TLoads,
  TTruckType,
} from "@/types/globalTypes";

import LoadDetailsTab from "./tabsModal/LoadDetailsTab";
import AssignmentTab from "./tabsModal/AssignmentTab";
import FinancialTab from "./tabsModal/FinancialTab";

const LazyGoogleMapsLoader = lazy(
  () => import("@/components/ui/GoogleMapsLoader"),
);
const LazyMapWithRoute = lazy(() => import("@/components/ui/MapWithRoute"));

type StepKey = "locations" | "assignment" | "timeline" | "financials";

type StepItem = {
  key: StepKey;
  title: string;
  desc: string;
  canGo: () => boolean;
};

const twoWords = (value?: string | null) => {
  const s = String(value ?? "").trim();
  if (!s) return "";
  return s.split(/\s+/).slice(0, 2).join(" ");
};

const CreateEditLoadModal: React.FC<CreateEditLoadModalProps> = ({
  isOpen,
  onClose,
  editingLoad = null,
}) => {
  const dispatch = useDispatch();
  const theme = useAppSelector((state: RootState) => state.palette);

  const {
    dho,
    origin,
    destinations,
    price,
    fees,
    loadIDInp,
    pickupAt,
    completedAt,
    arrivalAtShipper,
    arrivalAtReceiver,
    leftShipper,
    leftReceiver,
    driverId,
    truckId,
    truckType,
    truckTemp,
    isEditing,
  } = useSelector((state: RootState) => state.loadsForm);

  const { data: driversData } = useGetDriversQuery(undefined as any, {
    skip: !isOpen,
  });

  const [createLoad, { isLoading: creatingLoad }] = useCreateLoadsMutation();
  const [updateLoad, { isLoading: updatingLoad }] = useUpdateLoadsMutation();

  const [selectedDocuments, setSelectedDocuments] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);

  const [dhoToOriginDistance, setDhoToOriginDistance] = useState<number | null>(
    null,
  );
  const [averageTime, setAverageTime] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [allDistance, setAllDistance] = useState("");
  const [pricePerMile, setPricePerMile] = useState<number | null>(null);
  const [showMaps, setShowMaps] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const submitIntentRef = React.useRef(false);

  const pickupAtDayjs = pickupAt ? dayjs(pickupAt) : null;
  const completedAtDayjs = completedAt ? dayjs(completedAt) : null;
  const arrivalAtShipperDayjs = arrivalAtShipper
    ? dayjs(arrivalAtShipper)
    : null;
  const arrivalAtReceiverDayjs = arrivalAtReceiver
    ? dayjs(arrivalAtReceiver)
    : null;
  const leftShipperDayjs = leftShipper ? dayjs(leftShipper) : null;
  const leftReceiverDayjs = leftReceiver ? dayjs(leftReceiver) : null;

  const isEditMode = Boolean(isEditing && editingLoad);

  const isLocationsValid = () => {
    return !!origin && destinations.filter(Boolean).length > 0;
  };

  const isTimelineValid = () => {
    return pickupAt !== null && completedAt !== null;
  };

  const isFinancialValid = () => {
    return price.trim() !== "" && loadIDInp.trim() !== "";
  };

  const isAssignmentValid = () => {
    if (isEditMode) return true;

    return (
      driverId.trim() !== "" &&
      truckId.trim() !== "" &&
      (truckType?.trim?.() ? truckType.trim() !== "" : true)
    );
  };

  const steps: StepItem[] = useMemo(() => {
    if (isEditMode) {
      return [
        {
          key: "locations",
          title: "Locations",
          desc: "Define pickup & delivery addresses",
          canGo: () => true,
        },
        {
          key: "timeline",
          title: "Timeline & Milestones",
          desc: "Set planned schedules",
          canGo: () => isLocationsValid(),
        },
        {
          key: "financials",
          title: "Financials",
          desc: "Configure pricing & documents",
          canGo: () => isLocationsValid() && isTimelineValid(),
        },
      ];
    }

    return [
      {
        key: "locations",
        title: "Locations",
        desc: "Define pickup & delivery addresses",
        canGo: () => true,
      },
      {
        key: "assignment",
        title: "Ride Assignment",
        desc: "Assign driver & truck",
        canGo: () => isLocationsValid(),
      },
      {
        key: "timeline",
        title: "Timeline & Milestones",
        desc: "Set planned schedules",
        canGo: () => isLocationsValid() && isAssignmentValid(),
      },
      {
        key: "financials",
        title: "Financials",
        desc: "Configure pricing & documents",
        canGo: () =>
          isLocationsValid() && isAssignmentValid() && isTimelineValid(),
      },
    ];
  }, [
    isEditMode,
    origin,
    destinations,
    pickupAt,
    completedAt,
    price,
    loadIDInp,
    driverId,
    truckId,
    truckType,
  ]);

  const isLastStep = activeStep === steps.length - 1;
  const stepKey: StepKey = steps[activeStep]?.key || "locations";
  const stepTitle = steps[activeStep]?.title || "Locations";

  const goToStep = (idx: number) => {
    if (idx < 0 || idx > steps.length - 1) return;
    if (!steps[idx].canGo()) return;
    setActiveStep(idx);
  };

  const nextStep = () => goToStep(activeStep + 1);
  const prevStep = () => goToStep(activeStep - 1);

  useEffect(() => {
    if (!isOpen) return;
    setActiveStep(0);
  }, [isOpen, isEditMode]);

  const processFiles = (files: File[]) => {
    setUploadError("");

    if (selectedDocuments.length + files.length > 2) {
      setUploadError("You can only upload maximum 2 files 😢");
      return;
    }

    const invalidFiles = files.filter((file) => {
      const ext = file.name.toLowerCase().split(".").pop();
      return ext !== "pdf" && file.type !== "application/pdf";
    });

    if (invalidFiles.length > 0) {
      setUploadError("Only PDF files are allowed 😒");
      return;
    }

    setSelectedDocuments((prev) => [...prev, ...files]);
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) setIsDragging(true);
    },
    [isDragging],
  );

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files?.length) return;

    processFiles(Array.from(files));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setSelectedDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const loadEditData = async (loadItem: TLoads) => {
    if (!loadItem?.id) return;

    dispatch(setIsEditing(true));
    dispatch(setEditingLoad(loadItem));

    try {
      if (loadItem.DHO) {
        const dhoCoords = await geocodeAddress(loadItem.DHO);

        dispatch(
          setDho(
            dhoCoords ||
            ({
              display_name: loadItem.DHO,
              lat: "0",
              lon: "0",
              place_id: `temp_${Date.now()}_dho`,
            } as TPlace),
          ),
        );
      } else {
        dispatch(setDho(null));
      }

      if (loadItem.origin) {
        const originCoords = await geocodeAddress(loadItem.origin);

        dispatch(
          setOrigin(
            originCoords ||
            ({
              display_name: loadItem.origin,
              lat: "0",
              lon: "0",
              place_id: `temp_${Date.now()}_origin`,
            } as TPlace),
          ),
        );
      } else {
        dispatch(setOrigin(null));
      }

      if (loadItem.destination) {
        const destArray = Array.isArray(loadItem.destination)
          ? loadItem.destination
          : [loadItem.destination];

        const destinationPlaces = await Promise.all(
          destArray.map(async (dest) => {
            const coords = await geocodeAddress(dest);

            return (
              coords ||
              ({
                display_name: dest,
                lat: "0",
                lon: "0",
                place_id: `temp_${Date.now()}_dest_${dest}`,
              } as TPlace)
            );
          }),
        );

        dispatch(setDestinations(destinationPlaces));
      } else {
        dispatch(setDestinations([]));
      }
    } catch (error) {
      console.error("Error geocoding addresses:", error);
    }

    dispatch(setLoadIDInp(loadItem.loadId || ""));
    dispatch(setPrice(loadItem.totalPrice?.toString() || ""));
    dispatch(setFees(loadItem.feesNumber?.toString() || ""));

    dispatch(setPickupAt(loadItem.pickupAt || null));
    dispatch(setCompletedAt(loadItem.completedAt || null));
    dispatch(setArrivalAtShipper(loadItem.arrivalAtShipper || null));
    dispatch(setArrivalAtReceiver(loadItem.arrivalAtReceiver || null));
    dispatch(setLeftShipper(loadItem.leftShipper || null));
    dispatch(setLeftReceiver(loadItem.leftReceiver || null));

    dispatch(setDriverId(String((loadItem as any)?.driverId?.driverId ?? "")));
    dispatch(setTruckType((loadItem.truckType as TTruckType) || "reefer"));
    dispatch(setTruckId(loadItem.truckId?.truckId?.toString() || ""));
    dispatch(setTruckTemp(loadItem.truckTemp?.toString() || ""));

    if (loadItem.distanceMiles) {
      setAllDistance(loadItem.distanceMiles.toString());
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    dispatch(resetForm());
    setSelectedDocuments([]);
    setUploadError("");
    setIsDragging(false);
    setAllDistance("");
    setPricePerMile(null);

    if (editingLoad) {
      setTimeout(() => loadEditData(editingLoad), 50);
    } else {
      dispatch(setIsEditing(false));
      dispatch(setEditingLoad(null as any));
    }
  }, [isOpen, editingLoad]);

  useEffect(() => {
    if (!isOpen) return;
    setShowMaps(stepKey === "locations");
  }, [isOpen, stepKey]);

  useEffect(() => {
    const run = async () => {
      if (!dho || !origin) {
        setDhoToOriginDistance(null);
        setAverageTime(null);
        return;
      }

      try {
        const result = await calculateDhoToOriginDistance(
          { lat: parseFloat(dho.lat), lng: parseFloat(dho.lon) },
          { lat: parseFloat(origin.lat), lng: parseFloat(origin.lon) },
        );

        setDhoToOriginDistance(result.distance);
        setAverageTime(result.duration);
      } catch {
        setDhoToOriginDistance(null);
        setAverageTime(null);
      }
    };

    run();
  }, [dho, origin]);

  useEffect(() => {
    const run = async () => {
      const validDestinations = destinations.filter(Boolean) as TPlace[];

      if (!origin || validDestinations.length === 0) {
        setDistance(null);
        setAllDistance("");
        return;
      }

      try {
        const destinationsCoords = validDestinations.map((dest) => ({
          lat: parseFloat(dest.lat),
          lng: parseFloat(dest.lon),
        }));

        const result = await calculateFullRouteDistance(
          dho ? { lat: parseFloat(dho.lat), lng: parseFloat(dho.lon) } : null,
          { lat: parseFloat(origin.lat), lng: parseFloat(origin.lon) },
          destinationsCoords,
        );

        setDistance(result.distance);
        setAllDistance(result.distance.toFixed(2));

        if (price && Number(price) > 0) {
          setPricePerMile(Number(price) / result.distance);
        }
      } catch (e) {
        console.error("Error calculating total distance:", e);
        setDistance(null);
        setAllDistance("");
      }
    };

    run();
  }, [origin, destinations, dho, price]);

  const formatTime = (hours: number) => {
    const totalMinutes = hours * 60;
    const h = Math.floor(totalMinutes / 60);
    const m = Math.round(totalMinutes % 60);

    if (h === 0) return `${m} minutes`;
    if (m === 0) return `${h} hours`;

    return `${h}h ${m}m`;
  };

  const handlePriceChange = (value: string) => {
    dispatch(setPrice(value));

    if (allDistance && Number(allDistance) > 0 && Number(value) > 0) {
      setPricePerMile(Number(value) / Number(allDistance));
    } else {
      setPricePerMile(null);
    }
  };

  const handleAddDestination = () => dispatch(addDestination());

  const handleUpdateDestination = (index: number, place: TPlace | null) => {
    dispatch(updateDestination({ index, place }));
  };

  const handleRemoveDestination = (index: number) => {
    dispatch(removeDestination(index));
  };

  const extractErrorMessage = (error: unknown) => {
    if (typeof error === "string") return error;
    if (error instanceof Error) return error.message;

    if (typeof error === "object" && error !== null && "data" in error) {
      const rtk = error as { data?: { message?: string } };
      if (rtk.data?.message) return rtk.data.message;
    }

    if (typeof error === "object" && error !== null && "message" in error) {
      return (error as { message: string }).message;
    }

    return "An unknown error occurred";
  };

  const handleCreateLoad = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!submitIntentRef.current) return;
    submitIntentRef.current = false;

    const total = Number(price);
    const validDestinations = destinations.filter(Boolean) as TPlace[];

    if (!origin || validDestinations.length === 0) {
      toast.error("Please select origin and at least one destination");
      return;
    }

    if (!isEditMode && (!driverId || !truckId)) {
      toast.error("Please select driver and truck");
      return;
    }

    if (!total || total <= 0) {
      toast.error("Please enter a valid total price");
      return;
    }

    const finalDistance = allDistance
      ? parseFloat(allDistance)
      : Math.round(distance || 0);

    if (!finalDistance || finalDistance <= 0) {
      toast.error("Invalid distance calculated");
      return;
    }

    const formData = new FormData();

    formData.append("origin[address]", origin.display_name);

    validDestinations.forEach((dest, index) => {
      formData.append(`destination[${index}][address]`, dest.display_name);
    });

    if (dho?.display_name) {
      formData.append("DHO[address]", dho.display_name);
    }

    if (!isEditMode) {
      if (driverId) formData.append("driverId", driverId);
      if (truckId) formData.append("truckId", truckId);
    }

    const commonFields: Record<string, any> = {
      pickupAt,
      completedAt,
      arrivalAtShipper,
      arrivalAtReceiver,
      leftShipper,
      leftReceiver,
      truckTemp,
      truckType,
      distanceMiles: finalDistance.toString(),
      totalPrice: total.toString(),
      pricePerMile: (total / finalDistance).toString(),
      feesNumber: fees,
      loadId: loadIDInp,
    };

    Object.entries(commonFields).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        formData.append(key, value.toString());
      }
    });

    selectedDocuments.forEach((file) => {
      formData.append("documents", file);
    });

    adjustments.forEach((adj) => {
      if (adj.type === "Bonus") formData.append("bonus", adj.amount.toString());
      if (adj.type === "Detention")
        formData.append("detention", adj.amount.toString());
      if (adj.type === "Deduction")
        formData.append("deduction", adj.amount.toString());
    });

    try {
      if (isEditMode && editingLoad?.id) {
        await updateLoad({ id: editingLoad.id, formData } as any).unwrap();
        toast.success("Load updated");
      } else {
        await createLoad(formData as any).unwrap();
        toast.success("Load created");
      }

      handleClose();
    } catch (err) {
      const msg = extractErrorMessage(err);
      toast.error(msg || `Load ${isEditMode ? "update" : "creation"} failed`);
    }
  };

  const submitNow = () => {
    submitIntentRef.current = true;
    const form = document.getElementById("load-form") as HTMLFormElement | null;
    form?.requestSubmit();
  };

  const handleClose = () => {
    dispatch(resetForm());
    setSelectedDocuments([]);
    setUploadError("");
    setIsDragging(false);
    setShowMaps(false);
    setAllDistance("");
    setPricePerMile(null);
    onClose();
  };

  const selectedDriverName = useMemo(() => {
    const editName = (editingLoad as any)?.driverId?.name;
    if (isEditMode && editName) return twoWords(String(editName));

    const list = (driversData as any)?.data || (driversData as any)?.drivers || [];

    const found = list.find((d: any) => {
      const id1 = String(d?.driverId ?? "");
      const id2 = String(d?._id ?? d?.id ?? "");
      return id1 === String(driverId) || id2 === String(driverId);
    });

    return twoWords(String(found?.name || found?.fullName || found?.username || ""));
  }, [driversData, driverId, isEditMode, editingLoad]);

  const MapFallback = () => (
    <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg border border-gray-200">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
        <p className="text-gray-600">Loading Maps...</p>
      </div>
    </div>
  );

  const baseChipSx = {
    display: "inline-flex",
    alignItems: "center",
    gap: 1,
    px: 2.2,
    py: 0.5,
    borderRadius: 999,
    fontSize: 14,
    whiteSpace: "nowrap",

    "@media (max-width:999px)": {
      px: 1.4,
      py: 0.45,
      fontSize: 12,
      flex: "1 1 auto",
      justifyContent: "center",
    },

    "& svg": {
      width: 16,
      height: 16,
      flexShrink: 0,
      display: "block",
    },
  } as const;

  const chipSx = {
    ...baseChipSx,
    border: `2px solid ${alpha(theme.currentPalette.text, 0.12)}`,
    bgcolor: "#fff",
    color: theme.currentPalette.text,
    "& svg": { color: theme.currentPalette.primary },
  } as const;

  const blueChipSx = {
    ...baseChipSx,
    border: `2px solid ${alpha(theme.currentPalette.primary, 0.1)}`,
    bgcolor: alpha(theme.currentPalette.primary, 0.1),
    color: theme.currentPalette.primary,
    "& svg": { color: theme.currentPalette.primary },
  } as const;

  const greenChipSx = {
    ...baseChipSx,
    border: `2px solid ${alpha("#2e7d32", 0.55)}`,
    bgcolor: alpha("#2e7d32", 0.1),
    color: "#2e7d32",
    "& svg": { color: "#2e7d32" },
  } as const;

  const chipDividerSx = {
    width: "2px",
    height: 44,
    bgcolor: alpha(theme.currentPalette.text, 0.12),
    borderRadius: 2,
    mx: 2.5,

    "@media (max-width:999px)": {
      display: "none",
    },
  } as const;

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      fullWidth
      maxWidth="lg"
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "hidden",
          height: "100vh",
          maxHeight: "100vh",

          "@media (max-width:999px)": {
            margin: 1,
            width: "calc(100% - 16px)",
            maxWidth: "calc(100% - 16px)",
          },
        },
      }}
    >
      <DialogContent sx={{ p: 0, height: "100%" }}>
        <Box
          sx={{
            height: "100%",
            display: "flex",

            "@media (max-width:999px)": {
              flexDirection: "column",
            },
          }}
        >
          {/* STEPPER */}
          <Box
            sx={{
              width: 320,
              borderRight: `1px solid ${alpha(theme.currentPalette.text, 0.12)}`,
              pt: 1.3,
              flexShrink: 0,

              "@media (max-width:999px)": {
                width: "100%",
                borderRight: "none",
                borderBottom: `1px solid ${alpha(theme.currentPalette.text, 0.12)}`,
                pt: 0,
              },
            }}
          >
            {/* MODAL TITLE */}
            <Box
              sx={{
                px: { xs: 2, md: 3 },
                py: { xs: 1.5, md: 0 },
                pb: { xs: 1.5, md: 2 },
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: 18, md: 20 },
                    lineHeight: 1.2,
                  }}
                >
                  {isEditMode ? "Edit Load" : "Add New Load"}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.5,
                    color: alpha(theme.currentPalette.text, 0.55),
                    fontSize: 13,
                  }}
                >
                  Complete all steps
                </Typography>
              </Box>

              {/* MOBILE CLOSE */}
              <IconButton
                onClick={handleClose}
                sx={{
                  display: { xs: "flex", md: "none" },
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  mt: -0.5,
                }}
              >
                <IoClose />
              </IconButton>
            </Box>

            <Divider sx={{ borderColor: alpha(theme.currentPalette.text, 0.12) }} />

            {/* DESKTOP STEPPER */}
            <Box
              sx={{
                display: { xs: "none", md: "block" },
                px: 3,
                py: 2,
              }}
            >
              {steps.map((s, idx) => {
                const isActive = idx === activeStep;
                const disabled = !s.canGo();

                return (
                  <Box
                    key={s.key}
                    onClick={() => {
                      if (!disabled) goToStep(idx);
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      p: 2,
                      borderRadius: 2,
                      cursor: disabled ? "not-allowed" : "pointer",
                      opacity: disabled ? 0.45 : 1,
                      bgcolor: isActive
                        ? alpha(theme.currentPalette.primary, 0.12)
                        : "transparent",
                      position: "relative",
                      mb: 1.2,
                    }}
                  >
                    {idx !== steps.length - 1 && (
                      <Box
                        sx={{
                          position: "absolute",
                          left: 28,
                          top: 52,
                          height: 36,
                          width: 2,
                          bgcolor: alpha(theme.currentPalette.primary, 0.25),
                        }}
                      />
                    )}

                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        border: `2px solid ${isActive
                            ? theme.currentPalette.primary
                            : alpha(theme.currentPalette.text, 0.25)
                          }`,
                        bgcolor: isActive
                          ? theme.currentPalette.primary
                          : "transparent",
                        color: isActive ? "#fff" : theme.currentPalette.primary,
                        flexShrink: 0,
                      }}
                    >
                      <Typography sx={{ fontSize: 12, fontWeight: 900 }}>
                        {idx + 1}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 900,
                          fontSize: 15,
                          color: isActive
                            ? theme.currentPalette.primary
                            : theme.currentPalette.text,
                        }}
                      >
                        {s.title}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 12,
                          color: alpha(theme.currentPalette.text, 0.55),
                          mt: 0.3,
                        }}
                      >
                        {s.desc}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* MOBILE STEPPER */}
            <Box
              sx={{
                display: { xs: "grid", md: "none" },
                gridTemplateColumns: `repeat(${steps.length}, 1fr)`,
                gap: 0.6,
                px: 1,
                py: 1,
              }}
            >
              {steps.map((s, idx) => {
                const isActive = idx === activeStep;
                const disabled = !s.canGo();

                return (
                  <Box
                    key={s.key}
                    onClick={() => {
                      if (!disabled) goToStep(idx);
                    }}
                    sx={{
                      p: 0.8,
                      borderRadius: 1.5,
                      cursor: disabled ? "not-allowed" : "pointer",
                      opacity: disabled ? 0.45 : 1,
                      minHeight: 70,
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      gap: 0.5,
                      border: `1px solid ${isActive
                          ? alpha(theme.currentPalette.primary, 0.45)
                          : alpha(theme.currentPalette.text, 0.1)
                        }`,
                      bgcolor: isActive
                        ? alpha(theme.currentPalette.primary, 0.12)
                        : alpha(theme.currentPalette.text, 0.02),
                    }}
                  >
                    <Box
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        border: `2px solid ${isActive
                            ? theme.currentPalette.primary
                            : alpha(theme.currentPalette.text, 0.25)
                          }`,
                        bgcolor: isActive
                          ? theme.currentPalette.primary
                          : "transparent",
                        color: isActive ? "#fff" : theme.currentPalette.primary,
                      }}
                    >
                      <Typography sx={{ fontSize: 11, fontWeight: 900 }}>
                        {idx + 1}
                      </Typography>
                    </Box>

                    <Typography
                      sx={{
                        fontWeight: 900,
                        fontSize: 10,
                        lineHeight: 1.15,
                      }}
                    >
                      {s.title}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* RIGHT CONTENT */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              minHeight: 0,
            }}
          >
            {/* HEADER BAR */}
            <Box
              sx={{
                px: 3,
                py: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: `1px solid ${alpha(theme.currentPalette.text, 0.12)}`,
                gap: 2,

                "@media (max-width:999px)": {
                  px: 2,
                  py: 1.5,
                  flexDirection: "column",
                  alignItems: "stretch",
                },
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: 20 }}>
                  {stepTitle}
                </Typography>

                <Typography
                  sx={{
                    fontSize: 12,
                    color: alpha(theme.currentPalette.text, 0.55),
                  }}
                >
                  Step {activeStep + 1} of {steps.length}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexWrap: "wrap",

                  "@media (max-width:999px)": {
                    width: "100%",
                  },
                }}
              >
                <Box sx={chipSx}>
                  <KeyRound />
                  {loadIDInp?.trim() ? loadIDInp : "0"}
                </Box>

                <Box sx={chipDividerSx} />

                <Box sx={blueChipSx}>
                  <ShieldUser />
                  {selectedDriverName
                    ? selectedDriverName
                    : driverId?.trim()
                      ? "Driver selected"
                      : "No Driver"}
                </Box>

                <Box sx={chipDividerSx} />

                <Box sx={greenChipSx}>
                  <DollarSign />
                  {price?.trim() ? `$${Number(price).toLocaleString()}` : "$0"}
                </Box>

                {/* DESKTOP CLOSE */}
                <IconButton
                  onClick={handleClose}
                  sx={{
                    ml: 1,
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    flexShrink: 0,
                    display: { xs: "none", md: "flex" },
                  }}
                >
                  <IoClose />
                </IconButton>
              </Box>
            </Box>

            {/* BODY */}
            <Box
              sx={{
                flex: 1,
                overflow: "auto",
                p: 3,
                minHeight: 0,

                "@media (max-width:999px)": {
                  p: 2,
                },
              }}
            >
              <form
                id="load-form"
                onSubmit={handleCreateLoad}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLastStep) {
                    e.preventDefault();
                    nextStep();
                  }
                }}
              >
                {stepKey === "locations" && (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", lg: "1.05fr 0.95fr" },
                      gap: 3,
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          border: `2px solid ${alpha(theme.currentPalette.primary, 0.85)}`,
                          borderRadius: 2,
                          p: 2,
                          mb: 2,
                          bgcolor: alpha(theme.currentPalette.primary, 0.03),
                        }}
                      >
                        <Typography sx={{ fontWeight: 900, fontSize: 15, mb: 1 }}>
                          Route Distance Information
                        </Typography>

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            rowGap: 0.75,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 13,
                              color: alpha(theme.currentPalette.text, 0.65),
                            }}
                          >
                            Total distance:
                          </Typography>

                          <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                            {allDistance
                              ? `${Math.trunc(Number(allDistance))} miles`
                              : "Not calculated yet"}
                          </Typography>

                          <Typography
                            sx={{
                              fontSize: 13,
                              color: alpha(theme.currentPalette.text, 0.65),
                            }}
                          >
                            DHO to Origin:
                          </Typography>

                          <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                            {dho && origin && dhoToOriginDistance
                              ? `${Math.trunc(Number(dhoToOriginDistance))} miles`
                              : "Not calculated yet"}
                          </Typography>

                          <Typography
                            sx={{
                              fontSize: 13,
                              color: alpha(theme.currentPalette.text, 0.65),
                            }}
                          >
                            Including:
                          </Typography>

                          <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                            {destinations.filter(Boolean).length} destination(s)
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: "grid", gap: 2 }}>
                        <LocationAutocomplete
                          label="DHO (Driver Home Origin)"
                          value={dho}
                          required
                          setValue={(place) => dispatch(setDho(place))}
                          placeholder="Enter driver's starting location"
                          showZipCode
                        />

                        <LocationAutocomplete
                          label="Pick Up (Origin)"
                          value={origin}
                          required
                          setValue={(place) => dispatch(setOrigin(place))}
                          placeholder="Enter origin address"
                          showZipCode
                        />

                        <div className="space-y-4">
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                            <Typography
                              sx={{
                                color: theme.currentPalette.primary,
                                fontSize: "14px",
                                fontWeight: "bold",
                                display: "block",
                                mb: 1,
                              }}
                            >
                              Destinations
                            </Typography>

                            <Button
                              variant="contained"
                              type="button"
                              onClick={handleAddDestination}
                              className="flex items-center w-full md:w-fit gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              <IoAdd size={16} />
                              Add Destination
                            </Button>
                          </div>

                          {destinations.map((destination, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <div className="flex-1">
                                <LocationAutocomplete
                                  label={`Destination ${index + 1}`}
                                  value={destination}
                                  required
                                  setValue={(place) =>
                                    handleUpdateDestination(index, place)
                                  }
                                  placeholder={`Enter destination ${index + 1} address`}
                                  showZipCode
                                />
                              </div>

                              {destinations.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDestination(index)}
                                  className="mt-6 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <IoClose size={20} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                            gap: 2,
                          }}
                        >
                          <Box>
                            <Typography
                              sx={{
                                color: theme.currentPalette.primary,
                                fontSize: 13,
                                fontWeight: 900,
                                mb: 0.8,
                              }}
                            >
                              DHO to Origin Distance
                            </Typography>

                            <TextField
                              fullWidth
                              placeholder="Auto Calculated Distance"
                              value={
                                dhoToOriginDistance != null
                                  ? `${Math.trunc(dhoToOriginDistance)} miles`
                                  : ""
                              }
                              inputProps={{ readOnly: true }}
                            />
                          </Box>

                          <Box>
                            <Typography
                              sx={{
                                color: theme.currentPalette.primary,
                                fontSize: 13,
                                fontWeight: 900,
                                mb: 0.8,
                              }}
                            >
                              Average Time To Pickup
                            </Typography>

                            <TextField
                              fullWidth
                              placeholder="Auto Calculated Time"
                              value={averageTime ? formatTime(averageTime) : ""}
                              inputProps={{ readOnly: true }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.currentPalette.text, 0.12)}`,
                        overflow: "hidden",
                        minHeight: 520,
                        bgcolor: alpha(theme.currentPalette.text, 0.02),

                        "@media (max-width:999px)": {
                          display: "none",
                        },
                      }}
                    >
                      {showMaps ? (
                        <Suspense fallback={<MapFallback />}>
                          <LazyGoogleMapsLoader>
                            <LazyMapWithRoute
                              dho={dho}
                              origin={origin}
                              destinations={destinations}
                              height="100%"
                            />
                          </LazyGoogleMapsLoader>
                        </Suspense>
                      ) : (
                        <Box
                          sx={{
                            height: "100%",
                            display: "grid",
                            placeItems: "center",
                            color: alpha(theme.currentPalette.text, 0.6),
                          }}
                        >
                          Map will load when needed
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}

                {stepKey === "assignment" && !isEditMode && (
                  <AssignmentTab
                    isEditing={isEditing}
                    editingLoad={editingLoad}
                    driverId={driverId}
                    truckId={truckId}
                    truckType={truckType}
                    truckTemp={truckTemp}
                    onDriverIdChange={(value) => dispatch(setDriverId(value))}
                    onTruckIdChange={(value) => dispatch(setTruckId(value))}
                    onTruckTypeChange={(value) =>
                      dispatch(setTruckType(value as TTruckType))
                    }
                    onTruckTempChange={(value) => dispatch(setTruckTemp(value))}
                    isTabValid={isAssignmentValid()}
                    onPrevTab={prevStep}
                    onSubmit={handleCreateLoad}
                    isLoading={creatingLoad || updatingLoad}
                  />
                )}

                {stepKey === "timeline" && (
                  <LoadDetailsTab
                    pickupAt={pickupAtDayjs}
                    completedAt={completedAtDayjs}
                    arrivalAtShipper={arrivalAtShipperDayjs}
                    arrivalAtReceiver={arrivalAtReceiverDayjs}
                    leftShipper={leftShipperDayjs}
                    leftReceiver={leftReceiverDayjs}
                    onPickupAtChange={(value) =>
                      dispatch(setPickupAt(value ? value.toISOString() : null))
                    }
                    onCompletedAtChange={(value) =>
                      dispatch(setCompletedAt(value ? value.toISOString() : null))
                    }
                    onArrivalAtShipperChange={(value) =>
                      dispatch(
                        setArrivalAtShipper(value ? value.toISOString() : null),
                      )
                    }
                    onArrivalAtReceiverChange={(value) =>
                      dispatch(
                        setArrivalAtReceiver(value ? value.toISOString() : null),
                      )
                    }
                    onLeftShipperChange={(value) =>
                      dispatch(setLeftShipper(value ? value.toISOString() : null))
                    }
                    onLeftReceiverChange={(value) =>
                      dispatch(setLeftReceiver(value ? value.toISOString() : null))
                    }
                    isEditing={isEditing}
                    isTabValid={isTimelineValid()}
                    onPrevTab={prevStep}
                    onNextTab={nextStep}
                  />
                )}

                {stepKey === "financials" && (
                  <FinancialTab
                    allDistance={allDistance}
                    price={price}
                    fees={fees}
                    loadIDInp={loadIDInp}
                    pricePerMile={pricePerMile}
                    destinations={destinations}
                    onPriceChange={handlePriceChange}
                    onFeesChange={(value) => dispatch(setFees(value))}
                    onLoadIDChange={(value) => dispatch(setLoadIDInp(value))}
                    onFileSelect={handleFileSelect}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onRemoveFile={handleRemoveFile}
                    uploadError={uploadError}
                    adjustments={adjustments}
                    onAdjustmentsChange={setAdjustments}
                    isDragging={isDragging}
                    selectedDocuments={selectedDocuments}
                    isEditing={isEditing}
                    isTabValid={isFinancialValid()}
                    onPrevTab={prevStep}
                    onNextTab={nextStep}
                  />
                )}
              </form>
            </Box>

            <Divider sx={{ borderColor: alpha(theme.currentPalette.text, 0.12) }} />

            {/* FOOTER */}
            <Box
              sx={{
                display: "flex",
                pb: 2,
                pt: 1.5,
                px: 3,
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,

                "@media (max-width:999px)": {
                  px: 2,
                  pb: 1.5,
                  bgcolor: "#fff",
                  flexShrink: 0,
                },
              }}
            >
              <Button
                type="button"
                variant="outlined"
                onClick={prevStep}
                disabled={activeStep === 0}
                sx={{ borderRadius: 2, textTransform: "none", px: 3 }}
              >
                Back
              </Button>

              <Button
                type="button"
                onClick={isLastStep ? submitNow : nextStep}
                disabled={
                  isLastStep
                    ? !steps[activeStep].canGo() || creatingLoad || updatingLoad
                    : !steps[Math.min(activeStep + 1, steps.length - 1)]?.canGo?.()
                }
                variant="contained"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  px: 3,
                  "&.Mui-disabled": {
                    bgcolor: alpha(theme.currentPalette.primary, 0.35),
                    color: "white",
                  },
                }}
              >
                {isLastStep
                  ? isEditMode
                    ? "Update Load"
                    : "Create Load"
                  : "Next"}
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditLoadModal;