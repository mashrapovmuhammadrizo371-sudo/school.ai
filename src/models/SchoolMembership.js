const mongoose = require('mongoose');

// Links a platform user/account to a school context.
const schoolMembershipSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  role: { type: String, enum: ['school-admin','director','teacher','student','parent'], required: true, index: true },
  isActive: { type: Boolean, default: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

schoolMembershipSchema.index({ schoolId: 1, userId: 1 }, { unique: true });
module.exports = mongoose.models.SchoolMembership || mongoose.model('SchoolMembership', schoolMembershipSchema);
