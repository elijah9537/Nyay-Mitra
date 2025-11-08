/**
 * Frontend Integration Example for AI Document Generator
 * 
 * This file shows how to integrate the AI document generator into the Nyay-mitra frontend.
 */

// ==========================================
// 1. GET AVAILABLE DOCUMENT TYPES
// ==========================================

async function fetchDocumentTypes() {
    try {
        const response = await fetch('/api/document-types');
        const data = await response.json();
        
        if (data.success) {
            console.log('Available documents:', data.documentTypes);
            // Display in UI
            displayDocumentTypes(data.documentTypes);
        }
    } catch (error) {
        console.error('Error fetching document types:', error);
    }
}

function displayDocumentTypes(types) {
    const container = document.getElementById('document-types-container');
    container.innerHTML = types.map(doc => `
        <div class="document-card" onclick="selectDocumentType('${doc.type}')">
            <h3>${doc.name}</h3>
            <p>Required fields: ${doc.requiredFields.length}</p>
        </div>
    `).join('');
}

// ==========================================
// 2. GET TEMPLATE FOR SELECTED DOCUMENT
// ==========================================

async function getDocumentTemplate(type) {
    try {
        const response = await fetch(`/api/document-template/${type}`);
        const data = await response.json();
        
        if (data.success) {
            // Show form with required fields
            createDocumentForm(data.template);
        }
    } catch (error) {
        console.error('Error fetching template:', error);
    }
}

function createDocumentForm(template) {
    const formContainer = document.getElementById('document-form');
    formContainer.innerHTML = `
        <h2>Generate ${template.name}</h2>
        <form id="doc-generate-form">
            ${template.requiredFields.map(field => `
                <div class="form-group">
                    <label for="${field}">${formatFieldName(field)}*</label>
                    ${createInputField(field)}
                </div>
            `).join('')}
            <button type="submit" class="btn-primary">Generate Document</button>
        </form>
    `;
    
    // Add form submit handler
    document.getElementById('doc-generate-form').addEventListener('submit', handleDocumentGeneration);
}

function formatFieldName(field) {
    // Convert camelCase to Title Case
    return field
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

function createInputField(fieldName) {
    // Special handling for certain fields
    if (fieldName.includes('address') || fieldName.includes('description') || fieldName.includes('details')) {
        return `<textarea id="${fieldName}" name="${fieldName}" rows="3" required></textarea>`;
    } else if (fieldName.includes('date')) {
        return `<input type="date" id="${fieldName}" name="${fieldName}" required>`;
    } else if (fieldName.includes('email')) {
        return `<input type="email" id="${fieldName}" name="${fieldName}" required>`;
    } else if (fieldName.includes('mobile') || fieldName.includes('phone')) {
        return `<input type="tel" id="${fieldName}" name="${fieldName}" pattern="[0-9]{10}" required>`;
    } else if (fieldName.includes('amount') || fieldName.includes('value')) {
        return `<input type="number" id="${fieldName}" name="${fieldName}" min="0" required>`;
    } else {
        return `<input type="text" id="${fieldName}" name="${fieldName}" required>`;
    }
}

// ==========================================
// 3. GENERATE DOCUMENT WITH AI
// ==========================================

async function handleDocumentGeneration(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const documentData = {
        type: currentDocumentType, // Set when user selects document type
    };
    
    // Collect all form fields
    for (let [key, value] of formData.entries()) {
        documentData[key] = value;
    }
    
    // Show loading state
    showLoadingState();
    
    try {
        const response = await fetch('/api/generate-doc', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(documentData)
        });
        
        const result = await response.json();
        
        hideLoadingState();
        
        if (result.success) {
            showDocumentSuccess(result);
        } else {
            showError(result.error);
        }
    } catch (error) {
        hideLoadingState();
        showError('Failed to generate document. Please try again.');
        console.error('Error:', error);
    }
}

// ==========================================
// 4. DISPLAY GENERATED DOCUMENT
// ==========================================

function showDocumentSuccess(result) {
    const resultContainer = document.getElementById('document-result');
    resultContainer.innerHTML = `
        <div class="success-message">
            <div class="success-icon">✅</div>
            <h2>Document Generated Successfully!</h2>
            <p><strong>Document Type:</strong> ${result.documentType}</p>
            <p><strong>Filename:</strong> ${result.filename}</p>
            
            ${result.metadata ? `
                <div class="metadata">
                    <p><strong>Generated:</strong> ${new Date(result.metadata.generatedAt).toLocaleString()}</p>
                    <p><strong>Word Count:</strong> ${result.metadata.wordCount}</p>
                    <p><strong>Size:</strong> ${result.metadata.characterCount} characters</p>
                </div>
            ` : ''}
            
            <div class="action-buttons">
                <a href="${result.previewUrl}" target="_blank" class="btn btn-secondary">
                    👁️ Preview Document
                </a>
                <a href="${result.downloadUrl}" download class="btn btn-primary">
                    📥 Download PDF
                </a>
            </div>
            
            <button onclick="generateAnother()" class="btn btn-link">
                Generate Another Document
            </button>
        </div>
    `;
    
    // Smooth scroll to result
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// 5. UI HELPER FUNCTIONS
// ==========================================

function showLoadingState() {
    const container = document.getElementById('loading-container');
    container.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Generating your document with AI...</p>
            <p class="loading-subtext">This may take a few seconds</p>
        </div>
    `;
    container.style.display = 'flex';
}

function hideLoadingState() {
    const container = document.getElementById('loading-container');
    container.style.display = 'none';
}

function showError(message) {
    const errorContainer = document.getElementById('error-container');
    errorContainer.innerHTML = `
        <div class="error-message">
            <div class="error-icon">❌</div>
            <p>${message}</p>
            <button onclick="closeError()" class="btn btn-secondary">Close</button>
        </div>
    `;
    errorContainer.style.display = 'block';
}

function closeError() {
    document.getElementById('error-container').style.display = 'none';
}

function generateAnother() {
    document.getElementById('document-result').innerHTML = '';
    document.getElementById('doc-generate-form').reset();
}

// ==========================================
// 6. COMPLETE WORKFLOW EXAMPLE
// ==========================================

let currentDocumentType = null;

async function selectDocumentType(type) {
    currentDocumentType = type;
    await getDocumentTemplate(type);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchDocumentTypes();
});

// ==========================================
// 7. EXAMPLE HTML STRUCTURE
// ==========================================

/*
<div class="document-generator-section">
    <!-- Document Type Selection -->
    <div id="document-types-container" class="document-types-grid">
        <!-- Populated by JavaScript -->
    </div>
    
    <!-- Document Form -->
    <div id="document-form" class="document-form-container">
        <!-- Populated by JavaScript -->
    </div>
    
    <!-- Loading State -->
    <div id="loading-container" style="display: none;">
        <!-- Populated by JavaScript -->
    </div>
    
    <!-- Error Messages -->
    <div id="error-container" style="display: none;">
        <!-- Populated by JavaScript -->
    </div>
    
    <!-- Result Display -->
    <div id="document-result">
        <!-- Populated by JavaScript -->
    </div>
</div>
*/

// ==========================================
// 8. EXAMPLE CSS STYLES
// ==========================================

/*
.document-types-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    padding: 1rem;
}

.document-card {
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.document-card:hover {
    border-color: #4f46e5;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
}

.loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.spinner {
    border: 4px solid #f3f4f6;
    border-top: 4px solid #4f46e5;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.success-message {
    background: #f0fdf4;
    border: 2px solid #86efac;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
}

.action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 1.5rem;
}
*/

// ==========================================
// 9. ADVANCED FEATURES
// ==========================================

// Save draft functionality
function saveDraft() {
    const formData = new FormData(document.getElementById('doc-generate-form'));
    const draftData = {};
    for (let [key, value] of formData.entries()) {
        draftData[key] = value;
    }
    localStorage.setItem(`draft_${currentDocumentType}`, JSON.stringify(draftData));
    alert('Draft saved successfully!');
}

// Load draft functionality
function loadDraft() {
    const draftData = localStorage.getItem(`draft_${currentDocumentType}`);
    if (draftData) {
        const data = JSON.parse(draftData);
        Object.keys(data).forEach(key => {
            const field = document.getElementById(key);
            if (field) field.value = data[key];
        });
    }
}

// Field validation
function validateField(fieldName, value) {
    if (fieldName.includes('email')) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }
    if (fieldName.includes('mobile')) {
        return /^[0-9]{10}$/.test(value);
    }
    return value.trim().length > 0;
}

// Export functions for use in other modules
export {
    fetchDocumentTypes,
    getDocumentTemplate,
    selectDocumentType,
    handleDocumentGeneration,
    saveDraft,
    loadDraft
};
