"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircleMore } from "lucide-react";
import { RootState, useAppSelector } from "@/redux/store";
import { Badge, Box, IconButton } from "@mui/material";

const ChatBubble = () => {
  const userRole = useAppSelector((state: RootState) => state.auth.user?.role);
  const theme = useAppSelector((state: RootState) => state.palette);
  const pathname = usePathname();

  const unreadCounts = useAppSelector(
    (state: RootState) => state.chat.unreadCounts
  );

  const totalUnreadCount = Object.values(unreadCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  if (
    pathname.includes("/chat") ||
    pathname === "/" ||
    pathname.startsWith("/login") ||
    !userRole
  ) {
    return null;
  }

  const href =
    userRole === "employee" ? "/dispatchers/chat" : `/${userRole}/chat`;

  return (
    <Box>
      <Badge
        badgeContent={totalUnreadCount}
        color="error"
        overlap="circular"
        invisible={totalUnreadCount === 0}
        sx={{
          "& .MuiBadge-badge": {
            top: 4,
            right: 4,
            fontSize: "12px",
            minWidth: 20,
            height: 20,
          },
        }}
      >
        <IconButton
          component={Link}
          href={href}
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            // bgcolor: "#fff",
            border: "1px solid",
            borderColor: "#E5E7EB",
            color: theme.currentPalette.primary,
            "&:hover": {
              bgcolor: "#F9FAFB",
            },
          }}
        >
          <MessageCircleMore size={20} />
        </IconButton>
      </Badge>
    </Box>
  );
};

export default ChatBubble;
