const fs = require('fs');
const path = require('path');

const mockDataPath = path.join(__dirname, 'apps', 'admin', 'src', 'data', 'mockData.js');
let mockData = fs.readFileSync(mockDataPath, 'utf8');

const newDoctors = `export const mockDoctors = [
  { id: 1, name: 'Dr. Anand Prakash Tiwari', specialization: 'Gynecologist', consultation_fee: 500, is_active: true, avatar: null, phone: '+91 98765 00001', email: 'anand@kgnanda.com', created_at: '2026-07-15T10:00:00Z' },
  { id: 2, name: 'Dr. Vandana', specialization: 'Gynecologist', consultation_fee: 300, is_active: true, avatar: null, phone: '+91 98765 00002', email: 'vandana@kgnanda.com', created_at: '2026-07-20T10:00:00Z' },
  { id: 3, name: 'Dr. Abhishek Kumar Singh', specialization: 'General Physician', consultation_fee: 300, is_active: true, avatar: null, phone: '+91 98765 00003', email: 'abhishek@kgnanda.com', created_at: '2026-08-01T10:00:00Z' },
  { id: 4, name: 'Dr. Yogesh Pandey', specialization: 'General Surgeon', consultation_fee: 600, is_active: true, avatar: null, phone: '+91 98765 00004', email: 'yogesh@kgnanda.com', created_at: '2026-08-10T10:00:00Z' },
  { id: 5, name: 'Dr. Vikram Singh', specialization: 'Urologist', consultation_fee: 800, is_active: true, avatar: null, phone: '+91 98765 00005', email: 'vikram@kgnanda.com', created_at: '2026-08-15T10:00:00Z' }
]`;

const newServices = `export const mockServices = [
  { id: 1, name: 'Gynecology Consultation', description: 'Expert consultation', is_active: true },
  { id: 2, name: 'General Consultation', description: 'Regular checkup', is_active: true },
  { id: 3, name: 'General Surgery', description: 'Surgical services', is_active: true },
  { id: 4, name: 'Urology', description: 'Urinary tract screening', is_active: true },
]`;

// Replace mockDoctors
mockData = mockData.replace(/export const mockDoctors = \[[\s\S]*?\]/, newDoctors);
mockData = mockData.replace(/export const mockServices = \[[\s\S]*?\]/, newServices);

// Also replace mentions of Dr. Sharma, Verma, Gupta, Patel
mockData = mockData.replace(/Dr\. Sharma/g, 'Dr. Anand Prakash Tiwari');
mockData = mockData.replace(/Dr\. Verma/g, 'Dr. Abhishek Kumar Singh');
mockData = mockData.replace(/Dr\. Gupta/g, 'Dr. Yogesh Pandey');
mockData = mockData.replace(/Dr\. Patel/g, 'Dr. Vikram Singh');

fs.writeFileSync(mockDataPath, mockData);
console.log('Done!');
