import { useState } from 'react';
import { Building2, Plus, Search, ToggleLeft, ToggleRight, Trash2, Users, X, Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useSuperHostels, useCreateHostel, useToggleHostelActive, useDeleteHostel, useSuperAllOwners, useCreateOwner } from '@/lib/superAdminApi';
import toast from 'react-hot-toast';

const GENDER_LABELS: Record<string, string> = { BOYS: '♂ Boys', GIRLS: '♀ Girls', CO_ED: '⚥ Co-ed' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 };
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };

// ── Create Admin Modal ────────────────────────────────────────────────────────
function CreateAdminModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string, name: string) => void }) {
  const createOwner = useCreateOwner();
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', businessName: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try {
      const res = await createOwner.mutateAsync(form);
      toast.success(`Admin "${form.name}" created!`);
      onCreated(res.data._id, form.name);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create admin');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, background: '#eff6ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserPlus size={20} color="#1d4ed8" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Register New Hostel Admin</h2>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Creates a login account for the admin</p>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Full Name *</label>
              <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Rajesh Sharma" style={inp} />
            </div>
            <div>
              <label style={lbl}>Email *</label>
              <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="admin@hostel.com" style={inp} />
            </div>
            <div>
              <label style={lbl}>Phone *</label>
              <input required value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="9876543210" style={inp} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Business / Company Name</label>
              <input value={form.businessName} onChange={e => set('businessName', e.target.value)} placeholder="e.g. Sharma Hostels Pvt. Ltd." style={inp} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Password *</label>
              <div style={{ position: 'relative' }}>
                <input required type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" style={{ ...inp, paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#166534' }}>
            ✅ Admin will be <strong>pre-approved</strong> and can log in immediately with these credentials.
          </div>

          <button type="submit" disabled={createOwner.isPending}
            style={{ padding: '12px 0', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {createOwner.isPending ? <><Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Creating…</> : '✓ Create Admin Account'}
          </button>
        </form>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ── Create Hostel Modal ───────────────────────────────────────────────────────
function CreateHostelModal({ onClose }: { onClose: () => void }) {
  const owners = useSuperAllOwners();
  const create = useCreateHostel();
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [form, setForm] = useState({
    name: '', gender: 'BOYS', ownerId: '',
    city: '', state: '', street: '', pincode: '',
    contactPhone: '', contactEmail: '', messEnabled: true,
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ownerId) { toast.error('Select a Hostel Admin'); return; }
    try {
      await create.mutateAsync({
        name: form.name, gender: form.gender, ownerId: form.ownerId,
        address: { street: form.street, city: form.city, state: form.state, pincode: form.pincode },
        contactPhone: form.contactPhone, contactEmail: form.contactEmail,
        messEnabled: form.messEnabled,
      });
      toast.success('Hostel created!');
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create hostel');
    }
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
        <div style={{ background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 580, maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Create New Hostel</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Hostel Name *</label>
                <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Sharma Boys Hostel" style={inp} />
              </div>
              <div>
                <label style={lbl}>Gender *</label>
                <select value={form.gender} onChange={e => set('gender', e.target.value)} style={inp}>
                  <option value="BOYS">Boys</option>
                  <option value="GIRLS">Girls</option>
                  <option value="CO_ED">Co-ed</option>
                </select>
              </div>

              {/* Admin dropdown with create button */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ ...lbl, marginBottom: 0 }}>Hostel Admin *</label>
                  <button type="button" onClick={() => setShowCreateAdmin(true)}
                    style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <UserPlus size={11} /> New Admin
                  </button>
                </div>
                <select required value={form.ownerId} onChange={e => set('ownerId', e.target.value)} style={inp}>
                  <option value="">-- Select Admin --</option>
                  {(owners.data || []).map((o: any) => (
                    <option key={o._id} value={o._id}>{o.name} ({o.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={lbl}>City</label>
                <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Pune" style={inp} />
              </div>
              <div>
                <label style={lbl}>State</label>
                <input value={form.state} onChange={e => set('state', e.target.value)} placeholder="Maharashtra" style={inp} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Street Address</label>
                <input value={form.street} onChange={e => set('street', e.target.value)} placeholder="12, Model Colony" style={inp} />
              </div>
              <div>
                <label style={lbl}>Pincode</label>
                <input value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder="411016" style={inp} />
              </div>
              <div>
                <label style={lbl}>Contact Phone</label>
                <input value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} placeholder="9876543210" style={inp} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Contact Email</label>
                <input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="hostel@example.com" style={inp} />
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="messEnabled" checked={form.messEnabled} onChange={e => set('messEnabled', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="messEnabled" style={{ fontSize: 14, color: '#374151', cursor: 'pointer' }}>Enable Mess / Cafeteria</label>
              </div>
            </div>
            <button type="submit" disabled={create.isPending}
              style={{ padding: '12px 0', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {create.isPending ? <><Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Creating…</> : '+ Create Hostel'}
            </button>
          </form>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>

      {/* Sub-modal: Create Admin */}
      {showCreateAdmin && (
        <CreateAdminModal
          onClose={() => setShowCreateAdmin(false)}
          onCreated={(id, name) => {
            // Refetch owners and auto-select the new one
            owners.refetch().then(() => set('ownerId', id));
          }}
        />
      )}
    </>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function HostelsPage() {
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);

  const { data, isLoading } = useSuperHostels({
    ...(search ? { search } : {}),
    ...(gender !== 'ALL' ? { gender } : {}),
  });

  const toggleActive = useToggleHostelActive();
  const deleteHostel = useDeleteHostel();

  const hostels: any[] = data?.data || [];
  const total: number = data?.total || 0;

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteHostel.mutateAsync(id);
      toast.success('Hostel deleted');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Cannot delete hostel with active students');
    }
  };

  const handleToggle = async (id: string) => {
    try { await toggleActive.mutateAsync(id); toast.success('Status updated'); }
    catch { toast.error('Failed to update'); }
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Hostel Management</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>{total} total hostel{total !== 1 ? 's' : ''} registered</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowCreateAdmin(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: 'white', color: '#1d4ed8', border: '2px solid #1d4ed8', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            <UserPlus size={15} /> Add Admin
          </button>
          <button onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            <Plus size={15} /> Add Hostel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or code…" style={{ ...inp, paddingLeft: 38 }} />
        </div>
        {['ALL', 'BOYS', 'GIRLS', 'CO_ED'].map(g => (
          <button key={g} onClick={() => setGender(g)}
            style={{ padding: '8px 16px', borderRadius: 8, border: `2px solid ${gender === g ? '#1d4ed8' : '#e5e7eb'}`, background: gender === g ? '#eff6ff' : 'white', color: gender === g ? '#1d4ed8' : '#374151', fontWeight: gender === g ? 700 : 400, fontSize: 13, cursor: 'pointer' }}>
            {g === 'ALL' ? 'All' : GENDER_LABELS[g]}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 76, background: '#f1f5f9', borderRadius: 12, animation: 'pulse 1.5s ease infinite' }} />)}
        </div>
      ) : hostels.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', background: 'white', borderRadius: 16, border: '1px dashed #e2e8f0' }}>
          <Building2 size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <p style={{ color: '#64748b', fontSize: 16, fontWeight: 600 }}>No hostels found</p>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Click "+ Add Hostel" to create your first hostel</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hostels.map((h: any) => (
            <div key={h._id} style={{ background: 'white', borderRadius: 14, padding: '16px 20px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: h.isActive ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{h.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: '#e0f2fe', color: '#0369a1' }}>{h.hostelCode}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: '#f3f4f6', color: '#374151' }}>{GENDER_LABELS[h.gender]}</span>
                  {h.messEnabled && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: '#fef3c7', color: '#92400e' }}>🍽 Mess</span>}
                  {!h.isActive && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: '#fee2e2', color: '#991b1b' }}>Inactive</span>}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>👤 {(h.ownerId as any)?.name || 'Unassigned'}</span>
                  {h.address?.city && <span style={{ fontSize: 12, color: '#64748b' }}>📍 {h.address.city}{h.address.state ? `, ${h.address.state}` : ''}</span>}
                  <span style={{ fontSize: 12, color: '#64748b' }}><Users size={11} style={{ display: 'inline', marginRight: 3 }} />{h.studentCount ?? 0} students</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => handleToggle(h._id)} title={h.isActive ? 'Deactivate' : 'Activate'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: h.isActive ? '#22c55e' : '#94a3b8' }}>
                  {h.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </button>
                <button onClick={() => handleDelete(h._id, h.name)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateHostelModal onClose={() => setShowCreate(false)} />}
      {showCreateAdmin && (
        <CreateAdminModal onClose={() => setShowCreateAdmin(false)} onCreated={() => { }} />
      )}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
