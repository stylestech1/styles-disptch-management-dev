import { PaletteMode } from '@mui/material';

export interface TPaletteConfig {
  _id?: string;
  mode: PaletteMode;
  customName: string;
  active: boolean;
  primary: {
    main: string;
    contrastText: string;
  };
  secondary: {
    main: string;
    contrastText: string;
  };
  background: {
    default: string;
    paper: string;
  };
  text: {
    primary: string;
    secondary: string;
  };
  title: string
  createdAt?: string;
  updatedAt?: string;
}

export interface Palette {
  paper: string;
  _id?: string
  mode: PaletteMode;
  customName: string; 
  primary: string;
  secondary: string;
  background: string;
  text: string;
  title: string;
  active?: boolean
}

export interface TUpdatePaletteRequest {
  _id: string;
  body: TPaletteConfig;
}

export interface TGetPaletteResponse {
  message: string;
  results: number;
  data: TPaletteConfig[];
}

export interface GetSinglePaletteResponse {
  message: string;
  data: TPaletteConfig;
}

export interface PaletteState {
  currentPalette: Palette;
  customPalettes: Palette[];
  isLoading: boolean;
  error: string | null;
}