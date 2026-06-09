"use client";
import React from "react";
import {
  alpha,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Card,
  CardContent,
  Divider,
  Avatar,
} from "@mui/material";
import { TruckElectric, X, AlertCircle } from "lucide-react";
import { TMaintenance, TStatusPerTruck } from "@/types/truckType";
import StatsCard from "@/components/ui/StatsCard";
import { Calendar, Gauge, TrendingUp } from "lucide-react";
import { RootState, useAppSelector } from "@/redux/store";

interface TrucksDialogProps {
  open: boolean;
  onClose: () => void;
  selectedMaintenance: TMaintenance | null;
  getStatusInfo: (status: string) => {
    bg: string;
    color: string;
    icon: React.ReactNode;
    text: string;
  };
}

const TrucksDialog: React.FC<TrucksDialogProps> = ({
  open,
  onClose,
  selectedMaintenance,
  getStatusInfo,
}) => {

    const theme = useAppSelector((state: RootState) => state.palette)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "hidden",
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: `1px solid ${alpha(theme.currentPalette.text, 0.1)}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 2,
          px: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <TruckElectric size={24} color={theme.currentPalette.primary} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: theme.currentPalette.primary,
            }}
          >
            Maintenance Trucks
          </Typography>
          {selectedMaintenance && (
            <Chip
              label={`${
                selectedMaintenance.statusPerTruck?.length || 0
              } trucks`}
              size="small"
              sx={{
                bgcolor: alpha(theme.currentPalette.primary, 0.1),
                color: theme.currentPalette.primary,
                fontWeight: 500,
              }}
            />
          )}
        </Box>

        <IconButton
          onClick={onClose}
          sx={{
            color: theme.currentPalette.text,
            "&:hover": {
              bgcolor: alpha(theme.currentPalette.primary, 0.1),
            },
          }}
        >
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, my: 5 }}>
        {selectedMaintenance && (
          <>
            {/* Trucks Cards */}
            <Box
              sx={{
                p: 3,
                pt: 0,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {selectedMaintenance.statusPerTruck &&
              selectedMaintenance.statusPerTruck.length > 0 ? (
                selectedMaintenance.statusPerTruck.map(
                  (truck: TStatusPerTruck) => {
                    const statusInfo = getStatusInfo(truck.status);
                    const isMileBased = selectedMaintenance.repeatBy === "mile";

                    return (
                      <Card
                        key={truck.truckId}
                        sx={{
                          borderRadius: 2,
                          border: `1px solid ${alpha(
                            theme.currentPalette.primary,
                            0.3
                          )}`,
                          boxShadow: "none",
                          my: 1,
                        }}
                      >
                        <CardContent sx={{ p: 2.5 }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 2,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                              }}
                            >
                              <Avatar
                                sx={{
                                  width: 40,
                                  height: 40,
                                  bgcolor: alpha(
                                    theme.currentPalette.primary,
                                    0.1
                                  ),
                                  color: theme.currentPalette.primary,
                                  fontSize: "1rem",
                                  fontWeight: 600,
                                }}
                              >
                                {truck.truckNumber.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography
                                  variant="h6"
                                  sx={{
                                    fontWeight: 600,
                                    color: theme.currentPalette.text,
                                  }}
                                >
                                  {truck.truckNumber}
                                </Typography>
                              </Box>
                            </Box>

                            <Chip
                              label={statusInfo.text}
                            //   icon={statusInfo.icon}
                              size="medium"
                              sx={{
                                bgcolor: statusInfo.bg,
                                color: statusInfo.color,
                                border: `1px solid ${alpha(
                                  theme.currentPalette.text,
                                  0.1
                                )}`,
                                fontWeight: 500,
                                px: 1,
                                "& .MuiChip-icon": {
                                  color: statusInfo.color,
                                },
                              }}
                            />
                          </Box>

                          <Divider
                            sx={{
                              my: 2,
                              color: alpha(theme.currentPalette.primary, 0.3),
                            }}
                          />

                          <Box>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <StatsCard
                                title="Total Mileage"
                                value={
                                  truck.totalMileage?.toLocaleString() || "--"
                                }
                                icon={TrendingUp}
                                iconColor={theme.currentPalette.primary}
                              />

                              <StatsCard
                                title={
                                  isMileBased
                                    ? "Last Done Mile"
                                    : "Last Done Date"
                                }
                                value={
                                  isMileBased
                                    ? truck.lastDoneMile?.toLocaleString() ||
                                      "--"
                                    : truck.lastDoneAt
                                    ? new Date(
                                        truck.lastDoneAt
                                      ).toLocaleDateString()
                                    : "--"
                                }
                                icon={Gauge}
                                iconColor={theme.currentPalette.primary}
                              />

                              <StatsCard
                                title={
                                  isMileBased
                                    ? "Next Due Mile"
                                    : "Next Due Date"
                                }
                                value={
                                  isMileBased
                                    ? truck.nextDueMile?.toLocaleString() ||
                                      "--"
                                    : truck.nextDueDate
                                    ? new Date(
                                        truck.nextDueDate
                                      ).toLocaleDateString()
                                    : "--"
                                }
                                icon={Calendar}
                                iconColor={theme.currentPalette.primary}
                              />
                            </div>
                          </Box>

                          {/* Additional Info */}
                          {truck.status === "overdue" && (
                            <Box
                              sx={{
                                mt: 2,
                                p: 1.5,
                                borderRadius: 2.5,
                                bgcolor: alpha("#DC2626", 0.1),
                                border: `1px solid ${alpha("#DC2626", 0.2)}`,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <AlertCircle size={18} color="#DC2626" />
                              <Typography
                                variant="body2"
                                sx={{ color: "#DC2626", fontWeight: 500 }}
                              >
                                This truck is overdue for maintenance
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    );
                  }
                )
              ) : (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 8,
                    border: `1px dashed ${alpha(
                      theme.currentPalette.primary,
                      0.2
                    )}`,
                    borderRadius: 2,
                    bgcolor: alpha(theme.currentPalette.background, 0.5),
                  }}
                >
                  <TruckElectric
                    size={48}
                    color={alpha(theme.currentPalette.text, 0.3)}
                  />
                  <Typography
                    sx={{
                      mt: 2,
                      color: alpha(theme.currentPalette.text, 0.6),
                      fontSize: "1.1rem",
                    }}
                  >
                    No trucks assigned to this maintenance
                  </Typography>
                </Box>
              )}
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TrucksDialog;