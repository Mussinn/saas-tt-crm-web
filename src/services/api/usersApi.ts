import {teethTechApi} from "@/src/services/teethTechApi"

import type {
    BatchCreateUsersRequest,
    UpdateUserAdminSetupRequest,
    UpdateUserProfileRequest,
    User
} from "@/src/types/user.types"
import {formatPhoneNumber} from '@/src/utils/phone';

type ChangeUserPasswordArgs = {
    id: string;
    newPassword: string;
};

export const usersApi = teethTechApi.injectEndpoints({
    endpoints: builder =>({
        getUsers: builder.query<User[], void>({
            query: ()=> '/users',
            providesTags: ['Users']
        }),
        updateUser: builder.mutation<void, { id: string; body: UpdateUserProfileRequest }>({
            query: ({ id, body }) => ({
                url: `/users/${id}`,
                method: 'PATCH',
                body: {...body, phone: formatPhoneNumber(body.phone)},
            }),
            invalidatesTags: ['Users'],
        }),
        updateUserAdminSetup: builder.mutation<void, { id: string; body: UpdateUserAdminSetupRequest }>({
            query: ({ id, body }) => ({
                url: `/users/${id}/admin-setup`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['Users'],
        }),
        changeUserPassword: builder.mutation<void, ChangeUserPasswordArgs>({
            query: ({id, newPassword}) => ({
                url: `/users/${id}/change-password`,
                method: 'POST',
                body: {
                    newPassword,
                },
            }),
        }),
        createUsersBatch: builder.mutation<string[], BatchCreateUsersRequest>({
            query: (body) => ({
                url: '/users/batch',
                method: 'POST',
                body: {
                    ...body,
                    employees: body.employees.map((employee) => ({
                        ...employee,
                        phone: formatPhoneNumber(employee.phone),
                    })),
                },
            }),
            invalidatesTags: ['Users'],
        }),
        deleteUser: builder.mutation<void, string>({
            query: (id) => ({
                url: `/users/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Users'],
        }),
    })
})

export const {
    useGetUsersQuery,
    useUpdateUserMutation,
    useUpdateUserAdminSetupMutation,
    useChangeUserPasswordMutation,
    useCreateUsersBatchMutation,
    useDeleteUserMutation,
} = usersApi;
