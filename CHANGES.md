# Changelog

## 1.1.0 (2026-06-22)

- Converted the original standalone script into a structurally compliant Moodle
  local plugin (Stage 1 of the development roadmap in README.md).
- JavaScript repackaged as an AMD module (`amd/src/grader.js`, built to
  `amd/build/grader.min.js`) and loaded via `js_call_amd`.
- Stylesheet now served through Moodle's standard plugin CSS aggregation; the
  previous JS link-injection hack has been removed.
- Debug console output silenced.
- Baseline raised to Moodle 5.0+ / PHP 8.2+.
- Added standard Moodle GPL headers and PHPDoc blocks across all PHP files.
- Added a GitHub Actions CI workflow (PHP 8.2–8.4, pgsql + mysqli, Moodle
  5.0/5.1, timezone Australia/Sydney).

## 1.0 (2026-02-05)

- Initial release.
