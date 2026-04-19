import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['investor', 'founder', 'representative'], required: true },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    participants: { type: [participantSchema], required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    /** Investment discussion unlocked after checkpoints. */
    dealStage: { type: String, enum: ['messaging', 'deal_pending_founder', 'deal_active'], default: 'messaging' },
    /** When a rep is party to the thread, founder must approve before deal. */
    founderDealApprovalRequired: { type: Boolean, default: false },
    founderApprovedDealAt: { type: Date, default: null },
  },
  { timestamps: true }
);

conversationSchema.index({ company: 1, createdAt: -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
