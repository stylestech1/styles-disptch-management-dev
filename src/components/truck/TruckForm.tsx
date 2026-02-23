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

export const TruckForm = React.memo(function TruckFormComp(
  props: TruckFormProps
) {
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
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose, isSelectOpen]);

  // handling select closing popups
  useEffect(() => {
    const checkSelectState = () => {
      const selectMenus = document.querySelectorAll(
        ".MuiMenu-paper, .MuiPopover-root"
      );
      const isOpen = Array.from(selectMenus).some((menu) => {
        const style = window.getComputedStyle(menu);
        return style.display !== "none" && style.visibility !== "hidden";
      });
      setIsSelectOpen(isOpen);
    };

    const interval = setInterval(checkSelectState, 100);

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
  useEffect(() => {
    if (formData && open) {
      const formFields: (keyof TruckFormData)[] = [
        "model",
        "plateNumber",
        "type",
        "year",
        "source",
        "capacity",
        "fuelPerMile",
        "totalMileage",
        "assignedDriver",
        "status",
      ];

      formFields.forEach((field) => {
        const value = formData[field];
        if (value !== undefined && value !== null) {
          setValue(field, value as never);
        }
      });
    }
  }, [formData, open, setValue]);

  // assigned driver IDs
  const assignedDriverIds = useMemo(() => {
    if (!allTrucks || allTrucks.length === 0) return [];
    return allTrucks
      .filter((truck) => truck.assignedDriver && truck.id !== formData.id)
      .map((truck) =>
        typeof truck.assignedDriver === "object"
          ? truck.assignedDriver.id
          : truck.assignedDriver
      )
      .filter(Boolean) as string[];
  }, [allTrucks, formData.id]);

  const availableUnassignedDrivers = useMemo(() => {
    if (!allDrivers) return [];
    return allDrivers.filter(
      (driver) =>
        driver.status === "available" && !assignedDriverIds.includes(driver.id)
    );
  }, [allDrivers, assignedDriverIds]);

  const truckTypes = useMemo(() => ["reefer", "van"], []);
  const truckSource = useMemo(() => ["company", "other"], []);

  // Handle form submission
  const onSubmitForm = async (data: TruckFormData) => {
    Object.keys(data).forEach((key) => {
      const field = key as keyof TTruck;
      const value = data[key as keyof TruckFormData];
      onChange(field, value as TTruck[keyof TTruck]);
    });
    await onSubmit();
    if (props.refetch) props.refetch();
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
    }
  };

  // Handle field change with validation
  const handleFieldChange = async (
    field: keyof TruckFormData,
    value: string
  ) => {
    setValue(field, value as never);
    await trigger(field);
    onChange(field as keyof TTruck, value as TTruck[keyof TTruck]);
  };

  // Handle number input change
  const handleNumberChange = async (
    field: keyof TruckFormData,
    value: string
  ) => {
    const numValue = value === "" ? 0 : Number(value);
    setValue(field, numValue as never);
    await trigger(field);
    onChange(field as keyof TTruck, numValue as TTruck[keyof TTruck]);
  };

  // Handle year input change
  const handleYearChange = async (value: string) => {
    setValue("year", value);
    await trigger("year");
    onChange("year", value);
  };

  // Reset form when closing
  const handleClose = () => {
    reset();
    onClose();
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
          onClose();
        }
      }}
      className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4"
    >
      <Box
        sx={{ bgcolor: theme.currentPalette.background }}
        ref={modalRef}
        className="relative rounded-2xl shadow-2xl border p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {!editMode && (
              <Box className="w-8 h-8 rounded-full flex items-center justify-center">
                <IoAdd size={18} />
              </Box>
            )}
            <h3 className="text-xl font-semibold text-slate-800">
              {editMode ? "Edit Truck" : "Add New Truck"}
            </h3>
          </div>
          <Button
            onClick={handleClose}
            className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
          >
            <IoClose size={24} />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <div className="space-y-6">
            {/* Basic Information Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-slate-800">
                  Basic Information
                </h4>
              </div>
              <Divider sx={{ mb: 3 }} />
              <div className="space-y-4">
                {/* Model Field */}
                <Controller
                  name="model"
                  control={control}
                  rules={{
                    required: "Model is required",
                    minLength: {
                      value: 2,
                      message: "Model must be at least 2 characters",
                    },
                    maxLength: {
                      value: 50,
                      message: "Model must be less than 50 characters",
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Model *"
                      error={!!errors.model}
                      helperText={errors.model?.message}
                      size="medium"
                      placeholder="e.g., Volvo FH16"
                      onChange={(e) =>
                        handleFieldChange("model", e.target.value)
                      }
                      sx={{
                        marginBottom: "16px",
                      }}
                    />
                  )}
                />

                {/* Plate Number Field */}
                <Controller
                  name="plateNumber"
                  control={control}
                  rules={{
                    required: "Plate number is required",
                    minLength: {
                      value: 3,
                      message: "Plate number must be at least 3 characters",
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Plate Number *"
                      error={!!errors.plateNumber}
                      helperText={errors.plateNumber?.message}
                      size="medium"
                      placeholder="e.g., ABC-12345"
                      onChange={(e) =>
                        handleFieldChange("plateNumber", e.target.value)
                      }
                      sx={{
                        marginBottom: "16px",
                      }}
                    />
                  )}
                />

                {/* Type Field */}
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: "Type is required" }}
                  render={({ field }) => (
                    <FormControl
                      fullWidth
                      size="medium"
                      error={!!errors.type}
                      sx={{ marginBottom: "16px" }}
                    >
                      <InputLabel>Type *</InputLabel>
                      <Select
                        {...field}
                        label="Type *"
                        error={!!errors.type}
                        onChange={(e) =>
                          handleFieldChange("type", e.target.value)
                        }
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "&:hover fieldset": {
                              borderColor: "#10b981",
                            },
                          },
                        }}
                      >
                        {truckTypes.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.type && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ mt: 1, display: "block" }}
                        >
                          {errors.type.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />

                {/* Source Field */}
                <Controller
                  name="source"
                  control={control}
                  rules={{ required: "Source is required" }}
                  render={({ field }) => (
                    <FormControl
                      fullWidth
                      size="medium"
                      error={!!errors.source}
                      sx={{ marginBottom: "16px" }}
                    >
                      <InputLabel>Source *</InputLabel>
                      <Select
                        {...field}
                        label="Source *"
                        value={field.value || ""}
                        error={!!errors.source}
                        onChange={(e) =>
                          handleFieldChange("source", e.target.value)
                        }
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "&:hover fieldset": {
                              borderColor: "#10b981",
                            },
                          },
                        }}
                      >
                        {truckSource.map((source) => (
                          <MenuItem key={source} value={source}>
                            {source.charAt(0).toUpperCase() + source.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.source && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ mt: 1, display: "block" }}
                        >
                          {errors.source.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />

                {/* Year Field */}
                <Controller
                  name="year"
                  control={control}
                  rules={{
                    required: "Year is required",
                    min: {
                      value: 1900,
                      message: "Year must be 1900 or later",
                    },
                    max: {
                      value: new Date().getFullYear() + 1,
                      message: `Year cannot be later than ${
                        new Date().getFullYear() + 1
                      }`,
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Year *"
                      type="text"
                      error={!!errors.year}
                      helperText={errors.year?.message}
                      size="medium"
                      inputProps={{
                        min: 1900,
                        max: new Date().getFullYear() + 1,
                      }}
                      onChange={(e) => handleYearChange(e.target.value)}
                      sx={{}}
                    />
                  )}
                />
              </div>
            </div>

            {/* Specifications Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-slate-800">
                  Specifications
                </h4>
              </div>
              <Divider sx={{ mb: 3 }} />
              <div className="space-y-4">
                {/* Capacity Field */}
                <Controller
                  name="capacity"
                  control={control}
                  rules={{
                    required: "Capacity is required",
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Capacity (kg) *"
                      type="text"
                      error={!!errors.capacity}
                      helperText={errors.capacity?.message}
                      size="medium"
                      inputProps={{ min: 0 }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">kg</InputAdornment>
                        ),
                      }}
                      onChange={(e) =>
                        handleNumberChange("capacity", e.target.value)
                      }
                      sx={{
                        marginBottom: "16px",
                      }}
                    />
                  )}
                />

                {/* Fuel Per Mile Field */}
                <Controller
                  name="fuelPerMile"
                  control={control}
                  rules={{
                    required: "Fuel per mile is required",
                    min: {
                      value: 0,
                      message: "Fuel per mile must be at least 0.1",
                    },
                    max: {
                      value: 100,
                      message: "Fuel consumption seems too high",
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Fuel Per Mile *"
                      type="text"
                      error={!!errors.fuelPerMile}
                      helperText={errors.fuelPerMile?.message}
                      size="medium"
                      inputProps={{ min: 0, step: 0.1 }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">L/mile</InputAdornment>
                        ),
                      }}
                      onChange={(e) =>
                        handleNumberChange("fuelPerMile", e.target.value)
                      }
                      sx={{}}
                    />
                  )}
                />

                {/* Total Milage */}
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
                      label="totalMileage *"
                      type="text"
                      error={!!errors.totalMileage}
                      helperText={errors.totalMileage?.message}
                      size="medium"
                      placeholder="e.g., 150000"
                      inputProps={{ min: 0, step: 100 }}
                      onChange={(e) =>
                        handleNumberChange("totalMileage", e.target.value)
                      }
                      sx={{ mt: 2 }}
                    />
                  )}
                />
              </div>
            </div>

            {/* Driver Assignment Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-slate-800">
                  Driver Assignment
                </h4>
              </div>
              <Divider sx={{ mb: 3 }} />
              <Controller
                name="assignedDriver"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="medium">
                    <InputLabel id="driver-assignment-label">
                      Assigned Driver
                    </InputLabel>
                    <Select
                      {...field}
                      labelId="driver-assignment-label"
                      label="Assigned Driver"
                      displayEmpty
                      onChange={(e) =>
                        handleFieldChange("assignedDriver", e.target.value)
                      }
                      startAdornment={
                        <InputAdornment
                          sx={{ color: theme.currentPalette.primary }}
                          position="start"
                        >
                          <IoPerson />
                        </InputAdornment>
                      }
                      sx={{
                        "& .MuiSelect-select": {
                          display: "flex",
                          alignItems: "center",
                        },
                        marginBottom: "8px",
                      }}
                    >
                      <MenuItem value="" disabled>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                            <IoPerson size={16} className="text-slate-500" />
                          </div>
                          <span className="text-slate-500 italic">
                            Unassigned
                          </span>
                        </Box>
                      </MenuItem>

                      {availableUnassignedDrivers.length > 0 ? (
                        availableUnassignedDrivers.map((driver) => (
                          <MenuItem key={driver.id} value={driver.id}>
                            <div className="flex items-center gap-3 w-full">
                              <Box
                                sx={{ bgcolor: theme.currentPalette.primary }}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                              >
                                {driver.name?.charAt(0)?.toUpperCase() || "D"}
                              </Box>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900 truncate">
                                  {driver.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-slate-500">
                                    ID: {driver.driverId || driver.id}
                                  </span>
                                  <span className="w-1 h-1 bg-slate-400 rounded-full" />
                                  <span className="text-xs text-slate-500 truncate">
                                    {driver.licenseNumber}
                                  </span>
                                </div>
                              </div>
                              <Chip
                                label="Available"
                                size="small"
                                sx={{
                                  fontSize: "0.625rem",
                                  height: 20,
                                  color: theme.currentPalette.primary,
                                  "& .MuiChip-label": { px: 1 },
                                }}
                              />
                            </div>
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>
                          <div className="flex items-center gap-3 w-full py-1">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                              <IoPerson size={20} className="text-slate-400" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-600">
                                No available drivers
                              </p>
                              <p className="text-xs text-slate-500">
                                All drivers are currently assigned or busy
                              </p>
                            </div>
                          </div>
                        </MenuItem>
                      )}
                    </Select>

                    {availableUnassignedDrivers.length === 0 && (
                      <Alert
                        severity="warning"
                        sx={{
                          mt: 2,
                          mb: 2,
                          borderRadius: 1,
                          borderColor: theme.currentPalette.primary,
                          "& .MuiAlert-message": { fontSize: "0.875rem" },
                        }}
                        icon={false}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs">
                            ⚠️
                          </div>
                          <span className="text-sm">
                            No available unassigned drivers. All drivers are
                            currently assigned to other trucks or busy.
                          </span>
                        </div>
                      </Alert>
                    )}

                    {availableUnassignedDrivers.length > 0 && (
                      <div className="flex justify-between mt-2 px-1 mb-2">
                        <Typography
                          sx={{
                            color: theme.currentPalette.primary,
                            fontSize: "14px",
                          }}
                        >
                          {availableUnassignedDrivers.length} available
                          unassigned driver
                          {availableUnassignedDrivers.length !== 1 ? "s" : ""}
                        </Typography>
                        <span className="text-xs text-slate-500">
                          Total: {allDrivers.length} drivers
                        </span>
                      </div>
                    )}
                  </FormControl>
                )}
              />
            </div>

            {/* Status Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-slate-800">Status</h4>
              </div>
              <Divider sx={{ mb: 3 }} />
              <Controller
                name="status"
                control={control}
                rules={{ required: "Status is required" }}
                render={({ field }) => (
                  <FormControl fullWidth size="medium" error={!!errors.status}>
                    <InputLabel>Status *</InputLabel>
                    <Select
                      {...field}
                      label="Status *"
                      error={!!errors.status}
                      onChange={(e) =>
                        handleFieldChange("status", e.target.value)
                      }
                      sx={{}}
                    >
                      <MenuItem value="available">
                        <div className="flex items-center gap-2">
                          <Chip
                            label="Available"
                            color="success"
                            size="small"
                          />
                          <span>Available</span>
                        </div>
                      </MenuItem>
                      <MenuItem value="busy">
                        <div className="flex items-center gap-2">
                          <Chip label="Busy" color="error" size="small" />
                          <span>Busy</span>
                        </div>
                      </MenuItem>
                      <MenuItem value="inactive">
                        <div className="flex items-center gap-2">
                          <Chip label="Inactive" color="default" size="small" />
                          <span>Inactive</span>
                        </div>
                      </MenuItem>
                    </Select>
                    {errors.status && (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ mt: 1, display: "block" }}
                      >
                        {errors.status.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            disabled={isLoading}
            sx={{
              mt: 2,
              py: 1.5,
              borderRadius: 1,
              fontWeight: 500,
              color: "#fff",
              background: theme.currentPalette.primary,
              "&:hover": {
                background: alpha(theme.currentPalette.primary, 0.85),
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
        </form>
      </Box>
    </div>
  );
});

TruckForm.displayName = "TruckForm";
