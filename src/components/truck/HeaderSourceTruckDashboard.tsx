'use client'
import { alpha, Box, Typography } from "@mui/material";
import { GoDotFill } from "react-icons/go";
import { useGetAllTrucksQuery } from "@/redux/slices/apiSlice";
import { RootState, useAppSelector } from "@/redux/store";
import { TTruck } from "@/types/globalTypes";

const HeaderSourceTruckDashboard = () => {

    const token = useAppSelector((state: RootState) => state.auth.token)
    const theme = useAppSelector((state: RootState) => state.palette)

  const { data } = useGetAllTrucksQuery(undefined, {
    skip: !token
  });

  const trucks = data?.data ?? [];

  const companyOwnedCount = trucks.filter(
    (t: TTruck) => t.source === 'company'
  ).length;

  const ownerOperatorCount = trucks.filter(
    (t: TTruck) => t.source === 'other'
  ).length;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      
      {/* Company-Owned */}
      <Box sx={{ py: 1, px: 2, display: "flex", alignItems: 'center', gap: 0.5, border: 1, borderColor: alpha(theme.currentPalette.text, 0.3), borderRadius: 2 }}>
        <GoDotFill color={theme.currentPalette.primary} />
        <Typography sx={{ color: theme.currentPalette.primary, fontSize: "14px" }}>
          Company-owned: {companyOwnedCount}
        </Typography>
      </Box>

      {/* Owner-Operator */}
      <Box sx={{ py: 1, px: 2, display: "flex", alignItems: 'center', gap: 0.5, border: 1, borderColor: alpha(theme.currentPalette.text, 0.3), borderRadius: 2 }}>
        <GoDotFill color="#28A745" />
        <Typography sx={{ color: theme.currentPalette.primary, fontSize: "14px" }}>
          Owner-Operator: {ownerOperatorCount}
        </Typography>
      </Box>
    </Box>
  );
};

export default HeaderSourceTruckDashboard;
