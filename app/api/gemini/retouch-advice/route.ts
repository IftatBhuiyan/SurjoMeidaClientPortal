import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

export async function POST(req: NextRequest) {
  try {
    const { photoName, shootType, exif, clientComments, stylePreference } = await req.json();

    const ai = getAiClient();

    const prompt = `You are a master photography colorist, retoucher, and darkroom specialist.
Analyze the following photo context and provide a precise, actionable retouching recipe and Lightroom/Capture One grading breakdown.

Photo: "${photoName}"
Shoot Type: "${shootType || 'Fine Art'}"
Camera & Lens: ${exif?.cameraModel || 'Pro Mirrorless'} with ${exif?.lens || 'Prime Lens'} (Aperture: ${exif?.aperture || 'f/1.4'}, ISO: ${exif?.iso || '100'}, Shutter: ${exif?.shutterSpeed || '1/500s'})
Client Feedback / Request: "${clientComments || 'Wants natural skin retouching and luxury editorial aesthetic'}"
Desired Aesthetic Tone: "${stylePreference || 'Warm Film & Luminous Skin'}"

Provide your output in concise JSON format with the following structure:
{
  "summary": "Brief 1-2 sentence colorist overview",
  "skinTreatment": "Specific frequency separation / dodge & burn guidance",
  "exposureAndTone": {
    "exposure": "+0.15",
    "contrast": "+8",
    "highlights": "-18",
    "shadows": "+12",
    "whites": "+5",
    "blacks": "-6"
  },
  "colorGrading": {
    "temp": "+4 (Warm golden)",
    "tint": "-2",
    "midtones": "Warm amber hue 38, sat 6",
    "highlights": "Soft champagne hue 45, sat 4",
    "shadows": "Deep teal/neutral hue 210, sat 3"
  },
  "detailAndFinish": "Texture +4, Clarity -3 for soft glow, Vignette -5 subtle"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Error generating retouch advice:', error);
    return NextResponse.json(
      {
        summary: 'Apply balanced skin micro-contrast softening while preserving natural pore texture and golden highlight recovery.',
        skinTreatment: 'Gentle inverted high-pass or frequency separation on cheekbones; maintain natural freckles and eye sharpness.',
        exposureAndTone: {
          exposure: '+0.10',
          contrast: '+5',
          highlights: '-15',
          shadows: '+10',
          whites: '+4',
          blacks: '-4',
        },
        colorGrading: {
          temp: '+3 (Natural sunlight)',
          tint: '0',
          midtones: 'Honey amber 40, sat 5',
          highlights: 'Soft cream 50, sat 3',
          shadows: 'Subtle slate 220, sat 2',
        },
        detailAndFinish: 'Texture +5, Clarity -4 for cinematic skin roll-off.',
      },
      { status: 200 }
    );
  }
}
