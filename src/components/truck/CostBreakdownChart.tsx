"use client";

import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { alpha, Box, Typography } from "@mui/material";
import { RootState, useAppSelector } from "@/redux/store";

type CostBreakdownProps = {
  costs: {
    fuel?: number;
    driverPay?: number;
    maintenance?: number;
    insurance?: number;
  };
};

ChartJS.register(ArcElement, Tooltip, Legend);

const CostBreakdownChart: React.FC<CostBreakdownProps> = ({ costs }) => {
  const theme = useAppSelector((state: RootState) => state.palette);

  const totalCost =
    (costs?.fuel || 0) +
    (costs?.driverPay || 0) +
    (costs?.maintenance || 0) +
    (costs?.insurance || 0);

  const value = [
    costs?.fuel || 0,
    costs?.driverPay || 0,
    costs?.maintenance || 0,
    costs?.insurance || 0,
  ];

  const sorted = [...value].sort((a, b) => b - a);
  const opacitySteps = [1, 0.8, 0.6, 0.4];
  const backgroundColor = value.map((value) => {
    const indexInSorted = sorted.indexOf(value);
    const opacity = opacitySteps[indexInSorted];
    return alpha(theme.currentPalette.primary, opacity);
  });

  const labels = ["Fuel", "Driver Pay", "Maintenance", "Insurance"];

  const data = {
    labels: labels,
    datasets: [
      {
        data: [
          costs?.fuel || 0,
          costs?.driverPay || 0,
          costs?.maintenance || 0,
          costs?.insurance || 0,
        ],
        backgroundColor: backgroundColor,
        borderWidth: 3,
        cutout: "65%",
      },
    ],
  };

  const options = {
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <Box
      sx={{
        border: `1px solid ${alpha(theme.currentPalette.primary, 0.3)}`,
        borderRadius: 2,
        p: 3,
        bgcolor: theme.currentPalette.background,
      }}
    >
      <Typography
        sx={{ fontSize: "20px", mb: 2, color: theme.currentPalette.primary }}
      >
        Cost Breakdown
      </Typography>

      <div className="w-40 mx-auto">
        <Doughnut data={data} options={options} />
      </div>

      {/* Labels */}
      <Box className="grid grid-cols-2 gap-2 mt-4">
        {labels.map((label, i) => (
          <Box key={label} display="flex" alignItems="center" gap={1}>
            <span
              className="w-3 h-3 block rounded"
              style={{ background: backgroundColor[i] }}
            />
            {label}: ${value[i]}
          </Box>
        ))}
      </Box>

      {/* TOTAL */}
      <Typography
        sx={{
          borderTop: "1px solid #d0e3ff",
          color: theme.currentPalette.primary,
          mt: 3,
          pt: 2,
          fontWeight: "bold",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "18px",
        }}
      >
        Total Costs
        <span>${totalCost.toLocaleString()}</span>
      </Typography>
    </Box>
  );
};

export default CostBreakdownChart;
