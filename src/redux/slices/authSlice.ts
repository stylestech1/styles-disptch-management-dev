"use client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TAuthState, TUser } from "@/types/globalTypes";
import Cookies from "js-cookie";

const initialState: TAuthState = {
  user: null,
  token: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<{ user: TUser; token: string }>
    ) => {
      const { user, token } = action.payload;
      Cookies.set("token", token, {
        expires: 7,
        path: "/",
        sameSite: "lax",
        secure: true,
      });
      Cookies.set("userRole", user.role, {
        expires: 7,
        path: "/",
        sameSite: "lax",
        secure: true,
      });
      state.user = user;
      state.token = token;
    },
    logout: (state) => {
      Cookies.remove("token");
      Cookies.remove("userRole");
      state.user = null;
      state.token = null;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
