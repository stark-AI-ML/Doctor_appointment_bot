/**
 * Language & Internationalization Utility Service
 * Handles multi-language (English + Hindi) formatting for dynamic database models.
 * Extensible for adding future secondary languages (e.g. Gujarati, Marathi, Tamil).
 */
export class LanguageService {
  constructor(defaultLang = "hi") {
    this.defaultSecondaryLang = defaultLang;

    // Built-in fallback dictionary for standard medical departments, qualifications, and roles
    this.dictionary = {
      // Departments & Specializations
      "Obstetrics & Gynaecology": "स्त्री एवं प्रसूति रोग",
      "Laparoscopic & General Surgery":
        "लेप्रोस्कोपिक एवं सामान्य शल्य चिकित्सा",
      "Laparoscopic Surgery": "लेप्रोस्कोपिक सर्जरी",
      "General Surgery": "सामान्य शल्य चिकित्सा",
      "General Surgery (Shalya)": "सामान्य शल्य चिकित्सा (शल्य)",
      "General Medicine": "सामान्य चिकित्सा",
      "Critical Care": "गंभीर देखभाल (क्रिटिकल केयर)",
      Orthopaedics: "हड्डी एवं जोड़ रोग (ऑर्थोपेडिक्स)",
      Urology: "मूत्र रोग (यूरोलॉजी)",
      Paediatric: "बाल रोग",
      Pediatrician: "बाल रोग विशेषज्ञ",
      Pediatric: "बाल रोग",
      ENT: "कान, नाक और गला (ENT)",
      Anaesthetist: "एनेस्थीसिया विशेषज्ञ",
      "RMO - Resident Medical Officer": "आर.एम.ओ (निवासी चिकित्सा अधिकारी)",
      "General Physician": "सामान्य चिकित्सक",
      Dermatologist: "त्वचा रोग विशेषज्ञ",
      Cardiologist: "हृदय रोग विशेषज्ञ",
      Dentist: "दंत चिकित्सक",
      Neurologist: "न्यूरोलॉजिस्ट (तंत्रिका रोग)",

      // Qualifications & Roles
      Consultant: "परामर्शदाता",
      Surgeon: "शल्य चिकित्सक",
      "Laparoscopic Surgeon": "लेप्रोस्कोपिक शल्य चिकित्सक",
      MBBS: "एम.बी.बी.एस",
      MD: "एम.डी",
      MS: "एम.एस",
      DNB: "डी.एन.बी",

      // Flow Options
      "Old / Existing Patient": "पुराना मरीज",
      "New Patient": "नया मरीज",
      Confirm: "पुष्टि करें",
      Edit: "बदलाव करें",
      "Main Menu": "मुख्य मेनू",
      Back: "वापस",
    };
  }

  /**
   * Retrieves translation for given English text, prioritizing DB value if available
   */
  getTranslation(englishText, dbHindiValue = null) {
    if (
      dbHindiValue &&
      typeof dbHindiValue === "string" &&
      dbHindiValue.trim()
    ) {
      return dbHindiValue.trim();
    }
    if (!englishText) return "";
    return this.dictionary[englishText.trim()] || "";
  }

  /**
   * Formats text into bilingual display (English + Secondary Language)
   * Example: "Orthopaedics (हड्डी एवं जोड़ रोग)"
   */
  formatBilingual(englishText, dbHindiValue = null, options = {}) {
    const { separator = " / ", brackets = true, newLine = false } = options;
    if (!englishText) return "";
    const secondary = this.getTranslation(englishText, dbHindiValue);
    if (!secondary) return englishText;

    if (newLine) {
      return `${englishText}\n${secondary}`;
    }
    if (brackets) {
      return `${englishText} (${secondary})`;
    }
    return `${englishText}${separator}${secondary}`;
  }

  /**
   * Formats doctor entity with bilingual name and qualifications
   */
  formatDoctor(doctor = {}) {
    let name = doctor.name ? doctor.name.trim() : ''
    if (name) {
      name = /^dr\.?\s*/i.test(name)
        ? name.replace(/^(dr\.?\s*)+/i, 'Dr. ')
        : `Dr. ${name}`
    }

    let nameHindi = doctor.nameHindi ? doctor.nameHindi.trim() : ''
    if (nameHindi) {
      nameHindi = /^डॉ\.?\s*/.test(nameHindi)
        ? nameHindi.replace(/^(डॉ\.?\s*)+/, 'डॉ. ')
        : `डॉ. ${nameHindi}`
    }

    const bilingualName = nameHindi ? `${name} / ${nameHindi}` : name

    const qual = doctor.qualification || doctor.qualifications || 'Consultant'
    const qualHindi = doctor.qualificationHindi || this.getTranslation(qual)
    const bilingualQual = qualHindi ? `${qual} (${qualHindi})` : qual

    return {
      bilingualName,
      bilingualQual,
    }
  }
}

export default new LanguageService();
