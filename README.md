# Clear Speech 🎤

**Free, private speech evaluation for 6–15 minute speeches.**
Upload audio, video or text, record live, or paste a transcript, and get scores on the eight Toastmasters contest criteria, a coaching plan, badges and a shareable score card.

Built by [Venkateswara Rao Banday](https://www.linkedin.com/in/venkateswararao-banday) · Open to work · London, UK

## Features

- 📁 **Upload** audio (MP3, WAV, M4A), video (MP4, MOV, WEBM) or text (TXT, SRT, VTT, MD)
- 🤖 **In-browser AI transcription** using open-source Whisper (`Xenova/whisper-tiny.en` via Transformers.js). No server, no API key, no cost
- 🎙 **Live recording** with real-time transcript (Web Speech API)
- 📝 **Paste transcript** with optional speaking time, plus a sample speech
- ⏱ Built for **6–15 minute** speeches with target-time presets
- 📊 **Eight benchmark scores**: Speech Development, Effectiveness, Value, Physical Delivery, Voice, Manner, Appropriateness, Correct Language
- 📏 Pace (wpm), pauses, filler words, hedging, structure, storytelling, vocabulary and timing metrics
- 🎯 Strengths, opportunities, prioritised next steps and a personalised coaching script
- 🏅 Achievement badges and progress tracking across speeches
- 📣 Downloadable PNG score card plus LinkedIn and WhatsApp sharing
- 🖨 Save the report as PDF through the browser print dialog
- 🌗 Light and dark mode, mobile friendly, no sign-up
- 🔒 Files never leave the browser

## Project structure

```
clear-speech/
├── index.html    # page, styles, creator profile
├── app.js        # transcription, analysis, scoring, sharing
├── netlify.toml  # Netlify config
└── README.md
```

## Deploy for free

### 1. Push to GitHub
1. Create a new repository on GitHub (for example `clear-speech`).
2. Upload all four files to the repository root (**Add file → Upload files**), then commit.

### 2. Publish on Netlify
1. Sign in at [netlify.com](https://www.netlify.com) with GitHub.
2. **Add new site → Import an existing project → GitHub**, then pick your repository.
3. Leave the build command empty and set the publish directory to `.` (netlify.toml already does this). Click **Deploy**.
4. Optional: **Site settings → Change site name** for a friendly URL, such as `clear-speech.netlify.app`.

*(Quick alternative: drag the folder onto [app.netlify.com/drop](https://app.netlify.com/drop).)*

Alternatively, GitHub Pages works too: **Settings → Pages → Deploy from branch → main / root**.

## Customise

- **Profile and links:** edit the `#prof` section at the bottom of `index.html`.
- **Scoring rules, filler and hedge lists:** edit the top of `app.js` (`FILL`, `HEDGE`) and the `analyse()` function.
- **Better transcription accuracy:** in `app.js`, change `Xenova/whisper-tiny.en` to `Xenova/whisper-base.en` (larger download, slower, more accurate).
- **Non-English speech:** use a multilingual model such as `Xenova/whisper-small` and set the language option.

## Limitations

- Scores are indicative, rule-based guidance, not official Toastmasters judging or a human coach.
- Physical Delivery is self-rated because audio and text can’t show gestures.
- Browser decoding of very large videos (over ~200 MB) may fail. Extract the audio first, or paste a transcript.
- The first audio/video transcription downloads a ~40 MB model once (cached afterwards). Needs a modern browser (Chrome, Edge, Safari 16+, Firefox).
- Live recording works best in Chrome, Edge or Safari, and some browsers send audio to their own speech service.

## Licence

MIT. Free to use, modify and share. A credit link is appreciated.
