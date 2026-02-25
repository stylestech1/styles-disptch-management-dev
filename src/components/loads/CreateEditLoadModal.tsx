import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import LocationAutocomplete, {
  TPlace,
} from "@/components/sections/LocationAutocomplete";
import Modal from "@/components/ui/Modals";

import {
  IoLocationOutline,
  IoDocumentText,
  IoCar,
  IoClose,
  IoAdd,
  IoEllipseOutline,
  IoCheckmarkCircleOutline,
  IoCheckmarkCircle,
} from "react-icons/io5";
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
  setActiveTab,
  setIsEditing,
  setEditingLoad,
  resetForm,
} from "@/redux/slices/loadsFormSlice";
import {
  useCreateLoadsMutation,
  useUpdateLoadsMutation,
} from "@/redux/slices/apiSlice";
import { RootState, useAppSelector } from "@/redux/store";
import {
  CreateEditLoadModalProps,
  TLoads,
  TTruckType,
} from "@/types/globalTypes";
import toast from "react-hot-toast";
import {
  Alert,
  alpha,
  Box,
  Button,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import LoadDetailsTab from "./tabsModal/LoadDetailsTab";
import AssignmentTab from "./tabsModal/AssignmentTab";
import FinancialTab from "./tabsModal/FinancialTab";
import { Adjustment } from "@/types/globalTypes";

// Lazy load the map components
const LazyGoogleMapsLoader = lazy(
  () => import("@/components/ui/GoogleMapsLoader"),
);
const LazyMapWithRoute = lazy(() => import("@/components/ui/MapWithRoute"));

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
    activeTab,
    isEditing,
  } = useSelector((state: RootState) => state.loadsForm);

  const theme = useAppSelector((state: RootState) => state.palette);

  // For Documents
  const [selectedDocuments, setSelectedDocuments] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);

  // Days.js
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

  const [createLoad, { isLoading: creatingLoad }] = useCreateLoadsMutation();
  const [updateLoad, { isLoading: updatingLoad }] = useUpdateLoadsMutation();

  const [dhoToOriginDistance, setDhoToOriginDistance] = useState<number | null>(
    null,
  );
  const [averageTime, setAverageTime] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [allDistance, setAllDistance] = useState<string>("");
  const [pricePerMile, setPricePerMile] = useState<number | null>(null);
  const [showMaps, setShowMaps] = useState(false);

  // Drag Handlers
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  // Drag Leave Handlers
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // Drag Over Handlers
  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) {
        setIsDragging(true);
      }
    },
    [isDragging],
  );

  // Drop Handlers
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    processFiles(Array.from(files));
  }, []);

  // Process Files (used by both drag & drop and file input)
  const processFiles = (files: File[]) => {
    setUploadError("");

    // Check documents limit
    const totalFiles = selectedDocuments.length + files.length;
    if (totalFiles > 2) {
      setUploadError("You can only upload maximum 2 files 😢");
      return;
    }

    // Validate PDF files
    const invalidFiles = files.filter((file) => {
      const fileExtension = file.name.toLowerCase().split(".").pop();
      return fileExtension !== "pdf" && file.type !== "application/pdf";
    });

    if (invalidFiles.length > 0) {
      setUploadError("Only PDF files are allowed 😒");
      return;
    }

    // Add files
    setSelectedDocuments((prev) => [...prev, ...files]);
  };

  // Handle File Selection (for file input)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    processFiles(Array.from(files));
    e.target.value = ""; // Reset input
  };

  // Remove a file
  const handleRemoveFile = (index: number) => {
    setSelectedDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  // Loading when open modal
  useEffect(() => {
    if (isOpen && editingLoad) {
      dispatch(resetForm());
      setSelectedDocuments([]);
      setUploadError("");

      setTimeout(() => {
        loadEditData(editingLoad);
      }, 50);
    } else if (isOpen && !editingLoad) {
      dispatch(resetForm());
      setSelectedDocuments([]);
      setUploadError("");
    }
  }, [isOpen, editingLoad]);

  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (isOpen && editingLoad) {
        setIsInitializing(true);
        try {
          await loadEditData(editingLoad);
        } catch (error) {
          console.error("Error loading edit data:", error);
        } finally {
          setTimeout(() => setIsInitializing(false), 500);
        }
      }
    };

    loadData();
  }, [isOpen, editingLoad]);

  // loading Maps on mounting
  useEffect(() => {
    if (isOpen && activeTab === 1) {
      setShowMaps(true);
    } else {
      setShowMaps(false);
    }
  }, [isOpen, activeTab]);

  // loading when edit
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

    dispatch(setDriverId(loadItem.driverId?.id || ""));
    dispatch(setTruckType((loadItem.truckType as TTruckType) || "reefer"));
    dispatch(setTruckId(loadItem.truckId?.truckId?.toString() || ""));
    dispatch(setTruckTemp(loadItem.truckTemp?.toString() || ""));

    if (loadItem.distanceMiles) {
      setAllDistance(loadItem.distanceMiles.toString());
    }
  };

  // Calculate distances
  useEffect(() => {
    const calculateDhoToOrigin = async () => {
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
      } catch (error) {
        console.error("Error calculating DHO to Origin distance:", error);
        setDhoToOriginDistance(null);
        setAverageTime(null);
      }
    };

    calculateDhoToOrigin();
  }, [dho, origin]);

  useEffect(() => {
    const calculateTotalDistance = async () => {
      const isValidPlace = (place: TPlace | null): place is TPlace => {
        return place !== null;
      };

      const validDestinations = destinations.filter(isValidPlace);

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

          setDistance(result.distance);
          setAllDistance(result.distance.toFixed(2));

          if (price && Number(price) > 0) {
            const perMile = Number(price) / result.distance;
            setPricePerMile(perMile);
          }
        } catch (error) {
          console.error("Error calculating total distance:", error);
          setDistance(null);
          setAllDistance("");
        }
      } else {
        setDistance(null);
        setAllDistance("");
      }
    };

    calculateTotalDistance();
  }, [origin, destinations, dho, price]);

  // Handle form submission
  const handleCreateLoad = async (e: React.FormEvent) => {
    e.preventDefault();

    const total = Number(price);
    const validDestinations = destinations.filter((dest) => dest !== null);

    if (!origin || validDestinations.length === 0) {
      toast.error("Please select origin and at least one destination");
      return;
    }

    if (!isEditing && (!driverId || !truckId)) {
      toast.error("Please select driver and truck");
      return;
    }

    if (!total || total <= 0) {
      toast.error("Please enter a valid total price");
      return;
    }

    const finalDistance = allDistance
      ? parseInt(allDistance)
      : Math.round(distance || 0);

    if (!finalDistance || finalDistance <= 0) {
      toast.error("Invalid distance calculated");
      return;
    }

    const formData = new FormData();

    if (origin && origin.display_name) {
      formData.append("origin[address]", origin.display_name);
    } else {
      console.error("❌ Origin is missing or invalid");
    }

    if (validDestinations.length > 0) {
      validDestinations.forEach((dest, index) => {
        if (dest && dest.display_name) {
          formData.append(`destination[${index}][address]`, dest.display_name);
        } else {
          console.error(`❌ Destination ${index} is missing or invalid`);
        }
      });
    } else {
      console.error("❌ No valid destinations found");
    }

    if (dho && dho.display_name) {
      formData.append("DHO[address]", dho.display_name);
    } else {
      console.log("ℹ️ DHO is optional, not added");
    }

    if (!isEditing) {
      if (driverId) {
        formData.append("driverId", driverId);
      }
      if (truckId) {
        formData.append("truckId", truckId);
      }
    }

    const commonFields = {
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
      selectedDocuments.forEach((file) => {
        formData.append("documents", file);
      });
    } else {
      console.log("ℹ️ No documents to add");
    }

    try {
      let createdLoadId: string | undefined;

      // Ensure adjustments array is always defined
      const loadAdjustments: Adjustment[] = adjustments || [];

      if (isEditing && editingLoad) {
        console.log("Load adjustments:", loadAdjustments);

        loadAdjustments.forEach((adj) => {
          if (adj.type === "Bonus") {
            formData.append("bonus", adj.amount.toString());
          } else if (adj.type === "Detention") {
            formData.append("detention", adj.amount.toString());
          } else if (adj.type === "Deduction") {
            formData.append("deduction", adj.amount.toString());
          }
        });

        await updateLoad({
          id: editingLoad.id,
          formData,
        }).unwrap();

        toast.success("Load updated ✅");

        createdLoadId = editingLoad.id;
      } else {
        console.log("🆕 Sending CREATE request...");
        const result = await createLoad(formData).unwrap();
        toast.success("Load created ✅");
        createdLoadId = result?.data?.id || result?.id;
      }

      handleClose();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      console.error("❌ Request failed:", err);
      toast.error(
        errorMessage || `Load ${isEditing ? "update" : "creation"} failed ❌`,
      );
    }
  };

  // Handling Errors
  const getErrorMessage = (error: unknown): string => {
    if (typeof error === "string") {
      return error;
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === "object" && error !== null && "data" in error) {
      const rtkError = error as { data?: { message?: string } };
      if (rtkError.data?.message) {
        return rtkError.data.message;
      }
    }

    if (typeof error === "object" && error !== null && "message" in error) {
      return (error as { message: string }).message;
    }

    return "An unknown error occurred";
  };

  // Handling Close
  const handleClose = () => {
    dispatch(resetForm());
    setSelectedDocuments([]);
    setUploadError("");
    setIsDragging(false);
    setShowMaps(false);
    onClose();
  };

  // Handle Price Change
  const handlePriceChange = (value: string) => {
    dispatch(setPrice(value));

    if (allDistance && Number(allDistance) > 0 && Number(value) > 0) {
      const perMile = Number(value) / Number(allDistance);
      setPricePerMile(perMile);
    } else {
      setPricePerMile(null);
    }
  };

  // Handle Foramting Time
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

  // Tab 1
  const isTab1Valid = (): boolean => {
    const hasValidDho = dho !== null && dho !== undefined;
    const hasValidOrigin = origin !== null && origin !== undefined;
    const hasValidDestinations =
      destinations.length > 0 &&
      destinations.every((dest) => dest !== null && dest !== undefined);

    return hasValidDho && hasValidOrigin && hasValidDestinations;
  };

  // Tab 2
  const isTab2Valid = (): boolean => {
    const hasValidPickupAt = pickupAt !== null;
    const hasValidCompletedAt = completedAt !== null;

    return hasValidPickupAt && hasValidCompletedAt;
  };

  // Tab 3
  const isTab3Valid = (): boolean => {
    const hasValidPrice = price.trim() !== "";
    const hasValidLoadID = loadIDInp.trim() !== "";

    return hasValidPrice && hasValidLoadID;
  };

  // Tab 4
  const isTab4Valid = (): boolean => {
    if (isEditing) {
      return !!(
        editingLoad?.driverId &&
        editingLoad?.truckId &&
        editingLoad?.truckType
      );
    } else {
      const hasValidDriverId = driverId.trim() !== "";
      const hasValidTruckType = truckType.trim() !== "";
      const hasValidTruckId = truckId.trim() !== "";

      return hasValidDriverId && hasValidTruckType && hasValidTruckId;
    }
  };

  // handling Destinations Action
  const handleAddDestination = () => {
    dispatch(addDestination());
  };
  const handleUpdateDestination = (index: number, place: TPlace | null) => {
    dispatch(updateDestination({ index, place }));
  };
  const handleRemoveDestination = (index: number) => {
    dispatch(removeDestination(index));
  };

  // Map fallback component
  const MapFallback = () => (
    <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg border border-gray-200">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading Maps...</p>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing && editingLoad ? `Edit Load` : "Create New Load"}
      desc="Complete all steps"
      size="xxl"
      closeOnOutsideClick={false}
    >
      <div className="flex flex-col h-full">
        <div className="flex">
          {/* Sidebar Navigation */}
          <Box
            className="w-64 p-5 border-r border-gray-200"
            sx={{ bgcolor: alpha(theme.currentPalette.text, 0.05) }}
          >
            {/* Step 1: Locations */}
            <div className="relative">
              <div
                className="absolute left-1/9 top-8.5 -translate-x-1/2 h-full w-px"
                style={{ backgroundColor: theme.currentPalette.primary }}
              />

              <div
                className={`mb-4 p-3 rounded-lg cursor-pointer transition-colors`}
                onClick={() => dispatch(setActiveTab(1))}
              >
                <div className="flex items-start">
                  <div className="mr-3">
                    {activeTab === 1 ? (
                      <Box
                        className={`h-6 w-6 rounded-full border-2 flex items-center justify-center`}
                        sx={{
                          color: theme.currentPalette.background,
                          bgcolor: theme.currentPalette.primary,
                          borderColor: theme.currentPalette.primary,
                        }}
                      >
                        <Typography variant="subtitle2" fontSize={12}>
                          1
                        </Typography>
                      </Box>
                    ) : (
                      <IoCheckmarkCircle
                        style={{ color: theme.currentPalette.primary }}
                        size={24}
                      />
                    )}
                  </div>
                  <div>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color:
                          activeTab === 1
                            ? theme.currentPalette.primary
                            : "inherit",
                      }}
                    >
                      Locations
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      Define pricing & delivery addresses
                    </Typography>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Load Details */}
            <div className="relative">
              <div
                className="absolute left-1/9 top-8.5 -translate-x-1/2 h-full w-px"
                style={{ backgroundColor: theme.currentPalette.primary }}
              />

              <div
                className={`mb-4 p-3 rounded-lg cursor-pointer transition-colors`}
                onClick={() => isTab1Valid() && dispatch(setActiveTab(2))}
              >
                <div className="flex items-start">
                  <div className="mr-3">
                    {activeTab === 2 ? (
                      <Box
                        className={`h-6 w-6 rounded-full border-2 flex items-center justify-center`}
                        sx={{
                          color: theme.currentPalette.background,
                          bgcolor: theme.currentPalette.primary,
                          borderColor: theme.currentPalette.primary,
                        }}
                      >
                        <Typography variant="subtitle2" fontSize={12}>
                          2
                        </Typography>
                      </Box>
                    ) : isTab1Valid() ? (
                      <IoCheckmarkCircle
                        style={{ color: theme.currentPalette.primary }}
                        size={24}
                      />
                    ) : (
                      <IoEllipseOutline
                        style={{
                          backgroundColor: alpha(
                            theme.currentPalette.text,
                            0.01,
                          ),
                        }}
                        size={24}
                      />
                    )}
                  </div>
                  <div>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color:
                          activeTab === 2
                            ? theme.currentPalette.primary
                            : isTab1Valid()
                              ? "inherit"
                              : "text.disabled",
                      }}
                    >
                      Timeline & Milestones
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: isTab1Valid()
                          ? "text.secondary"
                          : "text.disabled",
                      }}
                    >
                      Set planned schedules
                    </Typography>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Financials */}
            <div className="relative">
              <div
                className="absolute left-1/9 top-8.5 -translate-x-1/2 h-full w-px"
                style={{ backgroundColor: theme.currentPalette.primary }}
              />

              <div
                className={`mb-4 p-3 rounded-lg cursor-pointer transition-colors`}
                onClick={() =>
                  isTab1Valid() && isTab2Valid() && dispatch(setActiveTab(3))
                }
              >
                <div className="flex items-start">
                  <div className="mr-3">
                    {activeTab === 3 ? (
                      <Box
                        className={`h-6 w-6 rounded-full border-2 flex items-center justify-center`}
                        sx={{
                          color: theme.currentPalette.background,
                          bgcolor: theme.currentPalette.primary,
                          borderColor: theme.currentPalette.primary,
                        }}
                      >
                        <Typography variant="subtitle2" fontSize={12}>
                          3
                        </Typography>
                      </Box>
                    ) : isTab1Valid() && isTab2Valid() ? (
                      <IoCheckmarkCircle
                        style={{ color: theme.currentPalette.primary }}
                        size={24}
                      />
                    ) : (
                      <IoEllipseOutline
                        style={{
                          backgroundColor: alpha(
                            theme.currentPalette.text,
                            0.01,
                          ),
                        }}
                        size={24}
                      />
                    )}
                  </div>
                  <div>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color:
                          activeTab === 3
                            ? theme.currentPalette.primary
                            : isTab1Valid() && isTab2Valid()
                              ? "inherit"
                              : "text.disabled",
                      }}
                    >
                      Financials
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          isTab1Valid() && isTab2Valid()
                            ? "text.secondary"
                            : "text.disabled",
                      }}
                    >
                      Configure pricing & documents
                    </Typography>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Assignment */}
            <div
              className={`mb-4 p-3 rounded-lg cursor-pointer transition-colors`}
              onClick={() =>
                isTab1Valid() &&
                isTab2Valid() &&
                isTab3Valid() &&
                dispatch(setActiveTab(4))
              }
            >
              <div className="flex items-start">
                <div className="mr-3">
                  {activeTab === 4 ? (
                    <Box
                      className={`h-6 w-6 rounded-full border-2 flex items-center justify-center`}
                      sx={{
                        color: theme.currentPalette.background,
                        bgcolor: theme.currentPalette.primary,
                        borderColor: theme.currentPalette.primary,
                      }}
                    >
                      <Typography variant="subtitle2" fontSize={12}>
                        4
                      </Typography>
                    </Box>
                  ) : isTab1Valid() && isTab2Valid() && isTab3Valid() ? (
                    <IoCheckmarkCircle
                      style={{ color: theme.currentPalette.primary }}
                      size={24}
                    />
                  ) : (
                    <IoEllipseOutline
                      style={{
                        backgroundColor: alpha(theme.currentPalette.text, 0.01),
                      }}
                      size={24}
                    />
                  )}
                </div>
                <div>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      color:
                        activeTab === 4
                          ? theme.currentPalette.primary
                          : isTab1Valid() && isTab2Valid() && isTab3Valid()
                            ? "inherit"
                            : "text.disabled",
                    }}
                  >
                    Assignment
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color:
                        isTab1Valid() && isTab2Valid() && isTab3Valid()
                          ? "text.secondary"
                          : "text.disabled",
                    }}
                  >
                    Configure pricing & documents
                  </Typography>
                </div>
              </div>
            </div>
          </Box>

          {/* Main Content Area */}
          <div className="flex-1 p-5">
            <form
              onSubmit={handleCreateLoad}
              className="flex-1 overflow-auto p-4"
            >
              {/* Tab 1: Locations */}
              {activeTab === 1 && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col">
                      {/* Information Message */}
                      {allDistance && (
                        <Box
                          sx={{
                            border: `2px solid ${theme.currentPalette.primary}`,
                            borderRadius: 2,
                            p: 2,
                            mb: 2,
                          }}
                        >
                          <Box>
                            <Typography
                              variant="h4"
                              sx={{ fontSize: "18px", fontWeight: "bold" }}
                            >
                              Route Distance Information
                            </Typography>

                            <div className="flex items-center justify-between">
                              <p
                                style={{
                                  color: alpha(theme.currentPalette.text, 0.7),
                                }}
                              >
                                Total distance:
                              </p>
                              {destinations.filter((d) => d !== null).length >
                                0 ? (
                                <p style={{ color: theme.currentPalette.text }}>
                                  {
                                    destinations.filter((d) => d !== null)
                                      .length
                                  }{" "}
                                  destination(s)
                                </p>
                              ) : (
                                <p style={{ color: theme.currentPalette.text }}>
                                  Not calculated yet
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <p
                                style={{
                                  color: alpha(theme.currentPalette.text, 0.7),
                                }}
                              >
                                DHO to Origin:
                              </p>
                              {dho && origin ? (
                                <p style={{ color: theme.currentPalette.text }}>
                                  {dhoToOriginDistance?.toFixed(2) || "0"} miles
                                </p>
                              ) : (
                                <p style={{ color: theme.currentPalette.text }}>
                                  Not calculated yet
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <p
                                style={{
                                  color: alpha(theme.currentPalette.text, 0.7),
                                }}
                              >
                                Including:
                              </p>
                              {allDistance ? (
                                <p style={{ color: theme.currentPalette.text }}>
                                  {allDistance} miles
                                </p>
                              ) : (
                                <p style={{ color: theme.currentPalette.text }}>
                                  0 destination(s)
                                </p>
                              )}
                            </div>
                          </Box>
                        </Box>
                      )}

                      {/* Direction */}
                      <div className="space-y-6">
                        <LocationAutocomplete
                          label="DHO (Driver Home Origin)"
                          value={dho}
                          setValue={(place) => dispatch(setDho(place))}
                          placeholder="Enter driver's starting location"
                          // googleMapsApiKey={googleMapsApiKey!}
                          showZipCode={true}
                        />

                        <LocationAutocomplete
                          label="Pick Up (Origin)"
                          value={origin}
                          setValue={(place) => dispatch(setOrigin(place))}
                          placeholder="Enter origin address"
                          // googleMapsApiKey={googleMapsApiKey!}
                          showZipCode={true}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Typography
                              sx={{
                                color: theme.currentPalette.primary,
                                fontSize: "14px",
                                fontWeight: "bold",
                                display: "block",
                                mb: 1,
                              }}
                            >
                              DHO to Origin Distance
                            </Typography>
                            <div className="relative">
                              <TextField
                                type="text"
                                value={
                                  dhoToOriginDistance
                                    ? `${dhoToOriginDistance.toFixed(2)} miles`
                                    : ""
                                }
                                sx={{
                                  bgcolor: theme.currentPalette.background,
                                  color: theme.currentPalette.primary,
                                }}
                                className="block w-full px-3 py-3 border border-slate-300 rounded-lg font-medium"
                                aria-readonly
                                placeholder="Distance will auto-calculate"
                              />
                            </div>
                          </div>

                          <div>
                            <Typography
                              sx={{
                                color: theme.currentPalette.primary,
                                fontSize: "14px",
                                fontWeight: "bold",
                                display: "block",
                                mb: 1,
                              }}
                            >
                              Average Time To Pickup
                            </Typography>
                            <div className="relative">
                              <TextField
                                type="text"
                                value={
                                  averageTime
                                    ? `${formatTime(averageTime)}`
                                    : ""
                                }
                                sx={{
                                  bgcolor: theme.currentPalette.background,
                                  color: theme.currentPalette.primary,
                                }}
                                className="block w-full px-3 py-3 border border-slate-300 rounded-lg font-medium"
                                aria-readonly
                                placeholder="Time will auto-calculate"
                              />
                            </div>
                          </div>
                        </div>


                      </div>
                    </div>

                    {/* Maps - Load only when needed */}
                    <div className="grid grid-cols-1 gap-6">
                      {showMaps ? (
                        <Suspense fallback={<MapFallback />}>
                          <LazyGoogleMapsLoader
                            onLoad={() =>
                              console.log("Maps loaded successfully")
                            }
                            onError={(error) =>
                              console.error("Failed to load maps:", error)
                            }
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
                        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg border border-gray-200">
                          <div className="text-center text-gray-500">
                            <p>Map will load when needed</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
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
                      type="button"
                      onClick={() => dispatch(setActiveTab(2))}
                      disabled={!isTab1Valid()}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab 2: Load Details */}
              {activeTab === 2 && (
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
                    dispatch(
                      setLeftReceiver(value ? value.toISOString() : null),
                    )
                  }
                  isEditing={isEditing}
                  isTabValid={isTab2Valid()}
                  onPrevTab={() => dispatch(setActiveTab(1))}
                  onNextTab={() => dispatch(setActiveTab(3))}
                />
              )}

              {/* Tab 3: Financial */}
              {activeTab === 3 && (
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
                  isTabValid={isTab3Valid()}
                  onPrevTab={() => dispatch(setActiveTab(2))}
                  onNextTab={() => dispatch(setActiveTab(4))}
                />
              )}

              {/* Tab 4: Assignment */}
              {activeTab === 4 && (
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
                  isTabValid={isTab4Valid()}
                  onPrevTab={() => dispatch(setActiveTab(3))}
                  onSubmit={handleCreateLoad}
                  isLoading={creatingLoad || updatingLoad}
                />
              )}
            </form>
          </div>
        </div>
      </div>
    </Modal>
  );
};
export default CreateEditLoadModal;
