"use client";
import { Conversation } from "@/types/chatType";
import { RootState, useAppDispatch, useAppSelector } from "@/redux/store";
import { setSelectedConversation } from "@/redux/slices/chatSlice";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { alpha, Box, Chip, Typography } from "@mui/material";
import { useUsersInfinite } from "@/hook/chatSys/useUsersInfinite";
import { formatLastSeen } from "@/utils/formatLastSeen";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
}

export const ConversationItem = ({
  conversation,
  isSelected,
}: ConversationItemProps) => {
  const dispatch = useAppDispatch();

  const theme = useAppSelector((state: RootState) => state.palette);

  const unreadCount = useAppSelector(
    (state: RootState) => state.chat.unreadCounts[conversation.id] || 0
  );

  const currentUserId = useAppSelector(
    (state: RootState) => state.auth.user?.id
  );

  const presenceList = useAppSelector(
    (state: RootState) => state.chat.presence
  );

  const otherMember = conversation.members.find(
    (member) => member.id !== currentUserId
  );

  // Typing indicator
  const isTyping = useAppSelector(
    (state) => state.chat.typing[conversation.id]
  );

  const { users } = useUsersInfinite(100);
  const filteredUsers = users.filter((user) => user.id === otherMember?.id);

  const userPresence = otherMember ? presenceList[otherMember.id] : undefined;

  const isUserOnline = userPresence?.isOnline ?? false;

  const handleClick = () => {
    dispatch(setSelectedConversation(conversation.id));
  };

  const getLastMessageText = () => {
    if (!conversation.lastMessage)
      return <span className="text-xs text-gray-300">Chat me...</span>;
    return conversation.lastMessage.text;
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: "flex",
        alignItems: "center",
        p: 2,
        m: 1,
        borderRadius: 2,
        cursor: "pointer",
        transition: "background-color 0.2s ease",

        backgroundColor: isSelected
          ? theme.currentPalette.primary
          : "transparent",

        color: isSelected
          ? theme.currentPalette.background
          : theme.currentPalette.primary,

        borderRight: isSelected
          ? `4px solid ${theme.currentPalette.primary}`
          : "4px solid transparent",

        "&:hover": {
          backgroundColor: isSelected
            ? ""
            : unreadCount > 0
            ? alpha(theme.currentPalette.primary, 0.14)
            : alpha(theme.currentPalette.secondary, 0.06),
        },
      }}
    >
      {/* Avatar */}
      <div className="relative">
        <Avatar
          name={otherMember?.name || "User"}
          size="md"
          status={isUserOnline ? "online" : "offline"}
          style={{
            bgcolor: isSelected
              ? theme.currentPalette.background
              : theme.currentPalette.primary,
            color: isSelected
              ? theme.currentPalette.primary
              : theme.currentPalette.background,
          }}
        />
      </div>

      {/* Conversation Info */}
      <div className="flex-1 ml-3 min-w-0">
        <div className="flex justify-between items-center">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold max-w-23 truncate">
                {otherMember?.name || "Unknown user"}
              </h3>
              {filteredUsers.map((user) => (
                <Chip
                  key={user.jobId}
                  label={user?.role}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    height: 20,
                    color: theme.currentPalette.primary,
                    bgcolor: isSelected
                      ? theme.currentPalette.background
                      : alpha(theme.currentPalette.primary, 0.2),
                    borderRadius: 2,
                    "& .MuiChip-label": {
                      px: 1,
                    },
                  }}
                />
              ))}
            </div>

            {/* Online / Last seen */}
            <Typography
              fontSize={"11px"}
              color={
                isSelected
                  ? theme.currentPalette.background
                  : alpha(theme.currentPalette.text, 0.7)
              }
            >
              {isUserOnline ? "Online" : formatLastSeen(conversation.createdAt)}
            </Typography>
          </div>
        </div>

        <div className="flex justify-between items-center mt-1">
          {isTyping ? (
            <TypingIndicator conversationId={conversation.id} />
          ) : (
            <Typography
              className="truncate w-60"
              fontSize={"13px"}
              color={
                isSelected
                  ? theme.currentPalette.background
                  : alpha(theme.currentPalette.text, 0.7)
              }
            >
              {getLastMessageText()}
            </Typography>
          )}

          {unreadCount > 0 && (
            <Badge variant="danger" size="sm">
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </Box>
  );
};

// Typing Indicator Component
const TypingIndicator = ({ conversationId }: { conversationId: string }) => {
  const isTyping = useAppSelector((state) => state.chat.typing[conversationId]);
  const theme = useAppSelector((state: RootState) => state.palette);

  if (!isTyping) return null;

  return (
    <Typography
      component="span"
      variant="body2"
      color={theme.currentPalette.background}
      sx={{ fontSize: "12px" }}
    >
      typing...
    </Typography>
  );
};
