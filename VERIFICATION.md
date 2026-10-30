# v1.10 verification

The PDF form was checked on 30 October 2026. Read [the full coverage review](docs/DQ-FORM-REVIEW.md) and [the 55-row audit](docs/dq-form-coverage.csv).

Automated checks cover the existing application and new DQ mapping/search/offline packaging. Reports are in `reports/`.

The original two-page PDF was rendered and visually inspected. On 30 October 2026 the built-in browser displayed the updated local app at http://127.0.0.1:8766/dist/index.html#dq. The DQ page layout, code search (7.7), linked rule dialog and original PDF download were checked. The browser-downloaded PDF has the same SHA-256 as the supplied original. A separate mobile viewport check remains outstanding. Production deployment is checked separately after the GitHub update.

The rest of the rulebook retains its existing baseline and review boundaries. This is not a claim of qualified-official review or a fresh full regulatory audit.
