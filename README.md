# Swimming_Race_Rules

Swimming Race Rules by Fleetwood Mako’s — **v1.7**.

An independent, browser-based learning resource for swimmers, parents and prospective volunteers. Eight guided lessons, 80 practice questions, a searchable swimming rulebook, pool diagrams and coaching guidance help people build confidence at their own pace.

## Open the app

Open the root `index.html` on a static host, or download `dist/index.html` and open it in a modern browser, or serve this repository locally and visit `/dist/index.html`. The root and `dist` copies are identical. The app is a single self-contained HTML file; no installation, account, external fonts or network assets are required. Official source links and the email button open external destinations only when selected.

## New in v1.7

- Personal progress by swimming topic, with completed lesson practices and recent rounds.
- Revision collects questions missed across completed rounds. A later correct answer removes a question from revision.
- Results identify useful topics and lessons to revisit.
- Optional whistle and spoken-command playback, with written cues, volume and stop controls. An eight-cue game covers dive and backstroke starts. Sound never starts automatically.
- Optional Basics, Confidence and Challenge certificates. Each requires **10/10 on a separate, unhinted stage check**. Short revision rounds cannot earn certificates. The printable certificate accepts an optional name and can be skipped.
- The Workforce Coordinator email button remains; the address is no longer displayed as page text. The address is necessarily discoverable in the mail link.

## Privacy and saved progress

Progress is stored in this browser, on this device. There is no analytics service or account and no transmission of answers or certificate names to the club. The optional certificate name is held only while its preview is open; it is not stored by the app. If browser storage is unavailable, learning continues for the current page session. Changing browser, device or hosting address does not transfer progress. Clearing browser data removes it.

The stage certificate is a club learning achievement, not an official swimming award, water-safety assessment or officials qualification. It is not a secure credential. Adults can skip the certificate and continue learning.

## Build and test

Use Node.js 20 or newer. No third-party packages are needed.

```sh
node tools/build.mjs
node tools/test.mjs
```

The build bundles `src/` into `dist/index.html` and calculates a restrictive Content Security Policy from the exact scripts and styles. Tests cover content, scoring, storage restoration, search, geometry, certificates and packaging. Test reports are written locally to `reports/`.

To preview locally:

```sh
python3 -m http.server 8766 --bind 127.0.0.1
```

Open `http://127.0.0.1:8766/dist/index.html`.

## Scope and review

The app distinguishes formal rules, explanations, club coaching and later commentary. It includes the entire World Aquatics swimming section in the master table. Rules-source links and the 2026 changes section are retained. England application questions concerning the August breaststroke and butterfly departure clarifications remain highlighted; uncertain conclusions are excluded from scored questions.

See `VERIFICATION.md` for observed checks and their limits. This is an independent club resource with no World Aquatics or Swim England endorsement. Qualified-official review and real participant sessions remain outstanding. Sound examples illustrate the cues; they do not prescribe whistle duration, pauses or the sound used at a particular meet.

`review/participant-review.html` is an optional facilitator pack for future testing. It contains no participant results.
