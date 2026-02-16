"use client";
import Loading from "@/components/ui/Loading";
import { loginSuccess } from "@/redux/slices/authSlice";
import { RootState, useAppDispatch, useAppSelector } from "@/redux/store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {
  IoMailOutline,
  IoLockClosedOutline,
  IoLogInOutline,
} from "react-icons/io5";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  alpha,
} from "@mui/material";

const Login = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const theme = useAppSelector((state: RootState) => state.palette);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const apiURL = process.env.NEXT_PUBLIC_API_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr("");

    try {
      const res = await fetch(`${apiURL}/api/v1/auth/logIn`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Email or Password is invalid");
      }

      dispatch(
        loginSuccess({
          user: result.data,
          token: result.token,
        })
      );

      if (result.data.role === "admin") {
        router.push("/admin/loads");
      } 
      else if (result.data.role === "super-admin"){
        router.push("/superAdmin/companies");
      }
      else {
        router.push(`/dispatchers/loads`);
      }
    } catch (error) {
      if (error instanceof Error) {
        setErr(error.message || "Loading Failed");
        toast.error(error.message || "Email or Password is invaild", {
          style: { background: "#dc2626", color: "#fff" },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

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
      <Container maxWidth="md" sx={{ width: "100%" }}>
        <Paper
          elevation={8}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            backgroundColor: "background.paper",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          {/* Left Side - Login Form */}
          <Box
            sx={{
              flex: 1,
              p: { xs: 3, md: 4 },
            }}
          >
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
                <Typography
                  variant="h5"
                  fontWeight="semibold"
                  color="text.primary"
                  gutterBottom
                >
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

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IoMailOutline
                            style={{ color: theme.currentPalette.text }}
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                  placeholder="Enter your email"
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IoLockClosedOutline
                            style={{ color: theme.currentPalette.text }}
                          />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword((prev) => !prev)}
                            edge="end"
                            sx={{
                              color: "grey.400",
                              "&:hover": { color: "grey.600" },
                            }}
                          >
                            {showPassword ? (
                              <FaEyeSlash size={18} />
                            ) : (
                              <FaEye size={18} />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                  placeholder="Enter your password"
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                startIcon={<IoLogInOutline />}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: "1rem",
                  fontWeight: "medium",
                  "&:focus": {
                    outline: "none",
                    boxShadow: `0 0 0 2px ${alpha(
                      theme.currentPalette.primary,
                      0.5
                    )}`,
                  },
                }}
              >
                {loading ? "Signing In..." : "Sign In"}
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
                sx={{
                  color: "primary.100",
                  mb: 3,
                  lineHeight: 1.6,
                }}
              >
                Streamline your logistics operations with our professional
                dispatch services platform. Manage loads, track shipments, and
                optimize your workflow.
              </Typography>

              {[
                "Real-time load tracking",
                "Driver performance analytics",
                "Automated reporting",
              ].map((feature, i) => (
                <Box
                  key={i}
                  sx={{ display: "flex", alignItems: "center", gap: 2 }}
                >
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
              ))}
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
