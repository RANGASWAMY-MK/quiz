function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}

function formatDuration(totalSeconds) {
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    if (hours > 0) return hours + 'h ' + minutes + 'm ' + seconds + 's';
    if (minutes > 0) return minutes + 'm ' + seconds + 's';
    return seconds + 's';
}

function gradeClass(percent) {
    if (percent >= 80) return 'excellent';
    if (percent >= 60) return 'good';
    if (percent >= 40) return 'average';
    return 'poor';
}

function QuestionState() {
    this.answer = null;
    this.review = false;
}
QuestionState.prototype.selectAnswer = function(value) {
    this.answer = value;
    this.review = false;
};
QuestionState.prototype.toggleReview = function() {
    this.review = !this.review;
};
QuestionState.prototype.clearAnswer = function() {
    this.answer = null;
};
QuestionState.prototype.hasAnswer = function() {
    return this.answer !== null;
};
QuestionState.prototype.evaluateStatus = function(correctValue) {
    if (correctValue === null || correctValue === undefined) return 'ungraded';
    if (this.answer === null) return 'skipped';
    return this.answer === correctValue ? 'correct' : 'incorrect';
};

function SubjectStats(name) {
    this.name = name;
    this.total = 0;
    this.correct = 0;
    this.incorrect = 0;
    this.skipped = 0;
    this.ungraded = 0;
}
SubjectStats.prototype.recordResult = function(status) {
    this.total++;
    if (status === 'correct') this.correct++;
    else if (status === 'incorrect') this.incorrect++;
    else if (status === 'skipped') this.skipped++;
    else this.ungraded++;
};
SubjectStats.prototype.gradableCount = function() {
    return this.total - this.ungraded;
};
SubjectStats.prototype.scorePercent = function() {
    var gradable = this.gradableCount();
    return gradable > 0 ? (this.correct / gradable) * 100 : 0;
};
SubjectStats.prototype.accuracyPercent = function() {
    var attempted = this.gradableCount() - this.skipped;
    return attempted > 0 ? (this.correct / attempted) * 100 : 0;
};

function AnalysisEngine(questions, states) {
    this.questions = questions;
    this.states = states;
    this.subjectNames = [];
    this.subjectMap = new Map();
    this.correctCount = 0;
    this.incorrectCount = 0;
    this.skippedCount = 0;
    this.ungradedCount = 0;
    this.reviewedCount = 0;
    this._analyze();
}
AnalysisEngine.prototype._analyze = function() {
    var seen = new Set();
    for (var i = 0; i < this.questions.length; i++) {
        var question = this.questions[i];
        var state = this.states[i];
        var status = state.evaluateStatus(question.CorrectOptionValue);
        if (status === 'correct') this.correctCount++;
        else if (status === 'incorrect') this.incorrectCount++;
        else if (status === 'skipped') this.skippedCount++;
        else this.ungradedCount++;
        if (state.review) this.reviewedCount++;
        if (!seen.has(question.SubjectName)) {
            seen.add(question.SubjectName);
            this.subjectNames.push(question.SubjectName);
            this.subjectMap.set(question.SubjectName, new SubjectStats(question.SubjectName));
        }
        this.subjectMap.get(question.SubjectName).recordResult(status);
    }
};
AnalysisEngine.prototype.totalQuestions = function() { return this.questions.length; };
AnalysisEngine.prototype.gradableTotal = function() { return this.totalQuestions() - this.ungradedCount; };
AnalysisEngine.prototype.attemptedCount = function() { return this.correctCount + this.incorrectCount; };
AnalysisEngine.prototype.scorePercent = function() {
    var gradable = this.gradableTotal();
    return gradable > 0 ? ((this.correctCount / gradable) * 100).toFixed(1) : '-';
};
AnalysisEngine.prototype.accuracyPercent = function() {
    var attempted = this.attemptedCount();
    return attempted > 0 ? ((this.correctCount / attempted) * 100).toFixed(1) : '-';
};
AnalysisEngine.prototype.getGrade = function() {
    if (this.gradableTotal() === 0) return { label: 'Ungraded', cssClass: 'ungraded', icon: '\u2753', message: 'Answer keys are not available for this paper. Your responses have been recorded but cannot be scored.' };
    var percent = parseFloat(this.scorePercent());
    if (percent >= 80) return { label: 'Excellent', cssClass: 'excellent', icon: '\u{1F3C6}', message: 'Outstanding! Exceptional understanding across all subjects.' };
    if (percent >= 60) return { label: 'Good', cssClass: 'good', icon: '\u2B50', message: 'Good work! Solid understanding. Review areas where you lost marks.' };
    if (percent >= 40) return { label: 'Average', cssClass: 'average', icon: '\u{1F4CA}', message: 'Fair performance. Focus on weak areas with more practice.' };
    return { label: 'Needs Improvement', cssClass: 'poor', icon: '\u{1F4DA}', message: 'Review all subjects thoroughly and practice more questions.' };
};
AnalysisEngine.prototype.getSubjectStats = function(name) { return this.subjectMap.get(name); };

function ExamRegistry() {
    this._exams = new Map();
    this._departments = new Map();
    this._years = new Map();
    this._questions = new Map();
    this._configs = new Map();
}
ExamRegistry.prototype._deptKey = function(examKey, deptId) { return examKey + '\x01' + deptId; };
ExamRegistry.prototype._fullKey = function(examKey, deptId, year) { return examKey + '\x01' + deptId + '\x01' + year; };
ExamRegistry.prototype.registerExam = function(key, name, icon) {
    if (!this._exams.has(key)) this._exams.set(key, { name: name, icon: icon, departmentIds: new Set() });
};
ExamRegistry.prototype.registerDepartment = function(examKey, deptId, name, icon, description) {
    if (!this._exams.has(examKey)) return;
    this._exams.get(examKey).departmentIds.add(deptId);
    var key = this._deptKey(examKey, deptId);
    if (!this._departments.has(key)) this._departments.set(key, { id: deptId, name: name, icon: icon, description: description });
    if (!this._years.has(key)) this._years.set(key, []);
};
ExamRegistry.prototype.registerYear = function(examKey, deptId, year, label, icon, badge) {
    var key = this._deptKey(examKey, deptId);
    var yearList = this._years.get(key);
    if (!yearList) return;
    for (var i = 0; i < yearList.length; i++) if (yearList[i].year === year) return;
    yearList.push({ year: year, label: label, icon: icon, badge: badge });
    yearList.sort(function(a, b) { return b.year - a.year; });
};
ExamRegistry.prototype.registerQuestions = function(examKey, deptId, year, config, questions) {
    var key = this._fullKey(examKey, deptId, year);
    this._questions.set(key, questions);
    this._configs.set(key, config);
};
ExamRegistry.prototype.getExams = function() {
    var result = [];
    this._exams.forEach(function(data, key) { result.push({ key: key, name: data.name, icon: data.icon, count: data.departmentIds.size }); });
    return result;
};
ExamRegistry.prototype.getDepartments = function(examKey) {
    var result = [];
    var examData = this._exams.get(examKey);
    if (!examData) return result;
    var self = this;
    examData.departmentIds.forEach(function(deptId) {
        var dept = self._departments.get(self._deptKey(examKey, deptId));
        if (dept) result.push(dept);
    });
    return result;
};
ExamRegistry.prototype.getYears = function(examKey, deptId) { return this._years.get(this._deptKey(examKey, deptId)) || []; };
ExamRegistry.prototype.getQuestions = function(examKey, deptId, year) { return this._questions.get(this._fullKey(examKey, deptId, year)) || []; };
ExamRegistry.prototype.getConfig = function(examKey, deptId, year) { return this._configs.get(this._fullKey(examKey, deptId, year)) || { examTitle: 'Mock Test', durationInMinutes: 180 }; };
ExamRegistry.prototype.getExamName = function(key) { var e = this._exams.get(key); return e ? e.name : ''; };
ExamRegistry.prototype.getDeptName = function(examKey, deptId) { var d = this._departments.get(this._deptKey(examKey, deptId)); return d ? d.name : ''; };

function TimerController(totalSeconds, displayElement, onExpire) {
    this.remaining = totalSeconds;
    this.totalTime = totalSeconds;
    this.elapsed = 0;
    this.displayElement = displayElement;
    this.onExpire = onExpire;
    this._intervalId = null;
}
TimerController.prototype.start = function() {
    this._render();
    var self = this;
    this._intervalId = setInterval(function() {
        self.remaining--;
        self.elapsed++;
        self._render();
        if (self.remaining <= 0) { self.stop(); if (self.onExpire) self.onExpire(); }
    }, 1000);
};
TimerController.prototype.stop = function() {
    if (this._intervalId) { clearInterval(this._intervalId); this._intervalId = null; }
};
TimerController.prototype._render = function() {
    var h = Math.floor(this.remaining / 3600);
    var m = String(Math.floor((this.remaining % 3600) / 60)).padStart(2, '0');
    var s = String(this.remaining % 60).padStart(2, '0');
    this.displayElement.textContent = h > 0 ? h + ':' + m + ':' + s : m + ':' + s;
    this.displayElement.classList.toggle('danger', this.remaining <= 300);
};

function ResultsView(analysis, config, studentName, elapsedSeconds) {
    this.analysis = analysis;
    this.config = config;
    this.studentName = studentName;
    this.elapsedSeconds = elapsedSeconds;
}
ResultsView.prototype.generateHtml = function() {
    var analysis = this.analysis;
    var grade = analysis.getGrade();
    var title = this.config.examTitle || 'Mock Test';
    var timeTaken = formatDuration(this.elapsedSeconds);
    var dateString = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    var pctValue = analysis.scorePercent();
    var pctClass = analysis.gradableTotal() > 0 ? 'pct-' + gradeClass(parseFloat(pctValue)) : 'pct-ungraded';
    var html = '<div class="results-inner">';
    html += '<div class="results-banner anim-in"><h1>' + escapeHtml(title) + '</h1><p>' + (this.studentName ? escapeHtml(this.studentName) + ' &bull; ' : '') + dateString + '</p></div>';
    html += '<div class="score-ring-wrap anim-in anim-d1"><div class="score-ring"><div class="score-big">' + analysis.correctCount + '</div><div class="score-of">out of ' + analysis.gradableTotal() + (analysis.ungradedCount ? ' (+' + analysis.ungradedCount + ' N/A)' : '') + '</div><div class="score-pct ' + pctClass + '">' + pctValue + (pctValue !== '-' ? '%' : '') + '</div></div></div>';
    html += '<div class="stats-row anim-in anim-d2">';
    html += this._tile('color-correct', '\u2705', analysis.correctCount, 'Correct');
    html += this._tile('color-wrong', '\u274C', analysis.incorrectCount, 'Incorrect');
    html += this._tile('color-skip', '\u23ED\uFE0F', analysis.skippedCount, 'Skipped');
    html += this._tile('color-ungraded', '\u2753', analysis.ungradedCount, 'Ungraded');
    var accValue = analysis.accuracyPercent();
    html += this._tile('color-accuracy', '\u{1F3AF}', accValue + (accValue !== '-' ? '%' : ''), 'Accuracy');
    html += this._tile('color-time', '\u23F1\uFE0F', timeTaken, 'Time');
    html += this._tile('color-review', '\u{1F516}', analysis.reviewedCount, 'Reviewed');
    html += '</div>';
    html += '<div class="grade-box anim-in anim-d3"><div class="grade-badge badge-' + grade.cssClass + '">' + grade.icon + ' ' + grade.label + '</div><div class="grade-msg">' + grade.message + '</div></div>';
    html += '<div class="section-heading anim-in anim-d3">\u{1F4CA} Visual Analysis</div>';
    html += '<div class="charts-row anim-in anim-d4"><div class="chart-box">' + this._buildDonut() + '</div><div class="chart-box">' + this._buildBars() + '</div></div>';
    html += '<div class="section-heading anim-in anim-d4">\u{1F4DA} Subject Performance</div>';
    html += '<div class="subject-cards anim-in anim-d5">';
    for (var i = 0; i < analysis.subjectNames.length; i++) {
        var subjectName = analysis.subjectNames[i];
        var subjectData = analysis.getSubjectStats(subjectName);
        var subjectPct = subjectData.scorePercent().toFixed(1);
        var subjectAcc = subjectData.accuracyPercent().toFixed(1);
        var fillClass = subjectData.gradableCount() > 0 ? 'fill-' + gradeClass(parseFloat(subjectPct)) : 'fill-ungraded';
        html += '<div class="subject-card"><div class="subject-card-top"><div class="subject-name">' + escapeHtml(subjectName) + '</div><div class="subject-score">' + subjectData.correct + '/' + subjectData.gradableCount() + (subjectData.ungraded ? ' (+' + subjectData.ungraded + ' N/A)' : '') + '</div></div>';
        html += '<div class="progress-track"><div class="progress-fill ' + fillClass + '" data-target-width="' + (subjectData.gradableCount() > 0 ? subjectPct : '0') + '%" style="width:0%"></div></div>';
        html += '<div class="subject-mini-stats">';
        html += '<div class="mini-stat"><div class="mini-dot" style="background:var(--green)"></div>' + subjectData.correct + '</div>';
        html += '<div class="mini-stat"><div class="mini-dot" style="background:var(--red)"></div>' + subjectData.incorrect + '</div>';
        html += '<div class="mini-stat"><div class="mini-dot" style="background:var(--gray)"></div>' + subjectData.skipped + ' skip</div>';
        if (subjectData.ungraded) html += '<div class="mini-stat"><div class="mini-dot" style="background:var(--purple)"></div>' + subjectData.ungraded + ' N/A</div>';
        html += '<div class="mini-stat"><div class="mini-dot" style="background:var(--accent)"></div>Acc: ' + (subjectData.gradableCount() > 0 ? subjectAcc + '%' : '-') + '</div>';
        html += '</div></div>';
    }
    html += '</div>';
    html += this._buildReviewSection();
    html += '<div class="results-actions"><button class="home-btn" onclick="TestEngine.goHome()">\u{1F3E0} Home</button><button class="retake-btn" onclick="TestEngine.retakeExam()">\u{1F504} Retake</button></div>';
    html += '</div>';
    return html;
};
ResultsView.prototype._tile = function(colorClass, icon, value, label) {
    return '<div class="stat-tile ' + colorClass + '"><div class="tile-icon">' + icon + '</div><div class="tile-value">' + value + '</div><div class="tile-label">' + label + '</div></div>';
};
ResultsView.prototype._buildDonut = function() {
    var analysis = this.analysis;
    var total = analysis.totalQuestions();
    var segments = [
        { value: analysis.correctCount, color: '#22c55e', label: 'Correct' },
        { value: analysis.incorrectCount, color: '#ef4444', label: 'Incorrect' },
        { value: analysis.skippedCount, color: '#94a3b8', label: 'Skipped' },
        { value: analysis.ungradedCount, color: '#8b5cf6', label: 'Ungraded' }
    ];
    var radius = 55, strokeWidth = 18, cx = 75, cy = 75;
    var circumference = 2 * Math.PI * radius;
    var offset = 0;
    var svg = '<circle cx="' + cx + '" cy="' + cy + '" r="' + radius + '" fill="none" stroke="#e2e8f0" stroke-width="' + strokeWidth + '"/>';
    for (var i = 0; i < segments.length; i++) {
        var proportion = total > 0 ? segments[i].value / total : 0;
        var dashLength = proportion * circumference;
        if (proportion > 0) {
            svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + radius + '" fill="none" stroke="' + segments[i].color + '" stroke-width="' + strokeWidth + '" stroke-dasharray="' + dashLength + ' ' + (circumference - dashLength) + '" stroke-dashoffset="' + (-offset) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"/>';
        }
        offset += dashLength;
    }
    var legendHtml = '';
    for (var j = 0; j < segments.length; j++) {
        if (segments[j].value > 0) legendHtml += '<div class="legend-entry"><div class="legend-swatch" style="background:' + segments[j].color + '"></div>' + segments[j].label + ': ' + segments[j].value + '</div>';
    }
    return '<h3>Distribution</h3><div class="donut-wrap"><svg viewBox="0 0 150 150" width="150" height="150">' + svg + '</svg><div class="donut-center"><div class="donut-num">' + analysis.attemptedCount() + '</div><div class="donut-txt">Attempted</div></div></div><div class="chart-legend">' + legendHtml + '</div>';
};
ResultsView.prototype._buildBars = function() {
    var analysis = this.analysis;
    var html = '<h3>Subject Scores</h3><div style="width:100%">';
    var maxGradable = 1;
    for (var i = 0; i < analysis.subjectNames.length; i++) {
        var gradable = analysis.getSubjectStats(analysis.subjectNames[i]).gradableCount();
        if (gradable > maxGradable) maxGradable = gradable;
    }
    for (var j = 0; j < analysis.subjectNames.length; j++) {
        var subjectName = analysis.subjectNames[j];
        var stats = analysis.getSubjectStats(subjectName);
        var shortName = subjectName.length > 14 ? subjectName.substring(0, 14) + '\u2026' : subjectName;
        html += '<div style="margin-bottom:10px"><div style="font-size:.72rem;font-weight:600;color:var(--text-muted);margin-bottom:3px">' + escapeHtml(shortName) + '</div>';
        if (stats.gradableCount() === 0) {
            html += '<div style="height:18px;background:#f3e8ff;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;color:#7c3aed">All ungraded</div></div>';
            continue;
        }
        html += '<div style="display:flex;height:18px;background:#e2e8f0;border-radius:4px;overflow:hidden">';
        if (stats.correct > 0) html += '<div style="width:' + ((stats.correct / maxGradable) * 100).toFixed(0) + '%;background:linear-gradient(90deg,#22c55e,#16a34a);color:#fff;font-size:.6rem;font-weight:700;display:flex;align-items:center;justify-content:center">' + stats.correct + '</div>';
        if (stats.incorrect > 0) html += '<div style="width:' + ((stats.incorrect / maxGradable) * 100).toFixed(0) + '%;background:linear-gradient(90deg,#ef4444,#dc2626);color:#fff;font-size:.6rem;font-weight:700;display:flex;align-items:center;justify-content:center">' + stats.incorrect + '</div>';
        if (stats.skipped > 0) html += '<div style="width:' + ((stats.skipped / maxGradable) * 100).toFixed(0) + '%;background:linear-gradient(90deg,#94a3b8,#64748b);color:#fff;font-size:.6rem;font-weight:700;display:flex;align-items:center;justify-content:center">' + stats.skipped + '</div>';
        html += '</div></div>';
    }
    html += '</div><div class="chart-legend"><div class="legend-entry"><div class="legend-swatch" style="background:#22c55e"></div>Correct</div><div class="legend-entry"><div class="legend-swatch" style="background:#ef4444"></div>Wrong</div><div class="legend-entry"><div class="legend-swatch" style="background:#94a3b8"></div>Skip</div></div>';
    return html;
};
ResultsView.prototype._buildReviewSection = function() {
    var analysis = this.analysis;
    var questions = analysis.questions;
    var states = analysis.states;
    var html = '<div class="section-heading">\u{1F50D} Question Review</div>';
    html += '<div class="filter-row" id="subject-filter-row"><div class="filter-chip chip-active" data-subject-filter="ALL" onclick="TestEngine.filterBySubject(\'ALL\')">All Subjects</div>';
    for (var s = 0; s < analysis.subjectNames.length; s++) {
        var escaped = escapeHtml(analysis.subjectNames[s]);
        html += '<div class="filter-chip" data-subject-filter="' + escaped + '" onclick="TestEngine.filterBySubject(\'' + escaped.replace(/'/g, "\\'") + '\')">' + escaped + '</div>';
    }
    html += '</div>';
    html += '<div class="filter-row" id="status-filter-row">';
    html += '<button class="filter-chip chip-active" data-status-filter="all" onclick="TestEngine.filterByStatus(\'all\')">All <span class="chip-count">' + analysis.totalQuestions() + '</span></button>';
    html += '<button class="filter-chip" data-status-filter="correct" onclick="TestEngine.filterByStatus(\'correct\')">\u2705 <span class="chip-count">' + analysis.correctCount + '</span></button>';
    html += '<button class="filter-chip" data-status-filter="incorrect" onclick="TestEngine.filterByStatus(\'incorrect\')">\u274C <span class="chip-count">' + analysis.incorrectCount + '</span></button>';
    html += '<button class="filter-chip" data-status-filter="skipped" onclick="TestEngine.filterByStatus(\'skipped\')">\u23ED <span class="chip-count">' + analysis.skippedCount + '</span></button>';
    if (analysis.ungradedCount > 0) html += '<button class="filter-chip" data-status-filter="ungraded" onclick="TestEngine.filterByStatus(\'ungraded\')">\u2753 <span class="chip-count">' + analysis.ungradedCount + '</span></button>';
    html += '</div><div id="review-cards-container">';
    for (var i = 0; i < questions.length; i++) {
        var question = questions[i];
        var state = states[i];
        var status = state.evaluateStatus(question.CorrectOptionValue);
        var statusClass, statusText;
        if (status === 'correct') { statusClass = 'status-correct'; statusText = '\u2705 Correct'; }
        else if (status === 'incorrect') { statusClass = 'status-wrong'; statusText = '\u274C Incorrect'; }
        else if (status === 'skipped') { statusClass = 'status-skip'; statusText = '\u23ED Skipped'; }
        else { statusClass = 'status-ungraded'; statusText = '\u2753 Ungraded'; }
        html += '<div class="review-card" data-review-status="' + status + '" data-review-subject="' + escapeHtml(question.SubjectName) + '">';
        html += '<div class="review-card-head"><div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap"><span class="review-qnum">Q' + question.QuestionNumber + '</span><span class="review-subject">' + escapeHtml(question.SubjectName) + '</span></div><span class="review-status ' + statusClass + '">' + statusText + '</span></div>';
        html += '<div class="review-card-body"><div class="review-question-text">' + escapeHtml(question.QuestionText) + '</div>';
        for (var optIdx = 0; optIdx < question.OptionsValues.length; optIdx++) {
            var optionText = question.OptionsValues[optIdx];
            var isCorrectOption = question.CorrectOptionValue !== null && optionText === question.CorrectOptionValue;
            var isUserPick = state.answer === optionText;
            var optClass = 'opt-neutral';
            var markerText = String.fromCharCode(65 + optIdx);
            if (isCorrectOption) { optClass = 'opt-correct'; markerText = '\u2713'; }
            else if (isUserPick && question.CorrectOptionValue !== null) { optClass = 'opt-wrong'; markerText = '\u2717'; }
            else if (isUserPick && question.CorrectOptionValue === null) { optClass = 'opt-picked'; markerText = '\u2022'; }
            html += '<div class="review-opt ' + optClass + '"><div class="review-marker">' + markerText + '</div><span>' + escapeHtml(optionText) + '</span></div>';
        }
        html += '</div><div class="review-card-footer">';
        if (status === 'correct') html += '<span class="text-correct">\u2705 Correct!</span>';
        else if (status === 'incorrect') { html += '<span class="text-wrong">Yours: ' + escapeHtml(state.answer) + '</span>'; html += '<span class="text-correct">Answer: ' + escapeHtml(question.CorrectOptionValue) + '</span>'; }
        else if (status === 'skipped') { html += '<span style="color:var(--gray)">Not attempted</span>'; if (question.CorrectOptionValue !== null) html += '<span class="text-correct">Answer: ' + escapeHtml(question.CorrectOptionValue) + '</span>'; else html += '<span class="text-na">Key N/A</span>'; }
        else { if (state.answer !== null) html += '<span class="text-na">Your pick: ' + escapeHtml(state.answer) + '</span>'; html += '<span class="text-na">Answer key not available</span>'; }
        html += '</div></div>';
    }
    html += '</div>';
    return html;
};

var TestEngine = {
    registry: new ExamRegistry(),
    selectedExamKey: null,
    selectedDeptId: null,
    selectedYear: null,
    studentName: '',
    activeQuestions: [],
    activeConfig: {},
    questionStates: [],
    subjectList: [],
    currentQuestionIndex: 0,
    currentSubject: '',
    timer: null,
    _activeStatusFilter: 'all',
    _activeSubjectFilter: 'ALL',

    initialize: function() {
        this._loadDatabase();
        this._renderExamCards();
    },

    _loadDatabase: function() {
        if (typeof examDatabase === 'undefined') return;
        for (var i = 0; i < examDatabase.length; i++) {
            var entry = examDatabase[i];
            var examKey = entry.ExamName;
            this.registry.registerExam(examKey, entry.ExamName, entry.ExamIcon);
            this.registry.registerDepartment(examKey, entry.DepartmentID, entry.DepartmentName, entry.DepartmentIcon, entry.DepartmentDescription);
            this.registry.registerYear(examKey, entry.DepartmentID, entry.ExamYear, entry.ExamYearLabel || String(entry.ExamYear), entry.ExamYearIcon || '\u{1F4C5}', entry.ExamYearBadge || '');
            this.registry.registerQuestions(examKey, entry.DepartmentID, entry.ExamYear, { examTitle: entry.ExamConfiguration.ExamTitle, durationInMinutes: entry.ExamConfiguration.DurationInMinutes }, entry.Questions);
        }
    },

    _renderExamCards: function() {
        var grid = document.getElementById('exam-grid');
        var exams = this.registry.getExams();
        var self = this;
        grid.innerHTML = '';
        exams.forEach(function(exam) {
            var card = document.createElement('div');
            card.className = 'select-card';
            card.innerHTML = '<div class="card-emoji">' + exam.icon + '</div><div class="card-name">' + escapeHtml(exam.name) + '</div><div class="card-desc">' + exam.count + ' Department(s)</div>';
            card.addEventListener('click', function() { self._onExamSelected(exam.key, card); });
            grid.appendChild(card);
        });
    },

    _onExamSelected: function(examKey, cardElement) {
        this.selectedExamKey = examKey;
        this.selectedDeptId = null;
        this.selectedYear = null;
        this._highlightCard('exam-grid', cardElement);
        document.getElementById('step-num-1').className = 'step-number done';
        this._renderDeptCards(examKey);
        this._showWizardStep(2);
        this._updateBreadcrumb();
    },

    _renderDeptCards: function(examKey) {
        var grid = document.getElementById('dept-grid');
        var departments = this.registry.getDepartments(examKey);
        var self = this;
        grid.innerHTML = '';
        departments.forEach(function(dept) {
            var card = document.createElement('div');
            card.className = 'select-card';
            card.innerHTML = '<div class="card-emoji">' + dept.icon + '</div><div class="card-name">' + escapeHtml(dept.name) + '</div><div class="card-desc">' + escapeHtml(dept.description) + '</div>';
            card.addEventListener('click', function() { self._onDeptSelected(dept.id, card); });
            grid.appendChild(card);
        });
    },

    _onDeptSelected: function(deptId, cardElement) {
        this.selectedDeptId = deptId;
        this.selectedYear = null;
        this._highlightCard('dept-grid', cardElement);
        document.getElementById('step-num-2').className = 'step-number done';
        this._renderYearCards(this.selectedExamKey, deptId);
        this._showWizardStep(3);
        this._updateBreadcrumb();
    },

    _renderYearCards: function(examKey, deptId) {
        var grid = document.getElementById('year-grid');
        var years = this.registry.getYears(examKey, deptId);
        var self = this;
        grid.innerHTML = '';
        years.forEach(function(yearData) {
            var card = document.createElement('div');
            card.className = 'select-card';
            var inner = '<div class="card-emoji">' + yearData.icon + '</div><div class="card-name">' + escapeHtml(yearData.label) + '</div>';
            if (yearData.badge) inner += '<div class="card-tag' + (yearData.badge.toLowerCase().indexOf('past') >= 0 ? ' past-tag' : '') + '">' + escapeHtml(yearData.badge) + '</div>';
            card.innerHTML = inner;
            card.addEventListener('click', function() { self._onYearSelected(yearData.year, card); });
            grid.appendChild(card);
        });
    },

    _onYearSelected: function(year, cardElement) {
        this.selectedYear = year;
        this._highlightCard('year-grid', cardElement);
        document.getElementById('step-num-3').className = 'step-number done';
        this._populateConfirmation();
        this._showWizardStep(4);
        this._updateBreadcrumb();
    },

    _populateConfirmation: function() {
        var config = this.registry.getConfig(this.selectedExamKey, this.selectedDeptId, this.selectedYear);
        var questions = this.registry.getQuestions(this.selectedExamKey, this.selectedDeptId, this.selectedYear);
        var seen = new Set();
        var subjects = [];
        for (var i = 0; i < questions.length; i++) {
            if (!seen.has(questions[i].SubjectName)) { seen.add(questions[i].SubjectName); subjects.push(questions[i].SubjectName); }
        }
        document.getElementById('conf-exam').textContent = this.registry.getExamName(this.selectedExamKey);
        document.getElementById('conf-dept').textContent = this.registry.getDeptName(this.selectedExamKey, this.selectedDeptId);
        document.getElementById('conf-year').textContent = String(this.selectedYear);
        document.getElementById('conf-count').textContent = questions.length;
        document.getElementById('conf-duration').textContent = config.durationInMinutes + ' Minutes';
        document.getElementById('conf-subjects').textContent = subjects.join(', ');
    },

    _showWizardStep: function(stepNumber) {
        for (var i = 2; i <= 4; i++) {
            document.getElementById('wizard-step-' + i).classList.toggle('hidden', i > stepNumber);
            if (i > stepNumber) document.getElementById('step-num-' + i).className = 'step-number';
            else if (i === stepNumber) document.getElementById('step-num-' + i).className = 'step-number active';
        }
        document.getElementById('wizard-step-' + stepNumber).scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    _highlightCard: function(gridId, selectedCard) {
        var allCards = document.getElementById(gridId).querySelectorAll('.select-card');
        for (var i = 0; i < allCards.length; i++) allCards[i].classList.remove('chosen');
        selectedCard.classList.add('chosen');
    },

    _updateBreadcrumb: function() {
        var parts = ['<span class="crumb">' + escapeHtml(this.registry.getExamName(this.selectedExamKey)) + '</span>'];
        if (this.selectedDeptId) parts.push('<span class="crumb-sep">\u203A</span><span class="crumb">' + escapeHtml(this.registry.getDeptName(this.selectedExamKey, this.selectedDeptId)) + '</span>');
        if (this.selectedYear) parts.push('<span class="crumb-sep">\u203A</span><span class="crumb">' + this.selectedYear + '</span>');
        var currentStep = this.selectedYear ? 'Confirm' : this.selectedDeptId ? 'Select Year' : 'Select Dept';
        parts.push('<span class="crumb-sep">\u203A</span><span class="crumb-active">' + currentStep + '</span>');
        document.getElementById('breadcrumb').innerHTML = parts.join('');
    },

    beginExam: function() {
        this.studentName = document.getElementById('input-name').value.trim();
        this.activeConfig = this.registry.getConfig(this.selectedExamKey, this.selectedDeptId, this.selectedYear);
        this.activeQuestions = this.registry.getQuestions(this.selectedExamKey, this.selectedDeptId, this.selectedYear);
        if (!this.activeQuestions.length) { alert('No questions available.'); return; }
        this.questionStates = [];
        for (var i = 0; i < this.activeQuestions.length; i++) this.questionStates.push(new QuestionState());
        this.subjectList = [];
        var seen = new Set();
        for (var j = 0; j < this.activeQuestions.length; j++) {
            if (!seen.has(this.activeQuestions[j].SubjectName)) { seen.add(this.activeQuestions[j].SubjectName); this.subjectList.push(this.activeQuestions[j].SubjectName); }
        }
        this.currentQuestionIndex = 0;
        this.currentSubject = '';
        document.getElementById('landing-view').classList.add('hidden');
        document.getElementById('test-view').classList.remove('hidden');
        document.getElementById('display-exam-title').textContent = this.activeConfig.examTitle || 'Mock Test';
        document.title = this.activeConfig.examTitle || 'Mock Test';
        var nameDisplay = document.getElementById('display-student-name');
        if (this.studentName) { nameDisplay.textContent = this.studentName; nameDisplay.style.display = 'inline'; } else { nameDisplay.style.display = 'none'; }
        this._buildSubjectTabs();
        this._buildPalette();
        if (this.subjectList.length > 0) this._switchToSubject(this.subjectList[0]);
        var self = this;
        this.timer = new TimerController(this.activeConfig.durationInMinutes * 60, document.getElementById('display-timer'), function() { self.submitExam(true); });
        this.timer.start();
    },

    _buildSubjectTabs: function() {
        var container = document.getElementById('display-subject-tabs');
        var self = this;
        container.innerHTML = '';
        this.subjectList.forEach(function(subject) {
            var tab = document.createElement('div');
            tab.className = 'subject-tab';
            tab.textContent = subject;
            tab.addEventListener('click', function() { self._switchToSubject(subject); });
            container.appendChild(tab);
        });
    },

    _buildPalette: function() {
        var grid = document.getElementById('display-palette');
        var self = this;
        grid.innerHTML = '';
        for (var i = 0; i < this.activeQuestions.length; i++) {
            (function(index) {
                var button = document.createElement('div');
                button.className = 'palette-btn';
                button.textContent = self.activeQuestions[index].QuestionNumber;
                button.id = 'palette-' + index;
                button.addEventListener('click', function() { self._goToQuestion(index); });
                grid.appendChild(button);
            })(i);
        }
    },

    _switchToSubject: function(subject) {
        this.currentSubject = subject;
        var tabs = document.querySelectorAll('.subject-tab');
        for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('active-tab', tabs[i].textContent === subject);
        for (var j = 0; j < this.activeQuestions.length; j++) {
            var btn = document.getElementById('palette-' + j);
            if (btn) btn.style.display = this.activeQuestions[j].SubjectName === subject ? 'flex' : 'none';
        }
        var firstInSubject = -1;
        for (var k = 0; k < this.activeQuestions.length; k++) {
            if (this.activeQuestions[k].SubjectName === subject) { firstInSubject = k; break; }
        }
        if (firstInSubject >= 0) this._goToQuestion(firstInSubject);
    },

    _goToQuestion: function(index) {
        if (index < 0 || index >= this.activeQuestions.length) return;
        this.currentQuestionIndex = index;
        var question = this.activeQuestions[index];
        if (this.currentSubject !== question.SubjectName) { this._switchToSubject(question.SubjectName); return; }
        document.getElementById('display-question-number').textContent = 'Question ' + question.QuestionNumber;
        document.getElementById('display-question-text').innerHTML = escapeHtml(question.QuestionText);
        var optionsContainer = document.getElementById('display-options');
        var state = this.questionStates[index];
        var self = this;
        optionsContainer.innerHTML = '';
        question.OptionsValues.forEach(function(optionText) {
            var label = document.createElement('label');
            label.className = 'option-row' + (state.answer === optionText ? ' selected-option' : '');
            var radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'question-answer';
            radio.checked = state.answer === optionText;
            radio.addEventListener('change', function() { self._onAnswerSelected(optionText, label); });
            var span = document.createElement('span');
            span.innerHTML = escapeHtml(optionText);
            label.appendChild(radio);
            label.appendChild(span);
            optionsContainer.appendChild(label);
        });
        document.getElementById('question-scroll-area').scrollTop = 0;
        this._refreshPalette();
        if (window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetPromise([document.getElementById('display-question-text'), document.getElementById('display-options')]).catch(function() {});
        }
    },

    _onAnswerSelected: function(value, labelElement) {
        this.questionStates[this.currentQuestionIndex].selectAnswer(value);
        var allOptions = document.querySelectorAll('.option-row');
        for (var i = 0; i < allOptions.length; i++) allOptions[i].classList.remove('selected-option');
        labelElement.classList.add('selected-option');
        this._refreshPalette();
    },

    clearAnswer: function() {
        this.questionStates[this.currentQuestionIndex].clearAnswer();
        var allOptions = document.querySelectorAll('.option-row');
        for (var i = 0; i < allOptions.length; i++) { allOptions[i].classList.remove('selected-option'); allOptions[i].querySelector('input').checked = false; }
        this._refreshPalette();
    },

    navigateQuestion: function(direction) {
        var nextIndex = this.currentQuestionIndex + direction;
        while (nextIndex >= 0 && nextIndex < this.activeQuestions.length) {
            if (this.activeQuestions[nextIndex].SubjectName === this.currentSubject) { this._goToQuestion(nextIndex); return; }
            nextIndex += direction;
        }
    },

    toggleReview: function() {
        this.questionStates[this.currentQuestionIndex].toggleReview();
        this._refreshPalette();
    },

    _refreshPalette: function() {
        for (var i = 0; i < this.activeQuestions.length; i++) {
            var btn = document.getElementById('palette-' + i);
            if (!btn) continue;
            btn.className = 'palette-btn';
            if (i === this.currentQuestionIndex) btn.classList.add('current-btn');
            if (this.questionStates[i].review) btn.classList.add('review-btn-state');
            else if (this.questionStates[i].hasAnswer()) btn.classList.add('answered-btn');
        }
        document.getElementById('display-review-toggle').innerHTML = this.questionStates[this.currentQuestionIndex].review ? '\u{1F516} Unmark' : '\u{1F516} Review';
    },

    submitExam: function(autoSubmit) {
        if (!autoSubmit && !confirm('Submit your exam now?')) return;
        if (this.timer) this.timer.stop();
        var analysis = new AnalysisEngine(this.activeQuestions, this.questionStates);
        var resultsView = new ResultsView(analysis, this.activeConfig, this.studentName, this.timer ? this.timer.elapsed : 0);
        document.getElementById('test-view').classList.add('hidden');
        document.getElementById('results-view').classList.remove('hidden');
        document.getElementById('results-output').innerHTML = resultsView.generateHtml();
        this._activeStatusFilter = 'all';
        this._activeSubjectFilter = 'ALL';
        requestAnimationFrame(function() {
            setTimeout(function() {
                var bars = document.querySelectorAll('[data-target-width]');
                for (var i = 0; i < bars.length; i++) bars[i].style.width = bars[i].getAttribute('data-target-width');
            }, 120);
        });
        if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise().catch(function() {});
    },

    filterByStatus: function(status) {
        this._activeStatusFilter = status;
        var chips = document.querySelectorAll('#status-filter-row .filter-chip');
        for (var i = 0; i < chips.length; i++) chips[i].classList.toggle('chip-active', chips[i].getAttribute('data-status-filter') === status);
        this._applyReviewFilters();
    },

    filterBySubject: function(subject) {
        this._activeSubjectFilter = subject;
        var chips = document.querySelectorAll('#subject-filter-row .filter-chip');
        for (var i = 0; i < chips.length; i++) chips[i].classList.toggle('chip-active', chips[i].getAttribute('data-subject-filter') === subject);
        this._applyReviewFilters();
    },

    _applyReviewFilters: function() {
        var cards = document.querySelectorAll('.review-card');
        for (var i = 0; i < cards.length; i++) {
            var matchesStatus = this._activeStatusFilter === 'all' || cards[i].getAttribute('data-review-status') === this._activeStatusFilter;
            var matchesSubject = this._activeSubjectFilter === 'ALL' || cards[i].getAttribute('data-review-subject') === this._activeSubjectFilter;
            cards[i].style.display = matchesStatus && matchesSubject ? '' : 'none';
        }
    },

    retakeExam: function() {
        document.getElementById('results-view').classList.add('hidden');
        this.questionStates = [];
        for (var i = 0; i < this.activeQuestions.length; i++) this.questionStates.push(new QuestionState());
        this.currentQuestionIndex = 0;
        this._activeStatusFilter = 'all';
        this._activeSubjectFilter = 'ALL';
        document.getElementById('test-view').classList.remove('hidden');
        this._buildPalette();
        if (this.subjectList.length > 0) this._switchToSubject(this.subjectList[0]);
        var self = this;
        this.timer = new TimerController(this.activeConfig.durationInMinutes * 60, document.getElementById('display-timer'), function() { self.submitExam(true); });
        this.timer.start();
    },

    goHome: function() {
        document.getElementById('results-view').classList.add('hidden');
        document.getElementById('test-view').classList.add('hidden');
        document.getElementById('landing-view').classList.remove('hidden');
        for (var i = 2; i <= 4; i++) document.getElementById('wizard-step-' + i).classList.add('hidden');
        for (var j = 1; j <= 4; j++) document.getElementById('step-num-' + j).className = j === 1 ? 'step-number active' : 'step-number';
        var allCards = document.querySelectorAll('.select-card');
        for (var k = 0; k < allCards.length; k++) allCards[k].classList.remove('chosen');
        this.selectedExamKey = null;
        this.selectedDeptId = null;
        this.selectedYear = null;
        this._activeStatusFilter = 'all';
        this._activeSubjectFilter = 'ALL';
        document.getElementById('input-name').value = '';
        document.getElementById('breadcrumb').innerHTML = '<span class="crumb-active">Select Exam</span>';
        document.title = 'Mock Test Engine';
        if (this.timer) this.timer.stop();
    }
};

window.onload = function() { TestEngine.initialize(); };
