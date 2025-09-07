/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

// Helper to centralize AI client creation and API key validation
const getAiClient = (): GoogleGenAI => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        // This error will be caught by the try/catch blocks in App.tsx and displayed in the UI.
        throw new Error("The Gemini API key is missing. Please ensure the API_KEY environment variable is configured.");
    }
    return new GoogleGenAI({ apiKey });
};

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    
    return dataUrlToPart(dataUrl);
};

// Helper function to convert a data URL string to a Gemini API Part
const dataUrlToPart = (dataUrl: string): { inlineData: { mimeType: string; data: string; } } => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
}

const handleApiResponse = (
    response: GenerateContentResponse,
    context: string // e.g., "edit", "filter", "adjustment"
): string => {
    // 1. Check for prompt blocking first
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    // 2. Try to find the image part
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        console.log(`Received image data (${mimeType}) for ${context}`);
        return `data:${mimeType};base64,${data}`;
    }

    // 3. If no image, check for other reasons
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation for ${context} stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }
    
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image for the ${context}. ` + 
        (textFeedback 
            ? `The model responded with text: "${textFeedback}"`
            : "This can happen due to safety filters or if the request is too complex. Please try rephrasing your prompt to be more direct.");

    console.error(`Model response did not contain an image part for ${context}.`, { response });
    throw new Error(errorMessage);
};

/**
 * Generates an edited image layer using generative AI based on a text prompt and either a hotspot or a mask.
 * @param originalImage The original image file.
 * @param userPrompt The text prompt describing the desired edit.
 * @param options An object containing either a hotspot or a maskImage.
 * @returns A promise that resolves to the data URL of the edited image layer.
 */
export const generateEditedImage = async (
    originalImage: File,
    userPrompt: string,
    options: { hotspot?: { x: number, y: number }, maskImage?: string }
): Promise<string> => {
    const { hotspot, maskImage } = options;
    if (!hotspot && !maskImage) {
        throw new Error("Either a hotspot or a mask is required for editing.");
    }
    
    console.log('Starting generative layer edit with options:', options);
    const ai = getAiClient();
    
    const originalImagePart = await fileToPart(originalImage);
    const parts = [originalImagePart];
    let prompt: string;

    const safetyAndEthicsPolicy = `
Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.
`;

    if (maskImage) {
        const maskPart = dataUrlToPart(maskImage);
        parts.push(maskPart);
        prompt = `You are an expert photo editor AI. Your task is to generate a new object or element based on the user's request, placed within the area defined by the provided mask.
User Request: "${userPrompt}"

Editing Guidelines:
- The edit must be realistic and blend seamlessly with the surrounding area if it overlaps with existing objects.
- You must generate ONLY the new or edited object itself, correctly positioned within the frame.

OUTPUT REQUIREMENT:
- Your output MUST be a transparent PNG containing only the generated object. The rest of the image frame must be transparent.
- Do not return the original image or the mask.
- Do not return text.
${safetyAndEthicsPolicy}
Output: Return ONLY the final generated element as a transparent PNG. Do not return text.`;
    } else if (hotspot) {
        prompt = `You are an expert photo editor AI. Your task is to perform a natural, localized edit on the provided image based on the user's request.
User Request: "${userPrompt}"
Edit Location: Focus on the area around pixel coordinates (x: ${hotspot.x}, y: ${hotspot.y}).

Editing Guidelines:
- The edit must be realistic and blend seamlessly with the surrounding area.
- You must generate ONLY the new or edited object itself.
- The object must be correctly positioned within the frame as it would appear on the original image.

OUTPUT REQUIREMENT:
- Your output MUST be a transparent PNG containing only the generated object. The rest of the image frame must be transparent. For example, if asked to 'add a hat', return just the hat on a transparent background, positioned correctly in the full-size image frame.
- Do not return the original image.
- Do not return text.
${safetyAndEthicsPolicy}
Output: Return ONLY the final edited element as a transparent PNG. Do not return text.`;
    } else {
        throw new Error("Invalid options for generateEditedImage");
    }

    console.log('Sending parts to the model for layer generation...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [...parts, { text: prompt }] },
    });
    console.log('Received response from model.', response);

    return handleApiResponse(response, 'edit');
};

/**
 * Removes an object from an image using a mask and generative inpainting.
 * @param originalImage The original image file.
 * @param maskImage The base64 data URL of the mask image.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const removeObjectInpainting = async (
    originalImage: File,
    maskImage: string
): Promise<string> => {
    console.log(`Starting object removal with inpainting.`);
    const ai = getAiClient();
    
    const originalImagePart = await fileToPart(originalImage);
    const maskPart = dataUrlToPart(maskImage);
    const prompt = `You are an expert photo editor AI specializing in inpainting. Your task is to seamlessly remove the object or area defined by the provided mask. You must realistically reconstruct the background behind the masked area, making it appear as if the object was never there.
The result must be photorealistic and blend perfectly with the surrounding image texture, lighting, and color.

Output: Return ONLY the final, fully edited image. Do not return text.`;
    
    const parts = [originalImagePart, maskPart, { text: prompt }];

    console.log('Sending image and mask to the model for object removal...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts },
    });
    console.log('Received response from model for removal.', response);
    
    return handleApiResponse(response, 'removal');
};


/**
 * Generates an image with a filter applied using generative AI.
 * @param originalImage The original image file.
 * @param filterPrompt The text prompt describing the desired filter.
 * @returns A promise that resolves to the data URL of the filtered image.
 */
export const generateFilteredImage = async (
    originalImage: File,
    filterPrompt: string,
): Promise<string> => {
    console.log(`Starting filter generation: ${filterPrompt}`);
    const ai = getAiClient();
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to apply a stylistic filter to the entire image based on the user's request. Do not change the composition or content, only apply the style.
Filter Request: "${filterPrompt}"

Safety & Ethics Policy:
- Filters may subtly shift colors, but you MUST ensure they do not alter a person's fundamental race or ethnicity.
- You MUST REFUSE any request that explicitly asks to change a person's race (e.g., 'apply a filter to make me look Chinese').

Output: Return ONLY the final filtered image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and filter prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for filter.', response);
    
    return handleApiResponse(response, 'filter');
};

/**
 * Generates an image with a global adjustment applied using generative AI.
 * @param originalImage The original image file.
 * @param adjustmentPrompt The text prompt describing the desired adjustment.
 * @returns A promise that resolves to the data URL of the adjusted image.
 */
export const generateAdjustedImage = async (
    originalImage: File,
    adjustmentPrompt: string,
): Promise<string> => {
    console.log(`Starting global adjustment generation: ${adjustmentPrompt}`);
    const ai = getAiClient();
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to perform a natural, global adjustment to the entire image based on the user's request.
User Request: "${adjustmentPrompt}"

Editing Guidelines:
- The adjustment must be applied across the entire image.
- The result must be photorealistic.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final adjusted image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and adjustment prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for adjustment.', response);
    
    return handleApiResponse(response, 'adjustment');
};

/**
 * Upscales an image to 2x its resolution using AI.
 * @param originalImage The original image file.
 * @returns A promise that resolves to the data URL of the upscaled image.
 */
export const upscaleImage = async (originalImage: File): Promise<string> => {
    console.log('Starting 2x AI upscale...');
    const ai = getAiClient();

    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert image upscaler AI. Your task is to upscale the provided image to exactly double its original resolution (2x).
You must enhance details, sharpness, and clarity in a photorealistic manner.
Do not add, remove, or change any content or objects in the image. The composition must remain identical.
Output: Return ONLY the final upscaled image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image to the model for upscaling...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for upscale.', response);

    return handleApiResponse(response, 'upscale');
};


/**
 * Sends a text prompt to Gemini to get a better, more descriptive prompt.
 * @param simplePrompt The user's original, simple prompt.
 * @returns A promise that resolves to an enhanced, more descriptive prompt string.
 */
export const enhancePrompt = async (simplePrompt: string): Promise<string> => {
    if (!simplePrompt.trim()) {
        return "";
    }
    console.log(`Enhancing prompt: "${simplePrompt}"`);
    const ai = getAiClient();

    const fullPrompt = `You are an AI assistant that refines user input into expert-level prompts for an AI photo editor.
    Rewrite the following user request into a detailed, descriptive, and photorealistic instruction.
    The new prompt should be clear, concise, and focused on achieving a high-quality, seamless visual result.
    Do not add any preamble or explanation. Return only the enhanced prompt text.

    User request: "${simplePrompt}"
    Enhanced prompt:`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
        });
        const enhanced = response.text.trim();
        console.log(`Enhanced prompt received: "${enhanced}"`);
        // Basic validation in case the model returns extra text
        return enhanced.split('\n').pop() || enhanced;
    } catch (err) {
        console.error("Failed to enhance prompt:", err);
        // Fallback to the original prompt on error
        return simplePrompt;
    }
};

export type AiSuggestion = {
    title: string;
    prompt: string;
};

/**
 * Analyzes an image and returns a list of suggested edits.
 * @param image The image file to analyze.
 * @returns A promise that resolves to an array of suggestion objects.
 */
export const getAiSuggestions = async (image: File): Promise<AiSuggestion[]> => {
    console.log('Getting AI suggestions for the image...');
    const ai = getAiClient();
    
    const imagePart = await fileToPart(image);
    const prompt = `You are an expert AI photo art director. Your task is to analyze the provided image and suggest three concrete, actionable improvements.

For each suggestion, you must provide:
1.  A concise title (e.g., "Cinematic Color Grade").
2.  A detailed, specific prompt that could be given to another AI photo editor to perform the edit. This prompt should be tailored to the content of the image.

Your suggestions must cover these categories:
- A **Creative Filter** that complements the image's subject and mood (e.g., vintage, cinematic, black and white).
- A **Sharpening** adjustment to enhance specific details or textures in the image.
- A **Lighting or Color** adjustment to improve the overall look (e.g., contrast, warmth, dynamic range).

**Crucially, your generated prompts MUST BE SPECIFIC to the image.** Do not use generic phrases.

For example, if the image is a portrait in a forest:
- **BAD (Generic):** "Make the colors more vibrant."
- **GOOD (Specific):** "Enhance the greens of the foliage and add a touch of warmth to the subject's skin tones to create a more lush, vibrant scene."

- **BAD (Generic):** "Sharpen the image."
- **GOOD (Specific):** "Apply subtle sharpening to the texture of the tree bark and the details in the subject's hair to make them more defined."

Return your response as a JSON array of three objects, with each object having a 'title' and a 'prompt' key.`;
    const textPart = { text: prompt };

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            prompt: { type: Type.STRING },
                        },
                        required: ["title", "prompt"],
                    },
                },
            },
        });

        const jsonStr = response.text.trim();
        const suggestions: AiSuggestion[] = JSON.parse(jsonStr);
        console.log('Received AI suggestions:', suggestions);
        if (!Array.isArray(suggestions) || suggestions.length === 0) {
            throw new Error("AI returned no valid suggestions.");
        }
        return suggestions;
    } catch (err) {
        console.error('Failed to get AI suggestions:', err);
        throw new Error('The AI was unable to provide suggestions for this image.');
    }
};