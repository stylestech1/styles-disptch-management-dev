"use client";

import React from "react";
import {
  alpha,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { Trash2 } from "lucide-react";
import { TMaintenance } from "@/types/truckType";

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  selectedMaintenance: TMaintenance | null;
  isDeleting: boolean;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  open,
  onClose,
  onDelete,
  selectedMaintenance,
  isDeleting,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: `1px solid ${alpha("#dc2626", 0.1)}`,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          py: 2,
          px: 3,
        }}
      >
        <Trash2 size={24} color="#dc2626" />
        <Typography sx={{ fontWeight: 600, color: "#dc2626" }}>
          Delete Maintenance
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 5 }}>
        <Typography sx={{ mb: 2 }}>
          Are you sure you want to delete this maintenance record?
        </Typography>
        {selectedMaintenance && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: alpha("#dc2626", 0.05),
              border: `1px solid ${alpha("#dc2626", 0.1)}`,
            }}
          >
            <Typography sx={{ fontWeight: 500 }}>
              Type: {selectedMaintenance.type}
            </Typography>
            <Typography>Repeat By: {selectedMaintenance.repeatBy}</Typography>
            <Typography>
              Trucks: {selectedMaintenance.statusPerTruck?.length || 0}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          fullWidth
          sx={{
            border: `1px solid #dc2626`,
            color: "#dc2626",
            textTransform: "capitalize",
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onDelete}
          variant="contained"
          fullWidth
          disabled={isDeleting}
          sx={{
            bgcolor: "#dc2626",
            color: "#fff",
            "&:hover": {
              bgcolor: "#b91c1c",
            },
            textTransform: "capitalize",
          }}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteDialog;