import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
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
  visual_query_en?: string;
  duration_sec: number;
  clip_url?: string | null;
};

export type NewsProps = {
  channel: string;
  headline_my: string;
  source_my?: string;
  scenes: Scene[];
};

const BODY = 'NotoMy, sans-serif';
const BOLD = 'NotoMyBold, NotoMy, sans-serif';
const GRADIENTS = [
  'linear-gradient(160deg, #0b1f3a 0%, #123a63 100%)',
  'linear-gradient(160deg, #1b1b3a 0%, #3a2a63 100%)',
  'linear-gradient(160deg, #0d2b2b 0%, #14506a 100%)',
  'linear-gradient(160deg, #2a1a1a 0%, #5a2a3a 100%)',
];

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

const SceneView: React.FC<{scene: Scene; index: number; frames: number}> = ({
  scene,
  index,
  frames,
}) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, frames], [1, 1.08], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [frames - 6, frames], [1, 0.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const lines = scene.caption_lines_my ?? [];

  return (
    <AbsoluteFill style={{opacity: fadeOut}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        {scene.clip_url ? (
          <OffthreadVideo
            src={scene.clip_url}
            muted
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        ) : (
          <AbsoluteFill style={{background: GRADIENTS[index % GRADIENTS.length]}} />
        )}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.6) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          top: 1080,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          alignItems: 'center',
        }}
      >
        {lines.map((line, i) => {
          const start = 6 + i * 8;
          const opacity = interpolate(frame, [start, start + 10], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const y = interpolate(frame, [start, start + 10], [24, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `translateY(${y}px)`,
                background: 'rgba(0,0,0,0.62)',
                color: '#ffffff',
                fontFamily: BODY,
                fontWeight: 500,
                fontSize: 58,
                lineHeight: 1.9,
                padding: '6px 36px',
                borderRadius: 24,
                textAlign: 'center',
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const NewsVideo: React.FC<NewsProps> = ({
  channel,
  headline_my,
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
  const headIn = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: '#05101f'}}>
      {items.map(({scene, index, from: start, frames}) => (
        <Sequence key={index} from={start} durationInFrames={frames}>
          <SceneView scene={scene} index={index} frames={frames} />
        </Sequence>
      ))}

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: 10,
          width: `${progress * 100}%`,
          background: '#ff4d4d',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 110,
          left: 60,
          right: 60,
          opacity: headIn,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            background: '#ff4d4d',
            color: '#fff',
            fontFamily: 'sans-serif',
            fontWeight: 800,
            fontSize: 36,
            letterSpacing: 4,
            padding: '8px 24px',
            borderRadius: 12,
            marginBottom: 28,
          }}
        >
          {channel}
        </div>
        <div
          style={{
            borderLeft: '10px solid #ff4d4d',
            paddingLeft: 28,
            color: '#ffffff',
            fontFamily: BOLD,
            fontWeight: 700,
            fontSize: 68,
            lineHeight: 1.7,
          }}
        >
          {headline_my}
        </div>
      </div>

      {source_my ? (
        <div
          style={{
            position: 'absolute',
            left: 60,
            right: 60,
            top: 1560,
            color: '#b8c7d9',
            fontFamily: BODY,
            fontWeight: 500,
            fontSize: 36,
            lineHeight: 1.8,
            textAlign: 'center',
          }}
        >
          {source_my}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
