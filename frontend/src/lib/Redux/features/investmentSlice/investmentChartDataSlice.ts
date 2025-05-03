// src/lib/Redux/features/chartDataSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CachedChartData {
  data: any;
  timestamp: number;
}

interface ChartDataState {
  [key: string]: CachedChartData | undefined;
}

const initialState: ChartDataState = {};

export const chartDataSlice = createSlice({
  name: "chartData",
  initialState,
  reducers: {
    setChartData: (
      state,
      action: PayloadAction<{ key: string; data: CachedChartData }>
    ) => {
      const { key, data } = action.payload;
      state[key] = data;
    },
    clearChartData: () => initialState,
    removeExpiredChartData: (state) => {
      const now = Date.now();
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

      Object.keys(state).forEach((key) => {
        if (state[key] && now - (state[key]?.timestamp || 0) > CACHE_TTL) {
          delete state[key];
        }
      });
    },
  },
});

export const { setChartData, clearChartData, removeExpiredChartData } =
  chartDataSlice.actions;

export const selectChartData = (state: { chartData: ChartDataState }) =>
  state.chartData;

export default chartDataSlice.reducer;