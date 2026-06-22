<?php
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Library callbacks for the Quiz Rubric Grader plugin.
 *
 * @package    local_quizrubricgrader
 * @copyright  2026 Skin Cancer College Australasia
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Inject the rubric grading interface on quiz manual-grading pages.
 *
 * Called by Moodle on every page request via the local plugin callback
 * mechanism. The AMD behaviour is only requested on the quiz grading,
 * review and comment endpoints; the plugin's styles.css is auto-loaded
 * site-wide by Moodle, and jQuery is pulled in as an AMD dependency by
 * the module itself.
 *
 * @return void
 */
function local_quizrubricgrader_before_http_headers() {
    global $PAGE;

    $path = $PAGE->url->get_path();
    $mode = optional_param('mode', '', PARAM_ALPHA);

    $isgradingpage =
        strpos($path, '/mod/quiz/comment.php') !== false ||
        strpos($path, '/mod/quiz/review.php') !== false ||
        strpos($path, '/mod/quiz/grading.php') !== false ||
        (strpos($path, '/mod/quiz/report.php') !== false && $mode === 'grading');

    if ($isgradingpage) {
        $PAGE->requires->js_call_amd('local_quizrubricgrader/grader', 'init');
    }
}
