import { formatDate } from '../utils/formatters'

/**
 * PrintSlipHandler — Opens a dedicated print window with the patient slip
 * rendered as self-contained HTML + inline CSS. This avoids all @media print
 * conflicts with the main SPA and works reliably across browsers.
 */
export class PrintSlipHandler {
  /**
   * Print a single booking slip.
   * @param {Object} booking
   */
  static printBooking(booking) {
    if (!booking) return console.warn('PrintSlipHandler: No booking provided')
    this._openPrintWindow(booking)
  }

  /** Build the full HTML document for the print window. */
  static _buildSlipHTML(booking) {
    const isIPD =
      booking.type === 'HOSPITALIZATION' ||
      booking.service_name?.toLowerCase().includes('ipd') ||
      booking.service_name?.toLowerCase().includes('hospitalization')

    const docTitle = isIPD ? 'IPD Admission Ticket' : 'OPD Consultation Slip'
    const isNewPatient = booking.isOld === false || booking.is_old === false
    const patientStatusLabel = isNewPatient
      ? ' (नया मरीज)'
      : ' (Old Patient पुराना मरीज)'

    const tokenDisplay = booking.token_number
      ? String(booking.token_number).startsWith('T-')
        ? booking.token_number
        : `Token #${booking.token_number}`
      : booking.time_slot || '—'

    const generatedTime = new Date().toLocaleString('en-IN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: true,
    })

    const appointmentDate = formatDate(booking.date)
    const source = booking.source_label || booking.created_by || booking.bookingSource || 'WhatsApp Bot'
    const address = [
      booking.address || '',
      booking.district ? `, ${booking.district}` : '',
      booking.pinCode ? ` — ${booking.pinCode}` : '',
    ].join('')

    const accentBg = isIPD ? '#e8f5e9' : '#e3f2fd'
    const accentBorder = isIPD ? '#c8e6c9' : '#bbdefb'
    const accentText = isIPD ? '#1b5e20' : '#0d47a1'
    const titleColor = isIPD ? '#2e7d32' : '#1d6fa5'
    const counterType = isIPD ? 'IPD admission' : 'OPD'
    const hindiCounter = isIPD ? 'आईपीडी' : 'ओपीडी'

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${docTitle} — ${booking.patient_name || 'Patient'}</title>
<style>
  @page { size: A4 portrait; margin: 6mm 8mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .slip {
    border: 1.5px solid ${isIPD ? '#81c784' : '#a8c7e0'};
    border-radius: 8px;
    padding: 14px 18px;
    background: #fff;
    margin-bottom: 10px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .hospital-name { font-size: 22px; font-weight: 800; color: #0b3c5d; line-height: 1.1; }
  .doc-title { font-size: 15px; font-weight: 700; color: ${titleColor}; margin-top: 2px; }
  .gen-time { font-size: 11px; color: #546e7a; text-align: right; }
  /* Stats Bar */
  .stats-bar {
    display: grid; grid-template-columns: repeat(4, 1fr);
    background: ${accentBg}; border: 1px solid ${accentBorder};
    border-radius: 6px; padding: 7px 12px; margin-bottom: 10px; gap: 8px;
  }
  .stat-label { font-size: 9px; font-weight: 800; color: #455a64; text-transform: uppercase; letter-spacing: 0.4px; }
  .stat-value { font-size: 12px; font-weight: 700; color: ${accentText}; margin-top: 1px; }
  /* Two Columns */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  .detail-box { border: 1px solid #cfd8dc; border-radius: 6px; padding: 8px 10px; background: #fafafa; }
  .box-header {
    font-size: 11px; font-weight: 800; color: #263238; text-transform: uppercase;
    letter-spacing: 0.3px; border-bottom: 1px solid #eceff1; padding-bottom: 4px; margin-bottom: 6px;
  }
  .highlight { color: #d97706; font-weight: 700; }
  .field-row { display: flex; font-size: 11px; line-height: 1.45; margin-bottom: 3px; }
  .field-name { font-weight: 700; color: #37474f; min-width: 95px; }
  .field-val { color: #102a43; font-weight: 500; flex: 1; }
  /* Vitals */
  .vitals-wrap { border: 1px solid #cfd8dc; border-radius: 6px; overflow: hidden; margin-bottom: 10px; }
  .vitals-title { font-size: 10px; font-weight: 800; color: #37474f; background: #f1f5f9; padding: 4px 10px; text-transform: uppercase; border-bottom: 1px solid #cfd8dc; }
  .vitals-grid { display: grid; grid-template-columns: repeat(5, 1fr); text-align: center; }
  .vital-header { font-size: 9px; font-weight: 700; color: #475569; padding: 4px 2px; border-right: 1px solid #e2e8f0; background: #f8fafc; }
  .vital-header:last-child { border-right: none; }
  .vital-cell { height: 24px; border-right: 1px solid #e2e8f0; border-top: 1px solid #e2e8f0; }
  .vital-cell:last-child { border-right: none; }
  /* Prescription */
  .rx-box { border: 1px solid #cfd8dc; border-radius: 6px; padding: 6px 10px; margin-bottom: 10px; min-height: 75px; }
  .rx-title { font-size: 10px; font-weight: 800; color: #37474f; text-transform: uppercase; margin-bottom: 4px; }
  .ruled-line { border-bottom: 1px solid #e2e8f0; margin-top: 14px; }
  /* Signature */
  .sig-area { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 6px; padding-top: 4px; }
  .sig-title { font-size: 11px; font-weight: 700; color: #1e293b; }
  .notice { font-size: 9px; color: #64748b; margin-top: 2px; line-height: 1.25; }
  .stamp { font-size: 10px; font-weight: 800; color: #94a3b8; border: 1px dashed #cbd5e1; padding: 8px 14px; border-radius: 4px; }
  /* Footer */
  .footer-bar {
    display: flex; align-items: center; gap: 24px;
    background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;
    padding: 6px 12px; margin-top: 8px;
  }
  .contact { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #15803d; }
  .icon-circle {
    width: 22px; height: 22px; border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    color: #fff; font-size: 12px;
  }
  .wa-icon { background: #25d366; }
  .call-icon { background: #0284c7; }
</style>
</head>
<body>

${this._slipBlock(booking, {
  docTitle, patientStatusLabel, tokenDisplay, generatedTime,
  appointmentDate, source, address, accentBg, accentBorder,
  accentText, counterType, hindiCounter, isIPD,
})}

</body>
</html>`
  }

  /** Build one slip block HTML. */
  static _slipBlock(b, o) {
    // WhatsApp SVG icon (inline)
    const waSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`
    // Phone SVG icon (inline)
    const phoneSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`

    // Logo image (uses public/image/image.png)
    /* SVG Logo fallback commented out:
    const logoSvg = `<svg width="52" height="42" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M100 240C90 190 120 120 170 40C120 80 80 130 90 240Z" fill="#009BDD"/>
      <path d="M130 220C120 180 150 130 180 80C140 120 110 160 120 220Z" fill="#009BDD"/>
      <path d="M210 32C240 32 270 50 270 90C290 80 320 80 340 105C360 130 350 160 340 180C360 205 350 240 320 255C290 270 245 275 200 290C220 270 250 250 250 215C250 170 200 180 200 135C200 100 240 110 240 90C240 75 220 50 200 40C202 36 205 32 210 32Z" fill="#7BC142"/>
      <g transform="translate(70,200) scale(0.6)"><rect x="58" y="20" width="4" height="110" fill="#F37023" rx="2"/><circle cx="60" cy="18" r="6" fill="#F37023"/><path d="M60 40C40 25 15 35 10 45C30 45 45 42 60 55C75 42 90 45 110 45C105 35 80 25 60 40Z" fill="#009BDD"/><path d="M60 50 C40 60 40 75 60 85 C80 95 80 110 60 120" stroke="#7BC142" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M60 50 C80 60 80 75 60 85 C40 95 40 110 60 120" stroke="#7BC142" stroke-width="6" fill="none" stroke-linecap="round"/></g>
    </svg>`
    */
    const logoImg = `<img src="${typeof window !== 'undefined' ? window.location.origin : ''}/image/image.png" style="height:48px; max-width:140px; object-fit:contain; vertical-align:middle;" alt="KG Nanda Hospital Logo" onerror="this.style.display='none'"/>`

    return `<div class="slip">
  <!-- Header -->
  <div class="header">
    <div class="brand">
      ${logoImg}
      <div>
        <div class="hospital-name">KG Nanda Hospital</div>
        <div class="doc-title">${o.docTitle}</div>
      </div>
    </div>
    <div class="gen-time">Generated: ${o.generatedTime}</div>
  </div>

  <!-- Stats Bar -->
  <div class="stats-bar">
    <div><div class="stat-label">UHID:</div><div class="stat-value">${b.uhid || 'KGN-PENDING'}</div></div>
    <div><div class="stat-label">TOKEN:</div><div class="stat-value">${o.tokenDisplay}</div></div>
    <div><div class="stat-label">BOOKING ID:</div><div class="stat-value">${b.booking_id || '—'}</div></div>
    <div><div class="stat-label">SOURCE:</div><div class="stat-value">${o.source}</div></div>
  </div>

  <!-- Two Column Details -->
  <div class="two-col">
    <div class="detail-box">
      <div class="box-header">PATIENT DETAILS<span class="highlight">${o.patientStatusLabel}</span></div>
      <div class="field-row"><span class="field-name">Name:</span><span class="field-val">${b.patient_name || '—'}</span></div>
      <div class="field-row"><span class="field-name">Age/Gender:</span><span class="field-val">${b.age ? b.age + ' Yrs' : '—'} / ${b.gender || '—'}</span></div>
      <div class="field-row"><span class="field-name">Mobile:</span><span class="field-val">+91 ${b.mobile || '—'}</span></div>
      <div class="field-row"><span class="field-name">Address:</span><span class="field-val">${o.address || '—'}</span></div>
    </div>
    <div class="detail-box">
      <div class="box-header">VISIT &amp; CLINICAL DETAILS</div>
      <div class="field-row"><span class="field-name">Visit Type:</span><span class="field-val">${o.isIPD ? 'Hospitalization (IPD Admission)' : 'OPD Appointment'}</span></div>
      <div class="field-row"><span class="field-name">${o.isIPD ? 'Admission Date:' : 'Appt Date:'}</span><span class="field-val">${o.appointmentDate}</span></div>
      <div class="field-row"><span class="field-name">Dept / Doctor:</span><span class="field-val">${b.doctor_name || 'General Doctor'}${b.doctor_specialization ? ' — ' + b.doctor_specialization : ''}</span></div>
      <div class="field-row"><span class="field-name">Booking Status:</span><span class="field-val" style="font-weight:700;text-transform:capitalize">${b.status || 'Confirmed'}</span></div>
      <div class="field-row"><span class="field-name">Chief Complaint:</span><span class="field-val">${b.problemDescription || b.problem_description || 'Routine Checkup / Consultation'}</span></div>
    </div>
  </div>

  <!-- Vitals -->
  <div class="vitals-wrap">
    <div class="vitals-title">VITALS SECTION (For Clinical Use)</div>
    <div class="vitals-grid">
      <div class="vital-header">BP (mmHg)</div>
      <div class="vital-header">Pulse (bpm)</div>
      <div class="vital-header">Temp (°F)</div>
      <div class="vital-header">Weight (kg)</div>
      <div class="vital-header">SpO2 (%)</div>
      <div class="vital-cell"></div><div class="vital-cell"></div><div class="vital-cell"></div><div class="vital-cell"></div><div class="vital-cell"></div>
    </div>
  </div>

  <!-- Prescription -->
  <div class="rx-box">
    <div class="rx-title">DOCTOR'S NOTES &amp; PRESCRIPTION</div>
    <div class="ruled-line"></div><div class="ruled-line"></div><div class="ruled-line"></div>
  </div>

  <!-- Signature -->
  <div class="sig-area">
    <div>
      <div class="sig-title">Doctor's Signature</div>
      <div class="notice">Please present this slip at the department ${o.counterType} counter.<br/>कृपया इस पर्ची को संबंधित विभाग के ${o.hindiCounter} काउंटर पर प्रस्तुत करें।</div>
    </div>
    <div class="stamp">HOSPITAL STAMP</div>
  </div>

  <!-- Footer -->
  <div class="footer-bar">
    <div class="contact"><span class="icon-circle wa-icon">${waSvg}</span> WhatsApp Chatbot <strong>+91 8853991899</strong></div>
    <div class="contact"><span class="icon-circle call-icon">${phoneSvg}</span> Call Helpline Number <strong>+91 9838850287</strong></div>
    <div class="contact"><span class="icon-circle call-icon">${phoneSvg}</span> <strong>+91 8840376333</strong></div>
  </div>
</div>`
  }

  /** Open a fresh window, write the slip HTML, and trigger print. */
  static _openPrintWindow(booking) {
    const html = this._buildSlipHTML(booking)

    const printWin = window.open('', '_blank', 'width=900,height=700,scrollbars=yes')
    if (!printWin) {
      alert('Please allow pop-ups to print the patient slip.')
      return
    }

    printWin.document.open()
    printWin.document.write(html)
    printWin.document.close()

    // Wait for the content to render fully, then trigger print
    printWin.onload = () => {
      setTimeout(() => {
        printWin.focus()
        printWin.print()
      }, 250)
    }

    // Fallback if onload doesn't fire (some browsers)
    setTimeout(() => {
      if (!printWin.closed) {
        printWin.focus()
        printWin.print()
      }
    }, 800)
  }
}

export default PrintSlipHandler
