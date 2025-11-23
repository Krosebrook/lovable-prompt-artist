import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { getCorsHeaders, handleCorsPreflightRequest, createErrorResponse } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { validateShareLinkInput } from "../_shared/validation.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  try {
    // Parse and validate input
    const body = await req.json();
    const validation = validateShareLinkInput(body);

    if (!validation.success) {
      return createErrorResponse(req, validation.error || 'Invalid input', 400);
    }

    const { project_id, expires_in_days } = validation.data!;

    // Create Supabase client with user's auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return createErrorResponse(req, "Unauthorized", 401);
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the authenticated user
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return createErrorResponse(req, "Unauthorized", 401);
    }

    // Check rate limit
    const rateLimitResult = checkRateLimit({
      identifier: user.id,
      endpoint: 'generate-share-link',
      ...RATE_LIMITS.generateShareLink,
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

    // Verify the project belongs to the user
    const { data: project, error: projectError } = await supabaseClient
      .from("video_projects")
      .select("id")
      .eq("id", project_id)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return createErrorResponse(req, "Project not found or unauthorized", 404);
    }

    // Check if an active share already exists
    const { data: existingShare } = await supabaseClient
      .from("public_shares")
      .select("*")
      .eq("project_id", project_id)
      .eq("is_active", true)
      .maybeSingle();

    if (existingShare) {
      // Deactivate existing share before creating new one
      await supabaseClient
        .from("public_shares")
        .update({ is_active: false })
        .eq("id", existingShare.id);
    }

    // Generate unique share token
    const share_token = crypto.randomUUID();

    // Calculate expiration date if specified
    let expires_at = null;
    if (expires_in_days && expires_in_days > 0) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expires_in_days);
      expires_at = expirationDate.toISOString();
    }

    // Create new share
    const { data: newShare, error: shareError } = await supabaseClient
      .from("public_shares")
      .insert({
        project_id,
        share_token,
        expires_at,
        is_active: true,
        view_count: 0,
      })
      .select()
      .single();

    if (shareError) {
      console.error("Error creating share:", shareError);
      return createErrorResponse(req, "Failed to create share link", 500);
    }

    // Add rate limit headers to successful response
    const headers = {
      ...getCorsHeaders(req),
      ...getRateLimitHeaders(rateLimitResult),
      'Content-Type': 'application/json',
    };

    return new Response(
      JSON.stringify({ share_token: newShare.share_token }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Error in generate-share-link:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return createErrorResponse(req, errorMessage, 500);
  }
});
