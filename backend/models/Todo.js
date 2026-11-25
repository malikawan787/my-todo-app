import mongoose from 'mongoose';

export const PRIORITIES = ['low', 'medium', 'high'];

const todoSchema = new mongoose.Schema(
  {
    // Which user owns this todo
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    dueDate: { type: Date, default: null },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

// Every query starts with "this user's todos", so we index on user first
todoSchema.index({ user: 1, createdAt: -1 });

export const Todo = mongoose.model('Todo', todoSchema);