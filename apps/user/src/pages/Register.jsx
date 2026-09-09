import { useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import {
  User, Phone, CalendarCheck, ClipboardCheck,
  CheckCircle, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { registrationService } from '../services/registrationService'
import { useAuth } from '../hooks/useAuth'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import PageHeader from '../components/common/PageHeader'
import FormField from '../components/common/FormField'
import { Loader } from '../components/common/Loader'
import { formatDate } from '../utils/formatters'
import styles from './Register.module.css'

const STEPS = [
  { id: 'patient', label: 'Patient', sub: 'मरीज', icon: User },
  { id: 'contact', label: 'Contact', sub: 'संपर्क', icon: Phone },
  { id: 'visit', label: 'Visit', sub: 'अपॉइंटमेंट', icon: CalendarCheck },
  { id: 'review', label: 'Review', sub: 'समीक्षा', icon: ClipboardCheck },
]

const GENDERS = ['Male', 'Female', 'Other']
const TYPES = [
  { value: 'OPD', label: 'OPD Appointment (ओपीडी)' },
  { value: 'HOSPITALIZATION', label: 'Hospitalization (भर्ती)' },
]

function toLocalISOString(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function todayISO() {
  return toLocalISOString(new Date())
}

function tomorrowISO() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return toLocalISOString(d)
}

function dayAfterTomorrowISO() {
  const d = new Date()
  d.setDate(d.getDate() + 2)
  return toLocalISOString(d)
}

const EMPTY = {
  phone: '', name: '', age: '', gender: 'Male', isOld: false,
  district: '', address: '', pinCode: '', problemDescription: '',
  departmentId: '', doctorId: '', preferredDate: tomorrowISO(), type: 'OPD',
}

const digitsOnly = (v) => String(v || '').replace(/\D/g, '')

/** Per-step field errors — same thresholds as the bot + backend. */
function stepErrors(step, form) {
  const errs = {}
  if (step === 0) {
    if (!form.name || form.name.trim().length < 2) errs.name = 'Full name needs at least 2 characters'
    const age = parseInt(form.age, 10)
    if (form.age === '' || isNaN(age) || age < 1 || age > 120) errs.age = 'Age must be 1–120'
    if (!GENDERS.includes(form.gender)) errs.gender = 'Pick a gender'
  }
  if (step === 1) {
    if (digitsOnly(form.phone).length < 10) errs.phone = 'Enter a valid 10-digit mobile number'
    if (!form.district.trim()) errs.district = 'District is required'
    if (!form.address.trim()) errs.address = 'Full address with PIN is required'
  }
  if (step === 2) {
    if (!form.preferredDate) errs.preferredDate = 'Pick a date'
    else if (form.preferredDate < todayISO()) errs.preferredDate = 'Date must be today or later'
    if (!form.departmentId) errs.departmentId = 'Choose a department'
    if (form.type === 'OPD' && !form.doctorId) errs.doctorId = 'OPD needs a doctor — assigned by you, this is critical'
  }
  return errs
}

export default function Register() {
  const { user } = useAuth()
  const [form, setForm] = useState(EMPTY)
  const [step, setStep] = useState(0)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const departments = useMemo(() => registrationService.getDepartments(), [])
  const doctors = useMemo(
    () => (form.departmentId ? registrationService.getDoctorsByDepartment(form.departmentId) : []),
    [form.departmentId]
  )
  const selectedDoctor = useMemo(
    () => doctors.find((d) => String(d.id) === String(form.doctorId)),
    [doctors, form.doctorId]
  )
  const selectedDept = useMemo(
    () => departments.find((d) => String(d.id) === String(form.departmentId)),
    [departments, form.departmentId]
  )

  const set = (key) => (e) => {
    let value = e?.target ? e.target.value : e
    if (key === 'phone') {
      value = digitsOnly(value).slice(0, 10)
    }
    if (key === 'age') {
      value = digitsOnly(value).slice(0, 3)
    }
    setForm((f) => ({ ...f, [key]: value, ...(key === 'departmentId' ? { doctorId: '' } : {}) }))
    setFieldErrors((errs) => ({ ...errs, [key]: undefined }))
  }

  const copyToClipboard = (text, label) => {
    if (navigator.clipboard && text) {
      navigator.clipboard.writeText(text)
      toast.success(`Copied ${label}: ${text}`)
    }
  }

  const next = () => {
    const errs = stepErrors(step, form)
    setFieldErrors(errs)
    if (Object.keys(errs).length) {
      toast.error('Please fix the highlighted fields')
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const back = () => {
    setFieldErrors({})
    setStep((s) => Math.max(s - 1, 0))
  }

  const handleSubmit = async () => {
    const errs = registrationService.validate(form)
    if (errs.length) {
      toast.error(errs[0])
      return
    }
    setSubmitting(true)
    try {
      const res = await registrationService.register(form, { staffCode: user?.staffCode })
      setResult(res)
      toast.success('Registration complete — UHID ' + res.patient.uhid)
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  const resetAll = () => {
    setForm(EMPTY)
    setFieldErrors({})
    setStep(0)
    setResult(null)
  }

  // ── Success: the same three numbers the bot confirms ──
  if (result) {
    const { patient, booking } = result
    return (
      <div className={styles.page}>
        <PageHeader
          title="Registration Complete"
          subtitle="पंजीकरण पूर्ण — share these numbers with the patient"
          icon={CheckCircle}
        />
        <Card>
          <div className={styles.success}>
            <div className={styles.successBadge}><CheckCircle size={44} /></div>
            <div className={styles.numbers}>
              <div className={styles.numberCard} onClick={() => copyToClipboard(patient.uhid, 'UHID')} title="Click to copy">
                <span className={styles.numberLabel}>UHID No · यूएचआईडी</span>
                <span className={styles.numberValue}>{patient.uhid}</span>
                <span className={styles.numberHint}>Click to copy • Same for this phone</span>
              </div>
              {booking.token_number && (
                <div className={`${styles.numberCard} ${styles.tokenCard}`} onClick={() => copyToClipboard(booking.token_number, 'Token')} title="Click to copy">
                  <span className={styles.numberLabel}>Token No · टोकन</span>
                  <span className={styles.numberValue}>{booking.token_number}</span>
                  <span className={styles.numberHint}>Click to copy • Daily queue serial</span>
                </div>
              )}
              <div className={styles.numberCard} onClick={() => copyToClipboard(booking.booking_id, 'Booking ID')} title="Click to copy">
                <span className={styles.numberLabel}>Booking ID</span>
                <span className={styles.numberValueSm}>{booking.booking_id}</span>
                <span className={styles.numberHint}>{booking.patient_name} • {formatDate(booking.date)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Button size="lg" onClick={resetAll}>Register Another Patient</Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Register Patient"
        subtitle="Same questions as the WhatsApp bot — offline entries produce identical records"
        icon={User}
      />

      {/* ── Stepper ── */}
      <div className={styles.stepper} role="list" aria-label="Registration steps">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const state = i < step ? 'done' : i === step ? 'active' : 'todo'
          return (
            <div key={s.id} role="listitem" className={`${styles.step} ${styles[state]}`}>
              <div className={styles.stepDot}>
                {i < step ? <CheckCircle size={18} /> : <Icon size={18} />}
              </div>
              <div className={styles.stepText}>
                <span className={styles.stepLabel}>{i + 1}. {s.label}</span>
                <span className={styles.stepSub}>{s.sub}</span>
              </div>
              {i < STEPS.length - 1 && <div className={styles.stepLine} />}
            </div>
          )
        })}
      </div>

      <Card>
        <div key={step} className="animate-fade-in">
          {/* ── STEP 1: Patient ── */}
          {step === 0 && (
            <div className={styles.grid}>
              <FormField label="Patient Name" hint="मरीज का नाम" required error={fieldErrors.name}>
                <input id="reg-name" value={form.name} onChange={set('name')} placeholder="Full name / पूरा नाम" autoFocus />
              </FormField>
              <div className={styles.row2}>
                <FormField label="Age" hint="उम्र" required error={fieldErrors.age}>
                  <input id="reg-age" value={form.age} onChange={set('age')} placeholder="e.g. 45" inputMode="numeric" />
                </FormField>
                <FormField label="Gender" hint="लिंग" required error={fieldErrors.gender}>
                  <select id="reg-gender" value={form.gender} onChange={set('gender')}>
                    {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </FormField>
              </div>
              <FormField label="Patient Status" hint="मरीज का प्रकार (पुराना / नया)" required>
                <select id="reg-isOld" value={form.isOld ? 'true' : 'false'} onChange={(e) => setForm(f => ({ ...f, isOld: e.target.value === 'true' }))}>
                  <option value="false">New Patient (नया मरीज)</option>
                  <option value="true">Old / Existing Patient (पुराना मरीज)</option>
                </select>
              </FormField>
            </div>
          )}

          {/* ── STEP 2: Contact ── */}
          {step === 1 && (
            <div className={styles.grid}>
              <div className={styles.row2}>
                <FormField label="Mobile Number" hint="मोबाइल नंबर" required error={fieldErrors.phone}>
                  <input id="reg-phone" value={form.phone} onChange={set('phone')} placeholder="10-digit mobile" inputMode="tel" />
                </FormField>
                <FormField label="District" hint="जिला" required error={fieldErrors.district}>
                  <input id="reg-district" value={form.district} onChange={set('district')} placeholder="e.g. Jaunpur" />
                </FormField>
              </div>
              <FormField label="Complete Address with PIN" hint="पूरा पता पिन कोड सहित" required error={fieldErrors.address}>
                <textarea id="reg-address" value={form.address} onChange={set('address')} placeholder="House, street, area" rows={2} />
              </FormField>
              <div className={styles.row2}>
                <FormField label="PIN Code" hint="पिन कोड">
                  <input id="reg-pin" value={form.pinCode} onChange={set('pinCode')} placeholder="e.g. 222001" inputMode="numeric" />
                </FormField>
                <div />
              </div>
            </div>
          )}

          {/* ── STEP 3: Visit ── */}
          {step === 2 && (
            <div className={styles.grid}>
              <div className={styles.row2}>
                <FormField label="Visit Type" required>
                  <select id="reg-type" value={form.type} onChange={set('type')}>
                    {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </FormField>
                <FormField label="Preferred Date" hint="तारीख (DD/MM/YYYY)" required error={fieldErrors.preferredDate}>
                  <div className={styles.datePickerContainer}>
                    <input
                      id="reg-date"
                      type="date"
                      value={form.preferredDate}
                      onChange={set('preferredDate')}
                      min={todayISO()}
                      className={styles.dateInput}
                    />
                    <div className={styles.selectedDateBadge}>
                      📅 Selected: <strong>{formatDate(form.preferredDate)}</strong> (DD/MM/YYYY)
                    </div>
                    <div className={styles.datePresets}>
                      <button
                        type="button"
                        className={`${styles.presetBtn} ${form.preferredDate === todayISO() ? styles.presetActive : ''}`}
                        onClick={() => setForm((f) => ({ ...f, preferredDate: todayISO() }))}
                      >
                        Today · {formatDate(todayISO())}
                      </button>
                      <button
                        type="button"
                        className={`${styles.presetBtn} ${form.preferredDate === tomorrowISO() ? styles.presetActive : ''}`}
                        onClick={() => setForm((f) => ({ ...f, preferredDate: tomorrowISO() }))}
                      >
                        Tomorrow · {formatDate(tomorrowISO())}
                      </button>
                      <button
                        type="button"
                        className={`${styles.presetBtn} ${form.preferredDate === dayAfterTomorrowISO() ? styles.presetActive : ''}`}
                        onClick={() => setForm((f) => ({ ...f, preferredDate: dayAfterTomorrowISO() }))}
                      >
                        Day After · {formatDate(dayAfterTomorrowISO())}
                      </button>
                    </div>
                  </div>
                </FormField>
              </div>
              <div className={styles.row2}>
                <FormField label="Department" hint="विभाग" required error={fieldErrors.departmentId}>
                  <select id="reg-dept" value={form.departmentId} onChange={set('departmentId')}>
                    <option value="">— Select department —</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </FormField>
                <FormField
                  label="Doctor"
                  hint={form.type === 'OPD' ? 'डॉक्टर (OPD needs a doctor)' : 'optional for hospitalization'}
                  required={form.type === 'OPD'}
                  error={fieldErrors.doctorId}
                >
                  <select id="reg-doctor" value={form.doctorId} onChange={set('doctorId')} disabled={!form.departmentId}>
                    <option value="">— Select doctor —</option>
                    {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>)}
                  </select>
                </FormField>
              </div>
              <FormField label="Health Problem" hint="स्वास्थ्य समस्या">
                <textarea id="reg-problem" value={form.problemDescription} onChange={set('problemDescription')} placeholder="Briefly describe the problem" rows={2} />
              </FormField>
            </div>
          )}

          {/* ── STEP 4: Review ticket ── */}
          {step === 3 && (
            <div className={styles.review}>
              <div className={styles.ticket}>
                <div className={styles.ticketHead}>Review Appointment Request · समीक्षा</div>
                <dl className={styles.ticketRows}>
                  <div><dt>Patient</dt><dd>{form.name}, {form.age} · {form.gender}</dd></div>
                  <div><dt>Mobile</dt><dd>{form.phone}</dd></div>
                  <div><dt>Address</dt><dd>{form.address}{form.district ? `, ${form.district}` : ''}{form.pinCode ? ` — ${form.pinCode}` : ''}</dd></div>
                  <div><dt>Visit</dt><dd>{form.type === 'OPD' ? 'OPD' : 'Hospitalization'} · {formatDate(form.preferredDate)}</dd></div>
                  <div><dt>Department</dt><dd>{selectedDept?.name || '—'}</dd></div>
                  <div><dt>Doctor</dt><dd>{selectedDoctor ? `${selectedDoctor.name} (${selectedDoctor.specialization})` : '—'}</dd></div>
                  {form.problemDescription && <div><dt>Problem</dt><dd>{form.problemDescription}</dd></div>}
                </dl>
              </div>
              <p className={styles.reviewNote}>
                Confirming creates the patient (shared UHID for this phone) and the booking
                (fresh token). Same numbers the bot would confirm.
              </p>
            </div>
          )}
        </div>

        {/* ── Wizard footer ── */}
        <div className={styles.wizardFoot}>
          <div>
            {step > 0 && (
              <Button variant="secondary" icon={ChevronLeft} onClick={back} disabled={submitting}>
                Back
              </Button>
            )}
          </div>
          <div className={styles.stepCount}>Step {step + 1} of {STEPS.length}</div>
          <div>
            {step < STEPS.length - 1 ? (
              <Button icon={ChevronRight} onClick={next}>
                Continue
              </Button>
            ) : submitting ? (
              <Loader />
            ) : (
              <Button icon={CheckCircle} size="lg" onClick={handleSubmit}>
                Confirm Registration
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
