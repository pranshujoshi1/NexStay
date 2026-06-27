import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Phone, Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, accessToken } = useAuth();
  const qc = useQueryClient();

  const [editForm, setEditForm] = useState({ name: user?.name ?? '', phone: user?.phone ?? '' });
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [editSuccess, setEditSuccess] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [editError, setEditError] = useState('');
  const [pwError, setPwError] = useState('');

  const editMutation = useMutation({
    mutationFn: async (body: typeof editForm) => {
      const { data } = await axios.patch('/api/auth/profile', body, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return data;
    },
    onSuccess: () => { setEditSuccess(true); setTimeout(() => setEditSuccess(false), 3000); },
    onError: (err: any) => setEditError(err?.response?.data?.message ?? 'Update failed.'),
  });

  const pwMutation = useMutation({
    mutationFn: async (body: { currentPassword: string; newPassword: string }) => {
      const { data } = await axios.patch('/api/auth/password', body, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return data;
    },
    onSuccess: () => {
      setPwSuccess(true);
      setPwForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwSuccess(false), 3000);
    },
    onError: (err: any) => setPwError(err?.response?.data?.message ?? 'Password change failed.'),
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    editMutation.mutate(editForm);
  };

  const handlePwSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.next !== pwForm.confirm) { setPwError('New passwords do not match.'); return; }
    if (pwForm.next.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    pwMutation.mutate({ currentPassword: pwForm.current, newPassword: pwForm.next });
  };

  const avatar = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Avatar + Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-5 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold flex-shrink-0">
          {avatar}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
          <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
            <Mail className="w-3.5 h-3.5" /> {user?.email}
          </div>
          <span className="inline-block mt-2 text-xs font-semibold bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full">
            {user?.role ?? 'GUEST'}
          </span>
        </div>
      </div>

      {/* Edit profile */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" /> Edit Profile
        </h3>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
            <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
            <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
              type="tel"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
            <input value={user?.email ?? ''} disabled
              className="w-full px-3 py-2.5 border border-slate-100 rounded-xl text-sm bg-slate-50 text-slate-400 cursor-not-allowed" />
          </div>
          {editError && <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{editError}</p>}
          {editSuccess && <p className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" />Profile updated successfully!</p>}
          <button type="submit" disabled={editMutation.isPending}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2">
            {editMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-600" /> Change Password
        </h3>
        <form onSubmit={handlePwSubmit} className="space-y-4">
          {[
            { key: 'current', label: 'Current Password', value: pwForm.current },
            { key: 'next', label: 'New Password', value: pwForm.next },
            { key: 'confirm', label: 'Confirm New Password', value: pwForm.confirm },
          ].map(({ key, label, value }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
              <input type="password" value={value}
                onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>
          ))}
          {pwError && <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{pwError}</p>}
          {pwSuccess && <p className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" />Password changed successfully!</p>}
          <button type="submit" disabled={pwMutation.isPending}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2">
            {pwMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}
