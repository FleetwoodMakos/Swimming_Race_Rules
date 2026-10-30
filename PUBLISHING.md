# Publication

The user explicitly authorised publishing v1.10 to GitHub and rules.fleetwoodmakos.com on 30 October 2026. This release adds the supplied Aquatics GB DQ form, all 55 reasons and their rule mappings, and targeted rule clarifications. It preserves the current British-date display fix.

Target repository: `FleetwoodMakos/Swimming_Race_Rules`, branch `main`.

Source updates preserve the existing repository visibility and hosting configuration. The runnable app is present at both `index.html` and `dist/index.html`. The existing CNAME for `rules.fleetwoodmakos.com` is preserved. If GitHub Pages is configured to serve the repository root, it can serve the root app. Hosting settings are not changed by the source upload.

The original README commit is retained in Git history. Version 1.6 is preserved separately in the local project as a rollback reference.

For a later release: edit `src/`, update the app/content versions, rebuild, run the tests and check the changed flows in a browser. Commit both source and the rebuilt distribution. Recheck affected rule wording against the primary sources before changing any scored answer. An update to certificate requirements should also change `ACHIEVEMENT_VERSION`.

Do not upload local research downloads, browser QA fixtures generated under `review/`, participant notes, personal browser progress, screenshots of private work or credentials. Keep the generated test reports local; summarize release verification in `VERIFICATION.md`.

Public website hosting, repository visibility changes and DNS configuration are separate decisions.
