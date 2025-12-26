import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';

// Async Thunks
export const fetchPendingUnits = createAsyncThunk(
    'orders/fetchPendingUnits',
    async (adminMobile: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(API_ENDPOINTS.getPendingUnits(), {
                headers: { 'X-Admin-Mobile': adminMobile }
            });
            return response.data?.orders || [];
        } catch (error: any) {
            const rawDetail = error?.response?.data?.detail;
            let msg: string;
            if (typeof rawDetail === 'string') {
                msg = rawDetail;
            } else if (Array.isArray(rawDetail)) {
                const first = rawDetail[0];
                if (first && typeof first === 'object' && 'msg' in first) {
                    msg = String(first.msg);
                } else {
                    msg = 'Failed to load orders';
                }
            } else if (rawDetail && typeof rawDetail === 'object' && 'msg' in rawDetail) {
                msg = String(rawDetail.msg);
            } else {
                msg = 'Failed to load orders';
            }
            return rejectWithValue(msg);
        }
    }
);

export const approveOrder = createAsyncThunk(
    'orders/approveOrder',
    async ({ unitId, adminMobile }: { unitId: string; adminMobile: string }, { dispatch, rejectWithValue }) => {
        try {
            await axios.post(API_ENDPOINTS.approveUnit(), { orderId: unitId }, {
                headers: { 'X-Admin-Mobile': adminMobile }
            });
            // Refresh list after success
            dispatch(fetchPendingUnits(adminMobile));
            return unitId;
        } catch (error: any) {
            return rejectWithValue('Failed to approve order');
        }
    }
);

export const rejectOrder = createAsyncThunk(
    'orders/rejectOrder',
    async ({ unitId, adminMobile }: { unitId: string; adminMobile: string }, { dispatch, rejectWithValue }) => {
        try {
            await axios.post(API_ENDPOINTS.rejectUnit(), { orderId: unitId }, {
                headers: { 'X-Admin-Mobile': adminMobile }
            });
            // Refresh list after success
            dispatch(fetchPendingUnits(adminMobile));
            return unitId;
        } catch (error: any) {
            return rejectWithValue('Failed to reject order');
        }
    }
);

export interface OrdersState {
    pendingUnits: any[];
    loading: boolean;
    error: string | null;
    actionLoading: boolean; // For approve/reject actions
    trackingData: {
        [key: string]: {
            currentStageId: number;
            history: { [stageId: number]: { date: string, time: string } };
        }
    };
    filters: {
        searchQuery: string;
        paymentFilter: string;
        statusFilter: string;
    };
    expansion: {
        expandedOrderId: string | null;
        activeUnitIndex: number | null;
        showFullDetails: boolean;
    };
}

const initialState: OrdersState = {
    pendingUnits: [],
    loading: false,
    error: null,
    actionLoading: false,
    trackingData: {},
    filters: {
        searchQuery: '',
        paymentFilter: 'All Payments',
        statusFilter: 'PENDING_ADMIN_VERIFICATION',
    },
    expansion: {
        expandedOrderId: null,
        activeUnitIndex: null,
        showFullDetails: false,
    },
};

const ordersSlice = createSlice({
    name: 'orders',
    initialState,
    reducers: {
        setPendingUnits: (state, action: PayloadAction<any[]>) => {
            state.pendingUnits = action.payload;
        },
        setOrdersError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.filters.searchQuery = action.payload;
        },
        setPaymentFilter: (state, action: PayloadAction<string>) => {
            state.filters.paymentFilter = action.payload;
        },
        setStatusFilter: (state, action: PayloadAction<string>) => {
            state.filters.statusFilter = action.payload;
        },
        setExpandedOrderId: (state, action: PayloadAction<string | null>) => {
            state.expansion.expandedOrderId = action.payload;
        },
        setActiveUnitIndex: (state, action: PayloadAction<number | null>) => {
            state.expansion.activeUnitIndex = action.payload;
        },
        setShowFullDetails: (state, action: PayloadAction<boolean>) => {
            state.expansion.showFullDetails = action.payload;
        },
        updateTrackingData: (state, action: PayloadAction<{ key: string; stageId: number; date: string; time: string }>) => {
            const { key, stageId, date, time } = action.payload;
            if (!state.trackingData[key]) {
                state.trackingData[key] = { currentStageId: stageId, history: {} };
            }
            state.trackingData[key].currentStageId = stageId;
            state.trackingData[key].history[stageId] = { date, time };
        },
        setInitialTracking: (state, action: PayloadAction<{ key: string; data: any }>) => {
            state.trackingData[action.payload.key] = action.payload.data;
        }
    },
    extraReducers: (builder) => {
        // Fetch Pending Units
        builder.addCase(fetchPendingUnits.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchPendingUnits.fulfilled, (state, action) => {
            state.loading = false;
            state.pendingUnits = action.payload;
        });
        builder.addCase(fetchPendingUnits.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Approve Order
        builder.addCase(approveOrder.pending, (state) => {
            state.actionLoading = true;
        });
        builder.addCase(approveOrder.fulfilled, (state) => {
            state.actionLoading = false;
        });
        builder.addCase(approveOrder.rejected, (state) => {
            state.actionLoading = false;
        });

        // Reject Order
        builder.addCase(rejectOrder.pending, (state) => {
            state.actionLoading = true;
        });
        builder.addCase(rejectOrder.fulfilled, (state) => {
            state.actionLoading = false;
        });
        builder.addCase(rejectOrder.rejected, (state) => {
            state.actionLoading = false;
        });
    }
});

export const {
    setPendingUnits,
    setOrdersError,
    setSearchQuery,
    setPaymentFilter,
    setStatusFilter,
    setExpandedOrderId,
    setActiveUnitIndex,
    setShowFullDetails,
    updateTrackingData,
    setInitialTracking,
} = ordersSlice.actions;

export const ordersReducer = ordersSlice.reducer;
export default ordersSlice.reducer;
