import { TPlace } from "@/components/sections/LocationAutocomplete";
import { Dayjs } from "dayjs";

export type TUserRole = "admin" | "employee" | "driver" | "superAdmin" | "manager";
export type TStatusLoad = "pending" | "in_transit" | "delivered" | "cancelled";
export type TStatusDriver = "inactive" | "available" | "busy";
export type TTruckType = "reefer" | "van";
export type TTruckSource = "company" | "other";
export type TTruckId = {
  model: string;
  truckId: number;
  truckNumber: string;
};
export type PaginationResult = {
  currentPage: number;
  limit: number;
  totalDocs: number;
  totalPages: number;
};
export type SettingsItem = {
  id: string;
  key: "repairPerMile" | "insurancePerMile";
  value: number;
};

export type RawGetSettingsResponse = {
  message: string;
  data: SettingsItem[];
};

export type SettingsDto = { id: string; repairPerMile: number; insurancePerMile: number } | null;

export type TUser = {
  emailVerifiedAt: string | null;
  id: string;
  name: string;
  active: boolean;
  email: string;
  phone: string;
  role: TUserRole;
  position: string;
  jobId: number;
  driver?: string;
};

export type CompanyStatus = "Active" | "Inactive";

export type CompanyUpsertBody = {
  name: string;
  email: string;
  phone?: string;
  usersCount?: number;
  active: boolean;
};
export type CompanyDto = {
  id: number;
  name: string;
  email: string;
  status: CompanyStatus;
  phone?: string;
  usersCount?: number;
  active: boolean;
};

export type CompanyForm = {
  name: string;
  email: string;
  phone?: string;
  usersCount?: number;
  status: CompanyStatus;
  active: boolean;
};

export type CompaniesResponse = {
  data: CompanyDto[];
  totalCompanies?: number;
  totalUsers?: number;
};

export type ServiceCenter = {
  id: string;
  name: string;
  active?: boolean;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  availability?: string;
  services?: string[];
  location?: { type: "Point"; coordinates: [number, number] };
};

export type TAuthState = {
  user: TUser | null;
  token: string | null;
};
export type TDocument = {
  viewLink: string;
  downloadLink: string;
  name?: string;
};
export type TStats = {
  total: number;
  pending: number;
  inTransit: number;
  delivered: number;
  cancelled: number;
  upcoming?: number;
  overdue?: number;
};
export type TLoadsForm = {
  dho: string;
  origin: string;
  destinations: string;
  price: string;
  fees: string;
  loadIDInp: string;
  pickupAt: string;
  completedAt: string;
  arrivalAtShipper: string;
  arrivalAtReceiver: string;
  leftShipper: string;
  leftReceiver: string;
  driverId: string;
  truckId: string;
  truckType: TTruckType;
  truckTemp: string;
};
export type TLoads = {
  id?: string;
  loadId: string;
  origin: string;
  DHO: string;
  destination: string;
  distanceMiles: number;
  pricePerMile: number;
  totalPrice: number;
  bonus: number;
  detention: number;
  deduction: number;
  reason: string;
  status: TStatusLoad;
  driverId: TDriver;
  truckId: TTruckId;
  currency: string;
  createdBy: string;
  updatedBy?: string;
  cancelledAt?: string;
  truckType: TTruckType;
  truckTemp: number;
  comments: TComments[];
  feesNumber: string;
  pickupAt: string;
  completedAt: string;
  arrivalAtShipper?: string;
  arrivalAtReceiver?: string;
  leftShipper?: string;
  leftReceiver?: string;
  deliveredAt?: string;
  createdAt?: string;
  documents?: TDocument[];
  documentsForDriver?: TDocument[];
};
export type AttachmentItem = {
  id: string;
  name: string;
  size?: number;
  url?: string;
};
export type AttachmentHiringDriver = {
  fileId: string;
  viewLink: string;
  downloadLink: string;
  uploadedAt: string;
}
export type TDriver = {
  id: string;
  driverId: number;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  status: TStatusDriver;
  hireDate: string;
  createdBy: string;
  pricePerMile: number | string;
  currency: string;
  assignedTruck?: string;
  updatedBy?: string;
  user: TUser | string;
  toggle: boolean
  documents?: AttachmentItem[];
};
export type tDriverHiring = {
  _id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  experienceYears: number;
  readyDate: string;
  reminder?: {
    date?: string;
    time?: string;
    reason?: string;
    isDone?: boolean;
  };
  reminderDate?: string;
  reminderTime?: string;
  reminderReason?: string;
  reminderDone?: boolean;
  isDone?: boolean;
  driverId?: number;
  notes: string;
  violations: string;
  status: string;
  createdBy: string;
  updatedBy?: string;
  hireDate?: string;
  document?: AttachmentHiringDriver;
};
export type TTruck = {
  id: string;
  truckId: number;
  truckNumber: string;
  model: string;
  year: string;
  capacity: string;
  status: TStatusDriver;
  createdBy: string;
  updatedBy: string;
  assignedDriver?: string | { name: string; driverId: number; id: string };
  type: TTruckType;
  source: TTruckSource;
  fuelPerMile: string;
  totalMileage: number;
  insuranceCost: number;
  repairCost: number;
  summary?: TTruckSummary;
};
export interface TruckApiResponse {
  data: TTruck[];
  paginationResult?: TPagination;
  message?: string;
  status?: string;
}
export type TPagination = {
  currentPage: number;
  totalPages: number;
  total?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
};
export type TComments = {
  id: string;
  load: TLoads;
  driver: TDriver;
  truck: TTruck;
  text: string;
  content: string;
  addedBy: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
  type: "dispatcher" | "driver";
};
export type CommentsResponse = {
  message: string;
  loadId: string;
  comments: TComments[];
};
export type TErrors = {
  type: "field";
  value: string;
  msg: string;
  path: string;
  location: string;
  message?: string;
};
export type TDispatcher = {
  id: string;
  name: string;
  active: boolean;
  email: string;
  phone: string;
  role: string;
  position: string;
  jobId: number;
};

export type TPeriod = {
  from: string;
  to: string;
};

export type TLoadSummary = {
  id: string;
  totalLoads: number;
  totalMiles: number;
  earnings: TEarnings;
  pricePerMile: number;
  currency: string;
  period: TPeriod;
  loads: TLoads[];
};
export type TEarnings = {
  baseEarnings: number;
  totalBonus: number;
  totalDetention: number;
  totalDeduction: number;
  totalEarnings: number;
};

export type TTruckSummary = {
  _id: string;
  truckId: number;
  totalLoads: number;
  totalMiles: number;
  totalRevenue: number;
  fuelCost: number;
  repairCost: number;
  insuranceCost: number;
  driverPay: number;
  totalExpenses: number;
  netProfit: number;
  avgRevenuePerMile: number;
  avgExpensePerMile: number;
  avgProfitPerMile: number;
  profitMargin: number;
  avgRevenuePerMileChange: number;
  avgExpensePerMileChange: number;
  avgProfitPerMileChange: number;
  profitMarginChange: number;
  fuelCostChange: number;
  repairCostChange: number;
  insuranceCostChange: number;
  driverPayChange: number;
  currency: string;
  loads: TLoads;
  period: TPeriod;
  trucks: TTruck;
};
export type TTruckSummaryResponse = {
  status: string;
  message: string;
  data: {
    period: {
      from: string;
      to: string;
    };
    totalTrucks: number;
    source: TTruckSource;
    trucksSummary: TTruckSummary[];
    totalSummary: TTruckSummary;
  };
  summary?: TTruckSummary;
  netProfitHistory?: {
    current: string;
    previous: number[];
  };
  period?: {
    from: string;
    to: string;
  };
};
export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
export interface InfoCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}
export interface InfoItemProps {
  icon: React.ReactNode;
  primary: string;
  secondary: string | number;
}
export type TTruckWithSummary = TTruck & {
  _id: string;
  truckId: number;
  truckNumber: string;
  summary?: TTruckSummary;
  model?: string;
  year?: string;
  capacity?: string;
  status?: TStatusDriver;
  source?: TTruckSource;
  type?: TTruckType;
};
export type TTrucksSummaryResponse = {
  status: string;
  message: string;
  data: {
    period: {
      from: string;
      to: string;
    };
    totalTrucks: number;
    source: TTruckSource;
    trucksSummary: TTruckWithSummary[];
    totalSummary: TTruckSummary;
  };
};
export type TCustomer = {
  id: string;
  customerId: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  feedback: string;
  type: "" | "shipper" | "receiver";
  addedBy: string;
  createdAt: string;
  updatedAt: string;
};
export interface RTKError {
  data?: {
    message?: string;
    errors?: {
      msg: string;
    }[];
  };
  error?: {
    data: {
      status: string;
      message: string;
      errors?: { msg: string }[];
    };
    status: string;
  };
  message?: string;
  status?: string;
  errors?: { msg: string }[];
}
export type typeInp = "text" | "number" | "select";
export type TInp = {
  disable?: boolean;
  type?: typeInp;
  placeholder?: string;
  children?: React.ReactNode;
};
export interface LoadsFormState {
  // Location Tab
  dho: TPlace | null;
  origin: TPlace | null;
  destinations: (TPlace | null)[];

  // Load Details Tab
  price: string;
  fees: string;
  loadIDInp: string;
  pickupAt: string | null;
  completedAt: string | null;
  arrivalAtShipper: string | null;
  arrivalAtReceiver: string | null;
  leftShipper: string | null;
  leftReceiver: string | null;

  // Assignment Tab
  driverId: string;
  truckId: string;
  truckType: TTruckType;
  truckTemp: string;

  // UI State
  activeTab: number;
  isEditing: boolean;
  editingLoad: TLoads | null;
}
export interface ModalsState {
  createEditLoadModal: boolean;
  updateStatusModal: boolean;
  addNoteModal: boolean;
  viewNotesModal: boolean;
  viewAppointmentsModal: boolean;

  // Selected IDs for modals
  selectedLoadId: string;
  selectedLoadForNotes: TLoads | null;
  selectedLoadForAppointments: TLoads | null;
}
export interface UIState {
  search: string;
  page: number;
  loading: boolean;
  error: string | null;
}
export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  success?: boolean;
}
export interface FilterParams<T = unknown> {
  id: string;
  fromDate?: string | Dayjs | null;
  toDate?: string | Dayjs | null;
  fetchFunction: (params: {
    id: string;
    from?: string;
    to?: string;
  }) => Promise<ApiResponse<T>>;
}
export interface ResetParams<T = unknown> {
  id: string;
  fetchFunction: (params: { id: string }) => Promise<ApiResponse<T>>;
}
export interface UseSearchProps<T> {
  data: T[];
  searchFields: (keyof T | string)[];
  initialSearch?: string;
}
export interface CreateEditLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingLoad?: TLoads | null;
}
export interface LoadDetailsTabProps {
  pickupAt: Dayjs | null;
  completedAt: Dayjs | null;
  arrivalAtShipper: Dayjs | null;
  arrivalAtReceiver: Dayjs | null;
  leftShipper: Dayjs | null;
  leftReceiver: Dayjs | null;
  isEditing: boolean;
  onPickupAtChange: (value: Dayjs | null) => void;
  onCompletedAtChange: (value: Dayjs | null) => void;
  onArrivalAtShipperChange: (value: Dayjs | null) => void;
  onArrivalAtReceiverChange: (value: Dayjs | null) => void;
  onLeftShipperChange: (value: Dayjs | null) => void;
  onLeftReceiverChange: (value: Dayjs | null) => void;
  isTabValid: boolean;
  onPrevTab: () => void;
  onNextTab: () => void;
}

export type Adjustment = {
  id: number;
  type: "Bonus" | "Detention" | "Deduction";
  amount: number;
};
export interface FinancialTabProps {
  allDistance: string;
  price: string;
  fees: string;
  loadIDInp: string;
  pricePerMile: number | null;
  destinations: (TPlace | null)[];
  isEditing: boolean;
  selectedDocuments: File[];
  uploadError: string;
  isDragging: boolean;
  adjustments?: Adjustment[];
  onAdjustmentsChange?: (adjustments: Adjustment[]) => void;
  setAdjustments?: React.Dispatch<React.SetStateAction<Adjustment[]>>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onRemoveFile: (index: number) => void;
  onPriceChange: (value: string) => void;
  onFeesChange: (value: string) => void;
  onLoadIDChange: (value: string) => void;
  isTabValid: boolean;
  onPrevTab: () => void;
  onNextTab: () => void;
}
export interface AssignmentTabProps {
  isEditing: boolean;
  editingLoad: TLoads | null;
  driverId: string;
  truckId: string;
  truckType: string;
  truckTemp: string;
  onDriverIdChange: (value: string) => void;
  onTruckIdChange: (value: string) => void;
  onTruckTypeChange: (value: string) => void;
  onTruckTempChange: (value: string) => void;
  isTabValid: boolean;
  onPrevTab: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}
