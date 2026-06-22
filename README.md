# Quiz Rubric Grader (local_quizrubricgrader)

A Moodle local plugin that injects a rubric-based grading interface into the
Quiz **manual grading** pages, letting teachers apply structured rubrics and
marking guides directly while grading essay and short-answer questions. The
plugin computes a total, fills in the **Mark** field, and writes a formatted
breakdown into the feedback comment editor.

## Features

- Adds a clickable rubric / marking-guide panel to Quiz grading, review and
  comment pages (`/mod/quiz/grading.php`, `report.php?mode=grading`,
  `review.php`, `comment.php`).
- Supports several rubric styles: standard rubrics, weighted rubrics, marking
  guides and weighted marking guides, plus a legacy score-per-cell format.
- Auto-fills the question's **Mark** field, including scaling a percentage
  (`/100`) rubric to the question's real maximum mark, plus a manual
  **Rescale** widget.
- Writes a formatted grading summary into the comment editor (TinyMCE).
- **Split View** — shows the student response on the left and the marking
  controls on the right.
- Lightweight: behaviour is requested only on the relevant grading endpoints;
  the stylesheet is loaded via Moodle's standard plugin CSS aggregation.

## How it works

The rubric itself is authored as an HTML `<table>` carrying `rs-*` CSS classes
(for example `rs-table rs-standard rs-cols-5`, with `rs-cell` cells and
`data-score` / `rs-col-N` markers). The plugin's JavaScript discovers those
tables on the grading page, makes the cells interactive, and drives the mark
and feedback fields. There is no admin configuration in this release.

> Note: hand-authoring rubric tables is the current input mechanism inherited
> from the original script. Replacing it with a managed rubric-definition UI is
> tracked in the roadmap below (Stage 8).

## Requirements

- Moodle 5.0 or higher.
- PHP 8.2 or higher.

## Installing via uploaded ZIP file

1. Log in to your Moodle site as an admin and go to
   _Site administration > Plugins > Install plugins_.
2. Upload the ZIP file. If prompted, choose the plugin type
   _Local plugin (local)_.
3. Check the plugin validation report and finish the installation.

## Installing manually

1. Copy the plugin's contents into `local/quizrubricgrader` within your Moodle
   installation (on Moodle 5.1+ with the split docroot, this is
   `public/local/quizrubricgrader`).
2. Visit _Site administration > Notifications_ to complete the installation,
   or run `php admin/cli/upgrade.php`.

## Usage

Open any Quiz manual-grading page that contains a rubric table. The grading
panel appears automatically: click cells to select them, and the Mark and
feedback fields are populated for you. Always review the result before saving.

## Development roadmap

This release (**Stage 1**) converts the original standalone script into a
structurally compliant Moodle plugin. The remaining stages below bring it fully
into line with the project's `CLAUDE.md` conventions; they are intentionally
deferred so that each can be reviewed as a focused change.

- **Stage 1 — Plugin conversion (this release).** Plugin laid out at the
  repository root; JavaScript packaged as an AMD module
  (`amd/src/grader.js` + built `amd/build/grader.min.js`) loaded via
  `js_call_amd`; stylesheet served through Moodle's CSS aggregation (the old
  JS link-injection hack removed); debug console output silenced; Moodle 5.0 /
  PHP 8.2 baseline; standard Moodle GPL headers and docblocks; privacy
  provider; and a GitHub Actions CI workflow.
- **Stage 2 — Internationalisation & Australian locale.** Extract every
  user-facing string in `grader.js` into `lang/en` and render it via
  `core/str`; apply AU/UK spelling throughout; route any dates through
  `userdate()`.
- **Stage 3 — JS/CSS build pipeline & linting.** Make the plugin pass the
  (now-enabled) `grunt` CI step: produce the official grunt-generated AMD
  build, remove the ~150 retained `self.log()` call sites so the source passes
  ESLint, and refactor the `!important`-heavy CSS to pass Stylelint. Until this
  lands, the `grunt` job is expected to fail.
- **Stage 4 — Hooks API migration.** Replace the legacy
  `before_http_headers` callback in `lib.php` with the Moodle 5.x Hooks API.
- **Stage 5 — Security hardening.** Replace the `innerHTML` / jQuery `.html()`
  HTML construction with safe DOM building (`textContent` / `createElement`)
  and sanitise rubric-derived content before injection.
- **Stage 6 — Automated tests.** Add PHPUnit coverage for the page-detection
  logic in `lib.php` and Behat acceptance tests for the grading workflow
  (using DD/MM/YYYY dates) to exercise the (now-enabled) `behat` CI step.
- **Stage 7 — Configurability & capabilities.** Add admin settings (page
  matching, colours, editor auto-expand height) and a capability controlling
  who sees the grader.
- **Stage 8 — Rubric authoring UX.** Replace the hand-authored `rs-*` HTML
  table input with a managed rubric definition stored by the plugin.

## License

Licensed under the GNU GPL v3 or later — see [LICENSE](LICENSE).

Copyright © 2026 Skin Cancer College Australasia.
