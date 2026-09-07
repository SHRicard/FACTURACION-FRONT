import { configureStore } from '@reduxjs/toolkit';

import { authReducer } from '@/features/auth/store/authSlice';
import { sesionCaidaMiddleware } from '@/features/auth/store/sesionCaidaMiddleware';
import { onboardingReducer } from '@/features/onboarding/store/onboardingSlice';
import { persistirOnboardingMiddleware } from '@/features/onboarding/store/persistirOnboardingMiddleware';
import { baseApi } from '@/services/api';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    // Los slices de cada feature se registran aca:
    auth: authReducer,
    onboarding: onboardingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    // `sesionCaidaMiddleware` va DESPUES del de RTK Query: necesita ver las
    // acciones `rejected` que este genera.
    getDefaultMiddleware().concat(
      baseApi.middleware,
      sesionCaidaMiddleware,
      persistirOnboardingMiddleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export { useAppDispatch, useAppSelector } from './hooks';
