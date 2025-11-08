const { HfInference } = require('@huggingface/inference');

const hf = new HfInference();
// You can use HF without an API token for some models, but with limited rate
// If you want higher limits, get a free token from huggingface.co
const HF_TOKEN = process.env.HF_TOKEN;

async function generateOutline(documentType) {
    const prompt = `Generate a structured outline in JSON format for a legal document of type "${documentType}". The outline should be an array of strings, where each string is a section title. For example: ["Introduction", "Body", "Conclusion"].`;

    try {
        const response = await hf.textGeneration({
            model: 'tiiuae/falcon-7b-instruct',
            inputs: prompt,
            parameters: {
                max_new_tokens: 250,
                temperature: 0.7
            }
        });
        const outline = JSON.parse(response.generated_text);
        return outline;
    } catch (error) {
        console.error('Error generating outline:', error);
        return null;
    }
}

async function generateSectionContent(documentType, section, userDetails, customization) {
    const prompt = `You are a legal document writing assistant. Write the content for the "${section}" section of a "${documentType}" document.

Use the following details:
${JSON.stringify(userDetails, null, 2)}

Apply the following customizations:
- Tone: ${customization.tone || 'formal'}
- Region: ${customization.region || 'India'}
- Language: ${customization.language || 'English'}
- Length: ${customization.length || 'standard'}

The output should be in plain text or Markdown.`;

    try {
        const response = await hf.textGeneration({
            model: 'tiiuae/falcon-7b-instruct',
            inputs: prompt,
            parameters: {
                max_new_tokens: 500,
                temperature: 0.7
            }
        });
        return response.generated_text;
    } catch (error) {
        console.error(`Error generating content for section "${section}":`, error);
        return `[Error generating content for ${section}]`;
    }
}

module.exports = {
    generateOutline,
    generateSectionContent,
};
