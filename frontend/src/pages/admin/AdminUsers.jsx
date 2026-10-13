import { useState } from 'react';
import { Plus, Edit, Trash2, UserCog } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminUsers } from '../../hooks/useApiHooks';
import { userService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSearch } from '../../context/SearchContext';
import useFilteredItems from '../../hooks/useFilteredItems';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminListPanel from '../../components/admin/AdminListPanel';
import AdminModal from '../../components/admin/AdminModal';
import EmptyState from '../../components/admin/EmptyState';
import { AdminInput } from '../../components/admin/AdminInput';
import { confirmAction } from '../../utils/feedback';
import Button from '../../components/Button';

const EMPTY_FORM = { name: '', email: '', password: '' };
const matchesUser = (user, q) => `${user.name} ${user.email}`.toLowerCase().includes(q);

export default function AdminUsers() {
    const { data: users = [], isLoading } = useAdminUsers();
    const { user: currentUser } = useAuth();
    const { searchQuery } = useSearch();
    const queryClient = useQueryClient();
    const filtered = useFilteredItems(users, searchQuery, matchesUser);

    const [editing, setEditing] = useState(null); // null = closed, {} = new, user = edit
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-users'] });

    const openModal = (user = {}) => {
        setEditing(user);
        setForm({ name: user.name || '', email: user.email || '', password: '' });
        setErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (editing.id) {
                await userService.update(editing.id, form);
                toast.success('User Updated');
            } else {
                await userService.create(form);
                toast.success('User Added');
            }
            setEditing(null);
            refresh();
        } catch (err) {
            setErrors(err?.response?.data?.errors || {});
            toast.error(err?.response?.data?.message || 'Failed to save user');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (user) => {
        if (!await confirmAction(`Remove ${user.name}'s admin access?`)) return;
        try {
            await userService.delete(user.id);
            toast.success('User Removed');
            refresh();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to delete user');
        }
    };

    const field = (key) => ({
        value: form[key],
        error: errors[key]?.[0],
        onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
    });

    return (
        <>
            <AdminPageLayout
                fill
                actions={[{ id: 'add-user', label: 'Add User', icon: Plus, variant: 'secondary', onClick: () => openModal() }]}
                search="Search users…"
                hero={
                    <AdminPageHero
                        title="User Management"
                        description={`${users.length} dashboard users`}
                        breadcrumb="Users"
                        icon={<UserCog className="w-5 h-5 text-[#A67B5B]" />}
                    />
                }
            >
                <AdminListPanel plain>
                  {filtered.length === 0 ? (
                      <EmptyState icon={UserCog} message="No users yet" searchQuery={searchQuery} loading={isLoading} action={{ label: 'Add a user', onClick: () => openModal() }} />
                  ) : (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {filtered.map((user) => {
                              const isSelf = currentUser?.id === user.id;
                              return (
                                  <div key={user.id} className="p-5 rounded-2xl border border-stone-100 bg-white shadow-sm flex flex-col gap-4">
                                      <div className="flex items-center gap-3 min-w-0">
                                          <div className="w-11 h-11 rounded-full bg-[#A67B5B]/10 text-[#A67B5B] flex items-center justify-center font-semibold shrink-0">
                                              {user.name?.charAt(0)?.toUpperCase()}
                                          </div>
                                          <div className="min-w-0">
                                              <p className="font-medium text-stone-800 truncate">
                                                  {user.name} {isSelf && <span className="text-xs text-[#A67B5B]">(You)</span>}
                                              </p>
                                              <p className="text-sm text-stone-500 truncate">{user.email}</p>
                                          </div>
                                      </div>
                                      <div className="flex gap-2">
                                          <Button size="sm" icon={Edit} className="flex-1" onClick={() => openModal(user)}>
                                              Edit
                                          </Button>
                                          <Button
                                              size="sm"
                                              variant="danger"
                                              icon={Trash2}
                                              className="flex-1"
                                              onClick={() => handleDelete(user)}
                                              disabled={isSelf}
                                              title={isSelf ? 'You cannot delete your own account' : undefined}
                                          >
                                              Delete
                                          </Button>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  )}
                </AdminListPanel>
            </AdminPageLayout>

            <AdminModal isOpen={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit User' : 'Add User'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <AdminInput label="Name" required {...field('name')} />
                    <AdminInput label="Email" type="email" required {...field('email')} />
                    <AdminInput
                        label={editing?.id ? 'New Password (leave blank to keep current)' : 'Password'}
                        type="password"
                        minLength={8}
                        required={!editing?.id}
                        autoComplete="new-password"
                        {...field('password')}
                    />
                    <Button type="submit" variant="secondary" fullWidth loading={saving}>
                        {saving ? 'Saving...' : 'Save User'}
                    </Button>
                </form>
            </AdminModal>

        </>
    );
}
