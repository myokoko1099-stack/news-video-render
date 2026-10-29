import React from 'react';
import {Composition} from 'remotion';
import {NewsVideo, NewsProps} from './NewsVideo';
import sample from './sample.json';

const FPS = 30;

export const Root: React.FC = () => {
  return (
    <Composition
      id="News"
      component={NewsVideo}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={300}
      defaultProps={sample as NewsProps}
      calculateMetadata={({props}) => {
        const total = (props as NewsProps).scenes.reduce(
          (acc, s) => acc + Math.max(1, Math.round(s.duration_sec * FPS)),
          0
        );
        return {durationInFrames: Math.max(1, total)};
      }}
    />
  );
};
