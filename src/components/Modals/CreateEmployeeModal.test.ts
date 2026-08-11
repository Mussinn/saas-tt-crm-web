import { describe, expect, it, vi } from 'vitest';

import { createEmployeeWithRoles } from './CreateEmployeeModal';

const employee = {
    fullName: 'Test Employee',
    email: 'employee@example.com',
    phone: '+7 (777) 123 45 67',
    password: 'temporary-password',
};

describe('createEmployeeWithRoles', () => {
    it('uses the first selected role in POST /users', async () => {
        const createEmployee = vi.fn().mockResolvedValue('employee-id');
        const updateAdminSetup = vi.fn().mockResolvedValue(undefined);

        await createEmployeeWithRoles({
            employee,
            roles: ['TECHNICIAN'],
            createEmployee,
            updateAdminSetup,
        });

        expect(createEmployee).toHaveBeenCalledWith({
            ...employee,
            role: 'TECHNICIAN',
        });
        expect(updateAdminSetup).not.toHaveBeenCalled();
    });

    it('assigns the complete role list after creating the employee', async () => {
        const createEmployee = vi.fn().mockResolvedValue('employee-id');
        const updateAdminSetup = vi.fn().mockResolvedValue(undefined);

        await createEmployeeWithRoles({
            employee,
            roles: ['TECHNICIAN', 'DISPATCHER'],
            createEmployee,
            updateAdminSetup,
        });

        expect(createEmployee).toHaveBeenCalledWith({
            ...employee,
            role: 'TECHNICIAN',
        });
        expect(updateAdminSetup).toHaveBeenCalledWith('employee-id', {
            roles: ['TECHNICIAN', 'DISPATCHER'],
            status: 'ACTIVE',
        });
    });
});
