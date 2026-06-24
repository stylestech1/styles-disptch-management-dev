/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RootState, useAppSelector } from "@/redux/store";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  alpha,
} from "@mui/material";
import {
  useVerifyEmailMutation,
  useResendVerificationCodeMutation,
} from "@/redux/slices/apiSlice";

export default function VerifyEmailPage() {
  const router = useRouter();

  const [showOtpInput, setShowOtpInput] = useState(false);
  const [email, setEmail] = useState("");
  const [redirectPath, setRedirectPath] = useState("/dispatchers/loads");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const user = useAppSelector((state: RootState) => state.auth.user);

  const [verifyEmail, { isLoading }] = useVerifyEmailMutation();
  const [resendCode, { isLoading: isResending }] =
    useResendVerificationCodeMutation();

  const RESEND_SECONDS = 120;
  const BLOCK_KEY = "verify_email_resend_block_until";

  const [timer, setTimer] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);

  const primary = "#205DAC";

  const getRemainingSeconds = (until: number | null) => {
    if (!until) return 0;
    return Math.max(0, Math.ceil((until - Date.now()) / 1000));
  };

  const remainingBlockSeconds = getRemainingSeconds(blockedUntil);

  const isResendDisabled =
    timer > 0 || remainingBlockSeconds > 0 || isResending;

  useEffect(() => {
    const savedEmail = sessionStorage.getItem("verify_email");
    const savedRedirect = sessionStorage.getItem("after_verify_redirect");

    if (savedEmail) setEmail(savedEmail);
    if (savedRedirect) setRedirectPath(savedRedirect);
  }, []);

  useEffect(() => {
    const savedUntil = localStorage.getItem(BLOCK_KEY);

    if (savedUntil && Number(savedUntil) > Date.now()) {
      setBlockedUntil(Number(savedUntil));
    }
  }, []);

  useEffect(() => {
    if (!showOtpInput) return;
    if (timer <= 0 && remainingBlockSeconds <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => Math.max(0, prev - 1));

      if (blockedUntil && blockedUntil <= Date.now()) {
        localStorage.removeItem(BLOCK_KEY);
        setBlockedUntil(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showOtpInput, timer, blockedUntil, remainingBlockSeconds]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(
        2,
        "0"
      )}:${String(s).padStart(2, "0")}`;
    }

    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const resendText =
    remainingBlockSeconds > 0
      ? "Resend available later"
      : timer > 0
        ? `Resend in ${formatTime(timer)}`
        : isResending
          ? "Resending..."
          : "Resend";

  const handleVerifyNow = () => {
    setShowOtpInput(true);
    setTimer(RESEND_SECONDS);
    setError("");
  };

  const handleVerify = async () => {
    setError("");

    if (!code.trim()) {
      setError("Please enter the verification code.");
      return;
    }

    try {
      await verifyEmail({ email, code }).unwrap();

      sessionStorage.removeItem("verify_email");
      sessionStorage.removeItem("after_verify_redirect");

      router.replace(redirectPath);
    } catch (error: any) {
      setError(error?.data?.message || "Invalid verification code.");
    }
  };

  const handleResend = async () => {
    if (isResendDisabled) return;

    setError("");

    try {
      await resendCode({ email }).unwrap();
      setTimer(RESEND_SECONDS);
      setCode("");
    } catch (error: any) {
      const msg =
        error?.data?.message ||
        error?.data?.error ||
        error?.message ||
        "";

      if (msg.toLowerCase().includes("please wait")) {
        const match = msg.match(/(\d+)/);
        const seconds = match ? Number(match[1]) : 60 * 60;
        const until = Date.now() + seconds * 1000;

        localStorage.setItem(BLOCK_KEY, String(until));
        setBlockedUntil(until);
        setTimer(0);

        return;
      }

      setError(msg || "Failed to resend code.");
    }
  };

  const handleSkip = () => {
    sessionStorage.removeItem("verify_email");
    sessionStorage.removeItem("after_verify_redirect");

    const role = user?.role?.toLowerCase();

    switch (role) {
      case "admin":
        router.replace("/admin/loads");
        break;

      case "superadmin":
      case "super-admin":
      case "super_admin":
        router.replace("/superAdmin/companies");
        break;

      case "manager":
        router.replace("/manager/loads");
        break;

      case "employee":
      case "driver":
      default:
        router.replace("/dispatchers/loads");
        break;
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F6F8FC",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 430,
          bgcolor: "#fff",
          borderRadius: 4,
          p: { xs: 3, sm: 4 },
          textAlign: "center",
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.12)",
        }}
      >
        <Box
          sx={{
            width: 78,
            height: 78,
            mx: "auto",
            mb: 2,
            borderRadius: "50%",
            bgcolor: alpha(primary, 0.12),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography sx={{ fontSize: 38 }}>✉️</Typography>
        </Box>

        <Typography sx={{ fontWeight: 800, fontSize: 26, color: "#0f172a" }}>
          Verify your email
        </Typography>

        <Typography
          sx={{
            mt: 1,
            fontSize: 14,
            color: "rgba(15, 23, 42, 0.6)",
            lineHeight: 1.7,
          }}
        >
          We sent a 6-digit verification code to
          <br />
          <strong>{email}</strong>
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 2, textAlign: "left" }}>
            {error}
          </Alert>
        )}

        {!showOtpInput ? (
          <Button
            fullWidth
            variant="contained"
            onClick={handleVerifyNow}
            sx={{
              mt: 3,
              height: 50,
              borderRadius: 2,
              bgcolor: primary,
              fontWeight: 800,
              textTransform: "none",
              "&:hover": {
                bgcolor: alpha(primary, 0.9),
              },
            }}
          >
            Verify Now
          </Button>
        ) : (
          <>
            <TextField
              fullWidth
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter verification code"
              inputProps={{
                maxLength: 6,
                inputMode: "numeric",
              }}
              sx={{
                mt: 3,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "#fff",
                  height: 56,
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: 2,
                },
                "& input": {
                  textAlign: "center",
                },
              }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={handleVerify}
              disabled={isLoading}
              sx={{
                mt: 2,
                height: 50,
                borderRadius: 2,
                bgcolor: primary,
                fontWeight: 800,
                textTransform: "none",
                "&:hover": {
                  bgcolor: alpha(primary, 0.9),
                },
              }}
            >
              {isLoading ? "Verifying..." : "Verify Email"}
            </Button>

            <Box
              sx={{
                mt: 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography sx={{ fontSize: 13, color: "rgba(15,23,42,0.55)" }}>
                Didn&apos;t receive the code?
              </Typography>

              <Button
                onClick={handleResend}
                disabled={isResendDisabled}
                sx={{
                  p: 0,
                  minWidth: "auto",
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: "none",
                  color: isResendDisabled ? "rgba(15,23,42,0.45)" : primary,
                }}
              >
                {resendText}
              </Button>
            </Box>
          </>
        )}

        <Button
          onClick={handleSkip}
          sx={{
            mt: 2,
            textTransform: "none",
            color: "rgba(15,23,42,0.55)",
            fontWeight: 600,
          }}
        >
          Skip for now
        </Button>
      </Box>
    </Box>
  );
}