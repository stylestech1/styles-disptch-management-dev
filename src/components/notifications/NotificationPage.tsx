"use client";
import useError from "@/hook/useError";
import {
  useGetAllNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkSpecificAsReadMutation,
} from "@/redux/slices/apiSlice";
import { setLoading } from "@/redux/slices/uiSlice";
import { RootState, useAppSelector } from "@/redux/store";
import { getErrorMessage } from "@/utils/getErrorMessage";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Loading from "../ui/Loading";
import {
  Box,
  Card,
  Typography,
  Button,
  IconButton,
  Chip,
  Divider,
  Stack,
  Paper,
  alpha,
  List,
  ListItem,
  Badge,
  Tooltip,
  Fade,
} from "@mui/material";
import {
  MarkEmailRead,
  Refresh,
  NotificationsActive,
  NotificationsOff,
  SettingsRounded,
  LocalShippingRounded,
  AirportShuttleRounded,
  PersonPinRounded,
  BadgeRounded,
} from "@mui/icons-material";
import HandymanIcon from "@mui/icons-material/Handyman";
import {
  TNotification,
  TNotificationsResponse,
} from "../../types/notificationType";
import Pagination from "../ui/Pagination";
import TextsmsIcon from '@mui/icons-material/Textsms';


const NotificationPage = () => {
  const { error, setError } = useError();
  const [page, setPage] = useState(1);
  const theme = useAppSelector((state: RootState) => state.palette);

  // API Queries
  const {
    data: notifyData,
    isLoading: notifyLoading,
    error: notifyError,
    refetch: refetchNotify,
  } = useGetAllNotificationsQuery(
    { page, limit: 10 },
    {
      refetchOnFocus: false,
      refetchOnReconnect: false,
      // refetchOnMountOrArgChange: false,
    }
  );

  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [markSpecificAsRead] = useMarkSpecificAsReadMutation();

  const notifications: TNotification[] =
    (notifyData as TNotificationsResponse)?.data || [];

  const pagination = notifyData?.paginationResult || null;

  // handling Loading
  useEffect(() => {
    setLoading(notifyLoading && !notifyData);
  }, [notifyLoading, notifyData]);

  // handling Errors
  useEffect(() => {
    const currentError = notifyError;
    if (currentError) {
      const errorMessage = getErrorMessage(currentError);
      setError(errorMessage);
      toast.error(errorMessage || "Failed to load notifications ❌", {
        style: {
          background: "#dc2626",
          color: "#fff",
          borderRadius: "8px",
          fontSize: "14px",
        },
        duration: 4000,
      });
    }
  }, [notifyError, setError]);

  // handling Marking All as Read
  const handleMarkAllAsRead = async (): Promise<void> => {
    try {
      await markAllAsRead(null).unwrap();
      toast.success("All notifications marked as read ✅", {
        style: {
          borderColor: theme.currentPalette.primary,
          color: theme.currentPalette.primary,
          borderRadius: "8px",
        },
      });
    } catch {
      toast.error("Failed to mark all as read ❌");
    }
  };

  // handling Marking as Read
  const handleMarkAsRead = async (id: string): Promise<void> => {
    try {
      await markSpecificAsRead(id).unwrap();
      toast.success("Notification marked as read", {
        style: {
          borderColor: theme.currentPalette.primary,
          color: theme.currentPalette.primary,
          borderRadius: "8px",
        },
      });
    } catch {
      toast.error("Failed to mark as read ❌");
    }
  };

  // Handling Refresh
  const handleRefresh = (): void => {
    refetchNotify();
    toast.success("Notifications refreshed 🔄", {
      style: {
        background: theme.currentPalette.primary,
        color: "#fff",
        borderRadius: "8px",
      },
    });
  };

  // Calculate unread count with proper typing
  const unreadCount = notifications.filter(
    (n: TNotification) => n.status === "unread"
  ).length;

  // Loading state
  const isInitialLoading = notifyLoading && !notifyData;
  if (isInitialLoading) return <Loading />;

  const icons = {
    system: <SettingsRounded sx={{ fontSize: 24 }} />,
    loads: <LocalShippingRounded sx={{ fontSize: 24 }} />,
    trucks: <AirportShuttleRounded sx={{ fontSize: 24 }} />,
    drivers: <PersonPinRounded sx={{ fontSize: 24 }} />,
    identity: <BadgeRounded sx={{ fontSize: 24 }} />,
    maintenance: <HandymanIcon sx={{ fontSize: 24 }} />,
    chat: <TextsmsIcon sx={{ fontSize: 24 }} />,
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
      {/* Header Section */}
      <Paper
        elevation={1}
        sx={{
          p: 3,
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Badge
              badgeContent={unreadCount}
              color="error"
              sx={{
                "& .MuiBadge-badge": {
                  fontSize: "0.7rem",
                  height: "20px",
                  minWidth: "20px",
                },
              }}
            >
              <NotificationsActive
                sx={{
                  fontSize: 32,
                  color: theme.currentPalette.primary,
                }}
              />
            </Badge>
            <Box>
              <Typography
                variant="h4"
                component="h1"
                fontWeight="bold"
                sx={{ color: theme.currentPalette.text }}
              >
                Notifications
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: alpha(theme.currentPalette.text, 0.7) }}
              >
                Manage your notifications and stay updated
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            <Tooltip title="Refresh notifications">
              <IconButton
                onClick={handleRefresh}
                sx={{
                  color: theme.currentPalette.primary,
                  backgroundColor: alpha(theme.currentPalette.primary, 0.1),
                  "&:hover": {
                    backgroundColor: alpha(theme.currentPalette.primary, 0.2),
                  },
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>

            <Tooltip title="Mark all as read">
              <Button
                startIcon={<MarkEmailRead />}
                onClick={handleMarkAllAsRead}
                variant="outlined"
                disabled={unreadCount === 0}
                sx={{
                  color: theme.currentPalette.primary,
                  borderColor: alpha(theme.currentPalette.primary, 0.5),
                  "&:hover": {
                    borderColor: theme.currentPalette.primary,
                    backgroundColor: alpha(theme.currentPalette.primary, 0.1),
                  },
                  "&:disabled": {
                    color: alpha(theme.currentPalette.text, 0.3),
                    borderColor: alpha(theme.currentPalette.text, 0.2),
                  },
                }}
              >
                Mark All Read
              </Button>
            </Tooltip>
          </Stack>
        </Box>
      </Paper>

      {/* Notifications List */}
      <Card
        elevation={2}
        sx={{
          border: `1px solid ${alpha(theme.currentPalette.text, 0.1)}`,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {notifications.length === 0 ? (
          <Box
            sx={{
              p: 6,
              textAlign: "center",
              color: alpha(theme.currentPalette.text, 0.5),
            }}
          >
            <NotificationsOff sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" gutterBottom>
              No notifications
            </Typography>
            <Typography variant="body2">
              You are all caught up! New notifications will appear here.
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification: TNotification, index: number) => (
              <Fade in timeout={300} key={notification.id}>
                <Box>
                  <ListItem
                    sx={{
                      p: 3,
                      backgroundColor:
                        notification.status === "unread"
                          ? alpha(theme.currentPalette.primary, 0.04)
                          : "transparent",
                      borderLeft:
                        notification.status === "unread"
                          ? `4px solid ${theme.currentPalette.primary}`
                          : "4px solid transparent",
                      "&:hover": {
                        backgroundColor:
                          notification.status === "unread"
                            ? alpha(theme.currentPalette.primary, 0.08)
                            : alpha(theme.currentPalette.background, 0.5),
                      },
                      transition: "all 0.2s ease-in-out",
                    }}
                    secondaryAction={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={notification.status}
                          size="small"
                          color={
                            notification.status === "unread"
                              ? "primary"
                              : "default"
                          }
                          variant={
                            notification.status === "unread"
                              ? "filled"
                              : "outlined"
                          }
                        />
                        {notification.status === "unread" && (
                          <Tooltip title="Mark as read">
                            <IconButton
                              onClick={() => handleMarkAsRead(notification.id)}
                              size="small"
                              sx={{
                                color: theme.currentPalette.primary,
                                "&:hover": {
                                  backgroundColor: alpha(
                                    theme.currentPalette.primary,
                                    0.1
                                  ),
                                },
                              }}
                            >
                              <MarkEmailRead fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    }
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: alpha(theme.currentPalette.primary, 0.1),
                          color: theme.currentPalette.primary,
                        }}
                      >
                        {icons[notification.module]}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h6"
                          component="div"
                          sx={{
                            fontWeight:
                              notification.status === "unread" ? 600 : 400,
                            color: theme.currentPalette.text,
                            mb: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          {notification.title}
                          <Chip
                            label={notification.module}
                            variant="outlined"
                            size="small"
                          />
                          <Chip
                            label={notification.importance}
                            variant="outlined"
                            size="small"
                          />
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: alpha(theme.currentPalette.text, 0.7),
                            mb: 1,
                            lineHeight: 1.5,
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: alpha(theme.currentPalette.text, 0.5),
                          }}
                        >
                          {new Date(
                            notification.createdAt
                          ).toLocaleDateString()}{" "}
                          •
                          {new Date(
                            notification.createdAt
                          ).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                  {index < notifications.length - 1 && (
                    <Divider variant="inset" component="li" />
                  )}
                </Box>
              </Fade>
            ))}
          </List>
        )}
      </Card>

      {/* Pagination */}
      {pagination && notifications.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Pagination
            pagination={pagination}
            page={page}
            setPage={setPage}
            pageSize={10}
            showInfo={true}
          />
        </Box>
      )}
    </Box>
  );
};

export default NotificationPage;
