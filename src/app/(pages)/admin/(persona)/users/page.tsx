"use client";
import Erros from "@/components/ui/Erros";
import Loading from "@/components/ui/Loading";
import { RootState, useAppSelector } from "@/redux/store";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  IoAdd,
  IoPerson,
  IoBriefcase,
  IoKey,
  IoSettingsOutline,
} from "react-icons/io5";
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
  SxProps,
  TableRow,
  Typography,
} from "@mui/material";
import { setLoading } from "@/redux/slices/uiSlice";
import SearchInput from "@/components/ui/SearchInput";

const Users = () => {
  const [page, setPage] = useState(1);
  const [popup, setPopup] = useState(false);
  const [popupSetting, setPopupSetting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TDispatcher | null>(null);

  // ✅ Search And Filter
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [isFiltered, setIsFiltered] = useState(false);

  const router = useRouter();
  const token = useAppSelector((state: RootState) => state.auth.token);
  const { error, setError } = useError();
  const theme = useAppSelector((state: RootState) => state.palette);

  // RTK Querys
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

  const { data: filteredData } = useGetUserWithSearchQuery(
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

  // Search Hook
  const searchHook = useSearchSubmit({
    onSearch: (term) => {
      setPage(1);
      if (term.trim()) {
        triggerSearchQuery(encodeURIComponent(term));
      }
    },
    onReset: () => {
      setPage(1);
      resetSearchQuery();
      refetchLoads();
    },
  });

  const { searchTerm, isSearching } = searchHook;

  // RTK Mutation
  const [createUser, { isLoading: creatingUser }] = useCreateUserMutation();
  const [updateUserRole, { isLoading: updatingRole }] =
    useUpdateUserRoleMutation();
  const [activateUser, { isLoading: activating }] = useActivateUserMutation();
  const [deactivateUser, { isLoading: deactivating }] =
    useDeactivateUserMutation();

  const user = useMemo(() => {
    if (isSearching && Array.isArray(userByIdData?.data)) {
      return userByIdData.data.flat();
    }
    if (isFiltered && filteredData?.data) {
      return filteredData.data;
    }
    return dispatchersData?.data || [];
  }, [isSearching, isFiltered, userByIdData, filteredData, dispatchersData]);

  const pagination = isFiltered
    ? filteredData?.paginationResult || null
    : dispatchersData?.paginationResult || null;

  // Loading state
  useEffect(() => {
    setLoading(loading && !dispatchersData);
  }, [loading, dispatchersData]);

  // handling Errors
  useEffect(() => {
    const currentError = dispatchersError || userByIdError;
    if (currentError) {
      const errorMessage = getErrorMessage(currentError);
      setError(errorMessage);
      toast.error(errorMessage || "Failed to load data ❌", {
        style: {
          background: "#dc2626",
          color: "#fff",
          borderRadius: "8px",
          fontSize: "14px",
        },
        duration: 4000,
      });
    }
  }, [dispatchersError, userByIdError, setError]);

  // Stats cards
  const statsData = useMemo(() => {
    const statsUsersData = dispatchersData?.stats || [];
    if (!statsUsersData || statsUsersData.length === 0)
      return { totalUsers: 0, drivers: 0, admins: 0, employees: 0 };
    return {
      totalUsers: statsUsersData.total,
      drivers: statsUsersData.drivers,
      admins: statsUsersData.admins,
      employees: statsUsersData.employee,
    };
  }, [dispatchersData?.stats]);

  // FIXME: Create User
  const handleCreateUser = async (userData: {
    name: string;
    email: string;
    phone: string;
    role: string;
    position: string;
    password: string;
    passwordConfirmation: string;
  }) => {
    if (!token) {
      router.replace("/");
      return;
    }
    try {
      await createUser(userData).unwrap();
      toast.success("User created successfully!", {
        style: { background: "#16a34a", color: "#fff" },
      });
      setPopup(false);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage || "Creating user failed ❌");
      throw err;
    }
  };

  // FIXME: Update User Role
  const handleUpdateRole = async (
    userId: string,
    newRole: "admin" | "employee" | "driver" | "superadmin"
  ) => {
    if (!token) {
      router.replace("/");
      return;
    }

    try {
      await updateUserRole({ id: userId, role: newRole }).unwrap();
      toast.success(`Role updated to ${newRole} successfully!`, {
        style: { background: "#16a34a", color: "#fff" },
      });
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage || "Updating role failed ❌");
      throw err;
    }
  };

  // FIXME: Activate User
  const handleActivateUser = async (userId: string) => {
    if (!token) {
      router.replace("/");
      return;
    }

    try {
      await activateUser({ id: userId }).unwrap();
      toast.success("User activated successfully!", {
        style: { background: "#16a34a", color: "#fff" },
      });
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage || "Activating user failed ❌");
      throw err;
    }
  };

  // FIXME: Deactivate User
  const handleDeactivateUser = async (userId: string) => {
    if (!token) {
      router.replace("/");
      return;
    }

    try {
      await deactivateUser({ id: userId }).unwrap();
      toast.success("User deactivated successfully!", {
        style: { background: "#16a34a", color: "#fff" },
      });
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage || "Deactivating user failed ❌");
      throw err;
    }
  };

  // TODO: Function to open settings popup
  const openSettingsPopup = (user: TDispatcher) => {
    setSelectedUser(user);
    setPopupSetting(true);
  };

  // TODO: Close settings popup
  const closeSettingsPopup = () => {
    setPopupSetting(false);
    setSelectedUser(null);
  };

  // TODO: Close create user popup
  const closeCreateUserPopup = () => {
    setPopup(false);
  };

  // TODO: Table
  const renderDispatcherRow = (dispatcher: TDispatcher) => {
    // Styles
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
        key={dispatcher.id || dispatcher.jobId}
        sx={tableRowSx}
        className="hover:bg-slate-50 transition-colors group"
      >
        {/* # */}
        <td className="p-4 text-slate-600 font-medium">{dispatcher.jobId}</td>

        {/* Name */}
        <td className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
              <IoPerson size={14} className="text-slate-600" />
            </div>
            <span className="font-medium text-slate-900">
              {dispatcher.name}
            </span>
          </div>
        </td>

        {/* Email */}
        <td className="p-4 text-slate-700">{dispatcher.email}</td>

        {/* Phone */}
        <td className="p-4 text-slate-700">{dispatcher.phone}</td>

        {/* Role */}
        <td className="p-4">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              dispatcher.role === "admin"
                ? "bg-purple-100 text-purple-800 border border-purple-200"
                : "bg-slate-100 text-slate-800 border border-slate-200"
            }`}
          >
            {dispatcher.role}
          </span>
        </td>

        {/* Position */}
        <td className="p-4 text-slate-700">{dispatcher.position}</td>

        {/* Status */}
        <td className="p-4 text-center">
          {dispatcher.active ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
              Active
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
              Inactive
            </span>
          )}
        </td>

        {/* Setting */}
        <td className="p-4">
          <button
            onClick={() => openSettingsPopup(dispatcher)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-800 hover:text-blue-200 transition-colors"
          >
            <IoSettingsOutline />
            <span>view setting</span>
          </button>
        </td>
      </TableRow>
    );
  };

  // Loading state
  const isInitialLoading = userByIdLoading && !dispatchersData;
  if (isInitialLoading) return <Loading />;

  // Container styles
  const containerSx: SxProps = {
    p: 3,
  };
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
  const newLoadButtonSx: SxProps = {
    py: 1.5,
    px: 4,
    fontWeight: "bold",
    fontSize: "1rem",
    borderRadius: 2,
    width: { xs: "100%", md: "auto" },
    background: theme.currentPalette.primary,
    color: theme.currentPalette.background,
    textTransform: "capitalize",
    "&:hover": {
      background: darken(theme.currentPalette.primary, 0.1),
    },
  };

  return (
    <Box sx={containerSx}>
      {/* Stats Summary */}
      <Box sx={{ mt: 4, mb: 5 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Dispatchers"
            value={statsData.totalUsers}
            icon={IoPerson}
            iconColor={theme.currentPalette.primary}
          />

          <StatsCard
            title="Drivers"
            value={statsData.drivers}
            icon={IoBriefcase}
            iconColor={theme.currentPalette.primary}
          />

          <StatsCard
            title="Admins"
            value={statsData.admins}
            icon={IoKey}
            iconColor={theme.currentPalette.primary}
          />

          <StatsCard
            title="Employees"
            value={statsData.employees}
            icon={IoPerson}
            iconColor={theme.currentPalette.primary}
          />
        </div>
      </Box>

      <Toaster position="top-center" reverseOrder={false} />

      {/* Search */}
      <Box sx={searchFilterContainerSx}>
        <Box>
          <Typography
            variant="h6"
            sx={{ color: theme.currentPalette.primary, fontWeight: 500 }}
          >
            User Details
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.currentPalette.primary, fontWeight: 400 }}
          >
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
            placeholder="Search users by ID...."
            showClearButton
            sx={{
              width: { xs: "100%", sm: "100%", md: 280, lg: 350 },
            }}
            inputSx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: theme.currentPalette.background,
                py: 0.5,
                "&:hover": {
                  borderColor: theme.currentPalette.primary,
                },
              },
            }}
          />

          {/* Add User */}
          <Box>
            <Button
              onClick={() => setPopup(true)}
              variant="contained"
              startIcon={<IoAdd size={22} />}
              sx={newLoadButtonSx}
            >
              New User
            </Button>
          </Box>
        </Box>
      </Box>

      {error && (
        <Box sx={{ mb: 3 }}>
          <Erros message={error} />
        </Box>
      )}

      {/* Data Table */}
      <DataTable
        columns={dispatcherColumns}
        data={user}
        renderRow={renderDispatcherRow}
        loading={
          (isSearching && userByIdLoading) ||
          (isFiltered && filteredData) ||
          (loading && !dispatchersData)
        }
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

      {/* Pagination */}
      {!isFiltered && !isSearching && pagination && user.length > 0 && (
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
