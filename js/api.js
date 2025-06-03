// API Integration for Letter Generation and Archiving
class LetterAPI {
    constructor() {
        this.baseUrl = 'http://128.140.37.194:5000';
    }

    async generateLetter(letterData) {
        try {
            Utils.showLoading();
            
            const payload = {
                category: letterData.letterType,
                sub_category: letterData.letterPurpose,
                title: letterData.letterTitle,
                recipient: letterData.recipient,
                isFirst: letterData.isFirst === 'true',
                prompt: letterData.letterContent,
                tone: letterData.letterStyle
            };

            const response = await fetch(`${this.baseUrl}/generate-letter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error generating letter:', error);
            throw error;
        } finally {
            Utils.hideLoading();
        }
    }

    async archiveLetter(letterData) {
        try {
            Utils.showLoading();

            const formData = new FormData();
            formData.append('letter_content', letterData.content);
            formData.append('letter_type', letterData.type);
            formData.append('recipient', letterData.recipient);
            formData.append('title', letterData.title);
            formData.append('is_first', letterData.isFirst);
            formData.append('ID', letterData.id || Utils.generateId());

            // If there's a file/template, add it
            if (letterData.file) {
                formData.append('file', letterData.file);
            }

            const response = await fetch(`${this.baseUrl}/archive-letter`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error archiving letter:', error);
            throw error;
        } finally {
            Utils.hideLoading();
        }
    }
}

// Letter Creation Page Logic
if (window.location.pathname.includes('create-letter.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        const letterAPI = new LetterAPI();
        let generatedLetterData = null;
        let selectedTemplate = null;

        // Load settings and populate dropdowns
        try {
            const settings = await window.sheetsAPI.getSettings();
            
            populateDropdown('letterType', settings.letterTypes || []);
            populateDropdown('letterPurpose', settings.letterPurposes || []);
            populateDropdown('letterStyle', settings.letterStyles || []);
        } catch (error) {
            console.error('Error loading settings:', error);
            Utils.showNotification('خطأ في تحميل الإعدادات', 'error');
        }

        function populateDropdown(selectId, options) {
            const select = document.getElementById(selectId);
            if (select) {
                // Clear existing options except the first one
                while (select.children.length > 1) {
                    select.removeChild(select.lastChild);
                }
                
                options.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option;
                    optionElement.textContent = option;
                    select.appendChild(optionElement);
                });
            }
        }

        // Handle form submission
        const letterForm = document.getElementById('letterForm');
        if (letterForm) {
            letterForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(letterForm);
                const letterData = {};
                
                for (let [key, value] of formData.entries()) {
                    letterData[key] = value;
                }

                try {
                    const result = await letterAPI.generateLetter(letterData);
                    
                    if (result.generated_letter) {
                        document.getElementById('generatedLetter').value = result.generated_letter;
                        document.getElementById('previewSection').style.display = 'block';
                        document.getElementById('previewSection').scrollIntoView({ behavior: 'smooth' });
                        
                        generatedLetterData = {
                            ...letterData,
                            generatedContent: result.generated_letter
                        };
                        
                        Utils.showNotification('تم إنشاء الخطاب بنجاح', 'success');
                    }
                } catch (error) {
                    Utils.showNotification('خطأ في إنشاء الخطاب', 'error');
                }
            });
        }

        // Handle template selection
        const templateCards = document.querySelectorAll('.template-card');
        templateCards.forEach(card => {
            card.addEventListener('click', () => {
                templateCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedTemplate = card.dataset.template;
            });
        });

        // Handle save and proceed
        const saveAndProceedBtn = document.getElementById('saveAndProceed');
        if (saveAndProceedBtn) {
            saveAndProceedBtn.addEventListener('click', async () => {
                if (!selectedTemplate) {
                    Utils.showNotification('يرجى اختيار قالب للخطاب', 'error');
                    return;
                }

                if (!generatedLetterData) {
                    Utils.showNotification('لا يوجد خطاب لحفظه', 'error');
                    return;
                }

                try {
                    const letterContent = document.getElementById('generatedLetter').value;
                    
                    const archiveData = {
                        content: letterContent,
                        type: generatedLetterData.letterType,
                        recipient: generatedLetterData.recipient,
                        title: generatedLetterData.letterTitle,
                        isFirst: generatedLetterData.isFirst,
                        id: Utils.generateId()
                    };

                    await letterAPI.archiveLetter(archiveData);
                    Utils.showNotification('تم حفظ الخطاب بنجاح', 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                } catch (error) {
                    Utils.showNotification('خطأ في حفظ الخطاب', 'error');
                }
            });
        }

        // Handle back to form
        const backToFormBtn = document.getElementById('backToForm');
        if (backToFormBtn) {
            backToFormBtn.addEventListener('click', () => {
                document.getElementById('previewSection').style.display = 'none';
                letterForm.scrollIntoView({ behavior: 'smooth' });
            });
        }
    });
}

// Review Letter Page Logic
if (window.location.pathname.includes('review-letter.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        let selectedLetter = null;

        // Load letters for selection
        try {
            const submissions = await window.sheetsAPI.getSubmissions();
            const selectLetter = document.getElementById('selectLetter');
            
            if (selectLetter) {
                submissions.forEach(submission => {
                    const option = document.createElement('option');
                    option.value = submission.id;
                    option.textContent = `${submission.id} - ${submission.subject}`;
                    option.dataset.content = submission.content;
                    selectLetter.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading letters:', error);
            Utils.showNotification('خطأ في تحميل الخطابات', 'error');
        }

        // Handle letter loading
        const loadLetterBtn = document.getElementById('loadLetterBtn');
        if (loadLetterBtn) {
            loadLetterBtn.addEventListener('click', () => {
                const selectLetter = document.getElementById('selectLetter');
                const selectedOption = selectLetter.options[selectLetter.selectedIndex];
                
                if (selectedOption.value) {
                    selectedLetter = selectedOption.value;
                    document.getElementById('letterToReview').value = selectedOption.dataset.content || '';
                    document.getElementById('reviewSection').style.display = 'block';
                    document.getElementById('reviewSection').scrollIntoView({ behavior: 'smooth' });
                } else {
                    Utils.showNotification('يرجى اختيار خطاب للمراجعة', 'error');
                }
            });
        }

        // Handle review checkbox
        const reviewCompleted = document.getElementById('reviewCompleted');
        const actionButtons = ['needsImprovementBtn', 'readyToSendBtn', 'rejectedBtn'];
        
        if (reviewCompleted) {
            reviewCompleted.addEventListener('change', () => {
                const isChecked = reviewCompleted.checked;
                actionButtons.forEach(btnId => {
                    const btn = document.getElementById(btnId);
                    if (btn) {
                        btn.disabled = !isChecked;
                    }
                });
            });
        }

        // Handle review actions
        actionButtons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', async () => {
                    if (!selectedLetter) {
                        Utils.showNotification('لا يوجد خطاب محدد', 'error');
                        return;
                    }

                    const reviewerName = document.getElementById('reviewerName').value;
                    const notes = document.getElementById('reviewNotes').value;
                    
                    if (!reviewerName.trim()) {
                        Utils.showNotification('يرجى إدخال اسم المراجع', 'error');
                        return;
                    }

                    let status = '';
                    switch (btnId) {
                        case 'needsImprovementBtn':
                            status = 'يحتاج إلى تحسينات';
                            break;
                        case 'readyToSendBtn':
                            status = 'جاهز للإرسال';
                            break;
                        case 'rejectedBtn':
                            status = 'مرفوض';
                            break;
                    }

                    try {
                        await window.sheetsAPI.updateSubmissionReview(selectedLetter, status, notes, reviewerName);
                        Utils.showNotification(`تم تحديث حالة المراجعة إلى: ${status}`, 'success');
                        
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 2000);
                    } catch (error) {
                        Utils.showNotification('خطأ في تحديث حالة المراجعة', 'error');
                    }
                });
            }
        });
    });
}

// Letter Records Page Logic
if (window.location.pathname.includes('letter-records.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        let allSubmissions = [];
        let filteredSubmissions = [];

        // Load data
        try {
            allSubmissions = await window.sheetsAPI.getSubmissions();
            filteredSubmissions = [...allSubmissions];
            
            // Load review options for filter
            const reviewOptions = await window.sheetsAPI.getReviewOptions();
            const reviewFilter = document.getElementById('reviewFilter');
            if (reviewFilter) {
                reviewOptions.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option;
                    optionElement.textContent = option;
                    reviewFilter.appendChild(optionElement);
                });
            }
            
            renderTable();
        } catch (error) {
            console.error('Error loading records:', error);
            Utils.showNotification('خطأ في تحميل السجلات', 'error');
        }

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', filterRecords);
        }

        // Filter functionality
        const typeFilter = document.getElementById('typeFilter');
        const reviewFilter = document.getElementById('reviewFilter');
        
        if (typeFilter) typeFilter.addEventListener('change', filterRecords);
        if (reviewFilter) reviewFilter.addEventListener('change', filterRecords);

        function filterRecords() {
            const searchTerm = searchInput.value.toLowerCase();
            const typeFilter = document.getElementById('typeFilter').value;
            const reviewFilter = document.getElementById('reviewFilter').value;

            filteredSubmissions = allSubmissions.filter(submission => {
                const matchesSearch = !searchTerm || 
                    submission.id.toLowerCase().includes(searchTerm) ||
                    submission.recipient.toLowerCase().includes(searchTerm);
                
                const matchesType = !typeFilter || 
                    window.sheetsAPI.translateLetterType(submission.type) === typeFilter;
                
                const matchesReview = !reviewFilter || 
                    submission.review === reviewFilter;

                return matchesSearch && matchesType && matchesReview;
            });

            renderTable();
        }

        function renderTable() {
            const tableBody = document.getElementById('recordsTableBody');
            const noRecords = document.getElementById('noRecords');
            
            if (!tableBody) return;

            tableBody.innerHTML = '';

            if (filteredSubmissions.length === 0) {
                if (noRecords) noRecords.style.display = 'block';
                return;
            }

            if (noRecords) noRecords.style.display = 'none';

            filteredSubmissions.forEach(submission => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${submission.id}</td>
                    <td>${Utils.formatDate(submission.date)}</td>
                    <td>${window.sheetsAPI.translateLetterType(submission.type)}</td>
                    <td><span class="status-badge ${getStatusClass(submission.review)}">${submission.review}</span></td>
                    <td><span class="status-badge ${getStatusClass(submission.sending)}">${submission.sending}</span></td>
                    <td>${submission.recipient}</td>
                    <td>${submission.subject}</td>
                    <td>
                        <div class="actions-cell">
                            <button class="action-btn review" onclick="reviewLetter('${submission.id}')" title="مراجعة">
                                <i class="fas fa-search"></i>
                            </button>
                            <button class="action-btn print" onclick="printLetter('${submission.id}')" title="طباعة">
                                <i class="fas fa-print"></i>
                            </button>
                            <button class="action-btn download" onclick="downloadLetter('${submission.id}')" title="تحميل">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="action-btn delete" onclick="deleteLetter('${submission.id}')" title="حذف">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }

        function getStatusClass(status) {
            switch (status) {
                case 'جاهز للإرسال':
                case 'تم الإرسال':
                    return 'status-ready';
                case 'في الانتظار':
                    return 'status-pending';
                case 'يحتاج إلى تحسينات':
                case 'مرفوض':
                    return 'status-needs-improvement';
                default:
                    return 'status-pending';
            }
        }

        // Global functions for actions
        window.reviewLetter = (id) => {
            window.location.href = `review-letter.html?id=${id}`;
        };

        window.printLetter = (id) => {
            const submission = allSubmissions.find(s => s.id === id);
            if (submission) {
                Utils.printContent(submission.content);
            }
        };

        window.downloadLetter = (id) => {
            const submission = allSubmissions.find(s => s.id === id);
            if (submission) {
                Utils.downloadPDF(submission.content, `letter_${id}`);
            }
        };

        window.deleteLetter = (id) => {
            if (confirm('هل أنت متأكد من حذف هذا الخطاب؟')) {
                // In a real implementation, this would call an API to delete
                allSubmissions = allSubmissions.filter(s => s.id !== id);
                filterRecords();
                Utils.showNotification('تم حذف الخطاب', 'success');
            }
        };
    });
}

// Create global instance
window.letterAPI = new LetterAPI();