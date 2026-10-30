# Aquatics GB disqualification card — coverage review

Reviewed 30 October 2026 against the supplied two-page PDF, printed version **25 June 2026**, and the v1.9 app. Release: **v1.10 / 2026.10.30-1**.

## Findings

- **55 reason rows, 41 distinct printed rule references, seven sections.** Every printed code already existed in the master rulebook; no new rule number was needed. The checked rows are now individually searchable and linked to the corresponding rule and any necessary contextual clauses.
- All substantive form points are represented after the targeted clarifications below. Each multi-part touch row retains its separate both-hands, separated-hands and simultaneous-touch findings. Start/turn/finish selections and medley stroke options are preserved in the displayed form wording. The PDF preserves every administrative blank and signature field.
- These numbers count rows, not independent checkboxes. Several rows share a code or offer multiple findings.
- The PDF is unchanged, available as a static file and embedded in the standalone HTML for offline download. It is a printable blank form, not an interactive PDF form.

## Clarifications made

1. **6.4 — backstroke turn:** explicitly state that the turn is initiated when the permitted pull finishes; no pause or glide on the breast. This is also reflected in the backstroke learning card. The baseline already covered immediate continuous single/double-arm pulls, wall contact and leaving on the back.
2. **7.2 — breaststroke orientation:** make clear that being on the breast continues during swimming from the first pull onwards. Link 7.3 for the turn exception and later kick guidance.
3. **10.4.2 — relay order:** explicitly say swim in the declared order, as well as submitting that order before the deadline. Also added to the relay learning card.

## Shorthand requiring context

- The form's body-position rows cite **7.2** and **8.1**; their fuller turn/no-roll context is also in **7.3** and **8.2**. Both links are supplied without changing the printed codes.
- The pool-exit row prints **10.4.7** beside language covering a race or relay section. **10.2.8** governs individual-race exit; **10.4.7** governs relays. Both are linked. The app's club race-day guidance continues to distinguish individual, over-the-top and relay routines, with officials' directions controlling the practical exit.
- **7.4:** the elbow and hip-line rows omit permitted turn/finish/pullout exceptions. Those remain visible alongside the row and in the full rule.
- **7.7 / 8.5:** separated hands do not require a visible gap; incidental finger contact and different touch heights can be legal. Each of the three checkbox findings is retained.
- **5.3 / 6.3 / 8.6:** ordinary-swimming submersion labels must not erase the start/turn allowances or imply general underwater swimming throughout the final 5m. The finish exception requires the head to have passed 5m and the reach for the finish.
- **10.2.7:** the next-race penalty in 10.3 remains linked for entering a race the swimmer is not in.
- **10.4.4:** the standard platform rule does not resolve the separately flagged Micro League water-start exception or its unconfirmed hand-release timing.
- **14.2 / 14.3 / 14.4:** the June form predates the August commentary on tape/nasal strips. Preserve both the card wording and the later guidance, plus the existing English-applicability review notes. No new unqualified tape DQ conclusion has been introduced.
- The form is a reporting aid, not an exhaustive list of all swimming rules, Para/Masters exceptions or event-specific conditions.

## Evidence and boundaries

- Supplied PDF: `../assets/AGB_DQ_FORM_FINAL.pdf`; version read from both rendered pages. PDF metadata modification date is not treated as the rule/form version.
- Aquatics GB officials resources links to the same named form: https://www.britishswimming.org/browse-sport/swimming/officials/general-resources/
- The linked download: https://www.britishswimming.org/documents/5191/AGB_DQ_FORM_FINAL.pdf
- Swim England East Region independently lists the June 2026 version: https://www.eastswimming.org/swimming/useful-documents-for-swimming-officials/
- Detailed 55-row mapping: `dq-form-coverage.csv`. Raw form wording comes from the user's supplied PDF and has only whitespace normalised.
- Cross-check also used the retained February 2026 World Aquatics Part Two text and the app's already documented August commentary. This is a targeted form audit, not a new full-rulebook currency check or a qualified-referee sign-off.

## Verification

- Both original PDF pages rendered and visually inspected; no form fields, annotations, document-open action or JavaScript name tree present.
- All seven section counts, all printed and contextual code targets, and all touch sub-findings checked.
- Search checks cover partial wording, codes, area filters, zero results and direct codes ranked before contextual references.
- Embedded/downloadable and static PDF copies match the original SHA-256.
- Full automated suite includes the new DQ coverage/search/packaging tests.
- **Built-in browser checked on 30 October 2026:** DQ page layout, code search, linked rule dialog and PDF download passed. The downloaded PDF matches the original SHA-256. Separate mobile viewport testing remains outstanding.
- Publication authorised on 30 October 2026. The preceding version remains in Git history.

PDF SHA-256: `b17f7db99f71d423280cff2943e2c72c9401db281ad1022720c24a43e52b007a`

## Section counts

| Section | Reason rows |
|---|---:|
| The Start | 1 |
| Freestyle | 3 |
| Backstroke | 8 |
| Breaststroke | 13 |
| Butterfly | 10 |
| Medley | 4 |
| The Race | 16 |
