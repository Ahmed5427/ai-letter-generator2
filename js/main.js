// main.js - Main application logic, event listeners, and UI updates

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded and parsed");

    // Global elements
    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
    const loadingOverlay = document.getElementById("loadingOverlay");
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");

    // --- Global Functionality ---

    // Theme Toggler
    if (themeToggle && themeIcon) {
        // Check for saved theme preference
        const currentTheme = localStorage.getItem("theme") || "light";
        document.body.classList.toggle("dark-mode", currentTheme === "dark");
        themeIcon.classList.toggle("fa-sun", currentTheme === "dark");
        themeIcon.classList.toggle("fa-moon", currentTheme === "light");

        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            const isDarkMode = document.body.classList.contains("dark-mode");
            themeIcon.classList.toggle("fa-sun", isDarkMode);
            themeIcon.classList.toggle("fa-moon", !isDarkMode);
            localStorage.setItem("theme", isDarkMode ? "dark" : "light");
            console.log(`Theme changed to: ${isDarkMode ? "dark" : "light"}`);
        });
    }

    // Hamburger Menu
    if (hamburger && navMenu) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navMenu.classList.toggle("active");
            console.log("Hamburger menu toggled");
        });
    }

    // Loading Overlay Control
    const showLoading = (message = "جاري التحميل...") => {
        if (loadingOverlay) {
            const p = loadingOverlay.querySelector("p");
            if (p) p.textContent = message;
            loadingOverlay.style.display = "flex";
            console.log(`Showing loading: ${message}`);
        }
    };
    const hideLoading = () => {
        if (loadingOverlay) {
            loadingOverlay.style.display = "none";
            console.log("Hiding loading");
        }
    };

    // --- Page Specific Logic ---
    const page = document.body.id; // Assuming body ID identifies the page (e.g., <body id="createLetterPage">)
    // Or use window.location.pathname
    const path = window.location.pathname.split("/").pop();
    console.log(`Current page path: ${path}`);

    // --- Create Letter Page Logic (create-letter.html) ---
    if (path === "create-letter.html") {
        console.log("Initializing Create Letter Page");
        const letterForm = document.getElementById("letterForm");
        const letterTypeSelect = document.getElementById("letterType");
        const letterCategorySelect = document.getElementById("letterCategory"); // Added based on HTML
        const letterPurposeSelect = document.getElementById("letterPurpose");
        const toneSelect = document.getElementById("template"); // Maps to الأسلوب in requirements
        const recipientInput = document.getElementById("recipient");
        const subjectInput = document.getElementById("subject");
        const contentInput = document.getElementById("content");
        const firstCorrespondenceRadios = document.querySelectorAll("input[name=\"firstCorrespondence\"]");
        const generateBtn = document.getElementById("generateBtn");
        const previewSection = document.getElementById("previewSection");
        const generatedLetterTextarea = document.getElementById("generatedLetter");
        const saveAndProceedBtn = document.getElementById("saveAndProceedBtn");
        // const exportBtn = document.getElementById("exportBtn"); // PDF export button

        let generatedLetterId = null; // To store the ID from the generate API response

        // Populate dropdowns
        const populateDropdowns = async () => {
            showLoading("جاري تحميل الخيارات...");
            try {
                const options = await getDropdownOptions();

                // Populate Letter Type (Requirement: Col B, HTML has static options)
                // Assuming we should use Sheet data if available
                if (letterTypeSelect && options.letterTypes.length > 0) {
                    letterTypeSelect.innerHTML = 
                        `<option value="">اختر نوع الخطاب</option>` +
                        options.letterTypes.map(opt => `<option value="${opt}">${opt}</option>`).join("");
                    console.log("Populated Letter Types");
                } else {
                    console.warn("Letter Type select not found or no options from sheet. Using static HTML options.");
                }

                // Populate Letter Purpose (Requirement: Col C)
                if (letterPurposeSelect && options.purposes.length > 0) {
                    letterPurposeSelect.innerHTML = 
                        `<option value="">اختر الغرض من الخطاب</option>` +
                        options.purposes.map(opt => `<option value="${opt}">${opt}</option>`).join("");
                    console.log("Populated Letter Purposes");
                } else {
                    console.warn("Letter Purpose select not found or no options from sheet.");
                }

                // Populate Tone/Template (Requirement: Col G - الأسلوب)
                if (toneSelect && options.tones.length > 0) {
                    toneSelect.innerHTML = 
                        `<option value="">اختر قالب</option>` +
                        options.tones.map(opt => `<option value="${opt}">${opt}</option>`).join("");
                    console.log("Populated Tones/Templates");
                } else {
                    console.warn("Tone/Template select not found or no options from sheet.");
                }

                // Populate Letter Category (Not in requirements sheet cols, using static HTML)
                if (letterCategorySelect) {
                     console.log("Using static options for Letter Category");
                }

            } catch (error) {
                console.error("Failed to populate dropdowns:", error);
                alert("حدث خطأ أثناء تحميل خيارات النماذج. يرجى المحاولة مرة أخرى.");
            } finally {
                hideLoading();
            }
        };

        populateDropdowns();

        // Handle Generate Letter Form Submission
        if (letterForm && generateBtn) {
            letterForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                console.log("Generate Letter form submitted");
                showLoading("جاري إنشاء الخطاب...");

                try {
                    const isFirst = document.querySelector("input[name=\"firstCorrespondence\"]:checked").value === "نعم";
                    const payload = {
                        category: letterCategorySelect.value, // From HTML
                        sub_category: letterPurposeSelect.value, // Maps to الغرض
                        title: subjectInput.value,
                        recipient: recipientInput.value,
                        isFirst: isFirst,
                        prompt: contentInput.value,
                        tone: toneSelect.value // Maps to الأسلوب/Template
                    };

                    // Validate required fields
                    if (!payload.category || !payload.sub_category || !payload.title || !payload.recipient || !payload.prompt || !payload.tone || document.querySelector("input[name=\"firstCorrespondence\"]:checked") === null) {
                        alert("يرجى ملء جميع الحقول المطلوبة (*).");
                        hideLoading();
                        return;
                    }

                    const result = await generateLetter(payload);

                    // Assuming result contains { generated_text: "...", letter_id: "..." }
                    if (result && result.generated_text) {
                        generatedLetterTextarea.value = result.generated_text;
                        generatedLetterId = result.letter_id || null; // Store the ID
                        previewSection.style.display = "block";
                        generatedLetterTextarea.focus(); // Focus on the generated text
                        console.log("Letter generated successfully. ID:", generatedLetterId);
                        alert("تم إنشاء الخطاب بنجاح!");
                    } else {
                        console.error("Generate API did not return expected format.", result);
                        alert("حدث خطأ غير متوقع أثناء إنشاء الخطاب. الاستجابة غير صحيحة.");
                    }
                } catch (error) {
                    console.error("Error generating letter:", error);
                    alert(`فشل إنشاء الخطاب: ${error.message}`);
                } finally {
                    hideLoading();
                }
            });
        }

        // Handle Save and Proceed
        if (saveAndProceedBtn) {
            saveAndProceedBtn.addEventListener("click", async () => {
                console.log("Save and Proceed clicked");
                const editedContent = generatedLetterTextarea.value;
                const selectedTemplate = toneSelect.value; // Or another template selector if needed

                if (!editedContent) {
                    alert("لا يوجد محتوى للحفظ. يرجى إنشاء خطاب أولاً.");
                    return;
                }
                if (!generatedLetterId) {
                    alert("لم يتم العثور على الرقم المرجعي للخطاب. يرجى إعادة الإنشاء.");
                    console.warn("Cannot archive without a letter ID from generate step.");
                    return;
                }

                showLoading("جاري الحفظ والأرشفة...");

                try {
                    // Construct FormData based on the requirements image
                    const formData = new FormData();
                    // formData.append("file", ???); // How to get the PDF/DOCX? Requires server-side generation or library
                    formData.append("letter_content", editedContent);
                    formData.append("letter_type", letterTypeSelect.value); // Assuming 'New'/'Reply' etc.
                    formData.append("recipient", recipientInput.value);
                    formData.append("title", subjectInput.value);
                    const isFirstValue = document.querySelector("input[name=\"firstCorrespondence\"]:checked").value === "نعم" ? "yes" : "no";
                    formData.append("is_first", isFirstValue);
                    formData.append("ID", generatedLetterId); // Use the ID from the generate step

                    // Add template info if needed by archive API (not explicitly in screenshot)
                    // formData.append("template", selectedTemplate);

                    console.log("FormData prepared for archive:", Object.fromEntries(formData));

                    // --- PDF Generation (Client-side - Complex) ---
                    // Client-side PDF generation from HTML/template is complex.
                    // The requirement mentions sending PDF based on template.
                    // This likely needs a library (jsPDF, pdf-lib) or server-side help.
                    // For now, we are only sending the text content as per `letter_content`.
                    // If a file is strictly required, this needs more implementation.
                    console.warn("PDF/File generation based on template is not implemented client-side.");
                    // If a dummy file is needed for the API:
                    // const dummyFile = new Blob(["dummy content"], { type: 'text/plain' });
                    // formData.append("file", dummyFile, "letter.txt");

                    const archiveResult = await archiveLetter(formData);

                    if (archiveResult && archiveResult.success) { // Adjust based on actual API response
                        console.log("Letter archived successfully:", archiveResult);
                        alert("تم حفظ الخطاب بنجاح!");
                        window.location.href = "index.html"; // Redirect to home
                    } else {
                        console.error("Archive API call failed or returned unsuccessful:", archiveResult);
                        alert("فشل حفظ الخطاب. يرجى المحاولة مرة أخرى.");
                    }
                } catch (error) {
                    console.error("Error saving/archiving letter:", error);
                    alert(`فشل حفظ الخطاب: ${error.message}`);
                } finally {
                    hideLoading();
                }
            });
        }
    }

    // --- Letter Records Page Logic (letter-records.html) ---
    if (path === "letter-records.html") {
        console.log("Initializing Letter Records Page");
        const searchInput = document.getElementById("searchInput");
        const letterTypeFilter = document.getElementById("letterTypeFilter");
        const reviewStatusFilter = document.getElementById("reviewStatusFilter");
        const sendStatusFilter = document.getElementById("sendStatusFilter");
        const recordsTableBody = document.getElementById("recordsTableBody");
        const loadingRecords = document.getElementById("loadingRecords");
        const noRecords = document.getElementById("noRecords");
        const refreshBtn = document.getElementById("refreshBtn");
        const actionModal = document.getElementById("actionModal");
        const modalTitle = document.getElementById("modalTitle");
        const modalMessage = document.getElementById("modalMessage");
        const confirmBtn = document.getElementById("confirmBtn");
        const cancelBtn = document.getElementById("cancelBtn");
        const closeModal = actionModal ? actionModal.querySelector(".close") : null;

        let allRecords = []; // Store all fetched records
        let currentAction = null; // Store action details for modal confirmation

        // Status mapping and styling
        const reviewStatusMap = {
            "جاهز للإرسال": { text: "جاهز للإرسال", color: "status-green" },
            "في الانتظار": { text: "في الانتظار", color: "status-orange" },
            "يحتاج إلى تحسينات": { text: "يحتاج إلى تحسينات", color: "status-red" },
            // Add other statuses from sheet if needed
        };
        const sendStatusMap = {
            "تم الإرسال": { text: "تم الإرسال", color: "status-green" },
            "في الانتظار": { text: "في الانتظار", color: "status-orange" },
            // Add other statuses from sheet if needed
        };
        const letterTypeArabicMap = {
            "New": "جديد",
            "Reply": "رد",
            "Follow Up": "متابعة",
            "Co-op": "تعاون"
        };

        // Render table rows
        const renderTable = (records) => {
            recordsTableBody.innerHTML = ""; // Clear existing rows
            if (records.length === 0) {
                noRecords.style.display = "block";
                loadingRecords.style.display = "none";
                return;
            }
            noRecords.style.display = "none";

            records.forEach(record => {
                const row = recordsTableBody.insertRow();
                row.setAttribute("data-id", record.id);
                row.setAttribute("data-rowindex", record.rowIndex);

                const reviewStatusInfo = reviewStatusMap[record.reviewStatus] || { text: record.reviewStatus, color: "" };
                const sendStatusInfo = sendStatusMap[record.sendStatus] || { text: record.sendStatus, color: "" };
                const letterTypeArabic = letterTypeArabicMap[record.type] || record.type;

                row.innerHTML = `
                    <td>${record.id}</td>
                    <td>${record.date ? new Date(record.date).toLocaleDateString("ar-SA") : "-"}</td>
                    <td>${letterTypeArabic}</td>
                    <td>${record.subject}</td>
                    <td><span class="status-badge ${sendStatusInfo.color}">${sendStatusInfo.text}</span></td>
                    <td>${record.recipient}</td>
                    <td><span class="status-badge ${reviewStatusInfo.color}">${reviewStatusInfo.text}</span></td>
                    <td class="actions">
                        <button class="action-btn review-btn" title="مراجعة"><i class="fas fa-edit"></i></button>
                        <button class="action-btn print-btn" title="طباعة"><i class="fas fa-print"></i></button>
                        <button class="action-btn download-btn" title="تحميل PDF"><i class="fas fa-download"></i></button>
                        <button class="action-btn delete-btn" title="حذف"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
            });
            loadingRecords.style.display = "none";
            console.log(`Rendered ${records.length} records`);
        };

        // Fetch and display records
        const loadRecords = async () => {
            loadingRecords.style.display = "block";
            noRecords.style.display = "none";
            recordsTableBody.innerHTML = "";
            try {
                allRecords = await getLetterRecords();
                filterAndRenderRecords(); // Initial render
            } catch (error) {
                console.error("Failed to load records:", error);
                alert("حدث خطأ أثناء تحميل سجل الخطابات.");
                loadingRecords.style.display = "none";
                noRecords.style.display = "block";
                noRecords.querySelector("p").textContent = "فشل تحميل السجلات.";
            }
        };

        // Filter and Search Logic
        const filterAndRenderRecords = () => {
            const searchTerm = searchInput.value.toLowerCase();
            const typeFilter = letterTypeFilter.value;
            const reviewFilter = reviewStatusFilter.value;
            const sendFilter = sendStatusFilter.value;

            const filteredRecords = allRecords.filter(record => {
                const typeArabic = letterTypeArabicMap[record.type] || record.type;
                const matchesSearch = !searchTerm || record.recipient.toLowerCase().includes(searchTerm) || record.id.toLowerCase().includes(searchTerm);
                const matchesType = !typeFilter || typeArabic === typeFilter;
                const matchesReview = !reviewFilter || record.reviewStatus === reviewFilter;
                const matchesSend = !sendFilter || record.sendStatus === sendFilter;
                return matchesSearch && matchesType && matchesReview && matchesSend;
            });

            console.log(`Filtering: Term=\"${searchTerm}\", Type=\"${typeFilter}\", Review=\"${reviewFilter}\", Send=\"${sendFilter}\". Found ${filteredRecords.length} records.`);
            renderTable(filteredRecords);
        };

        // Event Listeners for Filters and Search
        searchInput.addEventListener("input", filterAndRenderRecords);
        letterTypeFilter.addEventListener("change", filterAndRenderRecords);
        reviewStatusFilter.addEventListener("change", filterAndRenderRecords);
        sendStatusFilter.addEventListener("change", filterAndRenderRecords);
        refreshBtn.addEventListener("click", loadRecords);

        // Modal Handling
        const openModal = (title, message, actionDetails) => {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            currentAction = actionDetails;
            actionModal.style.display = "block";
        };
        const closeModalAction = () => {
            actionModal.style.display = "none";
            currentAction = null;
        };
        if (closeModal) closeModal.addEventListener("click", closeModalAction);
        if (cancelBtn) cancelBtn.addEventListener("click", closeModalAction);
        window.addEventListener("click", (event) => {
            if (event.target == actionModal) {
                closeModalAction();
            }
        });

        // Confirm Action (Delete)
        if (confirmBtn) {
            confirmBtn.addEventListener("click", async () => {
                if (!currentAction || currentAction.type !== "delete") return;

                const { recordId, rowIndex } = currentAction;
                console.log(`Confirming delete for row index: ${rowIndex}`);
                showLoading("جاري الحذف...");
                closeModalAction();

                try {
                    // !!! WARNING: This uses the sheets.js function which might fail due to permissions
                    await deleteSheetRow(rowIndex);
                    alert("تم حذف السجل بنجاح (إذا كانت الأذونات تسمح).");
                    loadRecords(); // Refresh the list
                } catch (error) {
                    console.error("Error deleting record:", error);
                    alert(`فشل حذف السجل: ${error.message}. قد تحتاج إلى صلاحيات تعديل للجدول.`);
                } finally {
                    hideLoading();
                }
            });
        }

        // Handle Actions (Event Delegation)
        recordsTableBody.addEventListener("click", (e) => {
            const targetButton = e.target.closest(".action-btn");
            if (!targetButton) return;

            const row = targetButton.closest("tr");
            const recordId = row.getAttribute("data-id");
            const rowIndex = parseInt(row.getAttribute("data-rowindex"), 10);
            console.log(`Action clicked on row ID: ${recordId}, Index: ${rowIndex}`);

            if (targetButton.classList.contains("review-btn")) {
                console.log("Review action triggered");
                // Store ID and navigate
                localStorage.setItem("reviewLetterId", recordId);
                localStorage.setItem("reviewLetterRowIndex", rowIndex);
                window.location.href = "review-letter.html";
            }
            else if (targetButton.classList.contains("print-btn")) {
                console.log("Print action triggered");
                // Option 1: Print a dedicated view (if available)
                // window.open(`print-letter.html?id=${recordId}`, "_blank");
                // Option 2: Navigate to review page and trigger print (simple)
                alert("للطباعة، سيتم فتح صفحة المراجعة. استخدم وظيفة الطباعة في المتصفح (Ctrl+P).");
                localStorage.setItem("reviewLetterId", recordId);
                localStorage.setItem("reviewLetterRowIndex", rowIndex);
                // Add a flag to trigger print on load in review page?
                localStorage.setItem("triggerPrint", "true");
                window.location.href = "review-letter.html";
            }
            else if (targetButton.classList.contains("download-btn")) {
                console.log("Download action triggered");
                // Downloading requires the actual file. The archive API might store it,
                // or we need to fetch content and generate PDF client-side (complex).
                // Placeholder: Alert user
                alert("وظيفة التحميل المباشر كـ PDF غير متوفرة حالياً. يمكنك الطباعة إلى PDF من صفحة المراجعة.");
                // TODO: Implement actual download if backend provides file URL or content
            }
            else if (targetButton.classList.contains("delete-btn")) {
                console.log("Delete action triggered");
                openModal(
                    "تأكيد الحذف",
                    `هل أنت متأكد من حذف الخطاب ذو الرقم المرجعي ${recordId}؟ لا يمكن التراجع عن هذا الإجراء.`,
                    { type: "delete", recordId, rowIndex }
                );
            }
        });

        // Initial load
        loadRecords();
    }

    // --- Review Letter Page Logic (review-letter.html) ---
    if (path === "review-letter.html") {
        console.log("Initializing Review Letter Page");
        const letterIdDisplay = document.getElementById("letterIdDisplay");
        const reviewerNameInput = document.getElementById("reviewerName");
        const letterToReviewTextarea = document.getElementById("letterToReview");
        const reviewNotesTextarea = document.getElementById("reviewNotes");
        const reviewCompletedCheckbox = document.getElementById("reviewCompleted");
        const approveBtn = document.getElementById("approveBtn"); // Changed from proceedBtn based on HTML
        const needsImprovementBtn = document.getElementById("needsImprovementBtn");
        // const rejectBtn = document.getElementById("rejectBtn"); // Not in HTML provided
        const reviewForm = document.getElementById("reviewForm"); // Assuming form wraps controls

        const letterId = localStorage.getItem("reviewLetterId");
        const rowIndex = localStorage.getItem("reviewLetterRowIndex");
        const triggerPrint = localStorage.getItem("triggerPrint") === "true";

        // Clear print trigger flag
        localStorage.removeItem("triggerPrint");

        // Enable/disable action buttons based on checkbox
        const toggleActionButtons = () => {
            const isChecked = reviewCompletedCheckbox.checked;
            approveBtn.disabled = !isChecked;
            needsImprovementBtn.disabled = !isChecked;
            // rejectBtn.disabled = !isChecked; // If exists
            console.log(`Review checkbox checked: ${isChecked}, buttons enabled: ${isChecked}`);
        };

        // Load letter content (needs an endpoint or fetch from sheet)
        const loadLetterForReview = async () => {
            if (!letterId) {
                alert("لم يتم تحديد خطاب للمراجعة. يرجى العودة لسجل الخطابات واختيار خطاب.");
                window.location.href = "letter-records.html";
                return;
            }

            letterIdDisplay.textContent = `الرقم المرجعي: ${letterId}`;
            showLoading("جاري تحميل بيانات الخطاب...");

            try {
                // How to get letter content? 
                // Option A: Fetch ALL records again and find by ID (inefficient)
                // Option B: Assume content is stored in the sheet (needs column)
                // Option C: Need a backend endpoint /get-letter-content?id=...
                // Option D: Pass content via localStorage (bad for large content)

                // Using Option A for now, assuming getLetterRecords fetches content if available
                // Modify getLetterRecords if content is in a specific column
                console.warn("Fetching letter content for review is not fully implemented. Needs content source.");
                // Placeholder:
                letterToReviewTextarea.value = `محتوى الخطاب للرقم المرجعي ${letterId} يجب أن يُعرض هنا... \n\n(تحتاج هذه الوظيفة إلى مصدر لمحتوى الخطاب، إما من جدول البيانات أو من واجهة برمجة تطبيقات خلفية)`;

                // Trigger print if requested
                if (triggerPrint) {
                    console.log("Triggering print dialog...");
                    // Delay slightly to allow content to render
                    setTimeout(() => window.print(), 500);
                }

            } catch (error) {
                console.error("Error loading letter for review:", error);
                alert("فشل تحميل الخطاب للمراجعة.");
            } finally {
                hideLoading();
            }
        };

        // Handle Review Submission
        const handleReviewAction = async (status) => {
            if (!reviewerNameInput.value) {
                alert("يرجى إدخال اسم المراجع.");
                reviewerNameInput.focus();
                return;
            }
            if (!rowIndex) {
                alert("خطأ: لم يتم العثور على معرف الصف لتحديث الحالة.");
                return;
            }

            const notes = reviewNotesTextarea.value;
            console.log(`Submitting review: Status=\"${status}\", Reviewer=\"${reviewerNameInput.value}\", Notes=\"${notes}\", RowIndex=${rowIndex}`);
            showLoading("جاري تحديث حالة المراجعة...");

            try {
                // !!! WARNING: This uses the sheets.js function which might fail due to permissions
                await updateReviewStatus(parseInt(rowIndex, 10), status);
                alert("تم تحديث حالة المراجعة بنجاح (إذا كانت الأذونات تسمح).");
                // Clear stored data and redirect
                localStorage.removeItem("reviewLetterId");
                localStorage.removeItem("reviewLetterRowIndex");
                window.location.href = "index.html"; // Redirect to home

            } catch (error) {
                console.error("Error updating review status:", error);
                alert(`فشل تحديث حالة المراجعة: ${error.message}. قد تحتاج إلى صلاحيات تعديل للجدول.`);
            } finally {
                hideLoading();
            }
        };

        // Event Listeners
        if (reviewCompletedCheckbox) {
            reviewCompletedCheckbox.addEventListener("change", toggleActionButtons);
        }
        if (approveBtn) {
            // Requirement: Button text is "جاهز للإرسال" but HTML is "تمت المراجعة"
            // Requirement: Status should be "جاهز للإرسال"
            approveBtn.addEventListener("click", () => handleReviewAction("جاهز للإرسال"));
        }
        if (needsImprovementBtn) {
            needsImprovementBtn.addEventListener("click", () => handleReviewAction("يحتاج إلى تحسينات"));
        }
        // if (rejectBtn) {
        //     rejectBtn.addEventListener("click", () => handleReviewAction("مرفوض"));
        // }

        // Initial setup
        toggleActionButtons(); // Set initial state
        loadLetterForReview();
    }

    // --- Index Page Logic (index.html) ---
    if (path === "index.html" || path === "") {
        console.log("Initializing Index Page");
        // Add any specific logic for the index page if needed
    }

}); // End DOMContentLoaded

