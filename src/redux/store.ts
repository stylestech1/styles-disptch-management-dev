"use client";

import {
  configureStore,
  combineReducers,
} from "@reduxjs/toolkit";

import {
  persistReducer,
  persistStore,
} from "redux-persist";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import storage from "redux-persist/lib/storage";

import authSlice from "./slices/authSlice";
import loadsFormSlice from "./slices/loadsFormSlice";
import modalsSlice from "./slices/modalsSlice";
import uiSlice from "./slices/uiSlice";
import paletteSlice from "./slices/paletteSlice";
import notificationsSlice from "./slices/notificationSlice";
import chatSlice from "./slices/chatSlice";
import rateCalculationSlice from "./slices/rateCalculationSlice";


import { apiSlice } from "./slices/apiSlice";
import { googleMapsApi } from "./slices/googleMapsSlice";


const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["token", "user"],
};

const rateCalculationPersistConfig = {
  key: "rateCalculation",
  storage,
  whitelist: ["rows"],
};


const rootReducer = combineReducers({
  auth: persistReducer(
    authPersistConfig,
    authSlice,
  ),

  palette: paletteSlice,

  loadsForm: loadsFormSlice,

  modals: modalsSlice,

  ui: uiSlice,

  notifications: notificationsSlice,

  chat: chatSlice,

  rateCalculation: persistReducer(
    rateCalculationPersistConfig,
    rateCalculationSlice,
  ),

  [apiSlice.reducerPath]: apiSlice.reducer,

  [googleMapsApi.reducerPath]:
    googleMapsApi.reducer,
});

export const store = configureStore({
  reducer: rootReducer,

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
        ],
      },
    }).concat(
      apiSlice.middleware,
      googleMapsApi.middleware,
    ),
});

export const persistor =
  persistStore(store);


export type RootState =
  ReturnType<typeof store.getState>;

export type AppDispatch =
  typeof store.dispatch;



export const useAppSelector =
  useSelector.withTypes<RootState>();

export const useAppDispatch =
  useDispatch.withTypes<AppDispatch>();