import { Palette, TPaletteConfig } from "@/types/themeType";

export const paletteToPaletteConfig = (p: Palette): TPaletteConfig => ({
  mode: p.mode,
  customName: p.customName,
  active: false,
  primary: {
    main: p.primary,
    contrastText: "#fff",
  },
  secondary: {
    main: p.secondary,
    contrastText: "#fff",
  },
  background: {
    default: p.background,
    paper: "#fff",
  },
  text: {
    primary: p.text,
    secondary: "#333",
  },
  title: p.title,
  _id: p._id,
});

export const TPaletteConfigToPalette = (p: TPaletteConfig | Palette): Palette => {
  if ('primary' in p && typeof p.primary === 'string') {
    return p as Palette;
  }
  
  const config = p as TPaletteConfig;
  return {
  mode: config.mode,
  customName: config.customName,
  primary: config.primary?.main ?? '#000000',
  secondary: config.secondary?.main ?? '#000000',
  background: config.background?.default ?? '#ffffff',
  text: config.text?.primary ?? '#333333',
  title: config.title,
  _id: config._id,
  active: config.active ?? false,
  paper: "",

};
}