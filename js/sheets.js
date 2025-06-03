// Google Sheets API Integration
class SheetsAPI {
    constructor() {
        this.apiKey = 'AIzaSyBqF-nMxyZMrjmdFbULO9I_j75hXXaiq4A';
        this.spreadsheetId = '1cLbTgbluZyWYHRouEgqHQuYQqKexHhu4st9ANzuaxGk';
        this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    }

    async getSheetData(sheetName, range = '') {
        try {
            const fullRange = range ? `${sheetName}!${range}` : sheetName;
            const url = `${this.baseUrl}/${this.spreadsheetId}/values/${fullRange}?key=${this.apiKey}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.values || [];
        } catch (error) {
            console.error('Error fetching sheet data:', error);
            throw error;
        }
    }

    async getSettings() {
        try {
            const data = await this.getSheetData('Settings');
            if (data.length === 0) return {};

            const headers = data[0];
            const settings = {};
            
            // Process dropdown options from columns
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                
                // Column B - Letter Types
                if (row[1] && row[1].trim()) {
                    if (!settings.letterTypes) settings.letterTypes = [];
                    if (!settings.letterTypes.includes(row[1].trim())) {
                        settings.letterTypes.push(row[1].trim());
                    }
                }
                
                // Column C - Letter Purposes
                if (row[2] && row[2].trim()) {
                    if (!settings.letterPurposes) settings.letterPurposes = [];
                    if (!settings.letterPurposes.includes(row[2].trim())) {
                        settings.letterPurposes.push(row[2].trim());
                    }
                }
                
                // Column G - Letter Styles
                if (row[6] && row[6].trim()) {
                    if (!settings.letterStyles) settings.letterStyles = [];
                    if (!settings.letterStyles.includes(row[6].trim())) {
                        settings.letterStyles.push(row[6].trim());
                    }
                }
            }

            return settings;
        } catch (error) {
            console.error('Error getting settings:', error);
            return {};
        }
    }

    async getSubmissions() {
        try {
            const data = await this.getSheetData('Submissions');
            if (data.length === 0) return [];

            const headers = data[0];
            const submissions = [];

            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                const submission = {
                    id: row[0] || '',
                    date: row[1] || '',
                    type: row[3] || '',
                    recipient: row[4] || '',
                    subject: row[5] || '',
                    review: row[9] || 'في الانتظار',
                    sending: row[10] || 'في الانتظار',
                    content: row[7] || ''
                };
                submissions.push(submission);
            }

            return submissions;
        } catch (error) {
            console.error('Error getting submissions:', error);
            return [];
        }
    }

    async getReviewOptions() {
        try {
            const data = await this.getSheetData('Submissions');
            if (data.length === 0) return [];

            const reviewOptions = new Set();
            
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                if (row[9] && row[9].trim()) {
                    reviewOptions.add(row[9].trim());
                }
            }

            return Array.from(reviewOptions);
        } catch (error) {
            console.error('Error getting review options:', error);
            return ['في الانتظار', 'جاهز للإرسال', 'يحتاج إلى تحسينات', 'مرفوض'];
        }
    }

    translateLetterType(englishType) {
        const translations = {
            'New': 'جديد',
            'Reply': 'رد',
            'Follow Up': 'متابعة',
            'Co-op': 'تعاون'
        };
        return translations[englishType] || englishType;
    }

    async updateSubmissionReview(submissionId, reviewStatus, notes, reviewerName) {
        // Note: This would require a more complex setup with Google Apps Script
        // or a backend service to update the sheet
        console.log('Update submission review:', {
            submissionId,
            reviewStatus,
            notes,
            reviewerName
        });
        
        // For demo purposes, we'll simulate the update
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true });
            }, 1000);
        });
    }
}

// Create global instance
window.sheetsAPI = new SheetsAPI();