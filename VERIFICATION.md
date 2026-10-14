# v1.7 verification — 14 October 2026

189 automated checks passed across ten suites. They cover the retained app content, five answer formats, saved-round validation, search, fixed-length diagram limbs, cumulative revision, certificate qualification and restoration, malformed progress, deterministic builds and injection-resistant bundling.

Observed browser checks on the final candidate included:

- Ten-question Basics check completed through the actual controls, including ordering, matching, pictures and multiple answers: 10/10 awarded a certificate.
- Confidence check deliberately completed at 9/10: no award, missed question added to revision, linked lesson offered.
- A revision round resumed after reload; answering correctly removed its question from revision. No certificate was awarded for the short retry.
- The Basics certificate persisted after reload and accepted an optional preview name. The name was not retained when the preview was reopened.
- All eight start-signal game cues completed to a results screen. Whistle and spoken-command playback reached their playing/finished states without browser errors; explicit stop and written alternatives are available.
- Personal progress, certificates and start rehearsal checked at 390px width without horizontal page overflow.
- The contact button remained available without a visible email address.
- A separate, labelled storage-denied QA build showed the session-only message and allowed a stage check to begin; it reported no external resource requests and no console errors.

Limits: the Print button opened a print sheet, but the automation could not inspect that sheet. The certificate preview was inspected; final paper/PDF output still needs a human print check. No listening-quality or hearing-accessibility assessment is claimed. Direct file-URL operation was not tested by browser automation. No actual newcomer/parent/experienced participant sessions, qualified-official sign-off or screen-reader-device assessment have been completed.

The approved v1.6 local baseline remains unchanged. Starting-block artwork and the fixed-proportion observation poses are unchanged in this release.
