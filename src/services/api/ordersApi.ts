import {
    teethTechApi,
    type ApiCallNotificationOptions,
} from '@/src/services/teethTechApi';

import {
    AddTaskDto,
    AssignTaskArgs,
    CreateOrderDto,
    CreateOrderRequest,
    CreateOrderResponse,
    GetOrderKanbanArgs,
    OrderApiListItem,
    OrderGetApiResponse,
    OrderKanbanColumn,
    UpdateOrderArgs,
    UpdateTaskMaterialsArgs,
    UpdateTaskStatusArgs,
} from '@/src/types/order.types';

import type {
    GetOrdersParams
} from '@/src/types/params.types'

import type {
    EmployeeKanbanResponse,
    GetOrderEmployeeKanbanArgs,
    GetTaskHistoryArgs,
    TaskAssignment,
    MaterialAccounting,
    MaterialPlanItem,
    MaterialUsageHistoryItem,
    TaskHistoryResponse,
    UpdateTaskAssignmentArgs,
} from '@/src/types/task.types';

type WithNotificationOptions = {
    notification?: ApiCallNotificationOptions;
};

type CreateOrderMutationArgs = CreateOrderDto & WithNotificationOptions;
type UpdateTaskStatusMutationArgs = UpdateTaskStatusArgs & WithNotificationOptions;
type AssignTaskMutationArgs = AssignTaskArgs & WithNotificationOptions;

export function buildUpdateTaskMaterialsBody(materialIds: string[]) {
    return {
        materialIds: Array.from(new Set(materialIds.map((id) => id.trim()).filter(Boolean))),
    };
}

export function buildCreateOrderBody(body: CreateOrderDto): CreateOrderRequest {
    return {
        ...body,
        tasks: body.tasks.map(({
            workTypeId,
            quantity,
            toothNumbers,
            orderId,
            colorId,
            materialIds,
            pricePerUnit,
            discountPercent,
            assignmentMode,
            statusAssignees,
        }) => ({
            workTypeId,
            quantity,
            toothNumbers,
            colorId,
            materialIds: Array.from(new Set(materialIds)),
            pricePerUnit,
            discountPercent,
            assignmentMode,
            statusAssignees,
            ...(orderId ? { orderId } : {}),
        })),
    };
}

export const ordersApi = teethTechApi.injectEndpoints({
    endpoints: (builder) => ({
        getOrders: builder.query<OrderGetApiResponse, GetOrdersParams>({
            query: ({page, size, sort}) => ({
                url: '/orders',
                method: 'GET',
                params: {
                    page,
                    size,
                    ...(sort? {sort} :{}),
                }
            }),
            providesTags: ['Orders'],
        }),

        createOrder: builder.mutation<CreateOrderResponse, CreateOrderMutationArgs>({
            query: ({ notification, ...body }) => ({
                url: '/orders',
                method: 'POST',
                body: buildCreateOrderBody(body),
                notification,
            }),
            invalidatesTags: ['Orders', 'OrderKanban'],
        }),

        updateOrder: builder.mutation<OrderApiListItem, UpdateOrderArgs>({
            query: ({ id, body }) => ({
                url: `/orders/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                'Orders',
                'OrderKanban',
                { type: 'OrderKanban', id },
            ],
        }),

        deleteOrder: builder.mutation<void, string>({
            query: (id) => ({
                url: `/orders/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Orders', 'OrderKanban'],
        }),

        getOrderKanban: builder.query<OrderKanbanColumn[], GetOrderKanbanArgs>({
            query: ({ id, userId }) => ({
                url: `/orders/${id}/kanban`,
                method: 'GET',
                params: { userId },
            }),
            providesTags: (_result, _error, { id }) => [
                'OrderKanban',
                { type: 'OrderKanban', id },
            ],
        }),

        updateOrderStatus: builder.mutation<void, string>({
            query: (id) => ({
                url: `/orders/${id}/status`,
                method: 'PATCH',
            }),
            invalidatesTags: (_result, _error, id) => [
                'Orders',
                'OrderKanban',
                { type: 'OrderKanban', id },
            ],
        }),

        updateTaskStatus: builder.mutation<void, UpdateTaskStatusMutationArgs>({
            query: ({ taskId, body, notification }) => ({
                url: `/order-tasks/${taskId}/status`,
                method: 'PATCH',
                body,
                notification,
            }),
            invalidatesTags: (_result, error, { taskId }) => error ? [] : [
                    'Orders',
                    'OrderKanban',
                    'Tasks',
                    { type: 'TaskHistory', id: taskId },
                    { type: 'TaskMaterialPlan', id: taskId },
                    { type: 'TaskMaterialUsages', id: taskId },
                    { type: 'TaskMaterialAccounting', id: taskId },
                ],
        }),

        updateTaskMaterials: builder.mutation<void, UpdateTaskMaterialsArgs>({
            query: ({ taskId, materialIds }) => ({
                url: `/tasks/${taskId}/materials`,
                method: 'PATCH',
                body: buildUpdateTaskMaterialsBody(materialIds),
            }),
            invalidatesTags: (_result, error, { taskId }) => error ? [] : [
                'Orders',
                'Tasks',
                'OrderKanban',
                { type: 'TaskMaterialPlan', id: taskId },
                { type: 'TaskMaterialAccounting', id: taskId },
                { type: 'TaskHistory', id: taskId },
            ],
        }),

        getTaskMaterialPlan: builder.query<MaterialPlanItem[], string>({
            query: (taskId) => ({
                url: `/order-tasks/${taskId}/material-plan`,
                notification: { error: false },
            }),
            transformResponse: (response: MaterialPlanItem[] | { items?: MaterialPlanItem[] }) => (
                Array.isArray(response) ? response : response.items ?? []
            ),
            providesTags: (_result, _error, taskId) => [
                { type: 'TaskMaterialPlan', id: taskId },
            ],
        }),

        getTaskMaterialUsages: builder.query<MaterialUsageHistoryItem[], string>({
            query: (taskId) => ({
                url: `/order-tasks/${taskId}/material-usages`,
                notification: { error: false },
            }),
            transformResponse: (response: MaterialUsageHistoryItem[] | { items?: MaterialUsageHistoryItem[]; content?: MaterialUsageHistoryItem[] }) => (
                Array.isArray(response) ? response : response.items ?? response.content ?? []
            ),
            providesTags: (_result, _error, taskId) => [
                { type: 'TaskMaterialUsages', id: taskId },
            ],
        }),

        getTaskMaterialAccounting: builder.query<MaterialAccounting, string>({
            query: (taskId) => ({
                url: `/order-tasks/${taskId}/material-accounting`,
                notification: { error: false },
            }),
            providesTags: (_result, _error, taskId) => [
                { type: 'TaskMaterialAccounting', id: taskId },
            ],
        }),

        assignTask: builder.mutation<void, AssignTaskMutationArgs>({
            query: ({ taskId, userId, notification }) => ({
                url: `/tasks/${taskId}/assign/${userId}`,
                method: 'PATCH',
                notification,
            }),
            invalidatesTags: (_result, _error, { taskId, orderId }) => [
                'Tasks',
                { type: 'OrderKanban', id: orderId },
                { type: 'TaskHistory', id: taskId },
            ],
        }),

        getTaskAssignment: builder.query<TaskAssignment, string>({
            query: (taskId) => ({
                url: `/tasks/${taskId}/assignment`,
                method: 'GET',
            }),
            providesTags: (_result, _error, taskId) => [
                { type: 'TaskAssignment', id: taskId },
            ],
        }),

        updateTaskAssignment: builder.mutation<TaskAssignment, UpdateTaskAssignmentArgs>({
            query: ({ taskId, body }) => ({
                url: `/tasks/${taskId}/assignment`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (_result, _error, { taskId }) => [
                'Tasks',
                'OrderKanban',
                { type: 'TaskAssignment', id: taskId },
                { type: 'TaskHistory', id: taskId },
            ],
        }),

        getTaskHistory: builder.query<TaskHistoryResponse, GetTaskHistoryArgs>({
            query: ({ taskId, page = 0, size = 20 }) => ({
                url: `/tasks/${taskId}/history`,
                method: 'GET',
                params: {
                    page,
                    size,
                },
            }),
            providesTags: (_result, _error, { taskId }) => [
                { type: 'TaskHistory', id: taskId },
            ],
        }),
        addTask: builder.mutation<string, AddTaskDto>({
            query: (body) => ({
                url: '/tasks',
                method: 'POST',
                body,
            }),
            invalidatesTags: (_result, _error, { orderId }) => [
                'Orders',
                'OrderKanban',
                'Tasks',
                { type: 'OrderKanban', id: orderId },
            ],
        }),
        getMyTasksKanban: builder.query<EmployeeKanbanResponse, void>({
            query: () => ({
                url: '/tasks/kanban/my',
                method: 'GET',
            }),
            providesTags: ['Tasks'],
        }),
        getOrderEmployeeKanban: builder.query<EmployeeKanbanResponse, GetOrderEmployeeKanbanArgs>({
            query: ({ orderId }) => ({
                url: `/tasks/order/${orderId}/kanban/employee`,
                method: 'GET',
            }),
            providesTags: (_result, _error, { orderId }) => [
                'Tasks',
                { type: 'OrderKanban', id: orderId },
            ],
        }),
    }),
});

export const {
    useGetOrdersQuery,
    useCreateOrderMutation,
    useUpdateOrderMutation,
    useDeleteOrderMutation,
    useGetOrderKanbanQuery,
    useUpdateOrderStatusMutation,
    useUpdateTaskStatusMutation,
    useUpdateTaskMaterialsMutation,
    useGetTaskMaterialPlanQuery,
    useGetTaskMaterialUsagesQuery,
    useGetTaskMaterialAccountingQuery,
    useAssignTaskMutation,
    useGetTaskAssignmentQuery,
    useUpdateTaskAssignmentMutation,
    useGetTaskHistoryQuery,
    useAddTaskMutation,
    useGetMyTasksKanbanQuery,
    useGetOrderEmployeeKanbanQuery,
} = ordersApi;
