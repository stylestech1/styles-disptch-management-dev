/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import React, { useEffect, useMemo } from "react";
import { ThemeProvider, createTheme, responsiveFontSizes } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";

import { RootState, useAppDispatch } from "@/redux/store";
import { useGetPaletteQuery } from "@/redux/slices/apiSlice";
import { loadPalettesFromBackend, setPalette } from "@/redux/slices/paletteSlice";
import { TPaletteConfigToPalette } from "@/utils/helperPalette";

export default function MuiThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();

  const { currentPalette } = useSelector((state: RootState) => state.palette);

  const token = useSelector((state: RootState) => state.auth?.token);

  // ✅ عدّلي ده حسب شكل auth عندك
  const role = useSelector((state: RootState) => state.auth?.user?.role);

  // ✅ SuperAdmin => ممنوع fetch
  const isSuperAdmin =
    String(role || "").toLowerCase() === "superadmin" ||
    String(role || "").toLowerCase() === "super-admin";

  // ✅ fetch فقط لو عندك token ومش superadmin
  const shouldFetchPalette = Boolean(token) && !isSuperAdmin;

  const { data: backendPalettes = [] } = useGetPaletteQuery(
    shouldFetchPalette ? undefined : skipToken
  );

  useEffect(() => {
    if (!backendPalettes?.length) return;

    dispatch(loadPalettesFromBackend(backendPalettes));

    const activePaletteConfig = backendPalettes.find((p) => p.active);
    if (activePaletteConfig) {
      dispatch(setPalette(TPaletteConfigToPalette(activePaletteConfig)));
    }
  }, [backendPalettes, dispatch]);

  // ✅ fallbacks (عشان مفيش fetch في superadmin)
  const mode = currentPalette?.mode ?? "light";
  const primary = currentPalette?.primary ?? "#205DAC";
  const secondary = currentPalette?.secondary ?? "#7FA9E6";

  const backgroundDefault =
    currentPalette?.background ?? (mode === "dark" ? "#0B1220" : "#F4F7FC");

  const paper =
    currentPalette?.paper ?? (mode === "dark" ? "#101A2C" : "#FFFFFF");

  const textPrimary =
    currentPalette?.text ?? (mode === "dark" ? "#FFFFFF" : "#0B1220");

  const textSecondary =
    currentPalette?.primary ??
    (mode === "dark" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)");

  const theme = useMemo(() => {
    let t = createTheme({
      palette: {
        mode,
        primary: { main: primary, contrastText: "#FFFFFF" },
        secondary: { main: secondary, contrastText: "#FFFFFF" },
        background: { default: backgroundDefault, paper },
        text: { primary: textPrimary, secondary: textSecondary },
      },
      shape: { borderRadius: 12 },
      typography: {
        fontFamily:
          "Roboto, Inter, system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif",
      },
    });

    t = responsiveFontSizes(t);
    return t;
  }, [mode, primary, secondary, backgroundDefault, paper, textPrimary, textSecondary]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}