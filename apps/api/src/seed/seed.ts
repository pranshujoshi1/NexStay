import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import { User } from '../models/User.model';
import { Hostel } from '../models/Hostel.model';
import { Property } from '../models/Property.model';
import { Floor } from '../models/Floor.model';
import { Room } from '../models/Room.model';
import { Bed } from '../models/Bed.model';
import { Booking } from '../models/Booking.model';
import { HostelStudent } from '../models/HostelStudent.model';
import { RentRecord } from '../models/RentRecord.model';
import { Staff } from '../models/Staff.model';
import { Expense } from '../models/Expense.model';
import { Inventory } from '../models/Inventory.model';
import { Complaint } from '../models/Complaint.model';
import { Review } from '../models/Review.model';
import { MessMenu } from '../models/MessMenu.model';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexstay';
const hash = (pw: string) => bcrypt.hash(pw, 12);
const today = new Date().toISOString().split('T')[0];
const thisMonth = new Date().toISOString().slice(0, 7);
const lastMonth = (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); })();

const IMAGES = [
  'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('🔌 Connected to MongoDB');

  // ── Wipe ──────────────────────────────────────────────────────────────────
  await Promise.all([
    User.deleteMany({}), Hostel.deleteMany({}), Property.deleteMany({}),
    Floor.deleteMany({}), Room.deleteMany({}), Bed.deleteMany({}),
    Booking.deleteMany({}), HostelStudent.deleteMany({}), RentRecord.deleteMany({}),
    Staff.deleteMany({}), Expense.deleteMany({}), Inventory.deleteMany({}),
    Complaint.deleteMany({}), Review.deleteMany({}), MessMenu.deleteMany({}),
  ]);
  console.log('🗑️  Wiped all collections');

  // ── SuperAdmin ────────────────────────────────────────────────────────────
  const superAdmin = await User.create({
    name: 'Super Admin', email: 'admin@nexstay.in', phone: '9999900000',
    passwordHash: await hash('admin123'), role: 'SUPER_ADMIN', status: 'ACTIVE',
  });

  // ── Owner 1 ───────────────────────────────────────────────────────────────
  const owner1 = await User.create({
    name: 'Rajesh Sharma', email: 'rajesh@nexstay.in', phone: '9876543210',
    passwordHash: await hash('owner123'), role: 'HOSTEL_ADMIN', status: 'ACTIVE',
    businessName: 'Sharma Hostels Pvt. Ltd.', ownerVerificationStatus: 'APPROVED',
  });

  // ── Owner 2 ───────────────────────────────────────────────────────────────
  const owner2 = await User.create({
    name: 'Priya Mehta', email: 'priya@nexstay.in', phone: '9876543211',
    passwordHash: await hash('owner123'), role: 'HOSTEL_ADMIN', status: 'ACTIVE',
    businessName: 'Mehta PG Services', ownerVerificationStatus: 'APPROVED',
  });

  // ── Properties ────────────────────────────────────────────────────────────
  const prop1 = await Property.create({
    tenantId: owner1._id, name: 'Sharma Boys Hostel', description: 'Premium boys hostel near Pune University with all amenities.',
    address: '12, Model Colony', city: 'Pune', state: 'Maharashtra', pincode: '411016',
    gender: 'BOYS', amenities: ['WiFi', 'AC', 'Laundry', 'Mess', 'CCTV', 'Parking'],
    foodIncluded: true, images: IMAGES, verificationStatus: 'APPROVED',
    isActive: true, isPaused: false, rating: 4.5, reviewCount: 3, rentStartingFrom: 8000,
  });

  const prop2 = await Property.create({
    tenantId: owner1._id, name: 'Sharma Girls PG', description: 'Safe and comfortable girls PG in Kothrud.',
    address: '45, Paud Road', city: 'Pune', state: 'Maharashtra', pincode: '411038',
    gender: 'GIRLS', amenities: ['WiFi', 'CCTV', 'Security', 'Mess', 'RO Water'],
    foodIncluded: true, images: IMAGES, verificationStatus: 'APPROVED',
    isActive: true, isPaused: false, rating: 4.2, reviewCount: 2, rentStartingFrom: 7500,
  });

  const prop3 = await Property.create({
    tenantId: owner2._id, name: 'Mehta Co-ed Residency', description: 'Modern co-ed PG with premium facilities.',
    address: '78, Viman Nagar', city: 'Pune', state: 'Maharashtra', pincode: '411014',
    gender: 'CO_ED', amenities: ['WiFi', 'AC', 'Gym', 'Cafeteria', 'Housekeeping'],
    foodIncluded: false, images: IMAGES, verificationStatus: 'APPROVED',
    isActive: true, isPaused: false, rating: 4.7, reviewCount: 1, rentStartingFrom: 10000,
  });

  // ── Hostels ───────────────────────────────────────────────────────────────
  const hostel1 = await Hostel.create({
    hostelCode: 'NST-001', name: 'Sharma Boys Hostel', ownerId: owner1._id,
    propertyId: prop1._id, gender: 'BOYS', isActive: true, messEnabled: true,
    address: { street: '12, Model Colony', city: 'Pune', state: 'Maharashtra', pincode: '411016' },
    contactPhone: '9876543210', contactEmail: 'rajesh@nexstay.in',
    messTimings: { breakfast: '7:30 AM - 9:00 AM', lunch: '12:30 PM - 2:00 PM', dinner: '7:30 PM - 9:00 PM' },
  });

  const hostel2 = await Hostel.create({
    hostelCode: 'NST-002', name: 'Sharma Girls PG', ownerId: owner1._id,
    propertyId: prop2._id, gender: 'GIRLS', isActive: true, messEnabled: true,
    address: { street: '45, Paud Road', city: 'Pune', state: 'Maharashtra', pincode: '411038' },
    contactPhone: '9876543210', contactEmail: 'rajesh@nexstay.in',
  });

  const hostel3 = await Hostel.create({
    hostelCode: 'NST-003', name: 'Mehta Co-ed Residency', ownerId: owner2._id,
    propertyId: prop3._id, gender: 'CO_ED', isActive: true, messEnabled: false,
    address: { street: '78, Viman Nagar', city: 'Pune', state: 'Maharashtra', pincode: '411014' },
  });

  // ── Staff Users for NST-001 ───────────────────────────────────────────────
  const warden1 = await User.create({
    name: 'Amit Verma', email: 'warden@nexstay.in', phone: '9123456781',
    passwordHash: await hash('warden123'), role: 'WARDEN', status: 'ACTIVE',
    hostelId: hostel1._id,
    staffPermissions: {
      canViewStudents: true, canManageComplaints: true, canManageRooms: true,
      canViewRentRecords: true, canViewSalary: true, canUploadMenu: false, canViewAttendance: true,
    },
  });

  const mess1 = await User.create({
    name: 'Sunita Devi', email: 'mess@nexstay.in', phone: '9123456782',
    passwordHash: await hash('mess123'), role: 'MESS_MANAGER', status: 'ACTIVE',
    hostelId: hostel1._id,
    staffPermissions: {
      canUploadMenu: true, canViewSalary: true, canViewStudents: false,
      canManageComplaints: false, canViewRentRecords: false, canManageRooms: false, canViewAttendance: false,
    },
  });

  // ── Floors, Rooms, Beds for Property 1 (NST-001) ────────────────────────
  const floor1 = await Floor.create({ tenantId: owner1._id, hostelId: hostel1._id, propertyId: prop1._id, name: 'Ground Floor', order: 0 });
  const floor2 = await Floor.create({ tenantId: owner1._id, hostelId: hostel1._id, propertyId: prop1._id, name: 'First Floor', order: 1 });

  const rooms: any[] = [];
  // Ground floor: 2 double rooms
  for (let i = 1; i <= 2; i++) {
    const r = await Room.create({ tenantId: owner1._id, hostelId: hostel1._id, propertyId: prop1._id, floorId: floor1._id, roomNumber: `G0${i}`, capacity: 2, roomType: 'DOUBLE', status: 'AVAILABLE', pricePerBed: 8000 });
    rooms.push(r);
  }
  // First floor: 2 triple rooms
  for (let i = 1; i <= 2; i++) {
    const r = await Room.create({ tenantId: owner1._id, hostelId: hostel1._id, propertyId: prop1._id, floorId: floor2._id, roomNumber: `F0${i}`, capacity: 3, roomType: 'TRIPLE', status: 'AVAILABLE', pricePerBed: 7000 });
    rooms.push(r);
  }

  // Create beds for all rooms
  const allBeds: any[] = [];
  for (const room of rooms) {
    for (let b = 1; b <= room.capacity; b++) {
      const bed = await Bed.create({ tenantId: owner1._id, hostelId: hostel1._id, propertyId: prop1._id, roomId: room._id, bedNumber: `B${b}`, status: 'AVAILABLE' });
      allBeds.push(bed);
    }
  }

  // ── Students (STUDENT role) for NST-001 ──────────────────────────────────
  const studentData = [
    { name: 'Arjun Kapoor',   mobile: '9000000001', email: 'arjun@gmail.com' },
    { name: 'Rahul Gupta',    mobile: '9000000002', email: 'rahul@gmail.com' },
    { name: 'Vivek Tiwari',   mobile: '9000000003', email: 'vivek@gmail.com' },
    { name: 'Mohit Singh',    mobile: '9000000004', email: 'mohit@gmail.com' },
    { name: 'Nikhil Joshi',   mobile: '9000000005', email: 'nikhil@gmail.com' },
  ];

  const studentUsers: any[] = [];
  for (const s of studentData) {
    const u = await User.create({
      name: s.name, email: s.email, phone: s.mobile,
      passwordHash: await hash(s.mobile.slice(-4)),
      role: 'STUDENT', studentId: s.mobile,
      hostelId: hostel1._id, status: 'ACTIVE',
    });
    studentUsers.push(u);
  }

  // ── Bookings + HostelStudents for NST-001 students ───────────────────────
  const admDate = new Date('2026-01-01');
  const hostelStudents: any[] = [];
  for (let i = 0; i < studentUsers.length; i++) {
    const su = studentUsers[i];
    const bed = allBeds[i];
    const room = rooms.find(r => String(r._id) === String(bed.roomId));

    // Mark bed occupied
    await Bed.findByIdAndUpdate(bed._id, { status: 'OCCUPIED' });

    const booking = await Booking.create({
      guestId: su._id, tenantId: owner1._id, hostelId: hostel1._id,
      propertyId: prop1._id, roomId: room._id, bedId: bed._id,
      status: 'CHECKED_IN', checkInDate: admDate,
      monthlyRent: room.pricePerBed, advancePaid: room.pricePerBed,
      documentsVerified: true,
    });

    const hs = await HostelStudent.create({
      tenantId: owner1._id, hostelId: hostel1._id, propertyId: prop1._id,
      bookingId: booking._id, guestId: su._id, bedId: bed._id,
      name: su.name, phone: su.phone, email: su.email,
      admissionDate: admDate, monthlyRent: room.pricePerBed, securityDeposit: room.pricePerBed,
      status: 'ACTIVE',
    });
    hostelStudents.push(hs);
  }

  // ── Rent Records ──────────────────────────────────────────────────────────
  for (const hs of hostelStudents) {
    // Last month — PAID
    await RentRecord.create({
      tenantId: owner1._id, hostelId: hostel1._id, propertyId: prop1._id,
      hostelStudentId: hs._id, bookingId: hs.bookingId,
      month: lastMonth, amount: hs.monthlyRent, paidAmount: hs.monthlyRent,
      fine: 0, dueDate: new Date(`${lastMonth}-05`), status: 'PAID',
      paidAt: new Date(), paymentMethod: 'UPI',
    });
    // This month — UNPAID for first 2, PAID for rest
    const isPaid = hostelStudents.indexOf(hs) >= 2;
    await RentRecord.create({
      tenantId: owner1._id, hostelId: hostel1._id, propertyId: prop1._id,
      hostelStudentId: hs._id, bookingId: hs.bookingId,
      month: thisMonth, amount: hs.monthlyRent, paidAmount: isPaid ? hs.monthlyRent : 0,
      fine: 0, dueDate: new Date(`${thisMonth}-05`),
      status: isPaid ? 'PAID' : 'UNPAID',
      ...(isPaid && { paidAt: new Date(), paymentMethod: 'Cash' }),
    });
  }

  // ── ERP Staff for NST-001 ─────────────────────────────────────────────────
  await Staff.create([
    { tenantId: owner1._id, hostelId: hostel1._id, propertyId: prop1._id, name: 'Amit Verma', phone: '9123456781', role: 'WARDEN', salary: 25000, joiningDate: new Date('2025-01-01'), isActive: true },
    { tenantId: owner1._id, hostelId: hostel1._id, propertyId: prop1._id, name: 'Sunita Devi', phone: '9123456782', role: 'COOK', salary: 18000, joiningDate: new Date('2025-01-01'), isActive: true },
    { tenantId: owner1._id, hostelId: hostel1._id, propertyId: prop1._id, name: 'Ramesh Kumar', phone: '9123456783', role: 'CLEANER', salary: 12000, joiningDate: new Date('2025-02-01'), isActive: true },
  ]);

  // ── Expenses ─────────────────────────────────────────────────────────────
  await Expense.create([
    { tenantId: owner1._id, hostelId: hostel1._id, propertyId: prop1._id, category: 'ELECTRICITY', amount: 8500, date: `${thisMonth}-01`, description: 'Monthly electricity bill' },
    { tenantId: owner1._id, hostelId: hostel1._id, propertyId: prop1._id, category: 'STAFF_SALARY', amount: 55000, date: `${lastMonth}-30`, description: 'Staff salary — Amit Verma, Sunita Devi, Ramesh Kumar' },
    { tenantId: owner1._id, hostelId: hostel1._id, propertyId: prop1._id, category: 'INTERNET', amount: 2000, date: `${thisMonth}-01`, description: 'Monthly internet bill' },
    { tenantId: owner1._id, hostelId: hostel1._id, propertyId: prop1._id, category: 'MAINTENANCE', amount: 3500, date: `${thisMonth}-10`, description: 'Plumbing repair' },
  ]);

  // ── Inventory ─────────────────────────────────────────────────────────────
  await Inventory.create([
    { tenantId: owner1._id, propertyId: prop1._id, itemName: 'Ceiling Fans', totalCount: 12, workingCount: 11, damagedCount: 1 },
    { tenantId: owner1._id, propertyId: prop1._id, itemName: 'Mattresses', totalCount: 10, workingCount: 10, damagedCount: 0 },
    { tenantId: owner1._id, propertyId: prop1._id, itemName: 'Study Tables', totalCount: 10, workingCount: 9, damagedCount: 1 },
    { tenantId: owner1._id, propertyId: prop1._id, itemName: 'CCTV Cameras', totalCount: 6, workingCount: 6, damagedCount: 0 },
  ]);

  // ── Complaints ────────────────────────────────────────────────────────────
  await Complaint.create([
    {
      tenantId: owner1._id, hostelId: hostel1._id, propertyId: prop1._id,
      guestId: studentUsers[0]._id, hostelStudentId: hostelStudents[0]._id,
      title: 'WiFi not working in room G01', category: 'INTERNET', description: 'Internet has been down since yesterday evening.',
      status: 'OPEN', statusHistory: [{ status: 'OPEN', note: 'Reported by student', changedBy: 'Student', changedAt: new Date() }],
    },
    {
      tenantId: owner1._id, hostelId: hostel1._id, propertyId: prop1._id,
      guestId: studentUsers[1]._id, hostelStudentId: hostelStudents[1]._id,
      title: 'Tap leaking in bathroom', category: 'WATER', description: 'There is a leaking tap in the shared bathroom on ground floor.',
      status: 'IN_PROGRESS', statusHistory: [
        { status: 'OPEN', note: 'Reported', changedBy: 'Student', changedAt: new Date(Date.now() - 86400000) },
        { status: 'IN_PROGRESS', note: 'Plumber called', changedBy: 'Warden', changedAt: new Date() },
      ],
    },
    {
      tenantId: owner1._id, hostelId: hostel1._id, propertyId: prop1._id,
      guestId: studentUsers[2]._id, hostelStudentId: hostelStudents[2]._id,
      title: 'Food quality issue', category: 'FOOD', description: 'Dinner was not properly cooked yesterday.',
      status: 'RESOLVED', resolvedAt: new Date(),
      statusHistory: [{ status: 'RESOLVED', note: 'Issue addressed with mess staff', changedBy: 'Warden', changedAt: new Date() }],
    },
  ]);

  // ── Reviews ───────────────────────────────────────────────────────────────
  await Review.create([
    { propertyId: prop1._id, guestId: studentUsers[0]._id, rating: 5, comment: 'Excellent hostel! Clean rooms, great food, and helpful staff.' },
    { propertyId: prop1._id, guestId: studentUsers[1]._id, rating: 4, comment: 'Very good place to stay. WiFi could be faster.' },
    { propertyId: prop1._id, guestId: studentUsers[2]._id, rating: 4, comment: 'Good hostel, well maintained. Mess food is tasty.' },
    { propertyId: prop3._id, guestId: studentUsers[3]._id, rating: 5, comment: 'Premium facilities. Highly recommended.' },
  ]);

  // ── Today Mess Menu for NST-001 ───────────────────────────────────────────
  await MessMenu.create({
    hostelId: hostel1._id, tenantId: owner1._id,
    date: today, uploadedBy: mess1._id,
    breakfast: { items: ['Poha', 'Chai', 'Boiled Eggs', 'Toast'], photoUrl: null },
    lunch: { items: ['Dal Tadka', 'Rice', 'Roti', 'Sabzi', 'Salad'], photoUrl: null },
    dinner: { items: ['Paneer Butter Masala', 'Rice', 'Roti', 'Dal', 'Sweet'], photoUrl: null },
    specialNote: '🎉 Sunday Special: Gulab Jamun in dinner!',
  });

  // ── Students for NST-002 (Prop 2) ────────────────────────────────────────
  const floor3 = await Floor.create({ tenantId: owner1._id, hostelId: hostel2._id, propertyId: prop2._id, name: 'Ground Floor', order: 0 });
  const room3 = await Room.create({ tenantId: owner1._id, hostelId: hostel2._id, propertyId: prop2._id, floorId: floor3._id, roomNumber: 'G01', capacity: 2, roomType: 'DOUBLE', status: 'AVAILABLE', pricePerBed: 7500 });
  const bed3a = await Bed.create({ tenantId: owner1._id, hostelId: hostel2._id, propertyId: prop2._id, roomId: room3._id, bedNumber: 'B1', status: 'AVAILABLE' });

  const studentG = await User.create({
    name: 'Ananya Sharma', email: 'ananya@gmail.com', phone: '9000000006',
    passwordHash: await hash('0006'), role: 'STUDENT', studentId: '9000000006',
    hostelId: hostel2._id, status: 'ACTIVE',
  });

  console.log('\n✅ Seeding complete!\n');
  console.log('═══════════════════════════════════════════════════');
  console.log('🔑  LOGIN CREDENTIALS');
  console.log('═══════════════════════════════════════════════════');
  console.log('SUPER ADMIN   → admin@nexstay.in         / admin123');
  console.log('OWNER 1       → rajesh@nexstay.in        / owner123');
  console.log('OWNER 2       → priya@nexstay.in         / owner123');
  console.log('WARDEN        → warden@nexstay.in        / warden123');
  console.log('MESS MANAGER  → mess@nexstay.in          / mess123');
  console.log('STUDENT 1     → ID: 9000000001           / PW: 0001');
  console.log('STUDENT 2     → ID: 9000000002           / PW: 0002');
  console.log('STUDENT 3     → ID: 9000000003           / PW: 0003');
  console.log('STUDENT 4     → ID: 9000000004           / PW: 0004');
  console.log('STUDENT 5     → ID: 9000000005           / PW: 0005');
  console.log('═══════════════════════════════════════════════════\n');

  await mongoose.disconnect();
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
