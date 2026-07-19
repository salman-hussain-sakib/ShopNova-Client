// Real AI image generation using Pollinations.ai — free, no API key needed
// Generates actual AI images from text descriptions

interface GeneratedImage {
  url: string;
  width: number;
  height: number;
}

// Build a high-quality prompt for product photography
function buildProductPrompt(subject: string): string {
  const lower = subject.toLowerCase();

  // Product photography style prompt
  let style = 'professional product photography, studio lighting, clean white background, high resolution, 4k, sharp focus';

  if (/headphone|earbud|speaker|audio|sound|airpod/i.test(lower)) {
    style = 'professional product photography of premium headphones, studio lighting, clean white background, commercial quality, 4k, sharp focus, product catalog style';
  } else if (/watch|fitbit|band|wearable|smart.?watch/i.test(lower)) {
    style = 'professional product photography of a smartwatch, studio lighting, clean white background, commercial quality, 4k, sharp focus, product catalog style';
  } else if (/laptop|computer|macbook|notebook/i.test(lower)) {
    style = 'professional product photography of a modern laptop computer, studio lighting, clean white background, commercial quality, 4k, sharp focus, product catalog style';
  } else if (/phone|iphone|galaxy|pixel|smartphone/i.test(lower)) {
    style = 'professional product photography of a modern smartphone, studio lighting, clean white background, commercial quality, 4k, sharp focus, product catalog style';
  } else if (/camera|lens|drone|gadget/i.test(lower)) {
    style = 'professional product photography of a camera gadget, studio lighting, clean white background, commercial quality, 4k, sharp focus, product catalog style';
  } else if (/shoe|sneaker|boot|sandal/i.test(lower)) {
    style = 'professional product photography of footwear, studio lighting, clean white background, commercial quality, 4k, sharp focus, product catalog style';
  } else if (/shirt|dress|jacket|pants|hat|fashion|clothing/i.test(lower)) {
    style = 'professional product photography of fashion clothing, studio lighting, clean white background, commercial quality, 4k, sharp focus, product catalog style';
  } else if (/bag|backpack|purse|wallet/i.test(lower)) {
    style = 'professional product photography of a bag accessory, studio lighting, clean white background, commercial quality, 4k, sharp focus, product catalog style';
  } else if (/chair|desk|lamp|furniture|sofa|table/i.test(lower)) {
    style = 'professional product photography of modern furniture, studio lighting, clean white background, commercial quality, 4k, sharp focus, product catalog style';
  } else if (/game|gaming|controller|console/i.test(lower)) {
    style = 'professional product photography of gaming equipment, studio lighting, clean white background, commercial quality, 4k, sharp focus, product catalog style';
  } else if (/ring|necklace|bracelet|jewelry|earring/i.test(lower)) {
    style = 'professional product photography of jewelry, studio lighting, clean white background, commercial quality, 4k, sharp focus, product catalog style';
  } else if (/poster|banner|design|art|graphic/i.test(lower)) {
    style = 'modern graphic design, vibrant colors, clean composition, professional layout, high resolution, 4k';
  }

  return `${subject}, ${style}`;
}

// Generate image using Pollinations.ai (free, no API key)
export async function generateProductImage(
  prompt: string,
  width = 512,
  height = 512
): Promise<GeneratedImage> {
  const enhancedPrompt = buildProductPrompt(prompt);
  const encodedPrompt = encodeURIComponent(enhancedPrompt);

  // Pollinations.ai free API — generates real AI images
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${Math.floor(Math.random() * 10000)}&nologo=true`;

  // Pre-fetch to ensure image loads
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Image generation failed');
  } catch {
    // Even if fetch fails, the URL may still work in an img tag
  }

  return { url, width, height };
}

// Check if user message is an image generation request
export function isImageRequest(message: string): boolean {
  const lower = message.toLowerCase();
  return /generate|create|make|draw|design/i.test(lower) &&
    /image|picture|photo|poster|banner|logo|icon|visual|graphic|art|of/i.test(lower);
}

// Extract the image subject from the prompt
export function extractImageSubject(message: string): string {
  let subject = message
    .replace(/^(can you |please |hey |hi |ok |bro |bhai )/i, '')
    .replace(/(generate|create|make|draw|design)\s*/gi, ' ')
    .replace(/(an? |the |of |for |a )/gi, ' ')
    .replace(/(image|picture|photo|poster|banner|logo|icon|visual|graphic|art)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (subject.length < 3) {
    subject = message.replace(/generate|create|make|draw|design/gi, '').trim();
  }

  return subject || 'Product';
}
