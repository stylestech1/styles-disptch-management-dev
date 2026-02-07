/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import StatsCard from "@/components/ui/StatsCard";
import { useAppSelector, RootState } from "@/redux/store";
import toast, { Toaster } from "react-hot-toast";

import {
  Box,
  Button,
  Typography,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Chip,
  IconButton,
  Menu,
} from "@mui/material";

import { CiLock, CiMap, CiUnlock, CiWarning } from "react-icons/ci";
import { PiBuildingOfficeLight } from "react-icons/pi";
import { TbBuilding } from "react-icons/tb";
import React, { Suspense, useState, lazy, useEffect, useMemo } from "react";

import {
  useCreateServiceCenterMutation,
  useGetServiceCentersQuery,
  useUpdateServiceCenterMutation,
  useDeleteServiceCenterMutation,
} from "@/redux/slices/apiSlice";

import { FiSearch } from "react-icons/fi";
import {
  MdOutlineLocationOn,
  MdOutlineEmail,
  MdOutlinePhone,
  MdOutlineAccessTime,
  MdModeEdit,
  MdDelete,
} from "react-icons/md";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { LuCopy } from "react-icons/lu";

import AddEditMaintenanceCenterDialog, {
  AddEditMode,
  DayKey,
  MaintenanceCenterForm,
} from "@/components/truck/centermaintenance/createEditModal";
import { TPlace } from "@/components/sections/LocationAutocomplete";

type StatusFilter = "All" | "Opened" | "Closed" | "Inactive";

type ServiceCenter = {
  id: string;
  name: string;
  active?: boolean; // ✅ endpoint key
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  availability?: string;
  services?: string[];
  googlePlaceId?: string; // ✅ saved place_id
  notes?: string;
  location?: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
};

type PlaceHoursCache = Record<
  string,
  {
    openNow: boolean;
    fetchedAt: number;
  }
>;

const DAY_LABEL: Record<DayKey, string> = {
  SUN: "Sun",
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
};

const to12h = (hhmm: string) => {
  if (!hhmm) return "";
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;

  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
};

const buildAvailability = (form: MaintenanceCenterForm) => {
  const start = DAY_LABEL[form.workStartDay];
  const end = DAY_LABEL[form.workEndDay];

  const from = to12h(form.workFrom);
  const to = to12h(form.workTo);

  if (!from || !to) return "";
  return `${start}-${end}: ${from} - ${to}`;
};

function statusStyles(status: "Opened" | "Closed" | "Inactive") {
  if (status === "Opened") return { bg: "#E7F3FF", color: "#1E5FA8", border: "#CFE6FF" };
  if (status === "Closed") return { bg: "#FDECEC", color: "#A61B1B", border: "#F8C9C9" };
  return { bg: "#EEF1F5", color: "#51606F", border: "#D8DEE6" };
}

const getErrorMessage = (err: any) => {
  const data = err?.data;

  if (!data) return err?.error || err?.message || "Something went wrong";
  if (typeof data === "string") return data;

  if (Array.isArray(data?.errors)) {
    return data.errors.map((e: any) => e?.msg || e?.message || JSON.stringify(e)).join(", ");
  }

  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;

  try {
    return JSON.stringify(data);
  } catch {
    return "Something went wrong";
  }
};

const trimOrEmpty = (v?: string | null) => (v?.trim() ? v.trim() : "");

const formatAddress = (c: ServiceCenter) => {
  const addr = trimOrEmpty(c.address);
  const city = trimOrEmpty(c.city);
  const state = trimOrEmpty(c.state);

  const parts: string[] = [];
  if (addr) parts.push(addr);

  if (city && !addr.toLowerCase().includes(city.toLowerCase())) parts.push(city);
  if (state && !addr.toLowerCase().includes(state.toLowerCase())) parts.push(state);

  return parts.join(", ");
};

// ✅ Accurate open/close from Google Places JS (no CORS)
function getOpenNowFromPlaces(placeId: string): Promise<boolean | null> {
  return new Promise((resolve) => {
    const g = (window as any).google;
    if (!g?.maps?.places?.PlacesService) return resolve(null);

    const service = new g.maps.places.PlacesService(document.createElement("div"));

    service.getDetails(
      { placeId, fields: ["opening_hours"] },
      (place: any, status: any) => {
        const ok = status === g.maps.places.PlacesServiceStatus.OK;
        if (!ok) return resolve(null);

        // ✅ Most accurate:
        // opening_hours.isOpen() uses place timezone
        const isOpenFn = place?.opening_hours?.isOpen;
        if (typeof isOpenFn === "function") return resolve(!!isOpenFn.call(place.opening_hours));

        // fallback
        return resolve(!!place?.opening_hours?.open_now);
      }
    );
  });
}

function getComputedStatus(center: ServiceCenter, cache: PlaceHoursCache): "Opened" | "Closed" | "Inactive" {
  if (center.active === false) return "Inactive";

  const pid = center.googlePlaceId;
  if (!pid) return "Closed"; // no placeId => closed

  const info = cache[pid];
  if (!info) return "Closed"; // until fetched

  return info.openNow ? "Opened" : "Closed";
}

export default function CenterMaintenance() {
  const theme = useAppSelector((state: RootState) => state.palette);

  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [showMaps, setShowMaps] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");

  const [selectedCenter, setSelectedCenter] = useState<ServiceCenter | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuCenter, setMenuCenter] = useState<ServiceCenter | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<AddEditMode>("add");
  const [editInitial, setEditInitial] = useState<Partial<MaintenanceCenterForm> | undefined>(undefined);
  const [dayPickPhase, setDayPickPhase] = useState<"start" | "end">("start");

  // ✅ cache open/close from Google
  const [hoursCache, setHoursCache] = useState<PlaceHoursCache>({});

  const openAdd = () => {
    setSelectedCenter(null);
    setDialogMode("add");
    setEditInitial(undefined);
    setDialogOpen(true);
  };

  const parseAvailabilityToForm = (availability?: string) => {
    if (!availability) return null;

    const parts = availability.split(":");
    if (parts.length < 2) return null;

    const daysPart = parts[0].trim();
    const timePart = parts.slice(1).join(":").trim();

    const [d1Raw, d2Raw] = daysPart.split("-").map((s) => s.trim());
    const [t1Raw, t2Raw] = timePart.split("-").map((s) => s.trim());

    const labelToDayKey = (lbl: string): DayKey | null => {
      const normalized = lbl.toLowerCase();
      const entry = Object.entries(DAY_LABEL).find(([, v]) => v.toLowerCase() === normalized);
      return (entry?.[0] as DayKey) ?? null;
    };

    const from12hTo24h = (t: string) => {
      const m = t.replace(/\s+/g, " ").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (!m) return "";
      let hh = Number(m[1]);
      const mm = m[2];
      const ap = m[3].toUpperCase();
      if (ap === "AM" && hh === 12) hh = 0;
      if (ap === "PM" && hh !== 12) hh += 12;
      return `${String(hh).padStart(2, "0")}:${mm}`;
    };

    const startKey = labelToDayKey(d1Raw);
    const endKey = labelToDayKey(d2Raw);

    return {
      workStartDay: startKey ?? undefined,
      workEndDay: endKey ?? undefined,
      workFrom: t1Raw ? from12hTo24h(t1Raw) : undefined,
      workTo: t2Raw ? from12hTo24h(t2Raw) : undefined,
    };
  };

  const openEdit = (center: ServiceCenter) => {
    setSelectedCenter(center);
    setDialogMode("edit");

    const addressText =
      (center.address && center.address.trim()) || [center.city, center.state].filter(Boolean).join(", ");

    const parsed = parseAvailabilityToForm(center.availability);

    setEditInitial({
      name: center.name ?? "",
      location: addressText
        ? ({
          display_name: addressText,
          // ⚠️ IMPORTANT: your autocomplete should pass real lat/lon in add/edit
          lat: String(center.location?.coordinates?.[1] ?? "0"),
          lon: String(center.location?.coordinates?.[0] ?? "0"),
          place_id: center.googlePlaceId || `temp_center_${center.id}`,
          city: center.city ?? "",
          state: center.state ?? "",
        } as any as TPlace)
        : null,
      phone: center.phone ?? "",
      status: center.active ? "Active" : "Inactive",
      email: center.email ?? "",
      services: center.services ?? [],
      notes: (center as any).notes ?? "",
      workStartDay: (parsed?.workStartDay as DayKey) ?? "",
      workEndDay: (parsed?.workEndDay as DayKey) ?? "",
      workFrom: parsed?.workFrom ?? "",
      workTo: parsed?.workTo ?? "",
    });

    setDialogOpen(true);
  };

  const closeDialog = () => setDialogOpen(false);

  const [createCenter, { isLoading: creating }] = useCreateServiceCenterMutation();
  const [updateCenter, { isLoading: updating }] = useUpdateServiceCenterMutation();
  const [deleteCenter, { isLoading: deleting }] = useDeleteServiceCenterMutation();

  const { data, isLoading, error, refetch } = useGetServiceCentersQuery({ page: 1, limit: 50 });

  const centers: ServiceCenter[] = useMemo(() => (data?.data ?? []) as ServiceCenter[], [data]);

  useEffect(() => {
    if (error) console.error("Service Centers error:", error);
  }, [error]);

  // ✅ Refresh open/close for all centers (accurate by place timezone)
  const refreshAllOpenStatus = async () => {
    const ids = centers.map((c) => c.googlePlaceId).filter(Boolean) as string[];
    const unique = Array.from(new Set(ids));

    for (const placeId of unique) {
      // If google script not loaded yet => skip
      const openNow = await getOpenNowFromPlaces(placeId);
      if (openNow === null) continue;

      setHoursCache((prev) => ({
        ...prev,
        [placeId]: { openNow, fetchedAt: Date.now() },
      }));
    }
  };

  // initial load when centers change
  useEffect(() => {
    if (!centers.length) return;
    refreshAllOpenStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centers]);

  // periodic refresh so it flips after 3AM automatically
  useEffect(() => {
    const id = setInterval(() => {
      if (!centers.length) return;
      refreshAllOpenStatus();
    }, 60 * 1000); // every 1 minute (change to 5*60*1000 if you want)
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centers]);

  const stats = useMemo(() => {
    const total = centers.length;
    let opened = 0;
    let closed = 0;
    let inactive = 0;

    centers.forEach((c) => {
      const st = getComputedStatus(c, hoursCache);
      if (st === "Opened") opened++;
      else if (st === "Closed") closed++;
      else inactive++;
    });

    return { total, opened, closed, inactive };
  }, [centers, hoursCache]);

  const filteredCenters = useMemo(() => {
    const q = search.trim().toLowerCase();

    return centers.filter((c) => {
      const st = getComputedStatus(c, hoursCache);
      const matchesStatus = status === "All" ? true : st === status;

      const haystack = [c?.name, c?.state, c?.city, c?.address, c?.email, c?.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = q ? haystack.includes(q) : true;
      return matchesStatus && matchesSearch;
    });
  }, [centers, search, status, hoursCache]);

  const openMenu = (e: React.MouseEvent<HTMLElement>, center: ServiceCenter) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuCenter(center);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuCenter(null);
  };

  const copyCenter = async (e: React.MouseEvent, center: ServiceCenter) => {
    e.stopPropagation();
    const text = `
Center Name: ${center?.name ?? ""}\n
Location: ${formatAddress(center)}\n
Phone: ${center?.phone ?? ""}\n
Email: ${center?.email ?? ""}\n
Services: ${Array.isArray(center.services) ? center.services.join(", ") : ""}\n
Availability: ${center?.availability ?? ""}\n
Notes: ${(center as any)?.notes ?? ""}\n`;

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied successfully");
    } catch (err) {
      console.error("copy failed", err);
      toast.error("Copy failed");
    }
  };

  const handleSubmitCenter = async (payload: MaintenanceCenterForm): Promise<void> => {
    if (!payload.name.trim()) {
      toast.error("Center name is required");
      return;
    }
    if (!payload.phone.trim()) {
      toast.error("Phone is required");
      return;
    }
    if (!payload.location?.display_name?.trim()) {
      toast.error("Location is required");
      return;
    }

    // ✅ ensure place_id exists (needed for accurate open/close)
    if (!(payload.location as any)?.place_id) {
      toast.error("Please select a location from suggestions (place_id missing)");
      return;
    }

    const fallbackCity = dialogMode === "edit" ? trimOrEmpty(selectedCenter?.city) : "";
    const fallbackState = dialogMode === "edit" ? trimOrEmpty(selectedCenter?.state) : "";

    const city = trimOrEmpty((payload.location as any)?.city) || fallbackCity;
    const state = trimOrEmpty((payload.location as any)?.state) || fallbackState;

    if (!city) {
      toast.error("City is required (backend validation)");
      return;
    }
    if (!state) {
      toast.error("State is required (backend validation)");
      return;
    }

    const availability = buildAvailability(payload);
    const isEdit = dialogMode === "edit";

    const lngFromUI = Number((payload.location as any)?.lon);
    const latFromUI = Number((payload.location as any)?.lat);

    const existingLng = selectedCenter?.location?.coordinates?.[0];
    const existingLat = selectedCenter?.location?.coordinates?.[1];

    const lng = isEdit ? (existingLng ?? lngFromUI) : lngFromUI;
    const lat = isEdit ? (existingLat ?? latFromUI) : latFromUI;

    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      toast.error("Location coordinates are missing (lat/lon)");
      return;
    }

    const bodyToApi: any = {
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      city,
      state,
      address: payload.location.display_name.trim(),
      location: { type: "Point", coordinates: [lng, lat] },

      email: trimOrEmpty(payload.email) || undefined,
      services: payload.services?.length ? payload.services : undefined,
      availability: availability || undefined,
      notes: trimOrEmpty(payload.notes) || undefined,

      active: payload.status === "Active",

      // ✅ must be the real google place_id
      googlePlaceId: (payload.location as any).place_id,

      workStartDay: payload.workStartDay,
      workEndDay: payload.workEndDay,
      workFrom: payload.workFrom,
      workTo: payload.workTo,
    };

    const loadingId = toast.loading(dialogMode === "add" ? "Creating center..." : "Updating center...");

    try {
      if (dialogMode === "add") {
        await createCenter(bodyToApi).unwrap();
        toast.success("Center created successfully", { id: loadingId });
      } else {
        if (!selectedCenter?.id) {
          toast.error("No center selected for update", { id: loadingId });
          return;
        }
        await updateCenter({ id: selectedCenter.id, body: bodyToApi }).unwrap();
        toast.success("Center updated successfully", { id: loadingId });
      }

      setDialogOpen(false);
      refetch();
    } catch (err: any) {
      console.error("submit error:", err);
      toast.error(getErrorMessage(err), { id: loadingId });
    }
  };

  const handleDeleteCenter = async (id: string) => {
    const loadingId = toast.loading("Deleting...");
    try {
      await deleteCenter(id).unwrap();
      toast.success("Center deleted", { id: loadingId });
      refetch();
    } catch (err: any) {
      console.error("delete error:", err);
      toast.error(getErrorMessage(err), { id: loadingId });
    }
  };

  const LazyGoogleMapsLoader = lazy(() => import("@/components/ui/GoogleMapsLoader"));
  const LazyMapWithRoute = lazy(() => import("@/components/ui/MapWithRoute"));

  const MapFallback = () => (
    <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg border border-gray-200">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
        <p className="text-gray-600">Loading Maps...</p>
      </div>
    </div>
  );

  const onSelectCenterFromList = (center: ServiceCenter) => {
    setSelectedCenter(center);
    setViewMode("map");
    setShowMaps(true);
  };

  return (
    <>
      <Box sx={{ p: 3 }}>
        <Toaster position="top-center" />

        {/* Stats */}
        <Box sx={{ mt: 3 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total Centers" value={String(stats.total)} icon={PiBuildingOfficeLight} iconColor={theme.currentPalette.primary} />
            <StatsCard title="Opened" value={String(stats.opened)} icon={CiUnlock} iconColor={theme.currentPalette.primary} />
            <StatsCard title="Closed" value={String(stats.closed)} icon={CiLock} iconColor={theme.currentPalette.primary} />
            <StatsCard title="Inactive" value={String(stats.inactive)} icon={CiWarning} iconColor={theme.currentPalette.primary} />
          </div>
        </Box>

        {/* Header */}
        <Box sx={{ mt: 4, pt: 2 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "column", md: "row" },
              gap: 2,
              mb: 2,
              alignItems: { xs: "stretch", md: "center" },
              justifyContent: { md: "space-between" },
            }}
          >
            <Box className="flex items-center gap-2">
              <CiMap size={24} color={theme.currentPalette.primary} />
              <Typography variant="h6" sx={{ color: theme.currentPalette.primary, fontWeight: 600 }}>
                Centers Overview
              </Typography>
            </Box>

            <Button
              onClick={openAdd}
              variant="contained"
              disabled={creating || updating || deleting}
              sx={{
                backgroundColor: theme.currentPalette.primary,
                color: "#fff",
                textTransform: "none",
                fontWeight: 500,
                "&:hover": { backgroundColor: theme.currentPalette.primary, opacity: 0.9 },
              }}
            >
              Add Maintenance center
            </Button>
          </Box>

          {/* Toggle */}
          <Box sx={{ mb: 2, width: "100%", position: "relative", zIndex: 10 }}>
            <Box
              sx={{
                display: "flex",
                backgroundColor: "#EAF2FF",
                borderRadius: "10px",
                padding: "4px",
                width: "100%",
                border: "1px solid #D6E6FF",
                position: "relative",
                zIndex: 10,
              }}
            >
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMode("map");
                  setShowMaps(true);
                }}
                sx={{
                  flex: 1,
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "8px",
                  py: 1.2,
                  backgroundColor: viewMode === "map" ? theme.currentPalette.primary : "transparent",
                  color: viewMode === "map" ? "#fff" : "#1B3B66",
                  gap: 1,
                }}
              >
                <CiMap size={22} />
                Map View
              </Button>

              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMode("list");
                }}
                sx={{
                  flex: 1,
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "8px",
                  py: 1.2,
                  backgroundColor: viewMode === "list" ? "#fff" : "transparent",
                  color: "#1B3B66",
                  gap: 1,
                }}
              >
                <TbBuilding size={22} />
                List View
              </Button>
            </Box>
          </Box>

          {/* Search + Filter */}
          {viewMode === "list" && (
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "column", md: "row" },
                gap: 2,
                mb: 2,
                alignItems: { xs: "stretch", md: "center" },
              }}
            >
              <TextField
                fullWidth
                placeholder="Search By Centers and States.."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FiSearch className={theme.currentPalette.primary} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  backgroundColor: "#fff",
                  "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                }}
              />

              <FormControl sx={{ minWidth: 160 }}>
                <Select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} sx={{ borderRadius: "10px", backgroundColor: "#fff" }}>
                  <MenuItem value="All">All Status</MenuItem>
                  <MenuItem value="Opened">Opened</MenuItem>
                  <MenuItem value="Closed">Closed</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Content */}
          <Box sx={{ mt: 2 }}>
            {viewMode === "map" ? (
              <Box
                sx={{
                  border: `1px solid #e0e0e0`,
                  borderRadius: "12px",
                  padding: 2,
                  backgroundColor: "#fff",
                  minHeight: "420px",
                }}
              >
                <div className="grid grid-cols-1 gap-6">
                  {showMaps ? (
                    <Suspense fallback={<MapFallback />}>
                      <LazyGoogleMapsLoader
                        onLoad={() => {
                          console.log("Maps loaded successfully");
                          // ✅ when google is ready, refresh open/close accurately
                          refreshAllOpenStatus();
                        }}
                        onError={(err) => console.error("Failed to load maps:", err)}
                      >
                        <LazyMapWithRoute
                          centers={filteredCenters}
                          selectedCenterId={selectedCenter?.id ?? null}
                          onCenterSelect={(c: any) => setSelectedCenter(c)}
                          height="420px"
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
              </Box>
            ) : (
              <Box sx={{ borderRadius: "12px", minHeight: "400px" }}>
                {isLoading ? (
                  <Typography sx={{ px: 2, color: "text.secondary" }}>Loading...</Typography>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {filteredCenters.map((center) => {
                      const st = getComputedStatus(center, hoursCache);
                      const stStyle = statusStyles(st);
                      const isSelected = selectedCenter?.id === center.id;

                      return (
                        <Box
                          key={center.id}
                          onClick={() => onSelectCenterFromList(center)}
                          sx={{
                            cursor: "pointer",
                            backgroundColor: "#fff",
                            borderRadius: "12px",
                            border: isSelected ? `2px solid ${theme.currentPalette.primary}` : "1px solid #D6E6FF",
                            boxShadow: "0 1px 0 rgba(16,24,40,.02)",
                            p: 2,
                            transition: "0.15s",
                            "&:hover": { backgroundColor: "#F8FBFF" },
                          }}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                              <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>{center.name}</Typography>

                              <Box
                                sx={{
                                  px: 1.2,
                                  py: 0.4,
                                  borderRadius: "8px",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  backgroundColor: stStyle.bg,
                                  color: stStyle.color,
                                  border: `1px solid ${stStyle.border}`,
                                }}
                              >
                                {st}
                              </Box>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <IconButton onClick={(e) => copyCenter(e, center)} sx={{ border: "1px solid #E5E7EB", borderRadius: "10px" }}>
                                <LuCopy size={18} />
                              </IconButton>

                              <IconButton onClick={(e) => openMenu(e, center)} sx={{ border: "1px solid #E5E7EB", borderRadius: "10px" }}>
                                <HiOutlineDotsHorizontal size={18} />
                              </IconButton>
                            </Box>
                          </Box>

                          <Box sx={{ mt: 1.5, display: "grid", gap: 0.8 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#475569" }}>
                              <MdOutlineLocationOn />
                              <Typography sx={{ fontSize: 13 }}>{formatAddress(center)}</Typography>
                            </Box>

                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#475569" }}>
                                <MdOutlinePhone />
                                <Typography sx={{ fontSize: 13 }}>{center.phone}</Typography>
                              </Box>

                              {center?.email && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#475569" }}>
                                  <MdOutlineEmail />
                                  <Typography sx={{ fontSize: 13 }}>{center.email}</Typography>
                                </Box>
                              )}
                            </Box>

                            {center?.availability && (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#475569" }}>
                                <MdOutlineAccessTime />
                                <Typography sx={{ fontSize: 13 }}>{center.availability}</Typography>
                              </Box>
                            )}
                          </Box>

                          {Array.isArray(center.services) && center.services.length > 0 && (
                            <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", gap: 1 }}>
                              {center.services.map((s, idx) => (
                                <Chip
                                  key={`${center.id}-srv-${idx}`}
                                  label={s}
                                  size="small"
                                  sx={{
                                    backgroundColor: "#EAF2FF",
                                    color: "#1E5FA8",
                                    fontWeight: 600,
                                    borderRadius: "999px",
                                  }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      );
                    })}

                    {filteredCenters.length === 0 && <Typography sx={{ px: 2, color: "text.secondary" }}>No centers found.</Typography>}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>

        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
          <MenuItem
            onClick={() => {
              if (menuCenter) openEdit(menuCenter);
              closeMenu();
            }}
            className="flex gap-1"
            sx={{ color: theme.currentPalette.primary }}
          >
            <MdModeEdit /> Edit Details
          </MenuItem>

          <MenuItem
            onClick={() => {
              if (menuCenter?.id) handleDeleteCenter(menuCenter.id);
              closeMenu();
            }}
            sx={{ color: "error.main" }}
            className="flex gap-1"
          >
            <MdDelete /> Delete
          </MenuItem>
        </Menu>
      </Box>

      <AddEditMaintenanceCenterDialog
        open={dialogOpen}
        mode={dialogMode}
        initialValues={editInitial}
        primaryColor={theme.currentPalette.primary}
        onClose={closeDialog}
        onSubmit={handleSubmitCenter}
        initialKey={selectedCenter?.id ?? "add"}
      />
    </>
  );
}
