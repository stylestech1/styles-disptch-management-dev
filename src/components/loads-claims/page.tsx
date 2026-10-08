"use client";

import { useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    FormControl,
    MenuItem,
    Select,
    TableCell,
    TableRow,
    Typography,
} from "@mui/material";
import { IoAlertCircle, IoCloseCircle, IoTime } from "react-icons/io5";
import DataTable, { Column } from "@/components/ui/DataTable";
import StatsCard from "@/components/ui/StatsCard";
import UpdateStatusModal from "@/components/loads/UpdateStatusModal";
import { useGetLoadClaimsQuery } from "@/redux/slices/apiSlice";
import { RootState, useAppSelector } from "@/redux/store";
import { TLoadClaim, TLoadClaimType } from "@/types/globalTypes";
import { getErrorMessage } from "@/utils/getErrorMessage";

type ClaimFilter = "all" | TLoadClaimType;

type ClaimRecord = {
    _id?: string;
    id?: string;
    type: TLoadClaimType;
    source?: string;
    status?: string;
    addedBy?: {
        _id?: string;
        name?: string;
        jobId?: number;
    };
    createdAt?: string;
    updatedAt?: string;
};

type ClaimLoad = Omit<TLoadClaim, "origin" | "destination"> & {
    _id?: string;

    origin?: string | {
        address?: string;
    };

    destination?: string | Array<{
        address?: string;
        _id?: string;
    }>;

    detentionLayovers?: ClaimRecord[];

    truckId?: {
        _id?: string;
        truckNumber?: string;
        model?: string;
    };

    driverId?: {
        _id?: string;
        name?: string;
        phone?: string;
        driverId?: number;
    };
};

type ClaimsResponse = {
    data?: {
        tonu?: ClaimLoad[];
        detention?: ClaimLoad[];
        layover?: ClaimLoad[];
    };

    results?: number;

    paginationResult?: {
        currentPage: number;
        limit: number;
        totalDocs: number;
        totalPages: number;
        next?: number;
        prev?: number;
    };
};

type ClaimRow = {
    key: string;
    load: ClaimLoad;
    type: TLoadClaimType;
    source?: string;
    recordStatus?: string;
    record?: ClaimRecord;
};

const getClaimsData = (
    response: unknown
): NonNullable<ClaimsResponse["data"]> => {
    if (!response || typeof response !== "object") {
        return {
            tonu: [],
            detention: [],
            layover: [],
        };
    }

    const result = response as ClaimsResponse;

    return {
        tonu: result.data?.tonu ?? [],
        detention: result.data?.detention ?? [],
        layover: result.data?.layover ?? [],
    };
};

const findClaimRecord = (
    load: ClaimLoad,
    type: TLoadClaimType
): ClaimRecord | undefined => {
    return load.detentionLayovers?.find(
        (record) => record.type === type
    );
};

const createRows = (
    loads: ClaimLoad[],
    type: TLoadClaimType
): ClaimRow[] => {
    return loads.map((load, index) => {
        const record = findClaimRecord(load, type);

        const loadKey =
            load._id ??
            load.id ??
            load.loadId ??
            `load-${index}`;

        return {
            key:
                record?._id ??
                record?.id ??
                `${loadKey}-${type}-${index}`,

            load,
            type,

            source: record?.source,

            recordStatus:
                type === "tonu"
                    ? load.tonuStatus
                    : record?.status,

            record,
        };
    });
};

const getClaimRows = (
    response: unknown,
    filter: ClaimFilter = "all"
): ClaimRow[] => {
    const data = getClaimsData(response);

    if (filter === "detention") {
        return createRows(data?.detention ?? [], "detention");
    }

    if (filter === "layover") {
        return createRows(data?.layover ?? [], "layover");
    }

    if (filter === "tonu") {
        return createRows(data?.tonu ?? [], "tonu");
    }

    return [
        ...createRows(data?.detention ?? [], "detention"),
        ...createRows(data?.layover ?? [], "layover"),
        ...createRows(data?.tonu ?? [], "tonu"),
    ];
};

const getOriginAddress = (load: ClaimLoad) => {
    if (!load.origin) return "-";

    if (typeof load?.origin === "string") {
        return load?.origin;
    }

    return load.origin?.address ?? "-";
};

const getDestinationAddress = (load: ClaimLoad) => {
    if (!load.destination) return "-";

    if (typeof load.destination === "string") {
        return load.destination;
    }

    if (Array.isArray(load.destination)) {
        return (
            load.destination
                .map((destination) => destination.address)
                .filter(Boolean)
                .join(" → ") || "-"
        );
    }

    return "-";
};

const formatDate = (date?: string) => {
    if (!date) return "-";
    const parsedDate = new Date(date);
    return Number.isNaN(parsedDate.getTime()) ? "-" : parsedDate.toLocaleString();
};

const titleCase = (value?: string) =>
    value
        ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
        : "-";

const columns: Column[] = [
    { key: "load", header: "Load", align: "left" },
    { key: "type", header: "Claim Type" },
    { key: "route", header: "Route", align: "left" },
    { key: "delivered", header: "Delivered" },
    { key: "source", header: "Source" },
    { key: "status", header: "Status" },
    { key: "reason", header: "TONU Reason", align: "left" },
    { key: "actions", header: "Actions" },
];

const LoadsClaimsPage = () => {
    const theme = useAppSelector((state: RootState) => state.palette);
    const [claimFilter, setClaimFilter] = useState<ClaimFilter>("all");
    const [selectedLoad, setSelectedLoad] = useState<TLoadClaim | null>(null);

    const {
        data: allClaimsData,
        isLoading: isAllClaimsLoading,
        error: allClaimsError,
        refetch: refetchAllClaims,
    } = useGetLoadClaimsQuery();

    const {
        data: filteredClaimsData,
        isLoading: isFilteredClaimsLoading,
        error: filteredClaimsError,
        refetch: refetchFilteredClaims,
    } = useGetLoadClaimsQuery(
        claimFilter === "all" ? undefined : { claimType: claimFilter },
        { skip: claimFilter === "all" }
    );

    const allRows = useMemo(
        () => getClaimRows(allClaimsData, "all"),
        [allClaimsData]
    );

    const visibleRows = useMemo(
        () =>
            claimFilter === "all"
                ? allRows
                : getClaimRows(filteredClaimsData, claimFilter),
        [allRows, claimFilter, filteredClaimsData]
    );

    const loading =
        claimFilter === "all"
            ? isAllClaimsLoading
            : isFilteredClaimsLoading;

    const error =
        claimFilter === "all"
            ? allClaimsError
            : filteredClaimsError;

    const responseHasUnexpectedShape = false;


    const stats = useMemo(
        () => ({
            detention: allRows.filter((row) => row.type === "detention").length,
            layover: allRows.filter((row) => row.type === "layover").length,
            tonu: allRows.filter((row) => row.type === "tonu").length,
        }),
        [allRows]
    );

    const handleFilterChange = (value: ClaimFilter) => setClaimFilter(value);
    const refetch = claimFilter === "all" ? refetchAllClaims : refetchFilteredClaims;

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    mb: 3,
                }}
            >
                <Box>
                    <Typography variant="h5" fontWeight={700} color="text.primary">
                        Load Details
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Review detention, layover, and TONU claims.
                    </Typography>
                </Box>
                <FormControl size="small" sx={{ minWidth: 190 }}>
                    <Select
                        value={claimFilter}
                        aria-label="Filter claims by type"
                        onChange={(event) =>
                            handleFilterChange(event.target.value as ClaimFilter)
                        }
                        sx={{ bgcolor: theme.currentPalette.background }}
                    >
                        <MenuItem value="all">All Claims</MenuItem>
                        <MenuItem value="detention">Detention</MenuItem>
                        <MenuItem value="layover">Layover</MenuItem>
                        <MenuItem value="tonu">TONU</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                        lg: "repeat(3, minmax(0, 1fr))",
                    },
                    gap: 2,
                    mb: 3,
                }}
            >
                <StatsCard
                    title="Detention Claims"
                    value={stats.detention}
                    icon={IoAlertCircle}
                    loading={isAllClaimsLoading}
                />
                <StatsCard
                    title="Layover Claims"
                    value={stats.layover}
                    icon={IoTime}
                    loading={isAllClaimsLoading}
                />
                <StatsCard
                    title="TONU Claims"
                    value={stats.tonu}
                    icon={IoCloseCircle}
                    loading={isAllClaimsLoading}
                />
            </Box>

            {error && (
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" size="small" onClick={() => void refetch()}>
                            Retry
                        </Button>
                    }
                    sx={{ mb: 2 }}
                >
                    {getErrorMessage(error) || "Could not load claims."}
                </Alert>
            )}
            {responseHasUnexpectedShape && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    The claims response did not contain a valid claims list.
                </Alert>
            )}

            <DataTable
                columns={columns}
                data={visibleRows}
                loading={loading}
                emptyState={
                    <TableRow>
                        <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                            <Typography color="text.secondary">
                                No claims found for this filter.
                            </Typography>
                        </TableCell>
                    </TableRow>
                }
                renderRow={(row) => (
                    <TableRow
                        key={row.key}
                        hover
                        sx={{
                            "&:last-child td": { borderBottom: 0 },
                        }}
                    >
                        <TableCell align="left">
                            <Typography fontWeight={700} color={theme.currentPalette.primary}>
                                {row.load.loadId || "-"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {row.load.driverId?.name || "No driver assigned"}
                            </Typography>
                        </TableCell>
                        <TableCell>
                            <Chip
                                size="small"
                                label={titleCase(row.type)}
                                color={row.type === "tonu" ? "warning" : "primary"}
                                variant="outlined"
                            />
                        </TableCell>
                        <TableCell align="left">
                            <Typography variant="body2">
                                {getOriginAddress(row.load)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                to {getDestinationAddress(row.load)}
                            </Typography>
                        </TableCell>
                        <TableCell>{formatDate(row.load.deliveredAt)}</TableCell>
                        <TableCell>{titleCase(row.source)}</TableCell>
                        <TableCell>
                            {row.recordStatus ? (
                                <Chip
                                    size="small"
                                    label={titleCase(row.recordStatus)}
                                    variant="outlined"
                                />
                            ) : (
                                <Chip
                                    size="small"
                                    label={titleCase(row.load.status)}
                                    variant="outlined"
                                />
                            )}
                        </TableCell>
                        <TableCell align="left">
                            {row.type === "tonu"
                                ? row.load.tonuReason || titleCase(row.load.tonuStatus)
                                : "-"}
                        </TableCell>
                        <TableCell>
                            <Button
                                size="small"
                                variant="outlined"
                                disabled={!row.load.id && !row.load._id}
                                onClick={() =>
                                    setSelectedLoad({
                                        ...row.load,
                                        origin: getOriginAddress(row.load),
                                        destination: getDestinationAddress(row.load),
                                    })
                                }
                            >
                                Update
                            </Button>
                        </TableCell>
                    </TableRow>
                )}
            />

            {selectedLoad && (
                <UpdateStatusModal
                    key={selectedLoad.id ?? selectedLoad.loadId}
                    isOpen
                    load={selectedLoad}
                    onClose={() => setSelectedLoad(null)}
                />
            )}
        </Box>
    );
};

export default LoadsClaimsPage;