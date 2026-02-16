/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { IoClose } from "react-icons/io5";
import toast from "react-hot-toast";
import {
  Avatar,
  Box,
  Button,
  Divider,
  FormControl,
  MenuItem,
  Select,
  Typography,
  alpha,
} from "@mui/material";
import { Mail, Phone, UserRoundPen, ChevronDown, Shield, BadgeCheck, UserStar } from "lucide-react";

import { TDispatcher, TUserRole } from "@/types/globalTypes";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { RootState, useAppSelector } from "@/redux/store";
import { socketService } from "@/services/socketService";

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: TDispatcher | null;
  onUpdateRole: (userId: string, newRole: TUserRole) => Promise<void>;
  onActivateUser: (userId: string) => Promise<void>;
  onDeactivateUser: (userId: string) => Promise<void>;
  isLoading?: boolean;
}

const DRAWER_RADIUS = 18;

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
    role: TUserRole;
    status: "active" | "deactive";
  }>({
    role: "employee",
    status: "active",
  });

  useEffect(() => {
    if (user) {
      setTempUser({
        role: user.role as TUserRole,
        status: user.active ? "active" : "deactive",
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
      if (user.role !== tempUser.role) {
        await onUpdateRole(user.id, tempUser.role);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Box
        sx={{
          width: "100%",
          maxWidth: 520,
          bgcolor: bg,
          borderRadius: `${DRAWER_RADIUS}px`,
          border: `1px solid ${alpha(text, 0.08)}`,
          boxShadow: "0 18px 60px rgba(0,0,0,0.22)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "999px",
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(primary, 0.12),
              }}
            >
              <UserRoundPen size={18} color={primary} />
            </Box>

            <Typography sx={{ fontWeight: 800, color: primary, fontSize: 18 }}>
              Edit User Information
            </Typography>
          </Box>

          <Button
            onClick={onClose}
            className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
          >
            <IoClose size={22} color={theme.currentPalette.primary} />
          </Button>
        </Box>

        <Divider />

        <Box sx={{ p: 2.5 }}>
          {/* User card */}
          <Box
            sx={{
              border: `1px solid ${alpha(primary, 0.2)}`,
              borderRadius: 6,
              p: 2,
              bgcolor: alpha(primary, 0.03),
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: alpha(primary, 0.18),
                  color: primary,
                  fontWeight: 900,
                  fontSize: 18,
                }}
              >
                {initials}
              </Avatar>

              <Typography sx={{ fontWeight: 800, color: alpha(text, 0.9), fontSize: 16 }}>
                {user.name}
              </Typography>
            </Box>

            <Box sx={{ mt: 2, display: "grid", gap: 1.2 }}>
              {/* Email row */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Mail size={18} color={primary} />
                  <Typography sx={{ fontWeight: 700, color: primary, fontSize: 13 }}>
                    Email
                  </Typography>
                </Box>

                <Typography sx={{ color: alpha(text, 0.65), fontSize: 13 }}>
                  {user.email}
                </Typography>
              </Box>

              {/* Phone row */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Phone size={18} color={primary} />
                  <Typography sx={{ fontWeight: 700, color: primary, fontSize: 13 }}>
                    Phone
                  </Typography>
                </Box>

                <Typography sx={{ color: alpha(text, 0.65), fontSize: 13 }}>
                  {user.phone}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2.2, display: "grid", gap: 2 }}>
            {/* Role */}
            <Box>
              <Typography
                sx={{
                  mb: 0.8,
                  fontSize: 13,
                  color: alpha(text, 0.6),
                  fontWeight: 700,
                }}
              >
                Role
              </Typography>

              <FormControl fullWidth>
                <Select
                  value={tempUser.role}
                  onChange={(e) =>
                    setTempUser((p) => ({ ...p, role: e.target.value as TUserRole }))
                  }
                  displayEmpty
                  IconComponent={ChevronDown as any}
                  sx={{
                    height: 54,
                    borderRadius: 6,
                    bgcolor: bg,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: alpha(text, 0.16),
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: alpha(primary, 0.35),
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: primary,
                      borderWidth: "2px",
                    },
                  }}
                  renderValue={(value) => (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                      <UserStar size={18} color={primary} />
                      <Typography sx={{ fontWeight: 700, color: alpha(text, 0.75) }}>
                        {String(value).charAt(0).toUpperCase() + String(value).slice(1)}
                      </Typography>
                    </Box>
                  )}
                >
                  <MenuItem value={"employee"}>Employee</MenuItem>
                  <MenuItem value={"admin"}>Admin</MenuItem>
                  <MenuItem value={"driver"}>Driver</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Status */}
            <Box>
              <Typography
                sx={{
                  mb: 0.8,
                  fontSize: 13,
                  color: alpha(text, 0.6),
                  fontWeight: 700,
                }}
              >
                Status
              </Typography>

              <FormControl fullWidth>
                <Select
                  value={tempUser.status}
                  onChange={(e) =>
                    setTempUser((p) => ({
                      ...p,
                      status: e.target.value as "active" | "deactive",
                    }))
                  }
                  displayEmpty
                  IconComponent={ChevronDown as any}
                  sx={{
                    height: 54,
                    borderRadius: 6,
                    bgcolor: bg,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: alpha(text, 0.16),
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: alpha(primary, 0.35),
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: primary,
                      borderWidth: "2px",
                    },
                  }}
                  renderValue={(value) => (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                      <BadgeCheck size={18} color={primary} />
                      <Typography sx={{ fontWeight: 700, color: alpha(text, 0.75) }}>
                        {value === "active" ? "Active" : "Deactive"}
                      </Typography>
                    </Box>
                  )}
                >
                  <MenuItem value={"active"}>Active</MenuItem>
                  <MenuItem value={"deactive"}>Deactive</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* CTA */}
            <Button
              type="submit"
              disabled={isLoading}
              sx={{
                mt: 0.5,
                height: 56,
                borderRadius: 6,
                bgcolor: primary,
                color: bg,
                fontWeight: 900,
                textTransform: "none",
                "&:hover": { bgcolor: alpha(primary, 0.92) },
                "&.Mui-disabled": {
                  bgcolor: alpha(primary, 0.5),
                  color: alpha(bg, 0.9),
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
