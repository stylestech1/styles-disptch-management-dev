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
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    ListItemText,
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


type TruckDispatcher = {
    id?: string;
    _id?: string;

    truck?: string | TTruck;
    truckId?: string | TTruck;

    dispatcher?: string | TUser;
    dispatcherId?: string | TUser;
    assignedBy?: string;
    createdAt?: string;
    updatedAt?: string;
    status: "active" | "inactive";
    notes?: string;
};

type SelectedTruck = {
    truckId: string;
    notes: string;
};

type AssignmentForm = {
    trucks: SelectedTruck[];
    dispatcherId: string;
    status: "active" | "inactive";
};
type DetailItemProps = {
    icon: ReactNode;
    label: string;
    value: ReactNode;
    primary: string;
};

type UnusedTruck = TTruck & {
    _id?: string;
    id?: string;
    truckNumber?: string;
    model?: string;
};


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


export default function AssignDriver() {
    const theme = useAppSelector(
        (state: RootState) =>
            state.palette
    );


    const {
        data: dispatcherResponse,
    } =
        useGetActiveDispatchersQuery({
            page: 1,
            limit: 100,
        });

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

    const [form, setForm] = useState<AssignmentForm>({
        trucks: [],
        dispatcherId: "",
        status: "active",
    });

    const [
        search,
        setSearch,
    ] = useState("");

    const [
        debouncedSearch,
        setDebouncedSearch,
    ] = useState("");

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


    const unusedTrucks =
        unwrapList<UnusedTruck>(
            unusedTrucksResponse
        );


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

            if (
                !currentTruck ||
                typeof currentTruck ===
                "string"
            ) {
                return unusedTrucks;
            }

            const currentTruckId =
                getId(currentTruck);

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


    const openCreate = () => {
        setEditingAssignment(null);

        setForm({
            trucks: [],
            dispatcherId: "",
            status: "active",
        });

        setDialogOpen(true);
    };

    const openEdit = (assignment: TruckDispatcher) => {
        setEditingAssignment(assignment);

        const truckId = getId(
            getAssignmentTruck(assignment)
        );

        setForm({
            trucks: truckId
                ? [
                    {
                        truckId,
                        notes: assignment.notes ?? "",
                    },
                ]
                : [],

            dispatcherId: getId(
                getAssignmentDispatcher(assignment)
            ),

            status: assignment.status ?? "active",
        });

        setDialogOpen(true);
    };



    const closeFormDialog = () => {
        setDialogOpen(false);

        setEditingAssignment(null);
    };


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

    const handleSubmit = async () => {
        if (form.trucks.length === 0 || !form.dispatcherId) {
            toast.error("Choose at least one truck and dispatcher");
            return;
        }

        try {
            if (editingAssignment) {
                const id =
                    editingAssignment.id ??
                    editingAssignment._id;

                if (!id) {
                    throw new Error("Assignment ID is missing");
                }

                const truck = form.trucks[0];

                await updateAssignment({
                    id,
                    truckId: truck.truckId,
                    dispatcherId: form.dispatcherId,
                    status: form.status,
                    notes: truck.notes,
                }).unwrap();

                await refetchAssignments();

                toast.success("Assignment updated");
            } else {
                const payload = form.trucks.map((truck) => ({
                    truckId: truck.truckId,
                    dispatcherId: form.dispatcherId,
                    notes: truck.notes,
                }));

                await createAssignment(payload).unwrap();

                await refetchAssignments();

                toast.success("Assignments created");
            }

            closeFormDialog();
        } catch (error) {

            toast.error("Could not save the assignment");
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


                    <FormControl
                        fullWidth
                        disabled={
                            isLoadingUnusedTrucks ||
                            isFetchingUnusedTrucks
                        }
                    >
                        <InputLabel id="truck-label">
                            Trucks
                        </InputLabel>

                        <Select<string[]>
                            labelId="truck-label"
                            label="Trucks"
                            multiple
                            value={form.trucks.map(
                                (item) => item.truckId
                            )}
                            onChange={(event) => {
                                const value = event.target.value;

                                const selectedIds =
                                    typeof value === "string"
                                        ? value.split(",")
                                        : value;

                                setForm((prev) => ({
                                    ...prev,

                                    trucks: selectedIds.map(
                                        (truckId) => {
                                            const existing =
                                                prev.trucks.find(
                                                    (item) =>
                                                        item.truckId ===
                                                        truckId
                                                );

                                            return (
                                                existing ?? {
                                                    truckId,
                                                    notes: "",
                                                }
                                            );
                                        }
                                    ),
                                }));
                            }}
                            renderValue={(selectedIds) =>
                                selectedIds
                                    .map((id) => {
                                        const truck =
                                            availableTrucksForForm.find(
                                                (item) =>
                                                    getId(item) === id
                                            );

                                        return (
                                            truck?.truckNumber ??
                                            truck?.model ??
                                            id
                                        );
                                    })
                                    .join(", ")
                            }
                        >
                            {availableTrucksForForm.map(
                                (truck) => {
                                    const truckId = getId(truck);

                                    const isSelected =
                                        form.trucks.some(
                                            (item) =>
                                                item.truckId ===
                                                truckId
                                        );

                                    return (
                                        <MenuItem
                                            key={truckId}
                                            value={truckId}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                            />

                                            <ListItemText
                                                primary={
                                                    truck.truckNumber ??
                                                    "No Truck Number"
                                                }
                                                secondary={
                                                    truck.model
                                                }
                                            />
                                        </MenuItem>
                                    );
                                }
                            )}
                        </Select>
                    </FormControl>

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

                    {form.trucks.length > 0 && (
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                            }}
                        >
                            {form.trucks.map((selectedTruck) => {
                                const truck =
                                    availableTrucksForForm.find(
                                        (item) =>
                                            getId(item) ===
                                            selectedTruck.truckId
                                    );

                                const truckNumber =
                                    truck?.truckNumber ??
                                    "Unknown";

                                return (
                                    <Box
                                        key={selectedTruck.truckId}
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: {
                                                xs: "1fr",
                                                sm: "130px 1fr",
                                            },
                                            alignItems: "center",
                                            gap: 1.5,
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontWeight: 700,
                                                color:
                                                    theme
                                                        .currentPalette
                                                        .primary,
                                            }}
                                        >
                                            Truck #{truckNumber}
                                        </Typography>

                                        <TextField
                                            label={`Notes for Truck ${truckNumber}`}
                                            value={
                                                selectedTruck.notes
                                            }
                                            onChange={(event) => {
                                                const notes =
                                                    event.target.value;

                                                setForm((prev) => ({
                                                    ...prev,

                                                    trucks:
                                                        prev.trucks.map(
                                                            (item) =>
                                                                item.truckId ===
                                                                    selectedTruck.truckId
                                                                    ? {
                                                                        ...item,
                                                                        notes,
                                                                    }
                                                                    : item
                                                        ),
                                                }));
                                            }}
                                            fullWidth
                                            multiline
                                            minRows={2}
                                        />
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
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