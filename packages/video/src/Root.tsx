import { Composition, getInputProps } from "remotion";
import { Reel } from "./compositions/Reel";
import { defaultReelManifest } from "./lib/default-manifest";
import { ReelManifestSchema, totalDurationSec } from "./lib/types";

const inputProps = getInputProps() as Record<string, unknown>;
const parsed = ReelManifestSchema.safeParse(inputProps);
const manifest = parsed.success ? parsed.data : defaultReelManifest;

export const RemotionRoot = () => {
	const fps = manifest.fps;
	const durationInFrames = Math.ceil(totalDurationSec(manifest) * fps);
	return (
		<>
			<Composition
				id="Reel"
				component={Reel}
				durationInFrames={durationInFrames}
				fps={fps}
				width={manifest.dimensions.width}
				height={manifest.dimensions.height}
				defaultProps={{ manifest }}
				schema={ReelManifestSchema as never}
			/>
		</>
	);
};
