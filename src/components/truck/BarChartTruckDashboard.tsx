"use client";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  TooltipItem,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { alpha, Box, darken, Typography } from "@mui/material";
import { TTruckWithSummary } from "@/types/globalTypes";
import { RootState, useAppSelector } from "@/redux/store";
import { useEffect, useRef, useState } from "react";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

type SummaryMode = "total" | "perMile";

type Props = {
  data: TTruckWithSummary[];
  summaryMode: SummaryMode;
};

const BarChartTruckDashboard = ({ data, summaryMode }: Props) => {
  const theme = useAppSelector((state: RootState) => state.palette);
  const labels = data.map((t) => `${t.plateNumber}`);
  const patternCanvas = useRef<HTMLCanvasElement>(
    document.createElement("canvas")
  );
  const [negativePattern, setNegativePattern] = useState<
    CanvasPattern | string
  >("#00A63E");

  const profitData = data.map((t) => {
    if (summaryMode === "total") {
      return Number((t.summary?.netProfit || 0).toFixed(2));
    }

    return Number((t.summary?.avgProfitPerMile || 0).toFixed(2));
  });

  useEffect(() => {
    const ctx = patternCanvas.current.getContext("2d");
    if (!ctx) return;

    patternCanvas.current.width = 10;
    patternCanvas.current.height = 10;

    ctx.clearRect(0, 0, 10, 10);

    ctx.strokeStyle = "#00A63E";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(10, 0);
    ctx.stroke();

    const newPattern = ctx.createPattern(patternCanvas.current, "repeat");
    if (newPattern) {
      setNegativePattern(newPattern);
    }
  }, []);

  const isTotal = summaryMode === "total";

  const chartData = {
    labels,
    datasets: [
      {
        label: isTotal ? "Total Cost" : "Cost/Mile",
        data: data.map((t) =>
          isTotal
            ? Number((t.summary?.totalExpenses || 0).toFixed(2))
            : Number((t.summary?.avgExpensePerMile || 0).toFixed(2))
        ),
        backgroundColor: darken(theme.currentPalette.primary, 0.2),
        borderRadius: 6,
      },
      {
        label: isTotal ? "Total Profit" : "Profit/Mile",
        data: profitData,
        backgroundColor: profitData.map((value) =>
          value < 0 ? negativePattern : theme.currentPalette.primary
        ),
        borderRadius: 6,
      },
      {
        label: isTotal ? "Total Revenue" : "Revenue/Mile",
        data: data.map((t) =>
          isTotal
            ? Number((t.summary?.totalRevenue || 0).toFixed(2))
            : Number((t.summary?.avgRevenuePerMile || 0).toFixed(2))
        ),
        backgroundColor: alpha(theme.currentPalette.primary, 0.8),
        borderRadius: 6,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          boxWidth: 15,
          boxHeight: 15,
          padding: 20,
          font: {
            size: window.innerWidth < 768 ? 5 : 13,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<"bar">) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.08)" },
        ticks: {
          callback: function (value: string | number) {
            return `${value}$`;
          },
          stepSize: 0.5,
          autoSkip: true,
          maxTicksLimit: 8,
          font: {
            size: window.innerWidth < 768 ? 5 : 12,
          },
        },
      },
      x: {
        grid: { display: false },
        ticks: {
          font: {
            size: window.innerWidth < 768 ? 5 : 12,
          },
          maxRotation: 45,
          minRotation: 0,
        },
      },
    },
  };

  return (
    <Box
      sx={{
        p: 3,
        border: `1px solid ${alpha(theme.currentPalette.primary, 0.3)}`,
        borderRadius: "12px",
        background: theme.currentPalette.background,
      }}
    >
      <Typography
        variant="h6"
        sx={{ fontWeight: 400, color: theme.currentPalette.primary }}
      >
        {isTotal
          ? "Total Cost vs Total Revenue"
          : "Cost per Mile vs Revenue per Mile"}
      </Typography>

      <Typography
        variant="body2"
        sx={{ mb: 3, color: theme.currentPalette.primary }}
      >
        {isTotal
          ? "Total profitability analysis (stripes indicate loss)"
          : "Per-mile profitability analysis (stripes indicate loss)"}
      </Typography>

      <Bar data={chartData} options={options} />
    </Box>
  );
};

export default BarChartTruckDashboard;
