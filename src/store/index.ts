import { configureStore } from '@reduxjs/toolkit';

import { actualizacionMiddleware } from '@/features/actualizacion/store/actualizacionMiddleware';
import { actualizacionReducer } from '@/features/actualizacion/store/actualizacionSlice';
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
    actualizacion: actualizacionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    // `sesionCaidaMiddleware` y `actualizacionMiddleware` van DESPUES del de
    // RTK Query: necesitan ver las acciones `rejected` que este genera.
    getDefaultMiddleware().concat(
      baseApi.middleware,
      sesionCaidaMiddleware,
      actualizacionMiddleware,
      persistirOnboardingMiddleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export { useAppDispatch, useAppSelector } from './hooks';
