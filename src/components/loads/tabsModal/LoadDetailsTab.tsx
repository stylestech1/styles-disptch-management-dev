"use client";
import { RootState, useAppSelector } from "@/redux/store";
import { LoadDetailsTabProps } from "@/types/globalTypes";
import { alpha, Box, Button, Stack, Typography } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LandPlot, MapPin, Navigation } from "lucide-react";

// Load Details Tab Component
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
  isTabValid,
  onPrevTab,
  onNextTab,
}) => {
  const theme = useAppSelector((state: RootState) => state.palette);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-6 overflow-y-auto">
        <Box className="flex flex-col md:flex-row items-center justify-between">
          <Typography>Timeline & Milestones</Typography>
          <Typography
            fontSize={13}
            color={alpha(theme.currentPalette.text, 0.5)}
          >
            Set planned pickup and delivery times
          </Typography>
        </Box>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <div className="flex flex-col gap-5">
            {/* Pickup */}
            <Box
              sx={{
                border: `2px solid ${alpha(theme.currentPalette.primary, 0.3)}`,
                borderRadius: 1,
                p: 2,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={0.5} mb={1}>
                <MapPin
                  size={30}
                  style={{
                    color: theme.currentPalette.secondary,
                    backgroundColor: alpha(theme.currentPalette.secondary, 0.1),
                    borderRadius: "50%",
                    padding: 7,
                  }}
                />
                <Typography
                  sx={{
                    color: theme.currentPalette.primary,
                    fontSize: "18px",
                    fontWeight: "bold",
                  }}
                >
                  Pickup
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="center" gap={2} mt={2}>
                {/* Pickup */}
                <Stack
                  direction="column"
                  alignItems="start"
                  spacing={0.5}
                  sx={{ width: "100%" }}
                >
                  <Typography
                    sx={{
                      color: theme.currentPalette.text,
                      fontSize: "12px",
                    }}
                  >
                    Pickup <span className="text-red-600">*</span>
                  </Typography>

                  <DateTimePicker
                    value={pickupAt}
                    onChange={onPickupAtChange}
                    views={["year", "month", "day", "hours", "minutes"]}
                    slotProps={{
                      textField: {
                        required: true,
                        fullWidth: true,
                        sx: {
                          bgcolor: theme.currentPalette.background,
                          "& .MuiInputBase-root": {
                            bgcolor: theme.currentPalette.background,
                          },
                        },
                      },
                      popper: {
                        sx: {
                          "& .MuiPaper-root": {
                            bgcolor: theme.currentPalette.background,
                          },
                        },
                      },
                    }}
                  />
                </Stack>

                {/* ArrivalAtShipper */}
                {isEditing && (
                  <Stack
                    direction={"column"}
                    alignItems={"start"}
                    spacing={0.5}
                    sx={{ width: "100%" }}
                  >
                    <Typography
                      sx={{
                        color: theme.currentPalette.text,
                        fontSize: "12px",
                      }}
                    >
                      Arrived At Shipper
                    </Typography>

                    <DateTimePicker
                      value={arrivalAtShipper}
                      onChange={onArrivalAtShipperChange}
                      views={["year", "month", "day", "hours", "minutes"]}
                      slotProps={{
                        textField: {
                          required: true,
                          fullWidth: true,
                          sx: {
                            bgcolor: theme.currentPalette.background,
                            "& .MuiInputBase-root": {
                              bgcolor: theme.currentPalette.background,
                            },
                          },
                        },
                        popper: {
                          sx: {
                            "& .MuiPaper-root": {
                              bgcolor: theme.currentPalette.background,
                            },
                          },
                        },
                      }}
                    />
                  </Stack>
                )}
              </Stack>
            </Box>

            {/* Transit */}
            {isEditing && (
              <Box
                sx={{
                  border: `2px solid ${alpha(
                    theme.currentPalette.primary,
                    0.3
                  )}`,
                  borderRadius: 1,
                  p: 2,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={0.5} mb={1}>
                  <Navigation
                    size={30}
                    style={{
                      color: theme.currentPalette.secondary,
                      backgroundColor: alpha(
                        theme.currentPalette.secondary,
                        0.1
                      ),
                      borderRadius: "50%",
                      padding: 7,
                    }}
                  />
                  <Typography
                    sx={{
                      color: theme.currentPalette.primary,
                      fontSize: "18px",
                      fontWeight: "bold",
                    }}
                  >
                    Transit
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" gap={2} mt={2}>
                  {/* leftShipper */}
                  <Stack
                    direction="column"
                    alignItems="start"
                    spacing={0.5}
                    sx={{ width: "100%" }}
                  >
                    <Typography
                      sx={{
                        color: theme.currentPalette.text,
                        fontSize: "12px",
                      }}
                    >
                      Left Shipper
                    </Typography>

                    <DateTimePicker
                      value={leftShipper}
                      onChange={onLeftShipperChange}
                      views={["year", "month", "day", "hours", "minutes"]}
                      slotProps={{
                        textField: {
                          required: true,
                          fullWidth: true,
                          sx: {
                            bgcolor: theme.currentPalette.background,
                            "& .MuiInputBase-root": {
                              bgcolor: theme.currentPalette.background,
                            },
                          },
                        },
                        popper: {
                          sx: {
                            "& .MuiPaper-root": {
                              bgcolor: theme.currentPalette.background,
                            },
                          },
                        },
                      }}
                    />
                  </Stack>

                  {/* arrivalAtReceiver */}
                  <Stack
                    direction={"column"}
                    alignItems={"start"}
                    spacing={0.5}
                    sx={{ width: "100%" }}
                  >
                    <Typography
                      sx={{
                        color: theme.currentPalette.text,
                        fontSize: "12px",
                      }}
                    >
                      Arrival At Receiver
                    </Typography>

                    <DateTimePicker
                      value={arrivalAtReceiver}
                      onChange={onArrivalAtReceiverChange}
                      views={["year", "month", "day", "hours", "minutes"]}
                      slotProps={{
                        textField: {
                          required: true,
                          fullWidth: true,
                          sx: {
                            bgcolor: theme.currentPalette.background,
                            "& .MuiInputBase-root": {
                              bgcolor: theme.currentPalette.background,
                            },
                          },
                        },
                        popper: {
                          sx: {
                            "& .MuiPaper-root": {
                              bgcolor: theme.currentPalette.background,
                            },
                          },
                        },
                      }}
                    />
                  </Stack>
                </Stack>
              </Box>
            )}

            {/* Completed */}
            <Box
              sx={{
                border: `2px solid ${alpha(theme.currentPalette.primary, 0.3)}`,
                borderRadius: 1,
                p: 2,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={0.5} mb={1}>
                <LandPlot
                  size={30}
                  style={{
                    color: theme.currentPalette.secondary,
                    backgroundColor: alpha(theme.currentPalette.secondary, 0.1),
                    borderRadius: "50%",
                    padding: 7,
                  }}
                />
                <Typography
                  sx={{
                    color: theme.currentPalette.primary,
                    fontSize: "18px",
                    fontWeight: "bold",
                    display: "block",
                    mb: 1,
                  }}
                >
                  Delivery
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="center" gap={2} mt={2}>
                {/* Completed */}
                <Stack
                  direction="column"
                  alignItems="start"
                  spacing={0.5}
                  sx={{ width: "100%" }}
                >
                  <Typography
                    sx={{
                      color: theme.currentPalette.text,
                      fontSize: "12px",
                    }}
                  >
                    Delivery <span className="text-red-600">*</span>
                  </Typography>

                  <DateTimePicker
                    value={completedAt}
                    onChange={onCompletedAtChange}
                    views={["year", "month", "day", "hours", "minutes"]}
                    slotProps={{
                      textField: {
                        required: true,
                        fullWidth: true,
                        sx: {
                          bgcolor: theme.currentPalette.background,
                          "& .MuiInputBase-root": {
                            bgcolor: theme.currentPalette.background,
                          },
                        },
                      },
                      popper: {
                        sx: {
                          "& .MuiPaper-root": {
                            bgcolor: theme.currentPalette.background,
                          },
                        },
                      },
                    }}
                  />
                </Stack>

                {/* leftReceiver */}
                {isEditing && (
                  <Stack
                    direction={"column"}
                    alignItems={"start"}
                    spacing={0.5}
                    sx={{ width: "100%" }}
                  >
                    <Typography
                      sx={{
                        color: theme.currentPalette.text,
                        fontSize: "12px",
                      }}
                    >
                      Left Receiver
                    </Typography>

                    <DateTimePicker
                      value={leftReceiver}
                      onChange={onLeftReceiverChange}
                      views={["year", "month", "day", "hours", "minutes"]}
                      slotProps={{
                        textField: {
                          required: true,
                          fullWidth: true,
                          sx: {
                            bgcolor: theme.currentPalette.background,
                            "& .MuiInputBase-root": {
                              bgcolor: theme.currentPalette.background,
                            },
                          },
                        },
                        popper: {
                          sx: {
                            "& .MuiPaper-root": {
                              bgcolor: theme.currentPalette.background,
                            },
                          },
                        },
                      }}
                    />
                  </Stack>
                )}
              </Stack>
            </Box>
          </div>
        </LocalizationProvider>

        <div className="flex justify-between pt-4">
          <Button
            sx={{
              bgcolor: theme.currentPalette.primary,
              color: theme.currentPalette.background,
            }}
            type="button"
            onClick={onPrevTab}
          >
            Back
          </Button>
          <Button
            sx={{
              bgcolor: theme.currentPalette.primary,
              color: theme.currentPalette.background,
            }}
            type="button"
            onClick={onNextTab}
            disabled={!isTabValid}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoadDetailsTab;
