import { Column } from "@/components/ui/DataTable";

export const repairColumns: Column[] = [
    {
        key: "truckId",
        header: "Truck ID",
        align: "center",
    },

    {
        key: "title",
        header: "Title",
        align: "center",
    },
    {
        key: "desc",
        header: "description",
        align: "center",
    },
    {
        key: "repairStatus",
        header: "Repair Status",
        align: "center",
    },

    {
        key: "repairLocation",
        header: "Repair Location",
        align: "center",
    },

    {
        key: "cost",
        header: "Cost",
        align: "center",
    },

    {
        key: "repairDate",
        header: "Repair Date",
        align: "center",
    },
    {
        key: "note",
        header: "Note",
        align: "center",
    },
    {
        key: "actions",
        header: "Actions",
        align: "center",
    }
];