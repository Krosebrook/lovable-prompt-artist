import { supabase } from "@/integrations/supabase/client";

export interface ExportOptions {
  projectId: string;
  resolution: '720p' | '1080p' | '4k';
  fps: 24 | 30 | 60;
  aspectRatio: '16:9' | '9:16' | '1:1';
}

export const exportVideo = async (options: ExportOptions): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('export-video', {
      body: options
    });

    if (error) throw error;

    return data.renderId;
  } catch (error) {
    console.error('Failed to export video:', error);
    throw error;
  }
};

export const checkExportStatus = async (renderId: string) => {
  try {
    // Poll server for render status
    // This would check the external service (e.g., Shotstack) status
    // For now, return mock status
    return {
      status: 'processing',
      progress: 50,
      url: null
    };
  } catch (error) {
    console.error('Failed to check export status:', error);
    throw error;
  }
};
