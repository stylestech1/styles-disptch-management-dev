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
  ChartOptions,
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

type ProfitValue = number | string;

interface NetProfitHistory {
  current: ProfitValue;
  previous: ProfitValue[];
}

interface Period {
  from: string;
  to: string;
}

interface NetProfitTrendProps {
  netProfitHistory?: NetProfitHistory;
  previousMonthNetProfitHistory?: NetProfitHistory;
  period?: Period;
  previousPeriod?: Period;
}

const parseProfitValue = (value: ProfitValue): number => {
  if (typeof value === "number") return value;

  const parsedValue = Number.parseFloat(value);
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

const normalizeProfitHistory = (history?: NetProfitHistory): number[] => {
  if (!history) return [];

  const values = [
    ...history.previous.map(parseProfitValue),
    parseProfitValue(history.current),
  ];

  return values.slice(-7);
};

const formatPeriodLabel = (period?: Period): string => {
  if (!period?.from || !period?.to) return "";

  const fromDate = new Date(`${period.from}T00:00:00`);
  const toDate = new Date(`${period.to}T00:00:00`);

  if (
    Number.isNaN(fromDate.getTime()) ||
    Number.isNaN(toDate.getTime())
  ) {
    return `${period.from} - ${period.to}`;
  }

  const monthName = fromDate.toLocaleDateString("en-US", {
    month: "short",
  });

  return `${monthName} ${fromDate.getDate()}-${toDate.getDate()}`;
};

const createWeeklyLabels = (length: number): string[] => {
  return Array.from({ length }, (_, index) => `Day ${index + 1}`);
};

const NetProfitTrend: React.FC<NetProfitTrendProps> = ({
  netProfitHistory,
  previousMonthNetProfitHistory,
  period,
  previousPeriod,
}) => {
  const theme = useAppSelector((state: RootState) => state.palette);

  const currentMonthProfitData = React.useMemo(
    () => normalizeProfitHistory(netProfitHistory),
    [netProfitHistory]
  );

  const previousMonthProfitData = React.useMemo(
    () => normalizeProfitHistory(previousMonthNetProfitHistory),
    [previousMonthNetProfitHistory]
  );

  const chartLength = Math.max(
    currentMonthProfitData.length,
    previousMonthProfitData.length
  );

  const labels = React.useMemo(
    () => createWeeklyLabels(chartLength),
    [chartLength]
  );

  const alignedCurrentMonthData = React.useMemo(
    () =>
      Array.from(
        { length: chartLength },
        (_, index) => currentMonthProfitData[index] ?? null
      ),
    [chartLength, currentMonthProfitData]
  );

  const alignedPreviousMonthData = React.useMemo(
    () =>
      Array.from(
        { length: chartLength },
        (_, index) => previousMonthProfitData[index] ?? null
      ),
    [chartLength, previousMonthProfitData]
  );

  const currentPeriodLabel = formatPeriodLabel(period);
  const previousPeriodLabel = formatPeriodLabel(previousPeriod);

  const data = {
    labels,
    datasets: [
      {
        label: currentPeriodLabel || "Current month",
        data: alignedCurrentMonthData,
        fill: true,
        borderColor: "#22c55e",
        backgroundColor: (context: ScriptableContext<"line">) => {
          const canvas = context.chart.ctx;
          const gradient = canvas.createLinearGradient(0, 0, 0, 400);

          gradient.addColorStop(0, "rgba(34,197,94,0.25)");
          gradient.addColorStop(1, "rgba(34,197,94,0.05)");

          return gradient;
        },
        borderWidth: 3,
        pointBackgroundColor: alignedCurrentMonthData.map((value) =>
          value !== null && value < 0 ? "#dc2626" : "#22c55e"
        ),
        pointBorderColor: alignedCurrentMonthData.map((value) =>
          value !== null && value < 0 ? "#dc2626" : "#22c55e"
        ),
        pointRadius: alignedCurrentMonthData.map((value) =>
          value !== null && value < 0 ? 8 : 6
        ),
        tension: 0.4,
        spanGaps: false,
      },
      {
        label: previousPeriodLabel || "Previous month",
        data: alignedPreviousMonthData,
        fill: true,
        borderColor: "#2563eb",
        backgroundColor: (context: ScriptableContext<"line">) => {
          const canvas = context.chart.ctx;

          const gradient = canvas.createLinearGradient(0, 0, 0, 400);

          gradient.addColorStop(0, "rgba(37,99,235,0.25)");
          gradient.addColorStop(1, "rgba(37,99,235,0.05)");

          return gradient;
        },
        pointBackgroundColor: "#2563eb",
        pointBorderColor: "#2563eb",
        pointRadius: 5,
        borderWidth: 3,
        tension: 0.4,
        spanGaps: false,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          callback: (value) => {
            const numericValue = Number(value);
            const formattedValue = Math.abs(numericValue) / 1000;

            if (numericValue === 0) return "$0";

            return numericValue < 0
              ? `-$${formattedValue}k`
              : `$${formattedValue}k`;
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;

            if (value === null) {
              return `${context.dataset.label}: No data`;
            }

            return `${context.dataset.label}: $${value.toLocaleString(
              "en-US"
            )}`;
          },
        },
      },
    },
  };

  return (
    <Box
      sx={{
        borderColor: alpha(theme.currentPalette.primary, 0.3),
        borderRadius: 2,
        bgcolor: theme.currentPalette.background,
      }}
      className="border p-5 h-full"
    >
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{
            color: theme.currentPalette.primary,
            fontWeight: 400,
          }}
        >
          Net Profit Trend
        </Typography>

        <Typography sx={{ color: theme.currentPalette.text }}>
          Compare each week with the same week from the previous month
        </Typography>
      </Box>

      <Box sx={{ height: 360 }}>
        <Line data={data} options={options} />
      </Box>

      <div className="flex flex-wrap items-center justify-center gap-6 my-5">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-600 rounded-full" />
          <span style={{ color: theme.currentPalette.text }}>
            Current month
            {currentPeriodLabel ? ` (${currentPeriodLabel})` : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-600 rounded-full" />
          <span style={{ color: theme.currentPalette.text }}>
            Previous month
            {previousPeriodLabel ? ` (${previousPeriodLabel})` : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-600 rounded-full" />
          <span style={{ color: theme.currentPalette.text }}>Loss</span>
        </div>
      </div>

      <Alert severity="info" sx={{ mt: 2 }}>
        {period?.from && period?.to ? (
          <>
            Current week: <strong>{period.from}</strong> to{" "}
            <strong>{period.to}</strong>

            {previousPeriod?.from && previousPeriod?.to && (
              <>
                {" "}
                — Previous-month week: <strong>{previousPeriod.from}</strong>{" "}
                to <strong>{previousPeriod.to}</strong>
              </>
            )}
          </>
        ) : (
          "No period data"
        )}
      </Alert>
    </Box>
  );
};

export default NetProfitTrend;