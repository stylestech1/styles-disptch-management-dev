/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRef } from "react";
import { Avatar } from "./ui/Avatar";
import { useUsersInfinite } from "@/hook/chatSys/useUsersInfinite";
import { RootState, useAppSelector } from "@/redux/store";
import { alpha, Chip, Box, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface UsersListProps {
  searchQuery: string;
  selectedUserIds?: string[];
  onToggleUser?: (userId: string) => void;
}

export const UserChat = ({
  searchQuery,
  selectedUserIds,
  onToggleUser,
}: UsersListProps) => {
  const theme = useAppSelector((state: RootState) => state.palette);

  const { users, loadMore, isFetching, hasMore } = useUsersInfinite(100);

  const currentUserId = useAppSelector(
    (state: RootState) => state.auth.user?.id
  );

  const presenceList = useAppSelector(
    (state: RootState) => state.chat.presence
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el || !hasMore) return;

    const isBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 50;
    if (isBottom) loadMore();
  };

  const q = searchQuery.trim().toLowerCase();

  const filteredUsers = users.filter((user: any) => {
    if (!user?.id) return false;
    if (user.id === currentUserId) return false;

    if (!q) return true;

    const name = (user.name || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const role = (user.role || "").toLowerCase();

    return name.includes(q) || email.includes(q) || role.includes(q);
  });

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto"
    >
      {filteredUsers.length === 0 && !isFetching && (
        <div className="p-6 text-center text-sm text-gray-500">
          No users found
        </div>
      )}

      {filteredUsers.map((user: any) => {
        const userPresence = presenceList[user.id];
        const isUserOnline = userPresence?.isOnline ?? false;

        const isSelected = selectedUserIds?.includes(user.id) ?? false;

        return (
          <Box
            key={user.id}
            onClick={() => onToggleUser && onToggleUser(user.id)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 1.5,
              cursor: "pointer",
              borderBottom: "1px solid",
              borderColor: "rgba(0,0,0,0.06)",
              transition: "all 150ms ease",
              bgcolor: isSelected
                ? alpha(theme.currentPalette.primary, 0.12)
                : "#fff",
              "&:hover": {
                bgcolor: alpha(theme.currentPalette.primary, 0.08),
              },
            }}
          >
            <Avatar
              name={user.name || "User"}
              size="sm"
              status={isUserOnline ? "online" : "offline"}
              style={{
                bgcolor: theme.currentPalette.primary,
                color: theme.currentPalette.background,
              }}
            />

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-semibold truncate">
                  {user.name || "Unknown"}
                </span>

                {user?.role && (
                  <Chip
                    label={user.role}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      height: 20,
                      color: theme.currentPalette.primary,
                      bgcolor: alpha(theme.currentPalette.primary, 0.15),
                      borderRadius: 1,
                      "& .MuiChip-label": { px: 1 },
                    }}
                  />
                )}
              </div>

              <span className="text-xs text-gray-500 truncate">
                {user.email || ""}
              </span>
            </div>

            {isSelected && (
              <CheckCircleIcon
                sx={{ color: theme.currentPalette.primary, fontSize: 20 }}
              />
            )}
          </Box>
        );
      })}

      {isFetching && (
        <Typography sx={{ p: 2, textAlign: "center", fontSize: 13 }}>
          Loading...
        </Typography>
      )}

      {!hasMore && filteredUsers.length > 0 && (
        <Typography sx={{ p: 2, textAlign: "center", fontSize: 12, opacity: 0.6 }}>
          No more users
        </Typography>
      )}
    </div>
  );
};
