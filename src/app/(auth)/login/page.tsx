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
  IoMailOutline,
  IoLockClosedOutline,
  IoLogInOutline,
  IoArrowBack,
  IoCheckmarkCircle,
} from "react-icons/io5";
import {
  Alert,
  alpha,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
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

type ViewMode = "login" | "sent" | "verify" | "reset";

const OTP_LEN = 6;
const RESEND_SECONDS = 120;

const Login = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const theme = useAppSelector((state: RootState) => state.palette);

  // ---------- Login state ----------
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState("");
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

  const [sendResetCode, { isLoading: sendingCode }] =
    useSendResetCodeMutation();
  const [resendResetCode, { isLoading: resendingCode }] =
    useResendResetCodeMutation();
  const [verifyResetCode, { isLoading: verifyingCode }] =
    useVerifyResetCodeMutation();
  const [resetPassword, { isLoading: resettingPassword }] =
    useResetPasswordMutation();

  const isBusy =
    loginLoading ||
    sendingCode ||
    resendingCode ||
    verifyingCode ||
    resettingPassword;

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

  // ---------- resend timer ----------
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
    setErr("");
    const em = email.trim();
    if (!em) {
      toast.error("Please enter your email first.");
      return;
    }

    try {
      await sendResetCode({ email: em }).unwrap();
      toast.success("Verification code sent!");

      setMode("sent");
      setOtp(Array(OTP_LEN).fill(""));
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || "Failed to send reset code";
      setErr(msg);
      toast.error(msg);
    }
  };

  const goToVerify = () => {
    setMode("verify");
    setOtp(Array(OTP_LEN).fill(""));
    // focus first box
    setTimeout(() => otpRefs.current?.[0]?.focus?.(), 50);
  };

  const backToLogin = () => {
    setMode("login");
    setErr("");
    setOtp(Array(OTP_LEN).fill(""));
    setNewPassword("");
    setConfirmNewPassword("");
  };

  // ---------- OTP behavior ----------
  const handleOtpChange = (idx: number, value: string) => {
    const v = value.replace(/\D/g, "").slice(-1); // 1 digit
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
    if (e.key === "ArrowRight" && idx < OTP_LEN - 1)
      otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LEN);
    if (!text) return;
    e.preventDefault();

    const next = Array(OTP_LEN).fill("").map((_, i) => text[i] ?? "");
    setOtp(next);

    const last = Math.min(text.length - 1, OTP_LEN - 1);
    setTimeout(() => otpRefs.current[last]?.focus(), 0);
  };

  const handleResend = async () => {
    const em = email.trim();
    if (!em) return;

    try {
      await resendResetCode({ email: em }).unwrap();
      toast.success("Code resent!");
      setTimer(RESEND_SECONDS);
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || "Failed to resend code";
      toast.error(msg);
    }
  };

  const handleVerify = async () => {
    setErr("");
    const code = otp.join("");
    if (code.length !== OTP_LEN) {
      toast.error("Please enter the 6-digit code.");
      return;
    }

    try {
      await verifyResetCode({ resetCode: code }).unwrap();
      toast.success("Code verified!");
      setMode("reset");
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || "Invalid code";
      setErr(msg);
      toast.error(msg);
    }
  };

  const handleResetPassword = async () => {
    setErr("");
    const em = email.trim();
    if (!em) return;

    if (!newPassword || !confirmNewPassword) {
      toast.error("Please fill password fields.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      await resetPassword({
        email: em,
        newPassword,
        confirmNewPassword,
      }).unwrap();

      toast.success("Password changed successfully!");

      // back to login
      setMode("login");
      setPassword("");
      setOtp(Array(OTP_LEN).fill(""));
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (e: any) {
      const msg =
        e?.data?.message || e?.message || "Failed to reset password";
      setErr(msg);
      toast.error(msg);
    }
  };

  const apiURL = process.env.NEXT_PUBLIC_API_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    try {
      const res = await fetch(`${apiURL}/api/v1/auth/logIn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          // rememberMe, 
        }),
        // credentials: "include", 
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.message || "Email or Password is invalid");
      }

      dispatch(
        loginSuccess({
          user: result.data,
          token: result.token,
        })
      );

      if (result.data.role === "admin") router.push("/admin/loads");
      else if (result.data.role === "super-admin") router.push("/superAdmin/companies");
      else router.push("/dispatchers/loads");
    } catch (error: any) {
      const msg = error?.message || "Email or Password is invalid";
      setErr(msg);
      toast.error(msg);
    }
  };

  const centerShellSx = {
    minHeight: "100vh",
    bgcolor: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    p: 2,
  };

  const smallCardSx = {
    width: "100%",
    maxWidth: 420,
    borderRadius: 3,
    border: `1px solid ${alpha("#000", 0.08)}`,
    // boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
    overflow: "hidden",
    bgcolor: "#fff",
  };

  const otpBoxSx = {
    width: 44,
    height: 44,
    "& .MuiOutlinedInput-root": {
      height: 44,
      borderRadius: 1.5,
      backgroundColor: "#fff",
    },
    "& input": {
      textAlign: "center" as const,
      fontSize: 18,
      fontWeight: 700,
      padding: 0,
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: alpha(theme.currentPalette.primary, 0.35),
    },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.currentPalette.primary,
      borderWidth: 2,
    },
  };

  const primaryBtnSx = {
    mt: 2,
    py: 1.4,
    borderRadius: 2,
    fontWeight: 800,
    bgcolor: theme.currentPalette.primary,
    "&:hover": { bgcolor: alpha(theme.currentPalette.primary, 0.9) },
  };

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

  if (isBusy && mode === "login" && loginLoading) return <Loading />;
  if (mode === "sent") {
    return (
      <Box sx={centerShellSx}>
        <Toaster position="top-center" />
        <Paper sx={smallCardSx}>
          <Box sx={{ p: 3 }}>
            <Button
              onClick={backToLogin}
              startIcon={<IoArrowBack />}
              sx={{ textTransform: "none", mb: 2 }}
            >
              Back to Login
            </Button>

            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  color: theme.currentPalette.primary,
                  fontWeight: 800,
                }}
              >
                <IoCheckmarkCircle />
                <Typography sx={{ fontWeight: 800 }}>
                  Verification Code Sent!
                </Typography>
              </Box>

              <Typography sx={{ mt: 1, color: alpha("#000", 0.6), fontSize: 13 }}>
                A new 6-digit code has been sent to your email.
                <br />
                It may take a few moments to arrive.
                <br />
                Check your spam folder if you donot see it soon.
              </Typography>

              <Typography sx={{ mt: 2, color: alpha("#000", 0.55), fontSize: 12 }}>
                This code expires in 10 minutes
              </Typography>

              <Button
                variant="contained"
                sx={{ ...primaryBtnSx, mt: 3, width: 280 }}
                onClick={goToVerify}
              >
                Continue
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  }

  if (mode === "verify") {
    return (
      <Box sx={centerShellSx}>
        <Toaster position="top-center" />
        <Paper sx={smallCardSx}>
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography sx={{ fontWeight: 800, color: theme.currentPalette.primary }}>
              Verify your email
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 12, color: alpha("#000", 0.55) }}>
              We have sent a 6-digit code to your email.
            </Typography>

            {err && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {err}
              </Alert>
            )}

            <Box
              sx={{
                mt: 3,
                display: "flex",
                justifyContent: "center",
                gap: 1,
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
                  sx={otpBoxSx}
                  inputProps={{ maxLength: 1 }}
                />
              ))}
            </Box>

            <Box
              sx={{
                mt: 1.5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                px: 2,
              }}
            >
              <Typography sx={{ fontSize: 11, color: alpha("#000", 0.55) }}>
                Didn&apos;t receive the code?
              </Typography>

              <Button
                disabled={timer > 0 || resendingCode}
                onClick={handleResend}
                sx={{
                  textTransform: "none",
                  fontSize: 11,
                  color: theme.currentPalette.primary,
                }}
              >
                {timer > 0 ? `Resend code in ${mmss}` : "Resend code"}
              </Button>
            </Box>

            <Button
              variant="contained"
              sx={{ ...primaryBtnSx, width: 320, mt: 2 }}
              onClick={handleVerify}
              disabled={verifyingCode}
            >
              {verifyingCode ? "Verifying..." : "VERIFY"}
            </Button>

            <Button
              onClick={backToLogin}
              sx={{ mt: 1.5, textTransform: "none", fontSize: 12 }}
            >
              Back to Login
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  if (mode === "reset") {
    return (
      <Box sx={centerShellSx}>
        <Toaster position="top-center" />
        <Paper sx={smallCardSx}>
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography sx={{ fontWeight: 900, fontSize: 22, color: "#0f172a" }}>
              Create Your New Password
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 12, color: alpha("#000", 0.55) }}>
              Enter a strong password to secure your account
            </Typography>

            {err && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {err}
              </Alert>
            )}

            <Box sx={{ mt: 3, display: "grid", gap: 2 }}>
              <TextField
                fullWidth
                label="Password"
                placeholder="Enter your password"
                required
                type={showNewPass ? "text" : "password"}
                InputLabelProps={{ shrink: true }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={passwordFieldSx}
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
                placeholder="Enter your password"
                type={showConfirmPass ? "text" : "password"}
                value={confirmNewPassword}
                InputLabelProps={{ shrink: true }}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                sx={passwordFieldSx}
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

              <Button
                variant="contained"
                sx={{ ...primaryBtnSx, width: "100%" }}
                onClick={handleResetPassword}
                disabled={resettingPassword}
              >
                {resettingPassword ? "Changing..." : "Change Password"}
              </Button>

              <Button onClick={backToLogin} sx={{ textTransform: "none" }}>
                Back to Login
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  }

  // =========================
  // LOGIN SCREEN (your original design + remember me + forgot password)
  // =========================
  if (isBusy && (sendingCode || resendingCode || verifyingCode || resettingPassword)) {
    return <Loading />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${alpha(
          theme.currentPalette.background,
          0.8
        )} 0%, ${alpha(theme.currentPalette.background, 0.9)} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Toaster position="top-center" />
      <Container maxWidth="md" sx={{ width: "100%" }}>
        <Paper
          elevation={8}
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            backgroundColor: "background.paper",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          {/* Left Side - Login Form */}
          <Box sx={{ flex: 1, p: { xs: 3, md: 4 } }}>
            <Box sx={{ textAlign: { xs: "center", md: "left" }, mb: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: { xs: "center", md: "flex-start" },
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: "primary.main",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    style={{ width: 24, height: 24, color: "white" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  Styles Dispatch
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Professional Load Management System
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
                  Welcome Back
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sign in to your account
                </Typography>
              </Box>

              {err && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {err}
                </Alert>
              )}

              <Box sx={{ mb: 1 }}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IoMailOutline style={{ color: theme.currentPalette.text }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IoLockClosedOutline style={{ color: theme.currentPalette.text }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                          sx={{ color: "grey.400", "&:hover": { color: "grey.600" } }}
                        >
                          {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Remember me + Forgot */}
              <Box
                sx={{
                  mt: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setRememberMe(checked);
                        if (!checked) clearRememberEmail();
                      }}
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
                  }}
                >
                  Forgot password?
                </Button>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loginLoading}
                startIcon={<IoLogInOutline />}
                sx={{
                  mt: 2,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: "1rem",
                  fontWeight: 700,
                  "&:focus": {
                    outline: "none",
                    boxShadow: `0 0 0 2px ${alpha(theme.currentPalette.primary, 0.5)}`,
                  },
                }}
              >
                {loginLoading ? "Signing In..." : "Sign In"}
              </Button>

              <Box sx={{ textAlign: "center", mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Secure login for authorized personnel only
                </Typography>
              </Box>
            </form>
          </Box>

          {/* Right Side - Info Panel */}
          <Box
            sx={{
              flex: 1,
              background: `linear-gradient(135deg, ${theme.currentPalette.primary} 0%, ${theme.currentPalette.primary} 100%)`,
              p: { xs: 3, md: 4 },
              color: "white",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Box sx={{ position: "relative", zIndex: 10 }}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Efficient Dispatch Management
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "primary.100", mb: 3, lineHeight: 1.6 }}
              >
                Streamline your logistics operations with our professional dispatch services platform. Manage loads, track shipments, and optimize your workflow.
              </Typography>

              {["Real-time load tracking", "Driver performance analytics", "Automated reporting"].map(
                (feature, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: alpha("#fff", 0.2),
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        my: 0.5,
                      }}
                    >
                      <svg
                        style={{ width: 16, height: 16, color: "white" }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </Box>
                    <Typography variant="body2" sx={{ color: "primary.50" }}>
                      {feature}
                    </Typography>
                  </Box>
                )
              )}
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;