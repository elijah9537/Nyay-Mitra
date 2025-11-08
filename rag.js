const fs = require('fs');
const path = require('path');

let vectorStore = null;
let isInitialized = false;
let legalData = '';

/**
 * Initialize the RAG system with a simple text-based approach
 * Falls back to simple text search if vector embeddings fail
 */
async function initializeRAG() {
    if (isInitialized) return;
    
    try {
        console.log('Initializing RAG system...');
        
        // Read legal knowledge base
        const dataPath = path.join(__dirname, 'legal_data.txt');
        if (!fs.existsSync(dataPath)) {
            console.warn('legal_data.txt not found, creating empty knowledge base');
            legalData = '';
            isInitialized = true;
            return;
        }
        
        legalData = fs.readFileSync(dataPath, 'utf8');
        console.log(`RAG system initialized with simple text search (${legalData.length} characters)`);
        
    } catch (error) {
        console.error('Error initializing RAG system:', error.message);
        legalData = '';
    }
    
    isInitialized = true;
}

/**
 * Find relevant documents using improved text search
 * @param {string} query - The search query
 * @param {number} k - Number of documents to return (default: 4)
 * @returns {Promise<Array<{ pageContent: string, metadata?: object }>>}
 */
async function findRelevantDocuments(query, k = 4) {
    if (!isInitialized) {
        await initializeRAG();
    }
    
    try {
        if (!legalData.trim()) {
            return [{ pageContent: 'No legal data available.' }];
        }
        
        const queryLower = query.toLowerCase();
        
        // Split into meaningful sections (by articles, laws, cases)
        const sections = legalData.split(/(?=Article \d+|Section \d+|In simple terms:|^[A-Z][^.]*v\.|Consumer Protection Act|Cyberbullying|Property Disputes|Women's Safety|Basic Labour)/m)
            .filter(section => section.trim().length > 100); // Only meaningful sections
        
        console.log(`RAG: Searching ${sections.length} sections for: "${query.substring(0, 50)}..."`);
        
        // Enhanced scoring algorithm
        const scoredSections = sections.map((section, index) => {
            const sectionLower = section.toLowerCase();
            let score = 0;
            
            // 1. Exact phrase matching (highest weight)
            if (sectionLower.includes(queryLower)) {
                score += 50;
            }
            
            // 2. Important legal terms matching
            const legalTerms = ['article', 'section', 'act', 'constitution', 'law', 'right', 'code'];
            const queryWords = queryLower.split(/\s+/);
            
            queryWords.forEach(word => {
                if (word.length > 2) {
                    // Higher score for exact word matches
                    const wordRegex = new RegExp(`\\b${word}\\b`, 'g');
                    const exactMatches = (sectionLower.match(wordRegex) || []).length;
                    score += exactMatches * 10;
                    
                    // Lower score for partial matches
                    const partialMatches = (sectionLower.match(new RegExp(word, 'g')) || []).length - exactMatches;
                    score += partialMatches * 2;
                    
                    // Bonus for legal terms
                    if (legalTerms.includes(word)) {
                        score += 5;
                    }
                }
            });
            
            // 3. Title/header matching (sections that start with relevant terms)
            const firstLine = section.split('\n')[0].toLowerCase();
            queryWords.forEach(word => {
                if (word.length > 2 && firstLine.includes(word)) {
                    score += 15;
                }
            });
            
            // 4. Special bonus for "In simple terms" sections if query asks for explanation
            if (queryLower.includes('what is') || queryLower.includes('explain') || queryLower.includes('meaning')) {
                if (sectionLower.includes('in simple terms:')) {
                    score += 20;
                }
            }
            
            return { section: section.trim(), score, index };
        })
        .filter(item => item.score > 0) // Only return sections with some relevance
        .sort((a, b) => b.score - a.score)
        .slice(0, k);
        
        console.log(`RAG: Found ${scoredSections.length} relevant sections with scores:`, 
                   scoredSections.map(s => s.score));
        
        if (scoredSections.length === 0) {
            // Smart fallback: try to find sections with any query words
            const fallbackSections = sections
                .map((section, index) => ({ section: section.trim(), score: 0, index }))
                .filter(item => {
                    const sectionLower = item.section.toLowerCase();
                    return queryLower.split(/\s+/).some(word => 
                        word.length > 2 && sectionLower.includes(word)
                    );
                })
                .slice(0, Math.min(k, 2)); // Limit fallback results
            
            if (fallbackSections.length > 0) {
                console.log(`RAG: Using fallback search, found ${fallbackSections.length} sections`);
                return fallbackSections.map((item, index) => ({
                    pageContent: item.section,
                    metadata: { source: 'legal_data.txt', chunkId: item.index, score: 0, type: 'fallback' }
                }));
            }
            
            // Last resort: return a helpful message instead of all data
            return [{
                pageContent: `I couldn't find specific information about "${query}" in the legal database. Please try rephrasing your question or ask about specific articles, laws, or legal concepts.`,
                metadata: { source: 'system', type: 'no_results' }
            }];
        }
        
        return scoredSections.map((item, index) => ({
            pageContent: item.section,
            metadata: { 
                source: 'legal_data.txt', 
                chunkId: item.index, 
                score: item.score,
                relevanceRank: index + 1
            }
        }));
        
    } catch (error) {
        console.error('Error in findRelevantDocuments:', error.message);
        return [{
            pageContent: 'Sorry, there was an error searching the legal database. Please try again.',
            metadata: { source: 'system', type: 'error' }
        }];
    }
}

// Initialize RAG system when module is imported
initializeRAG().catch(console.error);

module.exports = { findRelevantDocuments, initializeRAG };
