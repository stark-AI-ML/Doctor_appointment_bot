import mongoose from 'mongoose'

export const ROLES = ['superadmin', 'admin', 'doctor', 'receptionist', 'pharmacy']

export const STAFF_CODE_PREFIX = {
  superadmin: 'KGN_SA_',
  admin: 'KGN_ADM_',
  doctor: 'KGN_DOC_',
  receptionist: 'KGN_RC_',
  pharmacy: 'KGN_PHR_',
}

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ROLES, required: true },
  // Link to the clinical doctor profile — required iff role === 'doctor'.
  // One login per doctor profile (unique sparse). default MUST stay undefined
  // (not null): sparse unique indexes reject duplicate explicit nulls, so
  // non-doctor users must omit the field entirely.
  doctorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: undefined, sparse: true, unique: true },
  // Human-readable role-prefixed code, e.g. KGN_RC_001. Generated at creation.
  staffCode:   { type: String, unique: true, sparse: true },
  // Staff details (managed via /staff page; required in UI/API, lenient in DB for migration)
  phone:       { type: String, default: '' },
  salary:      { type: Number, default: 0 },
  joiningDate: { type: Date, default: null },
  address:     { type: String, default: '' },
  isActive:    { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now },
})

// Doctor logins must be linked to exactly one doctor profile.
userSchema.pre('validate', function (next) {
  if (this.role === 'doctor' && !this.doctorId) {
    return next(new Error('doctorId is required when role is doctor'))
  }
  if (this.role !== 'doctor' && this.doctorId) {
    return next(new Error('doctorId is only allowed when role is doctor'))
  }
  next()
})

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    delete ret.passwordHash // never expose
    return ret
  },
})

// NOTE: explicit collection name 'admins' — the collection predates the
// Admin → User rename. Do NOT drop the third argument or all existing
// user data will be orphaned in 'admins' while reads go to 'users'.
export default mongoose.model('User', userSchema, 'admins')
