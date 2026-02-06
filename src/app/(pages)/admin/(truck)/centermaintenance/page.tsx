"use client";
import StatsCard from "@/components/ui/StatsCard";
import { useAppSelector, RootState } from "@/redux/store";
import { Toaster } from "react-hot-toast";
import { Box, Button, Typography } from "@mui/material";
import { CiLock, CiMap, CiUnlock, CiWarning } from "react-icons/ci";
import { PiBuildingOfficeLight } from "react-icons/pi";
import { TbBuilding } from "react-icons/tb";
import { Suspense, useState, lazy } from "react";

export default function CenterMaintenance() {
  const theme = useAppSelector((state: RootState) => state.palette);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [showMaps, setShowMaps] = useState(false);
  const LazyMapWithRoute = lazy(() => import("@/components/ui/MapWithRoute"));

  // Map fallback component
  const MapFallback = () => (
    <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg border border-gray-200">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading Maps...</p>
      </div>
    </div>
  );
  // Lazy load the map components
  const LazyGoogleMapsLoader = lazy(
    () => import("@/components/ui/GoogleMapsLoader"),
  );
  return (
    <Box sx={{ p: 3 }}>
      <Toaster position="top-center" />

      {/* Stats Summary */}
      <Box sx={{ mt: 3 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Centers"
            value="9"
            icon={PiBuildingOfficeLight}
            iconColor={theme.currentPalette.primary}
          />

          <StatsCard
            title="Opened"
            value="2"
            icon={CiUnlock}
            iconColor={theme.currentPalette.primary}
          />

          <StatsCard
            title="Closed"
            value="2"
            icon={CiLock}
            iconColor={theme.currentPalette.primary}
          />

          <StatsCard
            title="Inactive"
            value="7"
            icon={CiWarning}
            iconColor={theme.currentPalette.primary}
          />
        </div>
      </Box>

      {/* Centers Overview Section */}
      <Box
        sx={{
          mt: 4,
          pt: 2,
        }}
      >
        <Box className="flex justify-between items-center mb-6">
          <Box className="flex items-center gap-4">
            <Box className="flex items-center gap-2">
              <CiMap size={24} color={theme.currentPalette.primary} />
              <Typography
                variant="h6"
                sx={{
                  color: theme.currentPalette.primary,
                  fontWeight: 600,
                }}
              >
                Centers Overview
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            sx={{
              backgroundColor: theme.currentPalette.primary,
              color: "#fff",
              textTransform: "none",
              fontWeight: 500,
              "&:hover": {
                backgroundColor: theme.currentPalette.primary,
                opacity: 0.9,
              },
            }}
          >
            Add Maintenance center
          </Button>
        </Box>

        {/* Toggle Switch Container */}
        <Box sx={{ mb: 3, width: "100%" }}>
          <Box
            sx={{
              display: "flex",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
              padding: "2px",
              width: "100%",
              maxWidth: "300px",
            }}
          >
            <Button
              onClick={() => setViewMode("map")}
              sx={{
                textTransform: "none",
                fontWeight: 500,
                borderRadius: "6px",
                px: 3,
                py: 1,
                width: "50%",
                backgroundColor:
                  viewMode === "map"
                    ? theme.currentPalette.primary
                    : "transparent",
                color: viewMode === "map" ? "#fff" : "#333",
                "&:hover": {
                  backgroundColor:
                    viewMode === "map"
                      ? theme.currentPalette.primary
                      : "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              <CiMap size={24} color={theme.currentPalette.primary} />
              Map View
            </Button>
            <Button
              onClick={() => setViewMode("list")}
              sx={{
                textTransform: "none",
                fontWeight: 500,
                borderRadius: "6px",
                px: 3,
                py: 1,
                width: "50%",
                backgroundColor:
                  viewMode === "list"
                    ? theme.currentPalette.primary
                    : "transparent",
                color: viewMode === "list" ? "#fff" : "#333",
                "&:hover": {
                  backgroundColor:
                    viewMode === "list"
                      ? theme.currentPalette.primary
                      : "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              <TbBuilding size={24} color={theme.currentPalette.primary} />
              List View
            </Button>
          </Box>
        </Box>

        <Box sx={{ mt: 3 }}>
          {viewMode === "map" ? (
            <Box
              sx={{
                border: `1px solid #e0e0e0`,
                borderRadius: "12px",
                padding: 3,
                backgroundColor: "#f9f9f9",
                minHeight: "400px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {/* <div className="grid grid-cols-1 gap-6">
                {showMaps ? (
                  <Suspense fallback={<MapFallback />}>
                    <LazyGoogleMapsLoader
                      onLoad={() => console.log("Maps loaded successfully")}
                      onError={(error) =>
                        console.error("Failed to load maps:", error)
                      }
                    >
                      <LazyMapWithRoute
                        // dho={dho}
                        // origin={origin}
                        // destinations={destinations}
                        height="100%"
                      />
                    </LazyGoogleMapsLoader>
                  </Suspense>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg border border-gray-200">
                    <div className="text-center text-gray-500">
                      <p>Map will load when needed</p>
                    </div>
                  </div>
                )}
              </div> */}
            </Box>
          ) : (
            // List View Content
            <Box
              sx={{
                borderRadius: "12px",
                padding: 2,
                minHeight: "400px",
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  mb: 3,
                  px: 2,
                }}
              >
                List View Content
              </Typography>

              {/* Example list items */}
              <Box sx={{ maxHeight: "350px", overflowY: "auto" }}>
                {[
                  "Costco Wholesale",
                  "Sign Hill Park",
                  "GARDENS MONTE",
                  "Hickey Blvd",
                  "The Salvation Army Thrift Store &...",
                  "Kaiser Permanente",
                  "South San Francisco Public Library",
                  "Safeway",
                  "California Golf Club of San Francisco",
                  "Orange Park",
                ].map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      mb: 1,
                      borderRadius: "8px",
                      backgroundColor:
                        index % 2 === 0 ? "rgba(0, 0, 0, 0.02)" : "transparent",
                      borderLeft: `3px solid ${theme.currentPalette.primary}`,
                      "&:hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                      },
                    }}
                  >
                    <Typography>{item}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
