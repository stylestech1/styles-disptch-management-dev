/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  Divider,
  FormControl,
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
  alpha,
  Typography,
  Menu,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Building2,
  Mail,
  Phone,
  Search,
  SquarePen,
  X,
  CircleCheckBig,
  UsersRound,
  UserRoundCheck,
  CircleEllipsis,
  UserPlus,
  Eye,
  EyeOff,
  Pen,
  UserStar,
  KeyRound,
  UserRound,
} from "lucide-react";
import { useAppSelector, RootState } from "@/redux/store";
import {
  useCreateCompanyMutation,
  useGetCompaniesQuery,
  useUpdateCompanyMutation,
} from "@/redux/slices/apiSlice";

/** ===== Types (UI) ===== */
type CompanyStatus = "Active" | "Inactive";

type CompanyRow = {
  id: string; // mongo _id
  name: string;
  email: string;
  phone?: string;
  usersCount: number;
  active: boolean;
};

type CompanyForm = {
  name: string;
  email: string;
  phone: string;
  usersCount: string;
  status: CompanyStatus | "";
};

type AssignAdminForm = {
  fullName: string;
  email: string;
  phone: string;
  position: string;
  password: string;
  confirmPassword: string;
};

const emptyCompanyForm: CompanyForm = {
  name: "",
  email: "",
  phone: "",
  usersCount: "",
  status: "",
};

const emptyAssignAdminForm: AssignAdminForm = {
  fullName: "",
  email: "",
  phone: "",
  position: "",
  password: "",
  confirmPassword: "",
};

/** ================================
 *  Status pill (same design)
 *  ================================ */
const StatusPill = ({ active }: { active: boolean }) => {
  const palette = useAppSelector((s: RootState) => s.palette.currentPalette);
  const primary = palette?.primary ?? "#205DAC";

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        px: 2,
        py: 1.1,
        borderRadius: 999,
        bgcolor: active ? primary : alpha(primary, 0.12),
        color: active ? "#fff" : primary,
        fontWeight: 700,
        fontSize: 14,
        minWidth: 80, // ✅ width like screenshot
        justifyContent: "center",
      }}
    >
      <span>{active ? "Active" : "Inactive"}</span>
    </Box>
  );
};

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        borderRadius: 1,
        border: "1px solid #BFD3FF",
        p: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 76,
      }}
    >
      <Box>
        <Typography sx={{ fontSize: 12, color: "#1D5FBF", fontWeight: 800 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 22, fontWeight: 900, color: "#0F2E4A", mt: 0.5 }}>
          {value}
        </Typography>
      </Box>

      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: "1px solid #BFD3FF",
          display: "grid",
          placeItems: "center",
          bgcolor: "#F8FBFF",
        }}
      >
        {icon}
      </Box>
    </Paper>
  );
}

function CompanyDialog({
  open,
  mode,
  form,
  onChange,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  mode: "add" | "edit";
  form: CompanyForm;
  onChange: (patch: Partial<CompanyForm>) => void;
  onClose: () => void;
  onSubmit: () => void;
  loading?: boolean;
}) {
  const theme = useAppSelector((state: RootState) => state.palette);
  const title = mode === "add" ? "Add Company" : "Edit Company";

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
            // borderRadius: 3,
            // border: "1px solid #BFD3FF",
            overflow: "hidden",
          }}
        >
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
            <Typography sx={{ fontWeight: 900, color: "#0F2E4A" }}>
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
                label="Company Name"
                required
                sx={{
                  "& .MuiFormLabel-asterisk": {
                    color: "red",
                  },
                }}
                value={form.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="e.g. Aramex"
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
                label="Company Email"
                value={form.email}
                required
                sx={{
                  "& .MuiFormLabel-asterisk": {
                    color: "red",
                  },
                }}
                onChange={(e) => onChange({ email: e.target.value })}
                placeholder="e.g. aramex@gmail.com"
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
                placeholder="e.g. +20 10xxxxxx"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone size={18} />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl fullWidth>
                <Typography
                  sx={{ fontSize: 13, color: "#64748B", fontWeight: 700, mb: 0.8 }}>
                  Status
                </Typography>
                <Select
                  value={form.status}
                  onChange={(e) => onChange({ status: e.target.value as CompanyStatus })}
                  sx={selectSx}
                  startAdornment={
                    <InputAdornment position="start">
                      <CircleCheckBig color={theme.currentPalette.primary} />
                    </InputAdornment>
                  }
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Select status
                  </MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>

              <Button
                onClick={onSubmit}
                disabled={loading}
                variant="contained"
                fullWidth
                sx={{
                  mt: 1,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 900,
                  bgcolor: theme.currentPalette.primary,
                }}
              >
                {loading ? "Saving..." : "Submit"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Dialog>
  );
}
function AssignAdminDialog({
  open,
  onClose,
  form,
  onChange,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  form: AssignAdminForm;
  onChange: (patch: Partial<AssignAdminForm>) => void;
  onSubmit: () => void;
  loading?: boolean;
}) {
  const theme = useAppSelector((state: RootState) => state.palette);

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof AssignAdminForm, string>>>({});
  useEffect(() => {
    if (!open) {
      setErrors({});
      setShowPass(false);
      setShowConfirm(false);
    }
  }, [open]);

  const validate = (values: AssignAdminForm) => {
    const next: Partial<Record<keyof AssignAdminForm, string>> = {};

    const name = values.fullName.trim();
    if (!name) next.fullName = "Full name is required";
    else if (name.replace(/\s+/g, "").length <= 2) next.fullName = "Name must be more than 2 letters";

    const email = values.email.trim();
    if (!email) next.email = "Email is required";
    else if (!email.includes("@")) next.email = "Email must include @";
    const phone = values.phone.trim();
    if (!phone) next.phone = "Phone number is required";

    const pass = values.password ?? "";
    if (!pass) next.password = "Password is required";
    else {
      if (pass.length < 6) next.password = "Password must be 6 characters or more";
      else if (!/[A-Za-z]/.test(pass) || !/[0-9]/.test(pass))
        next.password = "Password must include at least 1 letter and 1 number";
    }
    const confirm = values.confirmPassword ?? "";
    if (!confirm) next.confirmPassword = "Confirm password is required";
    else if (confirm !== pass) next.confirmPassword = "Passwords do not match";

    return next;
  };

  const handleSubmit = () => {
    const nextErrors = validate(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    onSubmit();
  };
  const patchField = (patch: Partial<AssignAdminForm>) => {
    onChange(patch);
    const key = Object.keys(patch)[0] as keyof AssignAdminForm;
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <Box sx={{ p: 1 }}>
        <Paper elevation={0} sx={{ overflow: "hidden" }}>
          <Box
            sx={{
              px: 2,
              py: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "#fff",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
              <Box sx={{ width: 36, height: 36, display: "grid", placeItems: "center" }}>
                <UserPlus size={18} color={theme.currentPalette.primary} />
              </Box>
              <Typography sx={{ fontWeight: 900, color: theme.currentPalette.primary, fontSize: 20 }}>
                Assign Admin
              </Typography>
            </Box>

            <IconButton onClick={onClose} size="small">
              <X size={18} />
            </IconButton>
          </Box>

          <Divider />

          <Box sx={{ p: 2 }}>
            <Stack spacing={1.8}>
              <TextField
                label="Full Name"
                required
                value={form.fullName}
                onChange={(e) => patchField({ fullName: e.target.value })}
                placeholder="Enter full name"
                fullWidth
                error={Boolean(errors.fullName)}
                helperText={errors.fullName}
                sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <UserRound size={18} color={theme.currentPalette.primary} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Email Address"
                required
                value={form.email}
                onChange={(e) => patchField({ email: e.target.value })}
                placeholder="e.g. test@gmail.com"
                fullWidth
                error={Boolean(errors.email)}
                helperText={errors.email}
                sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={18} color={theme.currentPalette.primary} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Phone Number"
                required
                value={form.phone}
                onChange={(e) => patchField({ phone: e.target.value })}
                placeholder="+20100..."
                fullWidth
                error={Boolean(errors.phone)}
                helperText={errors.phone}
                sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone size={18} color={theme.currentPalette.primary} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Position"
                value={form.position}
                onChange={(e) => patchField({ position: e.target.value })}
                placeholder="e.g. Admin"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <UserStar size={18} color={theme.currentPalette.primary} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Password"
                required
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => patchField({ password: e.target.value })}
                placeholder="enter password"
                fullWidth
                error={Boolean(errors.password)}
                helperText={errors.password}
                sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyRound size={18} color={theme.currentPalette.primary} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPass((v) => !v)} edge="end">
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Confirm Password"
                required
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => patchField({ confirmPassword: e.target.value })}
                placeholder="enter password"
                fullWidth
                error={Boolean(errors.confirmPassword)}
                helperText={errors.confirmPassword}
                sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyRound size={18} color={theme.currentPalette.primary} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirm((v) => !v)} edge="end">
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                onClick={handleSubmit}
                disabled={loading}
                variant="contained"
                fullWidth
                sx={{
                  mt: 1,
                  py: 1.35,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 900,
                  bgcolor: theme.currentPalette.primary,
                }}
              >
                {loading ? "Assigning..." : "Assign"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Dialog>
  );
}

export default function CompaniesPage() {
  const theme = useAppSelector((state: RootState) => state.palette);

  const [search, setSearch] = useState("");
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [companyDialogMode, setCompanyDialogMode] = useState<"add" | "edit">("add");
  const [editing, setEditing] = useState<CompanyRow | null>(null);
  const [companyForm, setCompanyForm] = useState<CompanyForm>(emptyCompanyForm);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignCompany, setAssignCompany] = useState<CompanyRow | null>(null);
  const [assignForm, setAssignForm] = useState<AssignAdminForm>(emptyAssignAdminForm);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuRow, setMenuRow] = useState<CompanyRow | null>(null);
  const menuOpen = Boolean(menuAnchor);

  const { data, isLoading, isFetching, error, refetch } = useGetCompaniesQuery(
    { page: 1, limit: 50 } as any,
    { refetchOnMountOrArgChange: true }
  );

  const [createCompany, createState] = useCreateCompanyMutation();
  const [updateCompany, updateState] = useUpdateCompanyMutation();

  useEffect(() => {
    if (data) console.log("✅ getCompanies response:", data);
    if (error) console.log("❌ getCompanies error:", error);
  }, [data, error]);

  const companies: CompanyRow[] = useMemo(() => {
    const raw = (data?.data ?? []) as any[];
    const mapped: CompanyRow[] = raw.map((c) => ({
      id: String(c._id ?? c.id),
      name: c.name ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      usersCount: Number(c.usersCount ?? 0),
      active: Boolean(c.active),
    }));

    const q = search.trim().toLowerCase();
    if (!q) return mapped;
    return mapped.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [data, search]);

  const totalCompanies = data?.totalCompanies ?? companies.length;
  const totalUsers =
    data?.totalUsers ?? companies.reduce((sum, c) => sum + (c.usersCount ?? 0), 0);

  const openActionsMenu = (e: React.MouseEvent<HTMLElement>, row: CompanyRow) => {
    setMenuAnchor(e.currentTarget);
    setMenuRow(row);
  };

  const closeActionsMenu = () => {
    setMenuAnchor(null);
    setMenuRow(null);
  };

  const openAdd = () => {
    setCompanyDialogMode("add");
    setEditing(null);
    setCompanyForm(emptyCompanyForm);
    setCompanyDialogOpen(true);
  };

  const openEdit = (row: CompanyRow) => {
    setCompanyDialogMode("edit");
    setEditing(row);
    setCompanyForm({
      name: row.name ?? "",
      email: row.email ?? "",
      phone: row.phone ?? "",
      usersCount: String(row.usersCount ?? 0),
      status: row.active ? "Active" : "Inactive",
    });
    setCompanyDialogOpen(true);
  };

  const submitCompanyDialog = async () => {
    if (!companyForm.name.trim() || !companyForm.email.trim() || !companyForm.status) return;

    const body = {
      name: companyForm.name.trim(),
      email: companyForm.email.trim(),
      phone: companyForm.phone.trim() || undefined,
      usersCount: companyForm.usersCount ? Number(companyForm.usersCount) : 0,
      active: companyForm.status === "Active",
    };

    try {
      if (companyDialogMode === "add") {
        await createCompany(body as any).unwrap();
        setCompanyDialogOpen(false);
        refetch();
        return;
      }

      if (companyDialogMode === "edit") {
        if (!editing?.id) return;
        await updateCompany({ id: editing.id, body } as any).unwrap();
        setCompanyDialogOpen(false);
        refetch();
      }
    } catch (e) {
      console.log(" submitCompanyDialog error:", e);
    }
  };

  const openAssignAdmin = (row: CompanyRow) => {
    setAssignCompany(row);
    setAssignForm(emptyAssignAdminForm);
    setAssignOpen(true);
  };

  const submitAssignAdmin = async () => {
    if (
      !assignForm.fullName.trim() ||
      !assignForm.email.trim() ||
      !assignForm.phone.trim() ||
      !assignForm.position.trim() ||
      !assignForm.password ||
      !assignForm.confirmPassword
    ) {
      return;
    }
    if (assignForm.password !== assignForm.confirmPassword) return;

    // console.log("assign admin to company:", assignCompany?.id, assignForm);

    setAssignOpen(false);
  };

  const savingCompany = createState.isLoading || updateState.isLoading;

  return (
    <Box sx={{ minHeight: "100vh", p: 3 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <StatCard label="Total Companies" value={totalCompanies} icon={<UsersRound size={18} color={theme.currentPalette.primary} />} />
        <StatCard label="Total Users" value={totalUsers} icon={<UserRoundCheck size={18} color={theme.currentPalette.primary} />} />
      </Stack>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 1,
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
              flexWrap: "wrap",
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 900, color: theme.currentPalette.primary }}>
                Company Details
              </Typography>
              <Typography sx={{ fontSize: 12, color: theme.currentPalette.primary }}>
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
                  minWidth: 320,
                  "& .MuiOutlinedInput-root": { borderRadius: 1 },
                }}
              />

              <Button
                variant="contained"
                onClick={openAdd}
                sx={{
                  textTransform: "none",
                  fontWeight: 900,
                  borderRadius: 1,
                  px: 3,
                  bgcolor: theme.currentPalette.primary,
                }}
              >
                Add Company
              </Button>
            </Stack>
          </Box>
        </Box>

        <Divider />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#F8FBFF" }}>
                <TableCell
                  sx={{
                    color: theme.currentPalette.primary,
                    fontWeight: 800,
                  }}
                  className="text-center">Company ID</TableCell>
                <TableCell

                  sx={{
                    color: theme.currentPalette.primary,
                    fontWeight: 800,
                  }} className="text-center">Company Name</TableCell>
                <TableCell sx={{
                  color: theme.currentPalette.primary,
                  fontWeight: 800,
                }} className="text-center">No. of Users</TableCell>
                <TableCell sx={{
                  color: theme.currentPalette.primary,
                  fontWeight: 800,
                }} className="text-center">Email</TableCell>
                <TableCell sx={{
                  color: theme.currentPalette.primary,
                  fontWeight: 800,
                }} className="text-center">Status</TableCell>
                <TableCell sx={{
                  color: theme.currentPalette.primary,
                  fontWeight: 800,
                }} className="text-center">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {(isLoading || isFetching) && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 4 }}>
                    <Typography sx={{ color: "#6B7A90", fontWeight: 800 }}>
                      Loading...
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                !isFetching &&
                companies.map((row, index) => (
                  <TableRow key={row.id} hover>
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="text-center">{row.name}</TableCell>
                    <TableCell className="text-center">{row.usersCount}</TableCell>
                    <TableCell className="text-center">{row.email}</TableCell>
                    <TableCell className="text-center">
                      {/* {row.active === true ? "active" : "inactive"} */}
                      <StatusPill active={row.active} />
                    </TableCell>

                    <TableCell className="text-center">
                      <IconButton
                        onClick={(e) => openActionsMenu(e, row)}
                        sx={{ width: 42, height: 42 }}
                      >
                        <CircleEllipsis size={20} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && !isFetching && companies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography sx={{ color: "#6B7A90", fontWeight: 800 }}>
                      No companies found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Menu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={closeActionsMenu}
        PaperProps={{
          sx: {
            mt: 1,
            // borderRadius: 2,
            // border: "1px solid #E6EEFF",
            // boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            minWidth: 190,
            overflow: "hidden",
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (!menuRow) return;
            closeActionsMenu();
            openAssignAdmin(menuRow);
          }}
          sx={{ py: 1.2, color: theme.currentPalette.primary }}
        >
          <ListItemIcon sx={{ minWidth: 34, color: theme.currentPalette.primary, }}>
            <UserPlus size={18} />
          </ListItemIcon>
          <ListItemText primary="Assign Admin" primaryTypographyProps={{ fontWeight: 700 }} />
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (!menuRow) return;
            closeActionsMenu();
            openEdit(menuRow);
          }}
          sx={{
            py: 1.2,
            color: theme.currentPalette.primary,
          }}
        >
          <ListItemIcon sx={{ minWidth: 34, color: theme.currentPalette.primary, }}>
            <Pen size={18} />
          </ListItemIcon>
          <ListItemText primary="Edit Company" primaryTypographyProps={{ fontWeight: 700 }} />
        </MenuItem>
      </Menu>

      <CompanyDialog
        open={companyDialogOpen}
        mode={companyDialogMode}
        form={companyForm}
        onChange={(patch) => setCompanyForm((p) => ({ ...p, ...patch }))}
        onClose={() => setCompanyDialogOpen(false)}
        onSubmit={submitCompanyDialog}
        loading={savingCompany}
      />

      <AssignAdminDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        form={assignForm}
        onChange={(patch) => setAssignForm((p) => ({ ...p, ...patch }))}
        onSubmit={submitAssignAdmin}
      />
    </Box>
  );
}