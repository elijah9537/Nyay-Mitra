const fs = require('fs').promises;
const path = require('path');
const { generateOutline, generateSectionContent } = require('./services/aiService');
const { formatToMarkdown } = require('./utils/formatters');

const outlinesDir = path.join(__dirname, 'outlines');

async function getOutline(documentType) {
    try {
        const outlinePath = path.join(outlinesDir, `${documentType}.json`);
        const data = await fs.readFile(outlinePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // If outline file doesn't exist or is invalid, generate one with AI
        if (error.code === 'ENOENT') {
            console.log(`No outline found for "${documentType}". Generating with AI.`);
            return generateOutline(documentType);
        }
        console.error('Error reading outline file:', error);
        return null;
    }
}

async function generateDocument(type, userDetails, customization = {}) {
    const outline = await getOutline(type);

    if (!outline || !Array.isArray(outline)) {
        return "Error: Could not generate or retrieve a valid document outline.";
    }

    const documentSections = [];

    for (const sectionTitle of outline) {
        const content = await generateSectionContent(type, sectionTitle, userDetails, customization);
        documentSections.push({ title: sectionTitle, content });
    }

    const fullDocument = formatToMarkdown(documentSections);
    return fullDocument;
}

module.exports = {
    generateDocument,
};
