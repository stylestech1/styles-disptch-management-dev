import { useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import Modal from "@/components/ui/Modals";
import {
  useUpdateLoadsStatusMutation,
  useUpdateDetentionLayoverStatusMutation,
} from "@/redux/slices/apiSlice";
import { TLoads, TStatusLoad } from "@/types/globalTypes";
import { IoTime, IoRefresh, IoAdd, IoTrash } from "react-icons/io5";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/utils/getErrorMessage";
import {
  Button,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import { RootState, useAppSelector } from "@/redux/store";

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  load: TLoads;
}

type TonuStatus = "pending" | "paid" | "refused";

type DetentionLayoverType = "detention" | "layover";

type DetentionLayoverSource = "shipper" | "receiver";

type DetentionLayoverStatus = "requested" | "paid" | "refused";

interface DetentionLayover {
  id?: string;
  type: DetentionLayoverType;
  source: DetentionLayoverSource;
  status: DetentionLayoverStatus;
}

const createDefaultDetentionLayover = (): DetentionLayover => ({
  type: "detention",
  source: "shipper",
  status: "requested",
});

const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  isOpen,
  onClose,
  load,
}) => {
  const theme = useAppSelector((state: RootState) => state.palette);

  const [selectedStatus, setSelectedStatus] = useState<TStatusLoad>(
    load?.status || "pending"
  );

  const [deliveredAt, setDeliveredAt] = useState<string>(
    load?.deliveredAt || ""
  );

  const [showDeliveredAt, setShowDeliveredAt] = useState(
    load?.status === "delivered"
  );

  const [detentionLayovers, setDetentionLayovers] = useState<
    DetentionLayover[]
  >(
    load?.status === "delivered"
      ? [createDefaultDetentionLayover()]
      : []
  );

  const [tonuStatus, setTonuStatus] = useState<TonuStatus>("pending");

  const [tonuReason, setTonuReason] = useState("");

  const [showTonuFields, setShowTonuFields] = useState(
    load?.status === "truck_order_not_used"
  );

  const [updateLoadStatus, { isLoading: updatingStatus }] =
    useUpdateLoadsStatusMutation();

  const [
    updateDetentionLayoverStatus,
    { isLoading: updatingRecordStatus },
  ] = useUpdateDetentionLayoverStatusMutation();

  const handleStatusChange = (e: SelectChangeEvent) => {
    const newStatus = e.target.value as TStatusLoad;

    setSelectedStatus(newStatus);

    setShowDeliveredAt(newStatus === "delivered");

    if (newStatus === "delivered") {
      setDetentionLayovers((prev) =>
        prev.length > 0 ? prev : [createDefaultDetentionLayover()]
      );
    } else {
      setDeliveredAt("");
      setDetentionLayovers([]);
    }

    setShowTonuFields(newStatus === "truck_order_not_used");

    if (newStatus === "truck_order_not_used") {
      setTonuStatus("pending");
      setTonuReason("");
    } else {
      setTonuStatus("pending");
      setTonuReason("");
    }
  };

  const handleAddDetentionLayover = () => {
    setDetentionLayovers((prev) => [
      ...prev,
      createDefaultDetentionLayover(),
    ]);
  };

  const handleRemoveDetentionLayover = (index: number) => {
    setDetentionLayovers((prev) =>
      prev.filter((_, currentIndex) => currentIndex !== index)
    );
  };

  const handleDetentionTypeChange = (
    index: number,
    value: DetentionLayoverType
  ) => {
    setDetentionLayovers((prev) =>
      prev.map((item, currentIndex) =>
        currentIndex === index
          ? {
            ...item,
            type: value,
          }
          : item
      )
    );
  };

  const handleDetentionSourceChange = (
    index: number,
    value: DetentionLayoverSource
  ) => {
    setDetentionLayovers((prev) =>
      prev.map((item, currentIndex) =>
        currentIndex === index
          ? {
            ...item,
            source: value,
          }
          : item
      )
    );
  };

  const handleRecordStatusChange = async (
    index: number,
    value: DetentionLayoverStatus
  ) => {
    const record = detentionLayovers[index];

    if (!record) {
      return;
    }

    setDetentionLayovers((prev) =>
      prev.map((item, currentIndex) =>
        currentIndex === index
          ? {
            ...item,
            status: value,
          }
          : item
      )
    );

    if (!record.id) {
      return;
    }

    if (!load.id) {
      toast.error("Load ID is missing");
      return;
    }

    try {
      await updateDetentionLayoverStatus({
        loadId: load.id,
        recordId: record.id,
        status: value,
      }).unwrap();

      toast.success("Detention / Layover status updated");
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);

      toast.error(
        errorMessage || "Failed to update Detention / Layover status"
      );

      setDetentionLayovers((prev) =>
        prev.map((item, currentIndex) =>
          currentIndex === index
            ? {
              ...item,
              status: record.status,
            }
            : item
        )
      );
    }
  };

  const handleUpdateLoadStatus = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedStatus === "delivered" && !deliveredAt) {
      return toast.error("Please select delivery date and time", {
        style: {
          background: "#dc2626",
          color: "#fff",
        },
      });
    }

    if (!load.id) {
      return toast.error("Load ID is missing");
    }

    try {
      const requestBody: {
        status: TStatusLoad;
        deliveredAt?: string;
        detentionLayovers?: {
          type: DetentionLayoverType;
          source: DetentionLayoverSource;
        }[];
        tonuStatus?: TonuStatus;
        tonuReason?: string;
      } = {
        status: selectedStatus,
      };

      if (selectedStatus === "delivered") {
        requestBody.deliveredAt = deliveredAt;

        if (detentionLayovers.length > 0) {
          requestBody.detentionLayovers = detentionLayovers.map((item) => ({
            type: item.type,
            source: item.source,
          }));
        }
      }

      if (selectedStatus === "truck_order_not_used") {
        requestBody.tonuStatus = tonuStatus;

        if (tonuReason.trim()) {
          requestBody.tonuReason = tonuReason.trim();
        }
      }

      console.log("Update Load Request:", requestBody);

      await updateLoadStatus({
        id: load.id,
        ...requestBody,
      }).unwrap();

      toast.success("Load updated successfully", {
        style: {
          background: "#16a34a",
          color: "#fff",
        },
      });

      handleClose();
    } catch (err: unknown) {
      if (selectedStatus === "truck_order_not_used") {
        toast.error("Something went wrong", {
          style: {
            background: "#dc2626",
            color: "#fff",
          },
        });

        return;
      }

      const errorMessage = getErrorMessage(err);

      toast.error(errorMessage || "Updating load failed", {
        style: {
          background: "#dc2626",
          color: "#fff",
        },
      });
    }
  };

  const handleClose = () => {
    setSelectedStatus(load?.status || "pending");

    setDeliveredAt(load?.deliveredAt || "");

    setShowDeliveredAt(load?.status === "delivered");

    setDetentionLayovers(
      load?.status === "delivered"
        ? [createDefaultDetentionLayover()]
        : []
    );

    setShowTonuFields(load?.status === "truck_order_not_used");

    setTonuStatus("pending");

    setTonuReason("");

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Update Load Status"
      size="md"
      closeOnOutsideClick={false}
    >
      <form onSubmit={handleUpdateLoadStatus} className="space-y-4 p-5">
        <div>
          <Typography
            sx={{
              color: theme.currentPalette.primary,
              fontSize: "14px",
              fontWeight: "bold",
              display: "block",
              mb: 1,
            }}
          >
            Load ID
          </Typography>

          <TextField
            aria-readonly
            value={load?.loadId || "N/A"}
            sx={{
              bgcolor: theme.currentPalette.background,
              width: "100%",
            }}
          />
        </div>

        <div>
          <Typography
            sx={{
              color: theme.currentPalette.primary,
              fontSize: "14px",
              fontWeight: "bold",
              display: "block",
              mb: 1,
            }}
          >
            Status
          </Typography>

          <FormControl fullWidth>
            <Select value={selectedStatus} onChange={handleStatusChange}>
              <MenuItem value="pending">Pending</MenuItem>

              <MenuItem value="in_transit">In Transit</MenuItem>

              <MenuItem value="delivered">Delivered</MenuItem>

              <MenuItem value="cancelled">Cancelled</MenuItem>

              <MenuItem value="truck_order_not_used">TONU</MenuItem>
            </Select>
          </FormControl>
        </div>

        {showDeliveredAt && (
          <div className="space-y-5 p-4 rounded-lg border">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <IoTime size={18} className="text-emerald-600" />

                <Typography
                  sx={{
                    color: theme.currentPalette.primary,
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  Delivery Date & Time
                </Typography>
              </div>

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  value={deliveredAt ? dayjs(deliveredAt) : null}
                  onChange={(newValue) => {
                    if (newValue) {
                      setDeliveredAt(newValue.toISOString());
                    } else {
                      setDeliveredAt("");
                    }
                  }}
                  disableFuture={false}
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
              </LocalizationProvider>

              {deliveredAt && (
                <Typography
                  sx={{
                    mt: 1,
                    fontSize: "12px",
                    color: "text.secondary",
                  }}
                >
                  Selected: {new Date(deliveredAt).toLocaleString()}
                </Typography>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Typography
                  sx={{
                    color: theme.currentPalette.primary,
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  Detention / Layover
                </Typography>

                <Button
                  type="button"
                  size="small"
                  variant="outlined"
                  startIcon={<IoAdd />}
                  onClick={handleAddDetentionLayover}
                >
                  Add
                </Button>
              </div>

              <div className="space-y-4">
                {detentionLayovers.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div>
                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          mb: 0.5,
                        }}
                      >
                        Type
                      </Typography>

                      <FormControl fullWidth size="small">
                        <Select
                          value={item.type}
                          onChange={(e) =>
                            handleDetentionTypeChange(
                              index,
                              e.target.value as DetentionLayoverType
                            )
                          }
                        >
                          <MenuItem value="detention">Detention</MenuItem>

                          <MenuItem value="layover">Layover</MenuItem>
                        </Select>
                      </FormControl>
                    </div>

                    <div>
                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          mb: 0.5,
                        }}
                      >
                        Source
                      </Typography>

                      <FormControl fullWidth size="small">
                        <Select
                          value={item.source}
                          onChange={(e) =>
                            handleDetentionSourceChange(
                              index,
                              e.target.value as DetentionLayoverSource
                            )
                          }
                        >
                          <MenuItem value="shipper">Shipper</MenuItem>

                          <MenuItem value="receiver">Receiver</MenuItem>
                        </Select>
                      </FormControl>
                    </div>

                    <div>
                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          mb: 0.5,
                        }}
                      >
                        Status
                      </Typography>

                      <FormControl fullWidth size="small">
                        <Select
                          value={item.status}
                          disabled={updatingRecordStatus}
                          onChange={(e) =>
                            handleRecordStatusChange(
                              index,
                              e.target.value as DetentionLayoverStatus
                            )
                          }
                        >
                          <MenuItem value="requested">Requested</MenuItem>

                          <MenuItem value="paid">Paid</MenuItem>

                          <MenuItem value="refused">Refused</MenuItem>
                        </Select>
                      </FormControl>
                    </div>

                    {detentionLayovers.length > 1 && (
                      <Button
                        type="button"
                        color="error"
                        size="small"
                        startIcon={<IoTrash />}
                        onClick={() => handleRemoveDetentionLayover(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showTonuFields && (
          <div className="space-y-4 p-4 rounded-lg border">
            <div>
              <Typography
                sx={{
                  color: theme.currentPalette.primary,
                  fontSize: "14px",
                  fontWeight: "bold",
                  display: "block",
                  mb: 1,
                }}
              >
                TONU Status
              </Typography>

              <FormControl fullWidth>
                <Select
                  value={tonuStatus}
                  onChange={(e) =>
                    setTonuStatus(e.target.value as TonuStatus)
                  }
                >
                  <MenuItem value="pending">Pending</MenuItem>

                  <MenuItem value="paid">Paid</MenuItem>

                  <MenuItem value="refused">Refused</MenuItem>
                </Select>
              </FormControl>
            </div>

            <div>
              <Typography
                sx={{
                  color: theme.currentPalette.primary,
                  fontSize: "14px",
                  fontWeight: "bold",
                  display: "block",
                  mb: 1,
                }}
              >
                TONU Reason (Optional)
              </Typography>

              <TextField
                value={tonuReason}
                onChange={(e) => setTonuReason(e.target.value)}
                placeholder="Enter TONU reason..."
                fullWidth
                multiline
                minRows={3}
                sx={{
                  bgcolor: theme.currentPalette.background,
                  "& .MuiInputBase-root": {
                    bgcolor: theme.currentPalette.background,
                  },
                }}
              />
            </div>
          </div>
        )}

        <Button
          variant="contained"
          type="submit"
          disabled={updatingStatus}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updatingStatus ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Updating...
            </>
          ) : (
            <>
              <IoRefresh size={18} />
              Update Status
            </>
          )}
        </Button>
      </form>
    </Modal>
  );
};

export default UpdateStatusModal;