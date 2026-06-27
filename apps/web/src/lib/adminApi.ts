import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const getToken = () => localStorage.getItem('nexstay_token');
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

const api = (url: string, options?: any) =>
  axios({ url: `/api/hostel-admin${url}`, headers: authHeaders(), ...options });

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function useAdminDashboard(propertyId?: string) {
  return useQuery({
    queryKey: ['admin-dashboard', propertyId],
    queryFn: async () => {
      const { data } = await api('/dashboard', { params: propertyId ? { propertyId } : {} });
      return data.data as any;
    },
    staleTime: 60000,
  });
}

// ─── Properties ───────────────────────────────────────────────────────────────
export function useAdminProperties(params?: { q?: string; page?: number }) {
  return useQuery({
    queryKey: ['admin-properties', params],
    queryFn: async () => {
      const { data } = await api('/properties', { params });
      return data as { data: any[]; total: number; hasNextPage: boolean };
    },
    staleTime: 0,           // Always re-fetch to reflect super admin approvals
    refetchOnWindowFocus: true,
  });
}

export function useAdminPropertyById(id: string | undefined) {
  return useQuery({
    queryKey: ['admin-property', id],
    queryFn: async () => {
      const { data } = await api(`/properties/${id}`);
      return data.data as any;
    },
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      const { data } = await api('/properties', { method: 'POST', data: body });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-properties'] }),
  });
}

export function useUpdateProperty(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      const { data } = await api(`/properties/${id}`, { method: 'PUT', data: body });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-properties'] });
      qc.invalidateQueries({ queryKey: ['admin-property', id] });
    },
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api(`/properties/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-properties'] }),
  });
}

export function useTogglePause() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api(`/properties/${id}/pause`, { method: 'PATCH' });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-properties'] }),
  });
}

// ─── Bookings ─────────────────────────────────────────────────────────────────
export function useAdminBookings(params?: { status?: string; propertyId?: string; page?: number }) {
  return useQuery({
    queryKey: ['admin-bookings', params],
    queryFn: async () => {
      const { data } = await api('/bookings', { params });
      return data as { data: any[]; total: number; hasNextPage: boolean };
    },
    staleTime: 30000,
  });
}

export function useAcceptBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api(`/bookings/${id}/accept`, { method: 'PATCH' });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-bookings'] }),
  });
}

export function useRejectBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data } = await api(`/bookings/${id}/reject`, { method: 'PATCH', data: { reason } });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-bookings'] }),
  });
}

// ─── ERP ──────────────────────────────────────────────────────────────────────
const erp = (url: string, options?: any) =>
  axios({ url: `/api/hostel-admin/erp${url}`, headers: authHeaders(), ...options });

export function useErpRooms(propertyId?: string) {
  return useQuery({
    queryKey: ['erp-rooms', propertyId],
    queryFn: async () => {
      const { data } = await erp('/rooms', { params: { propertyId } });
      return data.data as any[];
    },
    enabled: !!propertyId,
    staleTime: 15000,
  });
}

export function useRoomBeds(roomId?: string) {
  return useQuery({
    queryKey: ['room-beds', roomId],
    queryFn: async () => {
      const { data } = await erp(`/rooms/${roomId}/beds`);
      return data.data as any[];
    },
    enabled: !!roomId,
    staleTime: 10000,
  });
}

export function useCreateFloor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => { const { data } = await erp('/floors', { method: 'POST', data: body }); return data.data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['erp-rooms'] }),
  });
}

export function useUpdateFloor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: any) => { const { data } = await erp(`/floors/${id}`, { method: 'PUT', data: body }); return data.data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['erp-rooms'] }),
  });
}

export function useDeleteFloor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await erp(`/floors/${id}`, { method: 'DELETE' }); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['erp-rooms'] }),
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => { const { data } = await erp('/rooms', { method: 'POST', data: body }); return data.data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['erp-rooms'] }),
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: any) => { const { data } = await erp(`/rooms/${id}`, { method: 'PUT', data: body }); return data.data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['erp-rooms'] }),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await erp(`/rooms/${id}`, { method: 'DELETE' }); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['erp-rooms'] }),
  });
}

export function useErpStudents(params?: { propertyId?: string; status?: string; search?: string; page?: number }) {
  return useQuery({
    queryKey: ['erp-students', params],
    queryFn: async () => {
      const { data } = await erp('/students', { params });
      return data as { data: any[]; total: number; hasNextPage: boolean };
    },
    staleTime: 20000,
  });
}

export function useErpStudentById(id?: string) {
  return useQuery({
    queryKey: ['erp-student', id],
    queryFn: async () => { const { data } = await erp(`/students/${id}`); return data.data as any; },
    enabled: !!id,
  });
}

export function useStudentDues(studentId?: string) {
  return useQuery({
    queryKey: ['student-dues', studentId],
    queryFn: async () => { const { data } = await erp(`/dues/${studentId}`); return data.data as { records: any[]; totalDue: number }; },
    enabled: !!studentId,
  });
}

export function useStudentRent(studentId?: string) {
  return useQuery({
    queryKey: ['student-rent', studentId],
    queryFn: async () => { const { data } = await erp(`/students/${studentId}/rent`); return data.data as any[]; },
    enabled: !!studentId,
  });
}

export function useRecordRentPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: any) => {
      const { data } = await erp(`/rent/${id}/pay`, { method: 'POST', data: body });
      return data.data;
    },
    onSuccess: (_d, { studentId }) => {
      qc.invalidateQueries({ queryKey: ['student-rent'] });
      qc.invalidateQueries({ queryKey: ['student-dues'] });
      qc.invalidateQueries({ queryKey: ['erp-student', studentId] });
    },
  });
}

export function useProcessCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      const { data } = await erp('/checkin', { method: 'POST', data: body });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['erp-rooms'] });
      qc.invalidateQueries({ queryKey: ['room-beds'] });
      qc.invalidateQueries({ queryKey: ['erp-students'] });
      qc.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
  });
}

export function useProcessCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, ...body }: any) => {
      const { data } = await erp(`/checkout/${studentId}`, { method: 'POST', data: body });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['erp-rooms'] });
      qc.invalidateQueries({ queryKey: ['room-beds'] });
      qc.invalidateQueries({ queryKey: ['erp-students'] });
    },
  });
}

// ─── Phase 5 — Rent & Expenses ────────────────────────────────────────────────
export function useRentDashboard(propertyId?: string) {
  return useQuery({
    queryKey: ['rent-dashboard', propertyId],
    queryFn: async () => { const { data } = await erp('/rent/dashboard', { params: propertyId ? { propertyId } : {} }); return data.data as any; },
    staleTime: 30000,
  });
}

export function useRentRecords(params?: { propertyId?: string; status?: string; month?: string; search?: string; page?: number; type?: string }) {
  return useQuery({
    queryKey: ['rent-records', params],
    queryFn: async () => { const { data } = await erp('/rent/records', { params }); return data as { data: any[]; total: number; hasNextPage: boolean }; },
    staleTime: 15000,
  });
}

export function usePreviewGenerateRent(month?: string) {
  return useQuery({
    queryKey: ['rent-preview', month],
    queryFn: async () => { const { data } = await erp('/rent/preview-generate', { params: { month } }); return data.data as any; },
    staleTime: 30000,
  });
}

export function useGenerateRent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { month: string; dueDate?: string }) => {
      const { data } = await erp('/rent/generate', { method: 'POST', data: body }); return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rent-records'] }); qc.invalidateQueries({ queryKey: ['rent-dashboard'] }); qc.invalidateQueries({ queryKey: ['rent-preview'] }); },
  });
}

export function useAddFine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount, reason }: { id: string; amount: number; reason: string }) => {
      const { data } = await erp(`/rent/${id}/fine`, { method: 'PATCH', data: { amount, reason } }); return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rent-records'] }),
  });
}

export function useSendReminders() {
  return useMutation({
    mutationFn: async (recordIds: string[]) => {
      const { data } = await erp('/rent/send-reminders', { method: 'POST', data: { recordIds } }); return data;
    },
  });
}

export function useCreateFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => { const { data } = await erp('/fees', { method: 'POST', data: body }); return data.data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rent-records'] }),
  });
}

export function useSecurityDeposits(propertyId?: string) {
  return useQuery({
    queryKey: ['security-deposits', propertyId],
    queryFn: async () => {
      const { data } = await erp('/rent/security-deposits', { params: propertyId ? { propertyId } : {} });
      return data as { data: any[]; summary: { totalDeposit: number; totalReturned: number; totalHolding: number; count: number } };
    },
    staleTime: 30000,
  });
}

export function useExpenses(params?: { propertyId?: string; month?: string; page?: number }) {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: async () => { const { data } = await erp('/expenses', { params }); return data as { data: any[]; total: number; summary: any; hasNextPage: boolean }; },
    staleTime: 15000,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => { const { data } = await erp('/expenses', { method: 'POST', data: body }); return data.data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: any) => { const { data } = await erp(`/expenses/${id}`, { method: 'PUT', data: body }); return data.data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await erp(`/expenses/${id}`, { method: 'DELETE' }); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

// ─── Phase 6 — Staff ──────────────────────────────────────────────────────────
export function useStaff(params?: { propertyId?: string; role?: string; status?: string; search?: string }) {
  return useQuery({ queryKey: ['staff', params], queryFn: async () => { const { data } = await erp('/staff', { params }); return data as { data: any[]; total: number }; }, staleTime: 20000 });
}
export function useStaffById(id?: string) {
  return useQuery({ queryKey: ['staff-member', id], queryFn: async () => { const { data } = await erp(`/staff/${id}`); return data.data as any; }, enabled: !!id });
}
export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (body: any) => { const { data } = await erp('/staff', { method: 'POST', data: body }); return data.data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }) });
}
export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ id, ...body }: any) => { const { data } = await erp(`/staff/${id}`, { method: 'PUT', data: body }); return data.data; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); qc.invalidateQueries({ queryKey: ['staff-member'] }); } });
}
export function useToggleStaffStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (id: string) => { const { data } = await erp(`/staff/${id}/toggle`, { method: 'PATCH' }); return data.data; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); qc.invalidateQueries({ queryKey: ['staff-member'] }); } });
}

// ─── Phase 6 — Inventory ─────────────────────────────────────────────────────
export function useInventory(params?: { propertyId?: string }) {
  return useQuery({ queryKey: ['inventory', params], queryFn: async () => { const { data } = await erp('/inventory', { params }); return data as { data: any[]; summary: any }; }, staleTime: 20000 });
}
export function useCreateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (body: any) => { const { data } = await erp('/inventory', { method: 'POST', data: body }); return data.data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }) });
}
export function useUpdateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ id, ...body }: any) => { const { data } = await erp(`/inventory/${id}`, { method: 'PUT', data: body }); return data.data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }) });
}
export function useDeleteInventoryItem() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (id: string) => { await erp(`/inventory/${id}`, { method: 'DELETE' }); }, onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }) });
}

// ─── Phase 6 — Admin Complaints ──────────────────────────────────────────────
export function useAdminComplaints(params?: { propertyId?: string; status?: string; category?: string; page?: number }) {
  return useQuery({ queryKey: ['admin-complaints', params], queryFn: async () => { const { data } = await erp('/complaints', { params }); return data as { data: any[]; total: number; hasNextPage: boolean }; }, staleTime: 15000 });
}
export function useAdminComplaintById(id?: string) {
  return useQuery({ queryKey: ['admin-complaint', id], queryFn: async () => { const { data } = await erp(`/complaints/${id}`); return data.data as any; }, enabled: !!id });
}
export function useUpdateComplaintStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: any) => { const { data } = await erp(`/complaints/${id}/status`, { method: 'PATCH', data: body }); return data.data; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-complaints'] }); qc.invalidateQueries({ queryKey: ['admin-complaint'] }); }
  });
}
export function useAddInternalNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => { const { data } = await erp(`/complaints/${id}/notes`, { method: 'POST', data: { note } }); return data.data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-complaint'] })
  });
}

// ─── Phase 7 — Reports ────────────────────────────────────────────────────────
const report = (url: string, options?: any) =>
  axios({ url: `/api/admin/reports${url}`, headers: authHeaders(), ...options });

export function useOccupancyReport(params?: { propertyId?: string }) {
  return useQuery({ queryKey: ['report-occupancy', params], queryFn: async () => { const { data } = await report('/occupancy', { params }); return data.data as any; }, staleTime: 30000 });
}
export function useRevenueReport(params?: { propertyId?: string }) {
  return useQuery({ queryKey: ['report-revenue', params], queryFn: async () => { const { data } = await report('/revenue', { params }); return data.data as any; }, staleTime: 30000 });
}
export function useCollectionReport(params?: { propertyId?: string; month?: string }) {
  return useQuery({ queryKey: ['report-collection', params], queryFn: async () => { const { data } = await report('/collection', { params }); return data as any; }, staleTime: 30000 });
}
export function useExpenseReport(params?: { propertyId?: string; month?: string }) {
  return useQuery({ queryKey: ['report-expense', params], queryFn: async () => { const { data } = await report('/expenses', { params }); return data.data as any; }, staleTime: 30000 });
}
export function useProfitReport(params?: { propertyId?: string }) {
  return useQuery({ queryKey: ['report-profit', params], queryFn: async () => { const { data } = await report('/profit', { params }); return data.data as any; }, staleTime: 30000 });
}
export function exportReportCsv(type: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const url = `/api/admin/reports/${type}/export?${qs}`;
  const a = document.createElement('a'); a.href = url;
  a.setAttribute('Authorization', `Bearer ${getToken()}`);
  // Use fetch with blob for auth headers
  fetch(url, { headers: authHeaders() }).then(r => r.blob()).then(blob => {
    const burl = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = burl; link.download = `${type}-report.csv`; link.click();
    URL.revokeObjectURL(burl);
  });
}

// ─── Phase 7 — Notifications ─────────────────────────────────────────────────
const notifApi = (url: string, options?: any) =>
  axios({ url: `/api/notifications${url}`, headers: authHeaders(), ...options });

export function useNotifications(page = 1) {
  return useQuery({ queryKey: ['notifications', page], queryFn: async () => { const { data } = await notifApi('/', { params: { page, limit: 10 } }); return data as { data: any[]; unreadCount: number; hasNextPage: boolean }; }, staleTime: 15000, refetchInterval: 30000 });
}
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (id: string) => { await notifApi(`/${id}/read`, { method: 'PATCH' }); }, onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) });
}
export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async () => { await notifApi('/mark-all-read', { method: 'POST' }); }, onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) });
}
export function useDevEmails() {
  return useQuery({ queryKey: ['dev-emails'], queryFn: async () => { const { data } = await axios.get('/api/dev/emails'); return data.data as any[]; }, staleTime: 5000 });
}
