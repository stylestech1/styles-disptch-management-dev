import { Palette, PaletteState, TPaletteConfig } from "@/types/themeType";
import { TPaletteConfigToPalette } from "@/utils/helperPalette";
import { PaletteMode } from "@mui/material";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const defaultPalette: Palette = {
  mode: "light",
  customName: "Default",
  primary: "#1E56A0",
  secondary: "#266DCB",
  background: "#FBFDFE",
  paper: "#FFFFFF",
  text: "#333333",
  title: "#1E56A0",
};



const initialState: PaletteState = {
  currentPalette: defaultPalette,
  customPalettes: [],
  isLoading: false,
  error: null,
};

const paletteSlice = createSlice({
  name: "palette",
  initialState,
  reducers: {
    setPalette(state, action: PayloadAction<Palette>) {
      state.currentPalette = action.payload;
    },
    setCustomePalettes(state, action: PayloadAction<Palette[]>) {
      state.customPalettes = action.payload;
    },
    addCustomePalette(state, action: PayloadAction<Palette>) {
      if (action.payload._id) {
        state.customPalettes = state.customPalettes.filter(
          (p) => p._id !== action.payload._id
        );
      } else {
        state.customPalettes = state.customPalettes.filter(
          (p) => p.customName !== action.payload.customName
        );
      }
      state.customPalettes.push(action.payload);
    },
    removeCustomPalette(state, action: PayloadAction<string>) {
      state.customPalettes = state.customPalettes.filter(
        (p) => p._id !== action.payload && p.customName !== action.payload
      );
    },
    setPaletteMode(state, action: PayloadAction<PaletteMode>) {
      state.currentPalette.mode = action.payload;
    },
    setLoadingPalette(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setErrorPalette(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    loadPalettesFromBackend(state, action: PayloadAction<TPaletteConfig[]>) {
      const palettes = action.payload.map(TPaletteConfigToPalette);
      state.customPalettes = palettes;

      const activePalette = palettes.find((p) => p.active);
      if (activePalette) {
        state.currentPalette = activePalette;
      } else if (
        palettes.length > 0 &&
        (!state.currentPalette || state.currentPalette.customName === "Default")
      ) {
        state.currentPalette = palettes[0];
      }
    },
  },
});

export const {
  setPalette,
  setCustomePalettes,
  addCustomePalette,
  removeCustomPalette,
  setPaletteMode,
  setLoadingPalette,
  setErrorPalette,
  loadPalettesFromBackend,
} = paletteSlice.actions;
export default paletteSlice.reducer;
