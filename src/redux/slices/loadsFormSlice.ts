import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LoadsFormState, TLoads, TTruckType } from "@/types/globalTypes";
import { TPlace } from "@/components/sections/LocationAutocomplete";

const initialState: LoadsFormState = {
  // Location Tab
  dho: null,
  origin: null,
  destinations: [],

  // Load Details Tab
  price: "",
  fees: "",
  loadIDInp: "",
  pickupAt: null,
  completedAt: null,
  arrivalAtShipper: null,
  arrivalAtReceiver: null,
  leftShipper: null,
  leftReceiver: null,

  // Assignment Tab
  driverId: "",
  truckId: "",
  truckType: "reefer",
  truckTemp: "",

  // UI State
  activeTab: 1,
  isEditing: false,
  editingLoad: null,
};

const loadsFormSlice = createSlice({
  name: "loadsForm",
  initialState,
  reducers: {
    // Location Tab Actions
    setDho: (state, action: PayloadAction<TPlace | null>) => {
      state.dho = action.payload;
    },

    setOrigin: (state, action: PayloadAction<TPlace | null>) => {
      state.origin = action.payload;
    },

    setDestinations: (state, action: PayloadAction<(TPlace | null)[]>) => {
      state.destinations = action.payload;
    },

    addDestination: (state) => {
      state.destinations.push(null);
    },

    updateDestination: (
      state,
      action: PayloadAction<{ index: number; place: TPlace | null }>
    ) => {
      const { index, place } = action.payload;
      if (index >= 0 && index < state.destinations.length) {
        state.destinations[index] = place;
      }
    },

    removeDestination: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (state.destinations.length <= 1) return;

      if (index >= 0 && index < state.destinations.length) {
        state.destinations.splice(index, 1);
      }
    },

    // Load Details Tab Actions
    setPrice: (state, action: PayloadAction<string>) => {
      state.price = action.payload;
    },

    setFees: (state, action: PayloadAction<string>) => {
      state.fees = action.payload;
    },

    setLoadIDInp: (state, action: PayloadAction<string>) => {
      state.loadIDInp = action.payload;
    },

    setPickupAt: (state, action: PayloadAction<string | null>) => {
      state.pickupAt = action.payload;
    },

    setCompletedAt: (state, action: PayloadAction<string | null>) => {
      state.completedAt = action.payload;
    },

    setArrivalAtShipper: (state, action: PayloadAction<string | null>) => {
      state.arrivalAtShipper = action.payload;
    },

    setArrivalAtReceiver: (state, action: PayloadAction<string | null>) => {
      state.arrivalAtReceiver = action.payload;
    },

    setLeftShipper: (state, action: PayloadAction<string | null>) => {
      state.leftShipper = action.payload;
    },

    setLeftReceiver: (state, action: PayloadAction<string | null>) => {
      state.leftReceiver = action.payload;
    },

    // Assignment Tab Actions
    setDriverId: (state, action: PayloadAction<string>) => {
      state.driverId = action.payload;
    },

    setTruckId: (state, action: PayloadAction<string>) => {
      state.truckId = action.payload;
    },

    setTruckType: (state, action: PayloadAction<TTruckType>) => {
      state.truckType = action.payload;
    },

    setTruckTemp: (state, action: PayloadAction<string>) => {
      state.truckTemp = action.payload;
    },

    // UI State Actions
    setActiveTab: (state, action: PayloadAction<number>) => {
      state.activeTab = action.payload;
    },

    setIsEditing: (state, action: PayloadAction<boolean>) => {
      state.isEditing = action.payload;
    },

    setEditingLoad: (state, action: PayloadAction<TLoads | null>) => {
      state.editingLoad = action.payload;
    },

    // Reset Form Action
    resetForm: (state) => {
      // Location Tab
      state.dho = null;
      state.origin = null;
      state.destinations = [null];

      // Load Details Tab
      state.price = "";
      state.fees = "";
      state.loadIDInp = "";
      state.pickupAt = null;
      state.completedAt = null;
      state.arrivalAtShipper = null;
      state.arrivalAtReceiver = null;
      state.leftShipper = null;
      state.leftReceiver = null;

      // Assignment Tab
      state.driverId = "";
      state.truckId = "";
      state.truckType = "reefer";
      state.truckTemp = "";

      // UI State
      state.activeTab = 1;
      state.isEditing = false;
      state.editingLoad = null;
    },

    // Initialize Form for Editing
    initializeEditForm: (state, action: PayloadAction<TLoads>) => {
      const load = action.payload;

      // Set basic info
      state.loadIDInp = load.loadId || "";
      state.price = load.totalPrice?.toString() || "";
      state.fees = load.feesNumber?.toString() || "";
      state.truckType = load.truckType || "reefer";
      state.truckTemp = load.truckTemp?.toString() || "";
      state.driverId = load.driverId?.id || "";
      state.truckId = load.truckId?.truckId?.toString() || "";

      // Set editing state
      state.isEditing = true;
      state.editingLoad = load;
      state.activeTab = 1;
    },
  },
});

export const {
  setDho,
  setOrigin,
  setDestinations,
  addDestination,
  updateDestination,
  removeDestination,
  setPrice,
  setFees,
  setLoadIDInp,
  setPickupAt,
  setCompletedAt,
  setArrivalAtShipper,
  setArrivalAtReceiver,
  setLeftShipper,
  setLeftReceiver,
  setDriverId,
  setTruckId,
  setTruckType,
  setTruckTemp,
  setActiveTab,
  setIsEditing,
  setEditingLoad,
  resetForm,
  initializeEditForm,
} = loadsFormSlice.actions;

export default loadsFormSlice.reducer;
