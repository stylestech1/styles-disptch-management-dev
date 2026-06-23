/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Loading from "@/components/ui/Loading";
import Titles from "@/components/ui/Titles";
import Erros from "@/components/ui/Erros";
import toast, { Toaster } from "react-hot-toast";
import { RootState, useAppDispatch, useAppSelector } from "@/redux/store";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { setError, clearError } from "@/redux/slices/uiSlice";
import { getErrorMessage } from "@/utils/getErrorMessage";

import {
  useGetUserInfoQuery,
  useUpdateUserInfoMutation,
  useUpdateUserPasswordMutation,
  useResendVerificationCodeMutation,
} from "@/redux/slices/apiSlice";

import {
  alpha,
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";

import {
  IoKeyOutline,
  IoPersonCircleOutline,
  IoMailOutline,
  IoCallOutline,
  IoIdCardOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoRefresh,
  IoPersonOutline,
  IoClose,
} from "react-icons/io5";

import { FaEye, FaEyeSlash } from "react-icons/fa";
import { UserRoundPen } from "lucide-react";

const UserProfile = () => {
  const [popup, setPopup] = useState(false);
  const [changePasswordPopup, setChangePasswordPopup] = useState(false);

  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    newPasswordConfirm: false,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const dispatch = useAppDispatch();
  const router = useRouter();
  const token = useAppSelector((state: RootState) => state.auth.token);
  const error = useAppSelector((state: RootState) => state.ui.error);
  const theme = useAppSelector((state: RootState) => state.palette);

  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
    refetch,
  } = useGetUserInfoQuery(undefined as any, { skip: !token });

  const profile = useMemo(() => userData?.data ?? null, [userData]);

  const [updateUser, { isLoading: updatingUser }] = useUpdateUserInfoMutation();
  const [updatePassword, { isLoading: updatingPassword }] =
    useUpdateUserPasswordMutation();

  const [resendVerificationCode, { isLoading: sendingVerifyCode }] =
    useResendVerificationCodeMutation();

  // Token Checking
  useEffect(() => {
    if (!token) {
      router.replace("/");
      return;
    }
  }, [token, router]);

  // handling Errors
  useEffect(() => {
    if (!userError) return;

    const errorMessage = getErrorMessage(userError);
    dispatch(setError(errorMessage));

    toast.error(errorMessage || "Loading failed");
  }, [userError, dispatch]);

  // Open Update popup and set form data
  const openUpdatePopup = () => {
    if (profile) {
      setFormData({
        name: profile.name ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
      });
    }
    dispatch(clearError());
    setPopup(true);
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Update My Data Function
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    try {
      await updateUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      }).unwrap();

      toast.success("User Updated successfully!");

      setPopup(false);
      refetch?.();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      dispatch(setError(errorMessage));
      toast.error(errorMessage || "Updating user failed");
      throw err;
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(clearError());

    try {
      await updatePassword(passwordData).unwrap();

      toast.success("Password Updated successfully!");

      setChangePasswordPopup(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        newPasswordConfirm: "",
      });
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      dispatch(setError(errorMessage));
      toast.error(errorMessage || "Updating password failed");
      throw err;
    }
  };
  const handleOpenVerifyEmail = async () => {
    if (!profile?.email) return;

    try {
      await resendVerificationCode({ email: profile.email }).unwrap();

      sessionStorage.setItem("verify_email", profile.email);
      sessionStorage.setItem("after_verify_redirect", "/user-profile");

      router.push("/verify-email");
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage || "Failed to send verification code");
    }
  };

  const dialogPaperSx = {
    borderRadius: 2,
    overflow: "auto",
    width: "450px"
  };

  const headerSx = {
    px: 2.2,
    py: 1.6,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: `1px solid ${alpha("#000", 0.08)}`,
    bgcolor: "#fff",
  };

  const titleRowSx = {
    display: "flex",
    alignItems: "center",
    gap: 1,
    color: theme.currentPalette.primary,
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      backgroundColor: "#fff",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: alpha("#000", 0.15),
    },
    "& .MuiInputLabel-root": {
      color: alpha("#000", 0.55),
    },
    mb: 2,
    "& .MuiFormLabel-asterisk": { color: "red" }
  };

  const footerSx = {
    px: 2,
    pb: 2,
    pt: 0.5,
    display: "flex",
    gap: 2,
    justifyContent: "space-between",
  };

  const cancelBtnSx = {
    flex: 1,
    py: 1.2,
    borderRadius: 2,
    borderColor: alpha(theme.currentPalette.primary, 0.45),
    color: theme.currentPalette.primary,
    bgcolor: "#fff",
    "&:hover": {
      borderColor: theme.currentPalette.primary,
      bgcolor: alpha(theme.currentPalette.primary, 0.06),
    },
  };

  const saveBtnSx = {
    flex: 1,
    py: 1.2,
    borderRadius: 2,
    bgcolor: theme.currentPalette.primary,
    color: "#fff",
    "&:hover": {
      bgcolor: alpha(theme.currentPalette.primary, 0.9),
    },
  };

  if (userLoading || updatingUser || updatingPassword) return <Loading />;

  return (
    <section className="container mx-auto p-6">
      <div className="mb-8 md:flex items-center justify-between">
        <div>
          <Titles>User Profile</Titles>
          <p className="text-slate-600 mt-2 mb-2 md:mb-0 text-sm">
            You can Update or View your information
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Button
            variant="outlined"
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              py: 1,
              color: theme.currentPalette.primary,
              borderColor: alpha(theme.currentPalette.primary, 0.6),
              "&:hover": {
                color: theme.currentPalette.background,
                background: alpha(theme.currentPalette.primary, 0.85),
              },
            }}
            onClick={openUpdatePopup}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IoRefresh size={18} />
              Update Profile
            </Box>
          </Button>

          <Button
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              py: 1,
              color: "#fff",
              background: theme.currentPalette.primary,
              "&:hover": {
                background: alpha(theme.currentPalette.primary, 0.85),
              },
            }}
            onClick={() => {
              dispatch(clearError());
              setChangePasswordPopup(true);
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IoKeyOutline size={18} />
              Change Password
            </Box>
          </Button>
        </div>
      </div>

      <Toaster position="top-center" />

      {error && (
        <div className="mb-6">
          <Erros message={error} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 mb-8">
        {profile && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="p-3 bg-slate-100 rounded-xl">
                <IoPersonCircleOutline size={28} className="text-slate-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  {profile.name}
                </h3>
                <p className="text-slate-500 text-sm mt-0.5">
                  ID: {profile.jobId}
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <IoMailOutline className="text-slate-400" size={16} />

                <span className="text-slate-600 truncate">{profile.email}</span>

                {profile.emailVerifiedAt ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <IoCheckmarkCircleOutline size={14} />
                    Verified at {new Date(profile.emailVerifiedAt).toLocaleDateString()}
                  </span>
                ) : (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleOpenVerifyEmail}
                    disabled={sendingVerifyCode}
                    sx={{
                      borderRadius: 999,
                      textTransform: "none",
                      fontSize: 12,
                      fontWeight: 700,
                      color: theme.currentPalette.primary,
                      borderColor: alpha(theme.currentPalette.primary, 0.5),
                    }}
                  >
                    {sendingVerifyCode ? "Sending..." : "Verify Email"}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3 text-sm">
                <IoCallOutline className="text-slate-400" size={16} />
                <span className="text-slate-600">{profile.phone}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <IoIdCardOutline className="text-slate-400" size={16} />
                <span className="text-slate-600 capitalize">
                  {profile.role}
                </span>
              </div>

              {profile.position && (
                <div className="flex items-center gap-3 text-sm">
                  <IoCalendarOutline className="text-slate-400" size={16} />
                  <span className="text-slate-600">{profile.position}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <IoCheckmarkCircleOutline
                  className="text-slate-400"
                  size={16}
                />
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${profile.active
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-slate-100 text-slate-800 border border-slate-200"
                    }`}
                >
                  {profile.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* update profile popup */}
      <Dialog
        open={popup}
        onClose={() => setPopup(false)}
        PaperProps={{ sx: dialogPaperSx }}
        maxWidth="sm"

      >
        <Box sx={headerSx}>
          <Box sx={titleRowSx}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(theme.currentPalette.primary, 0.12),
              }}
            >
              <UserRoundPen size={18} />
            </Box>
            <Typography sx={{ fontWeight: 800, color: "#0f172a" }}>
              Update Profile
            </Typography>
          </Box>

          <IconButton onClick={() => setPopup(false)} size="small">
            <IoClose />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 2.2, pt: 2, pb: 0, bgcolor: "#fff" }}>
          <Box
            component="form"
            id="update-profile-form"
            onSubmit={handleUpdateProfile}
            sx={{ display: "grid", gap: 2 }}
          >
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter full name"
              required
              disabled={updatingUser}
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IoPersonOutline color={theme.currentPalette.primary} size={22} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="e.g. test@gmail.com"
              required
              disabled={updatingUser}
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IoMailOutline color={theme.currentPalette.primary} size={22} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="e.g. +2010xxxxxxx"
              required
              disabled={updatingUser}
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IoCallOutline color={theme.currentPalette.primary} size={22} />
                  </InputAdornment>
                ),
              }}
            />

            <Typography
              sx={{
                my: 1,
                fontSize: 12,
                color: alpha("#000", 0.55),
              }}
            >
              <b>Note:</b> Managed fields (Role, Position, and Status) can only be updated by the system administrator for security reasons.
            </Typography>
          </Box>
        </DialogContent>

        <Box sx={footerSx}>
          <Button
            variant="outlined"
            sx={cancelBtnSx}
            onClick={() => setPopup(false)}
            disabled={updatingUser}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            sx={saveBtnSx}
            onClick={() => {
              const form = document.querySelector("#update-profile-form") as HTMLFormElement | null;
            }}
            type="submit"
            form="update-profile-form"
            disabled={updatingUser}
          >
            Save
          </Button>
        </Box>
      </Dialog>

      <style jsx global>{`
        #update-profile-form {
          display: contents;
        }
      `}</style>

      {/* Change Password */}

      <Dialog
        open={changePasswordPopup}
        onClose={() => setChangePasswordPopup(false)}
        PaperProps={{ sx: dialogPaperSx }}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={headerSx}>
          <Box sx={titleRowSx}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(theme.currentPalette.primary, 0.12),
              }}
            >
              <IoKeyOutline />
            </Box>
            <Typography sx={{ fontWeight: 800, color: "#0f172a" }}>
              Change Password
            </Typography>
          </Box>

          <IconButton onClick={() => setChangePasswordPopup(false)} size="small">
            <IoClose />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 2.2, pt: 2, pb: 0, bgcolor: "#fff" }}>
          <Box
            component="form"
            onSubmit={handleChangePassword}
            sx={{ display: "grid", gap: 2 }}
            id="change-password-form"
          >
            <TextField
              fullWidth
              label="Current Password"
              placeholder="Enter current password"
              type={showPassword.currentPassword ? "text" : "password"}
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))
              }
              required
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IoKeyOutline style={{ color: "rgba(0,0,0,0.45)" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowPassword((s) => ({
                          ...s,
                          currentPassword: !s.currentPassword,
                        }))
                      }
                      size="small"
                      sx={{ color: "rgba(0,0,0,0.45)" }}
                    >
                      {showPassword.currentPassword ? <FaEyeSlash /> : <FaEye />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="New Password"
              placeholder="Enter new password"
              type={showPassword.newPassword ? "text" : "password"}
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData((p) => ({ ...p, newPassword: e.target.value }))
              }
              required
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IoKeyOutline style={{ color: "rgba(0,0,0,0.45)" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowPassword((s) => ({ ...s, newPassword: !s.newPassword }))
                      }
                      size="small"
                      sx={{ color: "rgba(0,0,0,0.45)" }}
                    >
                      {showPassword.newPassword ? <FaEyeSlash /> : <FaEye />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirm New Password"
              placeholder="Confirm new password"
              type={showPassword.newPasswordConfirm ? "text" : "password"}
              value={passwordData.newPasswordConfirm}
              onChange={(e) =>
                setPasswordData((p) => ({ ...p, newPasswordConfirm: e.target.value }))
              }
              required
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IoKeyOutline style={{ color: "rgba(0,0,0,0.45)" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowPassword((s) => ({
                          ...s,
                          newPasswordConfirm: !s.newPasswordConfirm,
                        }))
                      }
                      size="small"
                      sx={{ color: "rgba(0,0,0,0.45)" }}
                    >
                      {showPassword.newPasswordConfirm ? <FaEyeSlash /> : <FaEye />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>

        <Box sx={footerSx}>
          <Button
            variant="outlined"
            sx={cancelBtnSx}
            onClick={() => setChangePasswordPopup(false)}
            disabled={updatingPassword}
          >
            CANCEL
          </Button>

          <Button
            variant="contained"
            sx={saveBtnSx}
            type="submit"
            form="change-password-form"
            disabled={updatingPassword}
          >
            Save
          </Button>
        </Box>
      </Dialog>
    </section>
  );
};

export default UserProfile;