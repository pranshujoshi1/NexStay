import mongoose, { Document, Schema } from 'mongoose';

export interface IExpenseDoc extends Document {
  tenantId: mongoose.Types.ObjectId;
  hostelId?: mongoose.Types.ObjectId | null;
  propertyId: mongoose.Types.ObjectId;
  category: string;
  amount: number;
  date: Date;
  description?: string;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpenseDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', default: null },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    category: {
      type: String,
      enum: ['ELECTRICITY', 'WATER', 'STAFF_SALARY', 'MAINTENANCE', 'INTERNET', 'FOOD', 'MISCELLANEOUS'],
      required: true,
    },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    description: { type: String, default: '' },
    receiptUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

ExpenseSchema.index({ tenantId: 1 });
ExpenseSchema.index({ tenantId: 1, date: -1 });
ExpenseSchema.index({ propertyId: 1, date: -1 });

export const Expense = mongoose.model<IExpenseDoc>('Expense', ExpenseSchema);
