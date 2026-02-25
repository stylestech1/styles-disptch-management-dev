"use client";

import React from "react";
import {
  alpha,
  Autocomplete,
  Box,
  Button,
  darken,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Edit, Trash2, X } from "lucide-react";
import { TMaintenance } from "@/types/truckType";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { TTruck } from "@/types/globalTypes";
import { RootState, useAppSelector } from "@/redux/store";

interface EditDialogProps {
  open: boolean;
  onClose: () => void;
  selectedMaintenance: TMaintenance | null;
  serviceTypes: string[];
  initialServiceTypes: string[]
  editForm: {
    type: string;
    intervalMile: string;
    remindBeforeMile: string;
    intervalDays: string;
    remindBeforeDays: string;
    trucks: Array<{
      truckId: string;
      plateNumber: string;
      lastDoneMile?: string;
      lastDoneAt?: string | null;
    }>;
  };
  trucks: TTruck[];
  onEditSubmit: (e: React.FormEvent) => void;
  onTruckChange: (index: number, truckId: string) => void;
  onTruckFieldChange: (
    index: number,
    field: "lastDoneMile" | "lastDoneAt",
    value: string
  ) => void;
  onAddTruck: () => void;
  getAvailableTrucks: (currentIndex: number) => TTruck[];
  isUpdating: boolean;
  setEditForm: React.Dispatch<
    React.SetStateAction<{
      type: string;
      intervalMile: string;
      remindBeforeMile: string;
      intervalDays: string;
      remindBeforeDays: string;
      trucks: Array<{
        truckId: string;
        plateNumber: string;
        lastDoneMile?: string;
        lastDoneAt?: string | null;
      }>;
    }>
  >;
}

const EditDialog: React.FC<EditDialogProps> = ({
  open,
  onClose,
  selectedMaintenance,
  serviceTypes,
  initialServiceTypes,
  editForm,
  trucks,
  onEditSubmit,
  onTruckChange,
  onTruckFieldChange,
  onAddTruck,
  getAvailableTrucks,
  isUpdating,
  setEditForm,
}) => {
  const theme = useAppSelector((state: RootState) => state.palette);

  // Handle text field changes
  const handleTextFieldChange = (
    field: keyof typeof editForm,
    value: string
  ) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "hidden",
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: `1px solid ${alpha(theme.currentPalette.text, 0.1)}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 2,
          px: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Edit size={24} color={theme.currentPalette.primary} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: theme.currentPalette.primary,
            }}
          >
            Edit Maintenance
          </Typography>
        </Box>

        <IconButton
          onClick={onClose}
          sx={{
            color: theme.currentPalette.text,
            "&:hover": {
              bgcolor: alpha(theme.currentPalette.primary, 0.1),
            },
          }}
        >
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box component="form" onSubmit={onEditSubmit}>
          {/* Service Type */}
          <FormControl fullWidth size="medium" sx={{ my: 3 }}>
            <Autocomplete
              freeSolo
              options={serviceTypes}
              value={editForm.type}
              onChange={(event, newValue) => {
                setEditForm({ ...editForm, type: newValue || "" });
              }}
              onInputChange={(event, newInputValue) => {
                setEditForm({ ...editForm, type: newInputValue });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Service Type"
                  required
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
              )}
            />
          </FormControl>

          {selectedMaintenance?.repeatBy === "mile" ? (
            <>
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Interval (Miles)"
                  value={editForm.intervalMile}
                  onChange={(e) =>
                    handleTextFieldChange("intervalMile", e.target.value)
                  }
                  type="text"
                />
                <TextField
                  fullWidth
                  label="Remind Before (Miles)"
                  value={editForm.remindBeforeMile}
                  onChange={(e) =>
                    handleTextFieldChange("remindBeforeMile", e.target.value)
                  }
                  type="text"
                />
              </Stack>
            </>
          ) : (
            <>
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Interval (Days)"
                  value={editForm.intervalDays}
                  onChange={(e) =>
                    handleTextFieldChange("intervalDays", e.target.value)
                  }
                  type="text"
                />
                <TextField
                  fullWidth
                  label="Remind Before (Days)"
                  value={editForm.remindBeforeDays}
                  onChange={(e) =>
                    handleTextFieldChange("remindBeforeDays", e.target.value)
                  }
                  type="text"
                />
              </Stack>
            </>
          )}

          {/* Trucks Section */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Trucks
            </Typography>

            {editForm.trucks.map((truck, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  mb: 2,
                  border: `1px solid ${alpha(theme.currentPalette.text, 0.1)}`,
                  borderRadius: 2,
                  bgcolor: alpha(theme.currentPalette.background, 0.5),
                }}
              >
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Truck</InputLabel>
                    <Select
                      value={truck.truckId}
                      label="Truck"
                      onChange={(e) => onTruckChange(index, e.target.value)}
                    >
                      {getAvailableTrucks(index).map(
                        (availableTruck: TTruck) => (
                          <MenuItem
                            key={availableTruck.id}
                            value={availableTruck.id}
                          >
                            {availableTruck.plateNumber}
                          </MenuItem>
                        )
                      )}
                    </Select>
                  </FormControl>
                </Stack>

                {selectedMaintenance?.repeatBy === "mile" ? (
                  <TextField
                    fullWidth
                    label="Last Done Mile"
                    value={truck.lastDoneMile}
                    onChange={(e) =>
                      onTruckFieldChange(index, "lastDoneMile", e.target.value)
                    }
                    type="number"
                    placeholder="e.g., 300"
                  />
                ) : (
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Last Done Date"
                      value={truck.lastDoneAt ? dayjs(truck.lastDoneAt) : null}
                      onChange={(newValue) =>
                        onTruckFieldChange(
                          index,
                          "lastDoneAt",
                          newValue ? newValue.format("YYYY-MM-DD") : ""
                        )
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                        },
                      }}
                    />
                  </LocalizationProvider>
                )}
              </Box>
            ))}

            <Button
              onClick={onAddTruck}
              variant="outlined"
              fullWidth
              sx={{
                borderStyle: "dashed",
                borderColor: alpha(theme.currentPalette.primary, 0.3),
                color: theme.currentPalette.primary,
                "&:hover": {
                  borderColor: theme.currentPalette.primary,
                  bgcolor: alpha(theme.currentPalette.primary, 0.1),
                },
              }}
            >
              + Add Truck
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={onEditSubmit}
          variant="contained"
          fullWidth
          disabled={isUpdating}
          sx={{
            bgcolor: theme.currentPalette.primary,
            color: theme.currentPalette.background,
            "&:hover": {
              bgcolor: darken(theme.currentPalette.primary, 0.2),
            },
            textTransform: "capitalize",
          }}
        >
          {isUpdating ? "Updating..." : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditDialog;
