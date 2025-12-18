'use client';

import { useState, useRef, use } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X } from 'lucide-react';

interface Ingredient {
  amount: string;
  units: string;
  ingredient: string;
}

interface IngredientGroup {
  groupName: string;
  ingredients: Ingredient[];
}

interface DebugStep {
  step: string;
  title: string;
  data: unknown;
  success: boolean;
  timestamp: number;
}

// Default AI prompt - same as used in the API route
const DEFAULT_PROMPT = `========================================
CRITICAL OUTPUT FORMAT
========================================
You MUST output ONLY raw JSON. NO thinking, NO reasoning, NO explanations, NO text before or after the JSON.
START YOUR RESPONSE IMMEDIATELY WITH { and END WITH }. Nothing else.

Required JSON structure:
{
  "title": "string",
  "ingredients": [
    {
      "groupName": "string",
      "ingredients": [
        {"amount": "string", "units": "string", "ingredient": "string"}
      ]
    }
  ],
  "instructions": ["string", "string", ...]
}

CRITICAL: ingredients and instructions MUST be arrays, NEVER null.
- If ingredients are found: extract them into the array structure above
- If NO ingredients found: use empty array []
- If instructions are found: extract them into an array of strings
- If NO instructions found: use empty array []
- NEVER use null for ingredients or instructions - ALWAYS use [] if nothing is found

========================================
THE HTML PROVIDED IS YOUR ONLY SOURCE OF DATA
========================================
You are an AI recipe extractor. Your SOLE purpose is to read the HTML provided and extract recipe data EXACTLY as it appears.

CORE EXTRACTION PRINCIPLES:
1. Read the HTML carefully and locate the recipe content - ingredients and instructions ARE in the HTML
2. Extract amounts, units, and ingredient names EXACTLY as written in the HTML
3. Extract instruction steps EXACTLY as written in the HTML
4. Never invent, estimate, round, convert, or modify any values
5. If data is missing from HTML, use fallback values (see Edge Cases section)
6. Only normalize whitespace and line breaks - nothing else
7. ALWAYS return arrays for ingredients and instructions - NEVER null, use [] if empty

========================================
EXTRACTION WORKFLOW
========================================
Follow these steps in order:
1. Locate and extract the recipe title (usually the main heading)
2. Locate the ingredients section in the HTML
3. For each ingredient, extract:
   - The amount EXACTLY as written (e.g., "2 1/2", "1/4", "½", "0.5")
   - The unit EXACTLY as written (e.g., "cups", "tablespoons", "grams")
   - The ingredient name EXACTLY as written
4. Preserve any ingredient groups found in the HTML
5. Locate the instructions section in the HTML
6. Extract each instruction step EXACTLY as written, preserving all details
7. Format the extracted data into the required JSON structure

========================================
INGREDIENT EXTRACTION RULES
========================================
AMOUNTS:
- Copy the amount EXACTLY as it appears in HTML: "2 1/2", "1/4", "½", "0.25", "¾"
- Do NOT convert fractions to decimals or vice versa
- Do NOT round or estimate (e.g., if HTML says "2 1/2", output "2 1/2", NOT "2.5" or "2")
- If HTML shows a range like "2-3", use "2-3"
- If no amount is provided, use "as needed"

UNITS:
- Copy the unit EXACTLY as it appears: "cups", "tablespoons", "teaspoons", "grams", "ounces", "pounds"
- Do NOT convert units (e.g., do NOT convert tablespoons to cups)
- Do NOT abbreviate or expand (if HTML says "tbsp", use "tbsp")
- If no amount is provided (using "as needed"), leave units as empty string ""

INGREDIENT NAMES:
- Copy the ingredient name EXACTLY as written in HTML
- Include all descriptors: "all-purpose flour", "unsalted butter", "large eggs"
- Do NOT abbreviate, simplify, or modify names

GROUPS:
- If ingredients are grouped in HTML (e.g., "For the crust", "For the filling"), preserve those exact group names
- If no groups exist, use a single group with groupName "Main"
- Do NOT create groups that don't exist in the HTML

========================================
INSTRUCTION EXTRACTION RULES
========================================
COMPLETENESS:
- Extract ALL instruction steps from the HTML
- Do NOT combine multiple steps into one
- Do NOT skip any steps, even if they seem minor
- Include every detail: temperatures, times, measurements, techniques

ACCURACY:
- Copy instruction text as closely as possible to the HTML
- Preserve all cooking temperatures (e.g., "350°F", "175°C")
- Preserve all cooking times (e.g., "30 minutes", "until golden brown")
- Preserve all measurements mentioned in instructions
- Keep the exact order of steps as they appear in HTML

DETAIL PRESERVATION:
- Do NOT shorten, summarize, or condense instructions
- Do NOT simplify complex steps
- Keep all helpful details about techniques, visual cues, and tips
- Maintain the original level of detail from the HTML

CLEANING (remove these only):
- Author names and bylines (e.g., "By Chef John:")
- Attribution text (e.g., "Recipe courtesy of...")
- Nutritional information
- Prep time, cook time, total time labels
- Serving size information
- Image descriptions or video references
- Advertisement content

========================================
EDGE CASES AND MISSING DATA
========================================
If the recipe title is missing:
- Use the page's main heading or first prominent heading

If an ingredient amount is missing:
- Use "as needed" for amount
- Use "" (empty string) for units
- Still include the ingredient name

If ingredient groups are unclear:
- Use a single group with groupName "Main"

If instructions are incomplete or unclear:
- Extract what is available, exactly as written
- Do NOT make up or fill in missing steps

If no valid recipe is found in HTML:
- Return: {"title": "No recipe found", "ingredients": [], "instructions": []}
- NEVER use null - ALWAYS use empty arrays []

MANDATORY OUTPUT REQUIREMENTS:
- ingredients MUST be an array (never null) - use [] if empty
- instructions MUST be an array (never null) - use [] if empty
- If you cannot find ingredients, return []
- If you cannot find instructions, return []
- The HTML contains recipe data - search more carefully if you initially find nothing

========================================
FORMAT EXAMPLES (FOR STRUCTURE REFERENCE ONLY)
========================================
WARNING: These examples show the JSON FORMAT and STRUCTURE only.
DO NOT use these example values. Extract actual values from the HTML provided.

Example showing varied fraction formats:
{
  "title": "Homemade Bread",
  "ingredients": [
    {
      "groupName": "Main",
      "ingredients": [
        {"amount": "3 1/2", "units": "cups", "ingredient": "bread flour"},
        {"amount": "2 1/4", "units": "teaspoons", "ingredient": "active dry yeast"},
        {"amount": "1/4", "units": "cup", "ingredient": "warm water"},
        {"amount": "½", "units": "tablespoon", "ingredient": "salt"},
        {"amount": "as needed", "units": "", "ingredient": "olive oil for brushing"}
      ]
    }
  ],
  "instructions": [
    "In a large bowl, dissolve 2 1/4 teaspoons yeast in 1/4 cup warm water. Let stand until creamy, about 10 minutes.",
    "Add 3 1/2 cups flour, 1/2 tablespoon salt, and remaining water to the yeast mixture. Mix until dough comes together.",
    "Turn dough out onto a lightly floured surface and knead for 8 to 10 minutes, until smooth and elastic."
  ]
}

IMPORTANT: The example above shows JSON format structure only. You MUST extract actual amounts, units, and text from the HTML provided, not use these example values.

========================================
FINAL REMINDER
========================================
Output ONLY the JSON object. No markdown, no code blocks, no explanations, no text before or after.
START with { and END with }. Nothing else.

ABSOLUTE REQUIREMENTS:
- ingredients: MUST be an array [] (never null)
- instructions: MUST be an array [] (never null)
- If you find ingredients in the HTML, extract them
- If you find instructions in the HTML, extract them
- If you don't find them, use empty arrays [] - NEVER null
- The recipe data exists in the HTML - extract it carefully`;

export default function DebugParserPage({
  params,
  searchParams,
}: {
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<Record<string, string | string[]>>;
} = {} as any) {
  // For Next.js 15: Unwrap params/searchParams if provided to prevent enumeration warnings
  // This prevents React DevTools/error serialization from enumerating these props
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (params) use(params);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (searchParams) use(searchParams);
  
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugSteps, setDebugSteps] = useState<DebugStep[]>([]);
  const [error, setError] = useState('');
  // State for custom prompt testing
  const [customPrompt, setCustomPrompt] = useState(DEFAULT_PROMPT);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  
  // Image mode state
  const [inputMode, setInputMode] = useState<'url' | 'image'>('url');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDebugParse = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setDebugSteps([]);

    try {
      // Use POST request if custom prompt is enabled, otherwise use GET
      let rawHtmlResponse;
      if (useCustomPrompt && customPrompt.trim()) {
        // POST request with custom prompt in body (better for large prompts)
        rawHtmlResponse = await fetch('/api/admin/debug-parse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: url.trim(),
            customPrompt: customPrompt.trim(),
          }),
        });
      } else {
        // GET request with default prompt
        rawHtmlResponse = await fetch(`/api/admin/debug-parse?url=${encodeURIComponent(url)}`);
      }

      const debugData = await rawHtmlResponse.json();

      if (!debugData.success) {
        setError(debugData.error || 'Failed to parse recipe');
        return;
      }

      // Display all debug steps
      setDebugSteps(debugData.steps);
      
      // Store checkpoint summary if available
      if (debugData.checkpoints) {
        console.log('Checkpoint Summary:', debugData.checkpoints);
      }
    } catch (err) {
      console.error('Debug parse error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Reset prompt to default
  const handleResetPrompt = () => {
    setCustomPrompt(DEFAULT_PROMPT);
    setUseCustomPrompt(false);
  };

  // Handle image file selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type - only allow images
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size - max 10MB
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setError('Image size must be less than 10MB');
      return;
    }

    // Set the selected file
    setSelectedImage(file);

    // Create a preview URL for the image
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setError('');
  };

  // Handle debug image parsing
  const handleDebugImageParse = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setError('');
    setDebugSteps([]);

    try {
      // Step 1: Image upload
      const imageUploadStep: DebugStep = {
        step: 'image_upload',
        title: 'Image Upload',
        data: {
          name: selectedImage.name,
          type: selectedImage.type,
          size: selectedImage.size,
          sizeFormatted: `${(selectedImage.size / 1024 / 1024).toFixed(2)} MB`,
        },
        success: true,
        timestamp: Date.now(),
      };
      setDebugSteps([imageUploadStep]);

      // Step 2: AI Vision processing
      // Note: We estimate the base64 size for display (actual conversion happens server-side)
      const estimatedBase64Size = Math.ceil(selectedImage.size * 1.33); // Base64 is ~33% larger
      const aiVisionStep: DebugStep = {
        step: 'ai_vision',
        title: 'AI Vision Processing',
        data: {
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          imageSize: estimatedBase64Size,
          prompt: 'Extracting recipe data from image using vision model...',
        },
        success: true,
        timestamp: Date.now(),
      };
      setDebugSteps([imageUploadStep, aiVisionStep]);

      // Call the image parsing API
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await fetch('/api/parseRecipeFromImage', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error?.message || 'Failed to parse image');
        const aiVisionData = aiVisionStep.data as Record<string, unknown>;
        setDebugSteps([
          imageUploadStep,
          {
            ...aiVisionStep,
            success: false,
            data: { ...aiVisionData, error: result.error?.message || 'Parsing failed' },
          },
        ]);
        return;
      }

      // Step 3: Final result
      const finalResultStep: DebugStep = {
        step: 'final_result',
        title: 'Final Parsed Recipe',
        data: {
          title: result.title,
          ingredients: result.ingredients,
          instructions: result.instructions,
          method: 'ai_vision',
          ingredientCount: result.ingredients?.reduce(
            (sum: number, g: IngredientGroup) => sum + (g.ingredients?.length || 0),
            0
          ) || 0,
          instructionCount: result.instructions?.length || 0,
        },
        success: true,
        timestamp: Date.now(),
      };

      setDebugSteps([imageUploadStep, aiVisionStep, finalResultStep]);
    } catch (err) {
      console.error('Debug image parse error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatData = (data: unknown) => {
    if (typeof data === 'string') {
      return data;
    }
    return JSON.stringify(data, null, 2);
  };

  const getStepColor = (success: boolean) => {
    return success ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50';
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Recipe Parser Debug Console</h1>
        <p className="text-gray-600 mb-8">
          See exactly what happens at each step of the parsing process
        </p>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setInputMode('url');
                setSelectedImage(null);
                setImagePreview(null);
                setDebugSteps([]);
                setError('');
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                inputMode === 'url'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🔗 URL Mode
            </button>
            <button
              onClick={() => {
                setInputMode('image');
                setUrl('');
                setDebugSteps([]);
                setError('');
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                inputMode === 'image'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🖼️ Image Mode
            </button>
          </div>

          {/* URL Input Mode */}
          {inputMode === 'url' && (
            <div className="flex gap-4 mb-4">
              <Input
                type="url"
                placeholder="Enter recipe URL to debug..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleDebugParse()}
                className="flex-1"
              />
              <Button
                onClick={handleDebugParse}
                disabled={loading || !url.trim()}
                className="px-8"
              >
                {loading ? 'Debugging...' : 'Debug Parse'}
              </Button>
            </div>
          )}

          {/* Image Input Mode */}
          {inputMode === 'image' && (
            <div className="space-y-4 mb-4">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* Image Upload Button or Preview */}
              {!imagePreview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 transition-all duration-300 p-12 flex flex-col items-center justify-center gap-3"
                >
                  <Upload className="w-12 h-12 text-gray-400" />
                  <div className="text-center">
                    <p className="font-medium text-gray-700">
                      Click to upload recipe image
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      PNG, JPG, or WEBP (max 10MB)
                    </p>
                  </div>
                </button>
              ) : (
                <div className="space-y-3">
                  {/* Image Preview */}
                  <div className="relative rounded-lg overflow-hidden border-2 border-gray-300">
                    <img
                      src={imagePreview}
                      alt="Recipe preview"
                      className="w-full h-auto max-h-96 object-contain bg-gray-50"
                    />
                    {/* Remove Image Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200"
                      disabled={loading}
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Debug Parse Button */}
                  <Button
                    onClick={handleDebugImageParse}
                    disabled={loading}
                    className="w-full px-8"
                  >
                    {loading ? 'Debugging...' : 'Debug Image Parse'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Prompt Editor Section */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPromptEditor(!showPromptEditor)}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2"
                >
                  <span>{showPromptEditor ? '▼' : '▶'}</span>
                  <span>Test Custom AI Prompt</span>
                </button>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={useCustomPrompt}
                    onChange={(e) => setUseCustomPrompt(e.target.checked)}
                    disabled={!showPromptEditor}
                    className="rounded"
                  />
                  <span>Use custom prompt</span>
                </label>
              </div>
              {showPromptEditor && (
                <Button
                  onClick={handleResetPrompt}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Reset to Default
                </Button>
              )}
            </div>

            {showPromptEditor && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">
                  Edit the AI prompt below to test different extraction strategies. 
                  When &quot;Use custom prompt&quot; is checked, your custom prompt will be used instead of the default.
                </p>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-xs resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your custom AI prompt here..."
                  spellCheck={false}
                />
                <p className="text-xs text-gray-400 mt-2">
                  Prompt length: {customPrompt.length} characters
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-500 rounded-lg p-4 mb-8">
            <h3 className="text-red-700 font-semibold mb-2">Error</h3>
            <pre className="text-red-600 text-sm whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        {/* Checkpoint Summary */}
        {debugSteps.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-blue-900">Checkpoint Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {debugSteps.find((s) => s.step === 'checkpoint_1') && (() => {
                const cp1 = debugSteps.find((s) => s.step === 'checkpoint_1')!;
                return (
                  <div className={`p-4 rounded-lg border-2 ${cp1.success ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      {cp1.success ? '✅' : '❌'} Checkpoint 1: URL Validator
                    </h3>
                    <p className="text-sm">{cp1.success ? 'Page contains recipe indicators' : 'Page missing recipe keywords/schema'}</p>
                  </div>
                );
              })()}
              {debugSteps.find((s) => s.step === 'checkpoint_2_jsonld' || s.step === 'json_ld') && (() => {
                const cp2 = debugSteps.find((s) => s.step === 'checkpoint_2_jsonld' || s.step === 'json_ld')!;
                return (
                  <div className={`p-4 rounded-lg border-2 ${cp2.success ? 'bg-green-50 border-green-400' : 'bg-yellow-50 border-yellow-400'}`}>
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      {cp2.success ? '✅' : '⚠️'} Checkpoint 2: Recipe Parsing
                    </h3>
                    <p className="text-sm">{cp2.success ? 'JSON-LD found (fast path)' : 'Using AI parsing fallback'}</p>
                  </div>
                );
              })()}
              {debugSteps.find((s) => s.step === 'checkpoint_3') && (() => {
                const cp3 = debugSteps.find((s) => s.step === 'checkpoint_3')!;
                return (
                  <div className={`p-4 rounded-lg border-2 ${cp3.success ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      {cp3.success ? '✅' : '❌'} Checkpoint 3: Data Validation
                    </h3>
                    <p className="text-sm">{cp3.success ? 'All data validated successfully' : 'Missing required recipe data'}</p>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Debug Steps Display */}
        {debugSteps.length > 0 && (
          <div className="space-y-6">
            {debugSteps.map((step, index) => (
              <div
                key={index}
                className={`border-2 rounded-lg p-6 ${getStepColor(step.success)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">
                      Step {index + 1}: {step.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(step.timestamp).toLocaleTimeString()} •{' '}
                      {step.success ? '✅ Success' : '⚠️ Fallback Needed'}
                    </p>
                  </div>
                </div>

                {/* Data Display */}
                <div className="bg-white rounded border border-gray-300 p-4 overflow-auto">
                  {step.step === 'raw_html' && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Raw HTML length: {typeof step.data === 'string' ? step.data.length.toLocaleString() : '0'} characters
                      </p>
                      <pre className="text-xs max-h-96 overflow-y-auto whitespace-pre-wrap break-words">
                        {typeof step.data === 'string' ? step.data : String(step.data)}
                      </pre>
                    </div>
                  )}

                  {step.step === 'cleaned_html' && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Cleaned HTML length: {typeof step.data === 'string' ? step.data.length.toLocaleString() : '0'} characters
                        <br />
                        {typeof step.data === 'string' && debugSteps[0] && typeof debugSteps[0].data === 'string' && (
                          <span className="text-green-600">
                            Reduced by {((1 - step.data.length / debugSteps[0].data.length) * 100).toFixed(1)}%
                          </span>
                        )}
                      </p>
                      <pre className="text-xs max-h-[600px] overflow-y-auto whitespace-pre-wrap break-words">
                        {typeof step.data === 'string' ? step.data : String(step.data)}
                      </pre>
                    </div>
                  )}

                  {step.step === 'checkpoint_1' && (() => {
                    const data = step.data as Record<string, unknown>;
                    return (
                      <div>
                        <div className={`mb-3 p-3 rounded ${step.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                          <p className={`text-sm font-semibold mb-2 ${step.success ? 'text-green-700' : 'text-red-700'}`}>
                            {step.success ? '✅ PASSED' : '❌ FAILED'}
                          </p>
                          <div className="space-y-1 text-xs">
                            <p><strong>Has Ingredients Keyword:</strong> {typeof data.hasIngredients === 'boolean' && data.hasIngredients ? '✅ Yes' : '❌ No'}</p>
                            <p><strong>Has Instructions Keyword:</strong> {typeof data.hasInstructions === 'boolean' && data.hasInstructions ? '✅ Yes' : '❌ No'}</p>
                            <p><strong>Has JSON-LD Schema:</strong> {typeof data.hasSchema === 'boolean' && data.hasSchema ? '✅ Yes' : '❌ No'}</p>
                            <p><strong>Is Recipe Page:</strong> {typeof data.isRecipe === 'boolean' && data.isRecipe ? '✅ Yes' : '❌ No'}</p>
                          </div>
                          {(() => {
                            const details = data.details;
                            if (details && typeof details !== 'undefined') {
                              return (
                                <div className="mt-3 pt-3 border-t border-gray-300">
                                  <p className="text-xs font-semibold mb-1">Details:</p>
                                  <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-48">
                                    {formatData(details)}
                                  </pre>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    );
                  })()}

                  {(step.step === 'checkpoint_2_jsonld' || step.step === 'json_ld') && (
                    <div>
                      {step.success ? (
                        <>
                          <p className="text-sm text-green-600 mb-2 font-semibold">
                            ✅ Found JSON-LD structured data (no AI needed!)
                          </p>
                          <pre className="text-xs max-h-96 overflow-y-auto whitespace-pre-wrap break-words">
                            {formatData(step.data)}
                          </pre>
                        </>
                      ) : (
                        <p className="text-sm text-yellow-600">
                          No JSON-LD found, will use AI parsing...
                        </p>
                      )}
                    </div>
                  )}

                  {step.step === 'checkpoint_3' && (() => {
                    const data = step.data as Record<string, unknown>;
                    return (
                      <div>
                        <div className={`mb-3 p-3 rounded ${step.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                          <p className={`text-sm font-semibold mb-2 ${step.success ? 'text-green-700' : 'text-red-700'}`}>
                            {step.success ? '✅ PASSED' : '❌ FAILED'}
                          </p>
                          <div className="space-y-1 text-xs">
                            <p>
                              <strong>Has Valid Title:</strong> {typeof data.hasTitle === 'boolean' && data.hasTitle ? '✅ Yes' : '❌ No'}
                              {(() => {
                                if (data.details && typeof data.details === 'object' && data.details !== null && 'title' in data.details) {
                                  const title = (data.details as Record<string, unknown>).title;
                                  if (typeof title === 'string') {
                                    return ` (${title})`;
                                  }
                                }
                                return '';
                              })()}
                            </p>
                            <p>
                              <strong>Has Ingredients:</strong> {typeof data.hasIngredients === 'boolean' && data.hasIngredients ? '✅ Yes' : '❌ No'}
                              {(() => {
                                if (data.details && typeof data.details === 'object' && data.details !== null && 'totalIngredients' in data.details) {
                                  const total = (data.details as Record<string, unknown>).totalIngredients;
                                  if (typeof total === 'number') {
                                    return ` (${total} total)`;
                                  }
                                }
                                return '';
                              })()}
                            </p>
                            <p>
                              <strong>Has Instructions:</strong> {typeof data.hasInstructions === 'boolean' && data.hasInstructions ? '✅ Yes' : '❌ No'}
                              {(() => {
                                if (data.details && typeof data.details === 'object' && data.details !== null && 'instructionCount' in data.details) {
                                  const count = (data.details as Record<string, unknown>).instructionCount;
                                  if (typeof count === 'number') {
                                    return ` (${count} steps)`;
                                  }
                                }
                                return '';
                              })()}
                            </p>
                          </div>
                          {(() => {
                            const details = data.details;
                            if (details && typeof details !== 'undefined') {
                              return (
                                <div className="mt-3 pt-3 border-t border-gray-300">
                                  <p className="text-xs font-semibold mb-1">Validation Details:</p>
                                  <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-48">
                                    {formatData(details)}
                                  </pre>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    );
                  })()}

                  {step.step === 'ai_prompt' && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        AI Prompt sent to Groq (llama-3.3-70b-versatile)
                      </p>
                      <pre className="text-xs max-h-96 overflow-y-auto whitespace-pre-wrap break-words">
                        {typeof step.data === 'string' ? step.data : String(step.data)}
                      </pre>
                    </div>
                  )}

                  {step.step === 'ai_response' && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Raw AI Response
                      </p>
                      <pre className="text-xs max-h-96 overflow-y-auto whitespace-pre-wrap break-words">
                        {formatData(step.data)}
                      </pre>
                    </div>
                  )}

                  {step.step === 'warning' && (
                    <div>
                      <p className="text-sm text-yellow-600 mb-2 font-semibold">
                        ⚠️ {step.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatData(step.data)}
                      </p>
                    </div>
                  )}

                  {step.step === 'image_upload' && (() => {
                    const data = step.data as Record<string, unknown>;
                    return (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          Image file information
                        </p>
                        <div className="space-y-1 text-xs">
                          <p><strong>File Name:</strong> {typeof data.name === 'string' ? data.name : 'Unknown'}</p>
                          <p><strong>File Type:</strong> {typeof data.type === 'string' ? data.type : 'Unknown'}</p>
                          <p><strong>File Size:</strong> {typeof data.sizeFormatted === 'string' ? data.sizeFormatted : 'Unknown'}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {step.step === 'ai_vision' && (() => {
                    const data = step.data as Record<string, unknown>;
                    return (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          AI Vision Model Processing
                        </p>
                        <div className="space-y-1 text-xs">
                          <p><strong>Model:</strong> {typeof data.model === 'string' ? data.model : 'Unknown'}</p>
                          <p><strong>Image Size (base64):</strong> {typeof data.imageSize === 'number' ? data.imageSize.toLocaleString() : 'Unknown'} characters</p>
                          <p><strong>Status:</strong> {step.success ? '✅ Processing complete' : '❌ Processing failed'}</p>
                          {typeof data.error === 'string' && data.error && (
                            <p className="text-red-600"><strong>Error:</strong> {data.error}</p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {step.step === 'final_result' && (() => {
                    const data = step.data as Record<string, unknown>;
                    return (
                      <div>
                        <p className="text-sm text-green-600 mb-2 font-semibold">
                          ✅ Final Parsed Recipe
                        </p>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Title:</h4>
                            <p className="text-sm">{typeof data.title === 'string' ? data.title : ''}</p>
                          </div>
                          {typeof data.author === 'string' && data.author && (
                            <div>
                              <h4 className="font-semibold text-sm mb-1">Author:</h4>
                              <p className="text-sm">{data.author}</p>
                            </div>
                          )}
                          {typeof data.sourceUrl === 'string' && data.sourceUrl && (
                            <div>
                              <h4 className="font-semibold text-sm mb-1">Source URL:</h4>
                              <a
                                href={data.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                              >
                                {data.sourceUrl}
                              </a>
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold text-sm mb-1">
                              Ingredients ({typeof data.ingredientCount === 'number' ? data.ingredientCount : (Array.isArray(data.ingredients) ? (data.ingredients as IngredientGroup[]).reduce((sum: number, g: IngredientGroup) => sum + (g.ingredients?.length || 0), 0) : 0)} total):
                            </h4>
                            {Array.isArray(data.ingredients) && data.ingredients.length > 0 ? (
                              (data.ingredients as IngredientGroup[]).map((group: IngredientGroup, gIdx: number) => (
                              <div key={gIdx} className="ml-4 mb-2">
                                <p className="font-medium text-sm">{group.groupName}</p>
                                <ul className="list-disc ml-6 text-xs">
                                  {group.ingredients?.map((ing: Ingredient, iIdx: number) => (
                                    <li key={iIdx}>
                                      {ing.amount} {ing.units} {ing.ingredient}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No ingredients found</p>
                          )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm mb-1">
                              Instructions ({typeof data.instructionCount === 'number' ? data.instructionCount : (Array.isArray(data.instructions) ? data.instructions.length : 0)} steps):
                            </h4>
                            {Array.isArray(data.instructions) && data.instructions.length > 0 ? (
                              <ol className="list-decimal ml-6 text-xs">
                                {data.instructions.map((inst: any, idx: number) => {
                                  // Handle both string and object instruction formats
                                  if (typeof inst === 'string') {
                                    // String format (from URL parsing)
                                    return (
                                      <li key={idx} className="mb-1">{inst}</li>
                                    );
                                  } else if (inst && typeof inst === 'object') {
                                    // Object format (from image parsing) - has title, detail, timeMinutes, ingredients, tips
                                    return (
                                      <li key={idx} className="mb-2">
                                        {inst.title && (
                                          <span className="font-semibold">{inst.title}: </span>
                                        )}
                                        {inst.detail || inst.text || JSON.stringify(inst)}
                                        {inst.timeMinutes && inst.timeMinutes > 0 && (
                                          <span className="text-gray-500 ml-2">({inst.timeMinutes} min)</span>
                                        )}
                                      </li>
                                    );
                                  } else {
                                    // Fallback for unexpected formats
                                    return (
                                      <li key={idx} className="mb-1">{JSON.stringify(inst)}</li>
                                    );
                                  }
                                })}
                              </ol>
                            ) : (
                              <p className="text-sm text-gray-500">No instructions found</p>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Method Used:</h4>
                            <p className="text-sm">
                              {data.method === 'json-ld' ? (
                                <span className="text-green-600">JSON-LD (Fast, no AI tokens used)</span>
                              ) : data.method === 'ai_vision' ? (
                                <span className="text-purple-600">AI Vision (meta-llama/llama-4-scout-17b-16e-instruct)</span>
                              ) : (
                                <span className="text-blue-600">AI Parsing (Groq llama-3.3-70b-versatile)</span>
                              )}
                            </p>
                          </div>
                          {/* Display any additional debugging data that might be present */}
                          {Object.keys(data).some(key => !['title', 'ingredients', 'instructions', 'method', 'ingredientCount', 'instructionCount', 'validationPassed'].includes(key)) && (
                            <div className="mt-4 pt-4 border-t border-gray-300">
                              <h4 className="font-semibold text-sm mb-2">Additional Debug Data:</h4>
                              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-48 border border-gray-200">
                                {formatData(Object.fromEntries(
                                  Object.entries(data).filter(([key]) => 
                                    !['title', 'ingredients', 'instructions', 'method', 'ingredientCount', 'instructionCount', 'validationPassed'].includes(key)
                                  )
                                ))}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        {debugSteps.length === 0 && !loading && (
          <div className="bg-blue-50 border border-blue-500 rounded-lg p-6">
            <h3 className="text-blue-700 font-semibold mb-2">How to use:</h3>
            {inputMode === 'url' ? (
              <ol className="list-decimal ml-6 text-blue-600 space-y-1">
                <li>Enter any recipe URL above</li>
                <li>Click &quot;Debug Parse&quot; to see the full parsing flow</li>
                <li>Review each step to understand what happened</li>
                <li>Check if JSON-LD was found (fast) or AI was used (fallback)</li>
                <li>See the cleaned HTML that was sent to the AI</li>
                <li>View the AI&apos;s raw response and final parsed result</li>
              </ol>
            ) : (
              <ol className="list-decimal ml-6 text-blue-600 space-y-1">
                <li>Click the upload area to select a recipe image</li>
                <li>Supported formats: JPG, PNG, WEBP, GIF (max 10MB)</li>
                <li>Click &quot;Debug Image Parse&quot; to see the parsing flow</li>
                <li>Review the image upload, AI vision processing, and final result steps</li>
                <li>See how the vision model extracts recipe data from the image</li>
              </ol>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

