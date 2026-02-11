"use client";

import { useMemo, useState } from "react";
import { SearchBar } from "./SearchBar";
import { ConversationList } from "./ConversationList";
import { useConversations } from "@/hook/chatSys/useConversations";
import { TTabs } from "@/types/chatType";
import { UsersList } from "./UsersList";
import { alpha, Box, Tab, Tabs, Typography } from "@mui/material";
import { RootState, useAppSelector, useAppDispatch } from "@/redux/store";
import { MessageCircle, Users } from "lucide-react";


export const ChatSidebar = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state: RootState) => state.palette);
  const user = useAppSelector((state) => state.auth.user);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TTabs>("conversations");

  const { conversations, isLoading, isError } = useConversations();

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      const memberNames = conv.members.map((m) => m.name || "").join(" ");
      return memberNames.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [conversations, searchQuery]);



  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="p-4 border-b border-gray-200">
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="text-red-500 text-center">
          <svg
            className="w-12 h-12 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>Failed to Load Conversation</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <Box className="h-full flex flex-col">
      <Box
        sx={{
          bgcolor: theme.currentPalette.background,
          borderBottom: `1px solid ${theme.currentPalette.primary}`,
          py: 2,
          px: 2,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight="600"
          color={theme.currentPalette.primary}
        >
          {user?.name || "unknown user"} Messages
        </Typography>

        <Box>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </Box>
      </Box>

      <Box
        sx={{
          borderBottom: `1px solid ${alpha(theme.currentPalette.text, 0.1) || "#e0e0e0"
            }`,
          bgcolor: theme.currentPalette.background,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="fullWidth"
          TabIndicatorProps={{
            sx: {
              backgroundColor: theme.currentPalette.secondary,
              height: 3,
            },
          }}
          sx={{
            minHeight: 48,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.9rem",
              minHeight: 48,
              color: theme.currentPalette.secondary || "#9e9e9e",
            },
            "& .Mui-selected": {
              color: theme.currentPalette.secondary,
              fontWeight: 600,
            },
          }}
        >
          <Tab value="conversations" label="Chats" />
          <Tab value="users" label="Users" />
        </Tabs>
      </Box>

      <Box
        className="flex-1 overflow-hidden"
        sx={{ bgcolor: theme.currentPalette.background }}
      >
        {activeTab === "conversations" ? (
          <>
            <div className="flex items-center gap-2 p-4">
              <span>
                <MessageCircle
                  size={18}
                  style={{ color: theme.currentPalette.primary }}
                />
              </span>
              <Typography
                color={alpha(theme.currentPalette.text, 0.7)}
                fontSize="15px"
              >
                All Messages
              </Typography>
            </div>

            <ConversationList conversations={filteredConversations} />
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 p-4">
              <span>
                <Users
                  size={18}
                  style={{ color: theme.currentPalette.primary }}
                />
              </span>
              <Typography
                color={alpha(theme.currentPalette.text, 0.7)}
                fontSize="15px"
              >
                All Users
              </Typography>
            </div>

            <UsersList searchQuery={searchQuery} />
          </>
        )}
      </Box>
    </Box>
  );
};
