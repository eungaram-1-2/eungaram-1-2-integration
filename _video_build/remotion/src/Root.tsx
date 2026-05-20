import React from "react";
import { Composition } from "remotion";
import { EungaramVideo } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="EungaramIntro"
      component={EungaramVideo}
      durationInFrames={1290}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
