/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useMemo, useState, lazy, Suspense } from "react";
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

import LocationAutocomplete, { TPlace } from "@/components/sections/LocationAutocomplete";
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

import { useCreateLoadsMutation, useGetDriversQuery, useUpdateLoadsMutation } from "@/redux/slices/apiSlice";
import { RootState, useAppSelector } from "@/redux/store";
import { CreateEditLoadModalProps, TLoads, TTruckType, Adjustment } from "@/types/globalTypes";

import LoadDetailsTab from "./tabsModal/LoadDetailsTab";
import AssignmentTab from "./tabsModal/AssignmentTab";
import FinancialTab from "./tabsModal/FinancialTab";
import { DollarSign, KeyRound, ShieldUser } from "lucide-react";

// Lazy load the map components
const LazyGoogleMapsLoader = lazy(() => import("@/components/ui/GoogleMapsLoader"));
const LazyMapWithRoute = lazy(() => import("@/components/ui/MapWithRoute"));

type StepKey = "locations" | "assignment" | "timeline" | "financials";
type StepItem = {
  key: StepKey;
  title: string;
  desc: string;
  canGo: () => boolean;
};
// name driver to be two words 
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

  const theme = useAppSelector((state: RootState) => state.palette);
  const { data: driversData } = useGetDriversQuery(undefined as any, {
    skip: !isOpen,
  });
  const [createLoad, { isLoading: creatingLoad }] = useCreateLoadsMutation();
  const [updateLoad, { isLoading: updatingLoad }] = useUpdateLoadsMutation();

  // Documents
  const [selectedDocuments, setSelectedDocuments] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);

  // Maps / distance
  const [dhoToOriginDistance, setDhoToOriginDistance] = useState<number | null>(null);
  const [averageTime, setAverageTime] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [allDistance, setAllDistance] = useState<string>("");
  const [pricePerMile, setPricePerMile] = useState<number | null>(null);
  const [showMaps, setShowMaps] = useState(false);

  // Dayjs
  const pickupAtDayjs = pickupAt ? dayjs(pickupAt) : null;
  const completedAtDayjs = completedAt ? dayjs(completedAt) : null;
  const arrivalAtShipperDayjs = arrivalAtShipper ? dayjs(arrivalAtShipper) : null;
  const arrivalAtReceiverDayjs = arrivalAtReceiver ? dayjs(arrivalAtReceiver) : null;
  const leftShipperDayjs = leftShipper ? dayjs(leftShipper) : null;
  const leftReceiverDayjs = leftReceiver ? dayjs(leftReceiver) : null;

  const isEditMode = Boolean(isEditing && editingLoad);


  const isLocationsValid = (): boolean => {
    const hasValidOrigin = !!origin;
    const hasAtLeastOneDestination = destinations.filter(Boolean).length > 0;
    return hasValidOrigin && hasAtLeastOneDestination;
  };
  const headerDriverName = useMemo(() => {
    // edit mode: جيبي الاسم من editingLoad.driverId.name
    if (isEditMode && (editingLoad as any)?.driverId?.name) {
      return twoWords((editingLoad as any).driverId.name);
    }

    // add mode: لو عندك name مخزن في state ممكن ترجعيه هنا (اختياري)
    return "";
  }, [isEditMode, editingLoad]);

  const isTimelineValid = (): boolean => {
    const hasValidPickupAt = pickupAt !== null;
    const hasValidCompletedAt = completedAt !== null;
    return hasValidPickupAt && hasValidCompletedAt;
  };

  const isFinancialValid = (): boolean => {
    const hasValidPrice = price.trim() !== "";
    const hasValidLoadID = loadIDInp.trim() !== "";
    return hasValidPrice && hasValidLoadID;
  };

  const isAssignmentValid = (): boolean => {
    if (isEditMode) return true;
    const hasValidDriverId = driverId.trim() !== "";
    const hasValidTruckType = truckType?.trim?.() ? truckType.trim() !== "" : true;
    const hasValidTruckId = truckId.trim() !== "";
    return hasValidDriverId && hasValidTruckType && hasValidTruckId;
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
        canGo: () => isLocationsValid() && isAssignmentValid() && isTimelineValid(),
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

  const [activeStep, setActiveStep] = useState(0);
  const isLastStep = activeStep === steps.length - 1;

  useEffect(() => {
    if (!isOpen) return;
    // reset to first step on open
    setActiveStep(0);
  }, [isOpen, isEditMode]);

  const stepKey: StepKey = steps[activeStep]?.key || "locations";
  const stepTitle = steps[activeStep]?.title || "Locations";

  const goToStep = (idx: number) => {
    if (idx < 0 || idx > steps.length - 1) return;
    if (!steps[idx].canGo()) return;
    setActiveStep(idx);
  };

  const nextStep = () => goToStep(activeStep + 1);
  const prevStep = () => goToStep(activeStep - 1);

  const processFiles = (files: File[]) => {
    setUploadError("");
    const totalFiles = selectedDocuments.length + files.length;
    if (totalFiles > 2) {
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
    if (!files || files.length === 0) return;
    processFiles(Array.from(files));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(Array.from(files));
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
      // DHO
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

      // Origin
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

      // Destinations
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

    // Load Details
    dispatch(setLoadIDInp(loadItem.loadId || ""));
    dispatch(setPrice(loadItem.totalPrice?.toString() || ""));
    dispatch(setFees(loadItem.feesNumber?.toString() || ""));

    // Dates
    dispatch(setPickupAt(loadItem.pickupAt || null));
    dispatch(setCompletedAt(loadItem.completedAt || null));
    dispatch(setArrivalAtShipper(loadItem.arrivalAtShipper || null));
    dispatch(setArrivalAtReceiver(loadItem.arrivalAtReceiver || null));
    dispatch(setLeftShipper(loadItem.leftShipper || null));
    dispatch(setLeftReceiver(loadItem.leftReceiver || null));

    // Assignment
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
      } catch (e) {
        console.error("Error calculating DHO to Origin distance:", e);
        setDhoToOriginDistance(null);
        setAverageTime(null);
      }
    };
    run();
  }, [dho, origin]);

  useEffect(() => {
    const run = async () => {
      const validDestinations = destinations.filter(Boolean) as TPlace[];

      if ((origin && validDestinations.length > 0) || (dho && origin && validDestinations.length > 0)) {
        try {
          const destinationsCoords = validDestinations.map((dest) => ({
            lat: parseFloat(dest.lat),
            lng: parseFloat(dest.lon),
          }));

          const result = await calculateFullRouteDistance(
            dho ? { lat: parseFloat(dho.lat), lng: parseFloat(dho.lon) } : null,
            origin ? { lat: parseFloat(origin.lat), lng: parseFloat(origin.lon) } : null,
            destinationsCoords,
          );

          setDistance(result.distance);
          setAllDistance(result.distance.toFixed(2));

          if (price && Number(price) > 0) {
            const perMile = Number(price) / result.distance;
            setPricePerMile(perMile);
          }
        } catch (e) {
          console.error("Error calculating total distance:", e);
          setDistance(null);
          setAllDistance("");
        }
      } else {
        setDistance(null);
        setAllDistance("");
      }
    };

    run();
  }, [origin, destinations, dho, price]);

  const formatTime = (hours: number): string => {
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
  const validDestCount = destinations.filter(Boolean).length;

  const handleAddDestination = () => dispatch(addDestination());
  const handleUpdateDestination = (index: number, place: TPlace | null) =>
    dispatch(updateDestination({ index, place }));
  const handleRemoveDestination = (index: number) => dispatch(removeDestination(index));

  const extractErrorMessage = (error: unknown): string => {
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

    const total = Number(price);
    const validDestinations = destinations.filter(Boolean) as TPlace[];

    if (!origin || validDestinations.length === 0) {
      toast.error("Please select origin and at least one destination");
      return;
    }

    // assignment only required on ADD
    if (!isEditMode && (!driverId || !truckId)) {
      toast.error("Please select driver and truck");
      return;
    }

    if (!total || total <= 0) {
      toast.error("Please enter a valid total price");
      return;
    }

    const finalDistance = allDistance ? parseFloat(allDistance) : Math.round(distance || 0);
    if (!finalDistance || finalDistance <= 0) {
      toast.error("Invalid distance calculated");
      return;
    }

    const formData = new FormData();

    formData.append("origin[address]", origin.display_name);

    validDestinations.forEach((dest, index) => {
      formData.append(`destination[${index}][address]`, dest.display_name);
    });

    if (dho?.display_name) formData.append("DHO[address]", dho.display_name);

    // assignment only on ADD
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

    if (selectedDocuments.length > 0) {
      selectedDocuments.forEach((file) => formData.append("documents", file));
    }

    // adjustments
    (adjustments || []).forEach((adj) => {
      if (adj.type === "Bonus") formData.append("bonus", adj.amount.toString());
      if (adj.type === "Detention") formData.append("detention", adj.amount.toString());
      if (adj.type === "Deduction") formData.append("deduction", adj.amount.toString());
    });

    try {
      if (isEditMode && editingLoad?.id) {
        await updateLoad({ id: editingLoad.id, formData } as any).unwrap();
        toast.success("Load updated ");
      } else {
        await createLoad(formData as any).unwrap();
        toast.success("Load created ");
      }

      handleClose();
    } catch (err) {
      const msg = extractErrorMessage(err);
      console.error(" Request failed:", err);
      toast.error(msg || `Load ${isEditMode ? "update" : "creation"} failed `);
    }
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
    // edit mode
    const editName = (editingLoad as any)?.driverId?.name;
    if (isEditMode && editName) return twoWords(String(editName));

    // add mode
    const list = (driversData as any)?.data || (driversData as any)?.drivers || [];
    const found = list.find((d: any) => {
      const id1 = String(d?.driverId ?? "");
      const id2 = String(d?._id ?? d?.id ?? "");
      return id1 === String(driverId) || id2 === String(driverId);
    });

    const name = found?.name || found?.fullName || found?.username || "";
    return twoWords(String(name));
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
    // height: 52,
    px: 2.2,
    borderRadius: 999,
    fontSize: 16,
    // fontWeight: 800,
    whiteSpace: "nowrap",

    "& svg": {
      width: 20,
      height: 20,
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
    border: `2px solid ${alpha(theme.currentPalette.primary, 0.7)}`,
    bgcolor: alpha(theme.currentPalette.primary, 0.1),
    color: theme.currentPalette.primary,
    "& svg": { color: theme.currentPalette.primary },
  } as const;

  const greenChipSx = {
    ...baseChipSx,
    border: `2px solid ${alpha("#2e7d32", 0.55)}`,
    bgcolor: alpha("#2e7d32", 0.10),
    color: "#2e7d32",
    "& svg": { color: "#2e7d32" },
  } as const;

  const chipDividerSx = {
    width: "2px",
    height: 44,
    bgcolor: alpha(theme.currentPalette.text, 0.12),
    borderRadius: 2,
    mx: 2.5,
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
          overflow: "auto",
          height: "100vh",
        },
      }}
    >
      <IconButton
        onClick={handleClose}
        sx={{ position: "absolute", top: 2, right: 2, zIndex: 20, mb: 2 }}
      >
        <IoClose />
      </IconButton>

      <DialogContent sx={{ pt: 1, height: "100%" }}>
        <Box
          sx={{
            height: "100%",
            display: "flex",
            // bgcolor: theme.currentPalette.background,
          }}
        >
          {/* LEFT SIDEBAR STEPS */}
          <Box
            sx={{
              width: 320,
              borderRight: `1px solid ${alpha(theme.currentPalette.text, 0.12)}`,
              // bgcolor: alpha(theme.currentPalette.text, 0.03),
              pt: 1.3,
            }}
          >
            <Box sx={{ px: 3, pb: 2 }}>
              <Typography sx={{ fontWeight: 900, fontSize: 20 }}>
                {isEditMode ? "Edit Load" : "Add New Load"}
              </Typography>
              <Typography sx={{ mt: 0.5, color: alpha(theme.currentPalette.text, 0.55), fontSize: 13 }}>
                Complete all steps
              </Typography>
            </Box>

            <Divider
              sx={{
                width: "100%",
                m: 0,
                borderColor: alpha(theme.currentPalette.text, 0.12),
              }}
            />

            <Box sx={{ px: 3, py: 2, flex: 1 }}>
              {steps.map((s, idx) => {
                const isActive = idx === activeStep;
                const done =
                  idx === 0
                    ? false
                    : idx === 1
                      ? steps[1].canGo()
                      : idx === 2
                        ? steps[2].canGo()
                        : steps[3]?.canGo?.() || false;

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
                      bgcolor: isActive ? alpha(theme.currentPalette.primary, 0.12) : "transparent",
                      position: "relative",
                      mb: 1.2,
                      transition: "0.15s",
                    }}
                  >
                    {/* connector line */}
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

                    {/* circle */}
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        border: `2px solid ${isActive || done
                          ? theme.currentPalette.primary
                          : alpha(theme.currentPalette.text, 0.25)
                          }`,
                        bgcolor: isActive ? theme.currentPalette.primary : "transparent",
                        color: isActive ? theme.currentPalette.background : theme.currentPalette.primary,
                        fontWeight: 900,
                        mt: 0.2,
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
                          color: isActive ? theme.currentPalette.primary : theme.currentPalette.text,
                        }}
                      >
                        {s.title}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: alpha(theme.currentPalette.text, 0.55), mt: 0.3 }}>
                        {s.desc}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* RIGHT CONTENT */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {/* HEADER BAR */}
            <Box
              sx={{
                px: 3,
                py: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: `1px solid ${alpha(theme.currentPalette.text, 0.12)}`,
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: 20 }}>{stepTitle}</Typography>
                <Typography sx={{ fontSize: 12, color: alpha(theme.currentPalette.text, 0.55) }}>
                  Step {activeStep + 1} of {steps.length}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box sx={chipSx}>
                  <KeyRound />
                  #{loadIDInp?.trim() ? loadIDInp : "0"}
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
              </Box>
            </Box>

            {/* BODY */}
            <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
              <form id="load-form" onSubmit={handleCreateLoad}>
                {/* LOCATIONS */}
                {stepKey === "locations" && (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", lg: "1.05fr 0.95fr" },
                      gap: 3,
                    }}
                  >
                    {/* LEFT */}
                    <Box>
                      {/* Route info card */}
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

                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 0.75 }}>
                          <Typography sx={{ fontSize: 13, color: alpha(theme.currentPalette.text, 0.65) }}>
                            Total distance:
                          </Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                            {allDistance ? `${allDistance} miles` : "Not calculated yet"}
                          </Typography>

                          <Typography sx={{ fontSize: 13, color: alpha(theme.currentPalette.text, 0.65) }}>
                            DHO to Origin:
                          </Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                            {dho && origin && dhoToOriginDistance
                              ? `${dhoToOriginDistance.toFixed(2)} miles`
                              : "Not calculated yet"}
                          </Typography>

                          <Typography sx={{ fontSize: 13, color: alpha(theme.currentPalette.text, 0.65) }}>
                            Including:
                          </Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                            {destinations.filter(Boolean).length} destination(s)
                          </Typography>
                        </Box>
                      </Box>

                      {/* Inputs */}
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
                        {/* Destinations Section */}
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
                            <div
                              key={index}
                              className="flex items-center gap-3"
                            >
                              <div className="flex-1">


                                <LocationAutocomplete
                                  label={`Destination ${index + 1}`}
                                  value={destination}
                                  required
                                  setValue={(place) =>
                                    handleUpdateDestination(index, place)
                                  }
                                  placeholder={`Enter destination ${index + 1
                                    } address`}
                                  // googleMapsApiKey={googleMapsApiKey!}
                                  showZipCode={true}
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


                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                          <Box>
                            <Typography sx={{ color: theme.currentPalette.primary, fontSize: 13, fontWeight: 900, mb: 0.8 }}>
                              DHO to Origin Distance
                            </Typography>
                            <TextField
                              fullWidth
                              placeholder="Auto Calculated Distance"
                              value={
                                dhoToOriginDistance
                                  ? `${dhoToOriginDistance.toFixed(2)} miles`
                                  : ""
                              }
                              inputProps={{ readOnly: true }}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  bgcolor: alpha(theme.currentPalette.text, 0.03),
                                  borderRadius: 2,
                                },
                              }}
                            />
                          </Box>

                          <Box>
                            <Typography sx={{ color: theme.currentPalette.primary, fontSize: 13, fontWeight: 900, mb: 0.8 }}>
                              Average Time To Pickup
                            </Typography>
                            <TextField
                              placeholder="Auto Calculated Time"
                              fullWidth
                              value={averageTime ? formatTime(averageTime) : ""}
                              inputProps={{ readOnly: true }}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  bgcolor: alpha(theme.currentPalette.text, 0.03),
                                  borderRadius: 2,
                                },
                              }}
                            />
                          </Box>
                        </Box>

                      </Box>
                    </Box>

                    {/* RIGHT MAP */}
                    <Box
                      sx={{
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.currentPalette.text, 0.12)}`,
                        overflow: "hidden",
                        minHeight: 520,
                        bgcolor: alpha(theme.currentPalette.text, 0.02),
                      }}
                    >
                      {showMaps ? (
                        <Suspense fallback={<MapFallback />}>
                          <LazyGoogleMapsLoader
                            onLoad={() => console.log("Maps loaded successfully")}
                            onError={(error) => console.error("Failed to load maps:", error)}
                          >
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

                {/* ASSIGNMENT  */}
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
                    onTruckTypeChange={(value) => dispatch(setTruckType(value as TTruckType))}
                    onTruckTempChange={(value) => dispatch(setTruckTemp(value))}
                    isTabValid={isAssignmentValid()}
                    onPrevTab={prevStep}
                    onSubmit={handleCreateLoad}
                    isLoading={creatingLoad || updatingLoad}
                  />
                )}

                {/* TIMELINE */}
                {stepKey === "timeline" && (
                  <LoadDetailsTab
                    pickupAt={pickupAtDayjs}
                    completedAt={completedAtDayjs}
                    arrivalAtShipper={arrivalAtShipperDayjs}
                    arrivalAtReceiver={arrivalAtReceiverDayjs}
                    leftShipper={leftShipperDayjs}
                    leftReceiver={leftReceiverDayjs}
                    onPickupAtChange={(value) => dispatch(setPickupAt(value ? value.toISOString() : null))}
                    onCompletedAtChange={(value) => dispatch(setCompletedAt(value ? value.toISOString() : null))}
                    onArrivalAtShipperChange={(value) =>
                      dispatch(setArrivalAtShipper(value ? value.toISOString() : null))
                    }
                    onArrivalAtReceiverChange={(value) =>
                      dispatch(setArrivalAtReceiver(value ? value.toISOString() : null))
                    }
                    onLeftShipperChange={(value) => dispatch(setLeftShipper(value ? value.toISOString() : null))}
                    onLeftReceiverChange={(value) => dispatch(setLeftReceiver(value ? value.toISOString() : null))}
                    isEditing={isEditing}
                    isTabValid={isTimelineValid()}
                    onPrevTab={prevStep}
                    onNextTab={nextStep}
                  />
                )}

                {/* FINANCIAL */}
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
            <Divider
              sx={{
                width: "100%",
                mb: 1.5,
                borderColor: alpha(theme.currentPalette.text, 0.12),
              }}
            />
            {/* footer */}
            <Box
              sx={{
                // mt: 3,
                display: "flex",
                pb: 2,
                px: 2,
                alignItems: "center",
                justifyContent: "space-between",
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
                type={isLastStep ? "submit" : "button"}
                form={isLastStep ? "load-form" : undefined}
                onClick={isLastStep ? undefined : nextStep}
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
                  ? (isEditMode ? "Update Load" : "Create Load")
                  : "Next"}
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent >
    </Dialog >
  );
};

export default CreateEditLoadModal;