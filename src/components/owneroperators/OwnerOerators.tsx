"use client";

import { useEffect, useMemo, useState } from "react";
import {
    useCreateOwnerOperatorMutation,
    useDeleteOwnerOperatorMutation,
    useGetOwnerOperatorsQuery,
    useUpdateOwnerOperatorMutation,
    useUpdateOwnerOperatorStatusMutation,
} from "@/redux/slices/apiSlice";
import { RootState, useAppSelector } from "@/redux/store";
import { OwnerOperatorStatus, TOwnerOperator } from "@/types/globalTypes";
import toast, { Toaster } from "react-hot-toast";
import {
    alpha,
    Box,
    Button,
    Chip,
    Dialog,
    IconButton,
    TextField,
    Typography,
} from "@mui/material";
import {
    Ban,
    BriefcaseBusiness,
    CalendarDays,
    Clock3,
    GripVertical,
    MapPin,
    Pencil,
    Phone,
    Plus,
    ShieldCheck,
    Trash2,
    Truck,
    UserRound,
    UsersRound,
    X,
} from "lucide-react";

const statuses: { key: OwnerOperatorStatus; description: string; icon: typeof Plus }[] = [
    { key: "New", description: "New operators to review", icon: Plus },
    { key: "Pending", description: "Waiting for information", icon: BriefcaseBusiness },
    { key: "Qualified", description: "Ready for onboarding", icon: ShieldCheck },
    { key: "Disqualified", description: "Requirements not met", icon: Ban },
    { key: "Rejected", description: "Application rejected", icon: X },
];

type FormValues = Omit<TOwnerOperator, "_id" | "status">;

const emptyForm: FormValues = {
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    currentLocation: "",
    cdlExperienceYears: 0,
    truckYear: new Date().getFullYear(),
    truckMake: "",
    truckModel: "",
    preferredOperatingArea: "",
};

const normalizeStatus = (status?: string): OwnerOperatorStatus => {
    const value = String(status || "").toLowerCase();
    return statuses.find((item) => item.key.toLowerCase() === value)?.key || "New";
};

const operatorId = (operator: TOwnerOperator) => operator._id || (operator as TOwnerOperator & { id?: string }).id || "";

const formatOperatorDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

export function OwnerOperators() {
    const theme = useAppSelector((state: RootState) => state.palette);
    const { data, isLoading, refetch } = useGetOwnerOperatorsQuery({ page: 1, limit: 100 }, { refetchOnMountOrArgChange: true });
    const [createOperator, { isLoading: creating }] = useCreateOwnerOperatorMutation();
    const [updateOperator, { isLoading: updating }] = useUpdateOwnerOperatorMutation();
    const [updateStatus] = useUpdateOwnerOperatorStatusMutation();
    const [deleteOperator] = useDeleteOwnerOperatorMutation();

    const [operators, setOperators] = useState<TOwnerOperator[]>([]);
    const [search, setSearch] = useState("");
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dropStatus, setDropStatus] = useState<OwnerOperatorStatus | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [editing, setEditing] = useState<TOwnerOperator | null>(null);
    const [selected, setSelected] = useState<TOwnerOperator | null>(null);
    const [form, setForm] = useState<FormValues>(emptyForm);

    useEffect(() => {
        if (data?.data) setOperators(data.data);
    }, [data?.data]);

    const filtered = useMemo(() => {
        const value = search.trim().toLowerCase();
        if (!value) return operators;
        return operators.filter((operator) => Object.values(operator).some((item) => String(item ?? "").toLowerCase().includes(value)));
    }, [operators, search]);

    const stats = useMemo(() => statuses.reduce((result, item) => {
        result[item.key] = operators.filter((operator) => normalizeStatus(operator.status) === item.key).length;
        return result;
    }, { New: 0, Pending: 0, Qualified: 0, Disqualified: 0, Rejected: 0 } as Record<OwnerOperatorStatus, number>), [operators]);

    const setField = (field: keyof FormValues, value: string | number) => setForm((current) => ({ ...current, [field]: value }));

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setDialogOpen(true);
    };

    const openEdit = (operator: TOwnerOperator) => {
        setEditing(operator);
        setForm({
            firstName: operator.firstName || "",
            lastName: operator.lastName || "",
            phone: operator.phone || "",
            email: operator.email || "",
            currentLocation: operator.currentLocation || "",
            cdlExperienceYears: Number(operator.cdlExperienceYears || 0),
            truckYear: Number(operator.truckYear || new Date().getFullYear()),
            truckMake: operator.truckMake || "",
            truckModel: operator.truckModel || "",
            preferredOperatingArea: operator.preferredOperatingArea || "",
        });
        setDialogOpen(true);
    };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        const body = { ...form, cdlExperienceYears: Number(form.cdlExperienceYears), truckYear: Number(form.truckYear) };
        try {
            if (editing) {
                await updateOperator({ id: operatorId(editing), body }).unwrap();
                setOperators((current) => current.map((item) => operatorId(item) === operatorId(editing) ? { ...item, ...body } : item));
                toast.success("Owner operator updated successfully");
            } else {
                const response = await createOperator(body).unwrap();
                const created = response?.data || response;
                setOperators((current) => [{ ...body, ...created, _id: created?._id || created?.id || `temp-${Date.now()}`, status: created?.status || "New" }, ...current]);
                toast.success("Owner operator created successfully");
            }
            setDialogOpen(false);
            refetch();
        } catch {
            toast.error(`Failed to ${editing ? "update" : "create"} owner operator`);
        }
    };

    const moveOperator = async (status: OwnerOperatorStatus) => {
        if (!draggedId) return;
        const current = operators.find((item) => operatorId(item) === draggedId);
        if (!current || normalizeStatus(current.status) === status) return;
        const previous = operators;
        setOperators((items) => items.map((item) => operatorId(item) === draggedId ? { ...item, status } : item));
        try {
            await updateStatus({ id: draggedId, status }).unwrap();
            toast.success(`Operator moved to ${status}`);
        } catch {
            setOperators(previous);
            toast.error("Failed to update operator status");
        } finally {
            setDraggedId(null);
            setDropStatus(null);
        }
    };

    const removeOperator = async (operator: TOwnerOperator) => {
        if (!window.confirm(`Delete ${operator.firstName} ${operator.lastName}?`)) return;
        try {
            await deleteOperator(operatorId(operator)).unwrap();
            setOperators((items) => items.filter((item) => operatorId(item) !== operatorId(operator)));
            toast.success("Owner operator deleted");
        } catch {
            toast.error("Failed to delete owner operator");
        }
    };

    const inputProps = { fullWidth: true, size: "small" as const, sx: { "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff" } } };

    return (
        <Box sx={{ p: { xs: 1.5, md: 3 } }}>
            <Toaster position="top-center" />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(5, 1fr)" }, gap: 2, mb: 3 }}>
                <Stat title="Total Operators" value={operators.length} icon={<UsersRound size={20} />} color={theme.currentPalette.primary} />
                {statuses.slice(0, 4).map((item) => <Stat key={item.key} title={item.key} value={stats[item.key]} icon={<item.icon size={20} />} color={theme.currentPalette.primary} />)}
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", justifyContent: "space-between", p: 2.5, mb: 3, border: `1px solid ${alpha(theme.currentPalette.primary, .3)}`, borderRadius: 2, bgcolor: theme.currentPalette.background }}>
                <Box><Typography variant="h6" sx={{ color: theme.currentPalette.primary }}>Owner Operators Board</Typography><Typography variant="body2" sx={{ color: theme.currentPalette.primary, mt: .5 }}>Drag operator cards between columns to update their status</Typography></Box>
                <TextField {...inputProps} value={search} placeholder="Search by name, phone, location..." onChange={(event) => setSearch(event.target.value)} sx={{ ...inputProps.sx, flex: "1 1 300px", maxWidth: 420 }} />
                <Button variant="contained" startIcon={<Plus size={20} />} onClick={openCreate} sx={{ minHeight: 42, borderRadius: 2, bgcolor: theme.currentPalette.primary }}>Add Owner Operator</Button>
            </Box>
            {isLoading ? <Typography sx={{ p: 4, textAlign: "center" }}>Loading owner operators...</Typography> : <Box sx={{ display: "flex", gap: 1.5, overflowX: "auto", pb: 2 }}>
                {statuses.map(({ key, description, icon: Icon }) => {
                    const items = filtered.filter((item) => normalizeStatus(item.status) === key);
                    return <Box key={key} onDragOver={(event) => { event.preventDefault(); setDropStatus(key); }} onDragLeave={() => setDropStatus(null)} onDrop={(event) => { event.preventDefault(); void moveOperator(key); }} sx={{ flex: "1 0 300px", minHeight: 520, p: 1.5, borderRadius: 2.5, bgcolor: dropStatus === key ? alpha(theme.currentPalette.primary, .08) : "#F8FAFC", border: `1px solid ${dropStatus === key ? theme.currentPalette.primary : "#E5EAF3"}` }}>
                        <Box sx={{ p: 1.5, mb: 1.5, bgcolor: "#fff", borderRadius: 2, border: "1px solid #EEF2F7", display: "flex", justifyContent: "space-between", alignItems: "center" }}><Box sx={{ display: "flex", gap: 1, alignItems: "center" }}><Icon size={19} color={theme.currentPalette.primary} /><Box><Typography sx={{ fontWeight: 700 }}>{key}</Typography><Typography sx={{ fontSize: 11, color: "#6B7280" }}>{description}</Typography></Box></Box><Chip size="small" label={items.length} /></Box>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.3 }}>{items.length ? items.map((operator) => <OperatorCard key={operatorId(operator)} operator={operator} themeColor={theme.currentPalette.primary} onDragStart={() => setDraggedId(operatorId(operator))} onClick={() => { setSelected(operator); setViewOpen(true); }} onEdit={() => openEdit(operator)} onDelete={() => void removeOperator(operator)} />) : <Box sx={{ height: 160, display: "grid", placeItems: "center", border: "1px dashed #CBD5E1", borderRadius: 2, color: "#94A3B8" }}>Drop operators here</Box>}</Box>
                    </Box>;
                })}
            </Box>}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <Box component="form" onSubmit={submit} sx={{ p: 3, bgcolor: theme.currentPalette.background }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}><Typography variant="h6" sx={{ color: theme.currentPalette.primary }}>{editing ? "Edit Owner Operator" : "Add Owner Operator"}</Typography><IconButton onClick={() => setDialogOpen(false)}><X size={20} /></IconButton></Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                        {(["firstName", "lastName", "phone", "email", "currentLocation", "truckMake", "truckModel", "preferredOperatingArea"] as const).map((field) => <TextField key={field} {...inputProps} required={!["truckMake", "truckModel"].includes(field)} label={field.replace(/([A-Z])/g, " $1")} value={form[field]} onChange={(event) => setField(field, event.target.value)} />)}
                        <TextField {...inputProps} required type="number" label="CDL Experience Years" value={form.cdlExperienceYears} onChange={(event) => setField("cdlExperienceYears", event.target.value)} />
                        <TextField {...inputProps} required type="number" label="Truck Year" value={form.truckYear} onChange={(event) => setField("truckYear", event.target.value)} />
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 3 }}><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" variant="contained" disabled={creating || updating} sx={{ borderRadius: 2, bgcolor: theme.currentPalette.primary }}>{editing ? "Update" : "Create"}</Button></Box>
                </Box>
            </Dialog>
            <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth><Box sx={{ p: 3 }}><Box sx={{ display: "flex", justifyContent: "space-between" }}><Typography variant="h6">Owner Operator Details</Typography><IconButton onClick={() => setViewOpen(false)}><X size={20} /></IconButton></Box>{selected && <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mt: 2 }}>{Object.entries({ Name: `${selected.firstName} ${selected.lastName}`, Email: selected.email, Phone: selected.phone, Location: selected.currentLocation, "CDL Experience": `${selected.cdlExperienceYears} years`, Truck: `${selected.truckYear} ${selected.truckMake} ${selected.truckModel}`, "Operating Area": selected.preferredOperatingArea, Status: normalizeStatus(selected.status) }).map(([label, value]) => <Box key={label} sx={{ p: 1.5, border: "1px solid #E5EAF3", borderRadius: 2 }}><Typography sx={{ fontSize: 12, color: "#6B7280" }}>{label}</Typography><Typography sx={{ mt: .5 }}>{value || "-"}</Typography></Box>)}</Box>}</Box></Dialog>
        </Box>
    );
}

function Stat({
    title,
    value,
    icon,
    color,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
}) {
    return (
        <Box
            sx={{
                p: 2,
                border: `1px solid ${alpha(color, 0.2)}`,
                borderRadius: 2,
                bgcolor: "#fff",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    color,
                }}
            >
                {icon}

                <Typography
                    sx={{
                        fontSize: 14,
                        color: "#6B7280",
                        fontWeight: 500,
                    }}
                >
                    {title}
                </Typography>
            </Box>

            <Typography
                sx={{
                    fontSize: 22,
                    fontWeight: 800,
                    mt: 0.5,
                    ml: 4,
                }}
            >
                {value}
            </Typography>
        </Box>
    );
}
function OperatorCard({
    operator,
    themeColor,
    onDragStart,
    onClick,
    onEdit,
    onDelete,
}: {
    operator: TOwnerOperator;
    themeColor: string;
    onDragStart: () => void;
    onClick: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <Box
            draggable
            onDragStart={onDragStart}
            onClick={onClick}
            sx={{
                p: 1.6,
                bgcolor: "#fff",
                border: `1px solid ${alpha(themeColor, 0.16)}`,
                borderRadius: 2,
                cursor: "grab",
                boxShadow: "0 6px 18px rgba(15,23,42,.06)",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 1,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        gap: 1,
                        minWidth: 0,
                    }}
                >
                    <Box
                        sx={{
                            width: 38,
                            height: 38,
                            borderRadius: 1.5,
                            bgcolor: alpha(themeColor, 0.1),
                            color: themeColor,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                        }}
                    >
                        <UserRound size={19} />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            sx={{
                                fontWeight: 700,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {operator.firstName} {operator.lastName}
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: 12,
                                color: "#6B7280",
                                display: "flex",
                                gap: 0.4,
                                alignItems: "center",
                            }}
                        >
                            <Phone size={12} />
                            {operator.phone || "-"}
                        </Typography>
                    </Box>
                </Box>

                <Box>
                    <IconButton
                        size="small"
                        onClick={(event) => {
                            event.stopPropagation();
                            onEdit();
                        }}
                    >
                        <Pencil size={16} />
                    </IconButton>

                    <IconButton
                        size="small"
                        onClick={(event) => {
                            event.stopPropagation();
                            onDelete();
                        }}
                    >
                        <Trash2 size={16} color="#dc2626" />
                    </IconButton>
                </Box>
            </Box>

            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.7,
                    mt: 1.3,
                }}
            >
                <Chip
                    size="small"
                    label={`${operator.cdlExperienceYears || 0} yrs CDL`}
                />

                <Chip
                    size="small"
                    label={`${operator.truckYear || "-"} ${operator.truckMake || ""}`}
                />
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gap: 0.7,
                    mt: 1.2,
                    color: "#4B5563",
                }}
            >
                <Typography
                    sx={{
                        fontSize: 13,
                        display: "flex",
                        gap: 0.7,
                        alignItems: "center",
                    }}
                >
                    <MapPin size={14} />
                    {operator.currentLocation || "No location"}
                </Typography>

                <Typography
                    sx={{
                        fontSize: 13,
                        display: "flex",
                        gap: 0.7,
                        alignItems: "center",
                    }}
                >
                    <Truck size={14} />
                    {operator.preferredOperatingArea || "No preferred area"}
                </Typography>

                {(operator.lastUpdatedBy?.name || operator.lastUpdatedBy?.jobId) && (
                    <Typography
                        sx={{
                            fontSize: 13,
                            display: "flex",
                            gap: 0.7,
                            alignItems: "center",
                        }}
                    >
                        <UserRound size={14} />

                        {operator.lastUpdatedBy?.name}

                        {operator.lastUpdatedBy?.jobId
                            ? ` (${operator.lastUpdatedBy.jobId})`
                            : ""}
                    </Typography>
                )}
            </Box>

            <Box
                sx={{
                    mt: 1.3,
                    pt: 1,
                    borderTop: "1px solid #EEF2F7",
                    color: "#9CA3AF",
                    display: "flex",
                    justifyContent: "space-between",
                }}
            >
                <Typography sx={{ fontSize: 11 }}>
                    Drag to change status
                </Typography>

                <GripVertical size={16} />
            </Box>
        </Box>
    );
}