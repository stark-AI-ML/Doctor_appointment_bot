import React from 'react'
import { Phone, MessageSquare } from 'lucide-react'
import { HospitalLogo } from './HospitalLogo'
import { formatDate } from '../../utils/formatters'
import styles from './PatientPrintSlip.module.css'

function formatDateTime(d = new Date()) {
  const dateObj = d instanceof Date ? d : new Date(d)
  if (isNaN(dateObj.getTime())) return new Date().toLocaleString()
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function SingleSlipCard({ booking }) {
  if (!booking) return null

  const isIPD = booking.type === 'HOSPITALIZATION' || booking.service_name?.toLowerCase().includes('ipd') || booking.service_name?.toLowerCase().includes('hospitalization')
  const docTitle = isIPD ? 'IPD Admission Ticket' : 'OPD Consultation Slip'
  const isNewPatient = booking.isOld === false || booking.is_old === false
  const patientStatusLabel = isNewPatient ? ' (नया मरीज)' : ' (Old Patient पुराना मरीज)'

  return (
    <div className={`${styles.slipCard} ${isIPD ? styles.ipdSlipCard : ''}`}>
      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div className={styles.brandGroup}>
          <HospitalLogo height={46} />
          <div>
            <h1 className={styles.hospitalTitle}>KG Nanda Hospital</h1>
            <div className={`${styles.docTitle} ${isIPD ? styles.ipdDocTitle : ''}`}>
              {docTitle}
            </div>
          </div>
        </div>
        <div className={styles.generatedTime}>
          Generated: {formatDateTime(booking.updated_at || booking.created_at || new Date())}
        </div>
      </div>

      {/* ── TOP STATS BAR ── */}
      <div className={`${styles.statsBar} ${isIPD ? styles.ipdStatsBar : ''}`}>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>UHID:</span>
          <span className={`${styles.statValue} ${isIPD ? styles.ipdStatValue : ''}`}>
            {booking.uhid || 'KGN-PENDING'}
          </span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>TOKEN:</span>
          <span className={`${styles.statValue} ${isIPD ? styles.ipdStatValue : ''}`}>
            {booking.token_number
              ? (String(booking.token_number).startsWith('T-')
                ? booking.token_number
                : `Token #${booking.token_number}`)
              : (booking.time_slot || '—')}
          </span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>BOOKING ID:</span>
          <span className={`${styles.statValue} ${isIPD ? styles.ipdStatValue : ''}`}>
            {booking.booking_id || '—'}
          </span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>SOURCE:</span>
          <span className={`${styles.statValue} ${isIPD ? styles.ipdStatValue : ''}`}>
            {booking.source_label || booking.created_by || booking.bookingSource || 'WhatsApp Bot'}
          </span>
        </div>
      </div>

      {/* ── TWO COLUMNS: PATIENT & VISIT ── */}
      <div className={styles.twoColGrid}>
        {/* Left Column: Patient Details */}
        <div className={styles.detailsBox}>
          <div className={styles.boxHeader}>
            PATIENT DETAILS<span className={styles.highlightText}>{patientStatusLabel}</span>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldName}>Name:</span>
            <span className={styles.fieldVal}>{booking.patient_name || '—'}</span>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldName}>Age/Gender:</span>
            <span className={styles.fieldVal}>
              {booking.age ? `${booking.age} Yrs` : '—'} / {booking.gender || '—'}
            </span>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldName}>Mobile:</span>
            <span className={styles.fieldVal}>+91 {booking.mobile || '—'}</span>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldName}>Address:</span>
            <span className={styles.fieldVal}>
              {booking.address || '—'}
              {booking.address && booking.district ? `, ${booking.district}` : (booking.district || '')}
              {booking.pinCode ? ` — ${booking.pinCode}` : ''}
            </span>
          </div>
        </div>

        {/* Right Column: Visit Details */}
        <div className={styles.detailsBox}>
          <div className={styles.boxHeader}>VISIT & CLINICAL DETAILS</div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldName}>Visit Type:</span>
            <span className={styles.fieldVal}>
              {isIPD ? 'Hospitalization (IPD Admission)' : 'OPD Appointment'}
            </span>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldName}>{isIPD ? 'Admission Date:' : 'Appt Date:'}</span>
            <span className={styles.fieldVal}>{formatDate(booking.date)}</span>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldName}>Dept / Doctor:</span>
            <span className={styles.fieldVal}>
              {booking.doctor_name || 'General Doctor'}
              {booking.doctor_specialization ? ` — ${booking.doctor_specialization}` : ''}
            </span>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldName}>Booking Status:</span>
            <span className={styles.fieldVal} style={{ fontWeight: 700, textTransform: 'capitalize' }}>
              {booking.status || 'Confirmed'}
            </span>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldName}>Chief Complaint:</span>
            <span className={styles.fieldVal}>
              {booking.problemDescription || booking.problem_description || 'Routine Checkup / Consultation'}
            </span>
          </div>
        </div>
      </div>

      {/* ── VITALS SECTION ── */}
      <div className={styles.vitalsContainer}>
        <div className={styles.vitalsTitle}>VITALS SECTION (For Clinical Use)</div>
        <div className={styles.vitalsGrid}>
          <div className={styles.vitalHeaderCol}>BP (mmHg)</div>
          <div className={styles.vitalHeaderCol}>Pulse (bpm)</div>
          <div className={styles.vitalHeaderCol}>Temp (°F)</div>
          <div className={styles.vitalHeaderCol}>Weight (kg)</div>
          <div className={styles.vitalHeaderCol}>SpO2 (%)</div>
          <div className={styles.vitalCell} />
          <div className={styles.vitalCell} />
          <div className={styles.vitalCell} />
          <div className={styles.vitalCell} />
          <div className={styles.vitalCell} />
        </div>
      </div>

      {/* ── PRESCRIPTION & NOTES ── */}
      <div className={styles.prescriptionBox}>
        <div className={styles.prescriptionTitle}>DOCTOR'S NOTES & PRESCRIPTION</div>
        <div className={styles.ruledLines}>
          <div className={styles.line} />
          <div className={styles.line} />
          <div className={styles.line} />
        </div>
      </div>

      {/* ── SIGNATURE & STAMP ── */}
      <div className={styles.sigArea}>
        <div className={styles.sigLeft}>
          <div className={styles.sigTitle}>Doctor's Signature</div>
          <div className={styles.noticeText}>
            Please present this slip at the department {isIPD ? 'IPD admission' : 'OPD'} counter.
            <br />
            कृपया इस पर्ची को संबंधित विभाग के {isIPD ? 'आईपीडी' : 'ओपीडी'} काउंटर पर प्रस्तुत करें।
          </div>
        </div>
        <div className={styles.stampRight}>HOSPITAL STAMP</div>
      </div>

      {/* ── FOOTER CONTACTS (WhatsApp & Call Helpline - Slogan removed) ── */}
      <div className={styles.footerBar}>
        <div className={styles.contactItem}>
          <div className={styles.iconCircle}>
            <MessageSquare size={12} />
          </div>
          <span>WhatsApp Chatbot <strong>8840376333</strong></span>
        </div>
        <div className={styles.contactItem}>
          <div className={`${styles.iconCircle} ${styles.phoneIconCircle}`}>
            <Phone size={12} />
          </div>
          <span>Call Helpline Number <strong>9838850287</strong></span>
        </div>
      </div>
    </div>
  )
}

/**
 * One slip per booking, stacked — a single booking fills roughly the top
 * half of an A4 page. No duplicate copies, no cut line.
 */
export function PatientPrintSlip({ bookings = [], topBooking, bottomBooking }) {
  // Back-compat: handler used to pass top/bottom copies
  const list = bookings.length
    ? bookings.slice(0, 2)
    : [topBooking, bottomBooking].filter(Boolean).slice(0, 1)

  return (
    <div id="printable-slip-area" className={styles.printPageContainer}>
      <div className={styles.pageSheet}>
        {list.map((booking, i) => (
          <SingleSlipCard key={booking?.booking_id || booking?.id || i} booking={booking} />
        ))}
      </div>
    </div>
  )
}

export default PatientPrintSlip
