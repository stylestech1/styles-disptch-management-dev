/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  TCustomer,
  TDriver,
  TLoadSummary,
  TPagination,
  TTrucksSummaryResponse,
  TTruckSummaryResponse,
  TTruckWithSummary,
} from "@/types/globalTypes";
import { api } from "../api/baseApi";
import {
  GetSinglePaletteResponse,
  TGetPaletteResponse,
  TPaletteConfig,
  TUpdatePaletteRequest,
} from "@/types/themeType";
import { get } from "http";
import { TTimeOffs } from "@/types/driverType";
import { ApiResponse, Conversation, MarkSeenResponse, Message } from "@/types/chatType";
import { MaintenanceCenterForm } from "@/components/truck/centermaintenance/createEditModal";

export const apiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    // ! ========== Loads Methods ==========
    // Get Loads
    getLoads: builder.query({
      query: ({ page = 1, limit = 10 }) =>
        `/api/v1/loads?page=${page}&limit=${limit}`,
      providesTags: ["Loads", "Drivers", "Trucks"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    // Get All Loads
    getAllLoads: builder.query({
      query: () => `/api/v1/loads`,
      providesTags: ["Loads"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),
    getServiceCenters: builder.query({
      query: ({ page, limit }) => {
        const params: string[] = [];

        if (page) params.push(`page=${page}`);
        if (limit) params.push(`limit=${limit}`);

        const queryString = params.length ? `?${params.join("&")}` : "";
        return `/api/v1/service-centers${queryString}`;
      },
      providesTags: ["centermaintenance"],
    }),

    createServiceCenter: builder.mutation({
      query: (body: MaintenanceCenterForm) => ({
        url: `/api/v1/service-centers`,
        method: "POST",
        body, // ✅ same keys as your form
      }),
      invalidatesTags: ["centermaintenance"],
    }),

    updateServiceCenter: builder.mutation({
      query: ({ id, body }: { id: string; body: MaintenanceCenterForm }) => ({
        url: `/api/v1/service-centers/${id}`,
        method: "PATCH",
        body, // ✅ same keys as your form
      }),
      invalidatesTags: ["centermaintenance"],
    }),

    deleteServiceCenter: builder.mutation({
      query: (id: string) => ({
        url: `/api/v1/service-centers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["centermaintenance"],
    }),


    // Get Loads Using Id
    getLoadById: builder.query({
      query: (loadId) => `/api/v1/loads?loadId=${loadId}`,
      providesTags: (result, error, loadId) => [{ type: "Loads", id: loadId }],
    }),
    getLoadByMongoId: builder.query({
      query: (_id) => `/api/v1/loads?_id=${_id}`,
      providesTags: (result, error, _id) => [{ type: "Loads", id: _id }],
    }),

    // Get Loads with Filter and Search
    getLoadsWithFilter: builder.query({
      query: ({ from, to, page, limit }) => {
        const params = [`page=${page}`, `limit=${limit}`];

        if (from) params.push(`from=${from}`);
        if (to) params.push(`to=${to}`);

        const queryString = params.join("&");
        return `/api/v1/loads?${queryString}`;
      },
      providesTags: ["Loads"],
    }),

    // Create Load
    createLoads: builder.mutation({
      query: (formData) => ({
        url: `/api/v1/loads`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Loads"],
    }),

    // Update Load
    updateLoads: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/api/v1/loads/update/${id}`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["Loads"],
    }),

    // Update Load Status
    updateLoadsStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/v1/loads/status/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Loads"],
    }),

    // ! ========== Documents Methods ==========

    // Upload Documents
    uploadDocuments: builder.mutation({
      query: ({ formData }) => ({
        url: `/api/v1/loads`,
        method: "POST",
        body: formData,
      }),
    }),

    // ! ========== Drivers Methods ==========

    // Get Drivers
    getDrivers: builder.query({
      query: () => `/api/v1/drivers?status=available`,
      providesTags: ["Drivers"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    // Get User has driver role
    getUserDriverRole: builder.query({
      query: (email) => {
        const url = `/api/v1/adminDashboard`;
        const params = [];
        if (email) params.push(`&email=${email}`);
        return url;
      },
      providesTags: ["Drivers"],
    }),

    // 🔹 Get all drivers with Pagination
    getDriversWithPagination: builder.query({
      query: ({ page = 1, limit = 10 }) =>
        `/api/v1/drivers?page=${page}&limit=${limit}`,
      providesTags: ["Drivers"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    // 🔹 Get all drivers without pagination
    getAllDrivers: builder.query<{ data: TDriver[] }, void>({
      query: () => `/api/v1/drivers`,
      providesTags: ["Drivers"],
    }),

    // 🔹 Get driver using Id
    getDriverByDriverId: builder.query<{ data: TDriver }, string>({
      query: (driverId) => `/api/v1/drivers?driverId=${driverId}`,
      providesTags: (result, error, driverId) => [
        { type: "Drivers", id: driverId },
      ],
    }),

    getDriverById: builder.query<{ data: TDriver }, string>({
      query: (id) => `/api/v1/drivers/${id}`,
      providesTags: ["Drivers"],
    }),

    // 🔹 Get Driver with Filter and Search
    getDriverWithFilter: builder.query({
      query: ({ from, to, page, limit }) => {
        const params = [`page=${page}`, `limit=${limit}`];

        if (from) params.push(`from=${from}`);
        if (to) params.push(`to=${to}`);

        const queryString = params.join("&");
        return `/api/v1/drivers?${queryString}`;
      },
      providesTags: ["Drivers"],
    }),

    // 🔹 Get Drivers' emails
    getDriverEmails: builder.query({
      query: () => `/api/v1/drivers?fields=email`,
      providesTags: ["Drivers"],
    }),

    // 🔹 Get driver summary
    getSpecificDriverSummary: builder.query<{ data: TLoadSummary }, string>({
      query: (id) => `/api/v1/summary/driver/${id}`,
      providesTags: (result, error, id) => [{ type: "DriverSummary", id: id }],
    }),

    // 🔹 Get driver summary with date filter
    getDriverSummaryWithFilter: builder.query({
      query: ({ id, from, to }) => {
        const params = new URLSearchParams();
        if (from) params.append("from", from);
        if (to) params.append("to", to);
        return `/api/v1/summary/driver/${id}?${params.toString()}`;
      },
      providesTags: ["DriverSummary"],
    }),

    // 🔹 Create driver
    createDriver: builder.mutation<{ data: TDriver }, Partial<TDriver>>({
      query: (body) => ({
        url: `/api/v1/drivers`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Drivers"],
    }),

    // 🔹 Update driver
    updateDriver: builder.mutation<
      { data: TDriver },
      { id: string; body: FormData }
    >({
      query: ({ id, body }) => ({
        url: `/api/v1/drivers/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Drivers"],
    }),
    // 🔹 Delete driver
    deleteDriver: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/api/v1/drivers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Drivers"],
    }),

    // ! ========== Time Off Requests =======

    // 🔹 Get All Time Off Requests
    getAllTimeOffs: builder.query({
      query: ({ page = 1, limit = 10 }) =>
        `/api/v1/driver-dashboard/time-off/all?page=${page}&limit=${limit}`,
      providesTags: (result) =>
        result
          ? [
            ...result.data.map(({ id }: { id: string }) => ({
              type: "TimeOffs" as const,
              id,
            })),
            { type: "TimeOffs", id: "LIST" },
          ]
          : [{ type: "TimeOffs", id: "LIST" }],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    // 🔹 Filter Time Off Requests
    getFilterTimeOffs: builder.query({
      query: ({ from, to, page = 1, limit = 10 }) => {
        const params = [`page=${page}`, `limit=${limit}`];

        if (from) params.push(`from=${from}`);
        if (to) params.push(`to=${to}`);

        const queryString = params.join("&");
        return `/api/v1/driver-dashboard/time-off/all?${queryString}`;
      },
      providesTags: (result) =>
        result
          ? [
            ...result.data.map(({ id }: { id: string }) => ({
              type: "TimeOffs" as const,
              id,
            })),
            { type: "TimeOffs", id: "LIST" },
          ]
          : [{ type: "TimeOffs", id: "LIST" }],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    // 🔹 Get Specific Time Off Requests
    getSpecificTimeOffs: builder.query<{ data: TTimeOffs }, string>({
      query: (requestId) =>
        `/api/v1/driver-dashboard/time-off/all?requestId=${requestId}`,
      providesTags: (result, error, requestId) => [
        { type: "TimeOffs", requestId: requestId },
      ],
    }),

    // 🔹 Update Time Off Request Status
    updateTimeOffStatus: builder.mutation<
      TTimeOffs,
      {
        id: string;
        body: { status: "approved" | "rejected"; adminNote?: string };
      }
    >({
      query: ({ id, body }) => ({
        url: `/api/v1/driver-dashboard/time-off/status/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "TimeOffs", id: "LIST" }],
    }),

    // ! ========== Trucks Methods ==========

    // Get Trucks
    getTrucks: builder.query({
      query: () => `/api/v1/trucks?status=available`,
      providesTags: ["Trucks"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    // Get trucks with pagination
    getTrucksWithPagination: builder.query({
      query: ({ page = 1, limit = 10 }) =>
        `/api/v1/trucks?page=${page}&limit=${limit}`,
      providesTags: ["Trucks"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    // Get All Trucks for Search
    getAllTrucks: builder.query({
      query: () => `/api/v1/trucks`,
      providesTags: ["Trucks"],
    }),

    // Get Truck with Filter and Search
    getTruckWithSearch: builder.query({
      query: ({ from, to, page, limit }) => {
        const params = [`page=${page}`, `limit=${limit}`];

        if (from) params.push(`from=${from}`);
        if (to) params.push(`to=${to}`);

        const queryString = params.join("&");
        return `/api/v1/drivers?${queryString}`;
      },
      providesTags: ["Trucks"],
    }),

    // Get All Trucks With Summaries (For Dashboard)
    getTruckSummary: builder.query<TTrucksSummaryResponse, void>({
      query: () => `/api/v1/summary/truck`,
      providesTags: (result) =>
        result
          ? [
            ...result.data.trucksSummary.map((t: TTruckWithSummary) => ({
              type: "Trucks" as const,
              id: t.id,
            })),
            { type: "TruckSummary", id: "LIST" },
          ]
          : [{ type: "TruckSummary", id: "LIST" }],
      keepUnusedDataFor: 60 * 60,
    }),

    // ✅ Get specific truck summary
    getSpecificTruckSummary: builder.query<
      { data: TTruckSummaryResponse },
      string
    >({
      query: (id) => `/api/v1/summary/truck/${id}`,
      providesTags: (result, error, id) => [{ type: "TruckSummary", id }],
      keepUnusedDataFor: 60 * 60,
    }),

    // ✅ Get specific truck By Plate Number
    getTruckByPlateNumber: builder.query({
      query: (plateNumber) => `/api/v1/trucks?plateNumber=${plateNumber}`,
      providesTags: (result, error, plateNumber) => [
        { type: "Trucks", plateNumber },
      ],
    }),

    // ✅ Get truck summary with date filter
    getTruckSummaryWithFilter: builder.query<
      { data: TTruckSummaryResponse },
      { id: string; from?: string; to?: string }
    >({
      query: ({ id, from, to }) => {
        const params = new URLSearchParams();
        if (from) params.append("from", from);
        if (to) params.append("to", to);
        return `/api/v1/summary/truck/${id}?${params.toString()}`;
      },
      providesTags: (result, error, { id }) => [{ type: "TruckSummary", id }],
      keepUnusedDataFor: 60 * 60,
    }),

    // ✅ Get truck summary with date filter
    getAllTruckSummaryWithFilter: builder.query<
      TTruckSummaryResponse,
      { from?: string; to?: string }
    >({
      query: ({ from, to }) => {
        const params = new URLSearchParams();
        if (from) params.append("from", from);
        if (to) params.append("to", to);
        return `/api/v1/summary/truck?${params.toString()}`;
      },
      providesTags: ["TruckSummary"],
      keepUnusedDataFor: 60 * 60,
    }),

    // ✅ Get single truck by TruckID
    getTruckByTruckId: builder.query({
      query: (truckId) => `/api/v1/trucks?truckId=${truckId}`,
      providesTags: (result, error, truckId) => [{ type: "Trucks", truckId }],
    }),

    // ✅ Get single truck by ID
    getTruckById: builder.query({
      query: (id) => `/api/v1/trucks/${id}`,
      providesTags: ["Trucks"],
    }),

    // ✅ Create / Update / Delete
    createTruck: builder.mutation({
      query: (body) => ({ url: "/api/v1/trucks", method: "POST", body }),
      invalidatesTags: [
        { type: "Trucks", id: "LIST" },
        { type: "TruckSummary", id: "LIST" },
      ],
    }),

    updateTruck: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/v1/trucks/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Trucks", id },
        { type: "Trucks", id: "LIST" },
        { type: "TruckSummary", id: "LIST" },
        { type: "TruckSummary", id },
      ],
    }),

    deleteTruck: builder.mutation({
      query: (id) => ({ url: `/api/v1/trucks/${id}`, method: "DELETE" }),
      invalidatesTags: (result, error, id) => [
        { type: "Trucks", id },
        { type: "Trucks", id: "LIST" },
        { type: "TruckSummary", id: "LIST" },
        { type: "TruckSummary", id },
      ],
    }),

    // ! ========== Trucks Maintenance Methods ==========

    // 🛠 Get All Maintenances
    getAllMaintenances: builder.query({
      query: ({ page = 1, limit = 10, repeatBy }) => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (repeatBy) {
          params.append("repeatBy", repeatBy);
        }
        return `/api/v1/maintenances?${params.toString()}`;
      },
      providesTags: ["Maintenances"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    // 🛠 Get Single Maintenance
    getSingleMaintenances: builder.query({
      query: (id) => `/api/v1/maintenances/${id}`,
      providesTags: (result, error, id) => [{ type: "Maintenances", id }],
      keepUnusedDataFor: 60 * 60,
    }),

    // 🛠 Search Maintenance with Type
    searchMaintenancesWithType: builder.query({
      query: (type) => `/api/v1/maintenances?type=${type}`,
      providesTags: (result, error, type) => [
        { type: "Maintenances", id: type },
      ],
      keepUnusedDataFor: 60 * 60,
    }),

    // 🛠 Filter Maintenance with Type
    filterMaintenancesWithType: builder.query({
      query: ({ repeatBy, page = 1, limit = 10 }) =>
        `/api/v1/maintenances?repeatBy=${repeatBy}&page=${page}&limit=${limit}`,
      providesTags: ["Maintenances"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    // 🛠 Get Maintenance with filter
    getMaintenanceWithFilter: builder.query({
      query: ({ from, to }) => {
        const params = new URLSearchParams();
        if (from) params.append("from", from);
        if (to) params.append("to", to);
        return `/api/v1/maintenances?${params.toString()}`;
      },
      providesTags: (result, error, id) => [{ type: "Maintenances", id }],
      keepUnusedDataFor: 60 * 60,
    }),

    // 🛠 Create Maintenance
    createMaintenance: builder.mutation({
      query: (body) => ({
        url: `/api/v1/maintenances`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Maintenances"],
    }),

    // 🛠 Update Maintenance
    updateMaintenance: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/v1/maintenances/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, id) => [{ type: "Maintenances", id }],
    }),

    // 🛠 Delete Maintenance
    deleteMaintenance: builder.mutation({
      query: (id) => ({
        url: `/api/v1/maintenances/${id}`,
        method: "Delete",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Maintenances", id }],
    }),

    // ! ========== Notes Methods ==========

    // Add Note
    addNote: builder.mutation({
      query: ({ loadId, ...body }) => ({
        url: `/api/v1/comments/${loadId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Comments", "Loads"],
    }),

    // Get Notes
    getNotes: builder.query({
      query: (loadId) => `/api/v1/comments/${loadId}`,
      providesTags: (result, error, loadId) => [
        { type: "Comments", id: loadId },
      ],
    }),

    // ! ========== Users Methods [adminDashboard] ==========

    // Get All Users with Pagination
    getAllDispatchers: builder.query({
      query: ({ page = 1, limit = 10 }) =>
        `/api/v1/adminDashboard?page=${page}&limit=${limit}`,
      providesTags: ["Dispatchers"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    // Get Users Using Id
    getUserById: builder.query({
      query: (jobId) => `/api/v1/adminDashboard?jobId=${jobId}`,
      providesTags: (result, error, jobId) => [
        { type: "Dispatchers", id: jobId },
      ],
    }),

    // Get User with Filter and Search
    getUserWithSearch: builder.query({
      query: ({ from, to, page, limit }) => {
        const params = [`page=${page}`, `limit=${limit}`];

        if (from) params.push(`from=${from}`);
        if (to) params.push(`to=${to}`);

        const queryString = params.join("&");
        return `/api/v1/adminDashboard?${queryString}`;
      },
      providesTags: ["Dispatchers"],
    }),

    // Get Users has Driver Roles with their emails
    getUsersWithDriverRoles: builder.query({
      query: () => `/api/v1/adminDashboard?fields=email&role=driver`,
      providesTags: ["Dispatchers"],
    }),

    // Create User
    createUser: builder.mutation({
      query: (body) => ({
        url: `/api/v1/adminDashboard`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Dispatchers"],
    }),

    // Update User Role
    updateUserRole: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/v1/adminDashboard/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Dispatchers"],
    }),

    // Activate User
    activateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/v1/adminDashboard/activate/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Dispatchers"],
    }),

    // Deactivate User
    deactivateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/v1/adminDashboard/deactivate/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Dispatchers"],
    }),

    // ! ========== Users Methods [userDashboard] ==========

    // Get User Information
    getUserInfo: builder.query({
      query: () => `/api/v1/userDashboard/getMyData`,
      providesTags: ["Users"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    // Update User Info
    updateUserInfo: builder.mutation({
      query: ({ ...body }) => ({
        url: `/api/v1/userDashboard/updateMyData`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Users"],
    }),

    // ! ========== Password Methods ==========

    // Update User Password
    updateUserPassword: builder.mutation({
      query: (body) => ({
        url: `/api/v1/updatePassword/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Users"],
    }),

    // ! ========== Palette Themes ============

    getPalette: builder.query<TPaletteConfig[], void>({
      query: () => `/api/v1/ui-settings/palette`,
      providesTags: ["Palette"],
      transformResponse: (response: TGetPaletteResponse) => response.data,
    }),

    getSpecificPalette: builder.query({
      query: (_id) => `/api/v1/ui-settings/palette/${_id}`,
      providesTags: (result, error, _id) => [{ type: "Palette", id: _id }],
      transformResponse: (response: GetSinglePaletteResponse) => response.data,
    }),

    createPalette: builder.mutation<TPaletteConfig, TPaletteConfig>({
      query: (body) => ({
        url: "/api/v1/ui-settings/palette",
        method: "POST",
        body: body,
      }),
      invalidatesTags: ["Palette"],
    }),

    updatePalette: builder.mutation<TPaletteConfig, TUpdatePaletteRequest>({
      query: ({ _id, body }) => ({
        url: `/api/v1/ui-settings/palette/${_id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Palette"],
    }),

    deletePalette: builder.mutation<{ message: string }, string>({
      query: (_id) => ({
        url: `/api/v1/ui-settings/palette/${_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Palette"],
    }),

    // ! ========== Customer Methods ==========

    getCustomerById: builder.query({
      query: (customerId) => `/api/v1/customers?customerId=${customerId}`,
      providesTags: (result, error, customerId) => [
        { type: "Customers", id: customerId },
      ],
    }),

    // Get Customer with Filter and Search
    getCustomerWithFilter: builder.query({
      query: ({ from, to, page, limit }) => {
        const params = [`page=${page}`, `limit=${limit}`];

        if (from) params.push(`from=${from}`);
        if (to) params.push(`to=${to}`);

        const queryString = params.join("&");
        return `/api/v1/customers?${queryString}`;
      },
      providesTags: ["Customers"],
    }),

    // 🔹 Get all Customers with Pagination
    getCustomersWithPagination: builder.query({
      query: ({ page = 1, limit = 10 }) =>
        `/api/v1/customers?page=${page}&limit=${limit}`,
      providesTags: ["Customers"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    // 🔹 Create Customer
    createCustomer: builder.mutation<{ data: TCustomer }, Partial<TCustomer>>({
      query: (body) => ({
        url: `/api/v1/customers`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Customers"],
    }),

    // 🔹 Update customer
    updateCustomer: builder.mutation<
      { data: TCustomer },
      { id: string; body: Partial<TCustomer> }
    >({
      query: ({ id, body }) => ({
        url: `/api/v1/customers/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Customers"],
    }),

    // 🔹 Delete Customer
    deleteCustomer: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/api/v1/customers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Customers"],
    }),

    // ! ========== Notification Methods ==========
    getAllNotifications: builder.query({
      query: (args = { page: 1, limit: 10 }) => {
        const { page, limit } = args;
        return `/api/v1/notifications?page=${page}&limit=${limit}`;
      },
      providesTags: ["Notifications"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    markAllAsRead: builder.mutation({
      query: () => ({ url: `/api/v1/notifications/mark-all`, method: "PATCH" }),
      invalidatesTags: ["Notifications"],
    }),

    markSpecificAsRead: builder.mutation({
      query: (id) => ({
        url: `api/v1/notifications/mark/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // ! ========== Chat Methods ==========
    // Get All Users with Pagination
    getActiveUsers: builder.query({
      query: ({ page = 1, limit = 10 }) =>
        `/api/v1/adminDashboard?active=true&page=${page}&limit=${limit}`,
      providesTags: ["Dispatchers"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    // Get User Conversations
    getUserConversations: builder.query<Conversation[], void>({
      query: () => `/api/v1/chat/conversations`,
      transformResponse: (response: ApiResponse<Conversation[]>) =>
        response.data || [],
      providesTags: ["Conversations"],
    }),

    // Create Or Get Conversation
    createOrGetConversation: builder.mutation<Conversation, { userId: string }>(
      {
        query: (body) => ({
          url: `/api/v1/chat/conversations/start`,
          method: "POST",
          body,
        }),
        transformResponse: (response: ApiResponse<Conversation>) =>
          response.data,
        invalidatesTags: ["Conversations"],
      }
    ),

    // Send Message
    addMessage: builder.mutation<
      Message,
      { conversationId: string; text: string }
    >({
      query: ({ conversationId, text }) => ({
        url: `/api/v1/chat/messages/${conversationId}`,
        method: "POST",
        body: { text },
      }),
      transformResponse: (response: ApiResponse<Message>) => response.data,
      invalidatesTags: (_res, _err, arg) => [
        { type: "Messages", id: arg.conversationId },
        "Conversations",
      ],
    }),

    // Get Conversation Messages
    getConversationMessages: builder.query<Message[], string>({
      query: (conversationId) => `/api/v1/chat/messages/${conversationId}`,
      transformResponse: (response: ApiResponse<Message[]>) =>
        response.data || [],
      providesTags: (_res, _err, id) => [{ type: "Messages", id }],
    }),

    // Mark Messages Seen
    markMessagesSeen: builder.mutation<
      MarkSeenResponse,
      { conversationId: string }
    >({
      query: ({ conversationId }) => ({
        url: `/api/v1/chat/messages/seen/${conversationId}`,
        method: "PUT",
      }),
      transformResponse: (response: MarkSeenResponse) => response,
      invalidatesTags: (_res, _err, arg) => [
        { type: "Messages", id: arg.conversationId },
        "Conversations",
      ],
    }),
  }),
});

export const {
  // TODO: ----- Loads -----
  useGetLoadsQuery,
  useGetAllLoadsQuery,
  useGetLoadByIdQuery,
  useGetLoadByMongoIdQuery,
  useLazyGetLoadByIdQuery,
  useCreateLoadsMutation,
  useUpdateLoadsMutation,
  useUpdateLoadsStatusMutation,
  useGetLoadsWithFilterQuery,
  // TODO: ----- Documents -----
  useUploadDocumentsMutation,
  // TODO: ----- Drivers -----
  useGetDriversQuery,
  useLazyGetDriversQuery,
  useGetUserDriverRoleQuery,
  useGetDriversWithPaginationQuery,
  useGetAllDriversQuery,
  useGetDriverWithFilterQuery,
  useGetDriverByIdQuery,
  useGetDriverByDriverIdQuery,
  useLazyGetDriverByIdQuery,
  useLazyGetDriverByDriverIdQuery,
  useGetDriverEmailsQuery,
  useGetSpecificDriverSummaryQuery,
  useLazyGetSpecificDriverSummaryQuery,
  useGetDriverSummaryWithFilterQuery,
  useLazyGetDriverSummaryWithFilterQuery,
  useGetAllTimeOffsQuery,
  useGetFilterTimeOffsQuery,
  useGetSpecificTimeOffsQuery,
  useLazyGetSpecificTimeOffsQuery,
  useUpdateTimeOffStatusMutation,
  useCreateDriverMutation,
  useUpdateDriverMutation,
  useDeleteDriverMutation,
  // TODO: ----- Trucks -----
  useGetTrucksQuery,
  useGetTrucksWithPaginationQuery,
  useGetAllTrucksQuery,
  useGetTruckSummaryQuery,
  useGetTruckWithSearchQuery,
  useGetSpecificTruckSummaryQuery,
  useLazyGetSpecificTruckSummaryQuery,
  useGetTruckByPlateNumberQuery,
  useLazyGetTruckByPlateNumberQuery,
  useGetTruckSummaryWithFilterQuery,
  useGetAllTruckSummaryWithFilterQuery,
  useGetTruckByIdQuery,
  useGetTruckByTruckIdQuery,
  useLazyGetTruckByIdQuery,
  useLazyGetTruckByTruckIdQuery,
  useCreateTruckMutation,
  useUpdateTruckMutation,
  useDeleteTruckMutation,
  // TODO: ----- Trucks Maintenance -----
  useGetAllMaintenancesQuery,
  useGetSingleMaintenancesQuery,
  useSearchMaintenancesWithTypeQuery,
  useLazySearchMaintenancesWithTypeQuery,
  useFilterMaintenancesWithTypeQuery,
  useLazyFilterMaintenancesWithTypeQuery,
  useGetMaintenanceWithFilterQuery,
  useCreateMaintenanceMutation,
  useUpdateMaintenanceMutation,
  useDeleteMaintenanceMutation,
  // TODO: ----- Notes -----
  useAddNoteMutation,
  useGetNotesQuery,
  // TODO: ----- Users-----
  useGetAllDispatchersQuery,
  useGetUserByIdQuery,
  useLazyGetUserByIdQuery,
  useGetUserWithSearchQuery,
  useGetUsersWithDriverRolesQuery,
  useCreateUserMutation,
  useUpdateUserRoleMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
  useGetUserInfoQuery,
  useUpdateUserInfoMutation,
  // TODO: ----- Password -----
  useUpdateUserPasswordMutation,
  // TODO: ----- Palette -----
  useGetPaletteQuery,
  useGetSpecificPaletteQuery,
  useCreatePaletteMutation,
  useUpdatePaletteMutation,
  useDeletePaletteMutation,
  // TODO: ----- Customer -----
  useGetCustomerByIdQuery,
  useLazyGetCustomerByIdQuery,
  useGetCustomerWithFilterQuery,
  useGetCustomersWithPaginationQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  // TODO: ----- Notification -----
  useGetAllNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkSpecificAsReadMutation,
  // TODO: ----- Chat -----
  useGetActiveUsersQuery,
  useGetUserConversationsQuery,
  useCreateOrGetConversationMutation,
  useAddMessageMutation,
  useGetConversationMessagesQuery,
  useMarkMessagesSeenMutation,
  useGetServiceCentersQuery,
  useCreateServiceCenterMutation,
  useUpdateServiceCenterMutation,
  useDeleteServiceCenterMutation,
} = apiSlice;
