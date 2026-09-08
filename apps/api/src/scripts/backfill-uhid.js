/**
 * Backfill UHID: one UHID per normalized phone group (oldest patient first
 * for sequence stability). All docs sharing a phone get the same UHID (D2).
 * Phones that normalize ambiguously are reported for manual review.
 * Usage: node src/scripts/backfill-uhid.js [--dry-run]
 */
import mongoose from 'mongoose'
import env from '../config/env.js'
import Patient from '../modules/patient/patient.model.js'
import idsService from '../modules/ids/ids.service.js'
import { normalizePhone } from '../utils/phone.js'

const dryRun = process.argv.includes('--dry-run')

async function run() {
  await mongoose.connect(env.mongoUri)
  const patients = await Patient.find({}).sort({ createdAt: 1 })
  const groups = new Map()
  for (const p of patients) {
    const phone = normalizePhone(p.phone)
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      console.log(`  REVIEW ${p._id} name=${p.name} phone=${p.phone} — unusable phone, skipped`)
      continue
    }
    if (!groups.has(phone)) groups.set(phone, [])
    groups.get(phone).push(p)
  }

  console.log(`Found ${groups.size} phone group(s) across ${patients.length} patient(s).`)
  for (const [phone, docs] of groups) {
    const withUhid = docs.find((d) => d.uhid)
    const uhid = withUhid?.uhid || await idsService.generateUhidDirect()
    for (const d of docs) {
      if (d.uhid === uhid) continue
      console.log(`  ${dryRun ? '[dry-run] would set' : 'SET'} ${d.name} (${phone}) → ${uhid}`)
      if (!dryRun) {
        d.uhid = uhid
        await d.save()
      }
    }
  }
  await mongoose.disconnect()
}

run().catch((err) => { console.error(err); process.exit(1) })
