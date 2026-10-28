"use client";

import { useEffect, useMemo, useState } from "react";

import {
    Alert,
    Box,
    Button,
    Card,
    CardActionArea,
    CardActions,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Skeleton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import {
    Eye,
    MapPin,
    Pencil,
    Truck,
    X,
} from "lucide-react";

import toast, { Toaster } from "react-hot-toast";

import Pagination from "@/components/ui/Pagination";

import {
    useGetMyTruckAssignmentsQuery,
    useGetTruckDispatchersQuery,
    useUpdateMyTruckAssignmentAdminMutation,
    useUpdateTruckDispatcherAssignmentMutation,
} from "@/redux/slices/apiSlice";

import { useAppSelector } from "@/redux/store";
import { getErrorMessage } from "@/utils/getErrorMessage";
import LocationAutocomplete, { TPlace } from "../sections/LocationAutocomplete";


type CurrentLoad = {
    id?: string;
    loadId?: string;
    origin?: string;
    destination?: string[];
    status?: string;
    pickupAtFrom?: string;
    pickupAtTo?: string;
    completedAt?: string;
    arrivalAtReceiver?: string;
    leftReceiver?: string;
    deliveredAt?: string;
    truckType?: string;
    tonu?: Record<string, unknown>;
};


type AssignedDriver = {
    name: string;
    driverId: string;
};

type LastKnownLocation = {
    city?: string;
};

type TruckType = {
    id: string;
    truckNumber: string;
    model: string;

    type?: string;
    source?: string;

    year?: number;
    capacity?: number;
    fuelPerMile?: number;
    totalMileage?: number;

    status?: string;

    currentLocation?: string;
    lastKnownLocation?: LastKnownLocation | null;

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
    position?: string;
    hireDate?: string;
    emailVerifiedAt?: string;
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

const getCityState = (address?: string) => {
    if (!address) return "-";

    const parts = address.split(",").map((part) => part.trim());

    if (parts.length < 2) return address;

    const city = parts[parts.length - 3];
    const state = parts[parts.length - 2]
        ?.replace(/\s+\d{5}(?:-\d{4})?$/, "");

    if (!city || !state) return address;

    return `${city}, ${state}`;
};

const getTruckLocationLabel = (truck?: TruckType, fallback = "-") =>
    truck?.lastKnownLocation?.city ||
    (truck?.currentLocation ? getCityState(truck.currentLocation) : fallback);


export default function TruckDispatcher() {
    const currentUser = useAppSelector((state) => state.auth.user);

    const role = currentUser?.role?.toLowerCase();

    const isAdminOrManager =
        role === "admin" || role === "manager";



    const [page, setPage] = useState(1);

    const limit = 10;

    const [search, setSearch] = useState("");

    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [viewingAssignment, setViewingAssignment] =
        useState<Assignment | null>(null);

    const [editingAssignment, setEditingAssignment] =
        useState<Assignment | null>(null);

    const [notes, setNotes] = useState("");

    const [currentLocation, setCurrentLocation] =
        useState<TPlace | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, 350);

        return () => clearTimeout(timer);
    }, [search]);


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
            skip: !isAdminOrManager,
        }
    );

    const {
        data: dispatcherResponse,
        isLoading: isDispatcherLoading,
        isFetching: isDispatcherFetching,
        isError: isDispatcherError,
        error: dispatcherError,
    } = useGetMyTruckAssignmentsQuery(undefined, {
        skip: isAdminOrManager || !role,
    });

    // const isUpdating =
    //     isAdminUpdating || isDispatcherUpdating;

    const [
        updateTruckDispatcherAssignment,
        { isLoading: isAdminUpdating },
    ] = useUpdateTruckDispatcherAssignmentMutation();

    const [
        updateMyTruckAssignment,
        { isLoading: isDispatcherUpdating },
    ] = useUpdateMyTruckAssignmentAdminMutation();

    const isUpdating =
        isAdminUpdating || isDispatcherUpdating;

    const response = isAdminOrManager
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

    const isLoading = isAdminOrManager
        ? isAdminLoading || isAdminFetching
        : isDispatcherLoading || isDispatcherFetching;

    const isError = isAdminOrManager
        ? isAdminError
        : isDispatcherError;

    const requestError = isAdminOrManager
        ? adminError
        : dispatcherError;


    const openDetails = (assignment: Assignment) => {
        console.log("Full Assignment:", assignment);
        console.log("Current Load:", assignment.truck?.currentLoad);

        console.table({
            completedAt: assignment.truck?.currentLoad?.completedAt,
            arrivalAtReceiver: assignment.truck?.currentLoad?.arrivalAtReceiver,
            leftReceiver: assignment.truck?.currentLoad?.leftReceiver,
            deliveredAt: assignment.truck?.currentLoad?.deliveredAt,
        });

        setViewingAssignment(assignment);
    };


    const closeDetails = () => {
        setViewingAssignment(null);
    };



    const openEdit = (assignment: Assignment) => {
        setEditingAssignment(assignment);
        setNotes(assignment.notes ?? "");

        const location = assignment.truck?.currentLocation;

        setCurrentLocation(
            location
                ? {
                    display_name: location,
                    lat: "",
                    lon: "",
                    place_id: "",
                }
                : null
        );
    };




    const closeEdit = () => {
        setEditingAssignment(null);
        setNotes("");
        setCurrentLocation(null);
    };


    const saveEdit = async () => {
        if (!editingAssignment?.id) {
            toast.error("Assignment ID is missing");
            return;
        }

        try {

            const payload = {
                assignmentId: editingAssignment.id,
                notes: notes.trim(),
                currentLocation: currentLocation?.display_name?.trim() ?? "",
            };

            if (isAdminOrManager) {
                // Admin / Manager
                await updateTruckDispatcherAssignment(payload).unwrap();
            } else {
                // Employee / Dispatcher
                await updateMyTruckAssignment(payload).unwrap();
            }

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
            <Toaster position="top-center" />

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
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 1.5,
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
                            {isAdminOrManager
                                ? "Truck Status"
                                : "My Trucks"}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {isAdminOrManager
                                ? "View and manage status trucks"
                                : "View and manage status trucks and details"}
                        </Typography>
                    </Box>

                    <Chip
                        size="small"
                        label={`${paginationResult?.total ?? assignments.length} trucks`}
                        color="primary"
                        variant="outlined"
                    />
                </Box>

                {/* SEARCH */}

                {/* <Box
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
                    <TextField
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
                    />
                </Box> */}


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



            {isLoading ? (
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2, minmax(0, 1fr))",
                            md: "repeat(3, minmax(0, 1fr))",
                            lg: "repeat(4, minmax(0, 1fr))",
                            xl: "repeat(4, minmax(0, 1fr))",
                        },
                        gap: 3,
                    }}
                >
                    {Array.from({ length: 12 }).map((_, index) => (
                        <Card key={index} variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent sx={{ p: 2 }}>
                                <Skeleton width="55%" height={28} />
                                <Skeleton width="75%" />
                                <Skeleton width="90%" sx={{ mt: 2 }} />
                                <Skeleton width="65%" />
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            ) : assignments.length > 0 ? (
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2, minmax(0, 1fr))",
                            md: "repeat(3, minmax(0, 1fr))",
                            lg: "repeat(4, minmax(0, 1fr))",
                            xl: "repeat(4, minmax(0, 1fr))",
                        },
                        gap: 3,
                    }}
                >
                    {assignments.map((assignment, index) => (
                        <Card
                            key={assignment.id || assignment.truck?.id || index}
                            variant="outlined"
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                minWidth: 0,
                                borderRadius: 2,
                                transition: "box-shadow 0.2s, transform 0.2s",
                                "&:hover": {
                                    boxShadow: 3,
                                    transform: "translateY(-2px)",
                                },
                            }}
                        >
                            <CardActionArea
                                onClick={() => openDetails(assignment)}
                                aria-label={`View details for truck ${assignment.truck?.truckNumber || ""}`}
                                sx={{ flexGrow: 1, alignItems: "stretch" }}
                            >
                                <CardContent
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 1.5,
                                        p: 2,
                                        "&:last-child": { pb: 2 },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            justifyContent: "space-between",
                                            gap: 1,
                                        }}
                                    >
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography
                                                variant="subtitle1"
                                                fontWeight={700}
                                                color="primary.main"
                                                noWrap
                                                title={assignment.truck?.truckNumber || "-"}
                                            >
                                                {assignment.truck?.truckNumber || "Truck"}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                noWrap
                                                title={assignment.truck?.model || ""}
                                            >
                                                {assignment.truck?.model || "No model"}
                                            </Typography>
                                        </Box>
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
                                    </Box>

                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Dispatcher
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600} noWrap>
                                            {assignment.dispatcher?.name || "-"}
                                        </Typography>
                                    </Box>

                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 0.75,
                                            minWidth: 0,
                                        }}
                                    >
                                        <MapPin
                                            size={16}
                                            color="#1565C0"
                                            style={{ flexShrink: 0, marginTop: 2 }}
                                        />
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Current Location
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                title={getTruckLocationLabel(
                                                    assignment.truck,
                                                    "Location unavailable"
                                                )}
                                                sx={{
                                                    overflow: "hidden",
                                                    display: "-webkit-box",
                                                    WebkitBoxOrient: "vertical",
                                                    WebkitLineClamp: 2,
                                                    overflowWrap: "anywhere",
                                                }}
                                            >
                                                {getTruckLocationLabel(
                                                    assignment.truck,
                                                    "Location unavailable"
                                                )}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ minWidth: 0, pl: 2.75 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Destination
                                        </Typography>
                                        <Stack spacing={0.25}>
                                            {assignment.truck?.currentLoad?.destination?.length
                                                ? assignment.truck.currentLoad.destination.map((destination, index) => (
                                                    <Typography
                                                        key={`${destination}-${index}`}
                                                        variant="body2"
                                                        fontWeight={600}
                                                        sx={{ overflowWrap: "anywhere" }}
                                                    >
                                                        {destination}
                                                    </Typography>
                                                ))
                                                : (
                                                    <Typography variant="body2" fontWeight={600}>
                                                        -
                                                    </Typography>
                                                )}
                                        </Stack>
                                    </Box>

                                    <Stack
                                        direction="row"
                                        spacing={0.75}
                                        useFlexGap
                                        flexWrap="wrap"
                                    >
                                        <Chip
                                            size="small"
                                            variant="outlined"
                                            label={`Truck: ${assignment.truck?.status || "-"}`}
                                        />
                                        <Chip
                                            size="small"
                                            variant="outlined"
                                            label={assignment.truck?.type || "Type -"}
                                        />
                                        {assignment.truck?.year && (
                                            <Chip
                                                size="small"
                                                variant="outlined"
                                                label={String(assignment.truck.year)}
                                            />
                                        )}
                                    </Stack>

                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Current load
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600} noWrap>
                                            {assignment.truck?.currentLoad?.loadId || "No load"}
                                            {assignment.truck?.currentLoad?.status
                                                ? ` · ${assignment.truck.currentLoad.status}`
                                                : ""}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Notes
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            title={assignment.notes || "No notes"}
                                            noWrap
                                        >
                                            {assignment.notes || "No notes"}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </CardActionArea>
                            <CardActions
                                sx={{
                                    justifyContent: "flex-end",
                                    px: 1.5,
                                    py: 0.5,
                                    borderTop: "1px solid",
                                    borderColor: "divider",
                                }}
                            >
                                <Button
                                    size="small"
                                    startIcon={<Eye size={16} />}
                                    onClick={() => openDetails(assignment)}
                                >
                                    View
                                </Button>
                                <Button
                                    size="small"
                                    startIcon={<Pencil size={16} />}
                                    onClick={() => openEdit(assignment)}
                                >
                                    Edit
                                </Button>
                            </CardActions>
                        </Card>
                    ))}
                </Box>
            ) : (
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1,
                        py: 7,
                        px: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        textAlign: "center",
                    }}
                >
                    <Truck size={36} color="#9e9e9e" />
                    <Typography variant="h6">No trucks found</Typography>
                    <Typography variant="body2" color="text.secondary">
                        There are no truck assignments to display.
                    </Typography>
                </Box>
            )}

            {isAdminOrManager &&
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
                                Truck Details
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
                                        "Hire Date",

                                        formatDate(viewingAssignment.dispatcher?.hireDate),
                                    ],
                                    [
                                        "Email Verified At",
                                        formatDate(viewingAssignment.dispatcher?.emailVerifiedAt),
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
                                        "Year",
                                        viewingAssignment.truck?.year ?? "-",
                                    ],
                                    [
                                        "Capacity",
                                        viewingAssignment.truck?.capacity ?? "-",
                                    ],
                                    [
                                        "Fuel Per Mile",
                                        viewingAssignment.truck?.fuelPerMile ?? "-",
                                    ],
                                    [
                                        "Total Mileage",
                                        viewingAssignment.truck?.totalMileage?.toFixed(2) ?? "-",
                                    ],
                                    [
                                        "Current Location",
                                        getTruckLocationLabel(viewingAssignment.truck),
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
                                                    {viewingAssignment.truck.currentLoad.loadId || "-"}
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
                                                    {viewingAssignment.truck.currentLoad.status?.replaceAll(
                                                        "_",
                                                        " "
                                                    ) || "-"}
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
                                                    {viewingAssignment.truck.currentLoad.origin || "-"}
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

                                                <Stack spacing={0.25}>
                                                    {viewingAssignment.truck.currentLoad.destination?.length
                                                        ? viewingAssignment.truck.currentLoad.destination.map((destination, index) => (
                                                            <Typography
                                                                key={`${destination}-${index}`}
                                                                fontWeight={600}
                                                                sx={{ overflowWrap: "anywhere" }}
                                                            >
                                                                {destination}
                                                            </Typography>
                                                        ))
                                                        : (
                                                            <Typography fontWeight={600}>
                                                                -
                                                            </Typography>
                                                        )}
                                                </Stack>
                                            </Box>

                                            <Box>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    Load Record ID
                                                </Typography>
                                                <Typography fontWeight={600}>
                                                    {viewingAssignment.truck.currentLoad.id || "-"}
                                                </Typography>
                                            </Box>

                                            <Box>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    Truck Type
                                                </Typography>
                                                <Typography fontWeight={600}>
                                                    {viewingAssignment.truck.currentLoad.truckType || "-"}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    TONU
                                                </Typography>
                                                <Typography
                                                    fontWeight={600}
                                                    sx={{ overflowWrap: "anywhere" }}
                                                >
                                                    {viewingAssignment.truck.currentLoad.tonu &&
                                                        Object.keys(viewingAssignment.truck.currentLoad.tonu).length > 0
                                                        ? JSON.stringify(viewingAssignment.truck.currentLoad.tonu)
                                                        : "-"}
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


                                            {[
                                                {
                                                    label: "Completed At",
                                                    value: viewingAssignment.truck.currentLoad.completedAt,
                                                },
                                                {
                                                    label: "Arrival At Receiver",
                                                    value: viewingAssignment.truck.currentLoad.arrivalAtReceiver,
                                                },
                                                {
                                                    label: "Left Receiver",
                                                    value: viewingAssignment.truck.currentLoad.leftReceiver,
                                                },
                                                {
                                                    label: "Delivered At",
                                                    value: viewingAssignment.truck.currentLoad.deliveredAt,
                                                },
                                            ].map(({ label, value }) => (
                                                <Box key={label}>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        {label}
                                                    </Typography>

                                                    <Typography fontWeight={600}>
                                                        {formatDate(value)}
                                                    </Typography>
                                                </Box>
                                            ))}

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
                    {/* <LocationAutocomplete
                        label="Current Location"
                        value={currentLocation}
                        setValue={(place) => setCurrentLocation(place)}
                        placeholder="Enter truck's current location"
                        showZipCode
                    /> */}

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

