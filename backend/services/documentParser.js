const mammoth = require('mammoth');
const { PDFParse } = require('pdf-parse');

/**
 * Parses resume documents (PDF, DOCX, TXT) and analyzes structural anomalies for ATS compatibility.
 */
async function parseDocument(fileBuffer, mimeType = '', filename = '') {
    let rawText = '';
    let pageCount = 1;
    let formatAnomalies = [];
    let detectedTables = false;

    const lowerName = (filename || '').toLowerCase();
    const isPdf = mimeType.includes('pdf') || lowerName.endsWith('.pdf');
    const isDocx = mimeType.includes('word') || mimeType.includes('officedocument') || lowerName.endsWith('.docx') || lowerName.endsWith('.doc');

    if (isPdf && fileBuffer) {
        try {
            const parser = new PDFParse({ data: fileBuffer });
            const textResult = await parser.getText();
            rawText = typeof textResult === 'string' ? textResult : (textResult?.text || '');
            
            try {
                const info = await parser.getInfo();
                if (info && info.numPages) {
                    pageCount = info.numPages;
                }
            } catch (e) {
                // Ignore info retrieval errors
            }

            try {
                const tables = await parser.getPageTables();
                if (tables && tables.length > 0) {
                    detectedTables = true;
                }
            } catch (e) {
                // Ignore table detection errors
            }

            await parser.destroy().catch(() => {});
        } catch (pdfErr) {
            console.warn('PDFParse primary parse failed, using binary text fallback:', pdfErr.message);
            // Fallback plain string regex extraction for resilient parsing
            const bufferStr = fileBuffer.toString('utf-8');
            const cleanMatches = bufferStr.match(/[\x20-\x7E\t\n\r]{4,}/g);
            rawText = cleanMatches ? cleanMatches.join('\n') : '';
        }
    } else if (isDocx && fileBuffer) {
        try {
            const mammothResult = await mammoth.extractRawText({ buffer: fileBuffer });
            rawText = mammothResult.value || '';
        } catch (docxErr) {
            console.warn('Mammoth docx parse error:', docxErr.message);
            rawText = fileBuffer.toString('utf-8');
        }
    } else if (fileBuffer) {
        rawText = fileBuffer.toString('utf-8');
    }

    // Normalize text
    const cleanText = rawText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\u0000/g, '')
        .trim();

    const words = cleanText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    if (!pageCount || pageCount === 1) {
        pageCount = Math.max(1, Math.ceil(wordCount / 450));
    }

    // 1. Detect image-only / scanned resume
    const isScanned = cleanText.length < 80 || (pageCount > 1 && wordCount / pageCount < 30);
    if (isScanned) {
        formatAnomalies.push({
            type: 'scanned_image',
            severity: 'critical',
            message: 'Image-only or scanned PDF detected. ATS parsers cannot extract text from raster images.'
        });
    }

    // 2. Detect multi-column layouts (checking for recurring wide spacing between text blocks)
    const lines = cleanText.split('\n');
    let multiColumnLineHits = 0;
    for (const line of lines) {
        if (/\S\s{6,}\S/.test(line)) {
            multiColumnLineHits++;
        }
    }
    if (multiColumnLineHits >= 4) {
        formatAnomalies.push({
            type: 'multi_column',
            severity: 'warning',
            message: 'Multi-column layout detected. ATS software often reads two-column layouts horizontally across columns, scrambling content.'
        });
    }

    // 3. Detect complex tables
    let tableLineHits = 0;
    for (const line of lines) {
        if (/\|.*\|/.test(line) || /\t.*\t/.test(line)) {
            tableLineHits++;
        }
    }
    if (detectedTables || tableLineHits >= 3) {
        formatAnomalies.push({
            type: 'table_layout',
            severity: 'warning',
            message: 'Tables detected. Complex tables may be stripped or merged improperly by standard ATS systems.'
        });
    }

    // 4. Detect text boxes or floating blocks
    const shortFragmentCount = lines.filter(l => l.trim().length > 0 && l.trim().length < 8).length;
    if (shortFragmentCount > 15 && lines.length > 30) {
        formatAnomalies.push({
            type: 'text_boxes',
            severity: 'notice',
            message: 'Isolated text fragments detected, which frequently indicates text boxes or graphical shapes.'
        });
    }

    return {
        text: cleanText,
        wordCount,
        pageCount,
        isScanned,
        formatAnomalies
    };
}

module.exports = {
    parseDocument
};
