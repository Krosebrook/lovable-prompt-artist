import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { getCorsHeaders, handleCorsPreflightRequest, createErrorResponse } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { validateSceneInput } from "../_shared/validation.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  try {
    // Parse and validate input
    const body = await req.json();
    const validation = validateSceneInput(body);

    if (!validation.success) {
      return createErrorResponse(req, validation.error || 'Invalid input', 400);
    }

    const { scene } = validation.data!;

    // Get user from auth header for rate limiting
    const authHeader = req.headers.get('Authorization');
    let userId = 'anonymous';

    if (authHeader) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    }

    // Check rate limit
    const rateLimitResult = checkRateLimit({
      identifier: userId,
      endpoint: 'generate-storyboard',
      ...RATE_LIMITS.generateStoryboard,
    });

    if (!rateLimitResult.allowed) {
      const headers = {
        ...getCorsHeaders(req),
        ...getRateLimitHeaders(rateLimitResult),
        'Content-Type': 'application/json',
      };
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers }
      );
    }

    console.log('Generating storyboard image for scene:', scene.sceneNumber);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return createErrorResponse(req, 'Server configuration error', 500);
    }

    // Create a detailed prompt for image generation
    const imagePrompt = `Create a professional video storyboard frame: ${scene.visualDescription}.
    Style: Clean, professional video production storyboard aesthetic.
    Composition: Cinematic framing, clear subject focus.
    Quality: High quality, detailed, suitable for video production planning.`;

    // Generate image using AI
    const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: imagePrompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('AI image generation error:', imageResponse.status, errorText);
      return createErrorResponse(req, 'Failed to generate image. Please try again.', 502);
    }

    const imageData = await imageResponse.json();
    console.log('Image generation response received');

    // Extract the base64 image from the response
    const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      return createErrorResponse(req, 'No image generated. Please try again.', 500);
    }

    // Add rate limit headers to successful response
    const headers = {
      ...getCorsHeaders(req),
      ...getRateLimitHeaders(rateLimitResult),
      'Content-Type': 'application/json',
    };

    return new Response(
      JSON.stringify({
        sceneNumber: scene.sceneNumber,
        imageUrl: imageUrl
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Error in generate-storyboard:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return createErrorResponse(req, errorMessage, 500);
  }
});
