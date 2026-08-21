/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { IoClose } from "react-icons/io5";
import toast from "react-hot-toast";
import {
  Avatar,
  Box,
  Button,
  Divider,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import { Mail, Phone, UserRoundPen, ChevronDown, BadgeCheck, UserStar } from "lucide-react";

import { TDispatcher, TUserRole } from "@/types/globalTypes";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { RootState, useAppSelector } from "@/redux/store";

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: TDispatcher | null;
  onUpdateRole: (userId: string, updates: {
    name: string;
    email: string;
    phone: string;
    role: TUserRole;
  }) => Promise<void>;
  onActivateUser: (userId: string) => Promise<void>;
  onDeactivateUser: (userId: string) => Promise<void>;
  isLoading?: boolean;
}

const DRAWER_RADIUS = 12;

const UserSettingsModal = ({
  isOpen,
  onClose,
  user,
  onUpdateRole,
  onActivateUser,
  onDeactivateUser,
  isLoading = false,
}: UserSettingsModalProps) => {
  const theme = useAppSelector((state: RootState) => state.palette);

  const [tempUser, setTempUser] = useState<{
    name: string;
    email: string;
    phone: string;
    role: TUserRole;
    status: "active" | "inactive";
  }>({
    name: "",
    email: "",
    phone: "",
    role: "employee",
    status: "active",
  });

  useEffect(() => {
    if (user) {
      setTempUser({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role as TUserRole,
        status: user.active ? "active" : "inactive",
      });
    }
  }, [user]);

  const initials = useMemo(() => {
    const name = user?.name || "";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "";
    const second = parts[1]?.[0] || "";
    return (first + second).toUpperCase() || "U";
  }, [user?.name]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (
        user.name !== tempUser.name ||
        user.email !== tempUser.email ||
        user.phone !== tempUser.phone ||
        user.role !== tempUser.role
      ) {
        await onUpdateRole(user.id, {
          name: tempUser.name,
          email: tempUser.email,
          phone: tempUser.phone,
          role: tempUser.role,
        });
      }

      if (user.active !== (tempUser.status === "active")) {
        if (tempUser.status === "active") await onActivateUser(user.id);
        else await onDeactivateUser(user.id);
      }

      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || "Update failed ❌");
    }
  };

  const primary = theme.currentPalette.primary;
  const bg = theme.currentPalette.background;
  const text = theme.currentPalette.text;

  const border = alpha(text, 0.16);
  const cardBorder = alpha(primary, 0.25);
  // const cardBg = alpha(primary, 0.04);
  const iconChipBg = alpha(primary, 0.10);

  const fieldSx = {
    height: 60,
    borderRadius: 2,
    bgcolor: "#fff",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: border },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: alpha(primary, 0.35) },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: primary,
      borderWidth: "2px",
    },
    "& .MuiSelect-select": {
      display: "flex",
      alignItems: "center",
      color: alpha(text, 0.8),
    },
  } as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Box
        sx={{
          width: { xs: "100%", md: "80%" },
          maxWidth: { xs: "calc(100vw - 32px)", sm: 420 },
          bgcolor: bg,
          borderRadius: `${DRAWER_RADIUS}px`,
          border: `1px solid ${alpha(text, 0.10)}`,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3,
            py: 2.2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "#fff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.6 }}>
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                bgcolor: iconChipBg,
              }}
            >
              <UserRoundPen size={18} color={primary} />
            </Box>

            <Typography sx={{ color: primary, fontSize: 18, lineHeight: 1 }}>
              Edit User Information
            </Typography>
          </Box>

          <Button
            onClick={onClose}
            sx={{
              minWidth: "auto",
              p: 0.6,
              borderRadius: 2,
              "&:hover": { bgcolor: alpha(text, 0.06) },
            }}
          >
            <IoClose size={22} color={alpha(text, 0.55)} />
          </Button>
        </Box>

        <Divider sx={{ borderColor: alpha(text, 0.10) }} />

        <Box sx={{ p: 3, bgcolor: "#fff" }}>
          {/* User card */}
          {/* <Box
            sx={{
              border: `1px solid ${cardBorder}`,
              borderRadius: 3,
              p: 2.6,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2.2 }}>
              <Avatar
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: alpha(primary, 0.20),
                  color: primary,
                  fontSize: 20,
                }}
              >
                {initials}
              </Avatar>

              <Typography sx={{ color: alpha(text, 0.88), fontSize: 24 }}>
                {user.name}
              </Typography>
            </Box>

            <Divider sx={{ my: 2.2, borderColor: cardBorder }} />

            <Box sx={{ display: "grid", gap: 1.4 }}>
              <Typography sx={{ color: alpha(text, 0.62), fontSize: 14 }}>
                Update the user contact information below.
              </Typography>
            </Boxa>
          </Box> */}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2.6, display: "grid", gap: 2.2 }}>
            <TextField
              label="Name"
              value={tempUser.name}
              onChange={(e) => setTempUser((p) => ({ ...p, name: e.target.value }))}
              fullWidth
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <UserRoundPen size={22} color={primary} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Email"
              type="email"
              value={tempUser.email}
              onChange={(e) => setTempUser((p) => ({ ...p, email: e.target.value }))}
              fullWidth
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail size={22} color={primary} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Phone"
              value={tempUser.phone}
              onChange={(e) => setTempUser((p) => ({ ...p, phone: e.target.value }))}
              fullWidth
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone size={22} color={primary} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Role */}
            <FormControl fullWidth variant="outlined">
              <InputLabel
                sx={{
                  fontWeight: 600,
                  color: alpha(text, 0.60),
                  "&.Mui-focused": { color: primary },
                }}
              >
                Role
              </InputLabel>

              <Select
                value={tempUser.role}
                onChange={(e) => setTempUser((p) => ({ ...p, role: e.target.value as TUserRole }))}
                IconComponent={ChevronDown as any}
                input={
                  <OutlinedInput
                    label="Role"
                    startAdornment={
                      <InputAdornment position="start" sx={{ ml: 0.2 }}>
                        <UserStar size={22} color={primary} />
                      </InputAdornment>
                    }
                  />
                }
                MenuProps={{
                  PaperProps: {
                    sx: {
                      mt: 1,
                      borderRadius: 2,
                      border: `1px solid ${alpha(text, 0.10)}`,
                      overflow: "hidden",
                      zIndex: 2000,
                    },
                  },
                }}
                sx={fieldSx}
                renderValue={(value) => (
                  <Typography sx={{ fontWeight: 600, color: alpha(text, 0.78), fontSize: 16 }}>
                    {String(value).charAt(0).toUpperCase() + String(value).slice(1)}
                  </Typography>
                )}
              >
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="driver">Driver</MenuItem>
                
              </Select>
            </FormControl>

            {/* Status */}
            <FormControl fullWidth variant="outlined">
              <InputLabel
                sx={{
                  fontWeight: 600,
                  color: alpha(text, 0.60),
                  "&.Mui-focused": { color: primary },
                }}
              >
                Status
              </InputLabel>

              <Select
                value={tempUser.status}
                onChange={(e) =>
                  setTempUser((p) => ({ ...p, status: e.target.value as "active" | "inactive" }))
                }
                IconComponent={ChevronDown as any}
                input={
                  <OutlinedInput
                    label="Status"
                    startAdornment={
                      <InputAdornment position="start" sx={{ ml: 0.2 }}>
                        <BadgeCheck size={22} color={primary} />
                      </InputAdornment>
                    }
                  />
                }
                MenuProps={{
                  PaperProps: {
                    sx: {
                      mt: 1,
                      borderRadius: 2,
                      border: `1px solid ${alpha(text, 0.10)}`,
                      overflow: "hidden",
                      zIndex: 2000,
                    },
                  },
                }}
                sx={fieldSx}
                renderValue={(value) => (
                  <Typography sx={{ fontWeight: 600, color: alpha(text, 0.78), fontSize: 16 }}>
                    {value === "active" ? "Active" : "Inactive"}
                  </Typography>
                )}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>

            <Button
              type="submit"
              disabled={isLoading}
              sx={{
                mt: 0.6,
                borderRadius: 2,
                py: 1,
                bgcolor: primary,
                color: "#fff",
                fontWeight: 800,
                textTransform: "none",
                fontSize: 18,
                "&:hover": { bgcolor: alpha(primary, 0.92) },
                "&.Mui-disabled": {
                  bgcolor: alpha(primary, 0.5),
                  color: alpha("#fff", 0.9),
                },
              }}
            >
              {isLoading ? "Updating..." : "Update User"}
            </Button>
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default UserSettingsModal;