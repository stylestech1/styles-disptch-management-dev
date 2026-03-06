/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { RootState, useAppSelector } from "@/redux/store";
import { LoadDetailsTabProps } from "@/types/globalTypes";
import {
  alpha,
  Box,
  Collapse,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { ChevronDown, LandPlot, MapPin, Navigation } from "lucide-react";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

type SectionKey = "pickup" | "transit" | "delivery";

type FieldKey =
  | "pickupAt"
  | "arrivalAtShipper"
  | "leftShipper"
  | "arrivalAtReceiver"
  | "completedAt"
  | "leftReceiver";

type CardProps = {
  sectionKey: SectionKey;
  title: string;
  subtitle: string;
  Icon: any;
  expanded: boolean;
  borderBlue: string;
  headerBlue: string;
  dividerColor: string;
  onToggle: (key: SectionKey) => void;
  children: React.ReactNode;
};

const SectionCard = ({
  sectionKey,
  title,
  subtitle,
  Icon,
  expanded,
  borderBlue,
  headerBlue,
  dividerColor,
  onToggle,
  children,
}: CardProps) => {
  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: `2px solid ${borderBlue}`,
        bgcolor: "#fff",
        overflow: "hidden",
      }}
    >
      <Box
        onClick={() => onToggle(sectionKey)}
        sx={{
          px: 2,
          py: 1.75,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              bgcolor: borderBlue,
            }}
          >
            <Icon size={18} color={headerBlue} />
          </Box>

          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                color: headerBlue,
                fontSize: 16,
                lineHeight: 1.1,
              }}
            >
              {title}
            </Typography>

            <Typography
              sx={{
                fontSize: 12,
                color: alpha(headerBlue, 0.9),
                mt: 0.25,
              }}
            >
              {subtitle}
            </Typography>
          </Box>
        </Box>

        <IconButton
          size="small"
          sx={{
            color: headerBlue,
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "0.2s",
          }}
        >
          <ChevronDown size={18} />
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: dividerColor }} />

      <Collapse in={expanded} timeout={180} unmountOnExit>
        <Box sx={{ p: 2 }}>{children}</Box>
      </Collapse>
    </Box>
  );
};

const FieldLabel = ({
  text,
  required,
  textColor,
}: {
  text: string;
  required?: boolean;
  textColor: string;
}) => (
  <Typography
    sx={{
      fontSize: 12,
      fontWeight: 700,
      mb: 0.75,
      color: textColor,
      display: "flex",
      alignItems: "center",
      gap: 0.5,
    }}
  >
    {text}
    {required ? (
      <Box
        component="span"
        sx={{ color: "#d32f2f", fontWeight: 900, lineHeight: 1 }}
      >
        *
      </Box>
    ) : null}
  </Typography>
);

const LoadDetailsTab: React.FC<LoadDetailsTabProps> = ({
  pickupAt,
  completedAt,
  arrivalAtShipper,
  arrivalAtReceiver,
  leftShipper,
  leftReceiver,
  isEditing,
  onPickupAtChange,
  onCompletedAtChange,
  onArrivalAtShipperChange,
  onArrivalAtReceiverChange,
  onLeftShipperChange,
  onLeftReceiverChange,
}) => {
  const theme = useAppSelector((state: RootState) => state.palette);

  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    pickup: true,
    transit: false,
    delivery: false,
  });

  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});

  const toggle = (key: SectionKey) => setOpen((p) => ({ ...p, [key]: !p[key] }));

  const borderBlue = alpha(theme.currentPalette.primary, 0.1);
  const headerBlue = theme.currentPalette.primary;
  const dividerColor = alpha(theme.currentPalette.primary, 0.18);
  const labelColor = alpha(theme.currentPalette.text, 0.8);

  const isFilled = (v: any) => Boolean(v);

  const requiredMap: Record<FieldKey, boolean> = {
    pickupAt: true,
    arrivalAtShipper: false,
    leftShipper: false,
    arrivalAtReceiver: false,
    completedAt: true,
    leftReceiver: false,
  };

  const getError = (key: FieldKey, value: any) => {
    const required = requiredMap[key];
    if (!required) return false;
    if (!touched[key]) return false;
    return !isFilled(value);
  };

  useEffect(() => {
    const pickupDone = isFilled(pickupAt) && isFilled(arrivalAtShipper);
    const transitDone = isFilled(leftShipper) && isFilled(arrivalAtReceiver);

    if (pickupDone) {
      setOpen((p) => ({
        pickup: p.pickup,
        transit: true,
        delivery: p.delivery,
      }));
    }

    if (transitDone) {
      setOpen((p) => ({
        pickup: p.pickup,
        transit: p.transit,
        delivery: true,
      }));
    }
  }, [pickupAt, arrivalAtShipper, leftShipper, arrivalAtReceiver]);

  const pickerSx = {
    width: "100%",
    "& .MuiInputBase-root": {
      borderRadius: 2,
      bgcolor: "#fff",
      minHeight: 44,
      fontSize: 13,
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: alpha(theme.currentPalette.text, 0.18),
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: alpha(theme.currentPalette.primary, 0.55),
    },
    "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.currentPalette.primary,
    },
    "& .MuiInputAdornment-root svg": {
      color: alpha(theme.currentPalette.text, 0.55),
    },
    "& .MuiFormHelperText-root": {
      marginLeft: 0,
      marginRight: 0,
      marginTop: "6px",
      fontSize: 12,
    },
  } as const;

  const toDayjsValue = (value: any): Dayjs | null => {
    if (!value) return null;
    if (dayjs.isDayjs(value)) return value;
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed : null;
  };

  const renderPicker = ({
    // label,
    fieldKey,
    value,
    onChange,
    error,
  }: {
    // label: string;
    fieldKey: FieldKey;
    value: any;
    onChange?: (value: any) => void;
    error: boolean;
  }) => (
    <DateTimePicker
      // label={label}
      value={toDayjsValue(value)}

      onChange={(newValue) => {
        setTouched((prev) => ({ ...prev, [fieldKey]: true }));
        onChange?.(newValue);
      }}
      closeOnSelect={false}
      // disabled={!isEditing}
      ampm
      timeSteps={{ hours: 1, minutes: 5 }}
      sx={pickerSx}
      slotProps={{
        actionBar: {
          actions: ["cancel", "accept"],
        },
        tabs: {
          hidden: true,
        },
        textField: {
          fullWidth: true,
          error,
          // helperText: error ? `${label} is required` : " ",
          onBlur: () => {
            setTouched((prev) => ({ ...prev, [fieldKey]: true }));
          },
        },
      }}
    />
  );

  const sections = useMemo(
    () => [
      {
        key: "pickup" as const,
        title: "Pickup",
        subtitle: open.pickup ? "Click to collapse" : "Click to expand",
        icon: MapPin,

        leftKey: "pickupAt" as const,
        leftLabel: "Pickup",
        leftValue: pickupAt,
        onLeftChange: onPickupAtChange,

        rightKey: "arrivalAtShipper" as const,
        rightLabel: "Arrived At Shipper",
        rightValue: arrivalAtShipper,
        onRightChange: onArrivalAtShipperChange,
      },
      {
        key: "transit" as const,
        title: "Transit",
        subtitle: open.transit ? "Click to collapse" : "Click to expand",
        icon: Navigation,

        leftKey: "leftShipper" as const,
        leftLabel: "Left Shipper",
        leftValue: leftShipper,
        onLeftChange: onLeftShipperChange,

        rightKey: "arrivalAtReceiver" as const,
        rightLabel: "Arrival At Receiver",
        rightValue: arrivalAtReceiver,
        onRightChange: onArrivalAtReceiverChange,
      },
      {
        key: "delivery" as const,
        title: "Delivery",
        subtitle: open.delivery ? "Click to collapse" : "Click to expand",
        icon: LandPlot,

        leftKey: "completedAt" as const,
        leftLabel: "Delivery",
        leftValue: completedAt,
        onLeftChange: onCompletedAtChange,

        rightKey: "leftReceiver" as const,
        rightLabel: "Left Receiver",
        rightValue: leftReceiver,
        onRightChange: onLeftReceiverChange,
      },
    ],
    [
      open.pickup,
      open.transit,
      open.delivery,
      pickupAt,
      arrivalAtShipper,
      leftShipper,
      arrivalAtReceiver,
      completedAt,
      leftReceiver,
      onPickupAtChange,
      onArrivalAtShipperChange,
      onLeftShipperChange,
      onArrivalAtReceiverChange,
      onCompletedAtChange,
      onLeftReceiverChange,
    ]
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: 18,
            color: alpha(theme.currentPalette.text, 0.9),
          }}
        >
          Timeline & Milestones
        </Typography>

        <Typography sx={{ fontSize: 12, color: alpha(theme.currentPalette.text, 0.55) }}>
          Track planned vs actual times at each location
        </Typography>
      </Box>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Stack spacing={2} sx={{ flex: 1 }}>
          {sections.map((s) => {
            const leftRequired = requiredMap[s.leftKey];
            const rightRequired = requiredMap[s.rightKey];

            const leftError = getError(s.leftKey, s.leftValue);
            const rightError = getError(s.rightKey, s.rightValue);

            return (
              <SectionCard
                key={s.key}
                sectionKey={s.key}
                title={s.title}
                subtitle={s.subtitle}
                Icon={s.icon}
                expanded={open[s.key]}
                borderBlue={borderBlue}
                headerBlue={headerBlue}
                dividerColor={dividerColor}
                onToggle={toggle}
              >
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <FieldLabel
                      text={s.leftLabel}
                      required={leftRequired}
                      textColor={labelColor}
                    />
                    {renderPicker({
                      // label: s.leftLabel,
                      fieldKey: s.leftKey,
                      value: s.leftValue,
                      onChange: s.onLeftChange,
                      error: leftError,
                    })}
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <FieldLabel
                      text={s.rightLabel}
                      required={rightRequired}
                      textColor={labelColor}
                    />
                    {renderPicker({
                      // label: s.rightLabel,
                      fieldKey: s.rightKey,
                      value: s.rightValue,
                      onChange: s.onRightChange,
                      error: rightError,
                    })}
                  </Box>
                </Stack>
              </SectionCard>
            );
          })}
        </Stack>
      </LocalizationProvider>
    </Box>
  );
};

export default LoadDetailsTab;