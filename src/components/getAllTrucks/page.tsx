"use client";

import { useEffect, useMemo, useState } from "react";

import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    TableCell,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";

import {
    FileText,
    MapPin,
    Pencil,
    Search,
    Truck,
    X,
} from "lucide-react";

import toast, { Toaster } from "react-hot-toast";

import DataTable, { Column } from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";

import {
    useGetMyTruckAssignmentsQuery,
    useGetTruckDispatchersQuery,
    useUpdateMyTruckAssignmentMutation,
} from "@/redux/slices/apiSlice";

import { useAppSelector } from "@/redux/store";
import { getErrorMessage } from "@/utils/getErrorMessage";

/* =========================================================
   TYPES
========================================================= */

type CurrentLoad = {
    id: string;
    loadId: string;
    origin: string;
    destination: string[];
    status: "pending" | "in_transit";
    pickupAtFrom: string;
    pickupAtTo?: string;
    deliveredAt?: string;
    truckType: string;
};

type AssignedDriver = {
    name: string;
    driverId: string;
};

type TruckType = {
    id: string;
    truckNumber: string;
    model: string;

    type?: "van" | "reefer";
    source?: "company" | "other";

    year?: number;
    capacity?: number;
    fuelPerMile?: number;
    totalMileage?: number;

    status?: "available" | "busy" | "inactive";

    currentLocation?: string;

    assignedDriver?: AssignedDriver | null;

    currentLoad?: CurrentLoad | null;
};

type Dispatcher = {
    id: string;
    name: string;
    email: string;

    phone?: string;
    role?: string;
    jobId?: number;
    active?: boolean;
};

type Assignment = {
    id: string;

    truck: TruckType;
    dispatcher: Dispatcher;

    status: "active" | "inactive";

    notes?: string;

    assignedBy?: string;
    updatedBy?: string;

    createdAt?: string;
    updatedAt?: string;
};

type AssignmentsResponse = {
    message?: string;
    data?: Assignment[];

    results?: number;

    paginationResult?: {
        currentPage?: number;
        limit?: number;
        totalDocs?: number;
        totalPages?: number;
    };
};

/* =========================================================
   TABLE COLUMNS
========================================================= */

const columns: Column[] = [
    {
        key: "truck",
        header: "Truck",
        width: "16%",
    },
    {
        key: "dispatcher",
        header: "Dispatcher",
        width: "20%",
    },
    {
        key: "location",
        header: "Current Location",
        width: "20%",
    },
    {
        key: "notes",
        header: "Notes",
        width: "24%",
    },
    {
        key: "status",
        header: "Status",
        width: "12%",
    },
    {
        key: "actions",
        header: "Actions",
        width: "8%",
    },
];

/* =========================================================
   HELPERS
========================================================= */

const unwrapAssignments = (response: unknown): Assignment[] => {
    if (!response) return [];

    if (Array.isArray(response)) {
        return response as Assignment[];
    }

    if (typeof response !== "object") {
        return [];
    }

    const result = response as AssignmentsResponse;

    if (Array.isArray(result.data)) {
        return result.data;
    }

    return [];
};

const formatDate = (date?: string) => {
    if (!date) return "-";

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
        return "-";
    }

    return value.toLocaleString();
};

/* =========================================================
   COMPONENT
========================================================= */

export default function TruckDispatcher() {
    const currentUser = useAppSelector((state) => state.auth.user);

    const role = currentUser?.role?.toLowerCase();

    const isAdmin = role === "admin";

    /* =======================================================
       STATES
    ======================================================= */

    const [page, setPage] = useState(1);

    const limit = 10;

    const [search, setSearch] = useState("");

    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [viewingAssignment, setViewingAssignment] =
        useState<Assignment | null>(null);

    const [editingAssignment, setEditingAssignment] =
        useState<Assignment | null>(null);

    const [notes, setNotes] = useState("");

    const [currentLocation, setCurrentLocation] = useState("");

    /* =======================================================
       SEARCH DEBOUNCE
    ======================================================= */

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, 350);

        return () => clearTimeout(timer);
    }, [search]);

    /* =======================================================
       ADMIN REQUEST
    ======================================================= */

    const {
        data: adminResponse,
        isLoading: isAdminLoading,
        isFetching: isAdminFetching,
        isError: isAdminError,
        error: adminError,
    } = useGetTruckDispatchersQuery(
        {
            page,
            limit,
            keyword: debouncedSearch || undefined,
        },
        {
            skip: !isAdmin,
        }
    );

    /* =======================================================
       DISPATCHER REQUEST
    ======================================================= */

    const {
        data: dispatcherResponse,
        isLoading: isDispatcherLoading,
        isFetching: isDispatcherFetching,
        isError: isDispatcherError,
        error: dispatcherError,
    } = useGetMyTruckAssignmentsQuery(undefined, {
        skip: isAdmin || !role,
    });


    const [updateAssignment, { isLoading: isUpdating }] =
        useUpdateMyTruckAssignmentMutation();



    const response = isAdmin
        ? adminResponse
        : dispatcherResponse;

    const assignments = useMemo(
        () => unwrapAssignments(response),
        [response]
    );



    const adminData = adminResponse as
        | AssignmentsResponse
        | undefined;

    const paginationResult =
        adminData?.paginationResult
            ? {
                currentPage: Number(
                    adminData.paginationResult.currentPage ?? page
                ),

                totalPages: Number(
                    adminData.paginationResult.totalPages ?? 1
                ),

                total: Number(
                    adminData.paginationResult.totalDocs ?? 0
                ),
            }
            : null;

    /* =======================================================
       LOADING / ERROR
    ======================================================= */

    const isLoading = isAdmin
        ? isAdminLoading || isAdminFetching
        : isDispatcherLoading || isDispatcherFetching;

    const isError = isAdmin
        ? isAdminError
        : isDispatcherError;

    const requestError = isAdmin
        ? adminError
        : dispatcherError;

    /* =======================================================
       VIEW
    ======================================================= */

    const openDetails = (assignment: Assignment) => {
        setViewingAssignment(assignment);
    };

    const closeDetails = () => {
        setViewingAssignment(null);
    };


    const openEdit = (assignment: Assignment) => {
        setEditingAssignment(assignment);
        setNotes(assignment.notes ?? "");
        setCurrentLocation(assignment.truck.currentLocation ?? "");
    };

    const closeEdit = () => {
        setEditingAssignment(null);

        setNotes("");

        setCurrentLocation("");
    };

    const saveEdit = async () => {
        if (!editingAssignment?.id) {
            toast.error("Assignment ID is missing");
            return;
        }

        try {
            await updateAssignment({
                assignmentId: editingAssignment.id,
                notes,
                currentLocation,
            }).unwrap();

            toast.success("Assignment updated successfully");
            closeEdit();
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };


    return (
        <Box
            sx={{
                p: {
                    xs: 2,
                    md: 3,
                },
            }}
        >
            <Toaster position="top-right" />

            <Box
                sx={{
                    mb: 2.5,

                    p: {
                        xs: 2,
                        md: 2.5,
                    },

                    display: "flex",

                    alignItems: {
                        xs: "stretch",
                        md: "center",
                    },

                    justifyContent: "space-between",

                    gap: 2,

                    flexWrap: "wrap",

                    bgcolor: "background.paper",

                    border: "1px solid",

                    borderColor: "divider",

                    borderRadius: 2,
                }}
            >
                <Box>
                    <Typography
                        variant="h5"
                        sx={{
                            color: "primary.main",
                            fontWeight: 700,
                        }}
                    >
                        {isAdmin
                            ? "Truck Dispatcher Assignments"
                            : "My Trucks"}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        {isAdmin
                            ? "View and manage assigned trucks"
                            : "View your assigned trucks and details"}
                    </Typography>
                </Box>

                {/* SEARCH */}

                <Box
                    sx={{
                        display: "flex",
                        gap: 1.5,
                        flexWrap: "wrap",

                        width: {
                            xs: "100%",
                            md: "auto",
                        },
                    }}
                >
                    {/* <TextField
                        size="small"
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);

                            setPage(1);
                        }}
                        placeholder="Search truck, dispatcher..."
                        inputProps={{
                            "aria-label":
                                "Search truck assignments",
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={18} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            minWidth: {
                                xs: 0,
                                md: 285,
                            },

                            flex: {
                                xs: 1,
                                md: "initial",
                            },
                        }}
                    /> */}
                </Box>
            </Box>


            {!role ? (
                <Alert
                    severity="info"
                    sx={{ mb: 2 }}
                >
                    Your role is not available yet.
                </Alert>
            ) : isError ? (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                >
                    {getErrorMessage(requestError)}
                </Alert>
            ) : null}



            <DataTable
                columns={columns}
                data={assignments}
                loading={isLoading}
                renderRow={(assignment: Assignment, index) => {
                    const NOTES_LIMIT = 40;

                    const displayedNotes = assignment.notes
                        ? assignment.notes.length > NOTES_LIMIT
                            ? `${assignment.notes.slice(0, NOTES_LIMIT)}...`
                            : assignment.notes
                        : "-";

                    return (
                        <TableRow
                            key={assignment.id || index}
                            hover
                            onClick={() => openDetails(assignment)}
                            sx={{
                                cursor: "pointer",
                                "&:last-child td": {
                                    borderBottom: 0,
                                },
                                "&:hover": {
                                    backgroundColor: "action.hover",
                                },
                                height: 82,
                            }}
                        >
                            {/* TRUCK NUMBER */}
                            <TableCell align="center">
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 600,
                                        color: "primary.main",
                                    }}
                                >
                                    {assignment.truck?.truckNumber || "-"}
                                </Typography>
                            </TableCell>

                            {/* DISPATCHER */}
                            <TableCell align="center">
                                <Typography
                                    variant="body2"
                                    fontWeight={500}
                                >
                                    {assignment.dispatcher?.name || "-"}
                                </Typography>
                            </TableCell>

                            {/* CURRENT LOCATION */}
                            <TableCell align="center">
                                <Typography variant="body2">
                                    {assignment.truck?.currentLocation || "-"}
                                </Typography>
                            </TableCell>

                            {/* NOTES */}
                            <TableCell align="center">
                                <Typography
                                    variant="body2"
                                    title={assignment.notes || "No notes"}
                                    sx={{
                                        maxWidth: 250,
                                        mx: "auto",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {displayedNotes}
                                </Typography>
                            </TableCell>

                            {/* STATUS */}
                            <TableCell align="center">
                                <Chip
                                    size="small"
                                    label={assignment.status || "-"}
                                    sx={{
                                        textTransform: "capitalize",
                                        color:
                                            assignment.status === "active"
                                                ? "success.main"
                                                : "text.secondary",
                                        bgcolor: "action.selected",
                                        border: "1px solid",
                                        borderColor: "divider",
                                        fontWeight: 600,
                                    }}
                                />
                            </TableCell>

                            {/* ACTION */}
                            <TableCell align="center">
                                <IconButton
                                    aria-label="Edit assignment"
                                    size="small"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        openEdit(assignment);
                                    }}
                                >
                                    <Pencil size={18} />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    );
                }}
            />

            {isAdmin &&
                paginationResult &&
                paginationResult.totalPages >
                1 && (
                    <Pagination
                        pagination={
                            paginationResult
                        }
                        page={page}
                        setPage={setPage}
                    />
                )}

            <Dialog
                open={Boolean(
                    viewingAssignment
                )}
                onClose={closeDetails}
                fullWidth
                maxWidth="md"
            >
                {/* HEADER */}

                <DialogTitle
                    sx={{
                        display: "flex",

                        alignItems: "center",

                        justifyContent:
                            "space-between",

                        gap: 2,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",

                            alignItems: "center",

                            gap: 1.5,
                        }}
                    >
                        <Box
                            sx={{
                                display: "grid",

                                placeItems: "center",

                                width: 42,

                                height: 42,

                                borderRadius: 1.5,

                                bgcolor:
                                    "action.selected",

                                color:
                                    "primary.main",
                            }}
                        >
                            <Truck size={22} />
                        </Box>

                        <Box>
                            <Typography
                                variant="h6"
                                fontWeight={700}
                            >
                                Truck Assignment Details
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                {viewingAssignment
                                    ?.truck
                                    ?.truckNumber || "-"}
                            </Typography>
                        </Box>
                    </Box>

                    <IconButton
                        aria-label="Close details"
                        onClick={closeDetails}
                    >
                        <X size={20} />
                    </IconButton>
                </DialogTitle>

                {/* CONTENT */}

                <DialogContent dividers>

                    {viewingAssignment && (
                        <>


                            <Box
                                sx={{
                                    display: "grid",

                                    gridTemplateColumns: {
                                        xs: "1fr",
                                        sm: "1fr 1fr",
                                    },

                                    gap: 1.5,

                                    py: 1,
                                }}
                            >
                                {[
                                    [
                                        "Dispatcher",
                                        viewingAssignment
                                            .dispatcher
                                            ?.name || "-",
                                    ],

                                    [
                                        "Email",
                                        viewingAssignment
                                            .dispatcher
                                            ?.email || "-",
                                    ],

                                    [
                                        "Phone",
                                        viewingAssignment
                                            .dispatcher
                                            ?.phone || "-",
                                    ],

                                    [
                                        "Job ID",
                                        viewingAssignment
                                            .dispatcher
                                            ?.jobId ?? "-",
                                    ],

                                    [
                                        "Truck",
                                        viewingAssignment
                                            .truck
                                            ?.truckNumber || "-",
                                    ],

                                    [
                                        "Model",
                                        viewingAssignment
                                            .truck
                                            ?.model || "-",
                                    ],

                                    [
                                        "Type",
                                        viewingAssignment
                                            .truck
                                            ?.type || "-",
                                    ],

                                    [
                                        "Current Location",
                                        viewingAssignment
                                            .truck
                                            ?.currentLocation ||
                                        "-",
                                    ],

                                    [
                                        "Truck Status",
                                        viewingAssignment
                                            .truck
                                            ?.status || "-",
                                    ],

                                    [
                                        "Assignment Status",
                                        viewingAssignment
                                            .status || "-",
                                    ],

                                    [
                                        "Assigned By",
                                        viewingAssignment
                                            .assignedBy || "-",
                                    ],

                                    [
                                        "Updated By",
                                        viewingAssignment
                                            .updatedBy || "-",
                                    ],

                                    [
                                        "Created At",
                                        formatDate(
                                            viewingAssignment
                                                .createdAt
                                        ),
                                    ],

                                    [
                                        "Updated At",
                                        formatDate(
                                            viewingAssignment
                                                .updatedAt
                                        ),
                                    ],
                                ].map(
                                    (
                                        [label, value],
                                        index
                                    ) => (
                                        <Box
                                            key={`${String(
                                                label
                                            )}-${index}`}
                                            sx={{
                                                p: 1.75,

                                                border:
                                                    "1px solid",

                                                borderColor:
                                                    "divider",

                                                borderRadius: 1.5,
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                {String(label)}
                                            </Typography>

                                            <Typography
                                                sx={{
                                                    mt: 0.5,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {String(value)}
                                            </Typography>
                                        </Box>
                                    )
                                )}

                                {/* NOTES */}

                                <Box
                                    sx={{
                                        gridColumn: {
                                            sm: "1 / -1",
                                        },

                                        p: 1.75,

                                        border:
                                            "1px solid",

                                        borderColor:
                                            "divider",

                                        borderRadius: 1.5,
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Notes
                                    </Typography>

                                    <Typography
                                        sx={{
                                            mt: 0.5,

                                            whiteSpace:
                                                "pre-wrap",
                                        }}
                                    >
                                        {viewingAssignment
                                            .notes || "-"}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* ============================================
                  CURRENT LOAD
              ============================================ */}

                            {viewingAssignment
                                .truck?.currentLoad && (
                                    <Box
                                        sx={{
                                            mt: 2,

                                            p: 2,

                                            border:
                                                "1px solid",

                                            borderColor:
                                                "divider",

                                            borderRadius: 2,
                                        }}
                                    >
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight={700}
                                            sx={{
                                                mb: 1.5,

                                                color:
                                                    "primary.main",
                                            }}
                                        >
                                            Current Load
                                        </Typography>

                                        <Box
                                            sx={{
                                                display: "grid",

                                                gridTemplateColumns: {
                                                    xs: "1fr",
                                                    sm: "1fr 1fr",
                                                },

                                                gap: 1.5,
                                            }}
                                        >
                                            {/* LOAD ID */}

                                            <Box>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    Load ID
                                                </Typography>

                                                <Typography
                                                    fontWeight={600}
                                                >
                                                    {
                                                        viewingAssignment
                                                            .truck
                                                            .currentLoad
                                                            .loadId
                                                    }
                                                </Typography>
                                            </Box>

                                            {/* STATUS */}

                                            <Box>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    Status
                                                </Typography>

                                                <Typography
                                                    fontWeight={600}
                                                    sx={{
                                                        textTransform:
                                                            "capitalize",
                                                    }}
                                                >
                                                    {viewingAssignment.truck.currentLoad.status.replace(
                                                        "_",
                                                        " "
                                                    )}
                                                </Typography>
                                            </Box>

                                            {/* ORIGIN */}

                                            <Box>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    Origin
                                                </Typography>

                                                <Typography
                                                    fontWeight={600}
                                                >
                                                    {
                                                        viewingAssignment
                                                            .truck
                                                            .currentLoad
                                                            .origin
                                                    }
                                                </Typography>
                                            </Box>

                                            {/* DESTINATION */}

                                            <Box>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    Destination
                                                </Typography>

                                                <Typography
                                                    fontWeight={600}
                                                >
                                                    {viewingAssignment.truck.currentLoad.destination?.join(
                                                        ", "
                                                    ) || "-"}
                                                </Typography>
                                            </Box>

                                            {/* PICKUP FROM */}

                                            <Box>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    Pickup From
                                                </Typography>

                                                <Typography
                                                    fontWeight={600}
                                                >
                                                    {formatDate(
                                                        viewingAssignment
                                                            .truck
                                                            .currentLoad
                                                            .pickupAtFrom
                                                    )}
                                                </Typography>
                                            </Box>

                                            {/* PICKUP TO */}

                                            <Box>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    Pickup To
                                                </Typography>

                                                <Typography
                                                    fontWeight={600}
                                                >
                                                    {formatDate(
                                                        viewingAssignment
                                                            .truck
                                                            .currentLoad
                                                            .pickupAtTo
                                                    )}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                )}
                        </>
                    )}
                </DialogContent>

                {/* ACTIONS */}

                <DialogActions
                    sx={{
                        px: 3,
                        py: 2,
                    }}
                >
                    <Button
                        onClick={closeDetails}
                    >
                        Close
                    </Button>

                    {viewingAssignment && (
                        <Button
                            variant="contained"
                            onClick={() => {
                                openEdit(viewingAssignment);
                                closeDetails();
                            }}
                        >
                            Edit Assignment
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <Dialog
                open={Boolean(
                    editingAssignment
                )}
                onClose={closeEdit}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle
                    sx={{
                        display: "flex",

                        justifyContent:
                            "space-between",

                        alignItems: "center",
                    }}
                >
                    Edit Assignment

                    <IconButton
                        aria-label="Close"
                        onClick={closeEdit}
                    >
                        <X size={20} />
                    </IconButton>
                </DialogTitle>

                <DialogContent
                    sx={{
                        display: "grid",

                        gap: 2,

                        pt: "12px !important",
                    }}
                >
                    {/* TRUCK INFO */}

                    {editingAssignment && (
                        <Box
                            sx={{
                                p: 1.5,

                                bgcolor:
                                    "action.selected",

                                borderRadius: 1.5,
                            }}
                        >
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Truck
                            </Typography>

                            <Typography
                                fontWeight={600}
                            >
                                {
                                    editingAssignment
                                        .truck
                                        .truckNumber
                                }
                                {editingAssignment
                                    .truck.model
                                    ? ` - ${editingAssignment.truck.model}`
                                    : ""}
                            </Typography>
                        </Box>
                    )}

                    {/* NOTES */}

                    <TextField
                        label="Notes"
                        multiline
                        minRows={3}
                        value={notes}
                        onChange={(event) =>
                            setNotes(
                                event.target.value
                            )
                        }
                    />

                    {/* CURRENT LOCATION */}

                    <TextField
                        label="Current Location"
                        value={currentLocation}
                        onChange={(event) =>
                            setCurrentLocation(
                                event.target.value
                            )
                        }
                        placeholder="Example: Dallas, TX"
                    />
                </DialogContent>

                <DialogActions
                    sx={{
                        px: 3,
                        pb: 2,
                    }}
                >
                    <Button
                        onClick={closeEdit}
                        disabled={isUpdating}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={saveEdit}
                        variant="contained"
                        disabled={isUpdating}
                    >
                        {isUpdating
                            ? "Saving..."
                            : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}