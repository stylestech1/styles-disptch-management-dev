/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo } from "react";
import { useGetDriversQuery, useGetTrucksQuery } from "@/redux/slices/apiSlice";
import { RootState, useAppSelector } from "@/redux/store";
import {
  AssignmentTabProps,
  TDriver,
  TTruck,
  TTruckType,
} from "@/types/globalTypes";
import {
  Alert,
  alpha,
  Box,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import { IoCheckmark } from "react-icons/io5";
import { User, Truck as TruckIcon, Snowflake, Thermometer } from "lucide-react";

const INPUT_HEIGHT = 56;

const helperSx = (theme: any) => ({
  mt: "1px",
  fontSize: 13,
  color: alpha(theme.currentPalette.text, 0.45),
});

const iconPillSx = (theme: any) => ({
  display: "grid",
  placeItems: "center",
  color: theme.currentPalette.primary,
  flexShrink: 0,
});

const outlinedSx = (theme: any) => ({
  height: INPUT_HEIGHT,
  borderRadius: 2,
  "& fieldset": { borderColor: alpha(theme.currentPalette.text, 0.22) },
  "&:hover fieldset": { borderColor: alpha(theme.currentPalette.text, 0.35) },
  "&.Mui-focused fieldset": {
    borderColor: theme.currentPalette.primary,
    borderWidth: 2,
  },
  "& .MuiOutlinedInput-input": {
    height: INPUT_HEIGHT,
    padding: "0 14px",
    display: "flex",
    alignItems: "center",
  },
});

const labelFloatingSx = (theme: any) => ({
  fontSize: 12,
  fontWeight: 700,
  color: alpha(theme.currentPalette.text, 0.55),
  "&.Mui-focused": { color: theme.currentPalette.primary },
});

type LabeledSelectProps = {
  theme: any;
  label: string;
  required?: boolean;
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
  onOpen?: () => void;
  placeholder: string;
  startIcon: React.ReactNode;
  children: React.ReactNode;
};

const LabeledSelect = ({
  theme,
  label,
  required,
  value,
  disabled,
  onChange,
  onOpen,
  placeholder,
  startIcon,
  children,
}: LabeledSelectProps) => {
  const id = `${label.replace(/\s+/g, "-").toLowerCase()}-select`;

  return (
    <FormControl
      fullWidth
      disabled={disabled}
      variant="outlined"
      sx={{
        "& .MuiFormLabel-asterisk": { display: "none" },
      }}
    >
      <InputLabel id={`${id}-label`} sx={labelFloatingSx(theme)}>
        {label}
        {required ? <span style={{ color: "#d32f2f" }}> *</span> : null}
      </InputLabel>

      <Select
        labelId={`${id}-label`}
        id={id}
        value={value}
        label={label}
        onOpen={onOpen}
        onChange={(e: SelectChangeEvent) => onChange(String(e.target.value))}
        displayEmpty
        sx={{
          "&.MuiOutlinedInput-root": outlinedSx(theme),
          "& .MuiSelect-select": {
            display: "flex",
            alignItems: "center",
            gap: 10,
            height: INPUT_HEIGHT,
            padding: "0 14px",
          },
        }}
        startAdornment={
          <InputAdornment position="start">
            <Box sx={iconPillSx(theme)}>{startIcon}</Box>
          </InputAdornment>
        }
        renderValue={(selected) => {
          if (!selected) return placeholder;

          const items = Array.isArray(children) ? children : [children];
          const match = items.find((c: any) => c?.props?.value === selected);

          return match?.props?.children ?? selected;
        }}
      >
        <MenuItem value="" disabled>
          {placeholder}
        </MenuItem>
        {children}
      </Select>
    </FormControl>
  );
};

const AssignmentTab: React.FC<AssignmentTabProps> = ({
  isEditing,
  editingLoad,
  driverId,
  truckId,
  truckType,
  truckTemp,
  onDriverIdChange,
  onTruckIdChange,
  onTruckTypeChange,
  onTruckTempChange,
}) => {
  const token = useAppSelector((state: RootState) => state.auth.token);
  const theme = useAppSelector((state: RootState) => state.palette);

  const { data: driversData, refetch: driverRefetch } = useGetDriversQuery(
    { skip: !token } as any,
  );
  const { data: trucksData, refetch: truckRefetch } = useGetTrucksQuery(
    { skip: !token } as any,
  );

  const drivers: TDriver[] = driversData?.data || [];
  const trucks: TTruck[] = trucksData?.data || [];

  const selectedTruck = useMemo(
    () => trucks.find((t) => String(t.id) === String(truckId)),
    [trucks, truckId],
  );

  const isReefer = (selectedTruck?.type || truckType || "")
    .toLowerCase()
    .includes("reefer");
  if (isEditing) {
    const readonlyFieldSx = {
      "& .MuiOutlinedInput-root": outlinedSx(theme),
      "& .MuiOutlinedInput-input": {
        height: INPUT_HEIGHT,
        padding: "0 14px",
        display: "flex",
        alignItems: "center",
      },
    };

    const readOnlyLabel = (text: string) => (
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 900,
          color: theme.currentPalette.primary,
          mb: 1,
        }}
      >
        {text}{" "}
        <Box
          component="span"
          sx={{ color: alpha(theme.currentPalette.text, 0.55), fontWeight: 800 }}
        >
          ✓ Assigned
        </Box>
      </Typography>
    );

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2.5,
          }}
        >
          <Box>
            {readOnlyLabel("Driver")}
            <TextField
              fullWidth
              value={editingLoad?.driverId?.name || "No driver assigned"}
              inputProps={{ readOnly: true }}
              sx={readonlyFieldSx}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={iconPillSx(theme)}>
                        <User size={16} />
                      </Box>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IoCheckmark className="h-5 w-5 text-green-600" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Box>
            {readOnlyLabel("Truck")}
            <TextField
              fullWidth
              value={
                editingLoad?.truckId
                  ? `${editingLoad.truckId.model} (${editingLoad.truckId.plateNumber})`
                  : "No truck assigned"
              }
              inputProps={{ readOnly: true }}
              sx={readonlyFieldSx}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={iconPillSx(theme)}>
                        <TruckIcon size={16} />
                      </Box>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IoCheckmark className="h-5 w-5 text-green-600" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Box>
            {readOnlyLabel("Truck Type")}
            <TextField
              fullWidth
              value={
                editingLoad?.truckType
                  ? editingLoad.truckType.charAt(0).toUpperCase() +
                  editingLoad.truckType.slice(1)
                  : "No type assigned"
              }
              inputProps={{ readOnly: true }}
              sx={readonlyFieldSx}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={iconPillSx(theme)}>
                        <Snowflake size={16} />
                      </Box>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IoCheckmark className="h-5 w-5 text-green-600" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Box>
            {readOnlyLabel("Required Temperature (°F)")}
            <TextField
              fullWidth
              value={editingLoad?.truckTemp ? `${editingLoad.truckTemp}` : "-"}
              inputProps={{ readOnly: true }}
              sx={readonlyFieldSx}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={iconPillSx(theme)}>
                        <Thermometer size={16} />
                      </Box>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IoCheckmark className="h-5 w-5 text-green-600" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
        </Box>

        <Alert
          severity="info"
          sx={{
            borderRadius: 2,
            border: `1px solid ${alpha(theme.currentPalette.primary, 0.18)}`,
          }}
        >
          <Typography sx={{ fontWeight: 900, mb: 0.5 }}>
            Driver & Truck Information
          </Typography>
          <Typography sx={{ fontSize: 13 }}>
            Driver and truck assignments cannot be modified for existing loads.
          </Typography>
        </Alert>
      </Box>
    );
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Driver */}
      <LabeledSelect
        theme={theme}
        label="Driver"
        required
        value={driverId}
        onOpen={() => {
          driverRefetch();
          truckRefetch();
        }}
        onChange={onDriverIdChange}
        placeholder="Select Driver"
        startIcon={<User size={16} />}
      >
        {drivers.map((d) => (
          <MenuItem key={d.id} value={String(d.id)}>
            {d.name} ({d.driverId})
          </MenuItem>
        ))}
      </LabeledSelect>

      {/* Truck Type */}
      <LabeledSelect
        theme={theme}
        label="Truck Type"
        required
        value={truckType}
        onChange={(v) => onTruckTypeChange(v as TTruckType)}
        placeholder="Select type"
        startIcon={<Snowflake size={16} />}
      >
        <MenuItem value="reefer">Reefer</MenuItem>
        <MenuItem value="van">Van</MenuItem>
      </LabeledSelect>

      {/* Truck */}
      <LabeledSelect
        theme={theme}
        label="Truck"
        required
        value={truckId}
        disabled={!truckType}
        onChange={onTruckIdChange}
        placeholder="Select Truck"
        startIcon={<TruckIcon size={16} />}
      >
        {trucks
          .filter((t) => !truckType || t.type === truckType)
          .map((t) => (
            <MenuItem key={t.id} value={String(t.id)}>
              {t.model} ({t.plateNumber})
            </MenuItem>
          ))}
      </LabeledSelect>

      <Typography sx={helperSx(theme)}>
        Select from dropdown or type your own
      </Typography>

      {/* Temperature (editable) */}
      <FormControl
        fullWidth
        variant="outlined"
        sx={{
          "& .MuiFormLabel-asterisk": { display: "none" }, 
        }}
      >
        <InputLabel id="temp-label" sx={labelFloatingSx(theme)}>
          Required Temperature (°F)<span style={{ color: "#d32f2f" }}> *</span>
        </InputLabel>

        <OutlinedInput
          id="temp"
          label="Required Temperature (°F)"
          type="number"
          value={truckTemp}
          onChange={(e) => onTruckTempChange(e.target.value)}
          placeholder="-10"
          startAdornment={
            <InputAdornment position="start">
              <Box sx={iconPillSx(theme)}>
                <Thermometer size={16} />
              </Box>
            </InputAdornment>
          }
          sx={outlinedSx(theme)}
        />
      </FormControl>

      {!isReefer && truckType && (
        <Typography sx={helperSx(theme)}>
          Temperature is usually required for Reefer trucks, but you can still set it.
        </Typography>
      )}
    </Box>
  );
};

export default AssignmentTab;