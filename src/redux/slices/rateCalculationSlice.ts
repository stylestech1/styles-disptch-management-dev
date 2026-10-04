import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface RateCalculationRow {
  id: string;
  truckId: string;
  truckNumber: string;
  totalMiles: number;
  pricePerMile: number;
  totalPrice: number;
  totalPricePerWeek: number;
  pricePerMilePerWeek: number;
  route: string;
}

interface RateCalculationState {
  rows: RateCalculationRow[];
}

const initialState: RateCalculationState = {
  rows: [],
};

const rateCalculationSlice = createSlice({
  name: "rateCalculation",
  initialState,
  reducers: {
    addRateCalculation: (state, action: PayloadAction<RateCalculationRow>) => {
      state.rows.unshift(action.payload);
    },
    removeRateCalculation: (state, action: PayloadAction<string>) => {
      state.rows = state.rows.filter((row) => row.id !== action.payload);
    },
  },
});

export const { addRateCalculation, removeRateCalculation } =
  rateCalculationSlice.actions;

export default rateCalculationSlice.reducer;