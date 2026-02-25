"use client";
import React, { useEffect, useMemo, useState } from "react";
import { RootState, useAppSelector } from "@/redux/store";
import { TCustomer } from "@/types/globalTypes";
import Loading from "@/components/ui/Loading";
import toast, { Toaster } from "react-hot-toast";
import Erros from "@/components/ui/Erros";
import { IoAdd, IoPencil, IoPerson, IoTrash } from "react-icons/io5";
import {
  Button,
  TableRow,
  Box,
  IconButton,
  Tooltip,
  Chip,
  alpha,
  SxProps,
  Typography,
  Dialog,
  darken,
} from "@mui/material";

import { getErrorMessage } from "@/utils/getErrorMessage";
import Pagination from "@/components/ui/Pagination";
import {
  useCreateCustomerMutation,
  useDeleteCustomerMutation,
  useGetCustomersWithPaginationQuery,
  useGetCustomerWithFilterQuery,
  useLazyGetCustomerByIdQuery,
  useUpdateCustomerMutation,
} from "@/redux/slices/apiSlice";
import useError from "@/hook/useError";
import StatsCard from "@/components/ui/StatsCard";
import { Dayjs } from "dayjs";
import DataTable from "@/components/ui/DataTable";
import { CustomerForm } from "./CustomerForm";
import { customerColumns } from "@/data/customerTables";
import { useSearchSubmit } from "@/hook/useSearchSubmit";
import { setLoading } from "@/redux/slices/uiSlice";
import SearchInput from "../ui/SearchInput";

const CustomerPage = () => {
  const user = useAppSelector((state) => state.auth.user);
  const { error, setError } = useError();
  const theme = useAppSelector((state: RootState) => state.palette);

  // ✅ Search And Filter
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [isFiltered, setIsFiltered] = useState(false);
  const [page, setPage] = useState(1);

  // 🔹 API Queries
  const {
    data: customersData,
    isLoading: customersLoading,
    error: customerError,
    refetch: refetchCustomer,
  } = useGetCustomersWithPaginationQuery(
    { page, limit: 10 },
    {
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: false,
    }
  );
  const [
    triggerSearchQuery,
    {
      data: customerByIdData,
      isLoading: customerByIdLoading,
      error: customerByIdError,
      reset: resetSearchQuery,
    },
  ] = useLazyGetCustomerByIdQuery();
  const { data: filteredData } = useGetCustomerWithFilterQuery(
    {
      from: fromDate ? fromDate.format("YYYY-MM-DD") : undefined,
      to: toDate ? toDate.format("YYYY-MM-DD") : undefined,
      page,
      limit: 10,
    },
    { skip: !isFiltered }
  );

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
      refetchCustomer();
    },
  });
  const { searchTerm, isSearching } = searchHook;

  // 🔹 API Mutations
  const [createCustomer, { isLoading: isCreating }] =
    useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isUpdating }] =
    useUpdateCustomerMutation();
  const [originalData, setOriginalData] = useState<Partial<TCustomer>>({});

  const customer = useMemo(() => {
    if (isSearching && Array.isArray(customerByIdData?.data)) {
      return customerByIdData.data.flat();
    }
    if (isFiltered && filteredData?.data) {
      return filteredData.data;
    }
    return customersData?.data || [];
  }, [isSearching, isFiltered, customerByIdData, filteredData, customersData]);

  const pagination = isFiltered
    ? filteredData?.paginationResult || null
    : customersData?.paginationResult || null;

  // Loading state
  useEffect(() => {
    setLoading(customersLoading && !customersData);
  }, [customersLoading, customersData]);

  // Stats cards
  const statsData = useMemo(() => {
    const statsCustomerData = customersData?.stats || [];
    if (!statsCustomerData || statsCustomerData.length === 0)
      return { totalCustomers: 0 };
    return {
      totalCustomers: statsCustomerData.total,
      shipper: statsCustomerData.shipper,
      receiver: statsCustomerData.receiver,
    };
  }, [customersData?.stats]);

  // ✅ Modal States
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<TCustomer>>({});
  const [editMode, setEditMode] = useState(false);

  // ✅ Handle Open (Add / Edit)
  const handleOpenAdd = () => {
    setFormData({});
    setEditMode(false);
    setOpen(true);
  };

  // ✅ Handle Edit
  const handleEditClick = (customer: TCustomer) => {
    setOriginalData(customer);
    setFormData({
      id: customer.id,
      customerId: customer.customerId,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      feedback: customer.feedback,
      type: customer.type,
    });
    setEditMode(true);
    setOpen(true);
  };

  // ✅ Handle Form Change
  const handleFormChange = <K extends keyof TCustomer>(
    field: K,
    value: TCustomer[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getChangedFields = (
    original: Partial<TCustomer>,
    updated: Partial<TCustomer>
  ): Partial<TCustomer> => {
    const changedFields: Record<string, unknown> = {};

    Object.entries(updated).forEach(([key, value]) => {
      const k = key as keyof TCustomer;
      if (value !== original[k] && value !== undefined) {
        changedFields[key] = value;
      }
    });

    return changedFields as Partial<TCustomer>;
  };

  // handling Errors
  useEffect(() => {
    const currentError = customerError || customerByIdError;
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
  }, [customerError, customerByIdError, setError]);

  // ✅ Create Customer
  const handleCreate = async () => {
    if (!user?.id) {
      toast.error("User not found!");
      return;
    }

    try {
      await createCustomer({
        ...formData,
        addedBy: user.id,
      }).unwrap();
      toast.success("✅ Customer created successfully!");
      setOpen(false);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage || "Creating customer failed ❌");
      throw err;
    }
  };

  // ✅ Update Customer
  const handleUpdate = async () => {
    if (!formData?.id) {
      toast.error("Missing customer ID");
      return;
    }

    const changedFields = getChangedFields(originalData, formData);

    if (Object.keys(changedFields).length === 0) {
      toast("⚠️ No changes detected.");
      return;
    }

    try {
      await updateCustomer({
        id: formData.id,
        body: changedFields,
      }).unwrap();
      toast.success("✅ Customer updated successfully!");
      setOpen(false);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage || "Updating customer failed ❌");
      throw err;
    }
  };

  // ✅ Delete Customer with MUI Toast
  const [customerToDelete, setCustomerToDelete] = useState<{
    id: string;
    customerId?: number;
  } | null>(null);
  const [deleteCustomer] = useDeleteCustomerMutation();
  const [deleteToast, setDeleteToast] = useState({ open: false, message: "" });

  // ✅ Delete Customer handler
  const handleDelete = async (id: string, customerId?: number) => {
    setDeleteToast({
      open: true,
      message: `Are you sure you want to delete customer #${customerId}?`,
    });
    setCustomerToDelete({ id, customerId });
  };

  // ✅ Confirm Delete
  const confirmDelete = async () => {
    if (!customerToDelete) return;

    try {
      await deleteCustomer(customerToDelete.id).unwrap();
      toast.success(
        `✅ Customer #${customerToDelete.customerId} deleted successfully!`
      );
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage || "Deleting customer failed ❌");
      throw err;
    } finally {
      setDeleteToast({ open: false, message: "" });
      setCustomerToDelete(null);
    }
  };

  // ✅ Cancel Delete
  const cancelDelete = () => {
    setDeleteToast({ open: false, message: "" });
    setCustomerToDelete(null);
  };

  // ✅ Render Table Row - Similar to LoadsPage
  const renderCustomerRow = (customer: TCustomer) => {
    // Styles
    const tableRowSx: SxProps = {
      bgcolor: theme.currentPalette.background,
      "&:hover": {
        backgroundColor: alpha(theme.currentPalette.primary, 0.05),
        cursor: "pointer",
      },
      transition: "all 0.2s ease-in-out",
    };
    return (
      <TableRow
        sx={tableRowSx}
        key={customer.id || customer.customerId}
        className="transition-colors group"
      >
        {/* Customer ID */}
        <td className="p-4 text-center">
          <span className="text-sm px-2 py-1 rounded text-slate-700 font-medium">
            {customer.customerId}
          </span>
        </td>

        {/* Name */}
        <td className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center">
              <IoPerson size={12} className="text-slate-600" />
            </div>
            <div>
              <div className="font-medium text-slate-900 text-sm">
                {customer.name || "-"}
              </div>
              <div className="text-xs text-slate-500">
                {customer.email || "-"}
              </div>
              <div className="text-xs text-slate-500">
                {customer.phone || "-"}
              </div>
            </div>
          </div>
        </td>

        {/* Address */}
        <td className="p-4 text-center text-slate-700">
          {customer.address || "-"}
        </td>

        {/* feedback */}
        <td className="p-4 text-center font-semibold text-emerald-700">
          {customer.feedback}
        </td>

        {/* Type */}
        <td className="p-4 text-center">
          <Chip label={customer.type} variant="outlined" size="small" />
        </td>

        {/* Actions */}
        <td className="p-4 text-center">
          <div className="flex items-center justify-center gap-1">
            <Tooltip title="Edit Customer">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick(customer);
                }}
                sx={{
                  color: theme.currentPalette.primary,
                  "&:hover": {
                    backgroundColor: alpha(theme.currentPalette.primary, 0.1),
                  },
                }}
              >
                <IoPencil size={16} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete Customer">
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(customer.id, customer.customerId);
                }}
                sx={{
                  "&:hover": {
                    backgroundColor: alpha("#dc2626", 0.1),
                  },
                }}
              >
                <IoTrash size={16} />
              </IconButton>
            </Tooltip>
          </div>
        </td>
      </TableRow>
    );
  };

  // Loading state
  const isInitialLoading = customerByIdLoading && !customersData;
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
      <Toaster position="top-center" />

      {/* Stats Summary */}
      <Box sx={{ mt: 4, mb: 5 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 my-10">
          <StatsCard
            title="Total Customers"
            value={statsData.totalCustomers}
            icon={IoPerson}
            iconColor={theme.currentPalette.primary}
          />

          <StatsCard
            title="Total Shippers"
            value={statsData.shipper}
            icon={IoPerson}
            iconColor={theme.currentPalette.primary}
          />

          <StatsCard
            title="Total Receivers"
            value={statsData.receiver}
            icon={IoPerson}
            iconColor={theme.currentPalette.primary}
          />
        </div>
      </Box>

      {/* Search */}
      <Box sx={searchFilterContainerSx}>
        <Box>
          <Typography
            variant="h6"
            sx={{ color: theme.currentPalette.primary, fontWeight: 500 }}
          >
            Customer Details
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.currentPalette.primary, fontWeight: 400 }}
          >
            Ckeck list of all customers
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
            placeholder="Search Customers by ID"
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

          {/* Add Button */}
          <Box>
            <Button
              onClick={handleOpenAdd}
              variant="contained"
              startIcon={<IoAdd size={22} />}
              sx={newLoadButtonSx}
            >
              Add Customer
            </Button>
          </Box>
        </Box>
      </Box>

      {error && (
        <Box sx={{ mb: 3 }}>
          <Erros message={error} />
        </Box>
      )}

      {/* Table For Customer - Using DataTable Component */}
      <DataTable
        columns={customerColumns}
        data={customer}
        renderRow={renderCustomerRow}
        loading={
          (isSearching && customerByIdLoading) ||
          (isFiltered && filteredData) ||
          (customersLoading && !customersData)
        }
      />

      {/* Pagination */}
      {!isFiltered && !isSearching && pagination && customer.length > 0 && (
        <Pagination
          pagination={pagination}
          page={page}
          setPage={setPage}
          pageSize={10}
          showInfo={true}
        />
      )}

      {/* Customer Form Modal */}
      <CustomerForm
        open={open}
        onClose={() => setOpen(false)}
        formData={formData}
        onChange={handleFormChange}
        onSubmit={editMode ? handleUpdate : handleCreate}
        editMode={editMode}
        isLoading={isCreating || isUpdating}
      />

      {/* MUI Delete Confirmation Toast */}
      {deleteToast.open && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.1)",
            backdropFilter: "blur(2px)",
            zIndex: 1299,
          }}
        />
      )}

      {/* Delete Confirmation Dialog - Centered */}
      <Dialog
        open={deleteToast.open}
        onClose={cancelDelete}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            minWidth: 300,
            maxWidth: 400,
            margin: 2,
          },
        }}
        sx={{
          zIndex: 1300,
          "& .MuiDialog-container": {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
        }}
      >
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontWeight: 600, color: "text.primary" }}
          >
            Confirm Delete
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            {deleteToast.message}
          </Typography>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={cancelDelete}
              sx={{
                borderRadius: 2,
                minWidth: 80,
                borderColor: "grey.400",
                "&:hover": {
                  borderColor: "grey.600",
                  backgroundColor: "grey.50",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={confirmDelete}
              sx={{
                borderRadius: 2,
                minWidth: 80,
                backgroundColor: "error.main",
                "&:hover": {
                  backgroundColor: "error.dark",
                },
              }}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};

export default CustomerPage;
