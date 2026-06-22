# Changelog

## 1.1.0 (2026-06-22)

- Converted the original standalone script into a structurally compliant Moodle
  local plugin (Stage 1 of the development roadmap in README.md).
- JavaScript rewritten as a Moodle ES6 module (`amd/src/grader.js`), built to
  `amd/build/grader.min.js` with the grunt/rollup pipeline and loaded via
  `js_call_amd`; ESLint-clean.
- Stylesheet now served through Moodle's standard plugin CSS aggregation (the
  previous JS link-injection hack removed), scoped to `body.rs-grading-page`,
  and reworked to use selector specificity instead of `!important`;
  Stylelint-clean.
- Debug console output silenced; dead code (the superseded single-rubric
  update methods) removed.
- Fixed grading bugs surfaced in review:
  - defined the missing `findMarkInput()` — a `/100` rubric previously threw
    `TypeError` before the mark/feedback was written;
  - percentage-based marking guides are now scaled to the question's real
    maximum mark instead of writing the raw percentage;
  - weighted marking guides (`rs-wmg`) are detected before the generic
    marking-guide branch, so weights render correctly;
  - mark lookups now target only visible grade inputs and never the hidden
    `*-maxmark` field;
  - the `rs-grading-page` body class (and its styling) is applied only once a
    rubric table is found, leaving ordinary grading pages unchanged.
- Baseline raised to Moodle 5.0+ / PHP 8.2+.
- Added standard Moodle GPL headers and PHPDoc blocks across all PHP files.
- Added a GitHub Actions CI workflow (PHP 8.2–8.4, pgsql + mysqli, Moodle
  5.0/5.1/5.2 + main, timezone Australia/Sydney) running the full
  moodle-plugin-ci suite, including grunt and behat.

## 1.0 (2026-02-05)

- Initial release.
