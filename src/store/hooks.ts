import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from './index';

/**
 * Hooks tipados de Redux. Usa SIEMPRE estos, nunca los crudos de react-redux:
 * estos ya conocen la forma del store y el tipo del dispatch.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
