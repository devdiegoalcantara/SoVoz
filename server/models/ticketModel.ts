import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  sequentialId: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  department: { type: String, required: true },
  status: { type: String, required: true, default: 'Novo' },
  submitterName: { type: String },
  submitterEmail: { type: String },
  userId: { type: String },
  createdAt: { type: Date, default: Date.now },
  attachment: {
    data: Buffer,
    contentType: String,
    filename: String
  },
  comments: [{
    author: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }]
});

// Add indexes for frequently queried fields
ticketSchema.index({ userId: 1, createdAt: -1 });
ticketSchema.index({ status: 1, createdAt: -1 });
ticketSchema.index({ department: 1, createdAt: -1 });
ticketSchema.index({ type: 1, createdAt: -1 });

export const TicketModel = mongoose.model('Ticket', ticketSchema);
export type Ticket = mongoose.InferSchemaType<typeof ticketSchema>; 