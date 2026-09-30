"use client";

import {
    ReactNode,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    Menu,
    MenuItem,
    Select,
    TableCell,
    TableRow,
    TextField,
    Typography,
    alpha,
    darken,
} from "@mui/material";

import {
    Activity,
    BadgeCheck,
    CalendarDays,
    CircleEllipsis,
    Eye,
    FileText,
    Mail,
    Pencil,
    Plus,
    Truck,
    UserCheck,
    UserRound,
    X,
} from "lucide-react";

import toast, { Toaster } from "react-hot-toast";

import {
    TTruck,
    TUser,
} from "@/types/globalTypes";

import DataTable, {
    Column,
} from "@/components/ui/DataTable";

import { StatusChip } from "@/components/ui/TablesMUI";

import {
    RootState,
    useAppSelector,
} from "@/redux/store";

import {
    useCreateTruckDispatcherMutation,
    useGetActiveDispatchersQuery,
    useGetTruckDispatchersQuery,
    useUpdateTruckDispatcherMutation,
} from "@/redux/slices/apiSlice";

/* =========================================================
   TYPES
========================================================= */

type TruckDispatcher = {
    id?: string;
    _id?: string;

    truck?: string | TTruck;
    dispatcher?: string | TUser;

    truckId?: string | TTruck;
    dispatcherId?: string | TUser;

    status: "active" | "inactive";

    notes?: string;
    assignedBy?: string;

    createdAt?: string;
    updatedAt?: string;
};

type AssignmentForm = {
    truckId: string;
    dispatcherId: string;
    status: "active" | "inactive";
    notes: string;
};

type DetailItemProps = {
    icon: ReactNode;
    label: string;
    value: ReactNode;
    primary: string;
};

/*
    The response from:
    /truck-dispatchers?unusedTrucks=true

    returns trucks with _id.
*/
type UnusedTruck = TTruck & {
    _id?: string;
    id?: string;
    truckNumber?: string;
    model?: string;
};

/* =========================================================
   HELPERS
========================================================= */

const getId = (
    value:
        | string
        | {
            id?: string;
            _id?: string;
        }
        | undefined
) =>
    typeof value === "string"
        ? value
        : value?.id ?? value?._id ?? "";

const getName = (
    value:
        | string
        | {
            name?: string;
            truckNumber?: string;
            truckId?: number;
        }
        | undefined
) => {
    if (!value) return "-";

    if (typeof value === "string") {
        return value;
    }

    return (
        value.name ??
        value.truckNumber ??
        (value.truckId
            ? `Truck ${value.truckId}`
            : "-")
    );
};

const getAssignmentTruck = (
    assignment: TruckDispatcher
) =>
    assignment.truck ??
    assignment.truckId;

const getAssignmentDispatcher = (
    assignment: TruckDispatcher
) =>
    assignment.dispatcher ??
    assignment.dispatcherId;

/*
    Supports:

    []

    {
        data: []
    }

    {
        data: {
            data: []
        }
    }
*/

const unwrapList = <T,>(
    response: unknown
): T[] => {
    if (Array.isArray(response)) {
        return response as T[];
    }

    if (
        response &&
        typeof response === "object"
    ) {
        const data = (
            response as {
                data?: unknown;
            }
        ).data;

        if (Array.isArray(data)) {
            return data as T[];
        }

        if (
            data &&
            typeof data === "object"
        ) {
            const nestedData = (
                data as {
                    data?: unknown;
                }
            ).data;

            if (Array.isArray(nestedData)) {
                return nestedData as T[];
            }
        }
    }

    return [];
};

/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({
    icon,
    label,
    value,
    primary,
}: DetailItemProps) {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.8,
                minWidth: 0,
            }}
        >
            <Box
                sx={{
                    width: 55,
                    height: 55,
                    minWidth: 55,

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    borderRadius: 1.5,

                    bgcolor: alpha(
                        primary,
                        0.08
                    ),

                    color: primary,
                }}
            >
                {icon}
            </Box>

            <Box
                sx={{
                    minWidth: 0,
                }}
            >
                <Typography
                    sx={{
                        fontSize: 14,
                        color:
                            "text.secondary",
                        mb: 0.2,
                    }}
                >
                    {label}
                </Typography>

                <Typography
                    sx={{
                        fontSize: 17,
                        fontWeight: 500,
                        overflowWrap:
                            "anywhere",
                    }}
                >
                    {value}
                </Typography>
            </Box>
        </Box>
    );
}

/* =========================================================
   PAGE
========================================================= */

export default function AssignDriver() {
    const theme = useAppSelector(
        (state: RootState) =>
            state.palette
    );

    /* =====================================================
       DISPATCHERS
    ===================================================== */

    const {
        data: dispatcherResponse,
    } =
        useGetActiveDispatchersQuery({
            page: 1,
            limit: 100,
        });

    /* =====================================================
       MUTATIONS
    ===================================================== */

    const [
        createAssignment,
        {
            isLoading:
            isCreating,
        },
    ] =
        useCreateTruckDispatcherMutation();

    const [
        updateAssignment,
        {
            isLoading:
            isUpdating,
        },
    ] =
        useUpdateTruckDispatcherMutation();

    /* =====================================================
       STATE
    ===================================================== */

    const [
        dialogOpen,
        setDialogOpen,
    ] = useState(false);

    const [
        viewAssignment,
        setViewAssignment,
    ] =
        useState<TruckDispatcher | null>(
            null
        );

    const [
        editingAssignment,
        setEditingAssignment,
    ] =
        useState<TruckDispatcher | null>(
            null
        );

    const [
        selectedAssignment,
        setSelectedAssignment,
    ] =
        useState<TruckDispatcher | null>(
            null
        );

    const [
        actionAnchor,
        setActionAnchor,
    ] =
        useState<HTMLElement | null>(
            null
        );

    const [
        form,
        setForm,
    ] =
        useState<AssignmentForm>({
            truckId: "",
            dispatcherId: "",
            status: "active",
            notes: "",
        });

    const [
        search,
        setSearch,
    ] = useState("");

    const [
        debouncedSearch,
        setDebouncedSearch,
    ] = useState("");

    /* =====================================================
       SEARCH DEBOUNCE
    ===================================================== */

    useEffect(() => {
        const timer =
            setTimeout(() => {
                setDebouncedSearch(
                    search.trim()
                );
            }, 500);

        return () =>
            clearTimeout(timer);
    }, [search]);



    const {
        data: assignmentResponse,
        isLoading,
        isFetching,
        isError,
        refetch: refetchAssignments,
    } = useGetTruckDispatchersQuery({
        page: 1,
        limit: 10,
        keyword:
            debouncedSearch ||
            undefined,
    });

    const {
        data: unusedTrucksResponse,

        isLoading:
        isLoadingUnusedTrucks,

        isFetching:
        isFetchingUnusedTrucks,

        isError:
        isUnusedTrucksError,

        refetch:
        refetchUnusedTrucks,
    } =
        useGetTruckDispatchersQuery(
            {
                page: 1,
                limit: 100,
                unusedTrucks: true,
            },
            {
                skip: !dialogOpen,


                refetchOnMountOrArgChange: true,
            }
        );

    useEffect(() => {
        if (!dialogOpen) {
            return;
        }

        refetchUnusedTrucks();
    }, [
        dialogOpen,
        refetchUnusedTrucks,
    ]);

    const assignments =
        unwrapList<TruckDispatcher>(
            assignmentResponse
        );

    const dispatchers =
        unwrapList<TUser>(
            dispatcherResponse
        );

    /*
        IMPORTANT:

        Response is:

        {
            message: "...",
            data: [
                {
                    _id: "...",
                    truckNumber: "1300",
                    model: "...",
                    ...
                }
            ]
        }

        So we read data directly.
    */

    const unusedTrucks =
        unwrapList<UnusedTruck>(
            unusedTrucksResponse
        );

    /* =====================================================
       TRUCKS FOR ADD / EDIT
    ===================================================== */

    const availableTrucksForForm =
        useMemo(() => {
            /*
                ADD

                Display exactly the trucks
                returned by unusedTrucks=true.
            */

            if (!editingAssignment) {
                return unusedTrucks;
            }

            /*
                EDIT
            */

            const currentTruck =
                getAssignmentTruck(
                    editingAssignment
                );

            /*
                If current truck is only ID,
                return unused trucks.

                The selected value will still
                remain in form.truckId.
            */

            if (
                !currentTruck ||
                typeof currentTruck ===
                "string"
            ) {
                return unusedTrucks;
            }

            const currentTruckId =
                getId(currentTruck);

            /*
                API returns _id, so use
                getId instead of truck.id.
            */

            const currentExists =
                unusedTrucks.some(
                    (truck) =>
                        String(
                            getId(truck)
                        ) ===
                        String(
                            currentTruckId
                        )
                );

            if (currentExists) {
                return unusedTrucks;
            }

            /*
                Keep currently assigned truck
                available during edit.
            */

            return [
                currentTruck as UnusedTruck,
                ...unusedTrucks,
            ];
        }, [
            unusedTrucks,
            editingAssignment,
        ]);

    /* =====================================================
       COLUMNS
    ===================================================== */

    const columns: Column[] = [
        {
            key: "truck",
            header: "Truck",
            align: "center",
        },

        {
            key: "dispatcher",
            header: "Dispatcher",
            align: "center",
        },

        {
            key: "status",
            header: "Status",
            align: "center",
        },

        {
            key: "notes",
            header: "Notes",
            align: "center",
        },

        {
            key: "actions",
            header: "Actions",
            align: "center",
        },
    ];

    /* =====================================================
       LOCAL FILTER
    ===================================================== */

    const filteredAssignments =
        useMemo(() => {
            const term = search
                .trim()
                .toLowerCase();

            return assignments.filter(
                (assignment) => {
                    const truckValue =
                        getAssignmentTruck(
                            assignment
                        );

                    const dispatcherValue =
                        getAssignmentDispatcher(
                            assignment
                        );

                    const truck =
                        getName(
                            truckValue
                        );

                    const dispatcher =
                        getName(
                            dispatcherValue
                        );

                    const truckModel =
                        typeof truckValue ===
                            "object"
                            ? truckValue
                                ?.model ??
                            ""
                            : "";

                    const dispatcherEmail =
                        typeof dispatcherValue ===
                            "object"
                            ? dispatcherValue
                                ?.email ??
                            ""
                            : "";

                    const searchable =
                        `${truck} ${truckModel} ${dispatcher} ${dispatcherEmail} ${assignment.notes ??
                            ""
                            }`.toLowerCase();

                    return (
                        !term ||
                        searchable.includes(
                            term
                        )
                    );
                }
            );
        }, [
            assignments,
            search,
        ]);

    /* =====================================================
       OPEN ADD
    ===================================================== */

    const openCreate = () => {
        setEditingAssignment(null);

        setForm({
            truckId: "",
            dispatcherId: "",
            status: "active",
            notes: "",
        });


        setDialogOpen(true);
    };



    const openEdit = (
        assignment: TruckDispatcher
    ) => {
        setEditingAssignment(
            assignment
        );

        setForm({
            truckId:
                getId(
                    getAssignmentTruck(
                        assignment
                    )
                ),

            dispatcherId:
                getId(
                    getAssignmentDispatcher(
                        assignment
                    )
                ),

            status:
                assignment.status ??
                "active",

            notes:
                assignment.notes ??
                "",
        });

        setDialogOpen(true);
    };



    const closeFormDialog = () => {
        setDialogOpen(false);

        setEditingAssignment(null);
    };

    /* =====================================================
       ACTION MENU
    ===================================================== */

    const handleOpenActions = (
        event: React.MouseEvent<HTMLElement>,
        assignment: TruckDispatcher
    ) => {
        setActionAnchor(
            event.currentTarget
        );

        setSelectedAssignment(
            assignment
        );
    };

    const handleCloseActions =
        () => {
            setActionAnchor(null);

            setSelectedAssignment(
                null
            );
        };

    const handleViewFromMenu =
        () => {
            if (
                selectedAssignment
            ) {
                setViewAssignment(
                    selectedAssignment
                );
            }

            handleCloseActions();
        };

    const handleEditFromMenu =
        () => {
            if (
                selectedAssignment
            ) {
                openEdit(
                    selectedAssignment
                );
            }

            handleCloseActions();
        };

    const handleSubmit =
        async () => {
            if (
                !form.truckId ||
                !form.dispatcherId
            ) {
                toast.error(
                    "Choose a truck and dispatcher"
                );

                return;
            }

            try {


                if (editingAssignment) {
                    const id =
                        editingAssignment.id ??
                        editingAssignment._id;

                    if (!id) {
                        throw new Error(
                            "Assignment ID is missing"
                        );
                    }

                    await updateAssignment({
                        id,

                        truckId:
                            form.truckId,

                        dispatcherId:
                            form.dispatcherId,

                        status:
                            form.status,

                        notes:
                            form.notes,
                    }).unwrap();

                    toast.success(
                        "Assignment updated"
                    );
                }

                else {
                    await createAssignment({
                        truckId:
                            form.truckId,

                        dispatcherId:
                            form.dispatcherId,

                        notes:
                            form.notes,
                    }).unwrap();

                    toast.success(
                        "Assignment created"
                    );
                }

                await refetchAssignments();

                closeFormDialog();
            } catch (error) {
                console.error(
                    "Assignment save error:",
                    error
                );

                toast.error(
                    "Could not save the assignment"
                );
            }
        };


    return (
        <Box
            sx={{
                p: {
                    xs: 2,
                    md: 3,
                },

                color:
                    theme
                        .currentPalette
                        .text,
            }}
        >
            <Toaster position="top-center" />

            {/* =================================================
                PAGE CONTROLS
            ================================================= */}

            <Box
                sx={{
                    display: "flex",

                    flexDirection: {
                        xs: "column",
                        lg: "row",
                    },

                    alignItems: {
                        xs: "stretch",
                        lg: "center",
                    },

                    justifyContent:
                        "space-between",

                    gap: 2,

                    p: 2.5,

                    mb: 2,

                    border: `1px solid ${alpha(
                        theme
                            .currentPalette
                            .primary,
                        0.25
                    )}`,

                    borderRadius: 2,

                    bgcolor:
                        theme
                            .currentPalette
                            .background,
                }}
            >
                {/* LEFT */}

                <Box>
                    <Typography
                        sx={{
                            fontSize: {
                                xs: 20,
                                md: 24,
                            },

                            fontWeight: 700,

                            color:
                                theme
                                    .currentPalette
                                    .primary,
                        }}
                    >
                        Assignments Details
                    </Typography>

                    <Typography
                        sx={{
                            mt: 0.5,

                            fontSize: 16,

                            color: alpha(
                                theme
                                    .currentPalette
                                    .primary,
                                0.8
                            ),
                        }}
                    >
                        Check list of all
                        truck dispatcher
                        assignments
                    </Typography>
                </Box>

                {/* RIGHT */}

                <Box
                    sx={{
                        display: "flex",

                        flexDirection: {
                            xs: "column",
                            sm: "row",
                        },

                        alignItems:
                            "center",

                        gap: 1.5,

                        width: {
                            xs: "100%",
                            lg: "auto",
                        },
                    }}
                >
                    <TextField
                        size="small"

                        placeholder="Search assignments.."

                        value={search}

                        onChange={(
                            event
                        ) =>
                            setSearch(
                                event
                                    .target
                                    .value
                            )
                        }

                        sx={{
                            width: {
                                xs: "100%",
                                sm: 400,
                            },

                            "& .MuiOutlinedInput-root":
                            {
                                height: 56,

                                borderRadius: 2,

                                bgcolor:
                                    theme
                                        .currentPalette
                                        .background,

                                "& fieldset":
                                {
                                    borderColor:
                                        alpha(
                                            theme
                                                .currentPalette
                                                .primary,
                                            0.25
                                        ),
                                },

                                "&:hover fieldset":
                                {
                                    borderColor:
                                        alpha(
                                            theme
                                                .currentPalette
                                                .primary,
                                            0.55
                                        ),
                                },

                                "&.Mui-focused fieldset":
                                {
                                    borderColor:
                                        theme
                                            .currentPalette
                                            .primary,
                                },
                            },
                        }}
                    />

                    <Button
                        variant="contained"

                        startIcon={
                            <Plus
                                size={20}
                            />
                        }

                        onClick={
                            openCreate
                        }

                        sx={{
                            height: 56,

                            minWidth: 185,

                            px: 3,

                            borderRadius: 2,

                            bgcolor:
                                theme
                                    .currentPalette
                                    .primary,

                            textTransform:
                                "none",

                            fontSize: 16,

                            fontWeight: 700,

                            whiteSpace:
                                "nowrap",

                            boxShadow:
                                "0 2px 6px rgba(0,0,0,0.18)",

                            "&:hover": {
                                bgcolor:
                                    darken(
                                        theme
                                            .currentPalette
                                            .primary,
                                        0.1
                                    ),
                            },
                        }}
                    >
                        Add Assignment
                    </Button>
                </Box>
            </Box>

            {/* =================================================
                ERROR
            ================================================= */}

            {isError && (
                <Alert
                    severity="error"
                    sx={{
                        mb: 2,
                    }}
                >
                    Could not load truck
                    dispatcher assignments.
                </Alert>
            )}

            {/* =================================================
                TABLE
            ================================================= */}

            <Box
                sx={{
                    border: `1px solid ${alpha(
                        theme
                            .currentPalette
                            .primary,
                        0.25
                    )}`,

                    borderRadius: 2,

                    overflow: "hidden",

                    bgcolor:
                        theme
                            .currentPalette
                            .background,
                }}
            >
                <DataTable
                    columns={columns}

                    data={
                        filteredAssignments
                    }

                    loading={
                        isLoading ||
                        isFetching
                    }

                    renderRow={(
                        assignment
                    ) => (
                        <TableRow
                            key={
                                assignment.id ??
                                assignment._id
                            }
                            hover
                        >
                            <TableCell align="center">
                                {getName(
                                    getAssignmentTruck(
                                        assignment
                                    )
                                )}
                            </TableCell>

                            <TableCell align="center">
                                {getName(
                                    getAssignmentDispatcher(
                                        assignment
                                    )
                                )}
                            </TableCell>

                            <TableCell align="center">
                                <StatusChip
                                    status={
                                        assignment.status
                                    }
                                />
                            </TableCell>

                            <TableCell align="center">
                                {assignment.notes ||
                                    "-"}
                            </TableCell>

                            <TableCell align="center">
                                <IconButton
                                    aria-label="Assignment actions"

                                    onClick={(
                                        event
                                    ) =>
                                        handleOpenActions(
                                            event,
                                            assignment
                                        )
                                    }

                                    sx={{
                                        color:
                                            theme
                                                .currentPalette
                                                .primary,

                                        p: 0.5,
                                    }}
                                >
                                    <CircleEllipsis
                                        size={28}
                                        strokeWidth={
                                            1.8
                                        }
                                    />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    )}
                />
            </Box>

            {/* =================================================
                ACTION MENU
            ================================================= */}

            <Menu
                anchorEl={
                    actionAnchor
                }

                open={Boolean(
                    actionAnchor
                )}

                onClose={
                    handleCloseActions
                }

                anchorOrigin={{
                    vertical:
                        "bottom",

                    horizontal:
                        "right",
                }}

                transformOrigin={{
                    vertical: "top",

                    horizontal:
                        "right",
                }}

                PaperProps={{
                    sx: {
                        minWidth: 150,

                        mt: 0.5,

                        borderRadius: 2,

                        boxShadow:
                            "0 4px 18px rgba(0,0,0,0.12)",
                    },
                }}
            >
                <MenuItem
                    onClick={
                        handleViewFromMenu
                    }

                    sx={{
                        gap: 1.5,
                        py: 1.2,
                    }}
                >
                    <Eye
                        size={18}

                        color={
                            theme
                                .currentPalette
                                .primary
                        }
                    />

                    View
                </MenuItem>

                <MenuItem
                    onClick={
                        handleEditFromMenu
                    }

                    sx={{
                        gap: 1.5,
                        py: 1.2,
                    }}
                >
                    <Pencil
                        size={18}

                        color={
                            theme
                                .currentPalette
                                .primary
                        }
                    />

                    Edit
                </MenuItem>
            </Menu>

            {/* =================================================
                ADD / EDIT POPUP
            ================================================= */}

            <Dialog
                open={dialogOpen}

                onClose={
                    closeFormDialog
                }

                fullWidth

                maxWidth="sm"

                PaperProps={{
                    sx: {
                        borderRadius: 2,
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        display: "flex",

                        alignItems:
                            "center",

                        justifyContent:
                            "space-between",

                        color:
                            theme
                                .currentPalette
                                .primary,

                        fontWeight: 700,
                    }}
                >
                    {editingAssignment
                        ? "Edit Assignment"
                        : "Add Assignment"}

                    <IconButton
                        onClick={
                            closeFormDialog
                        }
                    >
                        <X size={22} />
                    </IconButton>
                </DialogTitle>

                <DialogContent
                    sx={{
                        display: "flex",

                        flexDirection:
                            "column",

                        gap: 2,

                        pt: "12px !important",
                    }}
                >
                    {isUnusedTrucksError && (
                        <Alert severity="error">
                            Could not load
                            available trucks.
                        </Alert>
                    )}

                    {/* ==========================
                        TRUCK
                    ========================== */}

                    <FormControl
                        fullWidth

                        disabled={
                            isLoadingUnusedTrucks ||
                            isFetchingUnusedTrucks
                        }
                    >
                        <InputLabel id="truck-label">
                            Truck
                        </InputLabel>

                        <Select
                            labelId="truck-label"

                            label="Truck"

                            value={
                                form.truckId
                            }

                            onChange={(
                                event
                            ) =>
                                setForm(
                                    (
                                        prev
                                    ) => ({
                                        ...prev,

                                        truckId:
                                            event
                                                .target
                                                .value,
                                    })
                                )
                            }
                        >
                            {isLoadingUnusedTrucks ||
                                isFetchingUnusedTrucks ? (
                                <MenuItem disabled>
                                    Loading trucks...
                                </MenuItem>
                            ) : availableTrucksForForm.length ===
                                0 ? (
                                <MenuItem disabled>
                                    No unused trucks
                                    available
                                </MenuItem>
                            ) : (
                                availableTrucksForForm.map(
                                    (
                                        truck
                                    ) => {
                                        const truckId =
                                            getId(
                                                truck
                                            );

                                        return (
                                            <MenuItem
                                                key={
                                                    truckId
                                                }

                                                value={
                                                    truckId
                                                }
                                            >
                                                {truck.truckNumber ??
                                                    "No Truck Number"}

                                                {truck.model
                                                    ? ` · ${truck.model}`
                                                    : ""}
                                            </MenuItem>
                                        );
                                    }
                                )
                            )}
                        </Select>
                    </FormControl>

                    {/* ==========================
                        DISPATCHER
                    ========================== */}

                    <FormControl
                        fullWidth
                    >
                        <InputLabel id="dispatcher-label">
                            Dispatcher
                        </InputLabel>

                        <Select
                            labelId="dispatcher-label"

                            label="Dispatcher"

                            value={
                                form.dispatcherId
                            }

                            onChange={(
                                event
                            ) =>
                                setForm(
                                    (
                                        prev
                                    ) => ({
                                        ...prev,

                                        dispatcherId:
                                            event
                                                .target
                                                .value,
                                    })
                                )
                            }
                        >
                            {dispatchers.map(
                                (
                                    dispatcher
                                ) => (
                                    <MenuItem
                                        key={
                                            dispatcher.id
                                        }

                                        value={
                                            dispatcher.id
                                        }
                                    >
                                        {
                                            dispatcher.name
                                        }
                                    </MenuItem>
                                )
                            )}
                        </Select>
                    </FormControl>

                    {/* ==========================
                        STATUS - EDIT ONLY
                    ========================== */}

                    {editingAssignment && (
                        <FormControl
                            fullWidth
                        >
                            <InputLabel id="status-label">
                                Status
                            </InputLabel>

                            <Select
                                labelId="status-label"

                                label="Status"

                                value={
                                    form.status
                                }

                                onChange={(
                                    event
                                ) =>
                                    setForm(
                                        (
                                            prev
                                        ) => ({
                                            ...prev,

                                            status:
                                                event
                                                    .target
                                                    .value as
                                                | "active"
                                                | "inactive",
                                        })
                                    )
                                }
                            >
                                <MenuItem value="active">
                                    Active
                                </MenuItem>

                                <MenuItem value="inactive">
                                    Inactive
                                </MenuItem>
                            </Select>
                        </FormControl>
                    )}

                    {/* ==========================
                        NOTES
                    ========================== */}

                    <TextField
                        label="Notes"

                        value={
                            form.notes
                        }

                        onChange={(
                            event
                        ) =>
                            setForm(
                                (
                                    prev
                                ) => ({
                                    ...prev,

                                    notes:
                                        event
                                            .target
                                            .value,
                                })
                            )
                        }

                        multiline

                        minRows={3}

                        fullWidth
                    />
                </DialogContent>

                <DialogActions
                    sx={{
                        px: 3,
                        pb: 2.5,
                    }}
                >
                    <Button
                        onClick={
                            closeFormDialog
                        }

                        sx={{
                            textTransform:
                                "none",
                        }}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={
                            handleSubmit
                        }

                        variant="contained"

                        disabled={
                            isCreating ||
                            isUpdating ||
                            isLoadingUnusedTrucks ||
                            isFetchingUnusedTrucks
                        }

                        sx={{
                            textTransform:
                                "none",

                            bgcolor:
                                theme
                                    .currentPalette
                                    .primary,
                        }}
                    >
                        {isCreating ||
                            isUpdating
                            ? "Saving..."
                            : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* =================================================
                VIEW POPUP
            ================================================= */}

            <Dialog
                open={Boolean(
                    viewAssignment
                )}

                onClose={() =>
                    setViewAssignment(
                        null
                    )
                }

                fullWidth

                maxWidth="sm"

                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        overflow: "hidden",
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        display: "flex",

                        alignItems:
                            "center",

                        justifyContent:
                            "space-between",

                        px: 3,
                        py: 2.5,

                        borderBottom: `1px solid ${alpha(
                            theme
                                .currentPalette
                                .text,
                            0.15
                        )}`,
                    }}
                >
                    <Box
                        sx={{
                            display:
                                "flex",

                            alignItems:
                                "center",

                            gap: 2,
                        }}
                    >
                        <Box
                            sx={{
                                width: 54,
                                height: 54,

                                borderRadius:
                                    "50%",

                                display:
                                    "flex",

                                alignItems:
                                    "center",

                                justifyContent:
                                    "center",

                                bgcolor:
                                    alpha(
                                        theme
                                            .currentPalette
                                            .primary,
                                        0.08
                                    ),

                                border: `1px solid ${alpha(
                                    theme
                                        .currentPalette
                                        .primary,
                                    0.15
                                )}`,

                                color:
                                    theme
                                        .currentPalette
                                        .primary,
                            }}
                        >
                            <Truck
                                size={26}
                            />
                        </Box>

                        <Typography
                            sx={{
                                fontSize: {
                                    xs: 21,
                                    sm: 26,
                                },

                                fontWeight: 500,

                                color:
                                    theme
                                        .currentPalette
                                        .text,
                            }}
                        >
                            Assignment Details
                        </Typography>
                    </Box>

                    <IconButton
                        onClick={() =>
                            setViewAssignment(
                                null
                            )
                        }
                    >
                        <X size={24} />
                    </IconButton>
                </DialogTitle>

                <DialogContent
                    sx={{
                        p: "30px !important",
                    }}
                >
                    <Box
                        sx={{
                            border: `1px solid ${alpha(
                                theme
                                    .currentPalette
                                    .primary,
                                0.22
                            )}`,

                            borderRadius: 2,

                            p: {
                                xs: 2.5,
                                sm: 3.5,
                            },
                        }}
                    >
                        {/* TOP */}

                        <Box
                            sx={{
                                display:
                                    "flex",

                                alignItems:
                                    "center",

                                justifyContent:
                                    "space-between",

                                gap: 2,

                                flexWrap:
                                    "wrap",
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: {
                                        xs: 21,
                                        sm: 27,
                                    },

                                    fontWeight: 700,

                                    color:
                                        theme
                                            .currentPalette
                                            .primary,
                                }}
                            >
                                Truck - (
                                {getName(
                                    viewAssignment
                                        ? getAssignmentTruck(
                                            viewAssignment
                                        )
                                        : undefined
                                )}
                                )
                            </Typography>

                            <Box
                                sx={{
                                    minWidth: 125,

                                    px: 2.5,
                                    py: 1.1,

                                    borderRadius: 1.5,

                                    textAlign:
                                        "center",

                                    bgcolor:
                                        viewAssignment?.status ===
                                            "active"
                                            ? alpha(
                                                theme
                                                    .currentPalette
                                                    .primary,
                                                0.75
                                            )
                                            : alpha(
                                                theme
                                                    .currentPalette
                                                    .text,
                                                0.12
                                            ),

                                    color:
                                        viewAssignment?.status ===
                                            "active"
                                            ? "#fff"
                                            : theme
                                                .currentPalette
                                                .text,

                                    fontSize: 17,

                                    fontWeight: 600,

                                    textTransform:
                                        "capitalize",
                                }}
                            >
                                {viewAssignment?.status ??
                                    "-"}
                            </Box>
                        </Box>

                        {/* DIVIDER */}

                        <Box
                            sx={{
                                height: "1px",

                                bgcolor:
                                    alpha(
                                        theme
                                            .currentPalette
                                            .text,
                                        0.15
                                    ),

                                my: 3.5,
                            }}
                        />

                        {/* DETAILS */}

                        <Box
                            sx={{
                                display:
                                    "grid",

                                gridTemplateColumns:
                                {
                                    xs: "1fr",
                                    sm: "1fr 1fr",
                                },

                                columnGap: 5,

                                rowGap: 3,
                            }}
                        >
                            {/* DISPATCHER */}

                            <DetailItem
                                icon={
                                    <UserRound
                                        size={
                                            25
                                        }
                                    />
                                }

                                label="Dispatcher"

                                value={getName(
                                    viewAssignment
                                        ? getAssignmentDispatcher(
                                            viewAssignment
                                        )
                                        : undefined
                                )}

                                primary={
                                    theme
                                        .currentPalette
                                        .primary
                                }
                            />

                            {/* EMAIL */}

                            <DetailItem
                                icon={
                                    <Mail
                                        size={
                                            25
                                        }
                                    />
                                }

                                label="Email"

                                value={
                                    typeof viewAssignment?.dispatcher ===
                                        "object"
                                        ? viewAssignment
                                            .dispatcher
                                            .email ||
                                        "-"
                                        : "-"
                                }

                                primary={
                                    theme
                                        .currentPalette
                                        .primary
                                }
                            />

                            {/* JOB ID */}

                            <DetailItem
                                icon={
                                    <BadgeCheck
                                        size={
                                            25
                                        }
                                    />
                                }

                                label="Job ID"

                                value={
                                    typeof viewAssignment?.dispatcher ===
                                        "object"
                                        ? viewAssignment
                                            .dispatcher
                                            .jobId ||
                                        "-"
                                        : "-"
                                }

                                primary={
                                    theme
                                        .currentPalette
                                        .primary
                                }
                            />

                            {/* STATUS */}

                            <DetailItem
                                icon={
                                    <Activity
                                        size={
                                            25
                                        }
                                    />
                                }

                                label="Status"

                                value={
                                    viewAssignment?.status ||
                                    "-"
                                }

                                primary={
                                    theme
                                        .currentPalette
                                        .primary
                                }
                            />

                            {/* ASSIGNED BY */}

                            <DetailItem
                                icon={
                                    <UserCheck
                                        size={
                                            25
                                        }
                                    />
                                }

                                label="Assigned By"

                                value={
                                    viewAssignment?.assignedBy ||
                                    "-"
                                }

                                primary={
                                    theme
                                        .currentPalette
                                        .primary
                                }
                            />

                            {/* CREATED */}

                            <DetailItem
                                icon={
                                    <CalendarDays
                                        size={
                                            25
                                        }
                                    />
                                }

                                label="Created"

                                value={
                                    viewAssignment?.createdAt
                                        ? new Date(
                                            viewAssignment.createdAt
                                        ).toLocaleString()
                                        : "-"
                                }

                                primary={
                                    theme
                                        .currentPalette
                                        .primary
                                }
                            />

                            {/* NOTES */}

                            <Box
                                sx={{
                                    gridColumn:
                                    {
                                        xs: "auto",
                                        sm: "1 / -1",
                                    },
                                }}
                            >
                                <DetailItem
                                    icon={
                                        <FileText
                                            size={
                                                25
                                            }
                                        />
                                    }

                                    label="Notes"

                                    value={
                                        viewAssignment?.notes ||
                                        "-"
                                    }

                                    primary={
                                        theme
                                            .currentPalette
                                            .primary
                                    }
                                />
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
}