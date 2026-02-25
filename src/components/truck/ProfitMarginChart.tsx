import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { alpha, Box, Typography } from "@mui/material";
import { RootState, useAppSelector } from "@/redux/store";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ProfitMarginChartProps {
  profitMargin: number;
}

const ProfitMarginChart: React.FC<ProfitMarginChartProps> = ({
  profitMargin,
}) => {
  const theme = useAppSelector((state: RootState) => state.palette);

  const getColorByMargin = (margin: number) => {
    if (margin < 25) return "#ef4444";
    if (margin < 40) return "#f59e0b";
    return "#22c55e";
  };

  const getStatusText = (margin: number) => {
    if (margin < 25) return "Critical";
    if (margin < 40) return "Warning";
    return "Excellent";
  };

  const data = {
    datasets: [
      {
        data: [profitMargin, 100 - profitMargin],
        backgroundColor: [getColorByMargin(profitMargin), "#e5e7eb"],
        borderWidth: 0,
        borderRadius: profitMargin === 100 ? 50 : 0,
        circumference: 180,
        rotation: -90,
      },
    ],
  };

  const options = {
    responsive: true,
    cutout: "80%",
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
  };

  return (
    <Box
      sx={{
        border: 1,
        borderColor: alpha(theme.currentPalette.primary, 0.3),
        borderRadius: 2,
        p: 3,
        textAlign: "left",
        bgcolor: theme.currentPalette.background,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          color: theme.currentPalette.primary,
          fontWeight: 400,
        }}
      >
        Profit Margin
      </Typography>

      <Box
        sx={{ position: "relative", width: 200, height: 200, margin: "0 auto" }}
      >
        <Doughnut data={data} options={options} />

        <Box
          sx={{
            position: "absolute",
            top: "70%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: getColorByMargin(profitMargin),
              fontWeight: "bold",
              lineHeight: 1,
            }}
          >
            {profitMargin}%
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: getColorByMargin(profitMargin),
              fontWeight: 600,
              mt: 0.5,
            }}
          >
            {getStatusText(profitMargin)}
          </Typography>
        </Box>
      </Box>

      {/* Legend */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#ef4444",
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: theme.currentPalette.text,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Critical</span>
            <span>(0-25%)</span>
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#f59e0b",
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: theme.currentPalette.text,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Warning</span> <span>(25-40%)</span>
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#22c55e",
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: theme.currentPalette.text,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Excellent</span> <span>(40%+)</span>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ProfitMarginChart;
