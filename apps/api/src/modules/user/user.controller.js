import bcrypt from 'bcryptjs'
import User from './user.model.js'
import idsService from '../ids/ids.service.js'
import { AppError, asyncHandler } from '../../middleware/errorHandler.js'

const STAFF_MANAGE_ROLES = ['superadmin', 'admin']

function assertCanManageStaff(req) {
  if (!STAFF_MANAGE_ROLES.includes(req.admin?.role)) {
    throw new AppError('Forbidden: only superadmin or admin can manage staff', 403)
  }
}

export const userController = {
  /** GET /api/users — staff list (superadmin/admin). Never returns passwordHash. */
  getAll: asyncHandler(async (req, res) => {
    assertCanManageStaff(req)
    const { role, search } = req.query
    const filter = {}
    if (role) filter.role = role
    if (search) {
      const q = new RegExp(search, 'i')
      filter.$or = [{ name: q }, { email: q }, { staffCode: q }]
    }
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(200)
    res.json(users)
  }),

  /** POST /api/users — create staff (superadmin/admin). */
  create: asyncHandler(async (req, res) => {
    assertCanManageStaff(req)
    const { name, email, password, role, doctorId, phone, salary, joiningDate, address, activeDays } = req.body
    if (!name || String(name).trim().length < 2) throw new AppError('Name must be at least 2 characters', 400)
    if (!email || !password || password.length < 6) throw new AppError('Valid email and 6+ char password are required', 400)
    if (!role) throw new AppError('Role is required', 400)

    const exists = await User.findOne({ email: String(email).toLowerCase() })
    if (exists) throw new AppError('Email already registered', 409)

    const passwordHash = await bcrypt.hash(password, 10)
    const staffCode = await idsService.generateStaffCode(role)
    const user = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase(),
      passwordHash,
      role,
      doctorId: doctorId || undefined,
      staffCode,
      phone: phone || '',
      salary: Number(salary) || 0,
      joiningDate: joiningDate ? new Date(joiningDate) : null,
      address: address || '',
      activeDays: Array.isArray(activeDays) && activeDays.length > 0 ? activeDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    })
    res.status(201).json(user)
  }),

  /** PUT /api/users/:id — update staff (superadmin/admin). */
  update: asyncHandler(async (req, res) => {
    assertCanManageStaff(req)
    const { name, role, doctorId, phone, salary, joiningDate, address, activeDays, isActive, password } = req.body
    const update = {}
    if (name !== undefined) update.name = name
    if (role !== undefined) update.role = role
    if (doctorId !== undefined) update.doctorId = doctorId || undefined
    if (phone !== undefined) update.phone = phone
    if (salary !== undefined) update.salary = Number(salary) || 0
    if (joiningDate !== undefined) update.joiningDate = joiningDate ? new Date(joiningDate) : null
    if (address !== undefined) update.address = address
    if (activeDays !== undefined) update.activeDays = Array.isArray(activeDays) ? activeDays : []
    if (isActive !== undefined) update.isActive = !!isActive
    if (password) update.passwordHash = await bcrypt.hash(password, 10)

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    if (!user) throw new AppError('User not found', 404)
    res.json(user)
  }),

  /** PATCH /api/users/:id/toggle — toggle active flag. */
  toggleActive: asyncHandler(async (req, res) => {
    assertCanManageStaff(req)
    const user = await User.findById(req.params.id)
    if (!user) throw new AppError('User not found', 404)
    user.isActive = !user.isActive
    await user.save()
    res.json(user)
  }),
}
