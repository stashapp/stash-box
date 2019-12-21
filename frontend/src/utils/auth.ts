import { User } from 'src/AuthContext';

export const canEdit = (user: User) => (
    user.roles.includes('EDIT') || user.roles.includes('ADMIN')
);
