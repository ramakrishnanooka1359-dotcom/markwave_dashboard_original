import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';

// Async Thunks
export const fetchReferralUsers = createAsyncThunk(
    'users/fetchReferralUsers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(API_ENDPOINTS.getReferrals());
            return response.data.users || [];
        } catch (error: any) {
            return rejectWithValue('Failed to fetch referral users');
        }
    }
);

export const fetchExistingCustomers = createAsyncThunk(
    'users/fetchExistingCustomers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(API_ENDPOINTS.getUsers());
            return response.data.users || [];
        } catch (error: any) {
            return rejectWithValue('Failed to fetch existing customers');
        }
    }
);

export const createReferralUser = createAsyncThunk(
    'users/createReferralUser',
    async (userData: any, { dispatch, rejectWithValue }) => {
        try {
            const response = await axios.post(API_ENDPOINTS.createUser(), userData);
            // If successful, refresh the referral list
            dispatch(fetchReferralUsers());
            return response.data;
        } catch (error: any) {
            // Handle "User already exists" or generic errors
            const msg = error?.response?.data?.message || 'Failed to create user';
            return rejectWithValue(msg);
        }
    }
);

export interface UsersState {
    referralUsers: any[];
    existingCustomers: any[];
    loading: boolean;
    error: string | null;
    actionLoading: boolean; // For create action
}

const initialState: UsersState = {
    referralUsers: [],
    existingCustomers: [],
    loading: false,
    error: null,
    actionLoading: false,
};

const usersSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        setReferralUsers: (state, action: PayloadAction<any[]>) => {
            state.referralUsers = action.payload;
        },
        setExistingCustomers: (state, action: PayloadAction<any[]>) => {
            state.existingCustomers = action.payload;
        },
    },
    extraReducers: (builder) => {
        // Fetch Referral Users
        builder.addCase(fetchReferralUsers.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchReferralUsers.fulfilled, (state, action) => {
            state.loading = false;
            state.referralUsers = action.payload;
        });
        builder.addCase(fetchReferralUsers.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Fetch Existing Customers
        builder.addCase(fetchExistingCustomers.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchExistingCustomers.fulfilled, (state, action) => {
            state.loading = false;
            state.existingCustomers = action.payload;
        });
        builder.addCase(fetchExistingCustomers.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Create Referral User
        builder.addCase(createReferralUser.pending, (state) => {
            state.actionLoading = true;
            state.error = null;
        });
        builder.addCase(createReferralUser.fulfilled, (state) => {
            state.actionLoading = false;
        });
        builder.addCase(createReferralUser.rejected, (state, action) => {
            state.actionLoading = false;
            state.error = action.payload as string;
        });
    }
});

export const { setReferralUsers, setExistingCustomers } = usersSlice.actions;
export const usersReducer = usersSlice.reducer;
export default usersSlice.reducer;
