const PDFDocument = require('pdfkit');
const fs = require('fs');

function formatToMarkdown(sections) {
    return sections.map(section => `## ${section.title}\n\n${section.content}`).join('\n\n');
}

function exportToPDF(documentContent, outputPath) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(outputPath);
        
        doc.pipe(stream);
        doc.text(documentContent);
        doc.end();

        stream.on('finish', () => resolve(outputPath));
        stream.on('error', (err) => reject(err));
    });
}

module.exports = {
    formatToMarkdown,
    exportToPDF,
};
