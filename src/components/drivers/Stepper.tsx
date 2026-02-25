"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  Link as LinkIcon,
  Calendar,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  TextField,
  Button,
  Alert,
  alpha,
  darken,
  InputAdornment,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import { RootState, useAppSelector } from "@/redux/store";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { TDriver, TUser } from "@/types/globalTypes";
import {
  useGetUserDriverRoleQuery,
  useCreateDriverMutation,
  useGetUsersWithDriverRolesQuery,
  useGetDriverEmailsQuery,
} from "@/redux/slices/apiSlice";
import { getErrorMessage } from "@/utils/getErrorMessage";

const stepsDriver = ["Link Driver to User", "Complete Driver Profile"];

export default function LinkDriverPopup({ onClose }: { onClose: () => void }) {
  const theme = useAppSelector((state: RootState) => state.palette);
  const token = useAppSelector((state: RootState) => state.auth.token);

  const { data: usersData } = useGetUsersWithDriverRolesQuery(undefined, {
    skip: !token,
  });
  const { data: driversEmails } = useGetDriverEmailsQuery(undefined, {
    skip: !token,
  });

  const driverEmailList =
    driversEmails?.data?.map((d: { email: string }) => d.email.toLowerCase()) ||
    [];
  const availableUsers = (usersData?.data || []).filter(
    (u: TUser) => !driverEmailList.includes(u.email.toLowerCase())
  );

  const [activeStep, setActiveStep] = useState(0);

  // Step 1
  const [email, setEmail] = useState("");
  const [linkingStatus, setLinkingStatus] = useState<
    "idle" | "searching" | "success" | "error"
  >("idle");
  const [linkMessage, setLinkMessage] = useState("");
  const [foundUser, setFoundUser] = useState<TUser | null>(null);

  // Step 2 extra auto fields
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverEmail, setDriverEmail] = useState("");

  // Step 2 inputs
  const [licenseNumber, setLicenseNumber] = useState("");
  const [pricePerMile, setPricePerMile] = useState("");
  const [hireDate, setHireDate] = useState<dayjs.Dayjs | null>(null);

  // API
  const {
    data: usersResponse,
    isLoading: usersLoading,
    refetch,
  } = useGetUserDriverRoleQuery(undefined, {
    skip: !token,
  });
  const [createDriver, { isLoading: creating }] = useCreateDriverMutation();

  const users: TUser[] = usersResponse?.data || [];

  useEffect(() => {
    if (token) refetch();
  }, [token, refetch]);

  // -----------------------------------------
  // STEP 1: Link user by email
  // -----------------------------------------
  const handleLinkDriver = async () => {
    if (!email || !email.includes("@")) {
      setLinkingStatus("error");
      setLinkMessage("Please enter a valid email address.");
      return;
    }

    setLinkingStatus("searching");
    setLinkMessage("");

    await new Promise((resolve) => setTimeout(resolve, 600));

    const user = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        !u.driver &&
        u.role === "driver"
    );

    if (!user) {
      setLinkingStatus("error");
      setLinkMessage(
        "Email not found. Please ensure the email is correct or register the driver first."
      );
      return;
    }

    if (user.driver) {
      setLinkingStatus("error");
      setLinkMessage("This email is already linked to a driver.");
      return;
    }

    // Auto-fill Step 2 info
    setFoundUser(user);
    setDriverName(user.name || "");
    setDriverPhone(user.phone || "");
    setDriverEmail(user.email || "");

    setLinkingStatus("success");
    setLinkMessage(`Driver linked to ${user.name || user.email}`);

    setTimeout(() => setActiveStep(1), 1000);
  };

  // -----------------------------------------
  // STEP 2: Save Driver Details
  // -----------------------------------------
  const handleSaveDetails = async () => {
    if (!foundUser) return;

    try {
      await createDriver({
        user: foundUser.id,
        name: driverName,
        phone: driverPhone,
        email: driverEmail,
        licenseNumber,
        pricePerMile: parseFloat(pricePerMile) || 0,
        hireDate: hireDate ? hireDate.toISOString() : undefined,
        status: "available",
      }).unwrap();

      onClose();
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setLinkMessage(message);
      setLinkingStatus("error");
      setActiveStep(0);
    }
  };

  const handleNext = () => {
    if (activeStep === 0) handleLinkDriver();
    else handleSaveDetails();
  };

  const handleBack = () => {
    setActiveStep(0);
    setLinkingStatus("idle");
    setLinkMessage("");
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper
        elevation={6}
        sx={{
          width: 480,
          maxWidth: "95vw",
          py: 4,
          px: 5,
          borderRadius: 2,
          bgcolor: theme.currentPalette.background,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                bgcolor: alpha(theme.currentPalette.primary, 0.12),
                p: 1.2,
                borderRadius: "50%",
              }}
            >
              <LinkIcon size={20} color={theme.currentPalette.primary} />
            </Box>
            <Typography fontSize={20} fontWeight={600}>
              {activeStep === 0
                ? "Link Driver to User"
                : "Complete Driver Profile"}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <X size={22} />
          </IconButton>
        </Box>

        {/* Stepper */}
        <Box sx={{ mb: 5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              position: "relative",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: "30%",
                left: "10%",
                transform: "-50%",
                width: "70%",
                height: 2,
                bgcolor: alpha(theme.currentPalette.primary, 0.15),
                zIndex: 0,
              }}
            />

            {stepsDriver.map((label, i) => {
              const isActive = i === activeStep;
              const isCompleted = i < activeStep;

              return (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    zIndex: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      border: "3px solid",
                      borderColor:
                        isActive || isCompleted
                          ? theme.currentPalette.primary
                          : alpha(theme.currentPalette.text, 0.2),
                      bgcolor: isCompleted
                        ? theme.currentPalette.primary
                        : isActive
                        ? theme.currentPalette.primary
                        : theme.currentPalette.background,
                      color:
                        isCompleted || isActive
                          ? "#fff"
                          : theme.currentPalette.text,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 600,
                    }}
                  >
                    {isCompleted ? <CheckCircle size={22} /> : i + 1}
                  </Box>
                  <Typography
                    sx={{
                      mt: 1,
                      fontSize: 13,
                      fontWeight: 500,
                      color: isActive
                        ? theme.currentPalette.primary
                        : alpha(theme.currentPalette.text, 0.6),
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* CONTENT */}
        {activeStep === 0 ? (
          // STEP 1 UI
          <Box>
            <Typography fontWeight={600} mb={1.5}>
              Email Address <span style={{ color: "#dc2626" }}>*</span>
            </Typography>

            <Autocomplete
              options={availableUsers}
              getOptionLabel={(option) => option.email}
              value={foundUser || null}
              onChange={(event, newValue) => {
                if (newValue) {
                  const fullUser = users.find(
                    (u) =>
                      u.email.toLowerCase() === newValue.email.toLowerCase()
                  );
                  if (fullUser) {
                    setFoundUser(fullUser);
                    setDriverName(fullUser.name || "");
                    setDriverPhone(fullUser.phone || "");
                    setDriverEmail(fullUser.email || "");
                    setEmail(fullUser.email || "");
                  }
                  setLinkingStatus("success");
                  setLinkMessage(
                    `Driver linked to ${fullUser?.name || fullUser?.email}`
                  );
                  setTimeout(() => setActiveStep(1), 500);
                } else {
                  setFoundUser(null);
                  setDriverName("");
                  setDriverPhone("");
                  setDriverEmail("");
                  setEmail("");
                  setLinkingStatus("idle");
                  setLinkMessage("");
                }
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="john.doe@example.com" />
              )}
            />

            {/* Feedback */}
            {linkingStatus === "searching" && (
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: theme.currentPalette.primary,
                }}
              >
                <CircularProgress size={18} thickness={5} />
                <Typography fontSize={14}>Searching for user...</Typography>
              </Box>
            )}

            {linkingStatus === "success" && (
              <Alert
                severity="success"
                icon={<CheckCircle />}
                sx={{ mt: 2, borderRadius: 2 }}
              >
                {linkMessage}
              </Alert>
            )}

            {linkingStatus === "error" && (
              <Alert
                severity="error"
                icon={<AlertCircle />}
                sx={{ mt: 2, borderRadius: 2 }}
              >
                {linkMessage}
              </Alert>
            )}
          </Box>
        ) : (
          // STEP 2 UI
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Alert severity="success" icon={<CheckCircle />}>
              Driver linked to{" "}
              <strong>{foundUser?.name || foundUser?.email}</strong>
            </Alert>
            {/* Required input fields */}
            <Box>
              <Typography fontWeight={600} mb={0.5}>
                License Number *
              </Typography>
              <TextField
                fullWidth
                size="medium"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="e.g. DL123456"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: alpha(theme.currentPalette.primary, 0.08),
                  },
                }}
              />
            </Box>

            <Box>
              <Typography fontWeight={600} mb={0.5}>
                Price per Mile *
              </Typography>
              <TextField
                fullWidth
                size="medium"
                type="number"
                value={pricePerMile}
                onChange={(e) => setPricePerMile(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: alpha(theme.currentPalette.primary, 0.08),
                  },
                }}
              />
            </Box>

            <Box>
              <Typography fontWeight={600} mb={0.5}>
                Hire Date
              </Typography>
              <DesktopDatePicker
                value={hireDate}
                onChange={setHireDate}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "medium",
                    placeholder: "MM/DD/YYYY",
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Calendar size={18} />
                        </InputAdornment>
                      ),
                    },
                    sx: {
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: alpha(theme.currentPalette.primary, 0.08),
                      },
                    },
                  },
                }}
              />
            </Box>
          </Box>
        )}

        {/* BUTTONS */}
        <Box sx={{ display: "flex", gap: 2, mt: 6 }}>
          {activeStep === 1 && (
            <Button
              variant="outlined"
              onClick={handleBack}
              sx={{ flex: 1, py: 1.3 }}
            >
              Back
            </Button>
          )}

          <Button
            variant="contained"
            onClick={handleNext}
            disabled={
              activeStep === 0
                ? !email || linkingStatus === "searching"
                : !licenseNumber || !pricePerMile || creating
            }
            startIcon={creating ? <CircularProgress size={18} /> : null}
            sx={{
              flex: activeStep === 0 ? 1 : 2,
              py: 1.3,
              borderRadius: 2,
              textTransform: "none",
              bgcolor: theme.currentPalette.primary,
              "&:hover": {
                bgcolor: darken(theme.currentPalette.primary, 0.15),
              },
            }}
          >
            {activeStep === 0
              ? linkingStatus === "searching"
                ? "Linking..."
                : "Link Driver"
              : creating
              ? "Creating..."
              : "Save Details"}
          </Button>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
}
