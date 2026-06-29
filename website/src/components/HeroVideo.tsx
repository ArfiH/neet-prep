import { ReactNode, useEffect, useRef } from 'react';

export default function HeroVideo({ src, poster, children }: { src: string; poster: string; children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches && videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  return (
    <div className="hero-wrapper">
      <video
        ref={videoRef}
        className="hero-video"
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div className="hero-overlay" />
      <div className="hero-content">
        {children}
      </div>
    </div>
  );
}
