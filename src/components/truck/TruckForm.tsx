/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { TTruck, TDriver } from "@/types/globalTypes";
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import React, { useMemo, useEffect, useRef, useState } from "react";
import { IoClose, IoPerson, IoAdd } from "react-icons/io5";
import { useForm, Controller } from "react-hook-form";
import { RootState, useAppSelector } from "@/redux/store";
import { CiCircleCheck } from "react-icons/ci";
import { Car, CalendarDays, IdCard, Truck, Building2, Fuel, Gauge, Weight, Shield, LandPlot, CarFront, ShieldUser } from "lucide-react";

export type TruckFormProps = {
  open: boolean;
  onClose: () => void;
  formData: Partial<TTruck>;
  onChange: <K extends keyof TTruck>(field: K, value: TTruck[K]) => void;
  onSubmit: () => void;
  editMode: boolean;
  isLoading: boolean;
  allDrivers: TDriver[];
  allTrucks: TTruck[];
  closeOnOutsideClick?: boolean;
  refetch?: () => void;
};

interface TruckFormData {
  model: string;
  plateNumber: string;
  type: string;
  year: string;
  capacity: string;
  fuelPerMile: string;
  totalMileage: number;
  assignedDriver: string;
  status: string;
  source: string;
}

const stepsDriver = ["Vehicle Information", "Operations & Assignment"];

export const TruckForm = React.memo(function TruckFormComp(props: TruckFormProps) {
  const {
    open,
    onClose,
    formData,
    onChange,
    onSubmit,
    editMode,
    isLoading,
    allDrivers,
    allTrucks,
    closeOnOutsideClick = true,
    refetch,
  } = props;

  const modalRef = useRef<HTMLDivElement>(null);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const theme = useAppSelector((state: RootState) => state.palette);

  const [activeStep, setActiveStep] = useState(0);

  // closing popup
  useEffect(() => {
    const handleBodyScroll = (shouldPrevent: boolean) => {
      document.body.style.overflow = shouldPrevent ? "hidden" : "unset";
    };
    handleBodyScroll(open);
    return () => handleBodyScroll(false);
  }, [open]);

  // closing popup with keyup (Esc)
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open && !isSelectOpen) {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isSelectOpen]);

  // handling select closing popups
  useEffect(() => {
    const checkSelectState = () => {
      const selectMenus = document.querySelectorAll(".MuiMenu-paper, .MuiPopover-root");
      const isOpenNow = Array.from(selectMenus).some((menu) => {
        const style = window.getComputedStyle(menu);
        return style.display !== "none" && style.visibility !== "hidden";
      });
      setIsSelectOpen(isOpenNow);
    };

    const interval = setInterval(checkSelectState, 120);
    return () => clearInterval(interval);
  }, [open]);

  // react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    trigger,
  } = useForm<TruckFormData>({
    defaultValues: {
      model: "",
      plateNumber: "",
      type: "",
      year: "",
      source: "",
      capacity: "",
      fuelPerMile: "",
      totalMileage: 0,
      assignedDriver: "",
      status: "",
    },
    mode: "onSubmit",
  });

  // when updating data
  const prevOpenRef = useRef(false);

  useEffect(() => {
    const justOpened = open && !prevOpenRef.current;
    prevOpenRef.current = open;

    if (!open) return;
    if (justOpened) {
      const raw = formData || {};

      reset({
        model: (raw as any).model ?? "",
        plateNumber: (raw as any).plateNumber ?? "",
        type: (raw as any).type ?? "",
        year: (raw as any).year ?? "",
        source: (raw as any).source ?? "",
        capacity: (raw as any).capacity ?? "",
        fuelPerMile: (raw as any).fuelPerMile ?? "",
        totalMileage: (raw as any).totalMileage ?? 0,
        assignedDriver:
          typeof (raw as any).assignedDriver === "object"
            ? (raw as any).assignedDriver?.id ?? ""
            : (raw as any).assignedDriver ?? "",
        status: (raw as any).status ?? "",
      });
      setActiveStep(0);
    }
  }, [open, formData, reset]);

  // assigned driver IDs
  const assignedDriverIds = useMemo(() => {
    if (!allTrucks || allTrucks.length === 0) return [];
    return allTrucks
      .filter((t) => (t as any).assignedDriver && t.id !== formData.id)
      .map((t) =>
        typeof (t as any).assignedDriver === "object"
          ? (t as any).assignedDriver.id
          : (t as any).assignedDriver
      )
      .filter(Boolean) as string[];
  }, [allTrucks, formData.id]);

  const availableUnassignedDrivers = useMemo(() => {
    if (!allDrivers) return [];
    return allDrivers.filter(
      (driver) => driver.status === "available" && !assignedDriverIds.includes(driver.id)
    );
  }, [allDrivers, assignedDriverIds]);

  const truckTypes = useMemo(() => ["reefer", "van"], []);
  const truckSource = useMemo(() => ["company", "other"], []);

  const inputSx = {
    "& .MuiFormLabel-asterisk": {
      color: "red",
    },
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      bgcolor: "#fff",
      "& fieldset": {
        borderColor: alpha(theme.currentPalette.text, 0.18),
      },
      "&:hover fieldset": {
        borderColor: alpha(theme.currentPalette.primary, 0.6),
      },
      "&.Mui-focused fieldset": {
        borderColor: theme.currentPalette.primary,
        borderWidth: 2,
      },
    },
    "& .MuiInputLabel-root": {
      color: alpha(theme.currentPalette.text, 0.55),
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: theme.currentPalette.primary,
    },
    "& .MuiFormHelperText-root": {
      marginLeft: 0,
    },
  };

  const selectMenuPaperSx = {
    borderRadius: 2,
    mt: 1,
    bgcolor: "#fff",
    boxShadow: "0 10px 30px rgba(13,71,161,0.15)",
    border: `1px solid ${alpha(theme.currentPalette.primary, 0.12)}`,
  };

  // Handle form submission
  const onSubmitForm = async (data: TruckFormData) => {
    Object.keys(data).forEach((key) => {
      const field = key as keyof TTruck;
      const value = (data as any)[key];
      onChange(field, value);
    });

    await onSubmit();
    if (refetch) refetch();

    if (!editMode) {
      reset({
        model: "",
        plateNumber: "",
        type: "",
        year: "",
        source: "",
        capacity: "",
        fuelPerMile: "",
        totalMileage: 0,
        assignedDriver: "",
        status: "",
      });
      // setActiveStep(0);
    }
  };

  // Handle field change with validation
  const handleFieldChange = async (field: keyof TruckFormData, value: string) => {
    setValue(field, value as never);
    await trigger(field);
    onChange(field as keyof TTruck, value as any);
  };

  const handleNumberChange = async (field: keyof TruckFormData, value: string) => {
    const numValue = value === "" ? 0 : Number(value);
    setValue(field, numValue as never);
    await trigger(field);
    onChange(field as keyof TTruck, numValue as any);
  };

  const handleClose = () => {
    reset();
    setActiveStep(0);
    onClose();
  };

  const validateStep0 = async () => {
    const ok = await trigger(["model", "plateNumber", "year", "type", "source", "status"]);
    return ok;
  };

  const StepperHeader = () => {
    return (
      <Box sx={{ px: 3, pt: 2, backgroundColor: "#fff", flex: "0 0 auto" }}>
        <Box sx={{ mb: 1 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              position: "relative",
              px: 0.5,
            }}
          >
            {/* line */}
            <Box
              sx={{
                position: "absolute",
                top: "22px",
                left: "11%",
                width: "78%",
                height: 2,
                bgcolor:
                  activeStep === 1
                    ? alpha(theme.currentPalette.primary, 0.45)
                    : alpha(theme.currentPalette.primary, 0.18),
                zIndex: 0,
              }}
            />

            {stepsDriver.map((label, i) => {
              const isActive = i === activeStep;
              const isCompleted = i < activeStep;

              const borderColor =
                isActive || isCompleted
                  ? theme.currentPalette.primary
                  : alpha(theme.currentPalette.text, 0.2);

              const bgColor = isCompleted
                ? theme.currentPalette.primary
                : isActive
                  ? "#fff"
                  : "#fff";

              const textColor = isCompleted ? "#fff" : theme.currentPalette.primary;

              return (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    zIndex: 1,
                    minWidth: 130,
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      border: "3px solid",
                      borderColor,
                      bgcolor: bgColor,
                      color: isCompleted ? "#fff" : theme.currentPalette.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                    }}
                  >
                    {isCompleted ? <CiCircleCheck size={22} /> : i + 1}
                  </Box>

                  <Typography
                    sx={{
                      mt: 1,
                      fontSize: 12.5,
                      fontWeight: 700,
                      textAlign: "center",
                      color: isActive
                        ? theme.currentPalette.primary
                        : alpha(theme.currentPalette.text, 0.25),
                      lineHeight: 1.1,
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    );
  };

  if (!open) return null;

  return (
    <div
      onClick={(e) => {
        if (
          closeOnOutsideClick &&
          modalRef.current &&
          !modalRef.current.contains(e.target as Node) &&
          !isSelectOpen
        ) {
          handleClose();
        }
      }}
      className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4"
    >
      <Box
        ref={modalRef}
        sx={{
          bgcolor: "#fff",
          borderRadius: 2,
          border: `1px solid ${alpha(theme.currentPalette.primary, 0.12)}`,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${alpha(theme.currentPalette.text, 0.08)}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(theme.currentPalette.primary, 0.08),
                border: `1px solid ${alpha(theme.currentPalette.primary, 0.12)}`,
                color: theme.currentPalette.primary,
              }}
            >
              <Truck size={16} />
            </Box>

            <Typography
              sx={{
                fontSize: 16,

                color: theme.currentPalette.primary,
              }}
            >
              {editMode ? "Edit Truck" : "Add New Truck"}
            </Typography>
          </Box>

          <Button
            onClick={handleClose}
            sx={{
              minWidth: "unset",
              px: 1,
              color: alpha(theme.currentPalette.text, 0.55),
              "&:hover": { bgcolor: alpha(theme.currentPalette.primary, 0.06) },
            }}
          >
            <IoClose size={22} />
          </Button>
        </Box>

        {/* Stepper */}
        <StepperHeader />

        {/* Content */}
        <Box sx={{ px: 3, pb: 3 }}>
          <form onSubmit={handleSubmit(onSubmitForm)}>
            {/* ================= STEP 1 ================= */}
            {activeStep === 0 && (
              <Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2, mt: 2 }}>
                  {/* Model */}
                  <Controller
                    name="model"
                    control={control}
                    rules={{
                      required: "Model is required",
                      minLength: { value: 2, message: "Model must be at least 2 characters" },
                      maxLength: { value: 50, message: "Model must be less than 50 characters" },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Model"
                        placeholder="e.g. Freightliner cascadia"
                        error={!!errors.model}
                        helperText={errors.model?.message}
                        required
                        fullWidth
                        size="medium"
                        onChange={(e) => handleFieldChange("model", e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start" sx={{ color: alpha(theme.currentPalette.text, 0.55) }}>
                              <CarFront size={18} color={theme.currentPalette.primary} />
                            </InputAdornment>
                          ),
                        }}
                        sx={inputSx}
                      />
                    )}
                  />

                  {/* Plate + Year */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <Controller
                      name="plateNumber"
                      control={control}
                      rules={{
                        required: "Plate number is required",
                        minLength: { value: 3, message: "Plate number must be at least 3 characters" },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Plate Number"
                          placeholder="e.g. ABC-123"
                          error={!!errors.plateNumber}
                          helperText={errors.plateNumber?.message}
                          fullWidth
                          size="medium"
                          onChange={(e) => handleFieldChange("plateNumber", e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start" sx={{ color: alpha(theme.currentPalette.text, 0.55) }}>
                                <IdCard size={18} color={theme.currentPalette.primary} />
                              </InputAdornment>
                            ),
                          }}
                          sx={inputSx}
                        />
                      )}
                    />

                    <Controller
                      name="year"
                      control={control}
                      rules={{
                        required: "Year is required",
                        min: { value: 1900, message: "Year must be 1900 or later" },
                        max: {
                          value: new Date().getFullYear() + 1,
                          message: `Year cannot be later than ${new Date().getFullYear() + 1}`,
                        },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Year"
                          required
                          placeholder="e.g. 2014"
                          error={!!errors.year}
                          helperText={errors.year?.message}
                          fullWidth
                          size="medium"
                          onChange={(e) => handleFieldChange("year", e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start" sx={{ color: alpha(theme.currentPalette.text, 0.55) }}>
                                <CalendarDays size={18} color={theme.currentPalette.primary} />
                              </InputAdornment>
                            ),
                          }}
                          sx={inputSx}
                        />
                      )}
                    />
                  </Box>

                  {/* Type + Ownership */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <Controller
                      name="type"
                      control={control}

                      rules={{ required: "Type is required" }}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.type} sx={inputSx as any}>
                          <InputLabel required>Type</InputLabel>
                          <Select
                            {...field}
                            label="Type"
                            displayEmpty
                            size="medium"
                            value={field.value || ""}
                            onChange={(e) => handleFieldChange("type", String(e.target.value))}
                            MenuProps={{ PaperProps: { sx: selectMenuPaperSx } }}
                            startAdornment={
                              <InputAdornment position="start" sx={{ color: alpha(theme.currentPalette.text, 0.55) }}>
                                <Truck size={18} color={theme.currentPalette.primary} />
                              </InputAdornment>
                            }
                          >
                            <MenuItem value="" disabled>
                              Select type
                            </MenuItem>
                            {truckTypes.map((t) => (
                              <MenuItem key={t} value={t}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.type && (
                            <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                              {errors.type.message}
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    />

                    <Controller
                      name="source"
                      control={control}
                      rules={{ required: "Ownership is required" }}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.source} sx={inputSx as any}>
                          <InputLabel required >Ownership</InputLabel>
                          <Select
                            {...field}
                            label="Ownership"
                            value={field.value || ""}
                            displayEmpty
                            size="medium"
                            onChange={(e) => handleFieldChange("source", String(e.target.value))}
                            MenuProps={{ PaperProps: { sx: selectMenuPaperSx } }}
                            startAdornment={
                              <InputAdornment position="start" sx={{ color: alpha(theme.currentPalette.text, 0.55) }}>
                                <Building2 size={18} color={theme.currentPalette.primary} />
                              </InputAdornment>
                            }
                          >
                            <MenuItem value="" disabled>
                              Select Ownership
                            </MenuItem>
                            {truckSource.map((s) => (
                              <MenuItem key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.source && (
                            <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                              {errors.source.message}
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    />
                  </Box>

                  {/* Status */}
                  <Controller
                    name="status"
                    control={control}
                    rules={{ required: "Status is required" }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.status} sx={inputSx as any}>
                        <InputLabel required>Status</InputLabel>
                        <Select
                          {...field}
                          label="Status"
                          value={field.value || ""}
                          displayEmpty
                          size="medium"
                          onChange={(e) => handleFieldChange("status", String(e.target.value))}
                          MenuProps={{ PaperProps: { sx: selectMenuPaperSx } }}
                          startAdornment={
                            <InputAdornment position="start" sx={{ color: alpha(theme.currentPalette.text, 0.55) }}>
                              <CiCircleCheck size={18} color={theme.currentPalette.primary} />
                            </InputAdornment>
                          }
                        >
                          <MenuItem value="" disabled>
                            Select Status
                          </MenuItem>
                          <MenuItem value="available">Available</MenuItem>
                          <MenuItem value="busy">Busy</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                        </Select>
                        {errors.status && (
                          <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                            {errors.status.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                </Box>

                <Button
                  type="button"
                  fullWidth
                  onClick={async () => {
                    const ok = await validateStep0();
                    if (!ok) return;
                    setActiveStep(1);
                  }}
                  sx={{
                    mt: 3,
                    py: 1.35,
                    borderRadius: 2,
                    fontWeight: 700,
                    color: "#fff",
                    background: theme.currentPalette.primary,
                    textTransform: "none",
                    "&:hover": {
                      background: alpha(theme.currentPalette.primary, 0.9),
                    },
                  }}
                >
                  Next
                </Button>
              </Box>
            )}

            {/* ================= STEP 2 ================= */}
            {activeStep === 1 && (
              <Box>


                <Typography
                  sx={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: theme.currentPalette.text,
                    mt: 2,
                    mb: 1,
                  }}
                >
                  Specifications
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  {/* Capacity */}
                  <Controller
                    name="capacity"
                    control={control}
                    rules={{ required: "Capacity is required" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Capacity"
                        required
                        placeholder="e.g. 15000"
                        error={!!errors.capacity}
                        helperText={errors.capacity?.message}
                        fullWidth
                        size="medium"
                        onChange={(e) => handleFieldChange("capacity", e.target.value)}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end" sx={{ color: alpha(theme.currentPalette.text, 0.55) }}>
                              Kg
                            </InputAdornment>
                          ),
                        }}
                        sx={inputSx}
                      />
                    )}
                  />

                  {/* Fuel */}
                  <Controller
                    name="fuelPerMile"
                    control={control}
                    rules={{
                      required: "Fuel / Mile is required",
                      validate: (v) => (!isNaN(Number(v)) ? true : "Please enter a valid number"),
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Fuel / Mile"
                        placeholder="e.g. 0.45"
                        required
                        error={!!errors.fuelPerMile}
                        helperText={errors.fuelPerMile?.message}
                        fullWidth
                        size="medium"
                        onChange={(e) => handleFieldChange("fuelPerMile", e.target.value)}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end" sx={{ color: alpha(theme.currentPalette.text, 0.55) }}>
                              L/Mile
                            </InputAdornment>
                          ),
                        }}
                        sx={inputSx}
                      />
                    )}
                  />
                </Box>

                {/* Total mileage */}
                <Controller
                  name="totalMileage"
                  control={control}
                  rules={{
                    required: "Total Mileage is required",
                    validate: (value) => {
                      const num = Number(value);
                      return !isNaN(num) || "Please enter a valid number";
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Total Mileage"
                      required
                      type="text"
                      error={!!errors.totalMileage}
                      helperText={errors.totalMileage?.message}
                      size="medium"
                      placeholder="e.g. 20000"
                      onChange={(e) => handleFieldChange("totalMileage", e.target.value)}
                      sx={{ ...inputSx, mt: 2 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ color: alpha(theme.currentPalette.text, 0.55) }}>
                            <LandPlot size={18} color={theme.currentPalette.primary} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />

                <Typography
                  sx={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: theme.currentPalette.text,
                    mt: 3,
                    mb: 1,
                  }}
                >
                  Driver Assignment
                </Typography>

                <Controller
                  name="assignedDriver"
                  control={control}
                  rules={{ required: "Assigned Driver is required" }}
                  render={({ field }) => (
                    <FormControl fullWidth size="medium" error={!!errors.assignedDriver} sx={inputSx as any}>
                      <InputLabel id="driver-assignment-label" required>Assigned Driver</InputLabel>
                      <Select
                        {...field}
                        labelId="driver-assignment-label"
                        label="Assigned Driver"
                        required
                        displayEmpty
                        value={field.value || ""}
                        onChange={(e) => handleFieldChange("assignedDriver", String(e.target.value))}
                        MenuProps={{ PaperProps: { sx: selectMenuPaperSx } }}
                        startAdornment={
                          <InputAdornment position="start" sx={{ color: alpha(theme.currentPalette.text, 0.55) }}>
                            <ShieldUser size={18} />
                          </InputAdornment>
                        }
                      >
                        <MenuItem value="" disabled>
                          Assigned Driver
                        </MenuItem>

                        {availableUnassignedDrivers.length > 0 ? (
                          availableUnassignedDrivers.map((driver) => (
                            <MenuItem key={driver.id} value={driver.id}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%" }}>
                                <Box
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    display: "grid",
                                    placeItems: "center",
                                    bgcolor: alpha(theme.currentPalette.primary, 0.1),
                                    color: theme.currentPalette.primary,
                                    border: `1px solid ${alpha(theme.currentPalette.primary, 0.18)}`,
                                    fontWeight: 800,
                                    fontSize: 12,
                                    flex: "0 0 auto",
                                  }}
                                >
                                  {driver.name?.charAt(0)?.toUpperCase() || "D"}
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontWeight: 700, fontSize: 13, color: theme.currentPalette.text }}>
                                    {driver.name}
                                  </Typography>
                                  <Typography sx={{ fontSize: 11.5, color: alpha(theme.currentPalette.text, 0.55) }}>
                                    ID: {driver.driverId || driver.id}
                                  </Typography>
                                </Box>
                              </Box>
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem disabled>No available drivers</MenuItem>
                        )}
                      </Select>

                      {errors.assignedDriver && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                          {errors.assignedDriver.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />

                {availableUnassignedDrivers.length === 0 && (
                  <Alert
                    severity="warning"
                    sx={{
                      mt: 2,
                      borderRadius: 2,
                      borderColor: theme.currentPalette.primary,
                      "& .MuiAlert-message": { fontSize: "0.875rem" },
                    }}
                    icon={false}
                  >
                    <span className="text-sm">
                      No available unassigned drivers. All drivers are currently assigned to other trucks or busy.
                    </span>
                  </Alert>
                )}

                {/* Buttons */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                    mt: 3,
                  }}
                >
                  <Button
                    type="button"
                    onClick={() => setActiveStep(0)}
                    variant="outlined"
                    sx={{
                      py: 1.2,
                      borderRadius: 2,
                      fontWeight: 700,
                      textTransform: "none",
                      borderColor: alpha(theme.currentPalette.primary, 0.4),
                      color: theme.currentPalette.primary,
                      "&:hover": {
                        borderColor: theme.currentPalette.primary,
                        bgcolor: alpha(theme.currentPalette.primary, 0.05),
                      },
                    }}
                  >
                    Back
                  </Button>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    sx={{
                      py: 1.2,
                      borderRadius: 2,
                      fontWeight: 800,
                      textTransform: "none",
                      color: "#fff",
                      background: theme.currentPalette.primary,
                      "&:hover": {
                        background: alpha(theme.currentPalette.primary, 0.9),
                      },
                    }}
                  >
                    {isLoading
                      ? editMode
                        ? "Saving..."
                        : "Creating..."
                      : editMode
                        ? "Save Changes"
                        : "Create Truck"}
                  </Button>
                </Box>
              </Box>
            )}
          </form>
        </Box>
      </Box>
    </div>
  );
});

TruckForm.displayName = "TruckForm";