import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic } = await req.json();
    console.log('Generating video script for topic:', topic);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
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
      throw new Error(`AI generation failed: ${scriptResponse.status}`);
    }

    const scriptData = await scriptResponse.json();
    const scriptContent = scriptData.choices[0].message.content;
    console.log('Generated script:', scriptContent);

    // Parse the JSON response
    let parsedScript;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = scriptContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || scriptContent.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : scriptContent;
      parsedScript = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse script JSON:', e);
      throw new Error('Failed to parse generated script');
    }

    return new Response(
      JSON.stringify({ script: parsedScript }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-video-script:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});