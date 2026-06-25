/**
 * One-shot migration: backfill rentStartingFrom for all APPROVED properties
 * where the field is 0 or missing.
 *
 * Run with: npx ts-node -e "require('./src/seed/migrateRentStartingFrom')"
 * OR: ts-node src/seed/migrateRentStartingFrom.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Property } from '../models/Property.model';
import { Room } from '../models/Room.model';

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexstay';
  await mongoose.connect(uri);
  console.log('✅ MongoDB connected');

  // Find all approved properties with rentStartingFrom = 0 or missing
  const props = await Property.find({
    verificationStatus: 'APPROVED',
    $or: [{ rentStartingFrom: { $exists: false } }, { rentStartingFrom: 0 }],
  }).lean();

  console.log(`Found ${props.length} properties to migrate.`);

  let fixed = 0;
  for (const prop of props) {
    const rooms = await Room.find({ propertyId: prop._id }).select('pricePerBed').lean();
    const prices = rooms.map((r) => r.pricePerBed).filter((p) => p > 0);
    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      await Property.findByIdAndUpdate(prop._id, { rentStartingFrom: minPrice });
      console.log(`  ✅ ${prop.name} → rentStartingFrom = ₹${minPrice}`);
      fixed++;
    } else {
      console.log(`  ⚠️  ${prop.name} → no rooms found, skipping`);
    }
  }

  console.log(`\nMigration complete: ${fixed}/${props.length} properties updated.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
