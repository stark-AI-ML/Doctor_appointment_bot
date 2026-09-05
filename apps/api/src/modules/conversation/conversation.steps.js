/**
 * KG Nanda Hospital Conversation Steps and Bilingual Messages
 */

export const STEPS = {
  WELCOME: "WELCOME",

  // OPD Booking Flow
  OPD_DEPARTMENT: "OPD_DEPARTMENT",
  OPD_DOCTOR: "OPD_DOCTOR",
  SELECT_DATE: "SELECT_DATE",
  WHO_FOR: "WHO_FOR",
  PATIENT_NAME: "PATIENT_NAME",
  PATIENT_MOBILE: "PATIENT_MOBILE",
  PATIENT_AGE: "PATIENT_AGE",
  PATIENT_GENDER: "PATIENT_GENDER",
  PATIENT_DISTRICT: "PATIENT_DISTRICT",
  PATIENT_ADDRESS: "PATIENT_ADDRESS",
  PATIENT_PROBLEM: "PATIENT_PROBLEM",
  REVIEW: "REVIEW",

  // Hospitalization Flow
  HOSP_NAME: "HOSP_NAME",
  HOSP_AGE: "HOSP_AGE",
  HOSP_PROBLEM: "HOSP_PROBLEM",
  HOSP_DATE: "HOSP_DATE",

  // Medicine Order Flow
  MED_PRESCRIPTION: "MED_PRESCRIPTION",
  MED_ADDRESS: "MED_ADDRESS",

  // Static flows
  SUPPORT: "SUPPORT",
};

export const MESSAGES = {
  welcome: () =>
    `🙏 *Namaste! Welcome to KG Nanda Hospital*\nनमस्ते! 🙏 के. जी. नंदा अस्पताल में आपका स्वागत है।\n\n*For any assistance, please select an option:*\nकिसी भी सहायता के लिए नीचे दिए गए विकल्प में से एक चुनें।\n\n1️⃣ OPD / Outpatient Department (ओपीडी)\n2️⃣ Hospitalization (अस्पताल में भर्ती)\n3️⃣ Online Medicine Order (ऑनलाइन दवा)\n4️⃣ General Query / Information (सामान्य जानकारी)\n5️⃣ Talk to Support (सहायता केंद्र)\n6️⃣ Email Help (ईमेल सहायता)\n\n👉 *Reply with the number to continue.*\n👉 आगे बढ़ने के लिए नंबर टाइप करें।`,

  departments: (deps) => {
    let msg = `🏥 *OPD / Outpatient Department*\nओपीडी / बाह्य रोग विभाग\n\n*Kindly select a department:*\nकृपया विभाग चुनें:\n\n`;
    deps.forEach((d, i) => (msg += `${i + 1}️⃣ ${d.name}\n`));
    msg += `\n👉 *Reply with number* | 0️⃣ *Main Menu*`;
    return msg;
  },

  doctors: (deptName, docs) => {
    let msg = `👩‍⚕️ *${deptName}*\n\n`;
    docs.forEach((d, i) => {
      msg += `${i + 1}️⃣ Dr. ${d.name}\n*${d.qualifications || "Consultant"}*\n\n`;
    });
    msg += `👉 *Reply with doctor number to book appointment.*\n👉 अपॉइंटमेंट के लिए डॉक्टर नंबर टाइप करें।\n\n0️⃣ Back | 00 Main Menu`;
    return msg;
  },

  selectDate: (doctorName, options = []) => {
    if (!options.length) {
      return `👨‍⚕️ *Doctor Selected: ${doctorName}*\nआपने ${doctorName} का चयन किया है।\n\n📅 *Select Appointment Date / अपॉइंटमेंट की तारीख चुनें:*\n\n*Please type your preferred date in this format:*\nकृपया अपनी पसंदीदा तारीख इस फॉर्मेट में टाइप करें:\n\n📅 *DD/MM/YYYY*\n*(Example: 30/08/2026)*\n\n0️⃣ Back | 00 Main Menu`
    }
    let msg = `👨‍⚕️ *Doctor Selected: ${doctorName}*\nआपने ${doctorName} का चयन किया है।\n\n📅 *Select Appointment Date / अपॉइंटमेंट की तारीख चुनें:*\n\n`
    options.forEach((opt, i) => {
      msg += `${i + 1}️⃣ ${opt.icon} ${opt.dateStr} \n          ${opt.label}\n`
    })
    msg += `\n👉 *Reply with the number to book, or type a date (DD/MM/YYYY).*\n👉 अपॉइंटमेंट के लिए नंबर भेजें या तारीख (DD/MM/YYYY) टाइप करें।\n\n0️⃣ Back | 00 Main Menu`
    return msg
  },

  whoFor: (patientName) =>
    `👤 *BOOKING FOR WHOM?*\n\nWelcome back!\n\n1️⃣ ${patientName}\n2️⃣ Someone Else / Family Member`,

  patientName: () =>
    `📝 *Patient Name / मरीज का नाम*\n*Please enter the patient's full name.*\nमरीज का पूरा नाम दर्ज करें।`,

  patientMobile: () =>
    `📱 *Mobile Number / मोबाइल नंबर*\n*Please enter 10-digit mobile number of patient/guardian.*\nमरीज/अभिभावक का 10 अंकों का मोबाइल नंबर दर्ज करें।`,

  patientAge: () =>
    `🎂 *Age / उम्र*\n*Please enter the patient's age.*\nमरीज की उम्र दर्ज करें।`,

  patientGender: () =>
    `⚧ *Gender / लिंग*\n*Please reply with:*\n1️⃣ Male / पुरुष\n2️⃣ Female / महिला\n3️⃣ Other / अन्य`,

  patientDistrict: () =>
    `📍 *District / जिले का नाम*\n*Please enter your district name.*\nअपने जिले का नाम दर्ज करें।`,

  patientAddress: () =>
    `🏠 *Complete Address with PIN Code*\nपूरा पता पिन कोड के साथ\n*Please enter your complete residential address including PIN code.*\nपिन कोड सहित अपना पूरा पता दर्ज करें।`,

  patientProblem: () =>
    `🩺 *Health Problem / स्वास्थ्य समस्या*\n*Please briefly describe the patient's health problem.*\nकृपया मरीज की समस्या का संक्षिप्त विवरण दें।`,

  review: (data) =>
    `📋 *REVIEW APPOINTMENT REQUEST*\n\n👨‍⚕️ Doctor: ${data.doctorName}\n📅 Preferred Date: ${data.date}\n\n👤 Patient: ${data.name}\n📱 Mobile: ${data.mobile}\n🎂 Age: ${data.age}\n⚧ Gender: ${data.gender}\n📍 District: ${data.district}\n🏠 Address: ${data.address}\n🩺 Problem: ${data.problem}\n\n*Confirm details?*\n1️⃣ Confirm / पुष्टि करें\n2️⃣ Edit / बदलाव करें\n0️⃣ Main Menu`,

  appointmentConfirmed: (data) =>
    `✅ *Appointment Request Received!*\n✅ अपॉइंटमेंट अनुरोध सफलतापूर्वक प्राप्त हुआ!\n\n🎫 *Token No:* ${data.tokenNumber}\n🆔 *UHID No:* ${data.uhid}\n\n📋 *Appointment Details / विवरण:*\n👨‍⚕️ Doctor: ${data.doctorName}\n📅 Date: ${data.date}\n👤 Name: ${data.name}\n📱 Mobile: ${data.mobile}\n\n📌 *Our team will call you to confirm your appointment.*\n📌 हमारी टीम आपको कॉल करके अपॉइंटमेंट की पुष्टि करेगी।\n\n*Type "menu" to return to main menu.*`,

  // Hospitalization
  hospStart: () =>
    `🏥 *Hospitalization / Admission*\nअस्पताल में भर्ती हेतु अपॉइंटमेंट\n\n*To schedule a hospitalization, please provide patient name:*\nभर्ती हेतु कृपया मरीज का नाम बताएं:`,

  hospAge: () =>
    `🎂 *Please enter the patient's age.*\nमरीज की उम्र दर्ज करें।`,
  hospProblem: () =>
    `🩺 *Please describe the illness/problem.*\nबीमारी का विवरण दें।`,
  hospDate: (options = []) => {
    let msg = `🏥 *Preferred Admission Date / पसंदीदा भर्ती तारीख:*\n\n`
    if (options.length) {
      options.forEach((opt, i) => {
        msg += `${i + 1}️⃣ ${opt.icon} ${opt.dateStr} \n          ${opt.label}\n`
      })
      msg += `\n👉 *Reply with the number to book, or type a date (DD/MM/YYYY).*\n👉 अपॉइंटमेंट के लिए नंबर भेजें या तारीख (DD/MM/YYYY) टाइप करें।\n0️⃣ Back | 00 Main Menu`
    } else {
      msg += `\n*Please type your preferred date in DD/MM/YYYY format.*\nकृपया DD/MM/YYYY फॉर्मेट में तारीख लिखें।\n0️⃣ Back | 00 Main Menu`
    }
    return msg
  },
  hospDone: () =>
    `✅ *Hospitalization Request Received*\nअस्पताल में भर्ती का अनुरोध प्राप्त हुआ।\n\nOur staff will call you to confirm.\nहमारे कर्मचारी आपको कॉल करके पुष्टि करेंगे।\n\nType "menu" to return.`,

  // Medicine
  medStart: () =>
    `💊 *Online Medicine Order*\nऑनलाइन घर बैठे दवा मंगाने की सुविधा\n\n📷 *Please send a photo of your prescription.*\nकृपया अपनी पर्ची की फोटो भेजें।`,

  medAddress: () =>
    `🏠 *Please provide your complete delivery address.*\nकृपया अपना पूरा डिलीवरी पता भेजें।`,

  medDone: () =>
    `✅ *Prescription Received!*\n\nOur team will confirm the order and delivery details.\nहमारी टीम ऑर्डर और डिलीवरी की जानकारी देगी।\n\nType "menu" to return.`,

  // Info / Support
  info: () =>
    `ℹ️ *General Query / Information*\nसामान्य जानकारी / अन्य जानकारी\n\n*Hospital Timings / अस्पताल का समय:*\n🕘 Mon–Sat: 9:00 AM – 8:00 PM\n🕘 Sunday: Emergency only\n\n*Address / पता:*\n📍 KG Nanda Hospital, Example Address, City\n\n*Services / सेवाएं:*\n• OPD Consultation\n• Hospitalization\n• Emergency Care\n• Online Medicine Delivery\n\n0️⃣ Main Menu`,

  support: () =>
    `📞 *Talk to Support*\nअस्पताल सहायता केंद्र से संपर्क करें\n\n*For assistance, contact our helpline:*\n\n1️⃣ First Helpline: 8840376333\n2️⃣ Second Helpline: 9838850287\n\n0️⃣ Main Menu`,

  email: () =>
    `📧 *Email Help / ईमेल सहायता*\n\n*For email assistance, contact us at:*\n📧 admin@kgnandahospital.com\n\n0️⃣ Main Menu`,

  invalidInput: () =>
    `❌ Invalid input. Please try again or type "menu".\nगलत इनपुट। कृपया पुनः प्रयास करें।`,
};
