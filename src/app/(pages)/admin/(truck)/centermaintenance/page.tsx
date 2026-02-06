"use client";

import StatsCard from "@/components/ui/StatsCard";
import { useAppSelector, RootState } from "@/redux/store";
import { ClockAlert, TriangleAlert, TruckElectric } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { Box } from "@mui/material"; 

export default function CenterMaintenance() {
  const theme = useAppSelector((state: RootState) => state.palette);

  return (
    <Box sx={{ p: 3 }}>
      <Toaster position="top-center" />

      {/* Stats Summary */}
      <Box sx={{ mt: 3 }}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Centers"
            value="4"
            icon={TruckElectric}
            iconColor={theme.currentPalette.primary}
          />

          <StatsCard
            title="Opened"
            value="6"
            icon={TriangleAlert}
            iconColor={theme.currentPalette.primary}
          />

          <StatsCard
            title="Closed"
            value="8"
            icon={ClockAlert}
            iconColor={theme.currentPalette.primary}
          />

          <StatsCard
            title="Inactive"
            value="7"
            icon={ClockAlert}
            iconColor={theme.currentPalette.primary}
          />
        </div>
      </Box>
    </Box>
  );
}
