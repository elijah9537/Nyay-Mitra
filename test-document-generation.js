/**
 * Test script for AI-powered document generation
 * Tests the document generator service with sample data
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001';

// Sample RTI Application data
const rtiData = {
    type: 'RTI_APPLICATION',
    department: 'Department of Education',
    departmentAddress: 'Education Department, Secretariat, New Delhi - 110001',
    informationPoints: `1. Total number of schools in the district
2. Budget allocated for mid-day meals in 2024-25
3. Number of teacher vacancies as on date`,
    applicantName: 'Rajesh Kumar',
    applicantAddress: 'House No. 123, Sector 15, Rohini, New Delhi - 110085',
    mobile: '9876543210',
    email: 'rajesh.kumar@email.com',
    paymentMode: 'Online Payment'
};

// Sample Consumer Complaint data
const consumerComplaintData = {
    type: 'CONSUMER_COMPLAINT',
    commissionLevel: 'District',
    place: 'Mumbai',
    complainantName: 'Priya Sharma',
    complainantAddress: '45, Andheri West, Mumbai - 400053',
    oppositePartyName: 'XYZ Electronics Pvt. Ltd.',
    oppositePartyAddress: '12, Industrial Area, Mumbai - 400001',
    productService: 'LED Television (55 inch)',
    purchaseDate: '15th January 2024',
    amount: '45,000',
    billNumber: 'INV-2024-001234',
    complaintDetails: 'The television stopped working within 2 months of purchase. Screen displays distorted images and has dead pixels.',
    contactDate: '20th March 2024',
    requestedAction: 'Replacement or refund',
    relief: 'Replace the defective television with a new one',
    compensationAmount: '10,000'
};

async function testDocumentGeneration() {
    try {
        console.log('🧪 Testing Document Generation Service\n');
        
        // Test 1: Get available document types
        console.log('📋 Test 1: Getting available document types...');
        const typesResponse = await axios.get(`${API_BASE}/api/document-types`);
        console.log('✅ Available document types:', typesResponse.data.documentTypes.length);
        typesResponse.data.documentTypes.forEach(doc => {
            console.log(`   - ${doc.name} (${doc.type})`);
        });
        console.log('');
        
        // Test 2: Get RTI template structure
        console.log('📋 Test 2: Getting RTI template structure...');
        const templateResponse = await axios.get(`${API_BASE}/api/document-template/RTI_APPLICATION`);
        console.log('✅ RTI Template retrieved');
        console.log(`   Required fields: ${templateResponse.data.template.requiredFields.length}`);
        console.log('');
        
        // Test 3: Generate RTI Application
        console.log('📋 Test 3: Generating RTI Application with AI formatting...');
        console.log('   Input data:', JSON.stringify(rtiData, null, 2).substring(0, 200) + '...');
        const rtiResponse = await axios.post(`${API_BASE}/api/generate-doc`, rtiData);
        
        if (rtiResponse.data.success) {
            console.log('✅ RTI Application generated successfully!');
            console.log('   Filename:', rtiResponse.data.filename);
            console.log('   Document Type:', rtiResponse.data.documentType);
            console.log('   Preview URL:', rtiResponse.data.previewUrl);
            console.log('   Download URL:', rtiResponse.data.downloadUrl);
            if (rtiResponse.data.metadata) {
                console.log('   Metadata:', rtiResponse.data.metadata);
            }
        } else {
            console.log('❌ Failed to generate RTI Application');
            console.log('   Error:', rtiResponse.data.error);
        }
        console.log('');
        
        // Test 4: Generate Consumer Complaint
        console.log('📋 Test 4: Generating Consumer Complaint with AI formatting...');
        const complaintResponse = await axios.post(`${API_BASE}/api/generate-doc`, consumerComplaintData);
        
        if (complaintResponse.data.success) {
            console.log('✅ Consumer Complaint generated successfully!');
            console.log('   Filename:', complaintResponse.data.filename);
            console.log('   Document Type:', complaintResponse.data.documentType);
            console.log('   Preview URL:', complaintResponse.data.previewUrl);
            console.log('   Download URL:', complaintResponse.data.downloadUrl);
            if (complaintResponse.data.metadata) {
                console.log('   Metadata:', complaintResponse.data.metadata);
            }
        } else {
            console.log('❌ Failed to generate Consumer Complaint');
            console.log('   Error:', complaintResponse.data.error);
        }
        console.log('');
        
        console.log('🎉 All tests completed!');
        console.log('\n📁 Generated documents are saved in the "generated_docs" folder');
        console.log('🌐 You can preview them by opening the preview URLs in your browser');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Response error:', error.response.data);
        }
    }
}

// Run tests
console.log('Starting document generation tests...\n');
testDocumentGeneration();
