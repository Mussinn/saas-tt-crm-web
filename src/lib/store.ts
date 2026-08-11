import authReducer from '@/src/features/auth/authSlice'
import chatReducer from '@/src/features/chat/chatSlice'
import notificationsReducer from '@/src/features/notifications/notificationsSlice'
import { chatApi } from '@/src/services/api/chatApi'
import { teethTechApi } from '@/src/services/teethTechApi'
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'

export const makeStore = () => {
	const store = configureStore({
		reducer: {
			auth: authReducer,
			notifications: notificationsReducer,
			chat: chatReducer,
			[teethTechApi.reducerPath]: teethTechApi.reducer,
			[chatApi.reducerPath]: chatApi.reducer
		},
		middleware: getDefaultMiddleware =>
			getDefaultMiddleware().concat(teethTechApi.middleware, chatApi.middleware)
	})

	setupListeners(store.dispatch)

	return store
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
