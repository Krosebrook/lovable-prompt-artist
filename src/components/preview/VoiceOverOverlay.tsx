interface VoiceOverOverlayProps {
  text: string;
  progress: number;
}

export const VoiceOverOverlay = ({ text, progress }: VoiceOverOverlayProps) => {
  // Calculate how many words to show based on progress
  const words = text.split(' ');
  const wordsToShow = Math.ceil(words.length * progress);
  const displayText = words.slice(0, wordsToShow).join(' ');

  return (
    <div className="absolute bottom-20 left-0 right-0 px-8">
      <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 max-w-4xl mx-auto">
        <p className="text-white text-center text-lg leading-relaxed">
          {displayText}
          {wordsToShow < words.length && <span className="animate-pulse">|</span>}
        </p>
      </div>
    </div>
  );
};
