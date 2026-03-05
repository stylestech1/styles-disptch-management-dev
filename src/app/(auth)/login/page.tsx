/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Loading from "@/components/ui/Loading";
import { loginSuccess } from "@/redux/slices/authSlice";
import { RootState, useAppDispatch, useAppSelector } from "@/redux/store";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import {
  Alert,
  alpha,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import {
  useSendResetCodeMutation,
  useResendResetCodeMutation,
  useVerifyResetCodeMutation,
  useResetPasswordMutation,
  useLogInMutation,
} from "@/redux/slices/apiSlice";

type ViewMode = "login" | "verify" | "reset" | "success";

const OTP_LEN = 6;
const RESEND_SECONDS = 120;

const SuccessCheckSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: "100%", height: "100%", display: "block" }}>
    <path
      fill="#5390DF"
      d="M19.96 8.52c.02-.17.04-.35.04-.52c0-2.38-2.14-4.29-4.52-3.96C14.79 2.81 13.47 2 12 2s-2.79.8-3.48 2.04C6.14 3.72 4 5.63 4 8c0 .17.01.35.04.52C2.81 9.21 2 10.53 2 12s.8 2.79 2.04 3.48c-.02.17-.04.35-.04.52c0 2.38 2.14 4.29 4.52 3.96C9.21 21.19 10.53 22 12 22s2.79-.8 3.48-2.04C17.86 20.28 20 18.37 20 16c0-.17-.01-.35-.04-.52C21.19 14.79 22 13.47 22 12s-.8-2.79-2.04-3.48m-8.97 6.89l-2.7-2.7L9.7 11.3l1.3 1.3l3.33-3.3l1.41 1.42l-4.75 4.7Z"
    />
  </svg>
);

const Login = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const theme = useAppSelector((state: RootState) => state.palette);

  // ---------- Login state ----------
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  type FieldErrors = Partial<{
    email: string;
    password: string;
    otp: string;
    newPassword: string;
    confirmNewPassword: string;
    form: string; // general (optional)
  }>;

  const [errors, setErrors] = useState<FieldErrors>({});
  const clearErrors = () => setErrors({});

  const setFieldError = (key: keyof FieldErrors, msg: string) =>
    setErrors((p) => ({ ...p, [key]: msg }));

  const clearFieldError = (key: keyof FieldErrors) =>
    setErrors((p) => {
      const next = { ...p };
      delete next[key];
      return next;
    });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // ---------- Forgot flow ----------
  const [mode, setMode] = useState<ViewMode>("login");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(""));
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [timer, setTimer] = useState(RESEND_SECONDS);

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // ---------- RTK mutations ----------
  const [login, { isLoading: loginLoading }] = useLogInMutation();
  const MSG_INVALID_CODE = "Invalid code. Please check your email and try again.";
  const MSG_SESSION_EXPIRED = "Session expired. Please click 'Resend code' for new OTP.";

  const [sendResetCode, { isLoading: sendingCode }] = useSendResetCodeMutation();
  const [resendResetCode, { isLoading: resendingCode }] = useResendResetCodeMutation();
  const [verifyResetCode, { isLoading: verifyingCode }] = useVerifyResetCodeMutation();
  const [resetPassword, { isLoading: resettingPassword }] = useResetPasswordMutation();

  const isBusy = loginLoading || sendingCode || resendingCode || verifyingCode || resettingPassword;

  useEffect(() => {
    const saved = localStorage.getItem("remember_email");
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (!rememberMe) return;
    if (email?.trim()) localStorage.setItem("remember_email", email.trim());
  }, [email, rememberMe]);

  const clearRememberEmail = () => {
    localStorage.removeItem("remember_email");
  };

  useEffect(() => {
    if (mode !== "verify") return;
    setTimer(RESEND_SECONDS);
  }, [mode]);

  useEffect(() => {
    if (mode !== "verify") return;
    if (timer <= 0) return;

    const t = setInterval(() => setTimer((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [mode, timer]);

  const mmss = useMemo(() => {
    const m = Math.floor(timer / 60);
    const s = timer % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(m)}:${pad(s)}`;
  }, [timer]);

  const openForgotPassword = async () => {
    clearErrors();
    const em = email.trim();

    if (!em) {
      setFieldError("email", "Please enter your email first.");
      return;
    }

    try {
      await sendResetCode({ email: em }).unwrap();
      setMode("verify");
      setOtp(Array(OTP_LEN).fill(""));
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => otpRefs.current?.[0]?.focus?.(), 50);
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || "Failed to send reset code";
      setFieldError("email", msg);
    }
  };

  const backToLogin = () => {
    setMode("login");
    clearErrors();
    setOtp(Array(OTP_LEN).fill(""));
    setNewPassword("");
    setConfirmNewPassword("");
  };

  // ---------- OTP behavior ----------
  const handleOtpChange = (idx: number, value: string) => {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = v;
    setOtp(next);

    if (v && idx < OTP_LEN - 1) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (otp[idx]) {
        const next = [...otp];
        next[idx] = "";
        setOtp(next);
        return;
      }
      if (idx > 0) otpRefs.current[idx - 1]?.focus();
    }

    if (e.key === "ArrowLeft" && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < OTP_LEN - 1) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LEN);
    if (!text) return;
    e.preventDefault();

    const next = Array(OTP_LEN)
      .fill("")
      .map((_, i) => text[i] ?? "");
    setOtp(next);

    const last = Math.min(text.length - 1, OTP_LEN - 1);
    setTimeout(() => otpRefs.current[last]?.focus(), 0);
  };

  const handleResend = async () => {
    const em = email.trim();
    if (!em) return;

    try {
      await resendResetCode({ email: em }).unwrap();
      // toast.success("Code resent!");
      setTimer(RESEND_SECONDS);
      clearErrors();
      setOtp(Array(OTP_LEN).fill(""));
      setTimeout(() => otpRefs.current?.[0]?.focus?.(), 50);
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || "Failed to resend code";
      // toast.error(msg);
    }
  };

  const handleVerify = async () => {
    clearErrors();

    const code = otp.join("");
    if (code.length !== OTP_LEN) {
      setFieldError("otp", "Please enter the 6-digit code.");
      return;
    }

    if (timer <= 0) {
      setFieldError("otp", MSG_SESSION_EXPIRED);
      return;
    }

    try {
      await verifyResetCode({ resetCode: code }).unwrap();
      setMode("reset");
    } catch (e: any) {
      const status = e?.status;
      const backendMsg = e?.data?.message || e?.data?.error || e?.message || "";

      if (status === 401) {
        setFieldError("otp", MSG_INVALID_CODE);
        return;
      }
      if (status === 410 || status === 408) {
        setFieldError("otp", MSG_SESSION_EXPIRED);
        return;
      }

      setFieldError("otp", backendMsg || MSG_INVALID_CODE);
    }
  };

  const handleResetPassword = async () => {
    clearErrors();

    const em = email.trim();
    if (!em) return;

    if (!newPassword) setFieldError("newPassword", "Password is required.");
    if (!confirmNewPassword) setFieldError("confirmNewPassword", "Confirm password is required.");
    if (!newPassword || !confirmNewPassword) return;

    if (newPassword !== confirmNewPassword) {
      setFieldError("confirmNewPassword", "Passwords doesn't match.");
      return;
    }

    try {
      await resetPassword({ email: em, newPassword, confirmNewPassword }).unwrap();

      setMode("success");
      setPassword("");
      setOtp(Array(OTP_LEN).fill(""));
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (e: any) {
      const msg = "Failed to reset password";
      setFieldError("form", msg);
    }
  };

  const apiURL = process.env.NEXT_PUBLIC_API_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const em = email.trim();

    if (!em) {
      setFieldError("email", "Email is required.");
    }
    if (!password) {
      setFieldError("password", "Password is required.");
    }
    if (!em || !password) return;

    try {
      const res = await fetch(`${apiURL}/api/v1/auth/logIn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, password }),
      });

      const result = await res.json();

      if (!res.ok) {
        const msg = result?.message || "Email or Password is invalid";
        setFieldError("password", msg);
        return;
      }

      dispatch(loginSuccess({ user: result.data, token: result.token }));

      if (result.data.role === "admin") router.push("/admin/loads");
      else if (result.data.role === "super-admin") router.push("/superAdmin/companies");
      else router.push("/dispatchers/loads");
    } catch (error: any) {
      const msg = error?.message || "Something went wrong";
      setFieldError("form", msg);
    }
  };
  const OTP_SIZE = 54;         
  const OTP_GAP = 12;
  const OTP_ROW_W = OTP_SIZE * OTP_LEN + OTP_GAP * (OTP_LEN - 1);

  const passwordFieldSx = {
    "& .MuiFormLabel-asterisk": { color: "red" },
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      backgroundColor: "#fff",
      height: 64,
      "& input": {
        fontSize: 14,
        py: 0,
      },
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(0,0,0,0.20)",
    },
    "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.currentPalette.primary,
      borderWidth: 2,
    },
    "& .MuiInputLabel-root": {
      color: "rgba(0,0,0,0.60)",
      fontWeight: 600,
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: theme.currentPalette.primary,
    },
  };

  const pageSx = {
    minHeight: "100vh",
    bgcolor: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    px: 2,
    pt: 4,
  };

  const formWrapSx = {
    width: "100%",
    maxWidth: 440,
    textAlign: "center",
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      backgroundColor: "transparent",
      "& fieldset": {
        borderColor: "rgba(0,0,0,0.16)",
      },
      "&:hover fieldset": {
        borderColor: "rgba(0,0,0,0.28)",
      },
      "&.Mui-focused fieldset": {
        borderColor: theme.currentPalette.primary,
        borderWidth: 2,
      },
    },
    "& .MuiInputLabel-root": {
      color: "rgba(0,0,0,0.55)",
      fontWeight: 600,
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: theme.currentPalette.primary,
    },
    "& .MuiFormLabel-asterisk": { color: "red" },
  };

  const titleSx = {
    fontWeight: 800,
    color: theme.currentPalette.primary,
    fontSize: 34,
    lineHeight: 1.1,
  };

  const subTitleSx = {
    mt: 1,
    color: "rgba(0,0,0,0.55)",
    fontSize: 13,
  };

  const btnSx = {
    mt: 2,
    py: 1.4,
    borderRadius: 2,
    fontWeight: 800,
    bgcolor: theme.currentPalette.primary,
    "&:hover": { bgcolor: alpha(theme.currentPalette.primary, 0.9) },
  };

  if (isBusy && mode === "login" && loginLoading) return <Loading />;
  if (isBusy && (sendingCode || resendingCode || verifyingCode || resettingPassword)) return <Loading />;

  if (mode === "success") {
    return (
      <Box sx={pageSx}>
        {/* <Toaster position="top-center" /> */}

        <Box sx={{ width: "100%", maxWidth: 520, textAlign: "center" }}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
            <Box sx={{ width: 80, height: 80 }}>
              <SuccessCheckSvg />
            </Box>
          </Box>

          <Typography sx={{ fontWeight: 500, fontSize: 24, color: "#0f172a" }}>
            Password reset
          </Typography>

          <Typography sx={{ mt: 0.75, fontSize: 16, color: "rgba(0,0,0,0.55)" }}>
            Your password has been successfully reset.
            <br />
            Click below to log in magically.
          </Typography>

          <Button
            variant="contained"
            sx={{
              mt: 3,
              width: "100%",
              maxWidth: 314,
              py: 1.25,
              borderRadius: 2,
              fontWeight: 400,
              bgcolor: theme.currentPalette.primary,
              "&:hover": { bgcolor: alpha(theme.currentPalette.primary, 0.9) },
              textTransform: "none !important",
              "&.MuiButton-root": { textTransform: "none !important" },
            }}
            onClick={backToLogin}
          >
            Back to Login
          </Button>

          {/* <Box sx={{ mt: 8, textAlign: "center" }}>
              <Typography sx={{ fontSize: 12, color: theme.currentPalette.primary }}>
                © 2026 Styles Trucking. All rights reserved.
              </Typography>
            </Box> */}
        </Box>
      </Box>
    );
  }

  if (mode === "verify") {
    const OTP_SIZE = 54; 
    const OTP_GAP = 12;
    const OTP_ROW_W = OTP_SIZE * OTP_LEN + OTP_GAP * (OTP_LEN - 1);

    const otpBoxSx = (hasOtpError: boolean) => ({
      width: OTP_SIZE,
      height: OTP_SIZE,

      "& .MuiOutlinedInput-root": {
        height: OTP_SIZE,
        borderRadius: 2,
        backgroundColor: "#fff",
      },

      "& input": {
        textAlign: "center" as const,
        fontSize: 26,
        fontWeight: 900,
        padding: 0,
      },

      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: hasOtpError ? "rgba(220, 38, 38, 0.55)" : "rgba(0,0,0,0.20)",
      },

      "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: hasOtpError ? "rgba(220, 38, 38, 0.75)" : "rgba(0,0,0,0.28)",
      },

      "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: hasOtpError ? "rgb(220, 38, 38)" : theme.currentPalette.primary,
        borderWidth: 2,
      },
    });

    const ErrorBanner = ({ text }: { text: string }) => {
      return (
        <Box
          sx={{
            mt: 2,
            width: OTP_ROW_W,
            mx: "auto",
            px: 2,
            py: 1.5,
            borderRadius: 2,
            border: "1px solid rgba(220, 38, 38, 0.35)",
            bgcolor: "rgba(239, 68, 68, 0.08)",
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            textAlign: "left",
          }}
        >
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              border: "2px solid #B42318",
              color: "#B42318",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </Box>

          <Typography sx={{ fontSize: 13, color: "rgb(185, 28, 28)", lineHeight: 1.3 }}>
            {text}
          </Typography>
        </Box>
      );
    };

    return (
      <Box sx={pageSx}>
        <Box sx={{ width: "100%", maxWidth: 389, textAlign: "center" }}>
          {/* Icon */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <Box sx={{ width: 80, height: 80 }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 14 14"
                style={{ width: "100%", height: "100%", display: "block" }}
              >
                <g fill="none">
                  <path
                    fill="#205DAC"
                    fillRule="evenodd"
                    d="M4.411.52a40 40 0 0 1 5.053 0a2.4 2.4 0 0 1 2.244 2.269c.04.734.066 1.457.076 2.178L7.5 8.13a.985.985 0 0 1-1.145-.001l-4.263-3.17q.015-1.074.075-2.17A2.4 2.4 0 0 1 4.41.52Z"
                    clipRule="evenodd"
                  />
                  <path
                    fill="#A9C7EF"
                    d="M.981 5.69L5.61 9.13c.771.574 1.86.575 2.633.005L12.9 5.697c.141.198.24.424.283.671c.138.798.203 1.622.203 2.762s-.065 1.964-.203 2.762c-.138.79-.845 1.371-1.692 1.462c-1.465.157-2.987.275-4.552.275s-3.087-.118-4.553-.275c-.846-.09-1.553-.672-1.691-1.462c-.14-.797-.204-1.622-.204-2.762s.064-1.964.203-2.762a1.6 1.6 0 0 1 .287-.677Z"
                  />
                  <path
                    fill="#A9C7EF"
                    fillRule="evenodd"
                    d="M4.872 5.29c0-.345.28-.625.625-.625h2.88a.625.625 0 0 1 0 1.25h-2.88a.625.625 0 0 1-.625-.625m0-2.617c0-.345.28-.625.625-.625h2.88a.625.625 0 0 1 0 1.25h-2.88a.625.625 0 0 1-.625-.625"
                    clipRule="evenodd"
                  />
                </g>
              </svg>
            </Box>
          </Box>

          <Typography sx={{ fontWeight: 900, fontSize: 20, color: "#0f172a" }}>
            Verify your email
          </Typography>

          <Box sx={{ width: OTP_ROW_W, mx: "auto" }}>
            <Typography
              sx={{
                mt: 0.5,
                fontSize: 12,
                color: "rgba(0,0,0,0.55)",
                textAlign: "center",
              }}
            >
              We&apos;ve sent a 6-digit code to your email.
            </Typography>

            {errors.otp && <ErrorBanner text={errors.otp} />}

            {/* OTP */}
            <Box
              sx={{
                mt: 2.5,
                display: "flex",
                justifyContent: "center",
                gap: `${OTP_GAP}px`,
              }}
              onPaste={handleOtpPaste}
            >
              {Array.from({ length: OTP_LEN }).map((_, i) => (
                <TextField
                  key={i}
                  value={otp[i]}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  inputRef={(el) => (otpRefs.current[i] = el)}
                  sx={otpBoxSx(!!errors.otp)}
                  inputProps={{ maxLength: 1, inputMode: "numeric" }}
                />
              ))}
            </Box>

            {/* Resend */}
            <Box
              sx={{
                mt: 1.5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography sx={{ fontSize: 12, color: "rgba(0,0,0,0.55)" }}>
                Didn&apos;t receive the code?
              </Typography>

              <Button
                disabled={timer > 0 || resendingCode}
                onClick={handleResend}
                sx={{
                  textTransform: "none",
                  fontSize: 12,
                  color: timer > 0 ? "rgba(0,0,0,0.45)" : theme.currentPalette.primary,
                  fontWeight: 700,
                  p: 0,
                  minWidth: "auto",
                }}
              >
                {timer > 0 ? `Resend code in ${mmss}` : "Resend code"}
              </Button>
            </Box>
          </Box>

          <Button
            variant="contained"
            sx={{ ...btnSx, width: "100%", mt: 2 }}
            onClick={handleVerify}
            disabled={verifyingCode}
          >
            {verifyingCode ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <span>Verifying</span>
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.45)",
                    borderTopColor: "#fff",
                    animation: "spin 0.8s linear infinite",
                    "@keyframes spin": {
                      from: { transform: "rotate(0deg)" },
                      to: { transform: "rotate(360deg)" },
                    },
                  }}
                />
              </Box>
            ) : (
              "VERIFY"
            )}
          </Button>

          <Button
            onClick={backToLogin}
            sx={{
              mt: 2,
              textTransform: "none",
              fontSize: 12,
              color: theme.currentPalette.primary,
            }}
          >
            Back to Login
          </Button>
        </Box>
      </Box>
    );
  }

  if (mode === "reset") {
    return (
      <Box sx={pageSx}>
        <Toaster position="top-center" />

        <Box sx={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
          {/* icon */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
            <Box sx={{ width: 60, height: 60, bgcolor: theme.currentPalette.primary, borderRadius: 2 }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="100"
                height="100"
                preserveAspectRatio="xMidYMid meet"
                style={{ width: "100%", height: "100%", display: "block" }}
                aria-hidden="true"
                focusable="false"
              >
                <g fill="none">
                  <path
                    fill={theme.currentPalette.primary}
                    d="M2 12c0-4.714 0-7.071 1.464-8.536C4.93 2 7.286 2 12 2s7.071 0 8.535 1.464C22 4.93 22 7.286 22 12s0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12"
                    opacity="0.5"
                  />
                  <path
                    fill="#D4E3F7"
                    fillRule="evenodd"
                    d="M18 9.776a3.784 3.784 0 0 1-3.792 3.776c-.382 0-1.252-.088-1.675-.439l-.529.527c-.311.31-.227.401-.089.551c.058.063.125.136.177.24c0 0 .441.614 0 1.229c-.264.351-1.005.843-1.851 0l-.177.175s.53.615.088 1.23c-.264.351-.97.702-1.587.088l-.617.614c-.423.422-.94.176-1.146 0l-.53-.527c-.493-.491-.205-1.024 0-1.229l4.586-4.566s-.441-.703-.441-1.669A3.784 3.784 0 0 1 14.208 6A3.784 3.784 0 0 1 18 9.776m-3.792 1.317c.73 0 1.323-.59 1.323-1.317a1.32 1.32 0 0 0-1.323-1.317c-.73 0-1.322.59-1.322 1.317a1.32 1.32 0 0 0 1.322 1.317"
                    clipRule="evenodd"
                  />
                </g>
              </svg>
            </Box>
          </Box>

          <Typography sx={{ fontWeight: 500, fontSize: 24, color: "#0f172a", mt: 0 }}>Set new password</Typography>

          <Typography sx={{ mt: 0.5, fontSize: 14, color: "rgba(0,0,0,0.55)" }}>
            Enter a strong password to secure your account
          </Typography>
          {errors.form && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.form}
            </Alert>
          )}

          <Box sx={{ mt: 2, display: "grid", gap: 2, textAlign: "left" }}>
            <TextField
              fullWidth
              label="Password"
              required
              type={showNewPass ? "text" : "password"}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errors.newPassword) clearFieldError("newPassword");
                if (errors.confirmNewPassword) clearFieldError("confirmNewPassword");
              }}
              error={!!errors.newPassword}
              helperText={errors.newPassword}
              sx={passwordFieldSx}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNewPass((p) => !p)} size="small">
                      {showNewPass ? <FaEyeSlash /> : <FaEye />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              required
              type={showConfirmPass ? "text" : "password"}
              value={confirmNewPassword}
              onChange={(e) => {
                setConfirmNewPassword(e.target.value);
                if (errors.confirmNewPassword) clearFieldError("confirmNewPassword");
              }}
              error={!!errors.confirmNewPassword}
              helperText={errors.confirmNewPassword}
              sx={passwordFieldSx}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPass((p) => !p)} size="small">
                      {showConfirmPass ? <FaEyeSlash /> : <FaEye />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ mt: 2.5, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.25 }}>
            <Button
              variant="contained"
              onClick={handleResetPassword}
              disabled={resettingPassword}
              sx={{
                width: "100%",
                maxWidth: 420,
                py: 1.4,
                borderRadius: 2,
                bgcolor: theme.currentPalette.primary,
                "&:hover": { bgcolor: alpha(theme.currentPalette.primary, 0.9) },
              }}
            >
              {resettingPassword ? "Changing..." : "CHANGE PASSWORD"}
            </Button>

            <Button
              onClick={backToLogin}
              sx={{
                textTransform: "none",
                fontSize: 12,
                color: theme.currentPalette.primary,
                p: 0,
                mt: 1,
                minWidth: "auto",
              }}
            >
              Back to Login
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#fff",
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
      }}
    >
      <Toaster position="top-center" />

      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
        }}
      >
        <Box sx={formWrapSx}>
          <Typography sx={titleSx}>Styles Trucking</Typography>
          <Typography sx={subTitleSx}>Professional Load Management System</Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4, textAlign: "left" }}>
            {errors.form && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.form}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) clearFieldError("email");
                if (errors.form) clearFieldError("form");
              }}
              required
              placeholder="e.g. test@gmail.com"
              InputLabelProps={{ shrink: true }}
              sx={fieldSx}
              error={!!errors.email}
              helperText={errors.email}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) clearFieldError("password");
                if (errors.form) clearFieldError("form");
              }}
              required
              placeholder="Enter your password"
              InputLabelProps={{ shrink: true }}
              sx={{ ...fieldSx, mt: 2 }}
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((p) => !p)}
                      edge="end"
                      sx={{ color: "rgba(0,0,0,0.45)" }}
                    >
                      {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ mt: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setRememberMe(checked);
                      if (!checked) clearRememberEmail();
                    }}
                    size="small"
                  />
                }
                label={<Typography sx={{ fontSize: 13 }}>Remember me</Typography>}
              />

              <Button
                onClick={openForgotPassword}
                sx={{
                  textTransform: "none",
                  fontSize: 13,
                  color: theme.currentPalette.primary,
                  fontWeight: 600,
                  p: 0,
                  minWidth: "auto",
                }}
              >
                Forgot password?
              </Button>
            </Box>

            <Button type="submit" fullWidth variant="contained" disabled={loginLoading} sx={btnSx}>
              {loginLoading ? "Signing In..." : "SIGN IN"}
            </Button>
          </Box>
        </Box>
      </Box>

      <Box sx={{ textAlign: "center", pb: 2 }}>
        <Typography sx={{ fontSize: 12, color: theme.currentPalette.primary }}>
          © 2026 Styles Trucking. All rights reserved.
        </Typography>
      </Box>
    </Box>


  );
};

export default Login;