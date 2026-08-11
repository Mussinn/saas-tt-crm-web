import authReducer from '@/src/features/auth/authSlice'
import { logout, setUser } from '@/src/features/auth/authSlice'
import chatReducer from '@/src/features/chat/chatSlice'
import { resetChatState } from '@/src/features/chat/chatSlice'
import { resetChatStore } from '@/src/features/chat/chatStore'
import notificationsReducer from '@/src/features/notifications/notificationsSlice'
import { chatApi } from '@/src/services/api/chatApi'
import { resetChatRealtime } from '@/src/services/chatRealtimeService'
import { teethTechApi } from '@/src/services/teethTechApi'
import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'

export const makeStore = () => {
	const authSessionListener = createListenerMiddleware()
	authSessionListener.startListening({
		actionCreator: logout,
		effect: (_, listenerApi) => {
			listenerApi.dispatch(teethTechApi.util.resetApiState())
			listenerApi.dispatch(chatApi.util.resetApiState())
			listenerApi.dispatch(resetChatState())
			resetChatStore()
			resetChatRealtime()
		}
	})
	authSessionListener.startListening({
		actionCreator: setUser,
		effect: (_, listenerApi) => {
			// RTK Query keys do not contain a tenant selector. Resetting on each
			// authenticated session prevents results from another organization from
			// surviving in this browser tab.
			listenerApi.dispatch(teethTechApi.util.resetApiState())
			listenerApi.dispatch(chatApi.util.resetApiState())
			listenerApi.dispatch(resetChatState())
			resetChatStore()
			resetChatRealtime()
		}
	})

	const store = configureStore({
		reducer: {
			auth: authReducer,
			notifications: notificationsReducer,
			chat: chatReducer,
			[teethTechApi.reducerPath]: teethTechApi.reducer,
			[chatApi.reducerPath]: chatApi.reducer
		},
		middleware: getDefaultMiddleware =>
			getDefaultMiddleware()
				.prepend(authSessionListener.middleware)
				.concat(teethTechApi.middleware, chatApi.middleware)
	})

	setupListeners(store.dispatch)

	return store
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
