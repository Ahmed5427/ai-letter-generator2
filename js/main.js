/**
 * Main.js - Main JavaScript functionality for AI Letter Generator
 */

// Global state
const state = {
    darkMode: false,
    currentPage: getCurrentPage(),
    selectedLetterId: null,
    letterData: null
};

// DOM Ready handler
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing application');
    
    // Initialize theme
    initTheme();
    
    // Initialize Google Sheets API
    try {
        await window.sheets.initSheetsAPI();
        console.log('Sheets API initialized');
    } catch (error) {
        console.error('Failed to initialize Sheets API:', error);
        // Show error message to user
        showNotification('خطأ في الاتصال بقاعدة البيانات. يرجى المحاولة مرة أخرى لاحقًا.', 'error');
    }
    
    // Initialize page-specific functionality
    initPageFunctionality();
    
    // Add event listeners for common elements
    const themeToggleButton = document.getElementById('theme-toggle-button');
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', toggleTheme);
    }
    
    // Load template preview images
    loadTemplatePreviewImages();
});

/**
 * Get current page name from URL
 * @returns {string} - Current page name
 */
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop();
    
    if (page === 'index.html' || page === '') {
        return 'home';
    } else if (page === 'create-letter.html') {
        return 'create';
    } else if (page === 'letter-records.html') {
        return 'records';
    } else if (page === 'review-letter.html') {
        return 'review';
    } else {
        return 'unknown';
    }
}

/**
 * Initialize theme based on user preference
 */
function initTheme() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        state.darkMode = true;
    }
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    state.darkMode = !state.darkMode;
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', state.darkMode ? 'dark' : 'light');
}

/**
 * Load template preview images
 */
function loadTemplatePreviewImages() {
    // Check if we're on the create letter page
    if (state.currentPage !== 'create') return;
    
    // Try to load template preview images
    const template1Preview = document.getElementById('template1-preview');
    const template2Preview = document.getElementById('template2-preview');
    
    if (template1Preview) {
        // Use a screenshot of the first template
        template1Preview.src = 'https://via.placeholder.com/300x400?text=Template+1';
        
        // In a real implementation, this would be a screenshot of the actual template
        // For example, using a service to generate a thumbnail from the Google Doc URL
    }
    
    if (template2Preview) {
        // Use a screenshot of the second template
        template2Preview.src = 'https://via.placeholder.com/300x400?text=Template+2';
    }
}

/**
 * Initialize page-specific functionality
 */
function initPageFunctionality() {
    switch (state.currentPage) {
        case 'home':
            // Home page initialization
            break;
        case 'create':
            initCreateLetterPage();
            break;
        case 'records':
            initLetterRecordsPage();
            break;
        case 'review':
            initReviewLetterPage();
            break;
    }
}

/**
 * Initialize Create Letter page
 */
async function initCreateLetterPage() {
    console.log('Initializing Create Letter page');
    
    try {
        // Get form elements
        const letterTypeSelect = document.getElementById('letter-type');
        const letterPurposeSelect = document.getElementById('letter-purpose');
        const letterStyleSelect = document.getElementById('letter-style');
        const createLetterForm = document.getElementById('create-letter-form');
        const previewSection = document.getElementById('preview-section');
        const generatedLetterOutput = document.getElementById('generated-letter-output');
        const templateRadios = document.querySelectorAll('input[name="template"]');
        const saveProceedButton = document.getElementById('save-proceed-button');
        
        // Populate dropdowns from Google Sheets
        try {
            // Show loading indicator
            showLoading(true);
            
            // Populate letter types
            const letterTypes = await window.sheets.getLetterTypes();
            letterTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                letterTypeSelect.appendChild(option);
            });
            
            // Populate letter purposes
            const letterPurposes = await window.sheets.getLetterPurposes();
            letterPurposes.forEach(purpose => {
                const option = document.createElement('option');
                option.value = purpose;
                option.textContent = purpose;
                letterPurposeSelect.appendChild(option);
            });
            
            // Populate letter styles
            const letterStyles = await window.sheets.getLetterStyles();
            letterStyles.forEach(style => {
                const option = document.createElement('option');
                option.value = style;
                option.textContent = style;
                letterStyleSelect.appendChild(option);
            });
            
            // Hide loading indicator
            showLoading(false);
        } catch (error) {
            console.error('Error populating dropdowns:', error);
            showNotification('خطأ في تحميل البيانات من قاعدة البيانات.', 'error');
            showLoading(false);
        }
        
        // Add form submit handler
        createLetterForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            // Show loading indicator
            showLoading(true);
            
            // Get form data
            const formData = {
                letterType: letterTypeSelect.value,
                letterPurpose: letterPurposeSelect.value,
                letterStyle: letterStyleSelect.value,
                isFirst: document.querySelector('input[name="is-first"]:checked').value,
                recipient: document.getElementById('recipient').value,
                letterTitle: document.getElementById('letter-title').value,
                letterContentPrompt: document.getElementById('letter-content-prompt').value
            };
            
            try {
                // Call API to generate letter
                const response = await window.api.generateLetter(formData);
                
                // Display generated letter
                if (response && response.generated_text) {
                    generatedLetterOutput.value = response.generated_text;
                    
                    // Show preview section
                    previewSection.style.display = 'block';
                    
                    // Scroll to preview section
                    previewSection.scrollIntoView({ behavior: 'smooth' });
                } else {
                    throw new Error('No generated text received from API');
                }
            } catch (error) {
                console.error('Error generating letter:', error);
                showNotification('خطأ في إنشاء الخطاب. يرجى المحاولة مرة أخرى.', 'error');
            } finally {
                // Hide loading indicator
                showLoading(false);
            }
        });
        
        // Add save and proceed handler
        saveProceedButton.addEventListener('click', async () => {
            // Get selected template
            const selectedTemplate = document.querySelector('input[name="template"]:checked');
            
            // Validate template selection
            if (!selectedTemplate) {
                showNotification('يرجى اختيار قالب قبل المتابعة.', 'warning');
                return;
            }
            
            // Show loading indicator
            showLoading(true);
            
            // Get form data
            const formData = {
                letterType: letterTypeSelect.value,
                letterPurpose: letterPurposeSelect.value,
                letterStyle: letterStyleSelect.value,
                isFirst: document.querySelector('input[name="is-first"]:checked').value,
                recipient: document.getElementById('recipient').value,
                letterTitle: document.getElementById('letter-title').value,
                letterContent: generatedLetterOutput.value,
                selectedTemplate: selectedTemplate.value
            };
            
            try {
                // Call API to archive letter
                const response = await window.api.archiveLetter(formData);
                
                // Show success message
                showNotification('تم حفظ الخطاب بنجاح.', 'success');
                
                // Redirect to home page
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } catch (error) {
                console.error('Error archiving letter:', error);
                showNotification('خطأ في حفظ الخطاب. يرجى المحاولة مرة أخرى.', 'error');
                showLoading(false);
            }
        });
    } catch (error) {
        console.error('Error initializing Create Letter page:', error);
    }
}

/**
 * Initialize Letter Records page
 */
async function initLetterRecordsPage() {
    console.log('Initializing Letter Records page');
    
    try {
        // Get elements
        const searchInput = document.getElementById('search-records');
        const letterTypeFilter = document.getElementById('filter-letter-type');
        const reviewStatusFilter = document.getElementById('filter-review-status');
        const applyFiltersButton = document.getElementById('apply-filters-button');
        const lettersTableBody = document.getElementById('letters-table-body');
        const noRecordsMessage = document.getElementById('no-records-message');
        
        // Load initial data
        await loadLetterRecords();
        
        // Add event listeners
        applyFiltersButton.addEventListener('click', async () => {
            await loadLetterRecords(
                searchInput.value,
                letterTypeFilter.value,
                reviewStatusFilter.value
            );
        });
        
        // Add search input event listener (search as you type)
        searchInput.addEventListener('input', debounce(async () => {
            await loadLetterRecords(
                searchInput.value,
                letterTypeFilter.value,
                reviewStatusFilter.value
            );
        }, 500));
        
        /**
         * Load letter records with optional filters
         */
        async function loadLetterRecords(searchQuery = '', letterType = 'all', reviewStatus = 'all') {
            try {
                // Show loading indicator
                showLoading(true);
                
                // Get letters with filters
                let letters;
                if (searchQuery) {
                    letters = await window.sheets.searchLetters(searchQuery);
                } else {
                    letters = await window.sheets.getAllLetters();
                }
                
                // Apply additional filters
                if (letterType !== 'all' || reviewStatus !== 'all') {
                    letters = await window.sheets.filterLetters(letterType, reviewStatus);
                }
                
                // Clear table
                lettersTableBody.innerHTML = '';
                
                // Check if we have letters
                if (letters.length === 0) {
                    noRecordsMessage.style.display = 'block';
                } else {
                    noRecordsMessage.style.display = 'none';
                    
                    // Populate table
                    letters.forEach(letter => {
                        const row = document.createElement('tr');
                        
                        // Create cells
                        row.innerHTML = `
                            <td>${letter.id}</td>
                            <td>${letter.date}</td>
                            <td>${letter.letterTypeArabic}</td>
                            <td><span class="status ${getStatusClass(letter.reviewStatus)}">${letter.reviewStatus}</span></td>
                            <td><span class="status ${getStatusClass(letter.sendStatus)}">${letter.sendStatus}</span></td>
                            <td>${letter.recipient}</td>
                            <td>${letter.subject}</td>
                            <td class="actions">
                                <button class="icon-button delete-button" title="حذف" data-id="${letter.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                                <button class="icon-button print-button" title="طباعة" data-id="${letter.id}">
                                    <i class="fas fa-print"></i>
                                </button>
                                <button class="icon-button download-button" title="تحميل PDF" data-id="${letter.id}">
                                    <i class="fas fa-download"></i>
                                </button>
                                <button class="icon-button review-button" title="مراجعة" data-id="${letter.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </td>
                        `;
                        
                        // Add to table
                        lettersTableBody.appendChild(row);
                    });
                    
                    // Add event listeners to action buttons
                    addActionButtonListeners();
                }
            } catch (error) {
                console.error('Error loading letter records:', error);
                showNotification('خطأ في تحميل سجلات الخطابات.', 'error');
            } finally {
                // Hide loading indicator
                showLoading(false);
            }
        }
        
        /**
         * Add event listeners to action buttons
         */
        function addActionButtonListeners() {
            // Delete buttons
            document.querySelectorAll('.delete-button').forEach(button => {
                button.addEventListener('click', async () => {
                    const id = button.getAttribute('data-id');
                    if (confirm(`هل أنت متأكد من حذف الخطاب رقم ${id}؟`)) {
                        try {
                            await window.sheets.deleteLetter(id);
                            showNotification('تم حذف الخطاب بنجاح.', 'success');
                            await loadLetterRecords(
                                searchInput.value,
                                letterTypeFilter.value,
                                reviewStatusFilter.value
                            );
                        } catch (error) {
                            console.error('Error deleting letter:', error);
                            showNotification('خطأ في حذف الخطاب.', 'error');
                        }
                    }
                });
            });
            
            // Print buttons
            document.querySelectorAll('.print-button').forEach(button => {
                button.addEventListener('click', async () => {
                    const id = button.getAttribute('data-id');
                    try {
                        // Get letter data
                        const letter = await window.sheets.getLetterById(id);
                        
                        // Generate PDF
                        const letterData = {
                            letterTitle: letter.subject,
                            recipient: letter.recipient,
                            letterContent: letter.content,
                            selectedTemplate: 'template1', // Default to template1
                            id: letter.id
                        };
                        
                        // Generate PDF and open print dialog
                        const pdfBlob = await window.api.generatePDF(letterData);
                        const pdfUrl = URL.createObjectURL(pdfBlob);
                        
                        // Open in new window and print
                        const printWindow = window.open(pdfUrl, '_blank');
                        printWindow.onload = function() {
                            printWindow.print();
                        };
                    } catch (error) {
                        console.error('Error printing letter:', error);
                        showNotification('خطأ في طباعة الخطاب.', 'error');
                    }
                });
            });
            
            // Download buttons
            document.querySelectorAll('.download-button').forEach(button => {
                button.addEventListener('click', async () => {
                    const id = button.getAttribute('data-id');
                    try {
                        // Get letter data
                        const letter = await window.sheets.getLetterById(id);
                        
                        // Generate PDF
                        const letterData = {
                            letterTitle: letter.subject,
                            recipient: letter.recipient,
                            letterContent: letter.content,
                            selectedTemplate: 'template1', // Default to template1
                            id: letter.id
                        };
                        
                        // Generate PDF and download
                        const pdfBlob = await window.api.generatePDF(letterData);
                        const pdfUrl = URL.createObjectURL(pdfBlob);
                        
                        // Create download link and click it
                        const downloadLink = document.createElement('a');
                        downloadLink.href = pdfUrl;
                        downloadLink.download = `letter-${id}.pdf`;
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                    } catch (error) {
                        console.error('Error downloading letter:', error);
                        showNotification('خطأ في تحميل الخطاب.', 'error');
                    }
                });
            });
            
            // Review buttons
            document.querySelectorAll('.review-button').forEach(button => {
                button.addEventListener('click', () => {
                    const id = button.getAttribute('data-id');
                    // Store the ID in localStorage and redirect to review page
                    localStorage.setItem('selectedLetterId', id);
                    window.location.href = 'review-letter.html';
                });
            });
        }
        
        /**
         * Get CSS class for status
         */
        function getStatusClass(status) {
            if (status === 'جاهز للإرسال' || status === 'تم الإرسال') {
                return 'status-ready';
            } else if (status === 'في الانتظار') {
                return 'status-pending';
            } else if (status === 'يحتاج إلى تحسينات' || status === 'مرفوض') {
                return 'status-needs-improvement';
            }
            return '';
        }
    } catch (error) {
        console.error('Error initializing Letter Records page:', error);
    }
}

/**
 * Initialize Review Letter page
 */
async function initReviewLetterPage() {
    console.log('Initializing Review Letter page');
    
    try {
        // Get elements
        const selectLetter = document.getElementById('select-letter');
        const loadLetterButton = document.getElementById('load-letter-button');
        const reviewFormContainer = document.getElementById('review-form-container');
        const noLetterSelected = document.getElementById('no-letter-selected');
        const reviewerName = document.getElementById('reviewer-name');
        const letterContent = document.getElementById('letter-content');
        const reviewNotes = document.getElementById('review-notes');
        const reviewCompleted = document.getElementById('review-completed');
        const needsImprovementButton = document.getElementById('needs-improvement-button');
        const readyToSendButton = document.getElementById('ready-to-send-button');
        const rejectButton = document.getElementById('reject-button');
        
        // Check if we have a selected letter ID from localStorage
        const selectedLetterId = localStorage.getItem('selectedLetterId');
        
        // Populate letter dropdown
        try {
            // Show loading indicator
            showLoading(true);
            
            const letters = await window.sheets.getAllLetters();
            letters.forEach(letter => {
                const option = document.createElement('option');
                option.value = letter.id;
                option.textContent = `${letter.id} - ${letter.recipient} - ${letter.subject}`;
                selectLetter.appendChild(option);
            });
            
            // If we have a selected letter ID, select it in the dropdown
            if (selectedLetterId) {
                selectLetter.value = selectedLetterId;
                // Load the letter
                await loadLetterForReview(selectedLetterId);
            }
            
            // Hide loading indicator
            showLoading(false);
        } catch (error) {
            console.error('Error populating letter dropdown:', error);
            showNotification('خطأ في تحميل قائمة الخطابات.', 'error');
            showLoading(false);
        }
        
        // Add event listeners
        loadLetterButton.addEventListener('click', async () => {
            const id = selectLetter.value;
            if (id) {
                await loadLetterForReview(id);
            } else {
                showNotification('يرجى اختيار خطاب للمراجعة.', 'warning');
            }
        });
        
        // Add checkbox event listener to enable/disable buttons
        reviewCompleted.addEventListener('change', () => {
            const isChecked = reviewCompleted.checked;
            needsImprovementButton.disabled = !isChecked;
            readyToSendButton.disabled = !isChecked;
            rejectButton.disabled = !isChecked;
        });
        
        // Add button event listeners
        needsImprovementButton.addEventListener('click', async () => {
            await updateReviewStatus('يحتاج إلى تحسينات');
        });
        
        readyToSendButton.addEventListener('click', async () => {
            await updateReviewStatus('جاهز للإرسال');
        });
        
        rejectButton.addEventListener('click', async () => {
            await updateReviewStatus('مرفوض');
        });
        
        /**
         * Load letter for review
         */
        async function loadLetterForReview(id) {
            try {
                // Show loading indicator
                showLoading(true);
                
                // Get letter by ID
                const letter = await window.sheets.getLetterById(id);
                
                // Update state
                state.selectedLetterId = id;
                state.letterData = letter;
                
                // Update UI
                letterContent.value = letter.content;
                reviewFormContainer.style.display = 'block';
                noLetterSelected.style.display = 'none';
                
                // Clear other fields
                reviewerName.value = '';
                reviewNotes.value = '';
                reviewCompleted.checked = false;
                
                // Disable buttons
                needsImprovementButton.disabled = true;
                readyToSendButton.disabled = true;
                rejectButton.disabled = true;
            } catch (error) {
                console.error('Error loading letter for review:', error);
                showNotification('خطأ في تحميل الخطاب للمراجعة.', 'error');
            } finally {
                // Hide loading indicator
                showLoading(false);
            }
        }
        
        /**
         * Update review status
         */
        async function updateReviewStatus(status) {
            try {
                // Validate inputs
                if (!reviewerName.value) {
                    showNotification('يرجى إدخال اسم المراجع.', 'warning');
                    return;
                }
                
                // Show loading indicator
                showLoading(true);
                
                // Update letter review status
                await window.sheets.updateLetterReviewStatus(
                    state.selectedLetterId,
                    status,
                    reviewerName.value,
                    reviewNotes.value
                );
                
                // Show success message
                showNotification(`تم تحديث حالة المراجعة إلى "${status}" بنجاح.`, 'success');
                
                // Redirect to home page
                setTimeout(() => {
                    // Clear selected letter ID from localStorage
                    localStorage.removeItem('selectedLetterId');
                    window.location.href = 'index.html';
                }, 1500);
            } catch (error) {
                console.error('Error updating review status:', error);
                showNotification('خطأ في تحديث حالة المراجعة.', 'error');
                showLoading(false);
            }
        }
    } catch (error) {
        console.error('Error initializing Review Letter page:', error);
    }
}

/**
 * Show loading indicator
 */
function showLoading(show) {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // This is a placeholder - in a real implementation, this would show a toast notification
    alert(message);
}

/**
 * Debounce function for search input
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
