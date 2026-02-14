"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  Building2,
  Mail,
  Phone,
  UserRound,
  Search,
  Pencil,
  X,
  CircleCheckBig,
} from "lucide-react";
import { useAppSelector, RootState } from "@/redux/store";

type CompanyStatus = "Active" | "Inactive";

type Company = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  usersCount: number;
  status: CompanyStatus;
};

const initialCompanies: Company[] = [
  {
    id: 1414,
    name: "Blue Nile Logistics",
    email: "ops@bluenile-logistics.com",
    phone: "+1 215567890",
    usersCount: 40,
    status: "Inactive",
  },
  {
    id: 1415,
    name: "Swift Trans-Global",
    email: "dispatch@swift-trans.net",
    phone: "+1 215567891",
    usersCount: 18,
    status: "Active",
  },
  {
    id: 1416,
    name: "Atlas Freight Systems",
    email: "info@atlasfreight.io",
    phone: "+1 215567892",
    usersCount: 22,
    status: "Active",
  },
  {
    id: 1417,
    name: "Desert Eagle Express",
    email: "booking@deserteagle.co",
    phone: "+1 215567893",
    usersCount: 12,
    status: "Inactive",
  },
];

type CompanyForm = {
  name: string;
  email: string;
  phone: string;
  usersCount: string;
  status: CompanyStatus | "";
};

const emptyForm: CompanyForm = {
  name: "",
  email: "",
  phone: "",
  usersCount: "",
  status: "",
};

function CompanyDialog({
  open,
  mode,
  form,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "add" | "edit";
  form: CompanyForm;
  onChange: (patch: Partial<CompanyForm>) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const title = mode === "add" ? "Add Company" : "Edit Company";
  const theme = useAppSelector((state: RootState) => state.palette);

  function FieldLabel({ label, required }: { label: string; required?: boolean }) {
    return (
      <Typography sx={{ fontSize: 13, color: "#64748B", fontWeight: 600, mb: 0.8 }}>
        {label} {required ? <span style={{ color: "#EF4444" }}>*</span> : null}
      </Typography>
    );
  }
  const selectSx = {
    borderRadius: "10px",
    backgroundColor: "#fff",
    minHeight: 48,
    "& .MuiSelect-select": { display: "flex", alignItems: "center", gap: 8 },
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <Box sx={{ p: 2.25 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #BFD3FF",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "#fff",
            }}
          >
            <Typography sx={{ fontWeight: 800, color: "#0F2E4A" }}>
              {title}
            </Typography>

            <IconButton onClick={onClose} size="small">
              <X size={18} />
            </IconButton>
          </Box>

          <Divider />

          <Box sx={{ p: 2 }}>
            <Stack spacing={1.6}>
              <TextField
                label="Company Name *"
                value={form.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="e.g. FixIt Auto Center"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Building2 size={18} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Company Email *"
                value={form.email}
                onChange={(e) => onChange({ email: e.target.value })}
                placeholder="e.g. FixIt Auto Center@gmail.com"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={18} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Phone"
                value={form.phone}
                onChange={(e) => onChange({ phone: e.target.value })}
                placeholder="e.g. +1 215567890"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone size={18} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="No. of users *"
                value={form.usersCount}
                onChange={(e) =>
                  onChange({
                    usersCount: e.target.value.replace(/[^\d]/g, ""),
                  })
                }
                placeholder="e.g. 40"
                fullWidth
                inputMode="numeric"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <UserRound size={18} />
                    </InputAdornment>
                  ),
                }}
              />
              <Box>
                <FieldLabel label="Status" />
                <FormControl fullWidth >
                  <Select
                    value={form.status}
                    // onChange={(e) => setField("status", e.target.value as any)}
                    sx={selectSx}
                    startAdornment={
                      <InputAdornment position="start">
                        <CircleCheckBig color={theme.currentPalette.primary} />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>

                  {/* {!!errors.status && (
                                        <FormHelperText sx={{ mt: 0.5 }}>{errors.status}</FormHelperText>
                                    )} */}
                </FormControl>
              </Box>

              <Button
                onClick={onSubmit}
                variant="contained"
                fullWidth
                sx={{
                  mt: 1,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 800,
                  bgcolor: "#1D5FBF",
                }}
              >
                Submit
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Dialog>
  );
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<number | null>(null);
  const theme = useAppSelector((state: RootState) => state.palette);

  const [form, setForm] = useState<CompanyForm>(emptyForm);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        String(c.id).includes(q)
    );
  }, [companies, search]);

  const openAdd = () => {
    setDialogMode("add");
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (row: Company) => {
    setDialogMode("edit");
    setEditingId(row.id);
    setForm({
      name: row.name,
      email: row.email,
      phone: row.phone || "",
      usersCount: String(row.usersCount ?? ""),
      status: row.status,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => setDialogOpen(false);

  const submitDialog = () => {
    if (!form.name.trim() || !form.email.trim() || !form.usersCount || !form.status) return;

    if (dialogMode === "add") {
      const newCompany: Company = {
        id: Math.floor(1000 + Math.random() * 9000),
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        usersCount: Number(form.usersCount),
        status: form.status as CompanyStatus,
      };
      setCompanies((prev) => [newCompany, ...prev]);
      setDialogOpen(false);
      return;
    }
    if (editingId != null) {
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? {
              ...c,
              name: form.name.trim(),
              email: form.email.trim(),
              phone: form.phone.trim(),
              usersCount: Number(form.usersCount),
              status: form.status as CompanyStatus,
            }
            : c
        )
      );
    }
    setDialogOpen(false);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Box sx={{ flex: 1, p: 3.5 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #BFD3FF",
            overflow: "hidden",
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 900, color: theme.currentPalette.primary }}>
                  Company Details
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#6B7A90" }}>
                  Check the list of all companies
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  placeholder="Search .."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={16} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    minWidth: 260,
                    "& .MuiOutlinedInput-root": { borderRadius: 2 },
                  }}
                />

                <Button
                  variant="contained"
                  onClick={openAdd}
                  sx={{
                    textTransform: "none",
                    fontWeight: 900,
                    borderRadius: 2,
                    bgcolor: "#1D5FBF",
                  }}
                >
                  Add Company
                </Button>
              </Stack>
            </Box>
          </Box>

          <Divider />

          {/* Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#F8FBFF" }}>
                  <TableCell sx={{ fontWeight: 900, color: "#2B4A6A" }}>
                    Company ID
                  </TableCell>
                  <TableCell sx={{ fontWeight: 900, color: "#2B4A6A" }}>
                    Company Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: 900, color: "#2B4A6A" }}>
                    Email
                  </TableCell>
                  <TableCell sx={{ fontWeight: 900, color: "#2B4A6A" }}>
                    Status
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 900, color: "#2B4A6A" }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Box
                        sx={{
                          display: "inline-flex",
                          px: 1.1,
                          py: 0.35,
                          borderRadius: 1.2,
                          bgcolor: "#EAF2FF",
                          color: theme.currentPalette.primary,
                          fontWeight: 900,
                          fontSize: 12,
                        }}
                      >
                        {row.id}
                      </Box>
                    </TableCell>

                    <TableCell sx={{ color: theme.currentPalette.primary, fontWeight: 700 }}>
                      {row.name}
                    </TableCell>

                    <TableCell sx={{ color: theme.currentPalette.primary }}>
                      {row.email}
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={row.status}
                        sx={{
                          bgcolor: row.status === "Active" ? "#E7F8EF" : "#EEF2FF",
                          color: row.status === "Active" ? "#16803B" : theme.currentPalette.primary,
                          fontWeight: 900,
                        }}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <IconButton
                        onClick={() => openEdit(row)}
                        sx={{
                          border: "1px solid #BFD3FF",
                          borderRadius: 2,
                        }}
                      >
                        <Pencil size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}

                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography sx={{ color: "#6B7A90", fontWeight: 700 }}>
                        No companies found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Add/Edit Popup */}
      <CompanyDialog
        open={dialogOpen}
        mode={dialogMode}
        form={form}
        onChange={(patch) => setForm((p) => ({ ...p, ...patch }))}
        onClose={closeDialog}
        onSubmit={submitDialog}
      />
    </Box>
  );
}
