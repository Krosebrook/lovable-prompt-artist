import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { getCorsHeaders, handleCorsPreflightRequest, createJsonResponse, createErrorResponse } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { validateGenerateScriptInput } from "../_shared/validation.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  try {
    // Parse and validate input
    const body = await req.json();
    const validation = validateGenerateScriptInput(body);

    if (!validation.success) {
      return createErrorResponse(req, validation.error || 'Invalid input', 400);
    }

    const { topic } = validation.data!;

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
      endpoint: 'generate-script',
      ...RATE_LIMITS.generateScript,
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

    console.log('Generating video script for topic:', topic);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return createErrorResponse(req, 'Server configuration error', 500);
    }

    // Generate video script
    const scriptResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a professional video scriptwriter. Create engaging, structured video scripts.

Format your response as JSON with this structure:
{
  "title": "Video title",
  "scenes": [
    {
      "sceneNumber": 1,
      "duration": "10 seconds",
      "voiceOver": "What the narrator says",
      "visualDescription": "Description of what's shown on screen",
      "notes": "Optional production notes"
    }
  ]
}

Make scripts engaging, clear, and visually descriptive. Typically 4-6 scenes for a short video.`
          },
          {
            role: 'user',
            content: `Create a video script about: ${topic}`
          }
        ],
      }),
    });

    if (!scriptResponse.ok) {
      const errorText = await scriptResponse.text();
      console.error('AI gateway error:', scriptResponse.status, errorText);
      return createErrorResponse(req, 'Failed to generate script. Please try again.', 502);
    }

    const scriptData = await scriptResponse.json();
    const scriptContent = scriptData.choices[0].message.content;
    console.log('Generated script successfully');

    // Parse the JSON response
    let parsedScript;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = scriptContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || scriptContent.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : scriptContent;
      parsedScript = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse script JSON:', e);
      return createErrorResponse(req, 'Failed to parse generated script', 500);
    }

    // Add rate limit headers to successful response
    const headers = {
      ...getCorsHeaders(req),
      ...getRateLimitHeaders(rateLimitResult),
      'Content-Type': 'application/json',
    };

    return new Response(
      JSON.stringify({ script: parsedScript }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Error in generate-video-script:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return createErrorResponse(req, errorMessage, 500);
  }
});
