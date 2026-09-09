import { describe, it, expect } from 'vitest'
import languageService, { LanguageService } from '../src/utils/language.js'

describe('LanguageService (Multi-language & Fallbacks)', () => {
  it('formats bilingual strings using fallback dictionary when DB field is empty', () => {
    const formatted = languageService.formatBilingual('Orthopaedics', '', { brackets: true })
    expect(formatted).toBe('Orthopaedics (हड्डी एवं जोड़ रोग (ऑर्थोपेडिक्स))')
  })

  it('prioritizes explicit DB Hindi values when provided', () => {
    const formatted = languageService.formatBilingual('Orthopaedics', 'हड्डी विभाग', { brackets: true })
    expect(formatted).toBe('Orthopaedics (हड्डी विभाग)')
  })

  it('formats doctor details cleanly', () => {
    const doc = {
      name: 'Abhinav Katiyar',
      nameHindi: 'अभिनव कटियार',
      qualification: 'Laparoscopic Surgeon',
    }
    const { bilingualName, bilingualQual } = languageService.formatDoctor(doc)
    expect(bilingualName).toBe('Dr. Abhinav Katiyar / डॉ. अभिनव कटियार')
    expect(bilingualQual).toBe('Laparoscopic Surgeon (लेप्रोस्कोपिक शल्य चिकित्सक)')
  })

  it('prevents duplicate Dr. Dr. or डॉ. डॉ. prefixes when already present in input', () => {
    const doc = {
      name: 'Dr. Dr. Abhinav Katiyar',
      nameHindi: 'डॉ. डॉ. अभिनव कटियार',
    }
    const { bilingualName } = languageService.formatDoctor(doc)
    expect(bilingualName).toBe('Dr. Abhinav Katiyar / डॉ. अभिनव कटियार')
  })
})
