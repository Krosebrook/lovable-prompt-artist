interface KenBurnsEffectProps {
  imageUrl: string;
  progress: number;
}

export const KenBurnsEffect = ({ imageUrl, progress }: KenBurnsEffectProps) => {
  const scale = 1 + (progress * 0.2); // Zoom from 1.0 to 1.2
  const translateX = progress * -5; // Pan 5% to the left

  return (
    <div className="w-full h-full overflow-hidden">
      <img
        src={imageUrl}
        alt="Scene"
        className="w-full h-full object-cover transition-transform duration-100"
        style={{
          transform: `scale(${scale}) translateX(${translateX}%)`
        }}
      />
    </div>
  );
};
