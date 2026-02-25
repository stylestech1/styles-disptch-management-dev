"use client";
import Loading from "@/components/ui/Loading";
import Titles from "@/components/ui/Titles";
import { RootState, useAppDispatch, useAppSelector } from "@/redux/store";
import { useState, useEffect } from "react";
import Erros from "@/components/ui/Erros";
import toast, { Toaster } from "react-hot-toast";
import { IoKeyOutline } from "react-icons/io5";
import {
  IoPersonCircleOutline,
  IoMailOutline,
  IoCallOutline,
  IoIdCardOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoRefresh,
  IoPersonOutline,
} from "react-icons/io5";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {
  useGetUserInfoQuery,
  useUpdateUserInfoMutation,
  useUpdateUserPasswordMutation,
} from "@/redux/slices/apiSlice";
import { useRouter } from "next/navigation";
import { setError, clearError } from "@/redux/slices/uiSlice";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { alpha, Button, FormControl, IconButton, InputAdornment, InputLabel, OutlinedInput, TextField } from "@mui/material";
import Modal from "../ui/Modals";

const UserProfile = () => {
  const [popup, setPopup] = useState(false);
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    newPasswordConfirm: false,
  });
  const [changePasswordPopup, setChangePasswordPopup] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
  });

  // State for form data
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
  } = useGetUserInfoQuery({ skip: !token });

  const profile = userData?.data || [];

  const [updateUser, { isLoading: updatingUser }] = useUpdateUserInfoMutation();
  const [updatePassword, { isLoading: updatingPassword }] =
    useUpdateUserPasswordMutation();

  // Token Checking
  useEffect(() => {
    if (!token) {
      router.replace("/");
      return;
    }
  }, [token, router]);

  // handling Errors
  useEffect(() => {
    if (userError) {
      const errorMessage = getErrorMessage(userError);
      setError(errorMessage);
      toast.error(errorMessage || "Loading failed ❌", {
        style: { background: "#dc2626", color: "#fff" },
      });
    }
  }, [userError, setError]);

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

      toast.success("User Updated successfully!", {
        style: { background: "#16a34a", color: "#fff" },
      });

      setPopup(false);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      dispatch(setError(errorMessage));
      toast.error(errorMessage || "Updating user failed ❌");
      throw err;
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open popup and set form data
  const openUpdatePopup = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
      });
    }
    setPopup(true);
    dispatch(clearError());
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(clearError());

    try {
      await updatePassword(passwordData).unwrap();

      toast.success("Password Updated successfully!", {
        style: { background: "#16a34a", color: "#fff" },
      });

      // Reset and close popup
      setChangePasswordPopup(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        newPasswordConfirm: "",
      });
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      dispatch(setError(errorMessage));
      toast.error(errorMessage || "Updating user failed ❌");
      throw err;
    }
  };

  if (userLoading || updatingUser || updatingPassword) return <Loading />;

  return (
    <section className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Titles>User Profile</Titles>
          <p className="text-slate-600 mt-2 text-sm">
            You can Update or View your information
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="outlined"
            sx={{
              borderRadius: 2,
              fontWeight: 500,
              py: 1,
              color: theme.currentPalette.primary,
              borderColor: theme.currentPalette.primary,
              "&:hover": {
                color: theme.currentPalette.background,
                background: alpha(theme.currentPalette.primary, 0.85),
              },
            }}
            onClick={openUpdatePopup}
            className="flex items-center gap-2 py-5 px-5 cursor-pointer text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg shadow-sm font-medium"
          >
            <IoRefresh size={18} />
            Update Profile
          </Button>

          <Button
            sx={{
              borderRadius: 2,
              fontWeight: 500,
              py: 1,
              color: theme.currentPalette.background,
              background: theme.currentPalette.primary,
              "&:hover": {
                background: alpha(theme.currentPalette.primary, 0.85),
              },
            }}
            onClick={() => setChangePasswordPopup(true)}
            className="flex items-center gap-2 py-5 px-5 cursor-pointer text-white bg-emerald-600 hover:bg-emerald-700 transition-colors rounded-lg shadow-sm font-medium"
          >
            <IoKeyOutline size={18} />
            Change Password
          </Button>
        </div>
      </div>

      <Toaster position="top-center" />

      {/* Errors */}
      {error && (
        <div className="mb-6">
          <Erros message={error} />
        </div>
      )}

      {/* Profile and Summary Cards */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        {/* Driver Profile Card */}
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
              <div className="flex items-center gap-3 text-sm">
                <IoMailOutline
                  className="text-slate-400 flex-shrink-0"
                  size={16}
                />
                <span className="text-slate-600 truncate">{profile.email}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <IoCallOutline
                  className="text-slate-400 flex-shrink-0"
                  size={16}
                />
                <span className="text-slate-600">{profile.phone}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <IoIdCardOutline
                  className="text-slate-400 flex-shrink-0"
                  size={16}
                />
                <span className="text-slate-600 capitalize">
                  {profile.role}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <IoCalendarOutline
                  className="text-slate-400 flex-shrink-0"
                  size={16}
                />
                <span className="text-slate-600">{profile.position}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <IoCheckmarkCircleOutline
                  className="text-slate-400 flex-shrink-0"
                  size={16}
                />
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    profile.active
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

      {/* Update Profile Popup */}
      <Modal
        isOpen={popup}
        onClose={() => setPopup(false)}
        title={"Update Profile"}
        size="md"
        closeOnOutsideClick={false}
      >
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="mt-5">
            <div className="relative">
              <TextField
                fullWidth
                label="Full Name"
                size="medium"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter full name"
                required
                disabled={updatingUser}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IoPersonOutline className="h-5 w-5 text-slate-400" />{" "}
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <TextField
                fullWidth
                label="Email"
                type="email"
                name="email"
                size="medium"
                value={formData.email}
                onChange={handleInputChange}
                disabled={updatingUser}
                required
                placeholder="Enter email address"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IoMailOutline className="h-5 w-5 text-slate-400" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                size="medium"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={updatingUser}
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IoCallOutline className="h-5 w-5 text-slate-400" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              fullWidth
              onClick={() => setPopup(false)}
              className="flex-1 py-3 px-4 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              disabled={updatingUser}
              variant="outlined"
              sx={{
                mt: 2,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 500,
                color: theme.currentPalette.primary,
                borderColor: theme.currentPalette.primary,
                "&:hover": {
                  color: theme.currentPalette.background,
                  background: alpha(theme.currentPalette.primary, 0.85),
                },
              }}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              fullWidth
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={updatingUser}
              sx={{
                mt: 2,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 500,
                color: theme.currentPalette.background,
                background: theme.currentPalette.primary,
                "&:hover": {
                  background: alpha(theme.currentPalette.primary, 0.85),
                },
              }}
            >
              {updatingUser ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <IoRefresh size={18} />
                  Update Profile
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Read-only fields info */}
        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Note:</h4>
          <p className="text-xs text-slate-600">
            Role, Position, and Status cannot be changed from this form. Please
            contact administrator for these changes.
          </p>
        </div>
      </Modal>

      {/* Update Password Popup */}
      <Modal
        isOpen={changePasswordPopup}
        onClose={() => setChangePasswordPopup(false)}
        title={"Change Password"}
        size="md"
        closeOnOutsideClick={false}
      >
        <form onSubmit={handleChangePassword} className="space-y-4 mt-5">
          {["currentPassword", "newPassword", "newPasswordConfirm"].map(
            (key) => (
              <FormControl key={key} fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ textTransform: "capitalize" }}>
                  {key.replace(/([A-Z])/g, " $1")}
                </InputLabel>
                <OutlinedInput
                  type={
                    showPassword[key as keyof typeof showPassword]
                      ? "text"
                      : "password"
                  }
                  value={passwordData[key as keyof typeof passwordData]}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      [key]: e.target.value,
                    })
                  }
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowPassword((prev) => ({
                            ...prev,
                            [key]: !prev[key as keyof typeof showPassword],
                          }))
                        }
                        edge="end"
                        sx={{
                          color: "grey.400",
                          "&:hover": { color: "grey.600" },
                        }}
                      >
                        {showPassword[key as keyof typeof showPassword] ? (
                          <FaEyeSlash size={18} />
                        ) : (
                          <FaEye size={18} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  }
                  label={key.replace(/([A-Z])/g, " $1")}
                  required
                />
              </FormControl>
            )
          )}

          <Button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all"
            sx={{
              mt: 2,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 500,
              color: theme.currentPalette.background,
              background: theme.currentPalette.primary,
              "&:hover": {
                background: alpha(theme.currentPalette.primary, 0.85),
              },
            }}
          >
            Update Password
          </Button>
        </form>
      </Modal>
    </section>
  );
};

export default UserProfile;
