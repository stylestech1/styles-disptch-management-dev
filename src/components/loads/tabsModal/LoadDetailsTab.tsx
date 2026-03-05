/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { RootState, useAppSelector } from "@/redux/store";
import { LoadDetailsTabProps } from "@/types/globalTypes";
import { alpha, Box, Collapse, Divider, IconButton, Stack, Typography } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ChevronDown, LandPlot, MapPin, Navigation } from "lucide-react";

type SectionKey = "pickup" | "transit" | "delivery";

type FieldKey =
  | "pickupAt"
  | "arrivalAtShipper"
  | "leftShipper"
  | "arrivalAtReceiver"
  | "completedAt"
  | "leftReceiver";

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
    "& .MuiInputBase-root": {
      borderRadius: 2,
      bgcolor: "#fff",
      height: 44,
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
  } as const;

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

  const Card = ({
    sectionKey,
    title,
    subtitle,
    Icon,
    children,
  }: {
    sectionKey: SectionKey;
    title: string;
    subtitle: string;
    Icon: any;
    children: React.ReactNode;
  }) => {
    const expanded = open[sectionKey];

    return (
      <Box
        sx={{
          borderRadius: 2.5,
          border: `2px solid ${borderBlue}`,
          bgcolor: "#fff",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          onClick={() => toggle(sectionKey)}
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

        <Divider sx={{ borderColor: alpha(theme.currentPalette.primary, 0.18) }} />

        {/* Body */}
        <Collapse in={expanded} timeout={180} unmountOnExit>
          <Box sx={{ p: 2 }}>{children}</Box>
        </Collapse>
      </Box>
    );
  };

  const Label = ({ text, required }: { text: string; required?: boolean }) => (
    <Typography
      sx={{
        fontSize: 12,
        fontWeight: 700,
        mb: 0.75,
        color: alpha(theme.currentPalette.text, 0.8),
        display: "flex",
        alignItems: "center",
        gap: 0.5,
      }}
    >
      {text}
      {required ? (
        <Box component="span" sx={{ color: "#d32f2f", fontWeight: 900, lineHeight: 1 }}>
          *
        </Box>
      ) : null}
    </Typography>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", mb: 2 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 18, color: alpha(theme.currentPalette.text, 0.9) }}>
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
              <Card key={s.key} sectionKey={s.key} title={s.title} subtitle={s.subtitle} Icon={s.icon}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <Label text={s.leftLabel} required={leftRequired} />
                    <DateTimePicker
                      value={s.leftValue}
                      onChange={(val) => {
                        setTouched((p) => ({ ...p, [s.leftKey]: true }));
                        s.onLeftChange(val);
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: leftRequired,
                          error: leftError,
                          helperText: leftError ? "This field is required" : " ",
                          onBlur: () => setTouched((p) => ({ ...p, [s.leftKey]: true })),
                          sx: pickerSx,
                        },
                        popper: {
                          sx: {
                            "& .MuiPaper-root": { bgcolor: "#fff", borderRadius: 2 },
                          },
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Label text={s.rightLabel} required={rightRequired} />
                    <DateTimePicker
                      value={s.rightValue}
                      onChange={(val) => {
                        setTouched((p) => ({ ...p, [s.rightKey]: true }));
                        s.onRightChange(val);
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: rightRequired,
                          error: rightError,
                          helperText: rightError ? "This field is required" : " ",
                          onBlur: () => setTouched((p) => ({ ...p, [s.rightKey]: true })),
                          sx: pickerSx,
                        },
                        popper: {
                          sx: {
                            "& .MuiPaper-root": { bgcolor: "#fff", borderRadius: 2 },
                          },
                        },
                      }}
                    />
                  </Box>
                </Stack>
              </Card>
            );
          })}
        </Stack>
      </LocalizationProvider>
    </Box>
  );
};

export default LoadDetailsTab;