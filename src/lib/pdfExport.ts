import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Scene {
  sceneNumber: number;
  duration: string;
  voiceOver: string;
  visualDescription: string;
  notes?: string;
}

interface StoryboardImage {
  sceneNumber: number;
  imageUrl: string;
}

interface Project {
  id: string;
  title: string;
  topic: string;
  script: { title: string; scenes: Scene[] };
  storyboard_images?: StoryboardImage[];
  total_duration?: string;
  created_at: string;
}

export const exportProjectToPDF = async (project: Project): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to add new page if needed
  const checkAndAddPage = (neededSpace: number) => {
    if (yPosition + neededSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to add page number
  const addPageNumber = (pageNum: number) => {
    pdf.setFontSize(9);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  };

  // Page 1: Cover Page
  pdf.setFontSize(32);
  pdf.setTextColor(0, 0, 0);
  pdf.text(project.script.title || 'Video Script', pageWidth / 2, 80, { align: 'center' });

  pdf.setFontSize(16);
  pdf.setTextColor(100, 100, 100);
  pdf.text(project.topic, pageWidth / 2, 100, { align: 'center' });

  pdf.setFontSize(12);
  const createdDate = new Date(project.created_at).toLocaleDateString();
  pdf.text(`Generated: ${createdDate}`, pageWidth / 2, 120, { align: 'center' });

  if (project.total_duration) {
    pdf.text(`Duration: ${project.total_duration}`, pageWidth / 2, 135, { align: 'center' });
  }

  pdf.text(`Total Scenes: ${project.script.scenes.length}`, pageWidth / 2, 150, { align: 'center' });

  addPageNumber(1);

  // Page 2: Table of Contents
  pdf.addPage();
  yPosition = margin;
  let currentPage = 2;

  pdf.setFontSize(20);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Table of Contents', margin, yPosition);
  yPosition += 15;

  pdf.setFontSize(11);
  project.script.scenes.forEach((scene, index) => {
    if (checkAndAddPage(10)) {
      currentPage++;
      addPageNumber(currentPage);
    }
    const pageNum = 3 + index; // Starting from page 3
    pdf.text(`Scene ${scene.sceneNumber}: ${scene.duration}`, margin + 5, yPosition);
    pdf.text(`${pageNum}`, pageWidth - margin - 10, yPosition, { align: 'right' });
    yPosition += 8;
  });

  addPageNumber(currentPage);

  // Pages 3+: Script Content with Storyboard Images
  for (let i = 0; i < project.script.scenes.length; i++) {
    const scene = project.script.scenes[i];
    pdf.addPage();
    currentPage++;
    yPosition = margin;

    // Scene Header
    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Scene ${scene.sceneNumber}`, margin, yPosition);
    yPosition += 10;

    // Duration
    pdf.setFontSize(11);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Duration: ${scene.duration}`, margin, yPosition);
    yPosition += 10;

    // Storyboard Image
    const storyboardImage = project.storyboard_images?.find(
      (img) => img.sceneNumber === scene.sceneNumber
    );

    if (storyboardImage?.imageUrl) {
      try {
        // Create temporary image element
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = storyboardImage.imageUrl;

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        // Calculate dimensions to fit within content area
        const maxWidth = contentWidth;
        const maxHeight = 80;
        const imgRatio = img.width / img.height;
        let imgWidth = maxWidth;
        let imgHeight = imgWidth / imgRatio;

        if (imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = imgHeight * imgRatio;
        }

        pdf.addImage(storyboardImage.imageUrl, 'PNG', margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      } catch (error) {
        console.warn(`Failed to load image for scene ${scene.sceneNumber}:`, error);
        yPosition += 5;
      }
    }

    checkAndAddPage(20);

    // Voice Over
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Voice Over:', margin, yPosition);
    yPosition += 7;

    pdf.setFontSize(10);
    const voiceOverLines = pdf.splitTextToSize(scene.voiceOver, contentWidth);
    pdf.text(voiceOverLines, margin, yPosition);
    yPosition += voiceOverLines.length * 5 + 5;

    checkAndAddPage(20);

    // Visual Description
    pdf.setFontSize(12);
    pdf.text('Visual Description:', margin, yPosition);
    yPosition += 7;

    pdf.setFontSize(10);
    const visualLines = pdf.splitTextToSize(scene.visualDescription, contentWidth);
    pdf.text(visualLines, margin, yPosition);
    yPosition += visualLines.length * 5 + 5;

    // Notes (if available)
    if (scene.notes) {
      checkAndAddPage(20);
      pdf.setFontSize(12);
      pdf.text('Notes:', margin, yPosition);
      yPosition += 7;

      pdf.setFontSize(10);
      const notesLines = pdf.splitTextToSize(scene.notes, contentWidth);
      pdf.text(notesLines, margin, yPosition);
      yPosition += notesLines.length * 5;
    }

    addPageNumber(currentPage);
  }

  // Last Page: Summary
  pdf.addPage();
  currentPage++;
  yPosition = margin;

  pdf.setFontSize(20);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Summary', margin, yPosition);
  yPosition += 15;

  pdf.setFontSize(12);
  pdf.text(`Total Scenes: ${project.script.scenes.length}`, margin, yPosition);
  yPosition += 10;

  if (project.total_duration) {
    pdf.text(`Total Duration: ${project.total_duration}`, margin, yPosition);
    yPosition += 10;
  }

  const exportDate = new Date().toLocaleString();
  pdf.text(`Exported: ${exportDate}`, margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Generated by Video Script AI', margin, yPosition);

  addPageNumber(currentPage);

  // Save PDF
  const filename = `video-script-${project.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.pdf`;
  pdf.save(filename);
};
