import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { User, Phone, Mail, Key, Users } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [showPwForm, setShowPwForm] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  const { data } = useQuery({ queryKey: ['student-profile'], queryFn: () => api.get('/student/profile').then(r => r.data.data) });
  const { data: roommates } = useQuery({ queryKey: ['student-roommates'], queryFn: () => api.get('/student/roommates').then(r => r.data.data) });

  const pwMutation = useMutation({
    mutationFn: () => {
      if (pw.newPassword !== pw.confirm) throw new Error('Passwords do not match');
      return api.patch('/student/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
    },
    onSuccess: () => { toast.success('Password changed!'); setShowPwForm(false); setPw({ currentPassword: '', newPassword: '', confirm: '' }); },
    onError: (e: any) => toast.error(e?.message || e?.response?.data?.message || 'Failed'),
  });

  const sr = data?.studentRecord;
  const rm: any[] = roommates || [];

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>My Profile</h1>

      {/* User Info */}
      <div style={{ background: 'white', borderRadius: 12, padding: '20px', border: '1px solid #f1f5f9', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={24} color="#1d4ed8" />
          </div>
          <div>
            <p style={{ color: '#0f172a', fontSize: 18, fontWeight: 700, margin: '0 0 2px' }}>{user?.name}</p>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Student ID: {user?.studentId || user?.phone}</p>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            { icon: Phone, label: 'Mobile', value: user?.phone },
            { icon: Mail, label: 'Email', value: user?.email || 'Not set' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
              <item.icon size={16} color="#64748b" />
              <div>
                <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>{item.label}</p>
                <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 500, margin: '2px 0 0' }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stay info */}
      {sr && (
        <div style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #f1f5f9', marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Hostel Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Admission Date', value: sr.admissionDate ? new Date(sr.admissionDate).toLocaleDateString('en-IN') : '—' },
              { label: 'Monthly Rent', value: `₹${sr.monthlyRent?.toLocaleString('en-IN')}` },
              { label: 'Security Deposit', value: `₹${sr.securityDeposit?.toLocaleString('en-IN')}` },
              { label: 'Status', value: sr.status },
            ].map(item => (
              <div key={item.label} style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 2px' }}>{item.label}</p>
                <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 600, margin: 0 }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roommates */}
      {rm.length > 0 && (
        <div style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #f1f5f9', marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Users size={16} /> Roommates</h3>
          {rm.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < rm.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ width: 32, height: 32, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={14} color="#64748b" />
              </div>
              <div>
                <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 600, margin: 0 }}>{r.name}</p>
                <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>Bed {r.bedNumber}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Change Password */}
      <div style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showPwForm ? 12 : 0 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Key size={16} /> Change Password</h3>
          <button onClick={() => setShowPwForm(p => !p)} style={{ background: '#eff6ff', border: 'none', color: '#1d4ed8', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
            {showPwForm ? 'Cancel' : 'Change'}
          </button>
        </div>
        {showPwForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['currentPassword', 'newPassword', 'confirm'].map(f => (
              <input key={f} type="password" placeholder={f === 'currentPassword' ? 'Current password' : f === 'newPassword' ? 'New password (min 4 chars)' : 'Confirm new password'}
                value={(pw as any)[f]} onChange={e => setPw(p => ({ ...p, [f]: e.target.value }))}
                style={{ padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
            ))}
            <button onClick={() => pwMutation.mutate()} disabled={pwMutation.isPending} style={{ padding: '10px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>
              {pwMutation.isPending ? 'Saving…' : 'Save Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
