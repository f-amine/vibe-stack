import "dotenv/config";

const key = process.env.ELEVENLABS_API_KEY ?? process.env.ELEVEN_API_KEY;
console.error("key set?", !!key, "len:", (key ?? "").length);
if (!key) {
	process.exit(1);
}
const r = await fetch("https://api.elevenlabs.io/v1/voices", {
	headers: { "xi-api-key": key },
});
console.error("status:", r.status);
const text = await r.text();
console.error("body bytes:", text.length);
try {
	const j = JSON.parse(text) as {
		voices?: Array<{
			voice_id: string;
			name: string;
			category: string;
			labels?: { gender?: string; accent?: string };
		}>;
	};
	for (const v of j.voices ?? []) {
		const lab = v.labels ?? {};
		console.log(
			`${v.voice_id}  ${v.category.padEnd(10)} ${v.name.padEnd(22)} ${(lab.gender ?? "?").padEnd(8)} ${lab.accent ?? "?"}`,
		);
	}
} catch (err) {
	console.error("parse err:", err);
}
console.error("body:", text.slice(0, 500));
