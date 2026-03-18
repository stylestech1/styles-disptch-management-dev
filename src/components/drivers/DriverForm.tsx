import { TDriver, TUser } from "@/types/globalTypes";
import {
  alpha,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import {
  IoAdd,
  IoCalendar,
  IoCall,
  IoCash,
  IoClose,
  IoMail,
  IoPerson,
} from "react-icons/io5";
import { useGetUserDriverRoleQuery } from "@/redux/slices/apiSlice";
import { useForm, Controller } from "react-hook-form";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { RootState, useAppSelector } from "@/redux/store";

interface DriverFormData {
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  pricePerMile: string;
  hireDate: string;
  status: string;
  user: string;
}

export const DriverForm = ({
  open,
  onClose,
  formData,
  onChange,
  onSubmit,
  editMode,
  isLoading,
  closeOnOutsideClick = true,
}: {
  open: boolean;
  onClose: () => void;
  formData: Partial<TDriver>;
  onChange: (field: keyof TDriver, value: TDriver[keyof TDriver]) => void;
  onSubmit: () => void;
  editMode: boolean;
  isLoading: boolean;
  closeOnOutsideClick?: boolean;
}) => {
  const theme = useAppSelector((state: RootState) => state.palette);
  const token = useAppSelector((state: RootState) => state.auth.token);
  const [searchedUser, setSearchedUser] = useState<TUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
    refetch,
  } = useGetUserDriverRoleQuery({ skip: !token });

  //  react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    trigger,
    watch,
  } = useForm<DriverFormData>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      licenseNumber: "",
      pricePerMile: "",
      hireDate: "",
      status: "",
      user: "",
    },
    mode: "onSubmit",
  });

  const emailValue = watch("email");

  // closing popup
  useEffect(() => {
    const handleBodyScroll = (shouldPrevent: boolean) => {
      document.body.style.overflow = shouldPrevent ? "hidden" : "unset";
    };

    handleBodyScroll(open);
    return () => handleBodyScroll(false);
  }, [open]);
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open && !isSelectOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose, isSelectOpen]);
  useEffect(() => {
    const checkSelectState = () => {
      const selectMenus = document.querySelectorAll(
        ".MuiMenu-paper, .MuiPopover-root"
      );
      const isOpen = Array.from(selectMenus).some((menu) => {
        const style = window.getComputedStyle(menu);
        return style.display !== "none" && style.visibility !== "hidden";
      });
      setIsSelectOpen(isOpen);
    };

    const interval = setInterval(checkSelectState, 100);

    return () => clearInterval(interval);
  }, [open]);

  // when updating data
  useEffect(() => {
    if (formData) {
      Object.keys(formData).forEach((key) => {
        const fieldName = key as keyof DriverFormData;
        const value = formData[key as keyof TDriver];
        setValue(fieldName, value as never);
      });
    }
  }, [formData, setValue]);

  // Refetch users when component opens
  useEffect(() => {
    if (open) {
      refetch();
      if (!editMode) {
        reset();
        setSearchedUser(null);
      }
    }
  }, [open, refetch, editMode, reset]);

  // Handling User Email Searching
  useEffect(() => {
    const searchUserByEmail = async () => {
      if (emailValue && emailValue.includes("@")) {
        setIsSearching(true);

        setTimeout(() => {
          const users = usersData?.data || [];
          const foundUser = users.find(
            (user: TUser) =>
              user.email.toLowerCase() === emailValue.toLowerCase()
          );

          setSearchedUser(foundUser || null);

          if (foundUser) {
            setValue("user", foundUser.id);
            handleFieldChange("user", foundUser.id);
          } else {
            setValue("user", "");
            handleFieldChange("user", "");
          }

          setIsSearching(false);
        }, 500);
      } else {
        setSearchedUser(null);
        setValue("user", "");
        handleFieldChange("user", "");
      }
    };

    searchUserByEmail();
  }, [emailValue, usersData]);

  // Handle form submission
  const onSubmitForm = (data: DriverFormData) => {
    Object.keys(data).forEach((key) => {
      const field = key as keyof TDriver;
      const value = data[key as keyof DriverFormData];
      onChange(field, value as TDriver[keyof TDriver]);
    });
    onSubmit();
  };

  // Handle field change with validation
  const handleFieldChange = async (
    field: keyof DriverFormData,
    value: string | number
  ) => {
    setValue(field, value as never);
    await trigger(field);
    onChange(field as keyof TDriver, value as TDriver[keyof TDriver]);
  };

  if (!open) return null;

  return (
    <div
      onClick={(e) => {
        if (
          closeOnOutsideClick &&
          modalRef.current &&
          !modalRef.current.contains(e.target as Node) &&
          !isSelectOpen
        ) {
          onClose();
        }
      }}
      className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4"
    >
      <Box
        sx={{ bgcolor: theme.currentPalette.background }}
        ref={modalRef}
        className="relative rounded-2xl shadow-2xl border border-slate-200 bg-white p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {!editMode && (
              <Box>
                <IoAdd size={18} />
              </Box>
            )}
            <h3 className="text-xl font-semibold text-slate-800">
              {editMode ? "Edit Driver" : "Add New Driver"}
            </h3>
          </div>
          <Button
            onClick={onClose}
            className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
          >
            <IoClose size={24} />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <div className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-slate-800">
                  Personal Information
                </h4>
              </div>
              <Divider sx={{ mb: 3 }} />
              <div className="space-y-4">
                {/* Name Field */}
                <div className="mb-5">
                  <Controller
                    name="name"
                    control={control}
                    rules={{
                      required: "Full name is required",
                      minLength: {
                        value: 2,
                        message: "Name must be at least 2 characters",
                      },
                      maxLength: {
                        value: 50,
                        message: "Name must be less than 50 characters",
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Full Name *"
                        error={!!errors.name}
                        helperText={errors.name?.message as string}
                        size="medium"
                        placeholder="John Doe"
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <IoPerson className="text-slate-400" />
                              </InputAdornment>
                            ),
                          },
                        }}
                        onChange={(e) =>
                          handleFieldChange("name", e.target.value)
                        }
                      />
                    )}
                  />
                </div>

                {/* Email Field */}
                <div className="mb-5">
                  <Controller
                    name="email"
                    control={control}
                    rules={{
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Email *"
                        type="email"
                        error={!!errors.email}
                        helperText={errors.email?.message as string}
                        size="medium"
                        placeholder="john.doe@example.com"
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <IoMail className="text-slate-400" />
                              </InputAdornment>
                            ),
                          },
                        }}
                        onChange={(e) =>
                          handleFieldChange("email", e.target.value)
                        }
                      />
                    )}
                  />
                </div>

                {/* Phone Field */}
                <div className="mb-5">
                  <Controller
                    name="phone"
                    control={control}
                    rules={{
                      required: "Phone number is required",
                      pattern: {
                        value: /^[0-9+\-\s()]+$/,
                        message: "Invalid phone number format",
                      },
                      minLength: {
                        value: 8,
                        message: "Phone number must be at least 8 digits",
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Phone *"
                        error={!!errors.phone}
                        helperText={errors.phone?.message as string}
                        size="medium"
                        placeholder="+1234567890"
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <IoCall className="text-slate-400" />
                              </InputAdornment>
                            ),
                          },
                        }}
                        onChange={(e) =>
                          handleFieldChange("phone", e.target.value)
                        }
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Professional Information Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-slate-800">
                  Professional Information
                </h4>
              </div>
              <Divider sx={{ mb: 3 }} />
              <div className="space-y-4">
                {/* License Number Field */}
                <div className="mb-5">
                  <Controller
                    name="licenseNumber"
                    control={control}
                    rules={{
                      required: "License number is required",
                      minLength: {
                        value: 5,
                        message: "License number must be at least 5 characters",
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="License Number *"
                        error={!!errors.licenseNumber}
                        helperText={errors.licenseNumber?.message as string}
                        size="medium"
                        placeholder="DL123456789"
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <IoCash className="text-slate-400" />
                              </InputAdornment>
                            ),
                          },
                        }}
                        onChange={(e) =>
                          handleFieldChange("licenseNumber", e.target.value)
                        }
                      />
                    )}
                  />
                </div>

                {/* Price Per Mile Field */}
                <div className="mb-5">
                  <Controller
                    name="pricePerMile"
                    control={control}
                    rules={{
                      required: "Price per mile is required",
                      validate: {
                        validFormat: (value) =>
                          /^\d+(\.\d{1,2})?$/.test(value) ||
                          "Only up to 2 decimal places allowed",
                        minValue: (value) =>
                          parseFloat(value) >= 0 || "Price cannot be negative",
                        maxValue: (value) =>
                          parseFloat(value) <= 1000 || "Price seems too high",
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Price Per Mile *"
                        type="text"
                        placeholder="0.75"
                        error={!!errors.pricePerMile}
                        helperText={errors.pricePerMile?.message as string}
                        size="medium"
                        inputProps={{
                          inputMode: "decimal",
                        }}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <IoCash className="text-slate-400" />
                              </InputAdornment>
                            ),
                          },
                        }}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (/^\d*\.?\d{0,2}$/.test(value)) {
                            handleFieldChange("pricePerMile", value);
                          }
                        }}
                      />
                    )}
                  />
                </div>

                {/* Hire Date Field */}
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name="hireDate"
                    control={control}
                    rules={{
                      required: "Hire date is required",
                    }}
                    render={({ field }) => (
                      <DatePicker
                        {...field}
                        label="Hire Date *"
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(date) =>
                          handleFieldChange(
                            "hireDate",
                            date ? date.toISOString() : ""
                          )
                        }
                        slotProps={{
                          popper: {
                            disablePortal: true,
                            sx: {
                              "& .MuiPaper-root": {
                                bgcolor: theme.currentPalette.background,
                              },
                            },
                          },
                          textField: {
                            fullWidth: true,
                            error: !!errors.hireDate,
                            helperText: errors.hireDate?.message as string,
                            sx: {
                              bgcolor: theme.currentPalette.background,
                              "& .MuiInputBase-root": {
                                bgcolor: theme.currentPalette.background,
                              },
                            },
                            slotProps: {
                              input: {
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <IoCalendar className="text-slate-400" />
                                  </InputAdornment>
                                ),
                              },
                            },
                          },
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            disabled={isLoading || usersLoading}
            sx={{
              mt: 2,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 500,
              color: "#fff",
              background: theme.currentPalette.primary,
              "&:hover": {
                background: alpha(theme.currentPalette.primary, 0.85),
              },
            }}
          >
            {isLoading
              ? editMode
                ? "Saving..."
                : "Creating..."
              : editMode
                ? "Save Changes"
                : "Create Driver"}
          </Button>
        </form>
      </Box>
    </div>
  );
};
