"use client";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { alpha } from "@mui/material";
import { IconType } from "react-icons";
import { RootState, useAppSelector } from "@/redux/store";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: IconType;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

const StatsCard = ({
  title,
  value,
  icon: Icon,
  iconColor,
  trend,
  loading = false,
}: StatsCardProps) => {
  const theme = useAppSelector((state: RootState) => state.palette);

  const primaryColor = iconColor || theme.currentPalette.primary;
  const bgColor = alpha(primaryColor, 0.1);

  if (loading) {
    return (
      <Card
        variant="outlined"
        sx={{
          borderRadius: 2,
          borderColor: "#e2e8f0",
          p: 2,
          boxShadow: 1,
          opacity: 0.6,
        }}
      >
        <CardContent>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box flex={1}>
              <Box sx={{ width: "50%", height: 14, mb: 1 }} />
              <Box sx={{ width: "30%", height: 18 }} />
            </Box>
            <Box sx={{ p: 1.5, borderRadius: 2 }}>
              <Box sx={{ width: 24, height: 24, borderRadius: "50%" }} />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        borderColor: alpha(theme.currentPalette.primary, 0.2),
        bgcolor: theme.currentPalette.background,
        transition: "all 0.3s ease",
        "&:hover": { boxShadow: "0 3px 8px rgba(0,0,0,0.1)" },
      }}
    >
      <CardContent>
        <Box
          display="flex"
          alignItems="flex-start"
          justifyContent="space-between"
        >
          <Box>
            <Typography
              variant="body2"
              sx={{ color: theme.currentPalette.primary, fontWeight: 500 }}
            >
              {title}
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: 500, color: "text.primary", mt: 0.5 }}
            >
              {value}
            </Typography>
            {trend && (
              <Typography
                variant="caption"
                sx={{
                  mt: 0.5,
                  display: "block",
                  color: trend.isPositive ? "success.main" : "error.main",
                  fontWeight: 500,
                }}
              >
                {trend.isPositive ? "↗" : "↘"} {Math.abs(trend.value)}%
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              p: 1.5,
              bgcolor: bgColor,
              borderRadius: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={22} color={primaryColor} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
