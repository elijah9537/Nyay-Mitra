const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { Groq } = require('groq-sdk');
const PDFDocument = require('pdfkit');
require('dotenv').config();

let findRelevantDocuments;
try {
    // Optional: keep RAG available but we'll prefer internet sources per user requirement
    ({ findRelevantDocuments } = require('./rag'));
} catch (e) {
    console.warn('rag.js not found or failed to load; proceeding without local RAG');
}

// Import document generator service
const { generateLegalDocument, getDocumentTypes, getTemplateStructure } = require('./services/documentGenerator');

const app = express();
const port = process.env.PORT || 3001; // Changed to port 3001

// --- Configuration ---
const GROQ_API_KEY = process.env.GROQ_API_KEY || 'dummy-key';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
// Note: Without a valid API key, some AI features may be limited


// --- Middleware ---
// Request logging middleware (first to log all requests)
app.use((req, res, next) => {
    console.log(`📝 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Core middleware
app.use(cors({
    origin: '*', // Allow all origins for development
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers middleware
app.use((req, res, next) => {
    // Let Express set the appropriate content-type based on the response
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    next();
});

// Serve static files from the public directory instead of the entire __dirname
// Create public folder for static assets if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'public'))) {
    fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
}

// Copy index.html and style.css to public folder
try {
    if (fs.existsSync(path.join(__dirname, 'index.html'))) {
        fs.copyFileSync(
            path.join(__dirname, 'index.html'),
            path.join(__dirname, 'public', 'index.html')
        );
        console.log('✅ index.html copied to public folder');
    }
    
    if (fs.existsSync(path.join(__dirname, 'style.css'))) {
        fs.copyFileSync(
            path.join(__dirname, 'style.css'),
            path.join(__dirname, 'public', 'style.css')
        );
        console.log('✅ style.css copied to public folder');
    }
    
    if (fs.existsSync(path.join(__dirname, 'app.js'))) {
        fs.copyFileSync(path.join(__dirname, 'app.js'), path.join(__dirname, 'public', 'app.js'));
        console.log('✅ app.js copied to public folder');
    }
    
    if (fs.existsSync(path.join(__dirname, 'quiz_data.js'))) {
        fs.copyFileSync(path.join(__dirname, 'quiz_data.js'), path.join(__dirname, 'public', 'quiz_data.js'));
        console.log('✅ quiz_data.js copied to public folder');
    }
} catch (err) {
    console.error('❌ Error copying static files:', err);
}

// API route for Google Maps API key
app.get('/api/maps-key', (req, res) => {
    res.json({ key: GOOGLE_MAPS_API_KEY });
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        if (/\.(html|js)$/i.test(filePath)) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        } else {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        }
        // Let Express set the appropriate content-type based on file extension
    }
}));

// Configure multer for file uploads
const upload = multer({ 
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'text/plain'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and TXT files are allowed'), false);
        }
    }
});

// --- System Prompt for NyayAI ---
const SYSTEM_PROMPT = `You are NyayAI, an expert legal assistant specializing in Indian law. Your purpose is to provide clear, simple, and accurate information to students and the general public.

**CRITICAL: RELEVANCE FIRST**
- ONLY use the provided legal context if it's directly relevant to the user's question
- If the legal context doesn't match the query, ignore it and provide a direct answer based on your knowledge of Indian law
- DO NOT force irrelevant legal provisions into your answer

**CORE PRINCIPLES:**
1. **Understand the Query:** Identify what the user is actually asking about (theft, harassment, constitutional rights, etc.)
2. **Relevance Check:** Prefer up-to-date information fetched from the open internet (see WEB CONTEXT). Only use any additional provided context if it directly relates to the user's specific legal issue
3. **Simple Language:** Explain complex legal concepts in easy-to-understand terms, use analogies when helpful
4. **Cite Appropriate Sources:** Mention specific laws, sections, or cases that are RELEVANT to the query
5. **Be Practical:** Provide actionable advice on what steps to take for their specific situation

**RESPONSE STRUCTURE:**
- Start with a direct answer to the user's specific question
- Explain the relevant legal provisions that apply to their situation
- Provide practical next steps for their specific case
- Include any warnings or important considerations

**EXAMPLES:**
- Theft query → IPC sections on theft, how to file FIR for theft
- Harassment query → Relevant harassment laws, women's helplines
- Constitutional rights → Specific fundamental rights that apply

**SOURCES (if used):** When you rely on WEB CONTEXT, add a short Sources list with 1–3 links at the end.

**MANDATORY ENDING:** 
Every response must end with: "**Disclaimer:** This information is for general knowledge only and not a substitute for professional legal advice."

**SCOPE:** Only answer questions related to Indian law. Politely decline requests for illegal advice or non-legal topics.`;

// --- Simple Internet Search Utilities (Wikipedia + DuckDuckGo) ---
const ALLOWED_HOSTS = new Set([
    'en.wikipedia.org',
    'wikipedia.org',
    'api.duckduckgo.com'
]);

function httpsGetJson(url) {
    return new Promise((resolve, reject) => {
        try {
            const { hostname } = new URL(url);
            if (!ALLOWED_HOSTS.has(hostname)) return reject(new Error('Host not allowed'));
            https.get(url, { headers: { 'User-Agent': 'NyayMitra/1.0 (Educational)' } }, (resp) => {
                let data = '';
                resp.on('data', (chunk) => { data += chunk; });
                resp.on('end', () => {
                    try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
                });
            }).on('error', reject);
        } catch (e) { reject(e); }
    });
}

async function fetchFromWikipedia(searchTerm) {
    let text = '';
    let source = null;
    try {
        const q = encodeURIComponent(searchTerm);
        const api = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q}&format=json&utf8=1&origin=*`;
        const s = await httpsGetJson(api);
        const firstTitle = s?.query?.search?.[0]?.title;
        if (firstTitle) {
            const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstTitle)}`;
            const sum = await httpsGetJson(summaryUrl);
            text = [sum?.title, sum?.description, sum?.extract].filter(Boolean).join('\n');
            source = { title: sum?.title || firstTitle, url: sum?.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(firstTitle)}` };
        }
    } catch (e) {
        console.warn('Wikipedia fetch failed:', e.message);
    }
    return { text, source };
}

async function fetchFromDDG(searchTerm) {
    let text = '';
    let source = null;
    try {
        const q = encodeURIComponent(searchTerm);
        const ddg = await httpsGetJson(`https://api.duckduckgo.com/?q=${q}&format=json&no_redirect=1&no_html=1`);
        if (ddg?.AbstractText) {
            text = ddg.AbstractText;
            if (ddg?.AbstractURL) source = { title: ddg?.Heading || 'DuckDuckGo Abstract', url: ddg.AbstractURL };
        } else if (Array.isArray(ddg?.RelatedTopics) && ddg.RelatedTopics.length) {
            const rt = ddg.RelatedTopics.find(t => t.Text && t.FirstURL);
            if (rt) {
                text = rt.Text;
                source = { title: rt.Text.slice(0, 60) + '…', url: rt.FirstURL };
            }
        }
    } catch (e) {
        console.warn('DDG fetch failed:', e.message);
    }
    return { text, source };
}

async function webSearch(query) {
    const qLower = (query || '').toLowerCase();
    const sectionMatch = qLower.match(/\bsec(tion)?\.?\s*([0-9a-z\-]+)\b/);
    const mentionsIPC = /\bipc\b|\bbns\b|\bindian penal code\b|\bbharatiya nyaya sanhita\b/.test(qLower);
    const mentionsArticle = /\barticle\b|\bconstitution\b/.test(qLower);

    // Build candidate queries
    let candidateQueries = [];
    if (sectionMatch && !mentionsIPC && !mentionsArticle) {
        const sec = sectionMatch[2];
        // Ambiguous: try both IPC section and Constitutional article
        candidateQueries = [
            `IPC Section ${sec} (India)`,
            `Article ${sec} of the Constitution of India`
        ];
    } else {
        candidateQueries = [query];
    }

    // Always add gentle India law bias without breaking search
    candidateQueries = candidateQueries.map(s => `${s} India law`);

    let texts = [];
    let sources = [];
    for (const term of candidateQueries) {
        const [w, d] = await Promise.all([
            fetchFromWikipedia(term),
            fetchFromDDG(term)
        ]);
        const blockTexts = [w.text, d.text].filter(Boolean);
        if (blockTexts.length) {
            texts.push(`• ${term}\n${blockTexts.join('\n\n')}`);
            if (w.source) sources.push(w.source);
            if (d.source) sources.push(d.source);
        }
    }

    // If nothing found, fallback to a single generic query
    if (texts.length === 0) {
        const [w, d] = await Promise.all([
            fetchFromWikipedia(query),
            fetchFromDDG(query)
        ]);
        const blockTexts = [w.text, d.text].filter(Boolean);
        if (blockTexts.length) {
            texts.push(blockTexts.join('\n\n'));
            if (w.source) sources.push(w.source);
            if (d.source) sources.push(d.source);
        }
    }

    return { text: texts.join('\n\n'), sources };
}

// --- API Routes ---

// Root route to serve index.html
app.get('/', (req, res) => {
    console.log('📄 Serving index.html');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback response generator when API is not available
function generateFallbackResponse(query, relevantDocs) {
    const lowerQuery = query.toLowerCase();
    
    // Check for constitutional articles
    if (lowerQuery.includes('article 14') || lowerQuery.includes('article14')) {
        return `**Article 14 - Right to Equality**

Article 14 of the Indian Constitution states: "The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India."

**What this means:**
- **Equality before law**: All persons, regardless of their status, are subject to the same laws
- **Equal protection of laws**: The law must be applied equally to all persons in similar circumstances
- No discrimination based on religion, race, caste, sex, or place of birth

**Key Points:**
1. This is a fundamental right available to all persons (citizens and non-citizens)
2. It prohibits class legislation and ensures equal treatment
3. However, it allows for reasonable classification based on intelligible differentia
4. The state can make special provisions for women, children, and backward classes

**Examples of Article 14 violations:**
- Arbitrary government action without legal basis
- Discrimination in employment or services
- Unequal treatment in similar circumstances

${relevantDocs && relevantDocs.length > 0 ? '\n**Additional Legal Information:**\n' + relevantDocs.map(doc => doc.pageContent.substring(0, 200)).join('\n\n') : ''}

**Disclaimer:** This information is for general knowledge only and not a substitute for professional legal advice.`;
    }
    
    if (lowerQuery.includes('stolen') || lowerQuery.includes('theft') || lowerQuery.includes('robbery') || lowerQuery.includes('chain') || lowerQuery.includes('jewelry')) {
        return `**Theft/Robbery - Immediate Action Required**

**If your gold chain is being stolen RIGHT NOW:**
1. **Call Police immediately: 100 or 112**
2. **Do NOT chase the thief** - prioritize your safety
3. **Note down details:** thief's appearance, direction, vehicle number if any

**Legal provisions for theft:**
- **Section 378 IPC (old law)** or **Section 303 BNS (new law)**: Defines theft
- **Section 392 IPC** or **Section 309 BNS**: Robbery (theft with violence/threat)
- These are cognizable offenses - police MUST register FIR immediately

**Steps to take:**
1. **File FIR immediately** at nearest police station
2. **Provide complete details:** time, place, value of chain, circumstances
3. **Get FIR copy** - it's your legal right
4. **Insurance claim:** If insured, inform insurance company
5. **Follow up** regularly with investigating officer

**Important:** Act fast - evidence and witness memory fade quickly.

${relevantDocs && relevantDocs.length > 0 ? '\n**Additional Legal Information:**\n' + relevantDocs.map(doc => doc.pageContent.substring(0, 200)).join('\n\n') : ''}

**Disclaimer:** This information is for general knowledge only and not a substitute for professional legal advice.`;
    }
    
    if (lowerQuery.includes('fir') || lowerQuery.includes('first information report')) {
        return `**Filing an FIR (First Information Report)**

An FIR is a written document prepared by the police when they receive information about the commission of a cognizable offense. Here's what you need to know:

**How to file an FIR:**
1. Go to the nearest police station
2. Provide all details of the incident
3. The police MUST register your FIR - they cannot refuse
4. Get a free copy of the FIR
5. If police refuse, approach the Superintendent of Police or file a complaint with a Magistrate

**Important:** You have the right to file an FIR at any police station, not just the local one.

${relevantDocs && relevantDocs.length > 0 ? '\n**Additional Legal Information:**\n' + relevantDocs.map(doc => doc.pageContent.substring(0, 200)).join('\n\n') : ''}

*Note: This is general information. For specific legal advice, consult a lawyer.*`;
    }
    
    if (lowerQuery.includes('bail') || lowerQuery.includes('arrest')) {
        return `**Rights During Arrest and Bail**

**Your rights when arrested:**
1. Right to be informed of grounds for arrest
2. Right to remain silent
3. Right to legal representation
4. Right to inform family/friends
5. Right to medical examination if injured

**About Bail:**
- Bail is your right, not a privilege
- For most offenses, bail should be granted
- You can apply for bail immediately after arrest
- If denied, you can approach higher courts

${relevantDocs && relevantDocs.length > 0 ? '\n**Additional Legal Context:**\n' + relevantDocs.map(doc => doc.pageContent.substring(0, 200)).join('\n\n') : ''}

*Note: This is general information. For specific legal advice, consult a lawyer.*`;
    }
    
    if (lowerQuery.includes('domestic violence') || lowerQuery.includes('harassment')) {
        return `**Domestic Violence and Harassment**

**Immediate steps:**
1. Ensure your safety first
2. Call Women Helpline: 181 or 1091
3. File a complaint with police
4. Seek medical help if injured
5. Document all incidents

**Legal remedies:**
- Protection of Women from Domestic Violence Act (PWDVA)
- File FIR for criminal offenses
- Approach NCW (National Commission for Women)
- Get legal aid from NALSA

${relevantDocs && relevantDocs.length > 0 ? '\n**Additional Information:**\n' + relevantDocs.map(doc => doc.pageContent.substring(0, 200)).join('\n\n') : ''}

*Note: This is general information. For specific legal advice, consult a lawyer.*`;
    }
    
    // Generic response
    return `**Legal Information - ${query}**

I understand you're asking about: "${query}"

Based on your query, here are some general legal principles:

**Key Points:**
- Every citizen has fundamental rights under the Constitution
- Right to equality, life, liberty, and legal remedies
- Access to courts and legal aid
- Right to fair trial and legal representation

**What you can do:**
1. Consult a qualified lawyer for specific advice
2. Contact Legal Services Authority for free legal aid
3. File appropriate complaints with relevant authorities
4. Know your constitutional rights

${relevantDocs && relevantDocs.length > 0 ? '\n**Relevant Legal Information:**\n' + relevantDocs.map(doc => doc.pageContent.substring(0, 300)).join('\n\n---\n\n') : ''}

**Helplines:**
- National Legal Services Authority: www.nalsa.gov.in
- Women Helpline: 181
- Cyber Crime: 1930
- Emergency: 112

*Note: This is general information only. For specific legal advice tailored to your situation, please consult a qualified lawyer.*`;
}


// Unified streaming chat handler for Groq SDK
async function handleStreamingGroqChat(req, res) {
    const userQuery = req.body.query || "";
    const file = req.file;
    let fileContent = "";
    let context = "";

    console.log(`📝 Chat request: Query="${userQuery.substring(0, 50)}..."`, file ? `File=${file.originalname}` : '');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');

    try {
        if (file) {
            // File processing logic
            if (file.mimetype === 'application/pdf') {
                const dataBuffer = fs.readFileSync(file.path);
                fileContent = (await pdf(dataBuffer)).text;
            } else {
                fileContent = fs.readFileSync(file.path, 'utf8');
            }
            fs.unlinkSync(file.path);
            // Keep document analysis only if user actually uploaded a file
            context += `[DOCUMENT ANALYSIS]:\n${fileContent.substring(0, 2000)}...\n\n`;
        }

        // Internet-backed context (preferred)
        const web = await webSearch(userQuery);
        if (web?.text) {
            const clipped = web.text.slice(0, 2000);
            const sourcesBlock = (web.sources || []).slice(0, 3).map((s, i) => `- ${s.title}: ${s.url}`).join('\n');
            context += `[WEB CONTEXT]\n${clipped}\n\n[SOURCES]\n${sourcesBlock}\n\n`;
        }

        // Optional: only fall back to local RAG if web gave nothing
        let relevantDocs = [];
        if ((!web || !web.text) && typeof findRelevantDocuments === 'function') {
            const ragQuery = userQuery || `Summarize this document: ${fileContent.substring(0, 500)}`;
            relevantDocs = await findRelevantDocuments(ragQuery, 3);
            if (relevantDocs && relevantDocs.length > 0) {
                context += `[LEGAL CONTEXT]\n` + relevantDocs.map(doc => doc.pageContent).join('\n\n---\n\n');
            }
        }

    const finalUserPrompt = `${context}\n\n**User Question:** "${userQuery}"`;

        // Fallback if no Groq API key: Answer from internet in simple language with sources
        if (GROQ_API_KEY === 'dummy-key' || !GROQ_API_KEY) {
            let answer = '';
            try {
                const webOnly = await webSearch(userQuery);
                if (webOnly?.text) {
                    const sources = (webOnly.sources || []).slice(0, 3).map(s => `- ${s.title}: ${s.url}`).join('\n');
                    answer = `Here is a simple explanation based on what I found online:\n\n${webOnly.text.slice(0, 1500)}\n\nSources:\n${sources || '- (No direct sources found)'}\n\n**Disclaimer:** This information is for general knowledge only and not a substitute for professional legal advice.`;
                } else {
                    answer = `I tried to look up current information online, but couldn't find a clear result right now.\n\nPlease try rephrasing the question with a bit more detail (for example, mention the law/section or your exact situation).\n\n**Disclaimer:** This information is for general knowledge only and not a substitute for professional legal advice.`;
                }
            } catch (e) {
                console.warn('Web fallback failed:', e.message);
                const fallbackResponse = generateFallbackResponse(userQuery, []);
                answer = fallbackResponse;
            }
            for (let i = 0; i < answer.length; i += 10) {
                const chunk = answer.substring(i, i + 10);
                res.write(chunk);
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            res.end();
            return;
        }

        // Use Groq SDK for streaming
        const groq = new Groq({ apiKey: GROQ_API_KEY });
        const stream = await groq.chat.completions.create({
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: finalUserPrompt }
            ],
            model: "llama-3.1-8b-instant", // Current supported model
            stream: true,
        });

        for await (const chunk of stream) {
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
                res.write(content);
            }
        }
        res.end();
    } catch (error) {
        console.error('❌ Error in chat handler:', error);
        if (!res.headersSent) {
            res.status(500).send('An internal server error occurred.');
        } else {
            res.end();
        }
    }
}

// Unified streaming chat handler for Groq
app.post('/api/chat', upload.single('document'), handleStreamingGroqChat);
// Removed /api/chat-simple route

/**
 * Document generation endpoint - creates PDFs for legal documents
 */
app.post('/api/generate-doc', async (req, res) => {
    try {
        const { type, ...data } = req.body;
        
        console.log(`📄 Generating AI-formatted document: ${type}`);
        console.log(`📄 Document data received:`, JSON.stringify(data).substring(0, 200) + '...');
        
        if (!type) {
            console.error('❌ Document generation failed: No document type provided');
            return res.status(400).json({ 
                success: false,
                error: 'Document type is required' 
            });
        }

        // Use AI-powered document generator with Indian legal formatting
        const result = await generateLegalDocument(type, data);

        if (!result.success) {
            throw new Error(result.error || 'Failed to generate document');
        }

        const filename = `${type.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
        const filepath = path.join(__dirname, 'generated_docs', filename);
        
        // Ensure directory exists
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Create PDF from AI-generated content
        const doc = new PDFDocument({ 
            margin: 50,
            size: 'A4',
            bufferPages: true
        });
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);
        
        // Parse AI-generated content and format it for PDF
        // Split content into paragraphs and identify different sections
        const content = result.content;
        const lines = content.split('\n');
        
        lines.forEach(line => {
            const trimmedLine = line.trim();
            
            if (!trimmedLine) {
                doc.moveDown(0.5);
                return;
            }
            
            // Detect titles (all caps or starts with specific keywords)
            if (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3 && trimmedLine.length < 100) {
                doc.fontSize(14)
                   .font('Helvetica-Bold')
                   .text(trimmedLine, { align: 'center' })
                   .moveDown(1);
            }
            // Detect section headers (numbered or starting with keywords)
            else if (/^(\d+\.|Subject:|To,|Date:|From:|Name:|Address:|PRAYER|MOST RESPECTFULLY|BEFORE THE)/i.test(trimmedLine)) {
                doc.fontSize(11)
                   .font('Helvetica-Bold')
                   .text(trimmedLine, { align: 'left' })
                   .moveDown(0.5);
            }
            // Detect signature/closing section
            else if (/^(Yours |Respectfully|Sincerely|Signature|Place:|Date:)/i.test(trimmedLine)) {
                doc.fontSize(11)
                   .font('Helvetica')
                   .text(trimmedLine, { align: 'left' })
                   .moveDown(0.3);
            }
            // Regular body text
            else {
                doc.fontSize(11)
                   .font('Helvetica')
                   .text(trimmedLine, { align: 'justify', lineGap: 2 })
                   .moveDown(0.5);
            }
        });
        
        // Add footer
        doc.moveDown(2)
           .fontSize(9)
           .font('Helvetica-Oblique')
           .text('Generated by Nyay-mitra Legal Assistant', { align: 'center' })
           .text('This is an AI-generated document following Indian legal standards.', { align: 'center' })
           .text('Please review and consult a legal professional before use.', { align: 'center' });
        
        doc.end();

        // Wait for file to be written
        stream.on('finish', () => {
            console.log(`✅ AI-formatted document generated: ${filename}`);
            res.json({ 
                success: true,
                message: 'Document generated successfully with AI formatting',
                filename: filename,
                previewUrl: `/api/preview-doc/${filename}`,
                downloadUrl: `/api/download-doc/${filename}`,
                type: type,
                documentType: result.documentType,
                metadata: result.metadata
            });
        });

        stream.on('error', (error) => {
            console.error('❌ Error writing document:', error);
            res.status(500).json({ error: 'Failed to save document' });
        });
        
    } catch (error) {
        console.error('❌ Error generating document:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to generate document',
            details: error.message 
        });
    }
});

/**
 * Get available document types
 */
app.get('/api/document-types', (req, res) => {
    try {
        const types = getDocumentTypes();
        res.json({
            success: true,
            documentTypes: types
        });
    } catch (error) {
        console.error('❌ Error fetching document types:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch document types'
        });
    }
});

/**
 * Get template structure for a specific document type
 */
app.get('/api/document-template/:type', (req, res) => {
    try {
        const { type } = req.params;
        const template = getTemplateStructure(type);
        
        if (!template) {
            return res.status(404).json({
                success: false,
                error: 'Document type not found'
            });
        }
        
        res.json({
            success: true,
            template: template
        });
    } catch (error) {
        console.error('❌ Error fetching template:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch template'
        });
    }
});

/**
 * Document preview endpoint - serves PDF for viewing in browser
 */
app.get('/api/preview-doc/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filepath = path.join(__dirname, 'generated_docs', filename);
        
        console.log(`🔍 Preview document request for: ${filename}`);
        console.log(`🔍 Looking for file at: ${filepath}`);
        
        if (!fs.existsSync(filepath)) {
            console.error(`❌ Document not found: ${filepath}`);
            return res.status(404).json({ error: 'Document not found' });
        }
        
        console.log(`✅ Document found: ${filepath}, sending for preview`);
        
    // Set headers for PDF viewing in browser
    const stats = fs.statSync(filepath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);
    // Note: We are not implementing range requests; PDF.js will fall back to full fetch
        
        // Stream the file
        const fileStream = fs.createReadStream(filepath);
        fileStream.pipe(res);
        
    } catch (error) {
        console.error('❌ Error previewing document:', error);
        res.status(500).json({ error: 'Failed to preview document' });
    }
});

// HEAD endpoint to allow clients to check availability before fetching full PDF
app.head('/api/preview-doc/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filepath = path.join(__dirname, 'generated_docs', filename);

        if (!fs.existsSync(filepath)) {
            return res.sendStatus(404);
        }

        const stats = fs.statSync(filepath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.setHeader('Content-Length', stats.size);
        return res.sendStatus(200);
    } catch (error) {
        console.error('❌ Error handling HEAD for preview:', error);
        return res.sendStatus(500);
    }
});

/**
 * Document download endpoint - forces download
 */
app.get('/api/download-doc/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filepath = path.join(__dirname, 'generated_docs', filename);
        
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Stream the file
        const fileStream = fs.createReadStream(filepath);
        fileStream.pipe(res);
        
        // Delete file after download
        fileStream.on('end', () => {
            // Delete the file after a small delay to ensure complete download
            setTimeout(() => {
                try {
                    fs.unlinkSync(filepath);
                    console.log(`✅ Document deleted after download: ${filename}`);
                } catch (err) {
                    console.error(`❌ Error deleting document: ${filename}`, err);
                }
            }, 1000);
        });
        
    } catch (error) {
        console.error('❌ Error downloading document:', error);
        res.status(500).json({ error: 'Failed to download document' });
    }
});

/**
 * List generated documents endpoint
 */
app.get('/api/list-docs', (req, res) => {
    try {
        const docsDir = path.join(__dirname, 'generated_docs');
        
        if (!fs.existsSync(docsDir)) {
            return res.json({ documents: [] });
        }
        
        const files = fs.readdirSync(docsDir)
            .filter(file => file.endsWith('.pdf'))
            .map(file => {
                const stats = fs.statSync(path.join(docsDir, file));
                return {
                    filename: file,
                    created: stats.birthtime,
                    size: stats.size,
                    previewUrl: `/api/preview-doc/${file}`,
                    downloadUrl: `/api/download-doc/${file}`
                };
            })
            .sort((a, b) => b.created - a.created); // Sort by newest first
            
        res.json({ documents: files });
        
    } catch (error) {
        console.error('❌ Error listing documents:', error);
        res.status(500).json({ error: 'Failed to list documents' });
    }
});

// --- Document Generation Helpers ---

function generateRTIApplication(doc, data) {
    const { department = '', address = '', information = '', applicantName = '', applicantAddress = '', mobile = '' } = data;
    
    doc.text(`To,`)
       .text(`The Public Information Officer (PIO)`)
       .text(`${department}`)
       .text(`${address}`)
       .moveDown()
       .text(`Subject: Application under the Right to Information Act, 2005`)
       .moveDown()
       .text(`Sir/Madam,`)
       .moveDown()
       .text(`I am a citizen of India and hereby request the following information under the Right to Information Act, 2005:`)
       .moveDown()
       .text(`${information}`)
       .moveDown()
       .text(`I am attaching the application fee of Rs. 10/- as required under the Act.`)
       .moveDown()
       .text(`Please provide the information within the stipulated time frame of 30 days.`)
       .moveDown(2)
       .text(`Yours faithfully,`)
       .moveDown()
       .text(`${applicantName}`)
       .text(`${applicantAddress}`)
       .text(`Mobile: ${mobile}`)
       .text(`Date: ${new Date().toLocaleDateString('en-IN')}`);
}

function generateComplaintLetter(doc, data) {
    const { authority = '', issue = '', details = '', relief = '', complainantName = '', complainantAddress = '', mobile = '' } = data;
    
    doc.text(`To,`)
       .text(`${authority}`)
       .moveDown()
       .text(`Subject: Complaint regarding ${issue}`)
       .moveDown()
       .text(`Sir/Madam,`)
       .moveDown()
       .text(`I am writing to bring to your attention the following matter:`)
       .moveDown()
       .text(`${details}`)
       .moveDown()
       .text(`I request you to kindly:`)
       .text(`${relief}`)
       .moveDown()
       .text(`I hope for a prompt resolution of this matter.`)
       .moveDown(2)
       .text(`Thanking you,`)
       .moveDown()
       .text(`${complainantName}`)
       .text(`${complainantAddress}`)
       .text(`Mobile: ${mobile}`)
       .text(`Date: ${new Date().toLocaleDateString('en-IN')}`);
}

function generateAffidavit(doc, data) {
    const { deponentName = '', fatherName = '', address = '', statements = '', purpose = '', age = '' } = data;
    
    doc.fontSize(16).font('Helvetica-Bold').text('AFFIDAVIT', { align: 'center' })
       .moveDown(2)
       .fontSize(12).font('Helvetica')
       .text(`I, ${deponentName}, son/daughter of ${fatherName}, aged ${age} years, resident of ${address}, do hereby solemnly affirm and declare as under:`)
       .moveDown()
       .text('1. That I am the deponent herein and I am competent to make this affidavit.')
       .moveDown()
       .text(`2. That the purpose of this affidavit is ${purpose}.`)
       .moveDown()
       .text('3. That the facts stated herein are true and correct to the best of my knowledge and belief:')
       .moveDown()
       .text(statements || 'No specific statements provided.')
       .moveDown()
       .text('4. That I have not concealed any material fact and nothing stated above is false.')
       .moveDown(2)
       .text('I do hereby solemnly affirm that the contents of this affidavit are true and correct and nothing material has been concealed therefrom.')
       .moveDown(2)
       .text('Place: ________________')
       .text(`Date: ${new Date().toLocaleDateString('en-IN')}`)
       .moveDown(2)
       .text('_____________________')
       .text(`(${deponentName})`)
       .text('Deponent')
       .moveDown(2)
       .fontSize(10)
       .text('VERIFICATION: I, the above-named deponent, do hereby verify that the contents of this affidavit are true and correct to the best of my knowledge and belief and no part of it is false and nothing material has been concealed.')
       .moveDown()
       .text('_____________________')
       .text(`(${deponentName})`)
       .text('Deponent');
}

function generateFIRApplication(doc, data) {
    const { complainantName = '', complainantAddress = '', mobile = '', incident = '', 
            incidentDate = '', incidentPlace = '', accusedDetails = '', witnessDetails = '' } = data;
    
    doc.fontSize(16).font('Helvetica-Bold').text('APPLICATION FOR FILING FIR', { align: 'center' })
       .moveDown(2)
       .fontSize(12).font('Helvetica')
       .text('To,')
       .text('The Station House Officer (SHO)')
       .text('Police Station: ________________')
       .text('District: ________________')
       .moveDown()
       .text('Subject: Request to file FIR for cognizable offense')
       .moveDown()
       .text('Respected Sir/Madam,')
       .moveDown()
       .text(`I, ${complainantName}, residing at ${complainantAddress}, Mobile: ${mobile}, hereby request you to kindly register an FIR for the following incident:`)
       .moveDown()
       .text(`Date of Incident: ${incidentDate}`)
       .text(`Place of Incident: ${incidentPlace}`)
       .moveDown()
       .text('Details of the Incident:')
       .text(incident)
       .moveDown()
       .text('Details of Accused (if known):')
       .text(accusedDetails || 'Unknown/To be investigated')
       .moveDown()
       .text('Witness Details:')
       .text(witnessDetails || 'To be provided during investigation')
       .moveDown()
       .text('I request you to kindly register the FIR and start the investigation immediately.')
       .moveDown(2)
       .text('Thanking you,')
       .moveDown()
       .text(`${complainantName}`)
       .text(`Mobile: ${mobile}`)
       .text(`Date: ${new Date().toLocaleDateString('en-IN')}`);
}

function generateBailApplication(doc, data) {
    const { applicantName = '', fatherName = '', address = '', caseNumber = '', 
            court = '', chargesDetails = '', groundsForBail = '', suretyDetails = '' } = data;
    
    doc.fontSize(16).font('Helvetica-Bold').text('BAIL APPLICATION', { align: 'center' })
       .moveDown(2)
       .fontSize(12).font('Helvetica')
       .text(`IN THE COURT OF ${court}`)
       .moveDown()
       .text(`Case No: ${caseNumber}`)
       .moveDown()
       .text(`${applicantName} ... Applicant`)
       .text('Vs.')
       .text('State ... Respondent')
       .moveDown(2)
       .text('MOST RESPECTFULLY SHEWETH:')
       .moveDown()
       .text(`1. That the applicant ${applicantName}, son of ${fatherName}, resident of ${address}, is an undertrial prisoner in the above case.`)
       .moveDown()
       .text('2. That the applicant has been falsely implicated in this case.')
       .moveDown()
       .text(`3. That the charges against the applicant are: ${chargesDetails}`)
       .moveDown()
       .text('4. That the applicant is innocent and has been falsely implicated.')
       .moveDown()
       .text('5. That the grounds for bail are:')
       .text(groundsForBail)
       .moveDown()
       .text(`6. That the applicant is ready to furnish surety: ${suretyDetails}`)
       .moveDown()
       .text('7. That the applicant undertakes not to tamper with evidence or influence witnesses.')
       .moveDown(2)
       .text('PRAYER: It is therefore most respectfully prayed that this Hon\'ble Court may be pleased to grant bail to the applicant.')
       .moveDown(2)
       .text(`Applicant`)
       .text(`Through: Advocate`)
       .text(`Date: ${new Date().toLocaleDateString('en-IN')}`);
}

function generateConsumerComplaint(doc, data) {
    const { complainantName = '', complainantAddress = '', mobile = '', oppositeParty = '', 
            deficiency = '', relief = '', amount = '', billDetails = '' } = data;
    
    doc.fontSize(16).font('Helvetica-Bold').text('CONSUMER COMPLAINT', { align: 'center' })
       .moveDown(2)
       .fontSize(12).font('Helvetica')
       .text('BEFORE THE DISTRICT CONSUMER DISPUTES REDRESSAL FORUM')
       .moveDown(2)
       .text(`${complainantName}`)
       .text(`${complainantAddress}`)
       .text(`Mobile: ${mobile}`)
       .text('... Complainant')
       .moveDown()
       .text('Vs.')
       .moveDown()
       .text(`${oppositeParty}`)
       .text('... Opposite Party')
       .moveDown(2)
       .text('COMPLAINT UNDER CONSUMER PROTECTION ACT, 2019')
       .moveDown()
       .text('MOST RESPECTFULLY SHEWETH:')
       .moveDown()
       .text('1. That the complainant purchased goods/availed services from the opposite party.')
       .moveDown()
       .text(`2. Bill/Receipt Details: ${billDetails}`)
       .moveDown()
       .text('3. That there was deficiency in service/defect in goods as follows:')
       .text(deficiency)
       .moveDown()
       .text('4. That despite complaints, the opposite party failed to rectify the deficiency.')
       .moveDown()
       .text('5. That the complainant has suffered mental agony and financial loss.')
       .moveDown()
       .text('PRAYER: It is therefore prayed that this Hon\'ble Forum may:')
       .text(`a) Direct the opposite party to pay compensation of Rs. ${amount}`)
       .text('b) ' + relief)
       .text('c) Award cost of litigation')
       .moveDown(2)
       .text(`(${complainantName})`)
       .text('Complainant')
       .text(`Date: ${new Date().toLocaleDateString('en-IN')}`);
}

function generateDivorcePetition(doc, data) {
    const { petitionerName = '', respondentName = '', marriageDate = '', 
            groundsForDivorce = '', childrenDetails = '', propertyDetails = '' } = data;
    
    doc.fontSize(16).font('Helvetica-Bold').text('DIVORCE PETITION', { align: 'center' })
       .moveDown(2)
       .fontSize(12).font('Helvetica')
       .text('IN THE FAMILY COURT')
       .moveDown(2)
       .text(`${petitionerName} ... Petitioner`)
       .text('Vs.')
       .text(`${respondentName} ... Respondent`)
       .moveDown(2)
       .text('PETITION FOR DIVORCE')
       .moveDown()
       .text('TO THE HON\'BLE COURT:')
       .moveDown()
       .text(`1. That the petitioner and respondent were married on ${marriageDate}.`)
       .moveDown()
       .text('2. That the marriage has irretrievably broken down.')
       .moveDown()
       .text('3. That the grounds for divorce are:')
       .text(groundsForDivorce)
       .moveDown()
       .text(`4. Children from the marriage: ${childrenDetails || 'None'}`)
       .moveDown()
       .text(`5. Property details: ${propertyDetails || 'To be settled mutually'}`)
       .moveDown()
       .text('6. That there is no possibility of reconciliation.')
       .moveDown(2)
       .text('PRAYER: It is prayed that this Hon\'ble Court may grant a decree of divorce.')
       .moveDown(2)
       .text(`(${petitionerName})`)
       .text('Petitioner')
       .text(`Date: ${new Date().toLocaleDateString('en-IN')}`);
}

function generateGenericDocument(doc, type, data) {
    const { title = type, content = '', authorName = '', date = new Date().toLocaleDateString('en-IN') } = data;
    
    doc.fontSize(16).font('Helvetica-Bold').text(title.toUpperCase(), { align: 'center' })
       .moveDown(2)
       .fontSize(12).font('Helvetica');
    
    if (content) {
        // Split content into paragraphs and format
        const paragraphs = content.split('\n\n');
        paragraphs.forEach(paragraph => {
            doc.text(paragraph, { align: 'justify' }).moveDown();
        });
    } else {
        doc.text('This is a generic document template. Please provide specific content for your document.')
           .moveDown()
           .text('Key sections to include:')
           .text('• Purpose of the document')
           .text('• Relevant facts and details')
           .text('• Legal provisions (if applicable)')
           .text('• Prayer/Relief sought')
           .text('• Signature and date');
    }
    
    doc.moveDown(2)
       .text(`Author: ${authorName || 'Not specified'}`)
       .text(`Date: ${date}`);
}

// --- Start Server ---
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    console.error(err.stack);
    // Don't exit to keep server running for debugging
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    if (reason instanceof Error) {
        console.error(reason.stack);
    }
});

// --- Document Cleanup Function ---
function cleanupOldDocuments() {
    try {
        const docsDir = path.join(__dirname, 'generated_docs');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir, { recursive: true });
            return;
        }
        
        // Get all files in the generated_docs directory
        const files = fs.readdirSync(docsDir);
        const now = Date.now();
        let deletedCount = 0;
        
        files.forEach(file => {
            const filepath = path.join(docsDir, file);
            const stats = fs.statSync(filepath);
            
            // If file is older than 24 hours (86400000 ms), delete it
            if (now - stats.mtime.getTime() > 86400000) {
                try {
                    fs.unlinkSync(filepath);
                    deletedCount++;
                } catch (err) {
                    console.error(`❌ Error deleting old document: ${file}`, err);
                }
            }
        });
        
        if (deletedCount > 0) {
            console.log(`🧹 Cleanup: Removed ${deletedCount} old documents`);
        }
    } catch (error) {
        console.error('❌ Error during document cleanup:', error);
    }
}

try {
    const server = app.listen(port, '0.0.0.0', () => {
        console.log(`🚀 Nyay-mitra server running at http://localhost:${port}`);
        console.log(`💻 Groq API: ${GROQ_API_KEY ? 'Configured' : 'Missing'}`);
        console.log(`📂 Serving static files from: ${path.join(__dirname, 'public')}`);
        
        // Run cleanup at startup
        cleanupOldDocuments();
        
        // Schedule cleanup to run every hour
        setInterval(cleanupOldDocuments, 3600000);
    });
    
    // Monitor server errors
    server.on('error', (err) => {
        console.error('❌ Server error:', err);
        if (err.code === 'EADDRINUSE') {
            console.error(`Port ${port} is already in use. Try a different port.`);
        }
    });
} catch (err) {
    console.error('❌ Error starting server:', err);
}