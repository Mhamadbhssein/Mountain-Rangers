import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Composition,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Props = {};

const calculateMetadata: CalculateMetadataFunction<Props> = () => {
  return {};
};

export const MyComposition = () => {
  return (
    <Composition
      id="HelloWorld"
      component={MyComponent}
      durationInFrames={120}
      fps={30}
      width={1920}
      height={1080}
      calculateMetadata={calculateMetadata}
    />
  );
};

export const MyComponent: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 32,
        backgroundColor: "#0b1020",
        fontFamily: "Inter, Helvetica, Arial, sans-serif",
      }}
    >
      <Interactive.Div
        name="Title"
        style={{
          fontSize: 180,
          fontWeight: 800,
          color: "#ffffff",
          letterSpacing: "-0.03em",
          opacity: interpolate(
            frame,
            [0, 0.6 * fps, durationInFrames - 0.5 * fps, durationInFrames],
            [0, 1, 1, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          scale: interpolate(frame, [0, 1 * fps], [0.6, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 12 }),
            output: "perceptual-scale",
          }),
        }}
      >
        Hello World
      </Interactive.Div>
      <Interactive.Div
        name="Subtitle"
        style={{
          fontSize: 64,
          fontWeight: 500,
          color: "#7dd3fc",
          opacity: interpolate(
            frame,
            [0.8 * fps, 1.4 * fps, durationInFrames - 0.5 * fps, durationInFrames],
            [0, 1, 1, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          translate: interpolate(frame, [0.8 * fps, 1.4 * fps], ["0px 40px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Made with Remotion
      </Interactive.Div>
    </AbsoluteFill>
  );
};
