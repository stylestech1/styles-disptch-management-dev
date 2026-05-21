/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import {
  alpha,
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import {
  IoAdd,
  IoClose,
  IoPerson,
  IoMail,
  IoCall,
  IoKey,
} from "react-icons/io5";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { RootState, useAppSelector } from "@/redux/store";
import { UserPlus } from "lucide-react";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: {
    name: string;
    email: string;
    phone: string;
    role: string;
    position: string;
    password: string;
    passwordConfirmation: string;
  }) => Promise<void>;
  isLoading?: boolean;
  closeOnOutsideClick?: boolean;
}

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  position: string;
  password: string;
  passwordConfirmation: string;
}

export default function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  closeOnOutsideClick = true,
}: CreateUserModalProps) {
  const theme = useAppSelector((state: RootState) => state.palette);

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    control,
  } = useForm<UserFormData>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "driver",
      position: "",
      password: "",
      passwordConfirmation: "",
    },
    mode: "onSubmit",
  });

  const role = watch("role");
  const watchPassword = watch("password");

  const tfSx = {
    mb: 1,
    "& .MuiFormLabel-asterisk": { color: "red" },
    "& .MuiInputLabel-root": {
      fontSize: 12,
      fontWeight: 700,
      color: alpha("#000", 0.55),
      transform: "translate(14px, -8px) scale(1)",
      padding: "0 6px",
      lineHeight: 1.2,
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: theme.currentPalette.primary,
    },
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
      minHeight: 58,
      "& fieldset": { borderColor: alpha("#000", 0.2) },
      "&:hover fieldset": { borderColor: alpha("#000", 0.28) },
      "&.Mui-focused": {
        backgroundColor: alpha(theme.currentPalette.primary, 0.10),
      },
      "&.Mui-focused fieldset": {
        borderColor: alpha(theme.currentPalette.primary, 0.35),
      },
      "&.Mui-error fieldset": { borderColor: "#d32f2f" },
    },
    "& .MuiOutlinedInput-input": {
      padding: "16px 14px",
      fontSize: 16,
    },
    "& .MuiFormHelperText-root": {
      display: "none",
      margin: 0,
      padding: 0,
      height: 0,
    },
  };

  const onSubmitForm = async (data: UserFormData) => {
    try {
      await onSubmit(data);
      reset();
      setShowPassword(false);
      setShowPasswordConfirm(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Adding user Failed");
    }
  };

  const handleClose = () => {
    reset();
    setShowPassword(false);
    setShowPasswordConfirm(false);
    onClose();
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <Dialog
      open={isOpen}
      onClose={(_, reason) => {
        if (reason === "backdropClick" && !closeOnOutsideClick) return;
        handleClose();
      }}
      disableScrollLock
      sx={{
        "& .MuiDialog-container": { overflow: "visible" },
         "& .MuiPaper-root": { overflow: "visible" },
      }}
       PaperProps={{
        sx: {
          width: "100%",
          maxWidth: 420,
          borderRadius: "22px",
          overflow: "hidden",
          bgcolor: "#fff",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2.25,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${alpha("#000", 0.08)}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(theme.currentPalette.primary, 0.12),
              color: theme.currentPalette.primary,
            }}
          >
            <UserPlus size={18} />
          </Box>

          <Typography
            sx={{
              fontSize: 18,
              color: theme.currentPalette.primary,
            }}
          >
            Add New User
          </Typography>
        </Box>

        <IconButton
          onClick={handleClose}
          sx={{
            width: 40,
            height: 40,
            borderRadius: "8px",
            color: alpha("#000", 0.55),
            "&:hover": { bgcolor: alpha("#000", 0.06) },
          }}
        >
          <IoClose size={20} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmitForm)}
          sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}
        >
          <TextField
            label="Full Name"
            placeholder="Enter full name"
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
            sx={tfSx}
            error={!!errors.name}

            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IoPerson size={18} color={theme.currentPalette.primary} />
                </InputAdornment>
              ),
            }}
            {...register("name", { required: "Name is required" })}
          />

          <TextField
            label="Email Address"
            placeholder="e.g. test@gmail.com"
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
            sx={tfSx}
            error={!!errors.email}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IoMail size={18} color={theme.currentPalette.primary} />
                </InputAdornment>
              ),
            }}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
          />

          <TextField
            label="Phone Number"
            placeholder="e.g. +201234567890"
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
            sx={tfSx}
            error={!!errors.phone}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IoCall size={18} color={theme.currentPalette.primary} />
                </InputAdornment>
              ),
            }}
            {...register("phone", {
              required: "Phone number is required",
              pattern: {
                value: /^[0-9+\-\s()]+$/,
                message: "Invalid phone number format",
              },
            })}
          />
          <Box
            sx={{
              display: "flex",
              gap: 1.25,
              flexDirection: role === "employee" ? "row" : "column",
            }}
          >
            <Controller
              name="role"
              control={control}
              rules={{ required: "Role is required" }}
              render={({ field }) => (
                <TextField
                  label="Role"
                  select
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  sx={tfSx}
                  value={field.value || ""}
                  onChange={field.onChange}
                  error={!!errors.role}
                  SelectProps={{
                    MenuProps: {
                      disablePortal: false,
                      anchorOrigin: { vertical: "bottom", horizontal: "left" },
                      transformOrigin: { vertical: "top", horizontal: "left" },
                      PaperProps: {
                        sx: {
                          zIndex: 20000,
                          bgcolor: "#fff",
                          mt: 1,
                          borderRadius: "10px",
                          overflow: "hidden",
                          boxShadow: "0 14px 50px rgba(0,0,0,0.18)",
                        },
                      },
                      slotProps: {
                        root: {
                          sx: { zIndex: 20000 },
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="driver">Driver</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="employee">Employee</MenuItem>
                </TextField>
              )}
            />

            {role === "employee" && (
              <TextField
                label="Position"
                placeholder="Position"
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={tfSx}
                {...register("position", { required: "Position is required" })}
              />
            )}
          </Box>

          <TextField
            label="Password"
            placeholder="Password"
            fullWidth
            required
            type={showPassword ? "text" : "password"}
            InputLabelProps={{ shrink: true }}
            sx={tfSx}
            error={!!errors.password}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IoKey size={18} color={theme.currentPalette.primary} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((p) => !p)}
                    edge="end"
                    sx={{ color: alpha("#000", 0.55) }}
                  >
                    {showPassword ? (
                      <FaEyeSlash size={16} />
                    ) : (
                      <FaEye size={16} />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            {...register("password", {
              required: "Password is required",
              minLength: { value: 6, message: "Min 6 chars" },
            })}
          />

          <TextField
            label="Confirm Password"
            placeholder="Confirm password"
            fullWidth
            required
            type={showPasswordConfirm ? "text" : "password"}
            InputLabelProps={{ shrink: true }}
            sx={tfSx}
            error={!!errors.passwordConfirmation}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IoKey size={18} color={theme.currentPalette.primary} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPasswordConfirm((p) => !p)}
                    edge="end"
                    sx={{ color: alpha("#000", 0.55) }}
                  >
                    {showPasswordConfirm ? (
                      <FaEyeSlash size={16} />
                    ) : (
                      <FaEye size={16} />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            {...register("passwordConfirmation", {
              required: "Confirm password is required",
              validate: (v) => v === watchPassword || "Passwords do not match",
            })}
          />

          <Button
            type="submit"
            disabled={isLoading}
            fullWidth
            sx={{
              mt: 1.25,
              py: 1.6,
              borderRadius: "8px",
              fontWeight: 900,
              fontSize: 16,
              color: "#fff",
              backgroundColor: theme.currentPalette.primary,
              "&:hover": { backgroundColor: alpha(theme.currentPalette.primary, 0.92) },
              "&.Mui-disabled": {
                backgroundColor: alpha(theme.currentPalette.primary, 0.45),
                color: alpha("#fff", 0.95),
              },
            }}
          >
            {isLoading ? "CREATING..." : "CREATE USER"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}