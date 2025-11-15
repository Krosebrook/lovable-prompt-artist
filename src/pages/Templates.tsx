import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { TemplatePreview } from "@/components/templates/TemplatePreview";
import { CategoryFilter } from "@/components/templates/CategoryFilter";
import { useToast } from "@/hooks/use-toast";

const Templates = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<any[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      setFilteredTemplates(templates.filter(t => t.category === selectedCategory));
    } else {
      setFilteredTemplates(templates);
    }
  }, [selectedCategory, templates]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('script_templates')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
      setFilteredTemplates(data || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    navigate(`/?template=${templateId}`);
  };

  const handlePreview = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setPreviewTemplate(template);
  };

  const categories = Array.from(new Set(templates.map(t => t.category)));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8 px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Script Templates</h1>
          <p className="text-muted-foreground">
            Start with a professional template to create your video script faster
          </p>
        </div>

        <div className="mb-6">
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No templates found in this category</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={handleSelectTemplate}
                onPreview={handlePreview}
              />
            ))}
          </div>
        )}

        <TemplatePreview
          template={previewTemplate}
          open={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      </div>
    </div>
  );
};

export default Templates;
