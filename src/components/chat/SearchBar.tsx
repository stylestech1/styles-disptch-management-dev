"use client";
import { alpha, InputAdornment, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { RootState, useAppSelector } from "@/redux/store";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar = ({ value, onChange }: SearchBarProps) => {
  const theme = useAppSelector((state: RootState) => state.palette);

  return (
    <TextField
      fullWidth
      placeholder="Search on someone..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      size="small"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: "gray", fontSize: 20 }} />
          </InputAdornment>
        ),
      }}
      sx={{
        borderRadius: 2,
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
          bgcolor: alpha(theme.currentPalette.primary, 0.1),
          "& fieldset": {
            border: "none",
          },
          "&:hover fieldset": {
            border: "none",
          },
          "&.Mui-focused fieldset": {
            border: "none",
          },
        },
      }}
    />
  );
};
