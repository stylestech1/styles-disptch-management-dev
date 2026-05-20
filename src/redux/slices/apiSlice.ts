/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CompanyDto,
  CompanyUpsertBody,
  PaginationResult,
  TCustomer,
  TDriver,
  tDriverHiring,
  TLoadSummary,
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
import { TTimeOffs } from "@/types/driverType";
import {
  ApiResponse,
  Conversation,
  MarkSeenResponse,
  Message,
} from "@/types/chatType";
import { MaintenanceCenterForm } from "@/components/truck/centermaintenance/createEditModal";



export const apiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    // ! ========== Loads Methods ==========
    getLoads: builder.query({
      query: ({ page = 1, limit = 10 }) =>
        `/api/v1/loads?page=${page}&limit=${limit}`,
      providesTags: ["Loads", "Drivers", "Trucks"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    getAllLoads: builder.query({
      query: () => `/api/v1/loads`,
      providesTags: ["Loads"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    // ! ========== Service Centers ==========
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
        body,
      }),
      invalidatesTags: ["centermaintenance"],
    }),

    updateServiceCenter: builder.mutation({
      query: ({ id, body }: { id: string; body: MaintenanceCenterForm }) => ({
        url: `/api/v1/service-centers/${id}`,
        method: "PATCH",
        body,
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

    // -----settings -----
    getSettings: builder.query<
      {
        data: {
          repairPerMile: number | null;
          insurancePerMile: number | null;
        };
        raw: Array<{ id: string; key: "repairPerMile" | "insurancePerMile"; value: number }>;
      },
      void
    >({
      query: () => `/api/v1/settings`,
      providesTags: ["Settings"],
      transformResponse: (response: any) => {
        const raw = Array.isArray(response?.data) ? response.data : [];

        const repair = raw.find((x: any) => x.key === "repairPerMile")?.value ?? null;
        const insurance = raw.find((x: any) => x.key === "insurancePerMile")?.value ?? null;

        return {
          raw: raw.map((x: any) => ({
            id: String(x._id ?? x.id),
            key: x.key,
            value: Number(x.value),
          })),
          data: {
            repairPerMile: repair != null ? Number(repair) : null,
            insurancePerMile: insurance != null ? Number(insurance) : null,
          },
        };
      },
    }),
    createSetting: builder.mutation<any, { key: "repairPerMile" | "insurancePerMile"; value: number }>({
      query: (body) => ({
        url: `/api/v1/settings`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Settings"],
    }),
    updateSetting: builder.mutation<
      any,
      { id: string; key: "repairPerMile" | "insurancePerMile"; value: number }
    >({
      query: ({ id, key, value }) => ({
        url: `/api/v1/settings/${id}`,
        method: "PATCH",
        body: { key, value },
      }),
      invalidatesTags: ["Settings"],
    }),
    // login 
    logIn: builder.mutation<
      any,
      {
        email: string; password: string;
        // rememberMe: boolean
      }
    >({
      query: (body) => ({
        url: `/api/v1/auth/logIn`,
        method: "POST",
        body,
        credentials: "include",
      }),
    }),

    sendResetCode: builder.mutation<any, { email: string }>({
      query: (body) => ({
        url: `/api/v1/forgetpassword/sendResetCode`,
        method: "POST",
        body,
      }),
    }),
    resendResetCode: builder.mutation<any, { email: string }>({
      query: (body) => ({
        url: `/api/v1/forgetpassword/resendResetCode`,
        method: "POST",
        body,
      }),
    }),
    verifyResetCode: builder.mutation<any, { resetCode: string }>({
      query: (body) => ({
        url: `/api/v1/forgetpassword/verifyResetCode`,
        method: "POST",
        body,
      }),
    }),
    resetPassword: builder.mutation<
      any,
      { email: string; newPassword: string; confirmNewPassword: string }
    >({
      query: (body) => ({
        url: `/api/v1/forgetpassword/resetPassword`,
        method: "PUT",
        body,
      }),
    }),
    // ! ========== Companies ==========
    getCompanies: builder.query<
      {
        data: CompanyDto[];
        totalCompanies?: number;
        totalUsers?: number;
        paginationResult?: PaginationResult;
      },
      { page?: number; limit?: number }
    >({
      query: ({ page, limit }) => {
        const params: string[] = [];
        if (page) params.push(`page=${page}`);
        if (limit) params.push(`limit=${limit}`);

        const queryString = params.length ? `?${params.join("&")}` : "";
        return `/api/v1/companies${queryString}`;
      },
      transformResponse: (response: any) => {
        const raw = Array.isArray(response?.data) ? response.data : [];

        const sorted = [...raw].sort((a: any, b: any) => {
          const da = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
          return da - db;
        });

        return {
          ...response,
          data: sorted.map((company: any) => ({
            id: String(company._id ?? company.id),
            name: company.name ?? "",
            email: company.email ?? "",
            phone: company.phone ?? "",
            usersCount: company.usersCount ?? 0,
            active: Boolean(company.active),
            createdAt: company.createdAt,
          })),
        };
      },

      providesTags: ["companies"],
    }),

    updateactivationcompany: builder.mutation<any, { id: string; active: boolean }>({
      query: ({ id, active }) => ({
        url: `/api/v1/companies/activate/${id}`,
        method: "PATCH",
        body: { active },
      }),
      invalidatesTags: [{ type: "companies", id: "LIST" }],
    }),

    updatedeactivationcompany: builder.mutation<any, { id: string; active: boolean }>({
      query: ({ id, active }) => ({
        url: `/api/v1/companies/deactivate/${id}`,
        method: "PATCH",
        body: { active },
      }),
      invalidatesTags: [{ type: "companies", id: "LIST" }],
    }),
    createCompany: builder.mutation<any, CompanyUpsertBody>({
      query: (body) => ({
        url: `/api/v1/companies`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["companies"],
    }),

    updateCompany: builder.mutation<any, { id: string; body: Partial<CompanyUpsertBody> }>({
      query: ({ id, body }) => ({
        url: `/api/v1/companies/${id}`,
        method: "PATCH",
        body,
      }),

      invalidatesTags: (r, e, arg) => [{ type: "companies", id: arg.id }],
    }),
    deleteCompany: builder.mutation<any, string | number>({
      query: (id) => ({
        url: `/api/v1/companies/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["companies"],
    }),

    // ! ========== Driver Applicants ==========
    getDriverApplicants: builder.query<
      {
        data: tDriverHiring[];
        totalDrivers?: number;
        paginationResult?: PaginationResult;
        stats?: any;
      },
      { page?: number; limit?: number }
    >({
      query: ({ page, limit }) => {
        const params: string[] = [];

        if (page) params.push(`page=${page}`);
        if (limit) params.push(`limit=${limit}`);

        const queryString = params.length ? `?${params.join("&")}` : "";

        return `/api/v1/driver-applicants${queryString}`;
      },
      providesTags: ["Hiring Drivers"],
    }),
    getDriverApplicantsWithFilter: builder.query<
      {
        data: tDriverHiring[];
        paginationResult?: PaginationResult;
        stats?: any;
      },
      {
        from?: string;
        to?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: ({ from, to, page, limit }) => {
        const params: string[] = [];

        if (from) params.push(`from=${from}`);
        if (to) params.push(`to=${to}`);
        if (page) params.push(`page=${page}`);
        if (limit) params.push(`limit=${limit}`);

        const queryString = params.length ? `?${params.join("&")}` : "";

        return `/api/v1/driver-applicants/filter${queryString}`;
      },

      providesTags: ["Hiring Drivers"],
    }),
    getDriverApplicantById: builder.query<
      {
        data: tDriverHiring;
      },
      string
    >({
      query: (id) => `/api/v1/driver-applicants/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "Hiring Drivers", id },
      ],
    }),
    createDriverApplicant: builder.mutation<any, FormData>({
      query: (body) => ({
        url: "/api/v1/driver-applicants",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Hiring Drivers"],
    }),

    updateDriverApplicant: builder.mutation<any, { id: string; body: FormData }>({
      query: ({ id, body }) => ({
        url: `/api/v1/driver-applicants/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Hiring Drivers"],
    }),

    deleteDriverApplicant: builder.mutation<any, string>({
      query: (id) => ({
        url: `/api/v1/driver-applicants/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Hiring Drivers"],
    }),
    // ! ========== Loads Using Id ==========
    getLoadById: builder.query({
      query: (loadId) => `/api/v1/loads?loadId=${loadId}`,
      providesTags: (result, error, loadId) => [{ type: "Loads", id: loadId }],
    }),

    getLoadByMongoId: builder.query({
      query: (_id) => `/api/v1/loads?_id=${_id}`,
      providesTags: (result, error, _id) => [{ type: "Loads", id: _id }],
    }),

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

    createLoads: builder.mutation({
      query: (formData) => ({
        url: `/api/v1/loads`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Loads"],
    }),

    updateLoads: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/api/v1/loads/update/${id}`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["Loads"],
    }),

    updateLoadsStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/v1/loads/status/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Loads"],
    }),

    // ! ========== Documents ==========
    uploadDocuments: builder.mutation({
      query: ({ formData }) => ({
        url: `/api/v1/loads`,
        method: "POST",
        body: formData,
      }),
    }),

    // ! ========== Drivers ==========
    getDrivers: builder.query({
      query: (params?: { page?: number; limit?: number }) => {
        let url = `/api/v1/drivers?status=available`;

        if (params?.page) {
          url += `&page=${params.page}`;
        }
        if (params?.limit) {
          url += `&limit=${params.limit}`;
        }

        return url;
      },
      providesTags: ["Drivers"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    getDriversLazy: builder.mutation({
      query: (params?: { page?: number; limit?: number }) => {
        let url = `/api/v1/drivers?status=available`;

        if (params?.page) {
          url += `&page=${params.page}`;
        }
        if (params?.limit) {
          url += `&limit=${params.limit}`;
        }

        return url;
      },
      invalidatesTags: ["Drivers"],
    }),

    getUserDriverRole: builder.query({
      query: (email) => {
        const url = `/api/v1/adminDashboard`;
        const params = [];
        if (email) params.push(`&email=${email}`);
        return url;
      },
      providesTags: ["Drivers"],
    }),

    getDriversWithPagination: builder.query<
      any,
      { page: number; limit: number; status?: string }
    >({
      query: ({ page, limit, status }) => ({
        url: "/api/v1/drivers",
        params: {
          page,
          limit,
          ...(status ? { status } : {}),
        },
      }),
      providesTags: ["Drivers"],
    }),

    getAllDrivers: builder.query<{ data: TDriver[] }, void>({
      query: () => `/api/v1/drivers`,
      providesTags: ["Drivers"],
    }),

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

    getDriverEmails: builder.query({
      query: () => `/api/v1/drivers?fields=email`,
      providesTags: ["Drivers"],
    }),

    getSpecificDriverSummary: builder.query<{ data: TLoadSummary }, string>({
      query: (id) => `/api/v1/summary/driver/${id}`,
      providesTags: (result, error, id) => [{ type: "DriverSummary", id }],
    }),

    getDriverSummaryWithFilter: builder.query({
      query: ({ id, from, to }) => {
        const params = new URLSearchParams();
        if (from) params.append("from", from);
        if (to) params.append("to", to);
        return `/api/v1/summary/driver/${id}?${params.toString()}`;
      },
      providesTags: ["DriverSummary"],
    }),

    createDriver: builder.mutation<{ data: TDriver }, Partial<TDriver>>({
      query: (body) => ({
        url: `/api/v1/drivers`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Drivers"],
    }),

    updateDriver: builder.mutation<{ data: TDriver }, { id: string; body: FormData }>({
      query: ({ id, body }) => ({
        url: `/api/v1/drivers/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Drivers"],
    }),

    deleteDriver: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/api/v1/drivers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Drivers"],
    }),

    // ! ========== Time Off ==========
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

    getSpecificTimeOffs: builder.query<{ data: TTimeOffs }, string>({
      query: (requestId) =>
        `/api/v1/driver-dashboard/time-off/all?requestId=${requestId}`,
      providesTags: (result, error, requestId) => [
        { type: "TimeOffs", requestId },
      ],
    }),

    updateTimeOffStatus: builder.mutation<
      TTimeOffs,
      { id: string; body: { status: "approved" | "rejected"; adminNote?: string } }
    >({
      query: ({ id, body }) => ({
        url: `/api/v1/driver-dashboard/time-off/status/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "TimeOffs", id: "LIST" }],
    }),

    // ! ========== Trucks ==========
    getTrucks: builder.query({
      query: () => `/api/v1/trucks?status=available`,
      providesTags: ["Trucks"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    getTrucksWithPagination: builder.query({
      query: ({ page = 1, limit = 10 }) =>
        `/api/v1/trucks?page=${page}&limit=${limit}`,
      providesTags: ["Trucks"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    getAllTrucks: builder.query({
      query: () => `/api/v1/trucks`,
      providesTags: ["Trucks"],
    }),

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

    getSpecificTruckSummary: builder.query<{ data: TTruckSummaryResponse }, string>({
      query: (id) => `/api/v1/summary/truck/${id}`,
      providesTags: (result, error, id) => [{ type: "TruckSummary", id }],
      keepUnusedDataFor: 60 * 60,
    }),

    getTruckByPlateNumber: builder.query({
      query: (plateNumber) => `/api/v1/trucks?plateNumber=${plateNumber}`,
      providesTags: (result, error, plateNumber) => [
        { type: "Trucks", plateNumber },
      ],
    }),

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

    getAllTruckSummaryWithFilter: builder.query<TTruckSummaryResponse, { from?: string; to?: string }>({
      query: ({ from, to }) => {
        const params = new URLSearchParams();
        if (from) params.append("from", from);
        if (to) params.append("to", to);
        return `/api/v1/summary/truck?${params.toString()}`;
      },
      providesTags: ["TruckSummary"],
      keepUnusedDataFor: 60 * 60,
    }),

    getTruckByTruckId: builder.query({
      query: (truckId) => `/api/v1/trucks?truckId=${truckId}`,
      providesTags: (result, error, truckId) => [{ type: "Trucks", truckId }],
    }),

    getTruckById: builder.query({
      query: (id) => `/api/v1/trucks/${id}`,
      providesTags: ["Trucks"],
    }),

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

    // ! ========== Trucks Maintenance ==========
    getAllMaintenances: builder.query({
      query: ({ page = 1, limit = 10, repeatBy }) => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (repeatBy) params.append("repeatBy", repeatBy);
        return `/api/v1/maintenances?${params.toString()}`;
      },
      providesTags: ["Maintenances"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    getSingleMaintenances: builder.query({
      query: (id) => `/api/v1/maintenances/${id}`,
      providesTags: (result, error, id) => [{ type: "Maintenances", id }],
      keepUnusedDataFor: 60 * 60,
    }),

    searchMaintenancesWithType: builder.query({
      query: (type) => `/api/v1/maintenances?type=${type}`,
      providesTags: (result, error, type) => [{ type: "Maintenances", id: type }],
      keepUnusedDataFor: 60 * 60,
    }),

    filterMaintenancesWithType: builder.query({
      query: ({ repeatBy, page = 1, limit = 10 }) =>
        `/api/v1/maintenances?repeatBy=${repeatBy}&page=${page}&limit=${limit}`,
      providesTags: ["Maintenances"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

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

    createMaintenance: builder.mutation({
      query: (body) => ({
        url: `/api/v1/maintenances`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Maintenances"],
    }),

    updateMaintenance: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/v1/maintenances/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, id) => [{ type: "Maintenances", id }],
    }),

    deleteMaintenance: builder.mutation({
      query: (id) => ({
        url: `/api/v1/maintenances/${id}`,
        method: "Delete",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Maintenances", id }],
    }),

    // ! ========== Notes ==========
    addNote: builder.mutation({
      query: ({ loadId, ...body }) => ({
        url: `/api/v1/comments/${loadId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Comments", "Loads"],
    }),

    getNotes: builder.query({
      query: (loadId) => `/api/v1/comments/${loadId}`,
      providesTags: (result, error, loadId) => [{ type: "Comments", id: loadId }],
    }),

    // ! ========== Users [adminDashboard] ==========
    getAllDispatchers: builder.query({
      query: ({ page = 1, limit = 10 }) =>
        `/api/v1/adminDashboard?page=${page}&limit=${limit}`,
      providesTags: ["Dispatchers"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    getUserById: builder.query({
      query: (jobId) => `/api/v1/adminDashboard?jobId=${jobId}`,
      providesTags: (result, error, jobId) => [{ type: "Dispatchers", id: jobId }],
    }),

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

    getUsersWithDriverRoles: builder.query({
      query: () => `/api/v1/adminDashboard?fields=email&role=driver`,
      providesTags: ["Dispatchers"],
    }),

    createUser: builder.mutation({
      query: (body) => ({
        url: `/api/v1/adminDashboard`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Dispatchers"],
    }),

    updateUserRole: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/v1/adminDashboard/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Dispatchers"],
    }),

    activateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/v1/adminDashboard/activate/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Dispatchers"],
    }),

    deactivateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/v1/adminDashboard/deactivate/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Dispatchers"],
    }),

    // ! ========== Users [userDashboard] ==========
    getUserInfo: builder.query({
      query: () => `/api/v1/userDashboard/getMyData`,
      providesTags: ["Users"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    updateUserInfo: builder.mutation({
      query: ({ ...body }) => ({
        url: `/api/v1/userDashboard/updateMyData`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Users"],
    }),

    // ! ========== Password ==========
    updateUserPassword: builder.mutation({
      query: (body) => ({
        url: `/api/v1/updatePassword/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Users"],
    }),

    // ! ========== Palette ==========
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
        body,
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

    // ! ========== Customers ==========
    getCustomerById: builder.query({
      query: (customerId) => `/api/v1/customers?customerId=${customerId}`,
      providesTags: (result, error, customerId) => [
        { type: "Customers", id: customerId },
      ],
    }),

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

    getCustomersWithPagination: builder.query({
      query: ({ page = 1, limit = 10 }) =>
        `/api/v1/customers?page=${page}&limit=${limit}`,
      providesTags: ["Customers"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    createCustomer: builder.mutation<{ data: TCustomer }, Partial<TCustomer>>({
      query: (body) => ({
        url: `/api/v1/customers`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Customers"],
    }),

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

    deleteCustomer: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/api/v1/customers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Customers"],
    }),

    // ! ========== Notifications ==========
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

    // ! ========== Chat ==========
    getActiveUsers: builder.query({
      query: ({ page = 1, limit = 10 }) =>
        `/api/v1/adminDashboard?active=true&page=${page}&limit=${limit}`,
      providesTags: ["Dispatchers"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    getUserConversations: builder.query<Conversation[], void>({
      query: () => `/api/v1/chat/conversations`,
      transformResponse: (response: ApiResponse<Conversation[]>) =>
        response.data || [],
      providesTags: ["Conversations"],
    }),

    createOrGetConversation: builder.mutation<Conversation, { userId: string }>({
      query: (body) => ({
        url: `/api/v1/chat/conversations/start`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<Conversation>) => response.data,
      invalidatesTags: ["Conversations"],
    }),

    addMessage: builder.mutation<Message, { conversationId: string; text: string }>({
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

    getConversationMessages: builder.query<Message[], string>({
      query: (conversationId) => `/api/v1/chat/messages/${conversationId}`,
      transformResponse: (response: ApiResponse<Message[]>) => response.data || [],
      providesTags: (_res, _err, id) => [{ type: "Messages", id }],
    }),

    markMessagesSeen: builder.mutation<MarkSeenResponse, { conversationId: string }>({
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

  // TODO: ----- Users -----
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

  // TODO: ----- Service Centers -----
  useGetServiceCentersQuery,
  useCreateServiceCenterMutation,
  useUpdateServiceCenterMutation,
  useDeleteServiceCenterMutation,

  // TODO: ----- Companies -----
  useGetCompaniesQuery,
  useCreateCompanyMutation,
  useDeleteCompanyMutation,
  useUpdateCompanyMutation,
  useUpdateactivationcompanyMutation,
  useUpdatedeactivationcompanyMutation,
  // TODO: ----- settings  -----
  useGetSettingsQuery,
  useCreateSettingMutation,
  useUpdateSettingMutation,
  // login
  useLogInMutation,
  useSendResetCodeMutation,
  useResendResetCodeMutation,
  useVerifyResetCodeMutation,
  useResetPasswordMutation,
  // driver applicants
  useGetDriverApplicantsQuery,
  useCreateDriverApplicantMutation,
  useUpdateDriverApplicantMutation,
  useDeleteDriverApplicantMutation,
  useGetDriverApplicantsWithFilterQuery,
  useLazyGetDriverApplicantByIdQuery,
  useGetDriverApplicantByIdQuery,
} = apiSlice;