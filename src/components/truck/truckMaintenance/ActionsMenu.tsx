"use client";

import React from "react";
import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import { IoMdEye } from "react-icons/io";
import { Edit, Trash2 } from "lucide-react";
import { TMaintenance } from "@/types/truckType";
import { RootState, useAppSelector } from "@/redux/store";

interface ActionsMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  selectedMaintenance: TMaintenance | null;
  onViewTrucks: (maintenance: TMaintenance) => void;
  onEditClick: (maintenance: TMaintenance) => void;
  onDeleteClick: (maintenance: TMaintenance) => void;
}

const ActionsMenu: React.FC<ActionsMenuProps> = ({
  anchorEl,
  onClose,
  selectedMaintenance,
  onViewTrucks,
  onEditClick,
  onDeleteClick,
}) => {
  const theme = useAppSelector((state: RootState) => state.palette);

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          mt: 1,
        },
      }}
    >
      <MenuItem
        onClick={() => {
          if (selectedMaintenance) onViewTrucks(selectedMaintenance);
          onClose();
        }}
        sx={{ fontSize: "14px" }}
      >
        <ListItemIcon sx={{ minWidth: 32 }}>
          <IoMdEye size={18} color={theme.currentPalette.primary} />
        </ListItemIcon>
        <ListItemText
          primary="View Trucks"
          slotProps={{
            primary: {
              sx: { color: theme.currentPalette.primary },
            },
          }}
        />
      </MenuItem>

      <MenuItem
        onClick={() => {
          if (selectedMaintenance) onEditClick(selectedMaintenance);
        }}
        sx={{ fontSize: "14px" }}
      >
        <ListItemIcon sx={{ minWidth: 32 }}>
          <Edit size={18} color={theme.currentPalette.primary} />
        </ListItemIcon>
        <ListItemText
          primary="Edit Details"
          slotProps={{
            primary: {
              sx: { color: theme.currentPalette.primary },
            },
          }}
        />
      </MenuItem>

      <MenuItem
        onClick={() => {
          if (selectedMaintenance) onDeleteClick(selectedMaintenance);
        }}
        sx={{ fontSize: "14px", color: "#dc2626" }}
      >
        <ListItemIcon sx={{ minWidth: 32 }}>
          <Trash2 size={18} color="#dc2626" />
        </ListItemIcon>
        <ListItemText
          primary="Delete"
          slotProps={{
            primary: {
              sx: { color: "#dc2626" },
            },
          }}
        />
      </MenuItem>
    </Menu>
  );
};

export default ActionsMenu;
