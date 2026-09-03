import { configureStore } from '@reduxjs/toolkit';

import { authReducer } from '@/features/auth/store/authSlice';
import { baseApi } from '@/services/api';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    // Los slices de cada feature se registran aca:
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export { useAppDispatch, useAppSelector } from './hooks';
