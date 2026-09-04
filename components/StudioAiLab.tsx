'use client';

import React, { useState } from 'react';
import { AspectRatioType, GeneratedConcept, ClientGallery, PhotoItem } from '@/lib/types';
import { Sparkles, Wand2, RefreshCw, Plus, Download, Image as ImageIcon, Check, SlidersHorizontal, Layers } from 'lucide-react';
import { saveStudioConcept } from '@/lib/storage';

interface StudioAiLabProps {
  concepts: GeneratedConcept[];
  onConceptGenerated: (concept: GeneratedConcept) => void;
  galleries: ClientGallery[];
  onAddPhotoToGallery: (galleryId: string, photo: PhotoItem) => void;
}

const ASPECT_RATIOS: { value: AspectRatioType; label: string; widthRatio: number; heightRatio: number; useCase: string }[] = [
  { value: '1:1', label: '1:1 Square', widthRatio: 1, heightRatio: 1, useCase: 'Editorial Cover' },
  { value: '2:3', label: '2:3 Classic Portrait', widthRatio: 2, heightRatio: 3, useCase: '35mm Film Portrait' },
  { value: '3:2', label: '3:2 Classic Landscape', widthRatio: 3, heightRatio: 2, useCase: 'Full Frame Master' },
  { value: '3:4', label: '3:4 Medium Format Portrait', widthRatio: 3, heightRatio: 4, useCase: 'Vogue / Editorial' },
  { value: '4:3', label: '4:3 Medium Format Landscape', widthRatio: 4, heightRatio: 3, useCase: 'Studio Frame' },
  { value: '9:16', label: '9:16 Story / Mobile Full', widthRatio: 9, heightRatio: 16, useCase: 'Story / Mobile' },
  { value: '16:9', label: '16:9 Cinematic Widescreen', widthRatio: 16, heightRatio: 9, useCase: 'Cinematic 4K' },
  { value: '21:9', label: '21:9 Ultra-Panavision', widthRatio: 21, heightRatio: 9, useCase: 'Anamorphic Frame' },
];

const PRESET_STYLES = [
  {
    title: 'Lake Como Sunset Bride',
    prompt: 'Ethereal bride in hand-embroidered lace gown standing on an Italian villa terrace overlooking Lake Como at sunset, warm cinematic rim lighting, 85mm f/1.4 shallow depth of field, gentle lake breeze, photorealistic masterwork',
    lighting: 'Golden Hour Sunset Rim',
    aspectRatio: '3:2' as AspectRatioType,
  },
  {
    title: 'High-Fashion Studio Chiaroscuro',
    prompt: 'Avant-garde model in textured black architectural silhouette, dramatic sculptural chiaroscuro lighting, deep rich shadows, luminous skin tone, 90mm medium-format studio lens',
    lighting: 'Dramatic Chiaroscuro Key Light',
    aspectRatio: '3:4' as AspectRatioType,
  },
  {
    title: '35mm Film Grain Romance',
    prompt: 'Intimate couple laughing under cobblestone streetlamps in Paris after rain, authentic 35mm Kodak Portra 400 film grain, natural subtle halation, warm amber streetlight reflections',
    lighting: 'Ambient Streetlamp Glow',
    aspectRatio: '2:3' as AspectRatioType,
  },
  {
    title: 'Minimalist Editorial Monolith',
    prompt: 'High-end beauty portrait with soft diffused window light, organic linen drape, hyper-detailed skin texture, soft warm neutral studio background, crisp catchlights',
    lighting: 'Large Diffused Softbox Window',
    aspectRatio: '1:1' as AspectRatioType,
  },
];

export const StudioAiLab: React.FC<StudioAiLabProps> = ({
  concepts,
  onConceptGenerated,
  galleries,
  onAddPhotoToGallery,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState<AspectRatioType>('3:2');
  const [selectedModel, setSelectedModel] = useState<'gemini-3.1-flash-image' | 'gemini-3-pro-image'>('gemini-3.1-flash-image');
  const [lightingStyle, setLightingStyle] = useState('Golden Hour Rim Light');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedGalleryForAdd, setSelectedGalleryForAdd] = useState<string>(galleries[0]?.id || '');
  const [addedConceptId, setAddedConceptId] = useState<string | null>(null);

  const handleGenerate = async (customPrompt?: string, customRatio?: AspectRatioType) => {
    const activePrompt = customPrompt || prompt;
    const activeRatio = customRatio || selectedRatio;

    if (!activePrompt.trim()) return;

    try {
      setIsGenerating(true);
      setErrorMsg(null);

      const response = await fetch('/api/gemini/generate-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: activePrompt,
          aspectRatio: activeRatio,
          model: selectedModel,
          lightingStyle,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate studio image concept');
      }

      const data = await response.json();
      const newConcept: GeneratedConcept = {
        id: `concept_${Date.now()}`,
        prompt: activePrompt,
        aspectRatio: activeRatio,
        model: selectedModel,
        imageUrl: data.imageUrl,
        createdAt: new Date().toISOString(),
        lightingStyle,
        toneStyle: data.notes,
      };

      saveStudioConcept(newConcept);
      onConceptGenerated(newConcept);
    } catch (err: any) {
      console.error('AI Generation Error:', err);
      setErrorMsg(err.message || 'Error communicating with Gemini image generator');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToClientGallery = (concept: GeneratedConcept) => {
    if (!selectedGalleryForAdd) return;

    const uniqueStamp = concept.id || 'concept';
    const newPhoto: PhotoItem = {
      id: `photo_${uniqueStamp}`,
      name: `AI Studio Moodboard — ${concept.aspectRatio}`,
      originalFileName: `STUDIO_CONCEPT_${concept.aspectRatio.replace(':', 'x')}.PNG`,
      thumbnailUrl: concept.imageUrl,
      highResUrl: concept.imageUrl,
      fileSizeBytes: 8400000,
      mimeType: 'image/png',
      width: 2400,
      height: 1600,
      exif: {
        cameraMake: 'Google Gemini',
        cameraModel: concept.model,
        lens: 'AI Synthesized Prime',
        focalLength: '85mm eq.',
        aperture: 'f/1.4',
        shutterSpeed: '1/1000s',
        iso: 'ISO 100',
        capturedAt: concept.createdAt,
      },
      comments: [
        {
          id: `comment_${uniqueStamp}`,
          author: 'Studio Art Director',
          text: `Concept generated for shoot lighting & moodboard: "${concept.prompt.substring(0, 80)}..."`,
          createdAt: concept.createdAt,
          isPhotographer: true,
        },
      ],
      uploadedAt: concept.createdAt,
    };

    onAddPhotoToGallery(selectedGalleryForAdd, newPhoto);
    setAddedConceptId(concept.id);
    setTimeout(() => setAddedConceptId(null), 2500);
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Studio Header */}
      <div className="bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#C88E3E]">
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#C88E3E] font-semibold">
                Studio AI Concept Lab & Aspect Ratio Control
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-light text-[#1C1917] dark:text-[#F7F3EC] font-serif">
              Creative Moodboard & Pre-visualizer
            </h1>
            <p className="text-xs text-[#70665A] dark:text-[#A39886] max-w-2xl font-sans">
              Synthesize precision studio concepts, lighting setups, and creative lookbook ideas in calibrated photographic aspect ratios powered by Google Gemini image models.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#FAF7F0] dark:bg-[#0C0B0A] p-1.5 border border-[#E6DFD3] dark:border-[#2D261E] shadow-sm">
            <button
              onClick={() => setSelectedModel('gemini-3.1-flash-image')}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-widest transition-all ${
                selectedModel === 'gemini-3.1-flash-image'
                  ? 'bg-[#C88E3E] text-white font-medium shadow-sm'
                  : 'text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]'
              }`}
            >
              Gemini Flash
            </button>
            <button
              onClick={() => setSelectedModel('gemini-3-pro-image')}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-widest transition-all ${
                selectedModel === 'gemini-3-pro-image'
                  ? 'bg-[#C88E3E] text-white font-medium shadow-sm'
                  : 'text-[#70665A] dark:text-[#A39886] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]'
              }`}
            >
              Gemini Pro Master
            </button>
          </div>
        </div>

        {/* Aspect Ratio Control Affordance Grid */}
        <div className="space-y-2.5 pt-2">
          <label className="text-[10px] uppercase tracking-widest font-mono text-[#70665A] dark:text-[#A39886] flex items-center gap-2">
            <SlidersHorizontal className="w-3 h-3 text-[#C88E3E]" />
            Specify Frame Aspect Ratio
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {ASPECT_RATIOS.map((ratio) => {
              const isSelected = selectedRatio === ratio.value;
              return (
                <button
                  key={ratio.value}
                  type="button"
                  id={`ratio-btn-${ratio.value.replace(':', '-')}`}
                  onClick={() => setSelectedRatio(ratio.value)}
                  className={`p-3 border text-left transition-all flex flex-col items-center justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-[#C88E3E] text-white border-[#C88E3E] shadow-sm'
                      : 'bg-[#FAF7F0] dark:bg-[#0C0B0A] border-[#E6DFD3] dark:border-[#2D261E] text-[#70665A] dark:text-[#A39886] hover:border-[#C88E3E] hover:text-[#1C1917] dark:hover:text-[#F7F3EC]'
                  }`}
                >
                  {/* Visual ratio preview icon box */}
                  <div className={`w-12 h-10 flex items-center justify-center p-1 ${isSelected ? 'bg-black/15' : 'bg-white dark:bg-[#1E1B17]'}`}>
                    <div
                      className={`border transition-all ${
                        isSelected ? 'border-white bg-white/30' : 'border-[#C88E3E] bg-[#C88E3E]/10'
                      }`}
                      style={{
                        width: `${Math.min(36, (ratio.widthRatio / Math.max(ratio.widthRatio, ratio.heightRatio)) * 36)}px`,
                        height: `${Math.min(28, (ratio.heightRatio / Math.max(ratio.widthRatio, ratio.heightRatio)) * 28)}px`,
                      }}
                    />
                  </div>
                  <div className="text-center w-full">
                    <span className="block font-mono text-xs font-bold">{ratio.value}</span>
                    <span className={`block text-[9px] truncate font-mono ${isSelected ? 'text-white/80' : 'text-[#70665A] dark:text-[#A39886]'}`}>
                      {ratio.useCase}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prompt Input & Trigger */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your lighting setup, model styling, location, and camera framing..."
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                className="w-full bg-[#FAF7F0] dark:bg-[#0C0B0A] border border-[#E6DFD3] dark:border-[#2D261E] px-4 py-3 text-xs text-[#1C1917] dark:text-[#F7F3EC] placeholder-[#70665A]/50 focus:outline-none focus:border-[#C88E3E] transition-all font-mono"
              />
            </div>
            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating || !prompt.trim()}
              className="px-6 py-3 bg-[#C88E3E] hover:bg-[#B77D2F] disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs uppercase tracking-widest font-medium shrink-0 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Frame...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Generate Aspect {selectedRatio}</span>
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-2.5 font-mono">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Quick Studio Presets */}
        <div className="space-y-2 pt-2 border-t border-[#E6DFD3] dark:border-[#2D261E]">
          <span className="text-[10px] text-[#70665A] dark:text-[#A39886] uppercase font-mono tracking-widest">
            Curated Inspiration Archetypes:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_STYLES.map((preset) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => {
                  setPrompt(preset.prompt);
                  setSelectedRatio(preset.aspectRatio);
                  setLightingStyle(preset.lighting);
                  handleGenerate(preset.prompt, preset.aspectRatio);
                }}
                className="text-xs px-3 py-1.5 bg-[#FAF7F0] dark:bg-[#0C0B0A] hover:bg-[#C88E3E] hover:text-white dark:hover:bg-[#C88E3E] text-[#1C1917] dark:text-[#F7F3EC] border border-[#E6DFD3] dark:border-[#2D261E] transition-all flex items-center gap-1.5 font-mono shadow-sm"
              >
                <Sparkles className="w-3 h-3 text-[#C88E3E]" />
                <span>{preset.title}</span>
                <span className="text-[10px] font-mono text-[#70665A] dark:text-[#A39886]">({preset.aspectRatio})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generated Concept Moodboard Collection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#C88E3E]" />
            <h2 className="text-lg font-light text-[#1C1917] dark:text-[#F7F3EC] font-serif">
              Studio Moodboard Gallery ({concepts.length})
            </h2>
          </div>

          {/* Add to Gallery Selector */}
          {galleries.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#70665A] dark:text-[#A39886] hidden sm:inline">
                Add to client shoot:
              </span>
              <select
                value={selectedGalleryForAdd}
                onChange={(e) => setSelectedGalleryForAdd(e.target.value)}
                className="bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] text-[#1C1917] dark:text-[#F7F3EC] text-xs px-3 py-1.5 focus:outline-none font-mono shadow-sm"
              >
                {galleries.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.clientName} ({g.shootType})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {concepts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] shadow-sm">
            <ImageIcon className="w-10 h-10 text-[#C88E3E]/40 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-[#1C1917] dark:text-[#F7F3EC] font-mono uppercase tracking-wider">
              No Studio Concepts Generated Yet
            </h3>
            <p className="text-xs text-[#70665A] dark:text-[#A39886] max-w-sm mx-auto mt-1 font-sans">
              Select an aspect ratio and enter a photography prompt above to create shot concepts, lighting moods, and client moodboards.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {concepts.map((concept) => (
              <div
                key={concept.id}
                className="bg-white dark:bg-[#151311] border border-[#E6DFD3] dark:border-[#2D261E] hover:border-[#C88E3E] overflow-hidden shadow-sm transition-all flex flex-col group"
              >
                {/* Image Container */}
                <div className="relative bg-[#111] overflow-hidden flex items-center justify-center aspect-[4/3]">
                  <img
                    src={concept.imageUrl}
                    alt={concept.prompt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-[#C88E3E] text-white px-2.5 py-0.5 text-[10px] font-mono font-medium shadow-sm">
                    {concept.aspectRatio}
                  </div>
                  <div className="absolute top-3 right-3 bg-black/80 px-2 py-0.5 border border-white/15 text-[9px] font-mono text-white/70 uppercase">
                    {concept.model.includes('pro') ? 'PRO' : 'FLASH'}
                  </div>
                </div>

                {/* Info & Actions */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-xs text-[#1C1917] dark:text-[#F7F3EC] line-clamp-3 leading-relaxed font-sans">
                      &ldquo;{concept.prompt}&rdquo;
                    </p>
                    {concept.lightingStyle && (
                      <span className="inline-block text-[10px] text-[#C88E3E] dark:text-[#D49A3D] font-mono">
                        Light: {concept.lightingStyle}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#E6DFD3] dark:border-[#2D261E] gap-2">
                    <a
                      href={concept.imageUrl}
                      download={`studio_concept_${concept.id}.png`}
                      className="p-2 bg-[#FAF7F0] dark:bg-[#1E1B17] hover:bg-[#C88E3E] hover:text-white text-[#70665A] dark:text-[#A39886] text-xs font-mono transition-colors flex items-center gap-1 border border-[#E6DFD3] dark:border-[#2D261E]"
                      title="Download image"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => handleAddToClientGallery(concept)}
                      disabled={!selectedGalleryForAdd}
                      className="flex-1 py-2 px-3 bg-[#C88E3E] hover:bg-[#B77D2F] text-white text-xs uppercase tracking-widest font-mono font-medium transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {addedConceptId === concept.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Added to Gallery!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Shoot</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
