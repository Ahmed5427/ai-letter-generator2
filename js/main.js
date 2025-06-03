// Global Variables
let currentLetterData = null; // Stores data for the currently generated/archived letter
let allLetterRecords = []; // Stores all records fetched for the records page
let themeManager; // Handles theme toggling

// DOM Content Loaded
document.addEventListener("DOMContentLoaded", function() {
    initializeApp();
});

// Initialize Application
function initializeApp() {
    themeManager = new ThemeManager(); // Initialize theme manager
    setupNavigation(); // Setup mobile menu and link behavior
    initializePageSpecificLogic(); // Run logic based on the current page
}

// Setup Navigation (Hamburger Menu, Links)
function setupNavigation() {
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");

    if (hamburger && navMenu) {
        hamburger.addEventListener("click", function() {
            hamburger.classList.toggle("active");
            navMenu.classList.toggle("active");
        });
    }

    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            hamburger?.classList.remove("active");
            navMenu?.classList.remove("active");
        });
    });
}

// Initialize Page-Specific Logic
function initializePageSpecificLogic() {
    const currentPage = getCurrentPage();
    console.log(`Initializing page: ${currentPage}`);

    switch(currentPage) {
        case "create-letter":
            initializeCreateLetterPage();
            break;
        case "review-letter":
            initializeReviewLetterPage();
            break;
        case "letter-records":
            initializeLetterRecordsPage();
            break;
        default:
            // Initialize home page logic if any
            console.log("Home page initialized");
    }
}

// Get Current Page Name
function getCurrentPage() {
    const path = window.location.pathname.split("/").pop();
    if (path.startsWith("create-letter")) return "create-letter";
    if (path.startsWith("review-letter")) return "review-letter";
    if (path.startsWith("letter-records")) return "letter-records";
    return "home"; // Default to home (index.html)
}

// --- Create Letter Page Logic ---
function initializeCreateLetterPage() {
    const letterForm = document.getElementById("letterForm");
    const generateBtn = document.getElementById("generateBtn");
    const saveAndProceedBtn = document.getElementById("saveAndProceedBtn");
    const previewSection = document.getElementById("previewSection");

    if (letterForm) {
        letterForm.addEventListener("submit", handleGenerateLetterSubmit);
    }

    if (saveAndProceedBtn) {
        saveAndProceedBtn.addEventListener("click", handleSaveAndProceedClick);
    }

    // Add event listeners for template buttons if they exist
    const templateButtons = document.querySelectorAll(".template-btn");
    templateButtons.forEach(btn => {
        btn.addEventListener("click", handleTemplateSelection);
    });

    loadCreateLetterDropdowns();
}

async function loadCreateLetterDropdowns() {
    try {
        const options = await window.sheets.getDropdownOptionsAPI();
        populateDropdown("letterType", options.letterTypes, "اختر نوع الخطاب");
        populateDropdown("letterPurpose", options.letterPurposes, "اختر الغرض من الخطاب");
        populateDropdown("letterStyle", options.letterStyles, "اختر الأسلوب");
    } catch (error) {
        console.error("Error loading dropdown options:", error);
        showAlert("فشل تحميل خيارات النموذج. يرجى المحاولة مرة أخرى.", "error");
        // Populate with demo data as fallback?
        const demoOptions = window.sheets.getDemoDropdownOptions();
        populateDropdown("letterType", demoOptions.letterTypes, "اختر نوع الخطاب");
        populateDropdown("letterPurpose", demoOptions.letterPurposes, "اختر الغرض من الخطاب");
        populateDropdown("letterStyle", demoOptions.letterStyles, "اختر الأسلوب");
    }
}

function populateDropdown(elementId, options, defaultText) {
    const selectElement = document.getElementById(elementId);
    if (!selectElement) return;

    selectElement.innerHTML = `<option value="">${defaultText}</option>`; // Clear existing and add default
    options.forEach(option => {
        const optionElement = document.createElement("option");
        optionElement.value = option;
        optionElement.textContent = option;
        selectElement.appendChild(optionElement);
    });
}

async function handleGenerateLetterSubmit(e) {
    e.preventDefault();
    const generateBtn = document.getElementById("generateBtn");
    const formData = getCreateLetterFormData();

    if (!validateCreateLetterForm(formData)) {
        showAlert("يرجى ملء جميع الحقول المطلوبة.", "warning");
        return;
    }

    showLoadingOverlay(true, "جاري إنشاء الخطاب...");
    generateBtn.disabled = true;
    generateBtn.innerHTML = ".<i class=\"fas fa-spinner fa-spin\"></i> جاري الإنشاء";

    try {
        // Construct payload according to knowledge `user_1`
        const apiPayload = {
            category: formData.letterType, // Assuming letterType maps to category
            sub_category: formData.letterPurpose, // Assuming letterPurpose maps to sub_category
            title: formData.subject,
            recipient: formData.recipient,
            isFirst: formData.firstCorrespondence === "true",
            prompt: formData.content,
            tone: formData.letterStyle
        };

        const response = await window.api.generateLetterAPI(apiPayload);
        const generatedLetterText = response.generatedText;

        // Store generated data
        currentLetterData = { ...formData, generatedContent: generatedLetterText };

        displayGeneratedLetter(generatedLetterText);
        showPreviewSection();
        showAlert("تم إنشاء الخطاب بنجاح. يمكنك الآن معاينته وتعديله.", "success");

    } catch (error) {
        console.error("Error generating letter:", error);
        showAlert(`فشل إنشاء الخطاب: ${error.message}`, "error");
        // Hide preview section if generation failed?
        // document.getElementById("previewSection").style.display = "none";
    } finally {
        showLoadingOverlay(false);
        generateBtn.disabled = false;
        generateBtn.innerHTML = ".<i class=\"fas fa-magic\"></i> إنشاء الخطاب";
    }
}

function getCreateLetterFormData() {
    return {
        letterType: document.getElementById("letterType")?.value || "",
        letterPurpose: document.getElementById("letterPurpose")?.value || "",
        letterStyle: document.getElementById("letterStyle")?.value || "",
        firstCorrespondence: document.querySelector("input[name=\"firstCorrespondence\"]:checked")?.value || "",
        recipient: document.getElementById("recipient")?.value.trim() || "",
        subject: document.getElementById("subject")?.value.trim() || "",
        content: document.getElementById("content")?.value.trim() || ""
    };
}

function validateCreateLetterForm(data) {
    return data.letterType && data.letterPurpose && data.letterStyle &&
           data.firstCorrespondence && data.recipient && data.subject && data.content;
}

function displayGeneratedLetter(text) {
    const textarea = document.getElementById("generatedLetter");
    if (textarea) {
        textarea.value = text;
    }
}

function showPreviewSection() {
    const previewSection = document.getElementById("previewSection");
    if (previewSection) {
        previewSection.style.display = "block";
        previewSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function handleTemplateSelection(event) {
    const selectedTemplate = event.target.dataset.template;
    const hiddenInput = document.getElementById("selectedTemplate");
    const previewArea = document.getElementById("templatePreviewArea");

    if (hiddenInput) {
        hiddenInput.value = selectedTemplate;
    }

    // Update button styles to show selection
    document.querySelectorAll(".template-btn").forEach(btn => btn.classList.remove("active"));
    event.target.classList.add("active");

    // Show preview area (content depends on how templates are handled)
    if (previewArea) {
        previewArea.style.display = "block";
        previewArea.innerHTML = `<p>تم اختيار ${event.target.textContent}. سيتم تطبيق هذا القالب عند الحفظ.</p>`;
        // In a more complex scenario, you might fetch/render a preview based on `selectedTemplate`
        // Example: previewArea.innerHTML = ".<iframe src=\"/path/to/template/preview?template=${selectedTemplate}\" width=\"100%\" height=\"300px\"></iframe>";
    }

    console.log(`Template selected: ${selectedTemplate}`);
}

async function handleSaveAndProceedClick() {
    const saveBtn = document.getElementById("saveAndProceedBtn");
    const editedLetterContent = document.getElementById("generatedLetter")?.value.trim();
    const selectedTemplate = document.getElementById("selectedTemplate")?.value;

    if (!editedLetterContent) {
        showAlert("لا يوجد محتوى في معاينة الخطاب للحفظ.", "warning");
        return;
    }
    if (!selectedTemplate) {
        showAlert("يرجى اختيار قالب قبل المتابعة.", "warning");
        return;
    }

    showLoadingOverlay(true, "جاري حفظ الخطاب...");
    saveBtn.disabled = true;
    saveBtn.innerHTML = ".<i class=\"fas fa-spinner fa-spin\"></i> جاري الحفظ";

    try {
        // 1. Call Archive API
        const archivePayload = {
            letter_content: editedLetterContent,
            template_choice: selectedTemplate // Send the chosen template name
            // Include other necessary data if the API requires it (e.g., original form data)
            // ...currentLetterData // Spread original form data if needed by API
        };
        const archiveResponse = await window.api.archiveLetterAPI(archivePayload);
        console.log("Archive API response:", archiveResponse);
        // Assuming archive API returns success and potentially a PDF URL or confirms saving
        const pdfUrl = archiveResponse.data?.pdf_url || ""; // Adjust based on actual API response

        // 2. Save to Google Sheets
        const sheetData = {
            ...currentLetterData, // Original form data + generated content
            generatedContent: editedLetterContent, // Use the potentially edited content
            selectedTemplate: selectedTemplate,
            pdfUrl: pdfUrl // Include PDF URL from archive response if available
            // letterId will be generated by saveToGoogleSheets if not provided
        };
        const saveResult = await window.sheets.saveToGoogleSheets(sheetData);
        console.log("Save to Sheets result:", saveResult);

        showAlert("تم حفظ الخطاب بنجاح!", "success");

        // 3. Redirect to Home Page
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);

    } catch (error) {
        console.error("Error saving and proceeding:", error);
        showAlert(`فشل حفظ الخطاب: ${error.message}`, "error");
    } finally {
        showLoadingOverlay(false);
        saveBtn.disabled = false;
        saveBtn.innerHTML = ".<i class=\"fas fa-save\"></i> حفظ ومتابعة";
    }
}

// --- Review Letter Page Logic ---
function initializeReviewLetterPage() {
    const letterId = new URLSearchParams(window.location.search).get("id");
    const reviewCompletedCheckbox = document.getElementById("reviewCompleted");
    const needsImprovementBtn = document.getElementById("needsImprovementBtn");
    const readyToSendBtn = document.getElementById("readyToSendBtn");
    const rejectBtn = document.getElementById("rejectBtn");

    if (!letterId) {
        showAlert("لم يتم تحديد خطاب للمراجعة. جارٍ إعادة التوجيه...", "error");
        setTimeout(() => { window.location.href = "letter-records.html"; }, 2000);
        return;
    }

    // Store letter ID globally for this page
    document.body.dataset.letterId = letterId;

    // Load letter content
    loadLetterForReview(letterId);

    // Enable/disable buttons based on checkbox
    if (reviewCompletedCheckbox) {
        reviewCompletedCheckbox.addEventListener("change", () => {
            const isChecked = reviewCompletedCheckbox.checked;
            needsImprovementBtn.disabled = !isChecked;
            readyToSendBtn.disabled = !isChecked;
            rejectBtn.disabled = !isChecked;
        });
        // Initial state
        needsImprovementBtn.disabled = !reviewCompletedCheckbox.checked;
        readyToSendBtn.disabled = !reviewCompletedCheckbox.checked;
        rejectBtn.disabled = !reviewCompletedCheckbox.checked;
    }

    // Add event listeners to buttons
    needsImprovementBtn?.addEventListener("click", () => handleReviewAction("يحتاج إلى تحسينات"));
    readyToSendBtn?.addEventListener("click", () => handleReviewAction("جاهز للإرسال"));
    rejectBtn?.addEventListener("click", () => handleReviewAction("مرفوض"));
}

async function loadLetterForReview(letterId) {
    showLoadingOverlay(true, "جاري تحميل الخطاب...");
    try {
        // Fetch all records (or implement getById if available)
        const records = await window.sheets.getLetterRecordsAPI();
        const letterRecord = records.find(r => r.id === letterId);

        if (letterRecord) {
            document.getElementById("letterToReview").value = letterRecord.content || "";
            // Pre-fill reviewer name/notes if they exist?
            // document.getElementById("reviewerName").value = letterRecord.reviewer || "";
            // document.getElementById("reviewNotes").value = letterRecord.notes || "";
        } else {
            showAlert("لم يتم العثور على الخطاب المحدد.", "error");
            document.getElementById("letterToReview").value = "خطأ: لم يتم العثور على الخطاب.";
            // Disable form elements?
        }
    } catch (error) {
        console.error("Error loading letter for review:", error);
        showAlert("فشل تحميل الخطاب للمراجعة.", "error");
        document.getElementById("letterToReview").value = "خطأ في تحميل المحتوى.";
    } finally {
        showLoadingOverlay(false);
    }
}

async function handleReviewAction(status) {
    const letterId = document.body.dataset.letterId;
    const reviewerName = document.getElementById("reviewerName")?.value.trim();
    const notes = document.getElementById("reviewNotes")?.value.trim();
    const updatedContent = document.getElementById("letterToReview")?.value.trim(); // Get potentially edited content

    if (!reviewerName) {
        showAlert("يرجى إدخال اسم المراجع.", "warning");
        return;
    }
    if (status === "يحتاج إلى تحسينات" && !notes) {
        showAlert("يرجى إضافة ملاحظات عند اختيار \"يحتاج إلى تحسينات\".", "warning");
        return;
    }
    if (status === "مرفوض" && !notes) {
        showAlert("يرجى إضافة سبب الرفض في الملاحظات.", "warning");
        // return; // Allow rejection without notes if needed
    }

    showLoadingOverlay(true, "جاري تحديث الحالة...");
    const actionButtons = ["needsImprovementBtn", "readyToSendBtn", "rejectBtn"];
    actionButtons.forEach(id => { document.getElementById(id).disabled = true; });

    try {
        await window.sheets.updateReviewStatusAPI(letterId, status, reviewerName, notes, updatedContent);

        if (status === "مرفوض") {
            showAlert("تم تحديث حالة الخطاب إلى \"مرفوض\". سيتم نقله إلى سلة المهملات (إذا تم تنفيذها).", "success");
            // Add logic here for moving to trash (e.g., calling another API or sheet function)
            // This might involve setting a flag, moving the row, etc.
            console.log(`TODO: Implement move to trash for letter ${letterId}`);
        } else {
            showAlert(`تم تحديث حالة الخطاب إلى \"${status}\" بنجاح.`, "success");
        }

        // Redirect to home page
        setTimeout(() => {
            window.location.href = "index.html";
        }, 2000);

    } catch (error) {
        console.error("Error updating review status:", error);
        showAlert(`فشل تحديث حالة المراجعة: ${error.message}`, "error");
        actionButtons.forEach(id => { document.getElementById(id).disabled = false; }); // Re-enable buttons on error
        showLoadingOverlay(false);
    }
    // No finally for loading/buttons here, as redirect happens on success
}

// --- Letter Records Page Logic ---
function initializeLetterRecordsPage() {
    // Setup Filters
    document.getElementById("searchInput")?.addEventListener("input", debounce(applyFilters, 300));
    document.getElementById("letterTypeFilter")?.addEventListener("change", applyFilters);
    document.getElementById("reviewStatusFilter")?.addEventListener("change", applyFilters);

    // Load initial data
    loadAndDisplayRecords();

    // Populate filter dropdowns (can be hardcoded or fetched)
    populateFilterDropdowns();
}

async function loadAndDisplayRecords() {
    const tableBody = document.getElementById("recordsTableBody");
    const loadingIndicator = document.getElementById("loadingRecords");
    const noRecordsMessage = document.getElementById("noRecords");

    if (loadingIndicator) loadingIndicator.style.display = "block";
    if (noRecordsMessage) noRecordsMessage.style.display = "none";
    if (tableBody) tableBody.innerHTML = ""; // Clear previous records

    try {
        allLetterRecords = await window.sheets.getLetterRecordsAPI(); // Fetch and store globally
        applyFilters(); // Display records based on current filters (initially none)
    } catch (error) {
        console.error("Error loading letter records:", error);
        showAlert("فشل تحميل سجل الخطابات.", "error");
        if (noRecordsMessage) noRecordsMessage.style.display = "block";
    } finally {
        if (loadingIndicator) loadingIndicator.style.display = "none";
    }
}

function populateFilterDropdowns() {
    // Populate "نوع الخطاب" Filter (using translations)
    const letterTypeFilter = document.getElementById("letterTypeFilter");
    if (letterTypeFilter) {
        const types = { "New": "جديد", "Reply": "رد", "Follow Up": "متابعة", "Co-op": "تعاون" };
        letterTypeFilter.innerHTML = ".<option value=\"\">الكل</option>";
        Object.entries(types).forEach(([_, arabic]) => {
            letterTypeFilter.innerHTML += `<option value="${arabic}">${arabic}</option>`;
        });
    }

    // Populate "المراجعة" Filter (hardcoded based on requirements)
    const reviewStatusFilter = document.getElementById("reviewStatusFilter");
    if (reviewStatusFilter) {
        const statuses = ["في الانتظار", "جاهز للإرسال", "يحتاج إلى تحسينات", "مرفوض"]; // Add more if needed
        reviewStatusFilter.innerHTML = ".<option value=\"\">الكل</option>";
        statuses.forEach(status => {
            reviewStatusFilter.innerHTML += `<option value="${status}">${status}</option>`;
        });
    }
}

function applyFilters() {
    const searchInput = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const letterTypeFilter = document.getElementById("letterTypeFilter")?.value || "";
    const reviewStatusFilter = document.getElementById("reviewStatusFilter")?.value || "";

    const filteredRecords = allLetterRecords.filter(record => {
        const searchMatch = !searchInput ||
                            (record.recipient && record.recipient.toLowerCase().includes(searchInput)) ||
                            (record.id && record.id.toLowerCase().includes(searchInput));
        const typeMatch = !letterTypeFilter || record.type === letterTypeFilter;
        const reviewStatusMatch = !reviewStatusFilter || record.reviewStatus === reviewStatusFilter;

        return searchMatch && typeMatch && reviewStatusMatch;
    });

    displayRecordsInTable(filteredRecords);
}

function displayRecordsInTable(records) {
    const tableBody = document.getElementById("recordsTableBody");
    const noRecordsMessage = document.getElementById("noRecords");

    if (!tableBody) return;
    tableBody.innerHTML = ""; // Clear existing rows

    if (records.length === 0) {
        if (noRecordsMessage) noRecordsMessage.style.display = "block";
        return;
    }

    if (noRecordsMessage) noRecordsMessage.style.display = "none";

    records.forEach(record => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${record.id || "-"}</td>
            <td>${record.date ? new Date(record.date).toLocaleDateString("ar-SA") : "-"}</td>
            <td>${record.type || "-"}</td>
            <td>${createStatusBadge(record.reviewStatus, getReviewStatusColor)}</td>
            <td>${createStatusBadge(record.sendStatus, getSendStatusColor)}</td>
            <td>${record.recipient || "-"}</td>
            <td>${record.subject || "-"}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn delete" onclick="handleDeleteRecord(\'${record.id}\')" title="حذف">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    <button class="action-btn print" onclick="handlePrintRecord(\'${record.id}\')" title="طباعة">
                        <i class="fas fa-print"></i>
                    </button>
                    <button class="action-btn download" onclick="handleDownloadRecord(\'${record.id}\', \'${record.pdfUrl || ''}\')" title="تحميل PDF" ${!record.pdfUrl ? 'disabled' : ''}>
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="action-btn review" onclick="handleReviewRecord(\'${record.id}\')" title="مراجعة">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function createStatusBadge(status, colorFunc) {
    if (!status) return "-";
    const color = colorFunc(status);
    return `<span class="status-badge" style="background-color: ${color};">${status}</span>`;
}

function getReviewStatusColor(status) {
    switch (status) {
        case "جاهز للإرسال": return "var(--color-success)"; // Green
        case "في الانتظار": return "var(--color-warning)"; // Orange
        case "يحتاج إلى تحسينات": return "var(--color-danger)"; // Red
        case "مرفوض": return "var(--color-danger)"; // Red
        default: return "var(--color-secondary)"; // Grey
    }
}

function getSendStatusColor(status) {
    switch (status) {
        case "تم الإرسال": return "var(--color-success)"; // Green
        case "في الانتظار": return "var(--color-warning)"; // Orange
        // Add other send statuses if needed
        default: return "var(--color-secondary)"; // Grey
    }
}

// --- Record Actions ---
async function handleDeleteRecord(recordId) {
    if (!confirm(`هل أنت متأكد من حذف الخطاب رقم ${recordId}؟ لا يمكن التراجع عن هذا الإجراء.`)) {
        return;
    }

    showLoadingOverlay(true, "جاري الحذف...");
    try {
        await window.sheets.deleteRecordAPI(recordId);
        showAlert("تم حذف الخطاب بنجاح.", "success");
        // Remove the record from the global list and re-render
        allLetterRecords = allLetterRecords.filter(r => r.id !== recordId);
        applyFilters(); // Re-apply filters to update the table
    } catch (error) {
        console.error("Error deleting record:", error);
        showAlert(`فشل حذف الخطاب: ${error.message}`, "error");
    } finally {
        showLoadingOverlay(false);
    }
}

function handlePrintRecord(recordId) {
    // Find the record content
    const record = allLetterRecords.find(r => r.id === recordId);
    if (!record || !record.content) {
        showAlert("لا يمكن طباعة الخطاب: المحتوى غير موجود.", "error");
        return;
    }

    // Create a hidden iframe and print its content
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    // Basic HTML structure for printing - might need CSS for proper formatting
    doc.write(`
        <html>
        <head>
            <title>طباعة خطاب ${recordId}</title>
            <style>
                body { font-family: 'Cairo', sans-serif; direction: rtl; }
                pre { white-space: pre-wrap; word-wrap: break-word; }
            </style>
        </head>
        <body>
            <pre>${record.content}</pre>
        </body>
        </html>
    `);
    doc.close();

    // Wait for content to load before printing
    iframe.onload = function() {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        // Remove the iframe after printing (optional delay)
        setTimeout(() => { document.body.removeChild(iframe); }, 1000);
    };
}

function handleDownloadRecord(recordId, pdfUrl) {
    if (pdfUrl) {
        // Option 1: Direct link (if URL is publicly accessible)
        // window.open(pdfUrl, '_blank');

        // Option 2: Force download with a specific name (requires server support or data URI)
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `letter_${recordId}.pdf`; // Suggest a filename
        link.target = '_blank'; // Open in new tab might be better for some browsers
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showAlert("بدء تحميل ملف PDF...", "info");
    } else {
        showAlert("لا يوجد ملف PDF متاح للتحميل لهذا الخطاب.", "warning");
        // Optionally, trigger PDF generation on demand if an API exists
    }
}

function handleReviewRecord(recordId) {
    window.location.href = `review-letter.html?id=${recordId}`;
}

// --- Utility Functions ---

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show/Hide Loading Overlay
function showLoadingOverlay(show, message = "جاري التحميل...") {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) {
        overlay.querySelector("p").textContent = message;
        overlay.style.display = show ? "flex" : "none";
    }
}

// Show Alert Message
function showAlert(message, type = "info") {
    // Use a more sophisticated alert/notification library in production
    console.log(`ALERT (${type}): ${message}`);
    // Simple alert for now:
    alert(`[${type.toUpperCase()}] ${message}`);
}

// Theme Manager Class
class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = document.getElementById('themeIcon');
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.initTheme();
        this.addEventListeners();
    }

    initTheme() {
        document.body.classList.toggle('dark-mode', this.currentTheme === 'dark');
        this.updateIcon();
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        document.body.classList.toggle('dark-mode');
        this.updateIcon();
    }

    updateIcon() {
        if (this.themeIcon) {
            this.themeIcon.className = this.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    addEventListeners() {
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }
}

// Make action handlers globally accessible (since they are called via onclick)
window.handleDeleteRecord = handleDeleteRecord;
window.handlePrintRecord = handlePrintRecord;
window.handleDownloadRecord = handleDownloadRecord;
window.handleReviewRecord = handleReviewRecord;

