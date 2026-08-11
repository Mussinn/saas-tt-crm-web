import { teethTechApi } from '@/src/services/teethTechApi';

import {
    CreateWorkflowWorkTypesDTO, CreateWorkflowWorkTypesResponseDTO,
    GetAvailableWorkflowTransitionsArgs,
    GetWorkflowStepsArgs,
    OrderStatus,
    WorkflowStatus,
    WorkflowStep,
} from '@/src/types/workflow.types';

export const workflowApi = teethTechApi.injectEndpoints({
    endpoints: (builder) => ({
        getAvailableWorkflowTransitions: builder.query<
            WorkflowStatus[],
            GetAvailableWorkflowTransitionsArgs
        >({
            query: ({ workType, currentStatusId }) => ({
                url: `/workflow/${encodeURIComponent(workType)}/available-transitions/${encodeURIComponent(currentStatusId)}`,
                method: 'GET',
            }),
        }),
        getWorkflowStatuses: builder.query<WorkflowStatus[], void>({
            query: () => ({
                url: '/workflow/statuses',
                method: 'GET',
            }),
            providesTags: ['Workflow'],
        }),
        getAdminWorkflowSteps: builder.query<WorkflowStep[], GetWorkflowStepsArgs>({
            query: ({ workTypeId }) => ({
                url: '/admin/workflow/steps',
                method: 'GET',
                params: { workTypeId },
            }),
            providesTags: ['Workflow'],
        }),
        getOrderStatuses: builder.query<OrderStatus[], void>({
            query: () => ({
                url: '/order-statuses',
                method: 'GET',
            }),
            providesTags: ['OrderStatuses'],
        }),
        createWorkflowWorkTypes: builder.mutation<CreateWorkflowWorkTypesResponseDTO, CreateWorkflowWorkTypesDTO>({
            query: (body) =>({
                url: '/admin/workflow/work-types',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Workflow', 'WorkTypes']
        })
    }),
});

export const {
    useGetAvailableWorkflowTransitionsQuery,
    useGetWorkflowStatusesQuery,
    useGetAdminWorkflowStepsQuery,
    useGetOrderStatusesQuery,
    useCreateWorkflowWorkTypesMutation
} = workflowApi;
