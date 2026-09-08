/**
 * Backfill staffCode for users missing one, in createdAt order per role
 * (stable numbering). Re-run safe.
 * Usage: node src/scripts/backfill-staff-codes.js [--dry-run]
 */
import mongoose from 'mongoose'
import env from '../config/env.js'
import User from '../modules/user/user.model.js'
import idsService from '../modules/ids/ids.service.js'

const dryRun = process.argv.includes('--dry-run')

async function run() {
  await mongoose.connect(env.mongoUri)
  const missing = await User.find({ $or: [{ staffCode: null }, { staffCode: '' }] }).sort({ createdAt: 1 })
  console.log(`Found ${missing.length} user(s) without staffCode.`)

  for (const u of missing) {
    const code = await idsService.generateStaffCode(u.role)
    console.log(`  ${dryRun ? '[dry-run] would set' : 'SET'} ${u.email} (${u.role}) → ${code}`)
    if (!dryRun) {
      // NOTE: dry-run still consumes counter values — acceptable (gaps are fine).
      u.staffCode = code
      await u.save()
    }
  }
  await mongoose.disconnect()
}

run().catch((err) => { console.error(err); process.exit(1) })
