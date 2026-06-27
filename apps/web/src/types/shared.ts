// ─── Enums ────────────────────────────────────────────────────────────────────
export enum Role {
  STUDENT      = 'STUDENT',
  HOSTEL_ADMIN = 'HOSTEL_ADMIN',
  SUPER_ADMIN  = 'SUPER_ADMIN',
  WARDEN       = 'WARDEN',
  MESS_MANAGER = 'MESS_MANAGER',
}

export enum UserStatus { ACTIVE = 'ACTIVE', SUSPENDED = 'SUSPENDED' }
export enum VerificationStatus { PENDING = 'PENDING', APPROVED = 'APPROVED', REJECTED = 'REJECTED' }
export enum PropertyGender { BOYS = 'BOYS', GIRLS = 'GIRLS', CO_ED = 'CO_ED' }
export enum RoomType { SINGLE = 'SINGLE', DOUBLE = 'DOUBLE', TRIPLE = 'TRIPLE', FOUR_SHARING = 'FOUR_SHARING' }
export enum RoomStatus { AVAILABLE = 'AVAILABLE', FULL = 'FULL' }
export enum BedStatus { AVAILABLE = 'AVAILABLE', OCCUPIED = 'OCCUPIED', RESERVED = 'RESERVED' }
export enum BookingStatus { PENDING = 'PENDING', CONFIRMED = 'CONFIRMED', CANCELLED = 'CANCELLED', CHECKED_IN = 'CHECKED_IN', CHECKED_OUT = 'CHECKED_OUT' }
export enum RentStatus { PAID = 'PAID', UNPAID = 'UNPAID', PARTIAL = 'PARTIAL' }
export enum ComplaintStatus { OPEN = 'OPEN', IN_PROGRESS = 'IN_PROGRESS', RESOLVED = 'RESOLVED', CLOSED = 'CLOSED' }
export enum ComplaintCategory { ELECTRICITY = 'ELECTRICITY', FOOD = 'FOOD', INTERNET = 'INTERNET', WATER = 'WATER', CLEANING = 'CLEANING', OTHER = 'OTHER' }
export enum StaffRole { WARDEN = 'WARDEN', COOK = 'COOK', CLEANER = 'CLEANER', SECURITY = 'SECURITY', MANAGER = 'MANAGER', OTHER = 'OTHER' }
export enum ExpenseCategory { ELECTRICITY = 'ELECTRICITY', WATER = 'WATER', STAFF_SALARY = 'STAFF_SALARY', MAINTENANCE = 'MAINTENANCE', INTERNET = 'INTERNET', FOOD = 'FOOD', MISCELLANEOUS = 'MISCELLANEOUS' }
export enum NotificationChannel { IN_APP = 'IN_APP', EMAIL = 'EMAIL' }
export enum HostelStudentStatus { ACTIVE = 'ACTIVE', CHECKED_OUT = 'CHECKED_OUT' }

// ─── Staff Permissions ────────────────────────────────────────────────────────
export interface StaffPermissions {
  canViewStudents:     boolean;
  canManageComplaints: boolean;
  canViewRentRecords:  boolean;
  canUploadMenu:       boolean;
  canViewSalary:       boolean;
  canManageRooms:      boolean;
  canViewAttendance:   boolean;
}

// ─── Hostel ───────────────────────────────────────────────────────────────────
export interface IHostel {
  _id: string;
  hostelCode: string;
  name: string;
  ownerId: string;
  address?: { street?: string; city?: string; state?: string; pincode?: string };
  gender: PropertyGender;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
  propertyId?: string;
  messEnabled: boolean;
  messTimings?: { breakfast: string; lunch: string; dinner: string };
  createdAt: string;
}

// ─── Mess Menu ────────────────────────────────────────────────────────────────
export interface IMeal { items: string[]; photoUrl: string | null; }
export interface IMessMenu {
  _id: string;
  hostelId: string;
  date: string;
  uploadedBy: string | { name: string };
  breakfast: IMeal;
  lunch: IMeal;
  dinner: IMeal;
  specialNote: string;
  createdAt: string;
}

// ─── Core Interfaces ──────────────────────────────────────────────────────────
export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
  avatar?: string;
  businessName?: string;
  gstNumber?: string;
  identityProofUrl?: string;
  ownerVerificationStatus?: VerificationStatus;
  ownerRejectionReason?: string;
  hostelId?: string | null;
  studentId?: string | null;
  staffPermissions?: StaffPermissions | null;
  createdAt: string;
  updatedAt: string;
}

export interface IProperty {
  _id: string;
  tenantId: string;
  name: string;
  description: string;
  address: string;
  city: string;
  locality?: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  gender: PropertyGender;
  amenities: string[];
  rules?: string;
  foodIncluded: boolean;
  images: string[];
  videoUrl?: string;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  isActive: boolean;
  isPaused: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface IFloor { _id: string; tenantId: string; hostelId?: string; propertyId: string; name: string; order: number; }
export interface IRoom { _id: string; tenantId: string; hostelId?: string; propertyId: string; floorId: string; roomNumber: string; capacity: number; roomType: RoomType; status: RoomStatus; pricePerBed: number; }
export interface IBed { _id: string; tenantId: string; hostelId?: string; propertyId: string; roomId: string; bedNumber: string; status: BedStatus; currentBookingId?: string; }

export interface IBooking {
  _id: string;
  guestId: string;
  tenantId: string;
  hostelId?: string;
  propertyId: string;
  roomId: string;
  bedId: string;
  status: BookingStatus;
  checkInDate?: string;
  checkOutDate?: string;
  advancePaid: number;
  monthlyRent: number;
  aadhaarUrl?: string;
  studentIdUrl?: string;
  photoUrl?: string;
  documentsVerified: boolean;
  paymentId?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
}

export interface IHostelStudent {
  _id: string;
  tenantId: string;
  hostelId?: string;
  propertyId: string;
  bookingId: string;
  guestId: string;
  bedId: string;
  name: string;
  phone: string;
  email: string;
  college?: string;
  guardianName?: string;
  guardianPhone?: string;
  aadhaarUrl?: string;
  studentIdUrl?: string;
  photoUrl?: string;
  admissionDate: string;
  exitDate?: string;
  noticePeriodDate?: string;
  monthlyRent: number;
  securityDeposit: number;
  status: HostelStudentStatus;
}

export interface IRentRecord {
  _id: string;
  tenantId: string;
  hostelId?: string;
  propertyId: string;
  roomId: string;
  hostelStudentId: string;
  bookingId: string;
  month: string;
  amount: number;
  paidAmount: number;
  fine: number;
  dueDate: string;
  status: RentStatus;
  paidAt?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface IStaff {
  _id: string;
  tenantId: string;
  hostelId?: string;
  propertyId: string;
  name: string;
  phone: string;
  email?: string;
  role: StaffRole;
  salary: number;
  joiningDate: string;
  photoUrl?: string;
  isActive: boolean;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface IExpense {
  _id: string;
  tenantId: string;
  hostelId?: string;
  propertyId: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface IInventory {
  _id: string;
  tenantId: string;
  propertyId: string;
  itemName: string;
  totalCount: number;
  workingCount: number;
  damagedCount: number;
  notes?: string;
  updatedAt: string;
}

export interface IComplaint {
  _id: string;
  tenantId: string;
  hostelId?: string;
  propertyId: string;
  guestId?: string;
  hostelStudentId?: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  assignedToStaffId?: string;
  statusHistory: Array<{ status: ComplaintStatus; note?: string; changedAt: string }>;
  resolvedAt?: string;
  createdAt: string;
}

export interface IReview {
  _id: string;
  propertyId: string;
  guestId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface INotification {
  _id: string;
  userId: string;
  hostelId?: string;
  type: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

// ─── Auth Types ───────────────────────────────────────────────────────────────
export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
  avatar?: string;
  businessName?: string;
  ownerVerificationStatus?: VerificationStatus;
  hostelId?: string | null;
  studentId?: string | null;
  staffPermissions?: StaffPermissions | null;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  hostel?: IHostel;
  hostels?: IHostel[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
