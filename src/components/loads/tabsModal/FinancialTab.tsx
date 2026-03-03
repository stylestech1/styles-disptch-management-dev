"use client";
import { RootState, useAppSelector } from "@/redux/store";
import { FinancialTabProps } from "@/types/globalTypes";
import {
  alpha,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  CircleDollarSign,
  Coins,
  DollarSign,
  KeyRound,
  Plus,
  Trash2,
} from "lucide-react";
import { IoAdd, IoCash, IoCheckmark, IoClose, IoKey } from "react-icons/io5";
import { MdError, MdPictureAsPdf } from "react-icons/md";
import { useState, useEffect } from "react";

// Load Details Tab Component
const FinancialTab: React.FC<FinancialTabProps> = ({
  allDistance,
  price,
  fees,
  loadIDInp,
  pricePerMile,
  destinations,
  isEditing,
  selectedDocuments,
  uploadError,
  isDragging,
  adjustments = [],
  onFileSelect,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onRemoveFile,
  onPriceChange,
  onFeesChange,
  onLoadIDChange,
  onAdjustmentsChange,
  isTabValid,
  onPrevTab,
  onNextTab,
}) => {
  const canAddMoreFiles = selectedDocuments.length < 2;
  const theme = useAppSelector((state: RootState) => state.palette);

  useEffect(() => {
    if (onAdjustmentsChange) {
      onAdjustmentsChange(adjustments || []);
    }
  }, []);

  const handleAddAdjustment = () => {
    const newAdjustment = {
      id: Date.now(),
      type: "Bonus" as const,
      amount: 0,
    };
    const updatedAdjustments = [...(adjustments || []), newAdjustment];
    if (onAdjustmentsChange) {
      onAdjustmentsChange(updatedAdjustments);
    }
  };

  const handleRemoveAdjustment = (id: number) => {
    const updatedAdjustments = (adjustments || []).filter(
      (adj) => adj.id !== id,
    );
    if (onAdjustmentsChange) {
      onAdjustmentsChange(updatedAdjustments);
    }
  };

  const handleTypeChange = (
    id: number,
    type: "Bonus" | "Detention" | "Deduction",
  ) => {
    const updatedAdjustments = (adjustments || []).map((adj) =>
      adj.id === id ? { ...adj, type } : adj,
    );
    if (onAdjustmentsChange) {
      onAdjustmentsChange(updatedAdjustments);
    }
  };

  const handleAmountChange = (id: number, amount: number) => {
    // Ensure amount is a valid number
    const parsedAmount = isNaN(amount) ? 0 : amount;
    const updatedAdjustments = (adjustments || []).map((adj) =>
      adj.id === id ? { ...adj, amount: parsedAmount } : adj,
    );
    if (onAdjustmentsChange) {
      onAdjustmentsChange(updatedAdjustments);
    }
  };

  return (
    <div className="space-y-6 flex-1 overflow-y-auto">
      <div className="flex flex-col gap-5">
        {/* Financial Summary */}
        <Box
          sx={{
            border: `1px solid ${alpha(theme.currentPalette.primary, 0.3)}`,
            borderRadius: 2,
            p: 2.5,
            bgcolor: alpha(theme.currentPalette.text, 0.03),
          }}
        >
          {/* Header */}
          <Stack direction="row" spacing={1} alignItems="center" mb={2}>
            <DollarSign size={18} color="#317435" />
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: "1rem",
                color: "#364153",
              }}
            >
              Financial Summary
            </Typography>
          </Stack>

          {/* Distance */}
          <Stack direction="row" justifyContent="space-between" mb={1.5}>
            <Typography sx={{ color: alpha(theme.currentPalette.text, 0.65) }}>
              Calculated Distance:
            </Typography>
            <Typography sx={{ fontWeight: 500, color: "#08172B" }}>
              {allDistance ? `${allDistance} miles` : "Calculating..."}
            </Typography>
          </Stack>

          {/* Price per mile */}
          <Stack direction="row" justifyContent="space-between" mb={2}>
            <Typography sx={{ color: alpha(theme.currentPalette.text, 0.65) }}>
              Price Per Mile:
            </Typography>
            <Typography sx={{ fontWeight: 500, color: "#666666" }}>
              {pricePerMile ? `$${Number(pricePerMile).toFixed(2)}` : "$0.00"}
            </Typography>
          </Stack>
          <Divider
            sx={{
              mb: 2,
              borderColor: alpha(theme.currentPalette.text, 0.25),
            }}
          />
          {/* Total */}
          <Stack direction="row" justifyContent="space-between">
            <Typography
              sx={{
                color: alpha(theme.currentPalette.text, 0.65),
              }}
            >
              Total Price:
            </Typography>
            <Typography
              sx={{
                fontWeight: 700,
                color: "#317435",
                fontSize: "1.1rem",
              }}
            >
              {price ? `$${price}` : "0.00"}
            </Typography>
          </Stack>
        </Box>

        {/* load and price table  */}
        <Box className="flex justify-start">
          <Typography>Load Identity & Pricing</Typography>
        </Box>
        <Box
          sx={{
            border: `1px solid ${alpha(theme.currentPalette.primary, 0.3)}`,
            borderRadius: 2,
          }}
          className="grid grid-cols-1 md:grid-cols-3"
        >
          <Stack
            direction="column"
            alignItems="center"
            spacing={0.5}
            sx={{
              borderRight: `1px solid ${alpha(
                theme.currentPalette.primary,
                0.3,
              )}`,
            }}
          >
            <Typography
              sx={{
                bgcolor: alpha(theme.currentPalette.text, 0.05),
                padding: 2,
                width: "100%",
                textAlign: "center",
              }}
            >
              Load ID <span className="text-red-600">*</span>
            </Typography>

            <div className="relative w-full">
              <TextField
                type="text"
                value={loadIDInp}
                onChange={(e) => onLoadIDChange(e.target.value)}
                sx={{
                  bgcolor: theme.currentPalette.background,
                  width: "100%",
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      border: "none",
                    },
                    "&:hover fieldset": {
                      border: "none",
                    },
                    "&.Mui-focused fieldset": {
                      border: "none",
                    },
                  },
                }}
                placeholder="0.00"
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <KeyRound
                          className="h-5 w-5"
                          color={theme.currentPalette.secondary}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </div>
          </Stack>

          <Stack
            direction="column"
            alignItems="center"
            spacing={0.5}
            sx={{
              borderRight: `1px solid ${alpha(
                theme.currentPalette.primary,
                0.3,
              )}`,
            }}
          >
            <Typography
              sx={{
                bgcolor: alpha(theme.currentPalette.text, 0.05),
                padding: 2,
                width: "100%",
                textAlign: "center",
              }}
            >
              Total Price <span className="text-red-600">*</span>
            </Typography>

            <div className="relative w-full">
              <TextField
                type="text"
                value={price}
                onChange={(e) => onPriceChange(e.target.value)}
                sx={{
                  bgcolor: theme.currentPalette.background,
                  width: "100%",
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      border: "none",
                    },
                    "&:hover fieldset": {
                      border: "none",
                    },
                    "&.Mui-focused fieldset": {
                      border: "none",
                    },
                  },
                }}
                placeholder="0.00"
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <DollarSign className="h-5 w-5" color={"#317435"} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </div>
          </Stack>

          <Stack direction="column" alignItems="center" spacing={0.5}>
            <Typography
              sx={{
                bgcolor: alpha(theme.currentPalette.text, 0.05),
                padding: 2,
                width: "100%",
                textAlign: "center",
              }}
            >
              Fees Number
            </Typography>

            <div className="relative w-full">
              <TextField
                type="text"
                value={fees}
                onChange={(e) => onFeesChange(e.target.value)}
                sx={{
                  bgcolor: theme.currentPalette.background,
                  width: "100%",
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      border: "none",
                    },
                    "&:hover fieldset": {
                      border: "none",
                    },
                    "&.Mui-focused fieldset": {
                      border: "none",
                    },
                  },
                }}
                placeholder="0.00"
                // required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Coins className="h-5 w-5" color={"#317435"} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </div>
          </Stack>
        </Box>

        {isEditing && (
          <>
            {/* Financial Adjustments*/}
            <div className="flex justify-between items-center mb-2">
              <Typography sx={{ color: theme.currentPalette.text }}>
                Financial Adjustments
              </Typography>

              <Button
                type="button"
                onClick={handleAddAdjustment}
                startIcon={<Plus size={14} />}
                sx={{
                  color: theme.currentPalette.primary,
                  border: `1px solid ${alpha(theme.currentPalette.primary, 0.4)}`,
                  borderRadius: "6px",
                  textTransform: "none",
                  padding: "4px 12px",
                  fontSize: "13px",
                }}
              >
                Add Adjustment
              </Button>
            </div>

            {adjustments && adjustments.length > 0 ? (
              adjustments.map((adj) => (
                <Box
                  key={adj.id}
                  sx={{
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    padding: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  {/* Type */}
                  <Select
                    value={adj.type}
                    onChange={(e: SelectChangeEvent) =>
                      handleTypeChange(
                        adj.id,
                        e.target.value as "Bonus" | "Detention" | "Deduction",
                      )
                    }
                    sx={{
                      minWidth: 120,
                      height: 40,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "6px",
                      },
                    }}
                  >
                    <MenuItem value="Bonus">Bonus</MenuItem>
                    <MenuItem value="Detention">Detention</MenuItem>
                    <MenuItem value="Deduction">Deduction</MenuItem>
                  </Select>

                  {/* Amount */}
                  <TextField
                    fullWidth
                    // type="number"
                    value={adj.amount || ""}
                    onChange={(e) =>
                      handleAmountChange(
                        adj.id,
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    placeholder="0"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "6px",
                        height: 40,
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DollarSign size={16} color="#317435" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* Delete */}
                  <IconButton
                    sx={{
                      color: "#A3231B",
                    }}
                    onClick={() => handleRemoveAdjustment(adj.id)}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Box>
              ))
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  textAlign: "center",
                  py: 2,
                  fontStyle: "italic",
                }}
              >
                No adjustments added
              </Typography>
            )}
          </>
        )}

        {/* Documents - Drag & Drop Area */}
        <div className="md:col-span-2">
          <Typography sx={{ color: theme.currentPalette.text, mb: 1 }}>
            Upload Documents
          </Typography>

          <div
            className={`
              border-2 rounded-lg p-6 transition-all duration-200
              ${isDragging ? "ring-2 ring-offset-1" : ""}
            `}
            style={{
              borderColor: isDragging
                ? theme.currentPalette.primary
                : alpha(theme.currentPalette.primary, 0.3),
              backgroundColor: isDragging
                ? `${theme.currentPalette.primary}20`
                : theme.currentPalette.background,
            }}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <MdPictureAsPdf
                  color={alpha(theme.currentPalette.secondary, 0.7)}
                  size={50}
                />
              </div>

              <input
                type="file"
                id="pdf-upload-create"
                accept=".pdf,application/pdf"
                multiple
                onChange={onFileSelect}
                disabled={!canAddMoreFiles}
                className="hidden"
              />
              <label
                htmlFor="pdf-upload-create"
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium 
                  transition-all duration-200 cursor-pointer
                  ${canAddMoreFiles ? "" : "cursor-not-allowed opacity-60"}
                `}
                style={{
                  backgroundColor: canAddMoreFiles
                    ? theme.currentPalette.primary
                    : theme.currentPalette.background,
                  color: canAddMoreFiles
                    ? theme.currentPalette.background
                    : theme.currentPalette.text,
                  border: `1px solid ${
                    canAddMoreFiles
                      ? theme.currentPalette.primary
                      : theme.currentPalette.text
                  }`,
                }}
              >
                Select PDF Files
              </label>

              <p className="text-xs text-slate-500 mt-3">
                or <strong>drag and drop</strong> PDF files here
              </p>

              {uploadError && (
                <div className="mt-3 flex items-center justify-center gap-2 text-red-600 text-sm">
                  <MdError size={16} />
                  {uploadError}
                </div>
              )}

              {/* Selected Files Preview */}
              {selectedDocuments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-slate-700">
                    Selected Files ({selectedDocuments.length}/2):
                  </p>
                  {selectedDocuments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        <MdPictureAsPdf className="text-red-500" size={18} />
                        <div className="text-left">
                          <p className="text-sm font-medium text-slate-800">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="contained"
                        type="button"
                        onClick={() => onRemoveFile(index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <IoClose size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* <div className="flex justify-between pt-4">
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
        </div> */}
      </div>
    </div>
  );
};

export default FinancialTab;
