const { Groq } = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/**
 * Indian Legal Document Templates and Structures
 */
const DOCUMENT_TEMPLATES = {
    'RTI_APPLICATION': {
        name: 'RTI Application',
        structure: `
To,
The Public Information Officer (PIO),
[Department Name]
[Address]

Date: [Date]

Subject: Application under the Right to Information Act, 2005

Sir/Madam,

Under the provisions of the Right to Information Act, 2005, I hereby request the following information:

[Information Points]

I am a citizen of India and the information sought is for personal/public interest.

I am enclosing the requisite application fee of Rs. 10/- by way of [Payment Mode].

Please provide the information to the address given below within the statutory period of 30 days.

Name: [Applicant Name]
Address: [Applicant Address]
Mobile: [Mobile Number]
Email: [Email]

Yours faithfully,
[Applicant Name]

Enclosures:
1. Application fee: Rs. 10/-
        `,
        requiredFields: ['department', 'departmentAddress', 'informationPoints', 'applicantName', 'applicantAddress', 'mobile', 'email', 'paymentMode']
    },
    
    'CONSUMER_COMPLAINT': {
        name: 'Consumer Complaint',
        structure: `
BEFORE THE [DISTRICT/STATE/NATIONAL] CONSUMER DISPUTES REDRESSAL COMMISSION
AT [PLACE]

Complaint No. _________ of [Year]

[Complainant Name]
[Complainant Address]
                                                                    ...Complainant
VERSUS

[Opposite Party Name]
[Opposite Party Address]
                                                                    ...Opposite Party

COMPLAINT UNDER SECTION 35 OF THE CONSUMER PROTECTION ACT, 2019

MOST RESPECTFULLY SHEWETH:

1. That the Complainant is a consumer as defined under Section 2(7) of the Consumer Protection Act, 2019.

2. That the Complainant purchased [Product/Service] from the Opposite Party on [Date] for a sum of Rs. [Amount] vide Receipt/Bill No. [Number].

[Complaint Details]

3. That the Complainant contacted the Opposite Party on [Date] and requested [Action], but the Opposite Party failed/refused to provide the same.

4. That the act of the Opposite Party amounts to deficiency in service/defect in goods under the Consumer Protection Act, 2019.

5. That this Hon'ble Commission has jurisdiction to entertain this complaint as per Section 34 of the Consumer Protection Act, 2019.

PRAYER:

In the light of the facts stated above, it is most respectfully prayed that this Hon'ble Commission may be pleased to:

a) Direct the Opposite Party to [Relief 1]
b) Direct the Opposite Party to pay compensation of Rs. [Amount] for mental agony and harassment
c) Direct the Opposite Party to pay the cost of this complaint
d) Pass any other order as this Hon'ble Commission may deem fit

Date: [Date]
Place: [Place]

                                                        [Complainant Signature]
                                                        [Complainant Name]

List of Enclosures:
1. Copy of Receipt/Bill
2. Copy of Correspondence
3. [Other Documents]
        `,
        requiredFields: ['commissionLevel', 'place', 'complainantName', 'complainantAddress', 'oppositePartyName', 'oppositePartyAddress', 'productService', 'purchaseDate', 'amount', 'billNumber', 'complaintDetails', 'contactDate', 'requestedAction', 'relief', 'compensationAmount']
    },
    
    'FIR_COMPLAINT': {
        name: 'Written Complaint to Police (for FIR)',
        structure: `
To,
The Station House Officer,
[Police Station Name]
[Police Station Address]

Date: [Date]
Time: [Time]

Subject: Complaint regarding [Nature of Offense]

Sir/Madam,

I, [Complainant Name], son/daughter/wife of [Father/Husband Name], aged [Age] years, residing at [Address], hereby lodge the following complaint:

INCIDENT DETAILS:

1. Date and Time of Incident: [Date and Time]
2. Place of Incident: [Location]
3. Nature of Offense: [Offense Description]

DETAILED DESCRIPTION:

[Detailed Narrative of Incident]

ACCUSED DETAILS:

[If known]
Name: [Accused Name]
Description: [Physical Description/Identification]
Address: [If known]

WITNESSES:

[If any]
1. [Witness Name, Address, Contact]
2. [Witness Name, Address, Contact]

LOSS/DAMAGE:

[Description of loss or damage]
Estimated Value: Rs. [Amount]

EVIDENCE:

[List of evidence/documents attached]

I request you to kindly register an FIR in this matter and take necessary legal action against the accused. I am ready to cooperate in the investigation.

Complainant Details:
Name: [Complainant Name]
Father's/Husband's Name: [Guardian Name]
Age: [Age]
Address: [Full Address]
Mobile: [Mobile Number]
Email: [Email]
Identification Proof: [ID Type and Number]

Signature: __________________
[Complainant Name]

Enclosures:
1. [List of attached documents]
        `,
        requiredFields: ['policeStation', 'policeStationAddress', 'complaintNature', 'complainantName', 'guardianName', 'age', 'address', 'incidentDate', 'incidentTime', 'incidentLocation', 'offenseDescription', 'detailedNarrative', 'accusedDetails', 'witnesses', 'lossDescription', 'estimatedValue', 'evidence', 'mobile', 'email', 'idProof']
    },
    
    'LEGAL_NOTICE': {
        name: 'Legal Notice',
        structure: `
LEGAL NOTICE

To,
[Recipient Name]
[Recipient Address]

Date: [Date]

Dear Sir/Madam,

SUBJECT: [Subject of Notice]

UNDER INSTRUCTIONS FROM AND ON BEHALF OF MY CLIENT:

I, [Advocate Name], Advocate practicing in [Court Name], have been instructed by my client [Client Name], son/daughter of [Father Name], residing at [Client Address], to address this legal notice to you.

FACTS OF THE CASE:

1. [Fact 1]

2. [Fact 2]

3. [Fact 3]

[Additional Facts]

LEGAL GROUNDS:

The above acts/omissions on your part constitute:
- [Legal Ground 1]
- [Legal Ground 2]
- [Legal Ground 3]

NOTICE AND DEMAND:

My client hereby calls upon you to:

1. [Demand 1]
2. [Demand 2]
3. [Demand 3]

within a period of [Number] days from the receipt of this notice, failing which my client will be constrained to initiate appropriate legal proceedings against you at your risk as to costs, consequences, and damages.

This notice is issued without prejudice to all rights, remedies, claims, and defenses available to my client, all of which are expressly reserved.

TAKE NOTICE that if you fail to comply with the demands made herein within the stipulated time, my client shall be constrained to take appropriate legal action including filing of civil/criminal proceedings, as may be advised, at your sole risk as to costs.

Date: [Date]
Place: [Place]

Yours faithfully,

[Advocate Signature]
[Advocate Name]
[Advocate Enrollment No.]
[Address]
[Contact Details]

For and on behalf of:
[Client Name]
        `,
        requiredFields: ['recipientName', 'recipientAddress', 'subject', 'advocateName', 'courtName', 'clientName', 'fatherName', 'clientAddress', 'facts', 'legalGrounds', 'demands', 'timeLimit', 'place', 'advocateEnrollment', 'advocateAddress', 'advocateContact']
    },
    
    'AFFIDAVIT': {
        name: 'General Affidavit',
        structure: `
AFFIDAVIT

I, [Deponent Name], son/daughter/wife of [Father/Husband Name], aged about [Age] years, residing at [Address], do hereby solemnly affirm and state on oath as under:

1. That I am the deponent herein and am well acquainted with the facts and circumstances of the present case.

2. That [Statement of Fact 1]

3. That [Statement of Fact 2]

4. That [Statement of Fact 3]

[Additional Statements]

5. That the contents of this affidavit are true to the best of my knowledge and belief, and nothing material has been concealed therefrom.

6. That I have read and understood the contents of this affidavit and the same are true and correct.

DEPONENT

VERIFICATION

I, the above-named deponent, do hereby verify that the contents of the above affidavit are true and correct to the best of my knowledge and belief, and nothing material has been concealed therefrom.

Verified at [Place] on this [Day] day of [Month], [Year].

                                                        DEPONENT
                                                        [Signature]

NOTARY PUBLIC/OATH COMMISSIONER

Solemnly affirmed and signed before me on this [Day] day of [Month], [Year].

                                                        NOTARY PUBLIC
                                                        [Seal and Signature]
        `,
        requiredFields: ['deponentName', 'guardianName', 'age', 'address', 'statements', 'place', 'date']
    },
    
    'RENTAL_AGREEMENT': {
        name: 'Rental/Lease Agreement',
        structure: `
LEAVE AND LICENSE AGREEMENT

This Agreement is made on [Date] at [Place]

BETWEEN

[Landlord Name], son/daughter of [Father Name], aged [Age] years, residing at [Landlord Address] (hereinafter called "THE LICENSOR")

AND

[Tenant Name], son/daughter of [Father Name], aged [Age] years, residing at [Tenant Address] (hereinafter called "THE LICENSEE")

WHEREAS the Licensor is the lawful owner of the premises situated at [Property Address] (hereinafter referred to as "the said premises")

AND WHEREAS the Licensee has approached the Licensor for granting leave and license of the said premises for residential purposes.

NOW THIS AGREEMENT WITNESSETH AS FOLLOWS:

1. LICENSE PERIOD:
   The license shall be for a period of [Duration] months commencing from [Start Date] and ending on [End Date].

2. LICENSE FEE:
   The monthly license fee shall be Rs. [Monthly Rent] per month, payable on or before the [Day] of each month.

3. SECURITY DEPOSIT:
   The Licensee has paid Rs. [Security Amount] as interest-free refundable security deposit.

4. ELECTRICITY AND WATER CHARGES:
   [Clause about utility charges]

5. MAINTENANCE:
   [Maintenance clause]

6. USE OF PREMISES:
   The premises shall be used strictly for residential purposes only.

7. TERMINATION:
   Either party may terminate this agreement by giving [Notice Period] months' notice in writing.

8. DEFAULT:
   [Default clause]

GENERAL TERMS:

[Additional terms and conditions]

IN WITNESS WHEREOF, the parties have set their hands on the day, month, and year first above written.

LICENSOR                                    LICENSEE
[Signature]                                 [Signature]
[Name]                                      [Name]

WITNESSES:

1. _________________                        2. _________________
   Name:                                       Name:
   Address:                                    Address:
        `,
        requiredFields: ['date', 'place', 'landlordName', 'landlordFather', 'landlordAge', 'landlordAddress', 'tenantName', 'tenantFather', 'tenantAge', 'tenantAddress', 'propertyAddress', 'duration', 'startDate', 'endDate', 'monthlyRent', 'rentDueDay', 'securityAmount', 'utilityCharges', 'maintenance', 'noticeP eriod', 'additionalTerms']
    }
};

/**
 * Generate a formatted legal document using AI
 * @param {string} documentType - Type of document to generate
 * @param {object} userInputs - User-provided information
 * @returns {Promise<object>} Generated document with formatting
 */
async function generateLegalDocument(documentType, userInputs) {
    try {
        // Support both document type codes (RTI_APPLICATION) and friendly names (RTI Application)
        let template = DOCUMENT_TEMPLATES[documentType];
        
        // If not found, try to find by friendly name
        if (!template) {
            const typeKey = Object.keys(DOCUMENT_TEMPLATES).find(key => 
                DOCUMENT_TEMPLATES[key].name.toLowerCase() === documentType.toLowerCase()
            );
            if (typeKey) {
                template = DOCUMENT_TEMPLATES[typeKey];
            }
        }
        
        if (!template) {
            throw new Error(`Unknown document type: ${documentType}. Available types: ${Object.keys(DOCUMENT_TEMPLATES).join(', ')}`);
        }
        
        // Smart field mapping - handle variations in field names
        const fieldMappings = {
            'information': 'informationPoints',
            'info': 'informationPoints',
            'query': 'informationPoints',
            'departmentAddr': 'departmentAddress',
            'deptAddress': 'departmentAddress',
            'phone': 'mobile',
            'phoneNumber': 'mobile',
            'mobileNumber': 'mobile',
            'emailId': 'email',
            'payment': 'paymentMode',
            'paymentMethod': 'paymentMode'
        };
        
        // Normalize user inputs by mapping alternative field names
        const normalizedInputs = { ...userInputs };
        Object.keys(fieldMappings).forEach(altName => {
            if (userInputs[altName] && !userInputs[fieldMappings[altName]]) {
                normalizedInputs[fieldMappings[altName]] = userInputs[altName];
            }
        });
        
        // Provide sensible defaults for optional fields
        const defaults = {
            departmentAddress: normalizedInputs.department ? `${normalizedInputs.department}, Government of India` : 'Relevant Department Address',
            email: normalizedInputs.mobile ? 'N/A' : 'N/A',
            paymentMode: 'Cash/Demand Draft',
            date: new Date().toLocaleDateString('en-IN')
        };
        
        // Apply defaults for missing non-critical fields
        Object.keys(defaults).forEach(field => {
            if (!normalizedInputs[field]) {
                normalizedInputs[field] = defaults[field];
            }
        });
        
        // Validate only truly required fields (name, basic info)
        const criticalFields = ['applicantName', 'department'];
        const missingCriticalFields = criticalFields.filter(field => !normalizedInputs[field]);
        
        if (missingCriticalFields.length > 0) {
            throw new Error(`Missing critical fields: ${missingCriticalFields.join(', ')}. Please provide at least applicant name and department.`);
        }
        
        // Create AI prompt for intelligent document generation
        const prompt = `You are an expert Indian legal document drafter. Generate a properly formatted ${template.name} following Indian legal standards.

DOCUMENT TEMPLATE STRUCTURE:
${template.structure}

USER PROVIDED INFORMATION:
${JSON.stringify(normalizedInputs, null, 2)}

INSTRUCTIONS:
1. Fill in ALL placeholders with the provided information
2. Maintain proper legal formatting and structure as per Indian law
3. Use formal legal language appropriate for Indian courts
4. Ensure all dates are in DD/MM/YYYY format
5. Include proper salutations and closing statements
6. Maintain paragraph numbering and indentation
7. Add current date where [Date] is mentioned (use ${new Date().toLocaleDateString('en-IN')})
8. If any field shows "N/A", handle it gracefully in the document (e.g., omit email line if N/A)
9. For departmentAddress, if it's generic, use proper formatting
10. Ensure the document is complete and ready to file
11. Do NOT add any explanations or notes - only return the formatted document
12. Keep all legal terminology accurate as per Indian law

Generate the complete, formatted document now:`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert Indian legal document drafter with deep knowledge of Indian legal formats and requirements. Generate only the document content without any explanations."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.1-8b-instant", // Current supported model by Groq
            temperature: 0.3, // Lower temperature for more consistent formatting
            max_tokens: 4096
        });
        
        const generatedDocument = completion.choices[0]?.message?.content;
        
        if (!generatedDocument) {
            throw new Error('Failed to generate document');
        }
        
        return {
            success: true,
            documentType: template.name,
            content: generatedDocument,
            metadata: {
                generatedAt: new Date().toISOString(),
                wordCount: generatedDocument.split(/\s+/).length,
                characterCount: generatedDocument.length
            }
        };
        
    } catch (error) {
        console.error('Document generation error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get available document types and their required fields
 */
function getDocumentTypes() {
    return Object.keys(DOCUMENT_TEMPLATES).map(key => ({
        type: key,
        name: DOCUMENT_TEMPLATES[key].name,
        requiredFields: DOCUMENT_TEMPLATES[key].requiredFields
    }));
}

/**
 * Get template structure for a specific document type
 */
function getTemplateStructure(documentType) {
    const template = DOCUMENT_TEMPLATES[documentType];
    if (!template) {
        return null;
    }
    return {
        name: template.name,
        requiredFields: template.requiredFields,
        sampleStructure: template.structure
    };
}

module.exports = {
    generateLegalDocument,
    getDocumentTypes,
    getTemplateStructure,
    DOCUMENT_TEMPLATES
};
