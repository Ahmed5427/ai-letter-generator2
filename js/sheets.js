/**
 * Sheets.js - Handles Google Sheets integration for AI Letter Generator
 */

// Google Sheets API configuration
const SHEET_ID = '1cLbTgbluZyWYHRouEgqHQuYQqKexHhu4st9ANzuaxGk';
const SHEETS_API_KEY = 'AIzaSyBqF-nMxyZMrjmdFbULO9I_j75hXXaiq4A';
const SHEETS_API_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

// Check if we're running on Netlify or other production environment
const isNetlifyOrProduction = () => {
    const hostname = window.location.hostname;
    return hostname.includes('netlify.app') || 
           hostname.includes('netlify.com') || 
           !hostname.includes('localhost');
};

// Flag to force using mock data (set to true for Netlify)
const USE_MOCK_DATA = isNetlifyOrProduction();

/**
 * Initialize Google Sheets API
 */
async function initSheetsAPI() {
    console.log('Initializing Google Sheets API');
    
    // If we're on Netlify or production, use mock data immediately
    if (USE_MOCK_DATA) {
        console.log('Running on Netlify or production environment - using mock data');
        await loadMockData();
        // Show notification to user that mock data is being used
        if (typeof showNotification === 'function') {
            showNotification('تم استخدام بيانات تجريبية لعرض التطبيق. البيانات الفعلية غير متاحة حاليًا.', 'info');
        }
        return false;
    }
    
    try {
        // Test connection by fetching sheet metadata
        const response = await fetch(`${SHEETS_API_BASE_URL}/${SHEET_ID}?key=${SHEETS_API_KEY}`);
        
        if (!response.ok) {
            throw new Error(`Failed to connect to Google Sheets API: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Successfully connected to Google Sheets API');
        return true;
    } catch (error) {
        console.error('Error initializing Google Sheets API:', error);
        // If API fails, fall back to mock data for development
        await loadMockData();
        return false;
    }
}

// Mock data for development and fallback
let mockSettingsData = {
    letterTypes: ['طلب', 'استفسار', 'شكوى', 'اقتراح', 'تقرير'],
    letterPurposes: ['دعم صيانة بئر مطار الملك فهد', 'طلب معلومات', 'تقديم خدمة', 'متابعة طلب سابق'],
    letterStyles: ['رسمي', 'ودي', 'تقني', 'أكاديمي']
};

let mockSubmissionsData = [
    {
        id: 'LTR-2025-001',
        date: '2025-06-01',
        letterType: 'New',
        letterTypeArabic: 'جديد',
        reviewStatus: 'في الانتظار',
        sendStatus: 'في الانتظار',
        recipient: 'شركة التقنية المتطورة',
        subject: 'طلب استفسار عن خدمات الشركة',
        content: 'محتوى الخطاب الأول للتجربة...'
    },
    {
        id: 'LTR-2025-002',
        date: '2025-06-02',
        letterType: 'Reply',
        letterTypeArabic: 'رد',
        reviewStatus: 'جاهز للإرسال',
        sendStatus: 'في الانتظار',
        recipient: 'وزارة الاتصالات',
        subject: 'رد على استفسار بخصوص المشروع',
        content: 'محتوى الخطاب الثاني للتجربة...'
    },
    {
        id: 'LTR-2025-003',
        date: '2025-06-03',
        letterType: 'Follow Up',
        letterTypeArabic: 'متابعة',
        reviewStatus: 'يحتاج إلى تحسينات',
        sendStatus: 'في الانتظار',
        recipient: 'شركة الاتصالات السعودية',
        subject: 'متابعة طلب الدعم الفني',
        content: 'محتوى الخطاب الثالث للتجربة...'
    }
];

/**
 * Load mock data for development
 */
async function loadMockData() {
    console.log('Loading mock data for development/fallback');
    return true;
}

/**
 * Get letter types from Settings sheet
 * @returns {Promise<Array>} - Array of letter types
 */
async function getLetterTypes() {
    // If we're on Netlify or production, use mock data immediately
    if (USE_MOCK_DATA) {
        return mockSettingsData.letterTypes;
    }
    
    try {
        // Try to fetch from Google Sheets API
        const response = await fetch(
            `${SHEETS_API_BASE_URL}/${SHEET_ID}/values/Settings!B:B?key=${SHEETS_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Extract values, skip header row
        if (data.values && data.values.length > 1) {
            // Filter out empty values and extract first column
            return data.values.slice(1)
                .filter(row => row.length > 0 && row[0].trim() !== '')
                .map(row => row[0]);
        } else {
            // Fall back to mock data if no values
            return mockSettingsData.letterTypes;
        }
    } catch (error) {
        console.error('Error fetching letter types:', error);
        // Fall back to mock data
        return mockSettingsData.letterTypes;
    }
}

/**
 * Get letter purposes from Settings sheet
 * @returns {Promise<Array>} - Array of letter purposes
 */
async function getLetterPurposes() {
    // If we're on Netlify or production, use mock data immediately
    if (USE_MOCK_DATA) {
        return mockSettingsData.letterPurposes;
    }
    
    try {
        // Try to fetch from Google Sheets API
        const response = await fetch(
            `${SHEETS_API_BASE_URL}/${SHEET_ID}/values/Settings!C:C?key=${SHEETS_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Extract values, skip header row
        if (data.values && data.values.length > 1) {
            // Filter out empty values and extract first column
            return data.values.slice(1)
                .filter(row => row.length > 0 && row[0].trim() !== '')
                .map(row => row[0]);
        } else {
            // Fall back to mock data if no values
            return mockSettingsData.letterPurposes;
        }
    } catch (error) {
        console.error('Error fetching letter purposes:', error);
        // Fall back to mock data
        return mockSettingsData.letterPurposes;
    }
}

/**
 * Get letter styles from Settings sheet
 * @returns {Promise<Array>} - Array of letter styles
 */
async function getLetterStyles() {
    // If we're on Netlify or production, use mock data immediately
    if (USE_MOCK_DATA) {
        return mockSettingsData.letterStyles;
    }
    
    try {
        // Try to fetch from Google Sheets API
        const response = await fetch(
            `${SHEETS_API_BASE_URL}/${SHEET_ID}/values/Settings!G:G?key=${SHEETS_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Extract values, skip header row
        if (data.values && data.values.length > 1) {
            // Filter out empty values and extract first column
            return data.values.slice(1)
                .filter(row => row.length > 0 && row[0].trim() !== '')
                .map(row => row[0]);
        } else {
            // Fall back to mock data if no values
            return mockSettingsData.letterStyles;
        }
    } catch (error) {
        console.error('Error fetching letter styles:', error);
        // Fall back to mock data
        return mockSettingsData.letterStyles;
    }
}

/**
 * Get all letters from Submissions sheet
 * @returns {Promise<Array>} - Array of letter records
 */
async function getAllLetters() {
    // If we're on Netlify or production, use mock data immediately
    if (USE_MOCK_DATA) {
        return mockSubmissionsData;
    }
    
    try {
        // Try to fetch from Google Sheets API
        const response = await fetch(
            `${SHEETS_API_BASE_URL}/${SHEET_ID}/values/Submissions!A:K?key=${SHEETS_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Extract values, skip header row
        if (data.values && data.values.length > 1) {
            // Map sheet data to our letter object structure
            return data.values.slice(1).map(row => {
                // Handle potential missing columns
                while (row.length < 11) row.push('');
                
                // Map letter type to Arabic
                let letterTypeArabic = 'جديد'; // Default
                switch (row[3]) { // Column D (index 3)
                    case 'Reply': letterTypeArabic = 'رد'; break;
                    case 'Follow Up': letterTypeArabic = 'متابعة'; break;
                    case 'Co-op': letterTypeArabic = 'تعاون'; break;
                }
                
                return {
                    id: row[0], // Column A
                    date: row[1], // Column B
                    letterType: row[3], // Column D
                    letterTypeArabic: letterTypeArabic,
                    reviewStatus: row[9] || 'في الانتظار', // Column J
                    sendStatus: row[10] || 'في الانتظار', // Column K
                    recipient: row[4], // Column E
                    subject: row[5], // Column F
                    content: row[7] || '' // Column H (assuming content is here)
                };
            });
        } else {
            // Fall back to mock data if no values
            return mockSubmissionsData;
        }
    } catch (error) {
        console.error('Error fetching letters:', error);
        // Fall back to mock data
        return mockSubmissionsData;
    }
}

/**
 * Get letter by ID
 * @param {string} id - Letter ID
 * @returns {Promise<Object>} - Letter data
 */
async function getLetterById(id) {
    // If we're on Netlify or production, use mock data immediately
    if (USE_MOCK_DATA) {
        const letter = mockSubmissionsData.find(letter => letter.id === id);
        if (!letter) {
            throw new Error(`Letter with ID ${id} not found in mock data`);
        }
        return letter;
    }
    
    try {
        // First try to get all letters
        const letters = await getAllLetters();
        
        // Find the letter with matching ID
        const letter = letters.find(letter => letter.id === id);
        
        if (!letter) {
            throw new Error(`Letter with ID ${id} not found`);
        }
        
        return letter;
    } catch (error) {
        console.error(`Error fetching letter with ID ${id}:`, error);
        
        // Fall back to mock data
        const letter = mockSubmissionsData.find(letter => letter.id === id);
        if (!letter) {
            throw new Error(`Letter with ID ${id} not found in mock data`);
        }
        return letter;
    }
}

/**
 * Search letters by recipient name or ID
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of matching letter records
 */
async function searchLetters(query) {
    // If we're on Netlify or production, use mock data immediately
    if (USE_MOCK_DATA) {
        if (!query) {
            return mockSubmissionsData;
        }
        
        const lowerQuery = query.toLowerCase();
        return mockSubmissionsData.filter(letter => 
            letter.id.toLowerCase().includes(lowerQuery) || 
            letter.recipient.toLowerCase().includes(lowerQuery)
        );
    }
    
    try {
        // Get all letters first
        const letters = await getAllLetters();
        
        if (!query) {
            return letters;
        }
        
        // Filter by query
        const lowerQuery = query.toLowerCase();
        return letters.filter(letter => 
            (letter.id && letter.id.toLowerCase().includes(lowerQuery)) || 
            (letter.recipient && letter.recipient.toLowerCase().includes(lowerQuery))
        );
    } catch (error) {
        console.error('Error searching letters:', error);
        
        // Fall back to mock data
        if (!query) {
            return mockSubmissionsData;
        }
        
        const lowerQuery = query.toLowerCase();
        return mockSubmissionsData.filter(letter => 
            letter.id.toLowerCase().includes(lowerQuery) || 
            letter.recipient.toLowerCase().includes(lowerQuery)
        );
    }
}

/**
 * Filter letters by type and review status
 * @param {string} type - Letter type filter
 * @param {string} reviewStatus - Review status filter
 * @returns {Promise<Array>} - Array of filtered letter records
 */
async function filterLetters(type, reviewStatus) {
    // If we're on Netlify or production, use mock data immediately
    if (USE_MOCK_DATA) {
        return mockSubmissionsData.filter(letter => {
            let matchesType = true;
            let matchesStatus = true;
            
            if (type && type !== 'all') {
                matchesType = letter.letterType === type;
            }
            
            if (reviewStatus && reviewStatus !== 'all') {
                matchesStatus = letter.reviewStatus === reviewStatus;
            }
            
            return matchesType && matchesStatus;
        });
    }
    
    try {
        // Get all letters first
        const letters = await getAllLetters();
        
        // Apply filters
        return letters.filter(letter => {
            let matchesType = true;
            let matchesStatus = true;
            
            if (type && type !== 'all') {
                matchesType = letter.letterType === type;
            }
            
            if (reviewStatus && reviewStatus !== 'all') {
                matchesStatus = letter.reviewStatus === reviewStatus;
            }
            
            return matchesType && matchesStatus;
        });
    } catch (error) {
        console.error('Error filtering letters:', error);
        
        // Fall back to mock data
        return mockSubmissionsData.filter(letter => {
            let matchesType = true;
            let matchesStatus = true;
            
            if (type && type !== 'all') {
                matchesType = letter.letterType === type;
            }
            
            if (reviewStatus && reviewStatus !== 'all') {
                matchesStatus = letter.reviewStatus === reviewStatus;
            }
            
            return matchesType && matchesStatus;
        });
    }
}

/**
 * Update letter review status
 * @param {string} id - Letter ID
 * @param {string} status - New review status
 * @param {string} reviewerName - Name of the reviewer
 * @param {string} notes - Review notes
 * @returns {Promise<boolean>} - Success status
 */
async function updateLetterReviewStatus(id, status, reviewerName, notes) {
    // If we're on Netlify or production, use mock data immediately
    if (USE_MOCK_DATA) {
        console.log(`Updating letter ${id} review status to ${status} (mock data)`);
        console.log(`Reviewer: ${reviewerName}`);
        console.log(`Notes: ${notes}`);
        
        // Update mock data
        const letterIndex = mockSubmissionsData.findIndex(letter => letter.id === id);
        if (letterIndex !== -1) {
            mockSubmissionsData[letterIndex].reviewStatus = status;
        }
        
        return true;
    }
    
    try {
        // In a real implementation, this would update data in Google Sheets
        // For now, we'll update mock data and log the action
        console.log(`Updating letter ${id} review status to ${status}`);
        console.log(`Reviewer: ${reviewerName}`);
        console.log(`Notes: ${notes}`);
        
        // Update mock data
        const letterIndex = mockSubmissionsData.findIndex(letter => letter.id === id);
        if (letterIndex !== -1) {
            mockSubmissionsData[letterIndex].reviewStatus = status;
        }
        
        return true;
    } catch (error) {
        console.error(`Error updating letter ${id} review status:`, error);
        throw error;
    }
}

/**
 * Delete letter
 * @param {string} id - Letter ID
 * @returns {Promise<boolean>} - Success status
 */
async function deleteLetter(id) {
    // If we're on Netlify or production, use mock data immediately
    if (USE_MOCK_DATA) {
        console.log(`Deleting letter ${id} (mock data)`);
        
        // Delete from mock data
        const letterIndex = mockSubmissionsData.findIndex(letter => letter.id === id);
        if (letterIndex !== -1) {
            mockSubmissionsData.splice(letterIndex, 1);
        }
        
        return true;
    }
    
    try {
        // In a real implementation, this would delete data from Google Sheets
        // For now, we'll delete from mock data and log the action
        console.log(`Deleting letter ${id}`);
        
        // Delete from mock data
        const letterIndex = mockSubmissionsData.findIndex(letter => letter.id === id);
        if (letterIndex !== -1) {
            mockSubmissionsData.splice(letterIndex, 1);
        }
        
        return true;
    } catch (error) {
        console.error(`Error deleting letter ${id}:`, error);
        throw error;
    }
}

// Export the Sheets API functions
window.sheets = {
    initSheetsAPI,
    getLetterTypes,
    getLetterPurposes,
    getLetterStyles,
    getAllLetters,
    getLetterById,
    searchLetters,
    filterLetters,
    updateLetterReviewStatus,
    deleteLetter
};
