import { TPlace } from "@/components/sections/LocationAutocomplete";
import { TLoads, TTruckType } from "./globalTypes";

export interface LoadFormState {
  dho: TPlace | null;
  origin: TPlace | null;
  destinations: (TPlace | null)[];
  price: string;
  fees: string;
  loadIDInp: string;
  pickupAtFrom: string | null;
  completedAt: string | null;
  pickupAtTo: string | null;
  arrivalAtReceiver: string | null;
  leftShipper: string | null;
  leftReceiver: string | null;
  driverId: string;
  truckId: string;
  truckType: TTruckType;
  truckTemp: string;
  activeTab: number;
  isEditing: boolean;
  editingLoad: TLoads | null;
}

export interface DistanceCalculations {
  dhoToOriginDistance: number | null;
  averageTime: number | null;
  distance: number | null;
  allDistance: string;
  pricePerMile: number | null;
  formatTime: (hours: number) => string;
}

export interface FileHandlers {
  selectedDocuments: File[];
  uploadError: string;
  isDragging: boolean;
  handleDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveFile: (index: number) => void;
  setSelectedDocuments: React.Dispatch<React.SetStateAction<File[]>>;
}

export interface FormStateGroups {
  locations: {
    dho: TPlace | null;
    origin: TPlace | null;
    destinations: (TPlace | null)[];
    dhoToOriginDistance: number | null;
    averageTime: number | null;
    allDistance: string;
    formatTime: (hours: number) => string;
  };
  details: {
    price: string;
    fees: string;
    loadIDInp: string;
    pickupAtFrom: string | null;
    completedAt: string | null;
    pickupAtTo: string | null;
    arrivalAtReceiver: string | null;
    leftShipper: string | null;
    leftReceiver: string | null;
    destinations: (TPlace | null)[];
    isEditing: boolean;
    pricePerMile: number | null;
    allDistance: string;
  };
  assignment: {
    driverId: string;
    truckId: string;
    truckType: string;
    truckTemp: string;
    isEditing: boolean;
  };
}

export interface DispatchFunctions {
  setDho: (place: TPlace | null) => void;
  setOrigin: (place: TPlace | null) => void;
  addDestination: () => void;
  updateDestination: (index: number, place: TPlace | null) => void;
  removeDestination: (index: number) => void;
  setPrice: (value: string) => void;
  setFees: (value: string) => void;
  setLoadIDInp: (value: string) => void;
  setpickupAtFrom: (value: string | null) => void;
  setCompletedAt: (value: string | null) => void;
  setpickupAtTo: (value: string | null) => void;
  setArrivalAtReceiver: (value: string | null) => void;
  setLeftShipper: (value: string | null) => void;
  setLeftReceiver: (value: string | null) => void;
  setDriverId: (value: string) => void;
  setTruckId: (value: string) => void;
  setTruckType: (value: TTruckType) => void;
  setTruckTemp: (value: string) => void;
}

export interface UseLoadFormReturn {
  formState: FormStateGroups;
  handleSubmit: (e: React.FormEvent) => void;
  handleCreateLoad: (e: React.FormEvent) => void;
  isTab1Valid: boolean;
  isTab2Valid: boolean;
  isTab3Valid: boolean;
  isLoading: boolean;
  fileHandlers: FileHandlers;
  distanceCalculations: DistanceCalculations;
  dispatchFunctions: DispatchFunctions;
}
