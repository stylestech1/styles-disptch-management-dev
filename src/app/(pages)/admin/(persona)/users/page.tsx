/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Erros from "@/components/ui/Erros";
import Loading from "@/components/ui/Loading";
import { RootState, useAppSelector } from "@/redux/store";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { TDispatcher } from "@/types/globalTypes";
import useError from "@/hook/useError";
import Pagination from "@/components/ui/Pagination";
import DataTable from "@/components/ui/DataTable";
import { dispatcherColumns } from "@/data/dispatcherTables";
import StatsCard from "@/components/ui/StatsCard";
import {
  useGetAllDispatchersQuery,
  useCreateUserMutation,
  useUpdateUserRoleMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
  useGetUserWithSearchQuery,
  useLazyGetUserByIdQuery,
} from "@/redux/slices/apiSlice";
import { getErrorMessage } from "@/utils/getErrorMessage";
import UserSettingsModal from "@/components/users/UserSettingsModal";
import CreateUserModal from "@/components/users/CreateUserModal";
import { Dayjs } from "dayjs";
import { useSearchSubmit } from "@/hook/useSearchSubmit";
import {
  alpha,
  Box,
  Button,
  darken,
  FormControl,
  MenuItem,
  OutlinedInput,
  Select,
  SxProps,
  TableRow,
  Typography,
} from "@mui/material";
import SearchInput from "@/components/ui/SearchInput";
import { CircleUserRound, ShieldUser, UsersRound, UserPen, UserRoundCog } from "lucide-react";

type RoleFilter = "all" | "employee" | "driver" | "admin";
const Users = () => {
  const [page, setPage] = useState(1);
  const [popup, setPopup] = useState(false);
  const [popupSetting, setPopupSetting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TDispatcher | null>(null);

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [isFiltered, setIsFiltered] = useState(false);

  const router = useRouter();
  const token = useAppSelector((state: RootState) => state.auth.token);
  const { error, setError } = useError();
  const theme = useAppSelector((state: RootState) => state.palette);


  const containerSx: SxProps = { p: 3 };

  const searchFilterContainerSx: SxProps = {
    display: "flex",
    flexDirection: { xs: "column", md: "row" },
    alignItems: { xs: "flex-start", md: "center" },
    justifyContent: "space-between",
    gap: { xs: 2, md: 0 },
    p: 2,
    my: 2,
    border: `1px solid ${alpha(theme.currentPalette.primary, 0.3)}`,
    borderRadius: 2,
    backgroundColor: theme.currentPalette.background,
  };

  const controlHeight = 46;

  const commonOutlinedSx: SxProps = {
    height: controlHeight,
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: alpha(theme.currentPalette.primary, 0.35),
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: alpha(theme.currentPalette.primary, 0.7),
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.currentPalette.primary,
    },
  };

  const searchInputSx: any = {
    "& .MuiOutlinedInput-root": {
      ...commonOutlinedSx,
      borderRadius: 2,
      backgroundColor: theme.currentPalette.background,
      px: 1,
    },
  };

  const selectSx: SxProps = {
    minWidth: 140,
    "& .MuiOutlinedInput-root": {
      ...commonOutlinedSx,
      borderRadius: 2,
      backgroundColor: theme.currentPalette.background,
    },
    "& .MuiSelect-select": {
      display: "flex",
      alignItems: "center",
      height: "100%",
      py: 0,
    },
  };

  const addButtonSx: SxProps = {
    height: controlHeight,
    px: 3,
    fontWeight: 700,
    borderRadius: 2,
    width: { xs: "100%", md: "auto" },
    background: theme.currentPalette.primary,
    color: theme.currentPalette.background,
    textTransform: "capitalize",
    whiteSpace: "nowrap",
    "&:hover": {
      background: darken(theme.currentPalette.primary, 0.1),
    },
  };


  const {
    data: dispatchersData,
    error: dispatchersError,
    isLoading: loading,
    refetch: refetchLoads,
  } = useGetAllDispatchersQuery(
    { page, limit: 10 },
    {
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: false,
    } 
  );

  const {
    data: filteredData,
    error: filteredError,
    isLoading: filteredLoading,
  } = useGetUserWithSearchQuery(
    {
      from: fromDate ? fromDate.format("YYYY-MM-DD") : undefined,
      to: toDate ? toDate.format("YYYY-MM-DD") : undefined,
      page,
      limit: 10,
    },
    { skip: !isFiltered }
  );

  const [
    triggerSearchQuery,
    {
      data: userByIdData,
      isLoading: userByIdLoading,
      error: userByIdError,
      reset: resetSearchQuery,
    },
  ] = useLazyGetUserByIdQuery();

  const isNumericId = (v: string) => /^\d+$/.test(v.trim());

  const searchHook = useSearchSubmit({
    onSearch: (term) => {
      const t = term.trim();
      setPage(1);
      if (!t) {
        setRoleFilter("all");
        resetSearchQuery();
        setError("");
        refetchLoads();
        return;
      }
      if (!isNumericId(t)) {
        resetSearchQuery();
        setError("Search users by ID");
        return;
      }
      setError("");
      triggerSearchQuery(encodeURIComponent(t));
    },

    onReset: () => {
      setPage(1);
      setRoleFilter("all");
      resetSearchQuery();
      setError("");
      refetchLoads();
    },
  });
  const { isSearching } = searchHook;


  const [createUser, { isLoading: creatingUser }] = useCreateUserMutation();
  const [updateUserRole, { isLoading: updatingRole }] = useUpdateUserRoleMutation();
  const [activateUser, { isLoading: activating }] = useActivateUserMutation();
  const [deactivateUser, { isLoading: deactivating }] = useDeactivateUserMutation();


  const users = useMemo(() => {
    if (isSearching && Array.isArray(userByIdData?.data)) return userByIdData.data.flat();
    if (isFiltered && Array.isArray(filteredData?.data)) return filteredData.data;
    return dispatchersData?.data || [];
  }, [isSearching, isFiltered, userByIdData, filteredData, dispatchersData]);

  const filteredUsers = useMemo(() => {
    if (roleFilter === "all") return users;

    return users.filter((u: any) => {
      const role = String(u?.role ?? "").toLowerCase();
      return role === roleFilter.toLowerCase();
    });
  }, [users, roleFilter]);
  const pagination = isFiltered
    ? filteredData?.paginationResult || null
    : dispatchersData?.paginationResult || null;

  useEffect(() => {
    const currentError = dispatchersError || userByIdError || filteredError;
    if (!currentError) return;

    const errorMessage = getErrorMessage(currentError);

    setError(errorMessage);
    toast.error(errorMessage || "Failed to load data", { duration: 4000 });
  }, [dispatchersError, userByIdError, filteredError, setError]);


  const statsData = useMemo(() => {
    const statsUsersData: any = dispatchersData?.stats;
    if (!statsUsersData) return { totalUsers: 0, drivers: 0, admins: 0, employees: 0 };

    const s = Array.isArray(statsUsersData) ? statsUsersData[0] : statsUsersData;

    return {
      totalUsers: Number(s?.total ?? 0),
      drivers: Number(s?.drivers ?? 0),
      admins: Number(s?.admins ?? 0),
      employees: Number(s?.employee ?? s?.employees ?? 0),
    };
  }, [dispatchersData?.stats]);


  const handleCreateUser = async (userData: {
    name: string;
    email: string;
    phone: string;
    role: string;
    position: string;
    password: string;
    passwordConfirmation: string;
  }) => {
    if (!token) return router.replace("/");
    try {
      await createUser(userData).unwrap();
      toast.success("User created successfully!");
      setPopup(false);
      await refetchLoads();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage || "Creating user failed ");
      throw err;
    }
  };

  const handleUpdateRole = async (
    userId: string,
    newRole: "admin" | "employee" | "driver" | "superAdmin"
  ) => {
    if (!token) return router.replace("/");
    try {
      await updateUserRole({ id: userId, role: newRole }).unwrap();
      toast.success(`Role updated to ${newRole} successfully!`);
      await refetchLoads();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage || "Updating role failed ");
      throw err;
    }
  };

  const handleActivateUser = async (userId: string) => {
    if (!token) return router.replace("/");
    try {
      await activateUser({ id: userId }).unwrap();
      toast.success("User activated successfully!");
      await refetchLoads();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage || "Activating user failed ");
      throw err;
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!token) return router.replace("/");
    try {
      await deactivateUser({ id: userId }).unwrap();
      toast.success("User deactivated successfully!");
      await refetchLoads();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage || "Deactivating user failed ");
      throw err;
    }
  };

  const openSettingsPopup = (u: TDispatcher) => {
    setSelectedUser(u);
    setPopupSetting(true);
  };

  const closeSettingsPopup = () => {
    setPopupSetting(false);
    setSelectedUser(null);
  };

  const closeCreateUserPopup = () => setPopup(false);

  const renderDispatcherRow = (dispatcher: TDispatcher) => {
    const tableRowSx: SxProps = {
      bgcolor: theme.currentPalette.background,
      "&:hover": {
        bgcolor: alpha(theme.currentPalette.primary, 0.1),
        cursor: "pointer",
      },
      transition: "all 0.2s ease-in-out",
    };

    return (
      <TableRow
        key={(dispatcher as any).id || (dispatcher as any).jobId}
        sx={tableRowSx}
        className="hover:bg-slate-50 transition-colors group"
      >
        {/* job id */}
        <td className="p-4 text-slate-600 font-medium text-center">
          {(dispatcher as any).jobId}
        </td>
        {/* name  */}
        <td className="p-4 text-slate-700 text-center">{dispatcher.name}</td>
        {/* role and position */}
        <td className="p-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <span
              className="px-3 py-1 rounded-[8px]"
              style={{
                color: theme.currentPalette.primary,
                backgroundColor: alpha(theme.currentPalette.primary, 0.1),
              }}
            >
              {(dispatcher as any).role}
            </span>
            {(dispatcher as any).role?.toLowerCase() === "employee" && (dispatcher as any).position ? (
              <span className="text-gray-500 text-sm">{(dispatcher as any).position}</span>
            ) : null}
          </div>
        </td>
        {/* email */}
        <td className="p-4 text-slate-700 text-center">{dispatcher.email}</td>
        {/* phone */}
        <td className="p-4 text-slate-700 text-center">{(dispatcher as any).phone}</td>
        {/* status  */}
        <td className="p-4 text-center">
          {(() => {
            const isActive = Boolean((dispatcher as any).active);
            return (
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-medium"
                style={{
                  backgroundColor: isActive
                    ? theme.currentPalette.primary
                    : alpha(theme.currentPalette.primary, 0.1),
                  color: isActive ? "#ffffff" : theme.currentPalette.primary,
                }}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            );
          })()}
        </td>
        {/* action */}
        <td className="p-4">
          <div className="flex justify-center">
            <button
              type="button"
              style={{ color: theme.currentPalette.primary }}
              onClick={() => openSettingsPopup(dispatcher)}
              className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            >
              <UserPen size={18} />
            </button>
          </div>
        </td>
      </TableRow>
    );
  };

  const isInitialLoading = loading && !dispatchersData && !isSearching;
  if (isInitialLoading) return <Loading />;

  return (
    <Box sx={containerSx}>
      <Box sx={{ mt: 4, mb: 5 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Dispatchers"
            value={statsData.totalUsers}
            icon={CircleUserRound}
            iconColor={theme.currentPalette.primary}
          />
          <StatsCard
            title="Drivers"
            value={statsData.drivers}
            icon={ShieldUser}
            iconColor={theme.currentPalette.primary}
          />
          <StatsCard
            title="Employees"
            value={statsData.employees}
            icon={UsersRound}
            iconColor={theme.currentPalette.primary}
          />
          <StatsCard
            title="Admins"
            value={statsData.admins}
            icon={UserRoundCog}
            iconColor={theme.currentPalette.primary}
          />
        </div>
      </Box>

      <Toaster position="top-center" reverseOrder={false} />

      {/* Top Bar */}
      <Box sx={searchFilterContainerSx}>
        <Box>
          <Typography variant="h6" sx={{ color: theme.currentPalette.primary, fontWeight: 500 }}>
            User Details
          </Typography>
          <Typography variant="body2" sx={{ color: theme.currentPalette.primary, fontWeight: 400 }}>
            Ckeck list of all users
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            gap: 2,
            width: { xs: "100%", md: "auto" },
          }}
        >
          {/* Search */}
          <SearchInput
            searchHook={searchHook}
            placeholder="Search users by ID"
            showClearButton
            sx={{ width: { xs: "100%", md: 360 } }}
            inputSx={searchInputSx}
          />

          {/* role Filter */}
          <Box sx={{ width: { xs: "100%", md: "auto" } }}>
            <Box sx={selectSx}>
              <FormControl fullWidth>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                  displayEmpty
                  input={<OutlinedInput />}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        color: theme.currentPalette.primary,
                        mt: 1,
                        bgcolor: "#fff",
                      },
                    },
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="employee">Employee</MenuItem>
                  <MenuItem value="driver">Driver</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Add User */}
          <Button onClick={() => setPopup(true)} variant="contained" sx={addButtonSx}>
            Add User
          </Button>
        </Box>
      </Box>

      {error && (
        <Box sx={{ mb: 3 }}>
          <Erros message={error} />
        </Box>
      )}

      {/* Table */}
      <DataTable
        columns={dispatcherColumns}
        data={filteredUsers}
        renderRow={renderDispatcherRow}
        loading={Boolean((isSearching && userByIdLoading) || (isFiltered && filteredLoading) || (loading && !dispatchersData))}
      />

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={popup}
        onClose={closeCreateUserPopup}
        onSubmit={handleCreateUser}
        isLoading={creatingUser}
      />

      {/* User Settings Modal */}
      <UserSettingsModal
        isOpen={popupSetting}
        onClose={closeSettingsPopup}
        user={selectedUser}
        onUpdateRole={handleUpdateRole}
        onActivateUser={handleActivateUser}
        onDeactivateUser={handleDeactivateUser}
        isLoading={updatingRole || activating || deactivating}
      />

      {!isFiltered && !isSearching && roleFilter === "all" && pagination && filteredUsers.length > 0 && (
        <Pagination
          pagination={pagination}
          page={page}
          setPage={setPage}
          pageSize={10}
          showInfo={false}
        />
      )}
    </Box>
  );
};

export default Users;