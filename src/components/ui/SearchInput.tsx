import React from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  SxProps,
} from '@mui/material';
import { IoSearch, IoClose } from 'react-icons/io5';
import { UseSearchSubmitReturn } from '@/hook/useSearchSubmit';

interface SearchInputProps {
  searchHook?: UseSearchSubmitReturn;
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  onSubmit?: () => void;
  placeholder?: string;
  fullWidth?: boolean;
  showClearButton?: boolean;
  sx?: SxProps;
  inputSx?: SxProps;
}

const SearchInput: React.FC<SearchInputProps> = ({
  searchHook,
  value,
  onChange,
  onClear,
  onSubmit,
  placeholder = "Search...",
  fullWidth = true,
  showClearButton = true,
  sx = {},
  inputSx = {},
}) => {
  const {
    searchInput: hookSearchInput,
    setSearchInput: hookSetSearchInput,
    handleSearchSubmit: hookHandleSearchSubmit,
    handleSearchReset: hookHandleSearchReset,
    handleKeyPress: hookHandleKeyPress,
    isSearching: hookIsSearching,
  } = searchHook || {};

  const finalValue = searchHook ? hookSearchInput : value || '';
  const finalIsSearching = searchHook ? hookIsSearching : false;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (searchHook) {
      hookSetSearchInput?.(newValue);
    } else {
      onChange?.(newValue);
    }
  };

  const handleClear = () => {
    if (searchHook) {
      hookSetSearchInput?.('');
      hookHandleSearchReset?.();
    } else {
      onChange?.('');
      onClear?.();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchHook) {
      hookHandleSearchSubmit?.();
    } else {
      onSubmit?.();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (searchHook) {
        hookHandleKeyPress?.(e);
      } else {
        handleSubmit(e);
      }
    }
  };

  const shouldShowClearButton = showClearButton && (finalValue || finalIsSearching);

  return (
    <Box 
      component="form"
      onSubmit={handleSubmit}
      sx={{ 
        width: fullWidth ? '100%' : 'auto',
        ...sx 
      }}
    >
      <TextField
        fullWidth={fullWidth}
        variant="outlined"
        placeholder={placeholder}
        value={finalValue}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <IconButton
                  type="submit"
                  size="small"
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <IoSearch size={20} />
                </IconButton>
              </InputAdornment>
            ),
            endAdornment: shouldShowClearButton ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleClear}
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      color: 'error.main',
                    },
                  }}
                >
                  <IoClose size={20} />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 1,
            backgroundColor: 'background.paper',
            '& fieldset': { 
              borderColor: 'divider',
              borderWidth: 1,
            },
            '&:hover fieldset': {
              borderColor: 'primary.main',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'primary.main',
              borderWidth: 2,
            },
          },
          '& input': {
            color: 'text.primary',
            py: 1.5,
            '&::placeholder': {
              color: 'text.secondary',
              opacity: 0.7,
            },
          },
          ...inputSx,
        }}
      />
    </Box>
  );
};

export default SearchInput;