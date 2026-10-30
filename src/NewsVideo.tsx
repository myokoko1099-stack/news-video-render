import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  OffthreadVideo,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export type Scene = {
  idx?: number;
  narration_my?: string;
  caption_lines_my?: string[];
  highlight_my?: string;
  visual_query_en?: string;
  duration_sec: number;
  clip_url?: string | null;
  audio_file?: string;
};

export type NewsProps = {
  channel: string;
  headline_my: string;
  date_my?: string;
  source_my?: string;
  scenes: Scene[];
};

const BODY = 'NotoMy, sans-serif';
const BOLD = 'NotoMyBold, NotoMy, sans-serif';
const RED = '#ff4d4d';
const PANEL_GRADIENTS = [
  'linear-gradient(150deg, #123a63 0%, #0b1f3a 100%)',
  'linear-gradient(150deg, #3a2a63 0%, #1b1b3a 100%)',
  'linear-gradient(150deg, #14506a 0%, #0d2b2b 100%)',
  'linear-gradient(150deg, #5a2a3a 0%, #2a1a1a 100%)',
];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const easeOut = Easing.out(Easing.cubic);

const useFonts = () => {
  const [handle] = useState(() => delayRender('Loading Myanmar fonts'));
  useEffect(() => {
    const regular = new FontFace(
      'NotoMy',
      `url(${staticFile('NotoSansMyanmar-Medium.otf')})`,
      {weight: '500'}
    );
    const bold = new FontFace(
      'NotoMyBold',
      `url(${staticFile('NotoSansMyanmar-Bold.otf')})`,
      {weight: '700'}
    );
    Promise.all([regular.load(), bold.load()])
      .then((fonts) => {
        fonts.forEach((f) => document.fonts.add(f));
        continueRender(handle);
      })
      .catch((err) => {
        console.error('Font load failed', err);
        continueRender(handle);
      });
  }, [handle]);
};

const SceneView: React.FC<{
  scene: Scene;
  index: number;
  frames: number;
  isLast: boolean;
}> = ({scene, index, frames, isLast}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 14], [0, 1], {...clamp, easing: easeOut});
  const exit = isLast ? 1 : interpolate(frame, [frames - 8, frames], [1, 0], clamp);
  const opacity = Math.min(enter, exit);
  const slide = (1 - enter) * 80;
  const zoom = interpolate(frame, [0, frames], [1, 1.07], clamp);
  const lines = scene.caption_lines_my ?? [];
  const label = String(scene.idx ?? index + 1).padStart(2, '0');
  const hl = scene.highlight_my ?? '';
  const hlSize = hl.length > 14 ? 76 : hl.length > 8 ? 96 : 120;
  const hasClip = Boolean(scene.clip_url);
  const totalChars = Math.max(1, lines.join('').length);

  return (
    <AbsoluteFill>
      {scene.audio_file ? <Audio src={staticFile(scene.audio_file)} /> : null}
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 540,
          width: 960,
          height: 700,
          borderRadius: 36,
          overflow: 'hidden',
          border: '2px solid rgba(255,255,255,0.14)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          opacity,
          transform: `translateX(${slide}px)`,
        }}
      >
        <div style={{position: 'absolute', inset: 0, transform: `scale(${zoom})`}}>
          {hasClip ? (
            <OffthreadVideo
              src={scene.clip_url as string}
              muted
              style={{width: '100%', height: '100%', objectFit: 'cover'}}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: PANEL_GRADIENTS[index % PANEL_GRADIENTS.length],
              }}
            />
          )}
        </div>
        {hasClip ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.7) 100%)',
            }}
          />
        ) : null}
        <div
          style={{
            position: 'absolute',
            top: 28,
            left: 32,
            background: RED,
            color: '#fff',
            fontFamily: 'sans-serif',
            fontWeight: 800,
            fontSize: 30,
            letterSpacing: 3,
            padding: '6px 20px',
            borderRadius: 10,
          }}
        >
          {'NO. ' + label}
        </div>
        {hl ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: hasClip ? 'flex-end' : 'center',
              justifyContent: 'center',
              padding: hasClip ? '0 50px 44px 50px' : '0 60px',
              textAlign: 'center',
              color: '#ffffff',
              fontFamily: BOLD,
              fontWeight: 700,
              fontSize: hasClip ? 76 : hlSize,
              lineHeight: 1.7,
            }}
          >
            {hl}
          </div>
        ) : null}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 1290,
          width: 960,
          opacity,
          transform: `translateY(${(1 - enter) * 40}px)`,
        }}
      >
        <div
          style={{
            background: 'rgba(0,0,0,0.68)',
            borderRadius: 30,
            padding: '18px 36px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {lines.map((line, i) => {
            const before = lines.slice(0, i).join('').length;
            const start = Math.round(10 + Math.max(0, frames - 30) * (before / totalChars));
            const o = interpolate(frame, [start, start + 10], [0, 1], clamp);
            return (
              <div
                key={i}
                style={{
                  opacity: o,
                  color: '#ffffff',
                  fontFamily: BODY,
                  fontWeight: 500,
                  fontSize: 56,
                  lineHeight: 1.85,
                  textAlign: 'center',
                }}
              >
                {line}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const NewsVideo: React.FC<NewsProps> = ({
  channel,
  headline_my,
  date_my,
  source_my,
  scenes,
}) => {
  useFonts();
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  let from = 0;
  const items = scenes.map((scene, index) => {
    const frames = Math.max(1, Math.round(scene.duration_sec * fps));
    const item = {scene, index, from, frames};
    from += frames;
    return item;
  });

  const progress = Math.min(1, frame / Math.max(1, durationInFrames));
  const headIn = interpolate(frame, [0, 16], [0, 1], {...clamp, easing: easeOut});
  const glowX = 50 + 12 * Math.sin(frame / 70);
  const glowY = 35 + 8 * Math.cos(frame / 90);

  return (
    <AbsoluteFill
      style={{
        background:
          `radial-gradient(circle at ${glowX}% ${glowY}%, #1f5fa8 0%, rgba(31,95,168,0) 55%), ` +
          'linear-gradient(180deg, #07142a 0%, #0a1f3d 60%, #050d1c 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: 10,
          width: `${progress * 100}%`,
          background: RED,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 70,
          left: 60,
          right: 60,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: headIn,
        }}
      >
        <div
          style={{
            background: RED,
            color: '#fff',
            fontFamily: 'sans-serif',
            fontWeight: 800,
            fontSize: 36,
            letterSpacing: 4,
            padding: '8px 26px',
            borderRadius: 12,
          }}
        >
          {channel}
        </div>
        {date_my ? (
          <div
            style={{
              color: '#b8c7d9',
              fontFamily: BODY,
              fontWeight: 500,
              fontSize: 34,
              lineHeight: 1.8,
            }}
          >
            {date_my}
          </div>
        ) : null}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 165,
          left: 60,
          width: 960,
          borderLeft: `12px solid ${RED}`,
          paddingLeft: 30,
          color: '#ffffff',
          fontFamily: BOLD,
          fontWeight: 700,
          fontSize: 70,
          lineHeight: 1.65,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          opacity: headIn,
          transform: `translateY(${(1 - headIn) * -30}px)`,
        }}
      >
        {headline_my}
      </div>

      {items.map(({scene, index, from: start, frames}) => (
        <Sequence key={index} from={start} durationInFrames={frames}>
          <SceneView
            scene={scene}
            index={index}
            frames={frames}
            isLast={index === items.length - 1}
          />
        </Sequence>
      ))}

      {source_my ? (
        <div
          style={{
            position: 'absolute',
            left: 60,
            top: 1600,
            background: 'rgba(255,255,255,0.09)',
            color: '#c9d6e6',
            fontFamily: BODY,
            fontWeight: 500,
            fontSize: 34,
            lineHeight: 1.8,
            padding: '4px 28px',
            borderRadius: 16,
          }}
        >
          {source_my}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
