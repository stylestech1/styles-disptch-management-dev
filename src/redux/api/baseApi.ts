import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth?.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: [
    "Loads",
    "Trucks",
    "Repairs",
    "Drivers",
    "Hiring Drivers",
    "Comments",
    "Dispatchers",
    "Users",
    "TruckSummary",
    "DriverSummary",
    "Palette",
    "Customers",
    "Notifications",
    "TimeOffs",
    "Maintenances",
    "Messages",
    "Conversations",
    "centermaintenance",
    "companies",
    "Settings"
  ],
  refetchOnFocus: false,
  refetchOnReconnect: false,
  refetchOnMountOrArgChange: false,
  endpoints: () => ({}),
});
