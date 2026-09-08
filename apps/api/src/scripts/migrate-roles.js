/**
 * Migrate legacy `staff` roles to the new role set.
 * Usage: node src/scripts/migrate-roles.js [--dry-run] [--map staff@x.com=receptionist,...]
 * Re-run safe. Never auto-maps — every legacy user needs an explicit target role.
 */
import mongoose from 'mongoose'
import env from '../config/env.js'
import User, { ROLES } from '../modules/user/user.model.js'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const mapArg = args.find((a) => a.startsWith('--map='))
const mapping = Object.fromEntries(
  (mapArg ? mapArg.slice(6).split(',') : []).map((pair) => pair.split('='))
)

async function run() {
  await mongoose.connect(env.mongoUri)
  const legacy = await User.find({ role: { $nin: ROLES } })
  console.log(`Found ${legacy.length} user(s) with legacy/unknown roles.`)

  for (const u of legacy) {
    const target = mapping[u.email]
    if (!target || !ROLES.includes(target)) {
      console.log(`  SKIP ${u.email} (role=${u.role}) — no valid --map entry. Example: --map=${u.email}=receptionist`);
      continue
    }
    console.log(`  ${dryRun ? '[dry-run] would set' : 'SET'} ${u.email}: ${u.role} → ${target}`)
    if (!dryRun) {
      u.role = target
      if (target !== 'doctor') u.doctorId = null
      await u.save()
    }
  }
  await mongoose.disconnect()
}

run().catch((err) => { console.error(err); process.exit(1) })
