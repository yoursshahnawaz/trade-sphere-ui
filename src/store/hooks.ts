import { useDispatch, useSelector, useStore } from 'react-redux'
import type { AppDispatch, AppStore, RootState } from './index'

// The .withTypes() factories are the sanctioned exception to the
// explicit-return-type rule (CODING_GUIDELINES §2.1) — their return
// types are inferred and fully type-safe.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppStore = useStore.withTypes<AppStore>()
