"use client";
import { TCustomer } from "@/types/globalTypes";
import {
  alpha,
  Box,
  Button,
  Divider,
  FormControl,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import {
  IoAdd,
  IoCall,
  IoClose,
  IoMail,
  IoPerson,
} from "react-icons/io5";
import { useGetCustomersWithPaginationQuery } from "@/redux/slices/apiSlice";
import { useForm, Controller } from "react-hook-form";
import { RootState, useAppSelector } from "@/redux/store";

export const CustomerForm = ({
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
  formData: Partial<TCustomer>;
  onChange: (field: keyof TCustomer, value: TCustomer[keyof TCustomer]) => void;
  onSubmit: () => void;
  editMode: boolean;
  isLoading: boolean;
  closeOnOutsideClick?: boolean;
}) => {
  const token = useAppSelector((state: RootState) => state.auth.token);
  const theme = useAppSelector((state: RootState) => state.palette);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  // Use RTK Query to fetch customer with Customer role
  const {
    data: customerData,
    isLoading: customerLoading,
    error: customerError,
    refetch,
  } = useGetCustomersWithPaginationQuery({
    skip: !token,
  });

  //  react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    trigger,
  } = useForm<Omit<TCustomer, "type"> & { type: "" | "shipper" | "receiver" }>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      feedback: "",
      type: "",
    },
    mode: "onSubmit",
  });

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
        const fieldName = key as keyof TCustomer;
        const value = formData[key as keyof TCustomer];
        setValue(fieldName, value as never);
      });
    }
  }, [formData, setValue]);

  // Refetch customer when component opens
  useEffect(() => {
    if (open) {
      refetch();
      if (!editMode) {
        reset();
      }
    }
  }, [open, refetch, editMode, reset]);

  // Handle form submission
  const onSubmitForm = (data: TCustomer) => {
    Object.keys(data).forEach((key) => {
      const field = key as keyof TCustomer;
      const value = data[key as keyof TCustomer];
      onChange(field, value as TCustomer[keyof TCustomer]);
    });
    onSubmit();
  };

  // Handle field change with validation
  const handleFieldChange = async (
    field: keyof TCustomer,
    value: string | number
  ) => {
    setValue(field, value as never);
    await trigger(field);
    onChange(field as keyof TCustomer, value as TCustomer[keyof TCustomer]);
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
      sx={{bgcolor: theme.currentPalette.background}}
        ref={modalRef}
        className="relative rounded-2xl shadow-2xl border border-slate-200 bg-white p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {!editMode && (
              <Box>
                <IoAdd size={18} color={theme.currentPalette.primary} />
              </Box>
            )}
            <h3 className="text-xl font-semibold text-slate-800">
              {editMode ? "Edit Customer" : "Add New Customer"}
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
            {/* Customer Information Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-slate-800">
                  Customer Information
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
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Email *"
                        type="email"
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

                {/* Address Field */}
                <div className="mb-5">
                  <Controller
                    name="address"
                    control={control}
                    rules={{
                      required: "Full address is required",
                      minLength: {
                        value: 3,
                        message: "Address must be at least 3 characters",
                      },
                      maxLength: {
                        value: 250,
                        message: "Address must be less than 250 characters",
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Address *"
                        error={!!errors.address}
                        helperText={errors.address?.message as string}
                        size="medium"
                        placeholder="New York, USA"
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
                          handleFieldChange("address", e.target.value)
                        }
                      />
                    )}
                  />
                </div>

                {/* feedback Field */}
                <div className="mb-5">
                  <Controller
                    name="feedback"
                    control={control}
                    rules={{
                      required: "Full feedback is required",
                      minLength: {
                        value: 2,
                        message: "feedback must be at least 2 characters",
                      },
                      maxLength: {
                        value: 5000,
                        message: "feedback must be less than 50 characters",
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        multiline
                        rows={4}
                        label="feedback *"
                        error={!!errors.feedback}
                        helperText={errors.feedback?.message as string}
                        size="medium"
                        placeholder="Get your customer a feedback"
                        onChange={(e) =>
                          handleFieldChange("feedback", e.target.value)
                        }
                      />
                    )}
                  />
                </div>

                {/* Type Field */}
                <FormControl fullWidth error={!!errors.type} className="mb-5">
                  <Controller
                    name="type"
                    control={control}
                    rules={{
                      required: "Type is required",
                    }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        labelId="type-label"
                        fullWidth
                        size="medium"
                        displayEmpty
                        onChange={(e) =>
                          handleFieldChange("type", e.target.value)
                        }
                      >
                        <MenuItem value="">
                          <Typography sx={{ color: "text.secondary" }}>
                            Select Type...
                          </Typography>
                        </MenuItem>
                        <MenuItem value="shipper">Shipper</MenuItem>
                        <MenuItem value="receiver">Receiver</MenuItem>
                      </Select>
                    )}
                  />
                  {errors.type && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5 }}
                    >
                      {errors.type.message}
                    </Typography>
                  )}
                </FormControl>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            disabled={isLoading || customerLoading}
            sx={{
              mt: 2,
              py: 1.5,
              borderRadius: 1,
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
              : "Create Customer"}
          </Button>
        </form>
      </Box>
    </div>
  );
};
