import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
  ScriptableContext,
} from "chart.js";
import { Alert, alpha, Box, Typography } from "@mui/material";
import { RootState, useAppSelector } from "@/redux/store";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
);

interface NetProfitTrendProps {
  netProfitHistory?: {
    current: number | string;
    previous: number[];
  };
  period?: {
    from: string;
    to: string;
  };
}

const NetProfitTrend: React.FC<NetProfitTrendProps> = ({
  netProfitHistory,
  period,
}) => {
  const theme = useAppSelector((state: RootState) => state.palette);

  const processedNetProfitHistory = netProfitHistory
    ? {
        current:
          typeof netProfitHistory.current === "string"
            ? parseFloat(netProfitHistory.current)
            : netProfitHistory.current,
        previous: netProfitHistory.previous,
      }
    : undefined;

  const profitData = processedNetProfitHistory
    ? [...processedNetProfitHistory.previous, processedNetProfitHistory.current]
    : [2500, 3200, -800, 4100, 6000, 3800, 4500, 5200];

  const getDateDiffInDays = (from: string, to: string) => {
    const f = new Date(from);
    const t = new Date(to);
    const diff = t.getTime() - f.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  };
  const detectLabelType = (days: number) => {
    if (days <= 7) return "week";
    if (days <= 31) return "week";
    if (days <= 365) return "month";
    return "year";
  };
  const generateDynamicLabels = (
    length: number,
    days: number,
    type: string
  ) => {
    let unitCount = 1;

    if (type === "week") {
      unitCount = Math.round(days / 7);
    } else if (type === "month") {
      unitCount = Math.round(days / 30);
    } else if (type === "year") {
      unitCount = Math.round(days / 365);
    }

    return Array(length).fill(`${unitCount} ${type}`);
  };

  const labels = React.useMemo(() => {
    if (!period?.from || !period?.to) {
      const defaultDays = 7;
      return generateDynamicLabels(profitData.length, defaultDays, "week");
    }

    const diffDays = getDateDiffInDays(period.from, period.to);
    const type = detectLabelType(diffDays);

    return generateDynamicLabels(profitData.length, diffDays, type);
  }, [period, profitData]);

  const data = {
    labels,
    datasets: [
      {
        label: "Profit",
        data: profitData,
        fill: true,
        borderColor: "#22c55e",
        backgroundColor: (ctx: ScriptableContext<"line">) => {
          const canvas = ctx.chart.ctx;
          const gradient = canvas.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, "rgba(34,197,94,0.25)");
          gradient.addColorStop(1, "rgba(34,197,94,0.05)");
          return gradient;
        },
        borderWidth: 3,
        pointBackgroundColor: profitData.map((v) =>
          v < 0 ? "#dc2626" : "#22c55e"
        ),
        pointBorderColor: profitData.map((v) =>
          v < 0 ? "#dc2626" : "#22c55e"
        ),
        pointRadius: profitData.map((v) => (v < 0 ? 8 : 6)),
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          callback: (value: string | number) => {
            const numValue =
              typeof value === "string" ? parseFloat(value) : value;
            return numValue >= 0
              ? `$${numValue / 1000}k`
              : `-$${Math.abs(numValue) / 1000}k`;
          },
        },
      },
      x: {
        grid: { display: false },
      },
    },

    plugins: {
      legend: {
        display: false,
      },
      annotation: {
        annotations: {
          zeroLine: {
            type: "line",
            yMin: 0,
            yMax: 0,
            borderColor: "#1d4ed8",
            borderWidth: 2,
            label: {
              display: true,
              content: "Break Even",
              position: "end",
              color: "#1d4ed8",
            },
          },
        },
      },
    },
  };

  return (
    <Box
      sx={{
        borderColor: alpha(theme.currentPalette.primary, 0.3),
        borderRadius: 1,
        bgcolor: theme.currentPalette.background,
      }}
      className="border p-5 h-full"
    >
      <Box sx={{ mb: 5 }}>
        <Typography
          variant="h5"
          sx={{ color: theme.currentPalette.primary, fontWeight: 400 }}
        >
          Net Profit Trend
        </Typography>
        <Typography sx={{ color: theme.currentPalette.text }}>
          Click on any point to filter load details
        </Typography>
      </Box>
      <Line data={data} options={options} />
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 my-5">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-600 rounded-full"></span>
          <span style={{ color: theme.currentPalette.text }}>Profit</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-600 rounded-full"></span>
          <span style={{ color: theme.currentPalette.text }}>Loss</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 border-2 border-blue-600 rounded-full"></span>
          <span style={{ color: theme.currentPalette.text }}>Current Week</span>
        </div>
      </div>

      {/* Alert */}
      <Alert severity="info" sx={{ mt: 2 }}>
        {period?.from && period?.to
          ? (() => {
              const fromDate = new Date(period.from);
              const toDate = new Date(period.to);

              if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
                return (
                  <>
                    Selected Period: {period.from} to {period.to}
                  </>
                );
              }

              const diffTime = toDate.getTime() - fromDate.getTime();
              const days = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

              return (
                <>
                  Period: Day {period.from} to Day {period.to} →{" "}
                  <strong>
                    {days} day{days > 1 ? "s" : ""}
                  </strong>
                </>
              );
            })()
          : "No period data"}
      </Alert>
    </Box>
  );
};

export default NetProfitTrend;
