import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
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
  image_url?: string | null;
  image_credit?: string;
  audio_file?: string;
};

export type NewsProps = {
  channel: string;
  tagline_my?: string;
  headline_my: string;
  date_my?: string;
  source_my?: string;
  scenes: Scene[];
};

const BODY = 'NotoMy, sans-serif';
const BOLD = 'NotoMyBold, NotoMy, sans-serif';
const LATIN = 'Helvetica, Arial, sans-serif';
const RED = '#e5301a';
const YELLOW = '#ffd84d';
const GREEN = '#39ff14';
const VIDEO_TOP = 600;
const VIDEO_H = 608;
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
  const enter = interpolate(frame, [0, 12], [0, 1], {...clamp, easing: easeOut});
  const exit = isLast ? 1 : interpolate(frame, [frames - 6, frames], [1, 0], clamp);
  const opacity = Math.min(enter, exit);
  const zoom = interpolate(frame, [0, frames], [1, 1.07], clamp);
  const lines = scene.caption_lines_my ?? [];
  const totalChars = Math.max(1, lines.join('').length);
  const hl = scene.highlight_my ?? '';
  const hlSize = hl.length > 14 ? 76 : hl.length > 8 ? 96 : 120;
  const hasClip = Boolean(scene.clip_url) || Boolean(scene.image_url);

  return (
    <AbsoluteFill>
      {scene.audio_file ? <Audio src={staticFile(scene.audio_file)} /> : null}

      <div
        style={{
          position: 'absolute',
          left: 0,
          top: VIDEO_TOP,
          width: 1080,
          height: VIDEO_H,
          overflow: 'hidden',
          background: '#0b1118',
          opacity,
        }}
      >
        <div style={{position: 'absolute', inset: 0, transform: `scale(${zoom})`}}>
          {scene.clip_url ? (
            <OffthreadVideo
              src={scene.clip_url as string}
              muted
              style={{width: '100%', height: '100%', objectFit: 'cover'}}
            />
          ) : scene.image_url ? (
            <Img
              src={scene.image_url}
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
                'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)',
            }}
          />
        ) : null}
        {hl ? (
          hasClip ? (
            <div
              style={{
                position: 'absolute',
                left: 0,
                bottom: 24,
                background: RED,
                color: '#fff',
                fontFamily: BOLD,
                fontWeight: 700,
                fontSize: 46,
                lineHeight: 1.7,
                padding: '0 30px',
              }}
            >
              {hl}
            </div>
          ) : (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 60px',
                textAlign: 'center',
                color: '#ffffff',
                fontFamily: BOLD,
                fontWeight: 700,
                fontSize: hlSize,
                lineHeight: 1.7,
              }}
            >
              {hl}
            </div>
          )
        ) : null}
        {scene.image_url && scene.image_credit ? (
          <div
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              maxWidth: 640,
              background: 'rgba(0,0,0,0.6)',
              color: '#ffffff',
              fontFamily: LATIN,
              fontSize: 20,
              lineHeight: 1.3,
              padding: '4px 12px',
            }}
          >
            {scene.image_credit}
          </div>
        ) : null}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 40,
          top: 1236,
          width: 1000,
          opacity,
          transform: `translateY(${(1 - enter) * 30}px)`,
        }}
      >
        <div
          style={{
            background: 'rgba(0,0,0,0.58)',
            borderRadius: 28,
            padding: '14px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {lines.map((line, i) => {
            const before = lines.slice(0, i).join('').length;
            const start = Math.round(8 + Math.max(0, frames - 30) * (before / totalChars));
            const o = interpolate(frame, [start, start + 8], [0, 1], clamp);
            return (
              <div
                key={i}
                style={{
                  opacity: o,
                  color: '#ffffff',
                  fontFamily: BODY,
                  fontWeight: 500,
                  fontSize: 54,
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
  tagline_my,
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
  const headIn = interpolate(frame, [0, 14], [0, 1], {...clamp, easing: easeOut});
  const glowX = 50 + 14 * Math.sin(frame / 70);

  return (
    <AbsoluteFill
      style={{
        background:
          `radial-gradient(circle at ${glowX}% 18%, #ff7a3d 0%, rgba(255,122,61,0) 55%), ` +
          'linear-gradient(180deg, #b81d08 0%, #d83a0c 55%, #9d1606 100%)',
      }}
    >
      <AbsoluteFill
        style={{
          background:
            'repeating-linear-gradient(115deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 40px, rgba(255,255,255,0) 40px, rgba(255,255,255,0) 130px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: 10,
          width: `${progress * 100}%`,
          background: '#ffffff',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 95,
          left: 40,
          right: 40,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          opacity: headIn,
          transform: `translateY(${(1 - headIn) * -30}px)`,
        }}
      >
        <div
          style={{
            background: YELLOW,
            borderRadius: 28,
            padding: '16px 34px',
            boxShadow: '0 8px 0 rgba(0,0,0,0.25)',
          }}
        >
          <div
            style={{
              color: '#1a1a1a',
              fontFamily: BOLD,
              fontWeight: 700,
              fontSize: 56,
              lineHeight: 1.8,
              textAlign: 'center',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {headline_my}
          </div>
        </div>
        {date_my ? (
          <div
            style={{
              fontFamily: LATIN,
              fontWeight: 900,
              fontSize: 80,
              lineHeight: 1.1,
              color: GREEN,
              WebkitTextStroke: '9px #062506',
              paintOrder: 'stroke fill',
              letterSpacing: 1,
            }}
          >
            {date_my}
          </div>
        ) : null}
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

      <div
        style={{
          position: 'absolute',
          top: VIDEO_TOP + 18,
          right: 18,
          background: '#ffffff',
          color: '#c4210b',
          fontFamily: LATIN,
          fontWeight: 900,
          fontSize: 28,
          padding: '8px 18px',
          borderRadius: 10,
          letterSpacing: 1,
        }}
      >
        {channel}
      </div>

      {source_my ? (
        <div
          style={{
            position: 'absolute',
            left: 40,
            top: 1496,
            background: 'rgba(0,0,0,0.35)',
            color: '#ffe9d6',
            fontFamily: BODY,
            fontWeight: 500,
            fontSize: 32,
            lineHeight: 1.8,
            padding: '2px 26px',
            borderRadius: 16,
          }}
        >
          {source_my}
        </div>
      ) : null}

      <div
        style={{
          position: 'absolute',
          left: 40,
          right: 40,
          top: 1572,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: LATIN,
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: 112,
            lineHeight: 1.05,
            color: '#ffffff',
            textShadow: '0 7px 0 #6e1103',
            letterSpacing: -2,
          }}
        >
          {channel}
        </div>
        {tagline_my ? (
          <div
            style={{
              display: 'inline-block',
              marginTop: 14,
              background: 'rgba(0,0,0,0.4)',
              color: '#ffe3b8',
              fontFamily: BODY,
              fontWeight: 500,
              fontSize: 40,
              lineHeight: 1.8,
              padding: '0 34px',
              borderRadius: 18,
            }}
          >
            {tagline_my}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
