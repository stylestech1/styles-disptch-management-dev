"use client";

import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import toast from "react-hot-toast";
import {
  useAssignTruckToInvestorMutation,
  useCreateUserMutation,
  useGetAvailableInvestorTrucksQuery,
  useGetInvestorsQuery,
  useGetInvestorTrucksQuery,
  useUnassignTruckFromInvestorMutation,
} from "@/redux/slices/apiSlice";
import DataTable, { Column } from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import {
  InvestorDto,
  InvestorTruckItem,
  InvestorTrucksResponse,
  TTruck,
} from "@/types/globalTypes";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { getInvestorTrucks } from "@/utils/investorTrucks";

type CreateInvestorForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
};

const emptyCreateInvestorForm: CreateInvestorForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  passwordConfirmation: "",
};

const investorColumns: Column[] = [
  { key: "name", header: "Name", align: "left" },
  { key: "email", header: "Email", align: "left" },
  { key: "phone", header: "Phone" },
  { key: "assignedTrucks", header: "Assigned Trucks", align: "center" },
  { key: "status", header: "Status" },
  { key: "action", header: "Action" },
];

function truckName(truck: TTruck) {
  return truck.truckNumber || "-";
}

function getTruckList(response?: InvestorTrucksResponse): TTruck[] {
  return getInvestorTrucks(response?.data);
}

function toggleSelectedId(
  id: string,
  checked: boolean,
  setSelectedIds: Dispatch<SetStateAction<string[]>>,
) {
  setSelectedIds((current) =>
    checked
      ? current.includes(id)
        ? current
        : [...current, id]
      : current.filter((selectedId) => selectedId !== id),
  );
}

function InvestorRow({
  investor,
  onEdit,
}: {
  investor: InvestorDto;
  onEdit: () => void;
}) {
  const {
    data: assignedResponse,
    isLoading,
    isError,
    error,
  } = useGetInvestorTrucksQuery(investor.id);
  const assignedTrucks = getTruckList(assignedResponse);

  return (
    <TableRow key={investor.id}>
      <TableCell align="left">{investor.name}</TableCell>
      <TableCell align="left">{investor.email}</TableCell>
      <TableCell align="center">{investor.phone || "-"}</TableCell>
      <TableCell align="left">
        {isLoading ? (
          <CircularProgress size={18} />
        ) : isError ? (
          <Typography color="error" variant="body2">
            {getErrorMessage(error) || "Could not load trucks"}
          </Typography>
        ) : assignedTrucks.length ? (
          <Stack spacing={0.5}>
            {assignedTrucks.map((truck) => (
              <Typography key={truck.truckNumber} variant="body2">
                {truckName(truck)}
              </Typography>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No trucks assigned
          </Typography>
        )}
      </TableCell>
      <TableCell align="center">
        {investor.active === false ? "Inactive" : "Active"}
      </TableCell>
      <TableCell align="center">
        <Button size="small" variant="outlined" onClick={onEdit}>
          Edit
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function InvestorTruckManagement() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [createInvestorOpen, setCreateInvestorOpen] = useState(false);
  const [createInvestorError, setCreateInvestorError] = useState("");
  const [createInvestorForm, setCreateInvestorForm] =
    useState<CreateInvestorForm>(emptyCreateInvestorForm);
  const [editingInvestorId, setEditingInvestorId] = useState("");
  const [selectedAvailableIds, setSelectedAvailableIds] = useState<string[]>([]);
  const [selectedAssignedIds, setSelectedAssignedIds] = useState<string[]>([]);
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const {
    data: investorsResponse,
    isLoading: investorsLoading,
    isError: investorsIsError,
    error: investorsError,
    refetch: refetchInvestors,
  } = useGetInvestorsQuery({ page, limit: pageSize });
  const investors = useMemo(
    () =>
      Array.isArray(investorsResponse)
        ? investorsResponse
        : investorsResponse?.data ?? [],
    [investorsResponse],
  );
  const editingInvestor = investors.find(
    (investor) => investor.id === editingInvestorId,
  );
  const pagination =
    investorsResponse && !Array.isArray(investorsResponse)
      ? investorsResponse.paginationResult ?? null
      : null;
  const {
    data: availableResponse,
    isLoading: availableLoading,
    isError: availableIsError,
    error: availableError,
  } = useGetAvailableInvestorTrucksQuery(undefined, {
    skip: !editingInvestorId,
  });
  const {
    data: assignedResponse,
    isLoading: assignedLoading,
    isError: assignedIsError,
    error: assignedError,
  } = useGetInvestorTrucksQuery(editingInvestorId, {
    skip: !editingInvestorId,
  });
  const [assignTrucks, { isLoading: isAssigning }] =
    useAssignTruckToInvestorMutation();
  const [unassignTrucks, { isLoading: isUnassigning }] =
    useUnassignTruckFromInvestorMutation();
  const [createUser, { isLoading: isCreatingInvestor }] =
    useCreateUserMutation();

  const availableTrucks = getInvestorTrucks(
    availableResponse?.data as InvestorTruckItem[] | undefined,
  );
  const assignedTrucks = getTruckList(assignedResponse);
  const isMutating = isAssigning || isUnassigning;

  const closeCreateInvestor = () => {
    setCreateInvestorOpen(false);
    setCreateInvestorError("");
    setCreateInvestorForm(emptyCreateInvestorForm);
  };

  const handleCreateInvestor = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setCreateInvestorError("");

    if (
      createInvestorForm.password !==
      createInvestorForm.passwordConfirmation
    ) {
      setCreateInvestorError("Passwords do not match.");
      return;
    }

    try {
      await createUser({
        name: createInvestorForm.name.trim(),
        email: createInvestorForm.email.trim(),
        phone: createInvestorForm.phone.trim(),
        password: createInvestorForm.password,
        passwordConfirmation: createInvestorForm.passwordConfirmation,
        role: "investor",
      }).unwrap();
      toast.success("Investor created successfully.");
      closeCreateInvestor();
      void refetchInvestors();
    } catch (error: unknown) {
      setCreateInvestorError(
        getErrorMessage(error) || "Could not create the investor.",
      );
    }
  };

  const closeEditor = () => {
    setEditingInvestorId("");
    setSelectedAvailableIds([]);
    setSelectedAssignedIds([]);
    setAssignmentNotes("");
  };

  const handleAssign = async () => {
    if (!editingInvestorId || !selectedAvailableIds.length) return;
    try {
      await assignTrucks({
        investorId: editingInvestorId,
        truckIds: selectedAvailableIds,
        notes: assignmentNotes.trim(),
      }).unwrap();
      toast.success("Trucks assigned to investor.");
      closeEditor();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Could not assign the selected trucks.");
    }
  };

  const handleUnassign = async () => {
    if (!editingInvestorId || !selectedAssignedIds.length) return;
    try {
      await unassignTrucks({
        investorId: editingInvestorId,
        truckIds: selectedAssignedIds,
      }).unwrap();
      toast.success("Trucks unassigned from investor.");
      setSelectedAssignedIds([]);
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error) || "Could not unassign the selected trucks.",
      );
    }
  };

  const renderInvestorRow = (investor: InvestorDto) => (
    <InvestorRow
      key={investor.id}
      investor={investor}
      onEdit={() => {
        setSelectedAvailableIds([]);
        setSelectedAssignedIds([]);
        setAssignmentNotes("");
        setEditingInvestorId(investor.id);
      }}
    />
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", py: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Investors
          </Typography>
          <Typography color="text.secondary">
            View investor accounts and manage their truck assignments.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateInvestorOpen(true)}
        >
          Create Investor
        </Button>
      </Box>

      {investorsIsError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getErrorMessage(investorsError) || "Unable to load investors."}
        </Alert>
      )}

      <DataTable
        columns={investorColumns}
        data={investors}
        renderRow={renderInvestorRow}
        loading={investorsLoading}
        emptyState={
          <TableRow>
            <TableCell colSpan={investorColumns.length} align="center" sx={{ py: 4 }}>
              No investors found.
            </TableCell>
          </TableRow>
        }
      />
      {pagination && investors.length > 0 && (
        <Pagination
          pagination={pagination}
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          showInfo
        />
      )}

      <Dialog
        open={createInvestorOpen}
        onClose={closeCreateInvestor}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={handleCreateInvestor}>
          <DialogTitle>Create Investor</DialogTitle>
          <DialogContent sx={{ display: "grid", gap: 2, pt: "12px !important" }}>
            {createInvestorError && (
              <Alert severity="error">{createInvestorError}</Alert>
            )}
            <TextField
              label="Name"
              value={createInvestorForm.name}
              onChange={(event) =>
                setCreateInvestorForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
              autoComplete="name"
            />
            <TextField
              label="Email"
              type="email"
              value={createInvestorForm.email}
              onChange={(event) =>
                setCreateInvestorForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              required
              autoComplete="email"
            />
            <TextField
              label="Phone"
              type="tel"
              value={createInvestorForm.phone}
              onChange={(event) =>
                setCreateInvestorForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              required
              autoComplete="tel"
            />
            <TextField
              label="Password"
              type="password"
              value={createInvestorForm.password}
              onChange={(event) =>
                setCreateInvestorForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              required
              inputProps={{ minLength: 6 }}
              autoComplete="new-password"
            />
            <TextField
              label="Confirm Password"
              type="password"
              value={createInvestorForm.passwordConfirmation}
              onChange={(event) =>
                setCreateInvestorForm((current) => ({
                  ...current,
                  passwordConfirmation: event.target.value,
                }))
              }
              required
              inputProps={{ minLength: 6 }}
              autoComplete="new-password"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={closeCreateInvestor} disabled={isCreatingInvestor}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isCreatingInvestor}>
              {isCreatingInvestor ? "Creating..." : "Create"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={Boolean(editingInvestorId)}
        onClose={closeEditor}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Manage trucks{editingInvestor ? ` — ${editingInvestor.name}` : ""}
        </DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Assigned Trucks
                </Typography>
                {assignedIsError ? (
                  <Alert severity="error">
                    {getErrorMessage(assignedError) ||
                      "Unable to load assigned trucks."}
                  </Alert>
                ) : assignedLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : assignedTrucks.length ? (
                  <FormGroup>
                    {assignedTrucks.map((truck) => (
                      <FormControlLabel
                        key={truck?.truckNumber}
                        control={
                          <Checkbox
                            checked={selectedAssignedIds.includes(truck.id)}
                            disabled={isMutating}
                            onChange={(event) =>
                              toggleSelectedId(
                                truck.id,
                                event.target.checked,
                                setSelectedAssignedIds,
                              )
                            }
                          />
                        }
                        label={truckName(truck)}
                      />
                    ))}
                  </FormGroup>
                ) : (
                  <Typography color="text.secondary">
                    No trucks assigned to this investor.
                  </Typography>
                )}
                <Button
                  fullWidth
                  sx={{ mt: 2 }}
                  variant="outlined"
                  color="error"
                  disabled={!selectedAssignedIds.length || isMutating}
                  onClick={handleUnassign}
                >
                  {isUnassigning ? "Unassigning..." : "Unassign selected"}
                </Button>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Available Trucks
                </Typography>
                {availableIsError ? (
                  <Alert severity="error">
                    {getErrorMessage(availableError) ||
                      "Unable to load available trucks."}
                  </Alert>
                ) : availableLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : availableTrucks.length ? (
                  <FormGroup>
                    {availableTrucks.map((truck) => (
                      <FormControlLabel
                        key={truck.id}
                        control={
                          <Checkbox
                            checked={selectedAvailableIds.includes(truck.id)}
                            disabled={isMutating}
                            onChange={(event) =>
                              toggleSelectedId(
                                truck.id,
                                event.target.checked,
                                setSelectedAvailableIds,
                              )
                            }
                          />
                        }
                        label={truckName(truck)}
                      />
                    ))}
                  </FormGroup>
                ) : (
                  <Typography color="text.secondary">
                    No available trucks.
                  </Typography>
                )}
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Assignment notes"
                  value={assignmentNotes}
                  onChange={(event) => setAssignmentNotes(event.target.value)}
                  sx={{ mt: 2 }}
                />
                <Button
                  fullWidth
                  sx={{ mt: 2 }}
                  variant="contained"
                  // disabled={
                  //   !selectedAvailableIds.length ||
                  //   !assignmentNotes.trim() ||
                  //   isMutating
                  // }
                  onClick={handleAssign}
                >
                  {isAssigning ? "Assigning..." : "Assign selected"}
                </Button>
              </CardContent>
            </Card>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditor} disabled={isMutating}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
