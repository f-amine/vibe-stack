# Reel music library

Drop royalty-free MP3 / WAV / M4A / OGG files into the mood subdirectories. The `pnpm reel:music` worker picks one at random from the mood matching the reel's manifest. Tracks should be loop-friendly or at least one minute long.

```
energetic/      driving, percussive, BPM 110+
contemplative/  ambient, sparse, BPM 80-100
urgent/         tense, low-mid heavy, BPM 100-120
chill/          warm, slow, BPM 70-90
```

If a mood directory is empty when `pnpm reel:music --slug <slug> --mood <mood>` runs, the worker exits 78 (skipped) and the reel renders without a music bed. Captions and voiceover still play.

Recommended sources for hand-curated tracks (all CC0 / royalty-free as of 2026):

- [Pixabay Music](https://pixabay.com/music/)
- [FMA Free Music Archive](https://freemusicarchive.org/)
- [Uppbeat free tier](https://uppbeat.io/) (requires credit on the post itself)
- [Epidemic Sound](https://www.epidemicsound.com/) (paid; check licensing for Reel use)

Do not commit non-royalty-free tracks. Do not commit anything > 5MB.
