/**
 * API.js - Handles API interactions for AI Letter Generator
 */

// API endpoints
const API_BASE_URL = 'http://128.140.37.194:5000';
const API_GENERATE_LETTER = `${API_BASE_URL}/generate-letter`;
const API_ARCHIVE_LETTER = `${API_BASE_URL}/archive-letter`;

/**
 * Generate a letter using the AI API
 * @param {Object} letterData - The letter data to send to the API
 * @returns {Promise<Object>} - The API response
 */
async function generateLetter(letterData) {
    try {
        // Show loading indicator
        showLoading(true);
        
        // Prepare the request payload according to the specified structure
        const payload = {
            category: letterData.letterType,
            sub_category: letterData.letterPurpose,
            title: letterData.letterTitle,
            recipient: letterData.recipient,
            isFirst: letterData.isFirst === 'true',
            prompt: letterData.letterContentPrompt,
            tone: letterData.letterStyle
        };

        console.log('Sending letter generation request:', payload);

        const response = await fetch(API_GENERATE_LETTER, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Letter generation response:', data);
        return data;
    } catch (error) {
        console.error('Error generating letter:', error);
        throw error;
    } finally {
        // Hide loading indicator
        showLoading(false);
    }
}

/**
 * Archive a letter using the AI API
 * @param {Object} letterData - The letter data to archive
 * @returns {Promise<Object>} - The API response
 */
async function archiveLetter(letterData) {
    try {
        // Show loading indicator
        showLoading(true);
        
        // Create a FormData object to send as multipart/form-data
        const formData = new FormData();
        
        // Add the letter content
        formData.append('letter_content', letterData.letterContent);
        
        // Add the letter type
        formData.append('letter_type', letterData.letterType);
        
        // Add the recipient
        formData.append('recipient', letterData.recipient);
        
        // Add the title
        formData.append('title', letterData.letterTitle);
        
        // Add is_first flag
        formData.append('is_first', letterData.isFirst === 'true' ? 'yes' : 'no');
        
        // Add ID if available
        if (letterData.id) {
            formData.append('ID', letterData.id);
        }
        
        // Generate PDF from the selected template and add to formData
        const pdfBlob = await generatePDF(letterData);
        formData.append('file', pdfBlob, 'letter.pdf');

        console.log('Sending letter archive request');

        const response = await fetch(API_ARCHIVE_LETTER, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Letter archive response:', data);
        return data;
    } catch (error) {
        console.error('Error archiving letter:', error);
        throw error;
    } finally {
        // Hide loading indicator
        showLoading(false);
    }
}

/**
 * Generate PDF from letter content and selected template
 * @param {Object} letterData - The letter data
 * @returns {Promise<Blob>} - PDF as Blob
 */
async function generatePDF(letterData) {
    return new Promise((resolve, reject) => {
        try {
            // Get current date for the letter
            const today = new Date();
            const dateStr = today.toLocaleDateString('ar-SA');
            
            // Generate a reference number if not available
            const refNumber = letterData.id || `LTR-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
            
            // Determine which template to use
            const templateId = letterData.selectedTemplate || 'template1';
            
            // Populate template with data
            const templateContentId = `${templateId}-content`;
            const templateElement = document.getElementById(templateContentId);
            
            if (!templateElement) {
                throw new Error(`Template element not found: ${templateContentId}`);
            }
            
            // Clone the template to avoid modifying the original
            const templateClone = templateElement.cloneNode(true);
            
            // Set template content
            const dateElement = templateClone.querySelector(`#${templateId}-date`);
            const refElement = templateClone.querySelector(`#${templateId}-ref`);
            const recipientElement = templateClone.querySelector(`#${templateId}-recipient`);
            const subjectElement = templateClone.querySelector(`#${templateId}-subject`);
            const contentElement = templateClone.querySelector(`#${templateId}-content-text`);
            
            if (dateElement) dateElement.textContent = `التاريخ: ${dateStr}`;
            if (refElement) refElement.textContent = `الرقم المرجعي: ${refNumber}`;
            if (recipientElement) recipientElement.textContent = `إلى: ${letterData.recipient}`;
            if (subjectElement) subjectElement.textContent = letterData.letterTitle;
            if (contentElement) contentElement.innerHTML = letterData.letterContent.replace(/\n/g, '<br>');
            
            // Create a temporary container for the template
            const tempContainer = document.createElement('div');
            tempContainer.appendChild(templateClone);
            tempContainer.style.width = '210mm'; // A4 width
            tempContainer.style.padding = '20mm'; // A4 margins
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '-9999px';
            document.body.appendChild(tempContainer);
            
            // Use html2canvas and jsPDF to generate PDF
            html2canvas(templateClone, {
                scale: 2, // Higher scale for better quality
                useCORS: true,
                logging: false
            }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                
                // A4 size in mm: 210 x 297
                const pdf = new jspdf.jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });
                
                const imgWidth = 210 - 40; // A4 width minus margins
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
                
                // Convert PDF to blob
                const pdfBlob = pdf.output('blob');
                
                // Clean up
                document.body.removeChild(tempContainer);
                
                resolve(pdfBlob);
            }).catch(error => {
                console.error('Error generating PDF canvas:', error);
                document.body.removeChild(tempContainer);
                reject(error);
            });
        } catch (error) {
            console.error('Error in PDF generation:', error);
            reject(error);
        }
    });
}

/**
 * Show loading indicator
 * @param {boolean} show - Whether to show or hide the loading indicator
 */
function showLoading(show) {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

// Export the API functions
window.api = {
    generateLetter,
    archiveLetter,
    generatePDF
};
