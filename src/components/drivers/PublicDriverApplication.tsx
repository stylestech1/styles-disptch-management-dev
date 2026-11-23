"use client";

import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import Check from "@mui/icons-material/Check";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";

type ApplicationForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  experienceYears: string;
  violations: string;
  readyDate: string;
  state: string;
};

const initialForm: ApplicationForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  experienceYears: "",
  violations: "",
  readyDate: "",
  state: "",
};

const firstStepFields = [
  "firstName",
  "lastName",
  "phone",
  "email",
  "state",
] as const;

const fieldLabelSx = {
  display: "block",
  mb: 0.5,
  color: "#142b45",
  fontSize: 16,
  fontWeight: 700,
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 57,
    borderRadius: "11px",
    backgroundColor: "#fff",
    "& fieldset": { borderColor: "#dce5f1" },
    "&:hover fieldset": { borderColor: "#b8c9e2" },
    "&.Mui-focused fieldset": { borderColor: "#8eafff" },
  },
  "& .MuiInputBase-input": {
    px: 2.5,
    color: "#142b45",
  },
  "& .MuiInputBase-input::placeholder": {
    color: "#8491a3",
    opacity: 1,
  },
  "& .MuiInputBase-inputMultiline": {
    px: 0,
  },
};

export default function PublicDriverApplication() {
  const { slug } = useParams<{ slug: string }>();
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [outcome, setOutcome] = useState<"success" | "paused" | "invalid" | null>(
    null,
  );

  const updateField = (field: keyof ApplicationForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  };

  const validateStep = (stepToValidate: 1 | 2) => {
    const nextErrors: Record<string, string> = {};

    if (stepToValidate === 1) {
      for (const field of firstStepFields) {
        if (!form[field].trim()) nextErrors[field] = "This field is required.";
      }
      if (
        form.email.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
      ) {
        nextErrors.email = "Enter a valid email address.";
      }
    } else {
      if (
        !/^\d+$/.test(form.experienceYears) ||
        !Number.isSafeInteger(Number(form.experienceYears))
      ) {
        nextErrors.experienceYears = "Enter a whole number of 0 or more.";
      }
      if (!form.violations.trim()) {
        nextErrors.violations = "This field is required.";
      } else if (form.violations.length > 70) {
        nextErrors.violations = "Maximum 70 characters.";
      }
      if (!form.readyDate) nextErrors.readyDate = "Select your ready date.";
    }

    setFieldErrors((current) => ({ ...current, ...nextErrors }));
    return nextErrors;
  };

  const goToNextStep = () => {
    setFormError("");
    const errors = validateStep(1);
    if (Object.keys(errors).length) {
      setFormError("Please review the highlighted fields.");
      return;
    }
    setStep(2);
  };

  const submitApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    const nextErrors = validateStep(2);
    if (Object.keys(nextErrors).length) {
      setFormError("Please review the highlighted fields.");
      return;
    }

    const payload = new FormData();
    payload.append("firstName", form.firstName.trim());
    payload.append("lastName", form.lastName.trim());
    payload.append("email", form.email.trim());
    payload.append("phone", form.phone.trim());
    payload.append("experienceYears", form.experienceYears);
    payload.append("violations", form.violations.trim());
    payload.append(
      "readyDate",
      new Date(`${form.readyDate}T00:00:00.000Z`).toISOString(),
    );
    payload.append("state", form.state.trim());

    setIsSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
      const response = await fetch(
        `${baseUrl.replace(/\/+$/, "")}/api/v1/driver-applicants/public/${encodeURIComponent(slug)}`,
        { method: "POST", body: payload },
      );
      const result = await response.json().catch(() => ({}));

      if (response.status === 403) {
        setOutcome("paused");
        return;
      }
      if (response.status === 404) {
        setOutcome("invalid");
        return;
      }
      if (!response.ok) {
        const errors = Array.isArray(result.errors) ? result.errors : [];
        const mappedErrors = errors.reduce(
          (all: Record<string, string>, item: { path?: string; msg?: string }) => {
            if (item.path) all[item.path] = item.msg || "Invalid value.";
            return all;
          },
          {},
        );
        setFieldErrors(mappedErrors);
        if (firstStepFields.some((field) => mappedErrors[field])) setStep(1);
        setFormError(
          result.message ||
            Object.values(mappedErrors).join(" ") ||
            "We could not submit your application. Please review the form and try again.",
        );
        return;
      }
      setOutcome("success");
    } catch {
      setFormError("Unable to reach the application service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressCircleSx = {
    width: 42,
    height: 42,
    flex: "0 0 42px",
    display: "grid",
    placeItems: "center",
    border: "2px solid #ff744d",
    borderRadius: "50%",
    color: "#ff744d",
    fontSize: 19,
    fontWeight: 700,
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        bgcolor: "#f4f6f9",
        py: { xs: 3, sm: 5 },
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 4.5 },
            border: "2px solid #9ab8ff",
            borderRadius: { xs: "22px", sm: "30px" },
            boxShadow: "0 18px 38px rgba(37, 83, 145, 0.12)",
          }}
        >
          {outcome === "success" ? (
            <Box sx={{ textAlign: "center", py: 5 }}>
              <CheckCircleOutline color="success" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Application submitted successfully!
              </Typography>
              <Typography color="text.secondary">
                The recruitment team has received your details and will contact
                you shortly.
              </Typography>
            </Box>
          ) : outcome === "paused" ? (
            <Alert severity="info" sx={{ py: 2 }}>
              <Typography variant="h6">Applications Currently Paused</Typography>
              This company is not currently accepting new driver applications.
              Please check back later.
            </Alert>
          ) : outcome === "invalid" ? (
            <Alert severity="error" sx={{ py: 2 }}>
              <Typography variant="h6">
                Recruitment Link Expired or Invalid
              </Typography>
              Please verify the URL or contact the company directly.
            </Alert>
          ) : (
            <>
              <Box
                aria-label={`Step ${step} of 2`}
                sx={{ display: "flex", alignItems: "center", mb: 3.5 }}
              >
                <Box
                  sx={{
                    ...progressCircleSx,
                    ...(step === 2
                      ? { bgcolor: "#ff744d", color: "#fff" }
                      : {}),
                  }}
                  aria-label={step === 2 ? "Step 1 complete" : "Step 1"}
                >
                  {step === 2 ? <Check /> : <Box sx={{ width: 12, height: 12, bgcolor: "#ff744d", borderRadius: "50%" }} />}
                </Box>
                <Box
                  sx={{
                    height: 4,
                    flex: 1,
                    mx: 2,
                    borderRadius: 2,
                    bgcolor: step === 2 ? "#2861aa" : "#cbd8e9",
                  }}
                />
                <Box
                  sx={{
                    ...progressCircleSx,
                    ...(step === 1
                      ? {
                          bgcolor: "#2861aa",
                          borderColor: "#2861aa",
                          color: "#fff",
                        }
                      : {}),
                  }}
                  aria-label={step === 1 ? "Step 2" : "Current step, 2"}
                >
                  {step === 1 ? (
                    "2"
                  ) : (
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        bgcolor: "#ff744d",
                        borderRadius: "50%",
                      }}
                    />
                  )}
                </Box>
              </Box>

              {formError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formError}
                </Alert>
              )}

              {step === 1 ? (
                <Box sx={{ display: "grid", gap: 2.75 }}>
                  <Box>
                    <Typography component="label" htmlFor="firstName" sx={fieldLabelSx}>
                      First Name <Box component="span" sx={{ color: "#f0445e" }}>*</Box>
                    </Typography>
                    <TextField
                      id="firstName"
                      fullWidth
                      placeholder="First name"
                      value={form.firstName}
                      onChange={(event) => updateField("firstName", event.target.value)}
                      error={Boolean(fieldErrors.firstName)}
                      helperText={fieldErrors.firstName}
                      inputProps={{ maxLength: 100 }}
                      sx={inputSx}
                    />
                  </Box>
                  <Box>
                    <Typography component="label" htmlFor="lastName" sx={fieldLabelSx}>
                      Last Name <Box component="span" sx={{ color: "#f0445e" }}>*</Box>
                    </Typography>
                    <TextField
                      id="lastName"
                      fullWidth
                      placeholder="Last name"
                      value={form.lastName}
                      onChange={(event) => updateField("lastName", event.target.value)}
                      error={Boolean(fieldErrors.lastName)}
                      helperText={fieldErrors.lastName}
                      inputProps={{ maxLength: 100 }}
                      sx={inputSx}
                    />
                  </Box>
                  <Box>
                    <Typography component="label" htmlFor="phone" sx={fieldLabelSx}>
                      Phone Number <Box component="span" sx={{ color: "#f0445e" }}>*</Box>
                    </Typography>
                    <TextField
                      id="phone"
                      fullWidth
                      type="tel"
                      placeholder="Phone number"
                      value={form.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      error={Boolean(fieldErrors.phone)}
                      helperText={fieldErrors.phone}
                      autoComplete="tel"
                      sx={inputSx}
                    />
                  </Box>
                  <Box>
                    <Typography component="label" htmlFor="email" sx={fieldLabelSx}>
                      Email <Box component="span" sx={{ color: "#f0445e" }}>*</Box>
                    </Typography>
                    <TextField
                      id="email"
                      fullWidth
                      type="email"
                      placeholder="Email"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      error={Boolean(fieldErrors.email)}
                      helperText={fieldErrors.email}
                      autoComplete="email"
                      sx={inputSx}
                    />
                  </Box>
                  <Box>
                    <Typography component="label" htmlFor="state" sx={fieldLabelSx}>
                      State <Box component="span" sx={{ color: "#f0445e" }}>*</Box>
                    </Typography>
                    <TextField
                      id="state"
                      fullWidth
                      placeholder="State"
                      value={form.state}
                      onChange={(event) => updateField("state", event.target.value)}
                      error={Boolean(fieldErrors.state)}
                      helperText={fieldErrors.state}
                      sx={inputSx}
                    />
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: -1 }}>
                    <Button
                      type="button"
                      onClick={goToNextStep}
                      variant="contained"
                      sx={{
                        minWidth: 88,
                        minHeight: 52,
                        borderRadius: "28px",
                        bgcolor: "#ffad98",
                        color: "#fff",
                        fontSize: 16,
                        fontWeight: 700,
                        textTransform: "none",
                        boxShadow: "none",
                        "&:hover": { bgcolor: "#ff9479", boxShadow: "none" },
                      }}
                    >
                      Next
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box
                  component="form"
                  onSubmit={submitApplication}
                  noValidate
                  sx={{ display: "grid", gap: 3.25 }}
                >
                  <Box>
                    <Typography
                      component="label"
                      htmlFor="experienceYears"
                      sx={fieldLabelSx}
                    >
                      How many years of experience do you have?{" "}
                      <Box component="span" sx={{ color: "#f0445e" }}>*</Box>
                    </Typography>
                    <TextField
                      id="experienceYears"
                      fullWidth
                      type="number"
                      placeholder="Example: 2 years"
                      value={form.experienceYears}
                      onChange={(event) =>
                        updateField("experienceYears", event.target.value)
                      }
                      error={Boolean(fieldErrors.experienceYears)}
                      helperText={fieldErrors.experienceYears}
                      inputProps={{ min: 0, step: 1 }}
                      sx={inputSx}
                    />
                  </Box>
                  <Box>
                    <Typography
                      component="label"
                      htmlFor="violations"
                      sx={fieldLabelSx}
                    >
                      Do you have any tickets or accidents for the last 1 year?{" "}
                      <Box component="span" sx={{ color: "#f0445e" }}>*</Box>
                    </Typography>
                    <TextField
                      id="violations"
                      fullWidth
                      multiline
                      minRows={4}
                      placeholder="yes/no..."
                      value={form.violations}
                      onChange={(event) =>
                        updateField("violations", event.target.value.slice(0, 70))
                      }
                      error={Boolean(fieldErrors.violations)}
                      inputProps={{ maxLength: 70 }}
                      sx={{
                        ...inputSx,
                        "& .MuiOutlinedInput-root": {
                          ...inputSx["& .MuiOutlinedInput-root"],
                          minHeight: 137,
                          alignItems: "flex-start",
                          py: 1,
                        },
                        "& .MuiInputBase-inputMultiline": { p: 0 },
                      }}
                    />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        minHeight: 22,
                        mt: 0.5,
                      }}
                    >
                      {fieldErrors.violations ? (
                        <Typography variant="caption" color="error">
                          {fieldErrors.violations}
                        </Typography>
                      ) : (
                        <span />
                      )}
                      <Typography variant="body2" sx={{ color: "#8498b7" }}>
                        {form.violations.length}/70
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography component="label" htmlFor="readyDate" sx={fieldLabelSx}>
                      When are you ready to start?{" "}
                      <Box component="span" sx={{ color: "#f0445e" }}>*</Box>
                    </Typography>
                    <TextField
                      id="readyDate"
                      fullWidth
                      type="date"
                      value={form.readyDate}
                      onChange={(event) => updateField("readyDate", event.target.value)}
                      error={Boolean(fieldErrors.readyDate)}
                      helperText={fieldErrors.readyDate}
                      sx={{
                        ...inputSx,
                        "& input": { colorScheme: "light" },
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mt: -1,
                    }}
                  >
                    <Button
                      type="button"
                      onClick={() => {
                        setFormError("");
                        setStep(1);
                      }}
                      sx={{
                        color: "#91b1df",
                        fontSize: 16,
                        fontWeight: 700,
                        textTransform: "none",
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting}
                      sx={{
                        minWidth: 134,
                        minHeight: 52,
                        borderRadius: "28px",
                        bgcolor: "#ffad98",
                        color: "#fff",
                        fontSize: 16,
                        fontWeight: 700,
                        textTransform: "none",
                        boxShadow: "none",
                        "&:hover": { bgcolor: "#ff9479", boxShadow: "none" },
                      }}
                    >
                      {isSubmitting ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        "Complete"
                      )}
                    </Button>
                  </Box>
                </Box>
              )}
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
