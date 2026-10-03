const mongoose = require('mongoose');

// Tenant root for the future multi-school architecture.
// Existing School.ai collections are NOT migrated by this scaffold yet.
const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  logoUrl: { type: String, default: '' },
  isActive: { type: Boolean, default: true, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.School || mongoose.model('School', schoolSchema);
