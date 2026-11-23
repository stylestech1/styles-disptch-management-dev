"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { ContentCopy, OpenInNew } from "@mui/icons-material";
import toast from "react-hot-toast";
import {
  useGetCompanyRecruitmentQuery,
  useUpdateCompanyRecruitmentMutation,
} from "@/redux/slices/apiSlice";
import { useAppSelector } from "@/redux/store";

export default function CompanyRecruitmentSettings({
  companyId,
}: {
  companyId?: string;
}) {
  const user = useAppSelector((state) => state.auth.user);
  const role = String(user?.role || "").toLowerCase();
  const canEdit = role === "admin" || role === "superadmin" || role === "super-admin";
  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useGetCompanyRecruitmentQuery(companyId);
  const [updateSettings, { isLoading: isSaving }] =
    useUpdateCompanyRecruitmentMutation();
  const [copyError, setCopyError] = useState("");

  const settings = response?.data;

  const handleToggle = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      await updateSettings({
        enabled: event.target.checked,
        ...(companyId ? { companyId } : {}),
      }).unwrap();
      toast.success("Recruitment settings updated.");
    } catch (requestError) {
      const message =
        typeof requestError === "object" &&
        requestError !== null &&
        "data" in requestError &&
        typeof requestError.data === "object" &&
        requestError.data !== null &&
        "message" in requestError.data
          ? String(requestError.data.message)
          : "Could not update recruitment settings.";
      toast.error(message);
    }
  };

  const handleCopy = async () => {
    if (!settings?.publicUrl) return;
    try {
      await navigator.clipboard.writeText(settings.publicUrl);
      setCopyError("");
      toast.success("Application link copied.");
    } catch {
      setCopyError("Could not copy the link. Select and copy it manually.");
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !settings) {
    const message =
      typeof error === "object" &&
      error !== null &&
      "data" in error &&
      typeof error.data === "object" &&
      error.data !== null &&
      "message" in error.data
        ? String(error.data.message)
        : "Unable to load recruitment settings.";
    return <Alert severity="error">{message}</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", py: { xs: 1, md: 3 } }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Company Recruitment
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Manage public driver applications for {settings.companyName}.
      </Typography>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography variant="h6">Public Driver Applications</Typography>
            <Chip
              size="small"
              label={settings.enabled ? "Recruitment Active" : "Recruitment Paused"}
              color={settings.enabled ? "success" : "warning"}
              sx={{ mt: 1 }}
            />
          </Box>
          <Tooltip
            title={
              canEdit
                ? ""
                : "Only Company Admins can toggle recruitment settings"
            }
          >
            <span>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enabled}
                    onChange={handleToggle}
                    disabled={!canEdit || isSaving}
                    inputProps={{ "aria-label": "Public Driver Applications" }}
                  />
                }
                label={isSaving ? "Saving..." : settings.enabled ? "Enabled" : "Disabled"}
              />
            </span>
          </Tooltip>
        </Box>
        {!settings.enabled && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Applicants visiting this link will be notified that applications
            are temporarily paused.
          </Alert>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" gutterBottom>
          Public Application URL
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Share this link with prospective drivers.
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <TextField
            fullWidth
            value={settings.publicUrl}
            label="Application link"
            InputProps={{ readOnly: true }}
            sx={{ flex: "1 1 360px" }}
          />
          <Button
            variant="outlined"
            startIcon={<ContentCopy />}
            onClick={handleCopy}
            sx={{ minHeight: 56 }}
          >
            Copy Link
          </Button>
          <IconButton
            aria-label="Open application page"
            component="a"
            href={settings.publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ minWidth: 56, border: 1, borderColor: "divider", borderRadius: 1 }}
          >
            <OpenInNew />
          </IconButton>
        </Box>
        {copyError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {copyError}
          </Alert>
        )}
      </Paper>
    </Box>
  );
}
