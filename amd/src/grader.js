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
 * Rubric grading interface for Quiz manual-grading pages.
 *
 * @module     local_quizrubricgrader/grader
 * @copyright  2026 Skin Cancer College Australasia
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import $ from 'jquery';

/* global tinyMCE */

var RubricGrader = {

    // Debug logging is intentionally a no-op in production. The 150+
    // self.log() call sites are retained and silenced here to avoid a
    // risky bulk edit; their removal is a roadmap item (README Stage 3).
    log: function() {
        return;
    },

    init: function() {
        var self = this;
        self.log('=== INITIALIZING RUBRIC GRADER ===');
        self.log('Current URL: ' + window.location.href);
        self.log('Page path: ' + window.location.pathname);

        $(document).ready(function() {
            self.log('DOM ready');

            // Look for rubric tables
            var $tables = $('.rs-table');
            self.log('Found ' + $tables.length + ' table(s) with rs-table class');

            // Also check for tables without the class
            var $allTables = $('table');
            self.log('Total tables on page: ' + $allTables.length);

            if ($tables.length === 0) {
                self.log('❌ No tables found with rs-table class');
                self.log('Listing all tables to help diagnose:');
                $allTables.each(function(idx) {
                    var classes = $(this).attr('class') || 'none';
                    var id = $(this).attr('id') || 'none';
                    self.log('  Table ' + idx + ': classes="' + classes + '" id="' + id + '"');
                });
                return;
            }

            // A rubric is present, so enable grading-page-specific styling
            // now. Doing this earlier would restyle ordinary grading pages
            // that contain no rubric table.
            $('body').addClass('rs-grading-page');

            $tables.each(function(index) {
                var $table = $(this);
                self.log('Processing table ' + (index + 1));
                self.setupTable($table);
            });

            self.setupClickHandlers();
            self.injectSplitViewButton();

            // Auto-expand TinyMCE editor on page load
            self.autoExpandEditorOnLoad();

            self.log('✅ Initialization complete!');
            self.log('Hover over cells to see the effect, click to select');
        });
    },

    autoExpandEditorOnLoad: function() {
        var self = this;
        self.log('Starting auto-expand checker...');

        // Try multiple times as TinyMCE may load after our script
        var attempts = 0;
        var maxAttempts = 20; // Increased attempts

        var expandInterval = setInterval(function() {
            attempts++;
            self.log('Auto-expand attempt ' + attempts + '/' + maxAttempts);

            // Check for TinyMCE
            if (typeof tinyMCE !== "undefined") {
                self.log('TinyMCE is defined');

                if (tinyMCE.activeEditor) {
                    self.log('TinyMCE activeEditor found!');
                    self.expandTinyMCE();
                    clearInterval(expandInterval);
                    return;
                } else {
                    self.log('TinyMCE defined but no activeEditor yet');
                }

                // Try all editors
                if (tinyMCE.editors && tinyMCE.editors.length > 0) {
                    self.log('Found ' + tinyMCE.editors.length + ' TinyMCE editors');
                    tinyMCE.editors.forEach(function(editor) {
                        self.expandSpecificEditor(editor);
                    });
                    clearInterval(expandInterval);
                    return;
                }
            }

            // Try to find and expand iframe directly
            var $iframe = $('iframe').filter(function() {
                return $(this).attr('id') && $(this).attr('id').indexOf('editor') !== -1;
            });

            if ($iframe.length > 0) {
                self.log('Found editor iframe directly: ' + $iframe.attr('id'));
                $iframe.css('height', '1200px');
                $iframe.closest('.tox-edit-area').css('height', '1200px');
                clearInterval(expandInterval);
                return;
            }

            // Try textarea
            var $textarea = $('textarea[name*="comment"]');
            if ($textarea.length > 0) {
                self.log('Found comment textarea');
                $textarea.attr('rows', 60).css('height', '1200px');
            }

            if (attempts >= maxAttempts) {
                self.log('❌ Auto-expand timeout after ' + maxAttempts + ' attempts');
                self.log('Available elements:');
                self.log('  TinyMCE defined: ' + (typeof tinyMCE !== "undefined"));
                self.log('  Iframes: ' + $('iframe').length);
                self.log('  Textareas: ' + $('textarea').length);
                clearInterval(expandInterval);
            }
        }, 300); // Check every 300ms (faster)
    },

    expandSpecificEditor: function(editor) {
        var self = this;
        try {
            self.log('Expanding specific editor: ' + editor.id);

            // Try iframe
            if (editor.iframeElement) {
                editor.iframeElement.style.height = '1200px';
                self.log('  Set iframe height to 1200px');
            }

            // Try container
            var container = editor.getContainer();
            if (container) {
                var editArea = container.querySelector('.tox-edit-area');
                if (editArea) {
                    editArea.style.height = '1200px';
                    self.log('  Set edit area height to 1200px');
                }
            }

            // Try body element
            var body = editor.getBody();
            if (body) {
                body.style.minHeight = '1180px';
                self.log('  Set body min-height');
            }

            self.log('✅ Editor expanded to 1200px (60 lines)');
        } catch (e) {
            self.log('Error expanding editor: ' + e.message);
        }
    },

    setupTable: function($table) {
        var self = this;
        var $cells = $table.find('.rs-cell');
        self.log('Found ' + $cells.length + ' clickable cells');
        $cells.each(function(idx) {
            var score = $(this).attr('data-score');
            if (idx < 3) {
 self.log('  Cell ' + idx + ' has score: ' + score);
}
        });
        $cells.each(function() {
 $(this).addClass('rs-clickable');
});

        // Inject score badge into each cell from data-score (survives Moodle DB stripping)
        $cells.each(function() {
            var $cell = $(this);
            var score = $cell.attr('data-score');
            if (score === undefined) {
 return;
}
            // Only add if not already present
            if ($cell.find('.rs-cell-score-badge').length) {
 return;
}
            var label = parseFloat(score) === 1 ? '1 mark' : score + ' marks';
            $cell.prepend('<strong class="rs-cell-score-badge">' + label + '</strong><br class="rs-badge-br">');
        });
        if ($table.hasClass('rs-marking-guide')) {
            self.log('Marking guide detected');
            self.setupMarkingGuide($table);
        }
        self.injectRescaleWidget($table);
    },

    injectSplitViewButton: function() {
        var self = this;
        if (document.getElementById('rs-split-btn')) {
 return;
}

        // Find a good anchor — the question formulation or main content area
        var $anchor = $('.que.essay, .que, #page-content, #region-main, .generalbox').first();
        if (!$anchor.length) {
 return;
}

        var $btn = $('<button type="button" id="rs-split-btn" ' +
            'class="rs-split-toggle">&#9707; Split View &mdash; ' +
            'student response on left, mark on right</button>');

        $btn.on('click', function() {
            self.toggleSplitView();
        });

        $anchor.before($btn);
        self.log('Split view button injected');
    },

    toggleSplitView: function() {
        var self = this;
        var $btn = $('#rs-split-btn');

        if ($('body').hasClass('rs-split-active')) {
            // --- EXIT SPLIT VIEW ---
            // Just remove the CSS class — the live page content is untouched
            $('body').removeClass('rs-split-active');
            $('#rs-split-left-panel').remove();
            $btn.html('&#9707; Split View');
            self.log('Split view off');
            return;
        }

        // --- ENTER SPLIT VIEW ---
        // Load only the student response in a left iframe.
        // The live page becomes the right panel — nothing gets wiped.
        var currentUrl = window.location.href;

        // Build left panel with iframe showing response only
        var $left = $('<div id="rs-split-left-panel"></div>');
        var $iframe = $('<iframe class="rs-split-left-frame" src="' + currentUrl + '" title="Student response"></iframe>');
        $left.append('<div class="rs-split-left-bar">&#128065; Student Response (read only)</div>');
        $left.append($iframe);
        $('body').prepend($left);
        $('body').addClass('rs-split-active');


        // Once iframe loads, inject CSS to show only the student response.
        // Use a delay + !important cascade to survive Moodle's own JS running after load.
        $iframe[0].addEventListener('load', function() {
            var iframeEl = this;
            /**
             *
             */
            function applyCSS() {
                try {
                    var iDoc = iframeEl.contentDocument || iframeEl.contentWindow.document;
                    // Remove any previous injection
                    var existing = iDoc.getElementById('rs-split-style');
                    if (existing) {
 existing.parentNode.removeChild(existing);
}

                    var style = iDoc.createElement('style');
                    style.id = 'rs-split-style';
                    // Target exactly what we saw: #page-wrapper > .que > .content
                    style.textContent = [
                        'body * { visibility:hidden !important; }',
                        '.que .content,',
                        '.que .content * { visibility:visible !important; }',
                        '.que .content .comment,',
                        '.que .content .gradingdetails,',
                        '.que .content .submitbtns,',
                        '.que .content .history,',
                        '.que .content .rs-table,',
                        '.que .content .rs-rescale-wrap,',
                        '.que .content .rs-split-toggle,',
                        '.que .content input[name*="mark"],',
                        '.que .content label[for*="mark"],',
                        '.que .content .fitem_id_mark,',
                        '.que .content .comment *,',
                        '.que .content .gradingdetails *,',
                        '.que .content .submitbtns *,',
                        '.que .content .history *,',
                        '.que .content .rs-table *,',
                        '.que .content .rs-rescale-wrap * { visibility:hidden !important; }',
                        'body { background:#fff !important; }',
                    'body, html { overflow-x:hidden !important; max-width:100% !important; }',
                    '* { max-width:100% !important; box-sizing:border-box !important; }',
                    'audio, video, img, iframe { max-width:100% !important; height:auto !important; }',
                    'pre, code { white-space:pre-wrap !important; word-break:break-word !important; }',
                    'table { table-layout:fixed !important; width:100% !important; }'
                    ].join('\n');

                    iDoc.head.appendChild(style);
                    self.log('iframe CSS applied');
                } catch (e) {
                    self.log('iframe CSS failed: ' + e.message);
                }
            }
            // Apply immediately and again after delays to beat Moodle's JS
            applyCSS();
            setTimeout(applyCSS, 300);
            setTimeout(applyCSS, 800);
            setTimeout(applyCSS, 1500);
        });

        $btn.html('&#10005; Exit Split View &mdash; save first!');
        self.log('Split view on');
    },

    injectRescaleWidget: function($table) {
        var self = this;
        // Don't add twice
        if ($table.next('.rs-rescale-wrap').length) {
 return;
}

        var $widget = $([
            '<div class="rs-rescale-wrap">',
            '  <div class="rs-rescale-inner">',
            '    <span class="rs-rescale-label">&#9881; Rescale mark</span>',
            '    <span class="rs-rescale-hint">Enter the question\'s max mark, ' +
            'then click Rescale to convert the rubric total.</span>',
            '    <div class="rs-rescale-controls">',
            '      <label class="rs-rescale-field-label">Max mark for this question</label>',
            '      <input class="rs-rescale-max" type="number" min="0" step="0.5" placeholder="e.g. 14">',
            '      <button type="button" class="rs-rescale-btn">Rescale</button>',
            '      <span class="rs-rescale-result" style="display:none;"></span>',

            '    </div>',
            '  </div>',
            '</div>'
        ].join(''));

        $table.after($widget);

        // Wire up the rescale button
        $widget.find('.rs-rescale-btn').on('click', function() {
            var maxMark = parseFloat($widget.find('.rs-rescale-max').val());
            if (isNaN(maxMark) || maxMark <= 0) {
                $widget.find('.rs-rescale-result')
                    .text('Please enter a valid max mark greater than 0.').show();
                return;
            }

            // Get current rubric total
            var total = 0;
            var maxPossible = 0;
            if ($table.hasClass('rs-marking-guide')) {
                $table.find('tr.rs-criterion-row').each(function() {
                    total += parseFloat($(this).find('.rs-score-input').val()) || 0;
                    maxPossible += parseFloat($(this).find('.rs-max-input').val()) || 0;
                });
            } else {
                // Standard, weighted, or legacy rubric
                var isWgt = $table.hasClass('rs-weighted');
                var rTotalCols = self.readClassNum($table, 'rs-cols-') ||
                                 Math.max(0, $table.find('thead tr th, tr:first-child th').length - 1);
                $table.find('tr').each(function() {
                    var $row = $(this);
                    var $sel = $row.find('.rs-cell.rs-selected');
                    if (!$sel.length) {
 return;
}
                    var $critCell = $row.find('td:first-child');
                    var score, rMax;
                    if (!isNaN(parseFloat($sel.attr('data-score')))) {
                        // Legacy: direct score value
                        score = parseFloat($sel.attr('data-score')) || 0;
                        rMax = self.getRowMax($row);
                        var mfn = self.extractMaxFromCriterionName($critCell.text().trim());
                        if (mfn !== null) {
 rMax = mfn;
}
                    } else {
                        // New format: position-based, read from classes
                        rMax = isWgt
                            ? (self.readClassNum($critCell, 'rs-w-') || parseFloat($critCell.attr('data-weight')) || 0)
                            : (self.readClassNum($critCell, 'rs-max-') ||
                               parseFloat($critCell.attr('data-max')) ||
                               self.getRowMaxScore($row));
                        var colIdx = self.readClassNum($sel, 'rs-col-');
                        if (colIdx === null) {
 colIdx = parseInt($sel.attr('data-col'));
}
                        var fraction = (!isNaN(colIdx) && rTotalCols > 1)
                            ? (1 - colIdx / (rTotalCols - 1)) : 0;
                        score = Math.round(fraction * rMax * 100) / 100;
                    }
                    total += score;
                    maxPossible += rMax;
                });
            }

            if (maxPossible <= 0) {
                $widget.find('.rs-rescale-result')
                    .text('No scores entered yet — please complete the rubric first.').show();
                return;
            }

            var scaled = Math.round((total / maxPossible) * maxMark * 100) / 100;

            $widget.find('.rs-rescale-result').html(
                '<strong>' + total + ' / ' + maxPossible + '</strong>' +
                ' &rarr; <span class="rs-rescale-value">' + scaled + '</span> / ' + maxMark +
                ' &nbsp;&mdash;&nbsp; <em>enter <strong>' + scaled + '</strong> in the Mark field below</em>'
            ).show();
        });
    },

    getRowMax: function($row) {
        // For rubric tables, find the highest data-score in the row
        var max = 0;
        $row.find('.rs-cell[data-score]').each(function() {
            var s = parseFloat($(this).attr('data-score')) || 0;
            if (s > max) {
 max = s;
}
        });
        return max;
    },

    setupMarkingGuide: function($table) {
        var self = this;
        self.log('=== SETUP MARKING GUIDE ===');
        $table.find('.rs-max-input').each(function() {
            $(this).prop('readonly', true).prop('disabled', false);
            self.log('  max locked: ' + $(this).val());
        });
        var $rows = $table.find('tr.rs-criterion-row');
        self.log('rows: ' + $rows.length);
        $rows.each(function(i) {
            var $row = $(this);
            var $si = $row.find('.rs-score-input');
            var lbl = $row.find('.rs-criterion-label').text().trim();
            self.log('  row ' + i + ': "' + lbl + '" input=' + ($si.length ? 'YES' : 'NO'));
            if (!$si.length) {
 return;
}
            $si.on('input keyup', function() {
                var mx = parseFloat($row.find('.rs-max-input').val()) || 0;
                var v = parseFloat($(this).val());
                if (!isNaN(v)) {
                    if (v > mx) {
 $(this).val(mx.toFixed(1));
}
                    if (v < 0) {
 $(this).val('0.0');
}
                }
                self.updateMarkOnlyForTable($table);
                $row.find('.rs-confirm-btn').addClass('rs-confirm-btn--dirty');
            });
            $si.on('keydown', function(e) {
                if (e.key === 'Enter' || e.keyCode === 13) {
                    e.preventDefault(); e.stopPropagation();
                    self.log('Enter on "' + lbl + '"');
                    self.confirmRow($row, $table);
                }
            });
            $si.on('blur', function() {
                self.log('blur on "' + lbl + '" val=' + $(this).val());
                self.confirmRow($row, $table);
            });
        });
    },

    confirmRow: function($row, $table) {
        var self = this;
        var lbl = $row.find('.rs-criterion-label').text().trim();
        self.log('confirmRow: "' + lbl + '"');
        var $si = $row.find('.rs-score-input');
        var $btn = $row.find('.rs-confirm-btn');
        var mx = parseFloat($row.find('.rs-max-input').val()) || 0;
        var v = parseFloat($si.val());
        self.log('  raw="' + $si.val() + '" parsed=' + v + ' max=' + mx);
        if (isNaN(v) || v < 0) {
 v = 0;
} else if (v > mx) {
 v = mx;
}
        $si.val(v.toFixed(1));
        $row.addClass('rs-row-confirmed');
        $btn.removeClass('rs-confirm-btn--dirty').addClass('rs-confirm-btn--done').text('checkmark');
        self.log('  confirmed=' + v.toFixed(1) + ', calling updateTotalForTable');
        self.updateTotalForTable($table);
    },

    updateMarkOnlyForTable: function($table) {
        var self = this;
        var t = 0;
        $table.find('tr.rs-criterion-row').each(function() {
            t += parseFloat($(this).find('.rs-score-input').val()) || 0;
        });
        self.log('updateMarkOnly: ' + t);
        self.updateMarkFieldForTable($table, t);
    },

    setupClickHandlers: function() {
        var self = this;
        self.log('Setting up click and hover handlers');

        // Clear any existing handlers
        $(document).off('click.rubricgrader mouseenter.rubricgrader mouseleave.rubricgrader');

        // MARKING GUIDE: confirm span (document-level, Moodle-safe span not button)
        $(document).on('click.rubricgrader', '.rs-confirm-btn', function(e) {
            e.preventDefault();
            e.stopPropagation();
            self.log('rs-confirm-btn clicked');
            var $row = $(this).closest('tr.rs-criterion-row');
            var $table = $(this).closest('.rs-marking-guide');
            self.log('  row found: ' + ($row.length ? 'YES' : 'NO') + ' table found: ' + ($table.length ? 'YES' : 'NO'));
            if ($row.length && $table.length) {
                self.confirmRow($row, $table);
            }
        });

        // HOVER EFFECTS
        $(document).on('mouseenter.rubricgrader', '.rs-cell', function() {
            $(this).addClass('rs-hover');
            self.log('Hover ON - Score: ' + $(this).attr('data-score'));
        });

        $(document).on('mouseleave.rubricgrader', '.rs-cell', function() {
            $(this).removeClass('rs-hover');
        });

        // CLICK HANDLER
        $(document).on('click.rubricgrader', '.rs-cell', function(e) {
            e.preventDefault();
            e.stopPropagation();

            var $cell = $(this);
            var score = $cell.attr('data-score');

            self.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            self.log('💥 CELL CLICKED!');
            self.log('Score: ' + score);
            self.log('Text preview: ' + $cell.text().substring(0, 50) + '...');

            // Get the row
            var $row = $cell.closest('tr');
            var rowCells = $row.find('.rs-cell');
            self.log('Row has ' + rowCells.length + ' cells');

            // DESELECT all cells in this row
            rowCells.removeClass('rs-selected');
            self.log('Deselected all cells in row');

            // SELECT this cell
            $cell.addClass('rs-selected');
            self.log('✓ Cell now selected');

            // Verify it worked
            if ($cell.hasClass('rs-selected')) {
                self.log('✅ Selection confirmed!');
            } else {
                self.log('❌ Selection FAILED!');
            }

            // Find which rubric table this belongs to (important for manual grading with multiple questions)
            var $table = $cell.closest('.rs-table');

            // Update total for THIS specific rubric
            self.updateTotalForTable($table);
            self.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        });

        self.log('✅ Handlers attached');
    },

    updateTotalForTable: function($table) {
        var self = this;
        self.log('');
        self.log('📊 CALCULATING TOTAL FOR THIS RUBRIC...');

        var total = 0;
        var maxPossible = 0;
        var breakdown = [];

        // ── MARKING GUIDE MODE ────────────────────────────────────────
        if ($table.hasClass('rs-marking-guide') || $table.hasClass('rs-wmg')) {
            var isWMG = $table.hasClass('rs-wmg');
            self.log('  → ' + (isWMG ? 'weighted marking guide' : 'marking guide') + ' mode');
            $table.find('tr.rs-criterion-row').each(function() {
                var $row = $(this);
                var criterion = $row.find('.rs-criterion-label').text().trim();
                var mx = parseFloat($row.find('.rs-max-input, .rs-wmg-weight-cell').first().text()) ||
                          parseFloat($row.find('.rs-max-input').val()) || 0;
                var sc = parseFloat($row.find('.rs-score-input').val()) || 0;
                // Multi-strategy description extraction with logging
                var $labelCell = $row.find('.rs-criterion-label-cell').length
                    ? $row.find('.rs-criterion-label-cell')
                    : $row.find('td').first();
                // Strategy 1: by class name — read innerHTML to preserve <br> tags
                var $descEl = $labelCell.find('.rs-criterion-desc');
                var desc = $descEl.length ? $descEl.html().trim() : '';
                self.log('  desc s1 (class): len=' + $descEl.length + ' val="' + desc.substring(0, 40) + '"');
                // Strategy 2: second span in label cell
                if (!desc) {
                    var $spans = $labelCell.find('span');
                    self.log('  spans in label cell: ' + $spans.length);
                    if ($spans.length >= 2) {
                        desc = $spans.eq(1).html().trim();
                        self.log('  desc s2 (2nd span): "' + desc.substring(0, 40) + '"');
                    }
                }
                // Strategy 3: all cell text minus the criterion label (plain text fallback)
                if (!desc) {
                    var cellText = $labelCell.text().trim();
                    desc = cellText.replace(criterion, '').trim();
                    self.log('  desc s3 (cell-label): "' + desc.substring(0, 40) + '"');
                }
                self.log('  criterion="' + criterion + '" FINAL desc="' +
                    desc.substring(0, 60) + '" score=' + sc + ' max=' + mx);
                maxPossible += mx;
                total += sc;
                breakdown.push({
                    criterion: criterion,
                    score: sc,
                    max: mx,
                    description: desc
                });
            });
            self.log('MARKING GUIDE TOTAL: ' + total + ' / ' + maxPossible);
            self.updateMarkFieldForTable($table, total, maxPossible);
            self.updateVisualFeedbackForTable($table, breakdown, total, maxPossible);
            return;
        }
        // ─────────────────────────────────────────────────────────────

        var isWeighted = $table.hasClass('rs-weighted');
        var isStandard = $table.hasClass('rs-standard');
        var isNewRubric = $table.hasClass('rs-rubric');
        var isLegacy = !isWeighted && !isStandard && !isNewRubric;
        self.log('  isWeighted=' + isWeighted + ' isStandard=' + isStandard +
            ' isNewRubric=' + isNewRubric + ' isLegacy=' + isLegacy);

        if (isWeighted) {
            // WEIGHTED RUBRIC: iterate all criterion rows, contribution = (score/colMax)*weight
            var $allRows = $table.find('tbody tr');
            var hasAnySelection = $table.find('.rs-cell.rs-selected').length > 0;
            if (!hasAnySelection) {
                self.log('⚠️ No cells selected yet');
                return;
            }
            // Total columns for position-based scoring
            // Get col count from class rs-cols-N or thead
            var wTotalCols = self.readClassNum($table, 'rs-cols-') || 0;
            if (!wTotalCols) {
 wTotalCols = Math.max(0, $table.find('thead tr th').length - 1);
}
            self.log('  wTotalCols=' + wTotalCols);

            $allRows.each(function(idx) {
                var $row = $(this);
                var $critCell = $row.find('td:first-child');
                if (!$critCell.length) {
 return;
}
                // Weight from class rs-w-30 or legacy data-weight
                var weight = self.readClassNum($critCell, 'rs-w-') ||
                             parseFloat($critCell.attr('data-weight')) || 0;
                if (!weight) {
 return;
}
                var criterionName = self.extractCriterionName($critCell.text().trim());
                var $sel = $row.find('.rs-cell.rs-selected');
                var fraction = 0;
                if ($sel.length) {
                    // Col index from class rs-col-N or legacy data-col
                    var colAttr = self.readClassNum($sel, 'rs-col-');
                    if (colAttr === null) {
 colAttr = parseInt($sel.attr('data-col'));
}
                    if (!isNaN(colAttr) && wTotalCols > 1) {
                        fraction = 1 - colAttr / (wTotalCols - 1);
                    } else if (!isNaN(parseFloat($sel.attr('data-score')))) {
                        var legacyMax = self.getRowMaxScore($row);
                        fraction = legacyMax > 0 ? parseFloat($sel.attr('data-score')) / legacyMax : 0;
                    }
                }
                var contribution = Math.round(fraction * weight * 100) / 100;
                var description = $sel.length ? $sel.text().trim() : '';
                self.log('  Row ' + (idx + 1) + ' "' + criterionName +
                    '": fraction=' + fraction.toFixed(2) + ' x ' + weight +
                    '% = ' + contribution);
                total += contribution;
                maxPossible += weight;
                breakdown.push({
                    criterion: criterionName, score: contribution, max: weight,
                    description: description, isWeighted: true
                });
            });
        } else {
            // STANDARD or LEGACY rubric
            var $selected = $table.find('.rs-cell.rs-selected');
            self.log('Selected cells: ' + $selected.length);
            if ($selected.length === 0) {
                self.log('⚠️ No cells selected yet');
                return;
            }
            var totalCols = self.readClassNum($table, 'rs-cols-') || 0;
            if (!totalCols) {
 totalCols = Math.max(0, $table.find('thead tr th, tr:first-child th').length - 1);
}
            self.log('  totalCols=' + totalCols);

            $selected.each(function(idx) {
                var $cell = $(this);
                var $row = $cell.closest('tr');
                var $critCell = $row.find('td:first-child');
                var criterionText = $critCell.text().trim();
                var criterionName = self.extractCriterionName(criterionText);
                var description = $cell.text().trim();
                var score, rowMax;

                if (isLegacy || isNewRubric || !isNaN(parseFloat($cell.attr('data-score')))) {
                    // New rubric or legacy: data-score holds the actual score value directly
                    score = parseFloat($cell.attr('data-score')) || 0;
                    rowMax = self.getRowMaxScore($row);
                    // For new rubric, rowMax IS the highest data-score in the row
                    if (!isNewRubric) {
                        var maxFromName = self.extractMaxFromCriterionName(criterionText);
                        if (maxFromName !== null) {
 rowMax = maxFromName;
}
                    }
                } else {
                    // New standard rubric: position-based, rowMax from class or name
                    rowMax = self.readClassNum($critCell, 'rs-max-') ||
                             parseFloat($critCell.attr('data-max')) ||
                             self.getRowMaxScore($row);
                    var colIdx = self.readClassNum($cell, 'rs-col-');
                    if (colIdx === null) {
 colIdx = parseInt($cell.attr('data-col'));
}
                    if (!isNaN(colIdx) && totalCols > 1) {
                        score = Math.round(rowMax * (1 - colIdx / (totalCols - 1)) * 100) / 100;
                    } else {
                        score = 0;
                    }
                }

                self.log('  Row ' + (idx + 1) + ': score=' + score + ' max=' + rowMax);
                total += score;
                maxPossible += rowMax;
                breakdown.push({criterion: criterionName, score: score, max: rowMax, description: description});
            });
        }

        self.log('');
        self.log('🎯 TOTAL SCORE: ' + total + ' / ' + maxPossible + ' marks');
        self.log('');

        // Find mark input and comment area near THIS rubric table
        self.updateMarkFieldForTable($table, total, maxPossible);

        // Update visual feedback for THIS rubric
        self.updateVisualFeedbackForTable($table, breakdown, total, maxPossible);
    },

    updateMarkFieldForTable: function($table, total, maxPossible) {
        var self = this;
        self.log('');
        self.log('📝 updateMarkFieldForTable total=' + total + ' maxPossible=' + maxPossible);

        var $markInput = null;

        // Dump all visible inputs for diagnosis
        self.log('  Visible inputs:');
        $('input:visible').each(function(idx) {
            if (idx < 25) {
                self.log('    [' + idx + '] type=' + ($(this).attr('type') || '?') +
                    ' name="' + ($(this).attr('name') || '') +
                    '" id="' + ($(this).attr('id') || '') + '"');
            }
        });

        // 1. Container search
        var $container = $table.closest('.que, .question, form, div[class*="question"]');
        self.log('  Container: ' + ($container.length ? $container[0].className : 'NONE'));
        if ($container.length) {
            $markInput = $container.find('input[name*="mark"], input[name*="grade"]').filter(function() {
                return ($(this).attr('name') || '').indexOf('maxmark') === -1;
            }).filter(':visible').first();
            self.log('  Container result: ' + ($markInput.length ? $markInput.attr('name') : 'not found'));
        }

        // 2. Wide proximity search (1000px, no name filter — log everything)
        if (!$markInput || !$markInput.length) {
            var tOff = $table.offset();
            self.log('  Proximity from y=' + tOff.top);
            $('input[type="text"], input[type="number"]').each(function() {
                var n = $(this).attr('name') || '';
                var d = Math.abs(tOff.top - $(this).offset().top);
                self.log('    name="' + n + '" dist=' + Math.round(d));
                if ((n.indexOf('mark') !== -1 || n.indexOf('grade') !== -1) &&
                    n.indexOf('maxmark') === -1 && d < 1000) {
                    self.log('    ✅ Matched!');
                    $markInput = $(this);
                    return false;
                }
                return true;
            });
        }

        // 3. findMarkInput fallback
        if (!$markInput || !$markInput.length) {
            $markInput = self.findMarkInput();
            self.log('  findMarkInput: ' + ($markInput && $markInput.length ? $markInput.attr('name') : 'FAILED'));
        }

        if (!$markInput || !$markInput.length) {
            self.log('❌ Mark field NOT FOUND');
            return;
        }

        // --- Percentage-to-marks conversion ---
        // If the rubric criteria add up to 100 (i.e. percentage-based),
        // scale the total to the question's actual max mark from the DOM.
        var scaledTotal = total;
        if (Math.abs(maxPossible - 100) < 0.01 && maxPossible > 0) {
            // Try to read the question max mark from the Moodle grading page DOM
            var questionMax = self.readQuestionMaxMark();
            if (questionMax && questionMax > 0) {
                scaledTotal = Math.round((total / 100) * questionMax * 100) / 100;
                self.log('⚖️ Scaling ' + total + '/100 → ' + scaledTotal + '/' + questionMax);
            }
        }
        var old = $markInput.val();
        $markInput.val(scaledTotal);
        self.log('💾 ' + $markInput.attr('name') + ' "' + old + '" → "' + scaledTotal + '"');

        $markInput.trigger('change').trigger('input').trigger('blur').trigger('keyup');
        if ($markInput[0]) {
            $markInput[0].dispatchEvent(new Event('change', {bubbles: true}));
            $markInput[0].dispatchEvent(new Event('input', {bubbles: true}));
        }
        self.log('✅ Mark field done');
    },

    updateVisualFeedbackForTable: function($table, breakdown, total, maxPossible) {
        var self = this;
        self.log('📄 updateVisualFeedbackForTable called');

        // ── WEIGHTED MARKING GUIDE: must be checked before the generic
        //    marking-guide branch, because a weighted marking guide also
        //    carries the rs-marking-guide class (needed for guide setup).
        if ($table.hasClass('rs-wmg')) {
            self.log('  → weighted marking guide feedback path');
            var wmgHTML = self.buildMarkingGuideSummaryHTML(breakdown, total, maxPossible, true);
            self.writeToCommentArea($table, wmgHTML);
            return;
        }
        // ── MARKING GUIDE: dedicated output ──────────────────────────
        if ($table.hasClass('rs-marking-guide')) {
            self.log('  → marking guide feedback path');
            var mgHTML = self.buildMarkingGuideSummaryHTML(breakdown, total, maxPossible);
            self.writeToCommentArea($table, mgHTML);
            return;
        }
        // ─────────────────────────────────────────────────────────────

        // Build the summary HTML and route to comment area
        var summary = self.buildSummaryHTML(breakdown, total, maxPossible, $table);
        self.log('Built rubric summary HTML, length=' + (summary ? summary.length : 'NULL'));
        if (summary) {
 self.writeToCommentArea($table, summary);
}
    },

    writeToCommentArea: function($table, html) {
        var self = this;
        self.log('writeToCommentArea called, html length=' + html.length);

        // 1. Container TinyMCE
        var $container = $table.closest('.que, .question, form, div[class*="question"]');
        self.log('  container: ' + ($container.length ? $container[0].className : 'NONE'));
        if ($container.length) {
            var taId = $container.find('textarea[name*="comment"]').attr('id');
            self.log('  textarea id: ' + taId);
            if (taId && typeof tinyMCE !== 'undefined') {
                var ed = tinyMCE.get(taId);
                if (ed) {
                    self.log('  → TinyMCE (container)');
                    ed.setContent(html);
                    self.expandSpecificEditor(ed);
                    return;
                }
            }
            var $ta = $container.find('textarea[name*="comment"]').first();
            if ($ta.length) {
                self.log('  → textarea (container)');
                $ta.val(html);
                return;
            }
        }

        // 2. Proximity
        var tOff = $table.offset();
        var $near = null;
        $('textarea').each(function() {
            var n = $(this).attr('name') || '';
            var d = Math.abs(tOff.top - $(this).offset().top);
            self.log('  textarea name="' + n + '" dist=' + Math.round(d));
            if (d < 1000) {
                $near = $(this);
                return false;
            }
            return true;
        });
        if ($near && $near.length) {
            var nId = $near.attr('id');
            if (nId && typeof tinyMCE !== 'undefined') {
                var ned = tinyMCE.get(nId);
                if (ned) {
                    self.log('  → TinyMCE (proximity)');
                    ned.setContent(html);
                    self.expandSpecificEditor(ned);
                    return;
                }
            }
            self.log('  → textarea (proximity)');
            $near.val(html);
            return;
        }

        // 3. activeEditor fallback
        if (typeof tinyMCE !== 'undefined' && tinyMCE.activeEditor) {
            self.log('  → TinyMCE activeEditor fallback');
            tinyMCE.activeEditor.setContent(html);
            self.expandTinyMCE();
            return;
        }

        self.log('❌ writeToCommentArea: no target found');
    },

    /* eslint-disable max-len, complexity, max-depth, no-loop-func, no-nested-ternary, consistent-return --
     * Legacy HTML-string summary builders: long template literals and
     * intricate per-cell branching are inherent here. Refactor tracked in
     * README "Development roadmap" (Stage 3). */
    buildMarkingGuideSummaryHTML: function(breakdown, total, maxPossible, isWMG) {
        var s = '<div class="rs-summary rs-mg-feedback-wrap">';
        s += '<p><strong>Marking Guide Summary</strong></p>';
        s += '<table class="rs-mg-feedback-table" border="1" cellpadding="8" style="width:100%;border-collapse:collapse;font-size:0.92em;">';
        s += '<tr style="background-color:#1565C0;color:white;">';
        s += '<th style="text-align:left;padding:10px 14px;">Criterion</th>';
        s += '<th style="text-align:center;padding:10px 14px;">Score</th>';
        s += '<th style="text-align:left;padding:10px 14px;">Criterion-specific comments</th>';
        s += '</tr>';
        breakdown.forEach(function(item, idx) {
            var bg = (idx % 2 === 0) ? '#ffffff' : '#f5f8ff';
            s += '<tr style="background-color:' + bg + ';">';
            s += '<td style="padding:12px 14px;vertical-align:top;width:22%;border:1px solid #dde3f0;">';
            s += '<p style="margin:0 0 4px 0;font-weight:700;color:#1a237e;">' + item.criterion + '</p>';
            if (item.description) {
                s += '<p style="margin:0;font-weight:normal;font-size:0.88em;color:#555;line-height:1.45;">' + item.description + '</p>';
            }
            s += '</td>';
            s += '<td style="padding:12px 14px;text-align:center;vertical-align:top;width:120px;border:1px solid #dde3f0;">';
            s += '<span style="display:inline-block;background:#1565C0;color:white;font-weight:700;font-size:1.05em;border-radius:5px;padding:3px 14px;min-width:50px;text-align:center;">' + parseFloat(item.score).toFixed(1) + '</span>';
            s += '<span style="display:block;font-size:0.78em;color:#888;margin-top:3px;">' + (isWMG ? 'weight: ' + parseFloat(item.max).toFixed(0) + '%' : 'out of ' + parseFloat(item.max).toFixed(1)) + '</span>';
            s += '</td>';
            s += '<td style="padding:12px 14px;background-color:#fffde7;vertical-align:top;border:1px solid #dde3f0;min-width:200px;">&nbsp;</td>';
            s += '</tr>';
        });
        s += '<tr style="background-color:#1565C0;color:white;">';
        s += '<td style="padding:10px 14px;text-align:right;font-weight:700;border:none;">Total</td>';
        s += '<td style="padding:10px 14px;text-align:center;font-weight:700;font-size:1.1em;border:none;">' + parseFloat(total).toFixed(1) + ' / ' + parseFloat(maxPossible).toFixed(1) + '</td>';
        s += '<td style="border:none;"></td></tr>';
        s += '</table><br><p><strong>Overall comments:</strong></p></div>';
        return s;
    },

    buildSummaryHTML: function(breakdown, total, maxPossible, $table) {
        var self = this;
        self.log('🔷 buildSummaryHTML called: breakdown.length=' + breakdown.length + ' total=' + total + ' $table=' + ($table && $table.length ? $table[0].className : 'NULL'));
        if (!breakdown.length) {
 self.log('⚠️ Empty breakdown — returning null'); return null;
}
        if (!$table || !$table.length) {
 self.log('⚠️ No $table — returning null'); return null;
}

        var summary = '<div class="rs-summary">';
        summary += '<p><strong>Rubric Grading Summary</strong></p>';

        // Build column headers from the table's thead
        var colHeaders = [];
        var $headerRow = $table.find('thead tr').first();
        if (!$headerRow.length) {
 $headerRow = $table.find('tr').first();
}
        $headerRow.find('th').each(function(i) {
            if (i === 0) {
 return;
} // Skip Criteria column
            colHeaders.push($(this).text().trim());
        });
        var numCols = colHeaders.length;
        self.log('Summary: ' + numCols + ' columns: ' + colHeaders.join(', '));

        // Detect format
        var useDataScore = $table.find('.rs-cell[data-score]').length > 0;

        summary += '<table class="rs-feedback-table" border="1" cellpadding="8" style="width:100%;border-collapse:collapse;">';

        // Header row
        summary += '<tr style="background-color:#e3f2fd;">';
        summary += '<th>Criterion</th>';
        colHeaders.forEach(function(h) {
            summary += '<th style="text-align:center;">' + h + '</th>';
        });
        summary += '<th>Criterion-specific comments</th>';
        summary += '</tr>';

        // One row per breakdown item
        breakdown.forEach(function(item) {
            summary += '<tr>';
            var criterionLabel = item.criterion;
            if (item.isWeighted) {
                criterionLabel += ' (' + item.max + '%)';
            } else {
                criterionLabel += ' (' + item.max + ' mark' + (item.max === 1 ? '' : 's') + ')';
            }
            summary += '<td><strong>' + criterionLabel + '</strong></td>';

            // Find this criterion's row in the table
            var $criterionRow = null;
            $table.find('tbody tr, tr').each(function() {
                var $row = $(this);
                if (!$row.find('.rs-cell').length) {
 return;
}
                var rowCriterion = self.extractCriterionName($row.find('td:first-child').text().trim());
                if (rowCriterion === item.criterion) {
 $criterionRow = $row; return false;
}
            });

            if ($criterionRow) {
                if (useDataScore) {
                    // Legacy: match cells by data-score value
                    // Build score→header map from header row
                    var scoreMap = {};
                    $headerRow.find('th').each(function(i) {
                        if (i === 0) {
 return;
}
                        var $firstDataRow = $table.find('tbody tr, tr').filter(function() {
                            return $(this).find('.rs-cell').length > 0;
                        }).first();
                        var $c = $firstDataRow.find('td').eq(i);
                        var sc = parseFloat($c.attr('data-score'));
                        if (!isNaN(sc)) {
 scoreMap[sc] = i - 1;
}
                    });
                    for (var ci = 0; ci < numCols; ci++) {
                        // Find cell in this row whose data-score maps to column ci
                        var $found = null;
                        $criterionRow.find('.rs-cell').each(function() {
                            var sc = parseFloat($(this).attr('data-score'));
                            if (!isNaN(sc) && scoreMap[sc] === ci) {
 $found = $(this); return false;
}
                        });
                        if (!$found) {
                            // Try positional fallback
                            $found = $criterionRow.find('td').eq(ci + 1);
                            if (!$found.hasClass('rs-cell')) {
 $found = null;
}
                        }
                        if ($found && $found.length) {
                            var html2 = $found.html().trim();
                            var isSel = $found.hasClass('rs-selected');
                            if (html2 && html2 !== ' ' && html2 !== '&nbsp;') {
                                var scoreVal2 = $found.attr('data-score');
                                var scoreVal2Num = parseFloat(scoreVal2);
                                var scoreLabel2 = scoreVal2 !== undefined ? (scoreVal2Num === 1 ? '1 mark' : scoreVal2 + ' marks') : '';
                                if (isSel) {
                                    var badge2 = scoreLabel2 ? '<strong style="display:block;font-size:0.8em;margin-bottom:4px;color:#fff;opacity:1;">' + scoreLabel2 + '</strong>' : '';
                                    summary += '<td style="background:#1565C0;color:white;font-weight:bold;padding:8px;">&#10003;<br>' + badge2 + html2.replace(/<strong[^>]*class="rs-cell-score-badge"[^>]*>[\s\S]*?<\/strong><br[^>]*>/i, '') + '</td>';
                                } else {
                                    var badge2u = scoreLabel2 ? '<strong style="display:block;font-size:0.8em;margin-bottom:4px;color:#1a237e;">' + scoreLabel2 + '</strong>' : '';
                                    summary += '<td style="background:#f5f5f5;padding:8px;">' + badge2u + html2.replace(/<strong[^>]*class="rs-cell-score-badge"[^>]*>[\s\S]*?<\/strong><br[^>]*>/i, '') + '</td>';
                                }
                            } else {
                                summary += '<td></td>';
                            }
                        } else {
                            summary += '<td></td>';
                        }
                    }
                } else {
                    // New format: class rs-col-N or data-col
                    for (var ci2 = 0; ci2 < numCols; ci2++) {
                        var $cell = $criterionRow.find('.rs-cell.rs-col-' + ci2 + ', .rs-cell[data-col="' + ci2 + '"]');
                        if ($cell.length) {
                            var cHtml = $cell.html().trim();
                            var cSel = $cell.hasClass('rs-selected');
                            if (cHtml && cHtml !== ' ' && cHtml !== '&nbsp;') {
                                var scoreValC = $cell.attr('data-score');
                                var scoreValCNum = parseFloat(scoreValC);
                                var scoreLabelC = scoreValC !== undefined ? (scoreValCNum === 1 ? '1 mark' : scoreValC + ' marks') : '';
                                var cleanHtml = cHtml.replace(/<strong[^>]*class="rs-cell-score-badge"[^>]*>[\s\S]*?<\/strong><br[^>]*>/i, '');
                                if (cSel) {
                                    var badgeC = scoreLabelC ? '<strong style="display:block;font-size:0.8em;margin-bottom:4px;color:#fff;opacity:1;">' + scoreLabelC + '</strong>' : '';
                                    summary += '<td style="background:#1565C0;color:white;font-weight:bold;padding:8px;">&#10003;<br>' + badgeC + cleanHtml + '</td>';
                                } else {
                                    var badgeCu = scoreLabelC ? '<strong style="display:block;font-size:0.8em;margin-bottom:4px;color:#1a237e;">' + scoreLabelC + '</strong>' : '';
                                    summary += '<td style="background:#f5f5f5;padding:8px;">' + badgeCu + cleanHtml + '</td>';
                                }
                            } else {
                                summary += '<td></td>';
                            }
                        } else {
                            summary += '<td></td>';
                        }
                    }
                }
            } else {
                // Can't find row — just show selected description in correct col
                for (var ci3 = 0; ci3 < numCols; ci3++) {
 summary += '<td></td>';
}
            }

            summary += '<td style="background:#fffde7;padding:8px;min-width:200px;">&nbsp;</td>';
            summary += '</tr>';
        });

        summary += '</table>';
        summary += '<br>';
        var isWgtSummary = breakdown.length > 0 && breakdown[0].isWeighted;
        var maxPossibleSummary = breakdown.reduce(function(s, item) {
 return s + (parseFloat(item.max) || 0);
}, 0);
        maxPossibleSummary = Math.round(maxPossibleSummary * 100) / 100;
        if (isWgtSummary) {
            summary += '<p><strong>Total ' + total + ' / ' + maxPossibleSummary + '%</strong></p>';
        } else {
            summary += '<p><strong>Total ' + total + ' / ' + maxPossibleSummary + '</strong></p>';
        }
        summary += '<br>';
        summary += '<p><strong>Overall comments:</strong></p>';
        summary += '</div>';

        return summary;
    },
    /* eslint-enable max-len, complexity, max-depth, no-loop-func, no-nested-ternary, consistent-return */

    // Read a numeric value encoded in a CSS class (e.g. rs-cols-7 → 7, rs-w-30 → 30).
    readClassNum: function(el, prefix) {
        var classes = ($(el).attr('class') || '').split(' ');
        for (var i = 0; i < classes.length; i++) {
            if (classes[i].indexOf(prefix) === 0) {
                var val = parseFloat(classes[i].substring(prefix.length).replace('_', '.'));
                if (!isNaN(val)) {
 return val;
}
            }
        }
        return null;
    },

    // Find the visible grade/mark input for the current question. Never the
    // hidden *-maxmark metadata field, and never a hidden input.
    findMarkInput: function() {
        return $('input[name*="mark"], input[name*="grade"]').filter(function() {
            return ($(this).attr('name') || '').indexOf('maxmark') === -1;
        }).filter(':visible').first();
    },

    // Read the question's actual max mark from the Moodle grading page DOM.
    // Used to scale a /100 rubric to the question's real mark value.
    // eslint-disable-next-line complexity -- Sequential DOM fallbacks; refactor in README Stage 3.
    readQuestionMaxMark: function() {
        var self = this;
        var maxMark = null;

        var $markInput = self.findMarkInput();

        // Strategy 1: Read sibling text nodes directly after the mark input.
        // Moodle renders: <input name="mark"> out of 16.00
        // The "out of X" is a raw text node sibling of the input.
        if ($markInput && $markInput.length) {
            var inputNode = $markInput[0];
            var sibling = inputNode.nextSibling;
            while (sibling) {
                var txt = sibling.nodeType === 3 ? sibling.nodeValue : (sibling.textContent || sibling.innerText || '');
                var m = txt.match(/out\s+of\s*([\d.]+)/i);
                if (m) {
                    maxMark = parseFloat(m[1]);
                    self.log('📏 Question max from sibling text node: ' + maxMark);
                    return maxMark;
                }
                sibling = sibling.nextSibling;
            }
        }

        // Strategy 2: Walk up DOM tree checking each ancestor's full text,
        // but extract only the "out of X" portion to avoid matching the score itself.
        if ($markInput && $markInput.length) {
            var $el = $markInput.parent();
            for (var i = 0; i < 6; i++) {
                var fullText = $el.text();
                // Look specifically for "out of X" — not just any number
                var m2 = fullText.match(/out\s+of\s*([\d.]+)/i);
                if (m2) {
                    maxMark = parseFloat(m2[1]);
                    self.log('📏 Question max from ancestor (level ' + i + '): ' + maxMark);
                    return maxMark;
                }
                $el = $el.parent();
                if (!$el.length) {
 break;
}
            }
        }

        // Strategy 3: Scan the whole page for "out of X.XX" near a mark label
        $('label, .fitemtitle, td, div').each(function() {
            var t = $(this).text();
            if (/\bmark\b/i.test(t)) {
                var m3 = t.match(/out\s+of\s*([\d.]+)/i);
                if (m3) {
                    maxMark = parseFloat(m3[1]);
                    self.log('📏 Question max from page scan: ' + maxMark);
                    return false; // Break
                }
            }
            return true;
        });
        if (maxMark) {
 return maxMark;
}

        // Strategy 4: hidden maxmark input — Moodle uses name="qX:Y_-maxmark"
        // Find it in the same container as the mark input for accuracy
        var $hidden = null;
        if ($markInput && $markInput.length) {
            $hidden = $markInput.closest('div, fieldset, form')
                .find('input[name*="maxmark"], input[name*="-maxmark"]').first();
        }
        if (!$hidden || !$hidden.length) {
            $hidden = $('input[name*="maxmark"], input[name*="-maxmark"]').first();
        }
        if ($hidden && $hidden.length) {
            maxMark = parseFloat($hidden.val());
            self.log('📏 Question max from hidden maxmark input: ' + maxMark);
            return maxMark;
        }

        // Strategy 5: input[max] attribute on the mark field
        if ($markInput && $markInput.length) {
            var inputMax = parseFloat($markInput.attr('max'));
            if (!isNaN(inputMax) && inputMax > 0) {
                self.log('📏 Question max from input[max]: ' + inputMax);
                return inputMax;
            }
        }

        self.log('📏 Question max mark NOT found — no scaling applied');
        return null;
    },

    extractCriterionName: function(text) {
        // Remove patterns like "(3)", "(3 marks)", ": 3 marks", "[weight: 20]" etc.
        var cleaned = text
            .replace(/\[weight:\s*[^\]]*\]/gi, '') // Remove [weight: X]
            .replace(/\([^)]*marks?\)/gi, '') // Remove (3 marks)
            .replace(/\([^)]*points?\)/gi, '') // Remove (3 points)
            .replace(/\(\d+\)/g, '') // Remove (3)
            .replace(/:\s*\d+\s*marks?/gi, '') // Remove : 3 marks
            .replace(/:\s*\d+\s*points?/gi, '') // Remove : 3 points
            .replace(/:/g, '') // Remove remaining colons
            .trim();

        return cleaned;
    },

    // Extract max marks from criterion name if present
    extractMaxFromCriterionName: function(text) {
        // Look for patterns like "(3)", "(3 marks)", ": 3 marks"
        var patterns = [
            /\((\d+)\s*marks?\)/i, // (3 marks) or (3 mark)
            /\((\d+)\s*points?\)/i, // (3 points) or (3 point)
            /\((\d+)\)/, // (3)
            /:\s*(\d+)\s*marks?/i, // : 3 marks
            /:\s*(\d+)\s*points?/i // : 3 points
        ];

        for (var i = 0; i < patterns.length; i++) {
            var match = text.match(patterns[i]);
            if (match) {
                return parseFloat(match[1]);
            }
        }

        return null;
    },

    getRowMaxScore: function($row) {
        var maxScore = 0;

        // Find all cells with data-score in this row
        $row.find('.rs-cell[data-score]').each(function() {
            var cellText = $(this).text().trim();

            // Skip empty cells
            if (cellText.length === 0 || cellText === ' ') {
                return; // Continue
            }

            var score = parseFloat($(this).attr('data-score'));
            if (!isNaN(score) && score > maxScore) {
                maxScore = score;
            }
        });

        return maxScore;
    },

    expandTinyMCE: function() {
        var self = this;

        try {
            if (typeof tinyMCE !== "undefined" && tinyMCE.activeEditor) {
                self.expandSpecificEditor(tinyMCE.activeEditor);
            } else if (typeof tinyMCE !== "undefined" && tinyMCE.editors && tinyMCE.editors.length > 0) {
                tinyMCE.editors.forEach(function(editor) {
                    self.expandSpecificEditor(editor);
                });
            }
        } catch (e) {
            self.log('Could not expand TinyMCE: ' + e.message);
        }
    }
};

/**
 * Entry point. Invoked from PHP via $PAGE->requires->js_call_amd().
 */
export const init = () => {
    RubricGrader.init();
};
