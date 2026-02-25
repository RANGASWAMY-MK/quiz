class HashMap {
    constructor(size = 53) {
        this.keyMap = new Array(size);
        this.size = size;
        this.count = 0;
    }

    _hash(key) {
        let total = 0;
        const PRIME = 31;
        for (let i = 0; i < Math.min(String(key).length, 100); i++) {
            const value = String(key).charCodeAt(i) - 96;
            total = (total * PRIME + value) % this.size;
        }
        return Math.abs(total);
    }

    set(key, value) {
        const idx = this._hash(key);
        if (!this.keyMap[idx]) this.keyMap[idx] = [];
        const pair = this.keyMap[idx].find(p => p[0] === key);
        if (pair) {
            pair[1] = value;
        } else {
            this.keyMap[idx].push([key, value]);
            this.count++;
        }
    }

    get(key) {
        const idx = this._hash(key);
        if (this.keyMap[idx]) {
            const pair = this.keyMap[idx].find(p => p[0] === key);
            if (pair) return pair[1];
        }
        return undefined;
    }

    has(key) {
        return this.get(key) !== undefined;
    }

    delete(key) {
        const idx = this._hash(key);
        if (this.keyMap[idx]) {
            const i = this.keyMap[idx].findIndex(p => p[0] === key);
            if (i !== -1) {
                this.keyMap[idx].splice(i, 1);
                this.count--;
                return true;
            }
        }
        return false;
    }

    values() {
        const vals = [];
        for (let i = 0; i < this.size; i++) {
            if (this.keyMap[i]) {
                for (const p of this.keyMap[i]) vals.push(p[1]);
            }
        }
        return vals;
    }

    keys() {
        const k = [];
        for (let i = 0; i < this.size; i++) {
            if (this.keyMap[i]) {
                for (const p of this.keyMap[i]) k.push(p[0]);
            }
        }
        return k;
    }

    clear() {
        this.keyMap = new Array(this.size);
        this.count = 0;
    }
}

class MaxHeap {
    constructor(compareFn) {
        this.heap = [];
        this.compare = compareFn || ((a, b) => a.score - b.score);
    }

    insert(val) {
        this.heap.push(val);
        this._bubbleUp(this.heap.length - 1);
    }

    extractMax() {
        if (!this.heap.length) return null;
        const max = this.heap[0];
        const end = this.heap.pop();
        if (this.heap.length) {
            this.heap[0] = end;
            this._sinkDown(0);
        }
        return max;
    }

    _bubbleUp(i) {
        while (i > 0) {
            const pi = Math.floor((i - 1) / 2);
            if (this.compare(this.heap[i], this.heap[pi]) <= 0) break;
            [this.heap[i], this.heap[pi]] = [this.heap[pi], this.heap[i]];
            i = pi;
        }
    }

    _sinkDown(i) {
        const len = this.heap.length;
        while (true) {
            let largest = i;
            const l = 2 * i + 1, r = 2 * i + 2;
            if (l < len && this.compare(this.heap[l], this.heap[largest]) > 0) largest = l;
            if (r < len && this.compare(this.heap[r], this.heap[largest]) > 0) largest = r;
            if (largest === i) break;
            [this.heap[i], this.heap[largest]] = [this.heap[largest], this.heap[i]];
            i = largest;
        }
    }

    toSortedArray() {
        const copy = [...this.heap];
        const sorted = [];
        const tmp = new MaxHeap(this.compare);
        tmp.heap = copy;
        while (tmp.heap.length) sorted.push(tmp.extractMax());
        return sorted;
    }

    get length() { return this.heap.length; }
}

class Stack {
    constructor() { this.items = []; }
    push(item) { this.items.push(item); }
    pop() { return this.items.pop(); }
    peek() { return this.items[this.items.length - 1]; }
    isEmpty() { return this.items.length === 0; }
    get size() { return this.items.length; }
    clear() { this.items = []; }
}

class Question {
    constructor(id, text, options, correctIndex, category) {
        this.id = id;
        this.text = text;
        this.options = options;
        this.correctIndex = correctIndex;
        this.category = category || 'General';
    }

    isCorrect(idx) { return idx === this.correctIndex; }
}

class Quiz {
    constructor(id, title, questions, timeLimit, category, icon) {
        this.id = id;
        this.title = title;
        this.questions = questions;
        this.timeLimit = timeLimit || 900;
        this.category = category || 'General';
        this.icon = icon || '📝';
        this.createdAt = Date.now();
        this.isCustom = false;
    }

    getShuffled(count) {
        const shuffled = Quiz.fisherYatesShuffle([...this.questions]);
        return shuffled.slice(0, Math.min(count || this.questions.length, shuffled.length));
    }

    static fisherYatesShuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}

class QuizResult {
    constructor(quizId, quizTitle, score, total, answers, timeTaken) {
        this.id = 'r_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        this.quizId = quizId;
        this.quizTitle = quizTitle;
        this.score = score;
        this.total = total;
        this.percentage = Math.round((score / total) * 100);
        this.answers = answers;
        this.timeTaken = timeTaken;
        this.date = new Date().toISOString();
    }
}

class QuizSession {
    constructor(quiz) {
        this.quiz = quiz;
        this.questions = quiz.getShuffled();
        this.currentIndex = 0;
        this.answers = new HashMap();
        this.startTime = Date.now();
        this.timeRemaining = quiz.timeLimit;
        this.isActive = true;
        this.navStack = new Stack();
        this.timerInterval = null;
    }

    current() { return this.questions[this.currentIndex]; }

    goTo(idx) {
        if (idx >= 0 && idx < this.questions.length && idx !== this.currentIndex) {
            this.navStack.push(this.currentIndex);
            this.currentIndex = idx;
            return true;
        }
        return false;
    }

    next() {
        if (this.currentIndex < this.questions.length - 1) {
            this.navStack.push(this.currentIndex);
            this.currentIndex++;
            return true;
        }
        return false;
    }

    prev() {
        if (this.currentIndex > 0) {
            this.navStack.push(this.currentIndex);
            this.currentIndex--;
            return true;
        }
        return false;
    }

    setAnswer(qId, ansIdx) { this.answers.set(qId, ansIdx); }
    getAnswer(qId) { return this.answers.get(qId); }

    calcResult() {
        let score = 0;
        const details = [];
        for (const q of this.questions) {
            const ua = this.answers.get(q.id);
            const correct = ua !== undefined && q.isCorrect(ua);
            if (correct) score++;
            details.push({
                qId: q.id, text: q.text, options: q.options,
                correctIndex: q.correctIndex, userAnswer: ua !== undefined ? ua : -1, correct
            });
        }
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        return new QuizResult(this.quiz.id, this.quiz.title, score, this.questions.length, details, elapsed);
    }

    get isLast() { return this.currentIndex === this.questions.length - 1; }
    get isFirst() { return this.currentIndex === 0; }
    get answered() { return this.answers.count; }
}

class BookmarkStore {
    constructor() {
        this.data = new HashMap();
        this._load();
    }

    add(q) {
        this.data.set(q.id, { id: q.id, text: q.text, options: q.options, correctIndex: q.correctIndex, category: q.category, ts: Date.now() });
        this._save();
    }

    remove(id) { this.data.delete(id); this._save(); }

    toggle(q) {
        if (this.data.has(q.id)) { this.remove(q.id); return false; }
        this.add(q); return true;
    }

    has(id) { return this.data.has(id); }
    getAll() { return this.data.values().sort((a, b) => b.ts - a.ts); }
    get count() { return this.data.count; }

    _save() { localStorage.setItem('qm_bookmarks', JSON.stringify(this.data.values())); }

    _load() {
        try {
            const d = JSON.parse(localStorage.getItem('qm_bookmarks') || '[]');
            d.forEach(item => this.data.set(item.id, item));
        } catch (e) {}
    }
}

class ResultStore {
    constructor() {
        this.results = [];
        this.heap = new MaxHeap((a, b) => a.percentage - b.percentage);
        this._load();
    }

    add(result) {
        this.results.push(result);
        this.heap.insert(result);
        this._save();
    }

    getAll() { return [...this.results].reverse(); }

    getTopScores(n) {
        return this.heap.toSortedArray().slice(0, n || 5);
    }

    getStats() {
        if (!this.results.length) return null;
        const total = this.results.length;
        const avg = this.results.reduce((s, r) => s + r.percentage, 0) / total;
        const best = Math.max(...this.results.map(r => r.percentage));
        const tq = this.results.reduce((s, r) => s + r.total, 0);
        const tc = this.results.reduce((s, r) => s + r.score, 0);
        return { total, avg: Math.round(avg), best, questions: tq, correct: tc, accuracy: Math.round((tc / tq) * 100) };
    }

    _save() { localStorage.setItem('qm_results', JSON.stringify(this.results)); }

    _load() {
        try {
            const d = JSON.parse(localStorage.getItem('qm_results') || '[]');
            d.forEach(r => { this.results.push(r); this.heap.insert(r); });
        } catch (e) {}
    }
}

class SheetLoader {
    static extractId(input) {
        const m = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (m) return m[1];
        if (/^[a-zA-Z0-9-_]{20,}$/.test(input.trim())) return input.trim();
        return null;
    }

    static async load(input, sheetName) {
        const id = SheetLoader.extractId(input);
        if (!id) throw new Error('Invalid Google Sheet URL or ID');
        let url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv`;
        if (sheetName && sheetName.trim()) url += `&sheet=${encodeURIComponent(sheetName.trim())}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch. Make sure the sheet is published to the web.');
        const csv = await res.text();
        return SheetLoader.parseCSV(csv);
    }

    static parseCSV(csv) {
        const rows = SheetLoader._csvToRows(csv);
        if (rows.length < 2) throw new Error('No data rows found in sheet');
        const questions = [];
        for (let i = 1; i < rows.length; i++) {
            const r = rows[i];
            if (r.length < 6 || !r[0].trim()) continue;
            const opts = [r[1], r[2], r[3], r[4]].map(o => (o || '').trim()).filter(o => o);
            if (opts.length < 2) continue;
            let ci = 0;
            const ans = (r[5] || '').trim().toUpperCase();
            if (ans === 'A' || ans === '1') ci = 0;
            else if (ans === 'B' || ans === '2') ci = 1;
            else if (ans === 'C' || ans === '3') ci = 2;
            else if (ans === 'D' || ans === '4') ci = 3;
            else {
                const fi = opts.findIndex(o => o.toLowerCase() === r[5].trim().toLowerCase());
                if (fi !== -1) ci = fi;
            }
            questions.push(new Question('sq_' + Date.now() + '_' + i, r[0].trim(), opts, ci, (r[6] || 'General').trim()));
        }
        if (!questions.length) throw new Error('No valid questions found. Check sheet format.');
        return questions;
    }

    static _csvToRows(csv) {
        const rows = [];
        let row = [], field = '', inQ = false;
        for (let i = 0; i < csv.length; i++) {
            const c = csv[i], n = csv[i + 1];
            if (inQ) {
                if (c === '"' && n === '"') { field += '"'; i++; }
                else if (c === '"') inQ = false;
                else field += c;
            } else {
                if (c === '"') inQ = true;
                else if (c === ',') { row.push(field); field = ''; }
                else if (c === '\n' || (c === '\r' && n === '\n')) {
                    row.push(field); rows.push(row); row = []; field = '';
                    if (c === '\r') i++;
                } else if (c === '\r') {
                    row.push(field); rows.push(row); row = []; field = '';
                } else field += c;
            }
        }
        if (field || row.length) { row.push(field); rows.push(row); }
        return rows;
    }
}

class DefaultData {
    static getQuizzes() {
        const sciQ = [
            new Question('s1', 'What is the chemical symbol for gold?', ['Au', 'Ag', 'Fe', 'Cu'], 0, 'Science'),
            new Question('s2', 'What planet is known as the Red Planet?', ['Venus', 'Mars', 'Jupiter', 'Saturn'], 1, 'Science'),
            new Question('s3', 'What is the speed of light approximately?', ['300,000 km/s', '150,000 km/s', '450,000 km/s', '600,000 km/s'], 0, 'Science'),
            new Question('s4', 'What is the powerhouse of the cell?', ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi body'], 2, 'Science'),
            new Question('s5', 'Which gas do plants absorb from the atmosphere?', ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], 2, 'Science'),
            new Question('s6', 'What is the hardest natural substance on Earth?', ['Gold', 'Iron', 'Diamond', 'Platinum'], 2, 'Science'),
            new Question('s7', 'How many bones are in the adult human body?', ['196', '206', '216', '226'], 1, 'Science'),
            new Question('s8', 'What is the largest organ in the human body?', ['Heart', 'Liver', 'Brain', 'Skin'], 3, 'Science'),
            new Question('s9', 'What type of energy does the Sun primarily emit?', ['Kinetic', 'Nuclear', 'Electromagnetic', 'Chemical'], 2, 'Science'),
            new Question('s10', 'What is the chemical formula for water?', ['HO2', 'H2O', 'H2O2', 'OH'], 1, 'Science'),
            new Question('s11', 'Which element has the atomic number 1?', ['Helium', 'Hydrogen', 'Lithium', 'Carbon'], 1, 'Science'),
            new Question('s12', 'What is the boiling point of water in Celsius?', ['90°C', '100°C', '110°C', '120°C'], 1, 'Science'),
        ];

        const mathQ = [
            new Question('m1', 'What is the value of π (pi) to two decimal places?', ['3.12', '3.14', '3.16', '3.18'], 1, 'Math'),
            new Question('m2', 'What is the square root of 144?', ['10', '11', '12', '13'], 2, 'Math'),
            new Question('m3', 'What is 15% of 200?', ['20', '25', '30', '35'], 2, 'Math'),
            new Question('m4', 'What is the next prime number after 7?', ['9', '10', '11', '13'], 2, 'Math'),
            new Question('m5', 'What is 2^10?', ['512', '1024', '2048', '4096'], 1, 'Math'),
            new Question('m6', 'What is the sum of interior angles of a triangle?', ['90°', '180°', '270°', '360°'], 1, 'Math'),
            new Question('m7', 'What is the factorial of 5 (5!)?', ['60', '100', '120', '150'], 2, 'Math'),
            new Question('m8', 'What is the LCM of 4 and 6?', ['8', '10', '12', '24'], 2, 'Math'),
            new Question('m9', 'How many sides does a hexagon have?', ['5', '6', '7', '8'], 1, 'Math'),
            new Question('m10', 'What is log₁₀(1000)?', ['2', '3', '4', '10'], 1, 'Math'),
        ];

        const gkQ = [
            new Question('g1', 'What is the largest ocean on Earth?', ['Atlantic', 'Indian', 'Pacific', 'Arctic'], 2, 'GK'),
            new Question('g2', 'Which country has the most population?', ['USA', 'India', 'China', 'Indonesia'], 1, 'GK'),
            new Question('g3', 'What is the capital of Australia?', ['Sydney', 'Melbourne', 'Canberra', 'Perth'], 2, 'GK'),
            new Question('g4', 'Who painted the Mona Lisa?', ['Van Gogh', 'Da Vinci', 'Picasso', 'Michelangelo'], 1, 'GK'),
            new Question('g5', 'What is the longest river in the world?', ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], 1, 'GK'),
            new Question('g6', 'Which planet has the most moons?', ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], 1, 'GK'),
            new Question('g7', 'What year did World War II end?', ['1943', '1944', '1945', '1946'], 2, 'GK'),
            new Question('g8', 'What is the smallest country in the world?', ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], 1, 'GK'),
            new Question('g9', 'Which element is most abundant in Earth\'s atmosphere?', ['Oxygen', 'Carbon', 'Nitrogen', 'Hydrogen'], 2, 'GK'),
            new Question('g10', 'What is the currency of Japan?', ['Yuan', 'Won', 'Yen', 'Ringgit'], 2, 'GK'),
        ];

        const techQ = [
            new Question('t1', 'What does CPU stand for?', ['Central Processing Unit', 'Central Program Utility', 'Computer Personal Unit', 'Central Peripheral Unit'], 0, 'Tech'),
            new Question('t2', 'What does HTML stand for?', ['Hyper Trainer Marking Language', 'HyperText Markup Language', 'HyperText Marketing Language', 'HyperTool Multi Language'], 1, 'Tech'),
            new Question('t3', 'Which company created JavaScript?', ['Microsoft', 'Google', 'Netscape', 'Apple'], 2, 'Tech'),
            new Question('t4', 'What is the binary representation of 10?', ['1000', '1010', '1100', '1001'], 1, 'Tech'),
            new Question('t5', 'What does RAM stand for?', ['Read Access Memory', 'Random Access Memory', 'Run Application Memory', 'Random Application Module'], 1, 'Tech'),
            new Question('t6', 'Which data structure uses FIFO?', ['Stack', 'Queue', 'Tree', 'Graph'], 1, 'Tech'),
            new Question('t7', 'What is the time complexity of binary search?', ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'], 2, 'Tech'),
            new Question('t8', 'What does SQL stand for?', ['Structured Query Language', 'Simple Query Language', 'Standard Query Logic', 'System Query Language'], 0, 'Tech'),
            new Question('t9', 'Which protocol is used for secure web browsing?', ['HTTP', 'FTP', 'HTTPS', 'SMTP'], 2, 'Tech'),
            new Question('t10', 'What is the main function of an operating system?', ['Web browsing', 'Resource management', 'Photo editing', 'Gaming'], 1, 'Tech'),
        ];

        const q1 = new Quiz('quiz_sci', 'Science Challenge', sciQ, 600, 'Science', '🔬');
        const q2 = new Quiz('quiz_math', 'Math Master', mathQ, 480, 'Mathematics', '🔢');
        const q3 = new Quiz('quiz_gk', 'General Knowledge', gkQ, 600, 'General', '🌍');
        const q4 = new Quiz('quiz_tech', 'Tech & CS', techQ, 600, 'Technology', '💻');

        const allQ = [...sciQ, ...mathQ, ...gkQ, ...techQ];
        const randomSet = Quiz.fisherYatesShuffle([...allQ]).slice(0, 15);
        const q5 = new Quiz('quiz_random', 'Random Mix', randomSet, 900, 'Mixed', '🎲');

        return [q1, q2, q3, q4, q5];
    }
}

class QuizApp {
    constructor() {
        this.quizzes = new HashMap();
        this.bookmarks = new BookmarkStore();
        this.results = new ResultStore();
        this.session = null;
        this.currentView = 'quizzes';
        this.theme = localStorage.getItem('qm_theme') || 'light';

        this._initDefaultQuizzes();
        this._loadCustomQuizzes();
        this._bindEvents();
        this._applyTheme();
        this._renderQuizList();
    }

    _initDefaultQuizzes() {
        DefaultData.getQuizzes().forEach(q => this.quizzes.set(q.id, q));
    }

    _loadCustomQuizzes() {
        try {
            const d = JSON.parse(localStorage.getItem('qm_custom_quizzes') || '[]');
            d.forEach(qd => {
                const questions = qd.questions.map(q => new Question(q.id, q.text, q.options, q.correctIndex, q.category));
                const quiz = new Quiz(qd.id, qd.title, questions, qd.timeLimit, qd.category, qd.icon);
                quiz.isCustom = true;
                this.quizzes.set(quiz.id, quiz);
            });
        } catch (e) {}
    }

    _saveCustomQuizzes() {
        const customs = this.quizzes.values().filter(q => q.isCustom);
        localStorage.setItem('qm_custom_quizzes', JSON.stringify(customs));
    }

    _applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
    }

    _bindEvents() {
        document.getElementById('themeToggle').addEventListener('click', () => this._toggleTheme());

        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => this._switchTab(tab.dataset.tab));
        });

        document.getElementById('createMockBtn').addEventListener('click', () => this._showModal('modalOverlay'));
        document.getElementById('closeModal').addEventListener('click', () => this._hideModal('modalOverlay'));
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'modalOverlay') this._hideModal('modalOverlay');
        });

        document.getElementById('mockForm').addEventListener('submit', (e) => this._handleCreateMock(e));

        document.getElementById('prevBtn').addEventListener('click', () => this._prevQuestion());
        document.getElementById('nextBtn').addEventListener('click', () => this._nextQuestion());
        document.getElementById('submitQuizBtn').addEventListener('click', () => this._confirmSubmit());
        document.getElementById('backBtn').addEventListener('click', () => this._confirmExit());
        document.getElementById('bookmarkToggle').addEventListener('click', () => this._toggleBookmark());

        document.getElementById('retakeBtn').addEventListener('click', () => this._retakeQuiz());
        document.getElementById('homeBtn').addEventListener('click', () => this._goHome());

        document.getElementById('confirmYes').addEventListener('click', () => {
            this._hideModal('confirmOverlay');
            if (this._confirmAction) this._confirmAction();
        });
        document.getElementById('confirmNo').addEventListener('click', () => this._hideModal('confirmOverlay'));
    }

    _toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('qm_theme', this.theme);
        this._applyTheme();
    }

    _switchTab(tabName) {
        if (this.session && this.session.isActive && (tabName !== 'quiz-view')) {
            this._confirmExit(() => {
                this._doSwitchTab(tabName);
            });
            return;
        }
        this._doSwitchTab(tabName);
    }

    _doSwitchTab(tabName) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));

        const tabBtn = document.querySelector(`.tab[data-tab="${tabName}"]`);
        if (tabBtn) tabBtn.classList.add('active');

        const section = document.getElementById(tabName + '-tab');
        if (section) section.classList.add('active');

        this.currentView = tabName;

        if (tabName === 'bookmarks') this._renderBookmarks();
        if (tabName === 'results') this._renderResults();
        if (tabName === 'quizzes') this._renderQuizList();
    }

    _showView(viewId) {
        document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    }

    _showModal(id) { document.getElementById(id).classList.add('active'); }
    _hideModal(id) { document.getElementById(id).classList.remove('active'); }

    _confirm(title, msg, action) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMsg').textContent = msg;
        this._confirmAction = action;
        this._showModal('confirmOverlay');
    }

    _renderQuizList() {
        const container = document.getElementById('quizList');
        const quizzes = this.quizzes.values().sort((a, b) => {
            if (a.isCustom && !b.isCustom) return -1;
            if (!a.isCustom && b.isCustom) return 1;
            return b.createdAt - a.createdAt;
        });

        container.innerHTML = quizzes.map(q => `
            <div class="quiz-card" data-id="${q.id}">
                <span class="quiz-card-cat">${q.category}</span>
                <div class="quiz-card-icon">${q.icon}</div>
                <h3>${q.title}</h3>
                <div class="quiz-card-meta">
                    <span>📋 ${q.questions.length} questions</span>
                    <span>⏱ ${Math.floor(q.timeLimit / 60)} min</span>
                    ${q.isCustom ? '<span>✨ Custom</span>' : ''}
                </div>
                <div class="quiz-card-actions">
                    <button class="btn-start" onclick="app._startQuiz('${q.id}')">Start Quiz</button>
                    ${q.isCustom ? `<button class="btn-delete" onclick="event.stopPropagation(); app._deleteQuiz('${q.id}')">Delete</button>` : ''}
                </div>
            </div>
        `).join('');
    }

    _startQuiz(quizId) {
        const quiz = this.quizzes.get(quizId);
        if (!quiz) return;

        if (this.session && this.session.timerInterval) clearInterval(this.session.timerInterval);

        this.session = new QuizSession(quiz);
        this._showView('quiz-view');
        document.getElementById('quizTitle').textContent = quiz.title;
        this._renderQuestionDots();
        this._renderQuestion();
        this._startTimer();
    }

    _startTimer() {
        const timerEl = document.getElementById('quizTimer');
        this._updateTimerDisplay();

        this.session.timerInterval = setInterval(() => {
            if (!this.session || !this.session.isActive) {
                clearInterval(this.session.timerInterval);
                return;
            }
            this.session.timeRemaining--;
            this._updateTimerDisplay();

            if (this.session.timeRemaining <= 60) timerEl.classList.add('warning');
            if (this.session.timeRemaining <= 0) {
                clearInterval(this.session.timerInterval);
                this._submitQuiz();
            }
        }, 1000);
    }

    _updateTimerDisplay() {
        const t = this.session.timeRemaining;
        const m = Math.floor(t / 60).toString().padStart(2, '0');
        const s = (t % 60).toString().padStart(2, '0');
        document.getElementById('quizTimer').textContent = `${m}:${s}`;
    }

    _renderQuestion() {
        const s = this.session;
        const q = s.current();
        const idx = s.currentIndex;
        const total = s.questions.length;
        const selectedAns = s.getAnswer(q.id);

        document.getElementById('questionNum').textContent = `Q${idx + 1}`;
        document.getElementById('questionCat').textContent = q.category;
        document.getElementById('questionText').textContent = q.text;
        document.getElementById('progressText').textContent = `${idx + 1}/${total}`;
        document.getElementById('progressFill').style.width = `${((idx + 1) / total) * 100}%`;

        const bmBtn = document.getElementById('bookmarkToggle');
        bmBtn.textContent = this.bookmarks.has(q.id) ? '★' : '☆';
        bmBtn.classList.toggle('active', this.bookmarks.has(q.id));

        const letters = ['A', 'B', 'C', 'D'];
        document.getElementById('optionsList').innerHTML = q.options.map((opt, i) => `
            <button class="option-btn ${selectedAns === i ? 'selected' : ''}" onclick="app._selectOption(${i})">
                <span class="option-letter">${letters[i]}</span>
                <span class="option-text">${opt}</span>
            </button>
        `).join('');

        document.getElementById('prevBtn').disabled = s.isFirst;

        if (s.isLast) {
            document.getElementById('nextBtn').style.display = 'none';
            document.getElementById('submitQuizBtn').style.display = 'inline-flex';
        } else {
            document.getElementById('nextBtn').style.display = 'inline-flex';
            document.getElementById('submitQuizBtn').style.display = 'none';
        }

        this._updateDots();
    }

    _renderQuestionDots() {
        const container = document.getElementById('questionDots');
        container.innerHTML = this.session.questions.map((q, i) =>
            `<span class="q-dot" onclick="app._goToQuestion(${i})">${i + 1}</span>`
        ).join('');
    }

    _updateDots() {
        const dots = document.querySelectorAll('.q-dot');
        dots.forEach((dot, i) => {
            dot.classList.remove('current', 'answered');
            if (i === this.session.currentIndex) dot.classList.add('current');
            else if (this.session.getAnswer(this.session.questions[i].id) !== undefined) dot.classList.add('answered');
        });
    }

    _selectOption(idx) {
        const q = this.session.current();
        this.session.setAnswer(q.id, idx);
        this._renderQuestion();
    }

    _nextQuestion() { if (this.session.next()) this._renderQuestion(); }
    _prevQuestion() { if (this.session.prev()) this._renderQuestion(); }

    _goToQuestion(idx) {
        if (this.session.goTo(idx)) this._renderQuestion();
    }

    _toggleBookmark() {
        const q = this.session.current();
        this.bookmarks.toggle(q);
        const bmBtn = document.getElementById('bookmarkToggle');
        bmBtn.textContent = this.bookmarks.has(q.id) ? '★' : '☆';
        bmBtn.classList.toggle('active', this.bookmarks.has(q.id));
    }

    _confirmSubmit() {
        const unanswered = this.session.questions.length - this.session.answered;
        const msg = unanswered > 0
            ? `You have ${unanswered} unanswered question(s). Are you sure you want to submit?`
            : 'Are you sure you want to submit the quiz?';
        this._confirm('Submit Quiz', msg, () => this._submitQuiz());
    }

    _confirmExit(callback) {
        this._confirm('Exit Quiz', 'Your progress will be lost. Are you sure?', () => {
            if (this.session && this.session.timerInterval) clearInterval(this.session.timerInterval);
            this.session = null;
            document.getElementById('quizTimer').classList.remove('warning');
            if (callback) callback();
            else this._doSwitchTab('quizzes');
        });
    }

    _submitQuiz() {
        if (this.session.timerInterval) clearInterval(this.session.timerInterval);
        this.session.isActive = false;

        const result = this.session.calcResult();
        this.results.add(result);

        this._showView('result-view');
        this._renderResultView(result);
    }

    _renderResultView(result) {
        const pct = result.percentage;
        const circumference = 2 * Math.PI * 52;
        const offset = circumference - (pct / 100) * circumference;

        const arc = document.getElementById('scoreArc');
        arc.style.strokeDasharray = circumference;
        arc.style.strokeDashoffset = circumference;
        arc.className = 'score-arc';

        let grade = 'poor';
        if (pct >= 80) grade = 'excellent';
        else if (pct >= 60) grade = 'good';
        else if (pct >= 40) grade = 'average';

        setTimeout(() => {
            arc.classList.add(grade);
            arc.style.strokeDashoffset = offset;
        }, 100);

        document.getElementById('scoreValue').textContent = pct + '%';

        const wrong = result.total - result.score;
        const skipped = result.answers.filter(a => a.userAnswer === -1).length;
        const time = result.timeTaken;
        const tm = Math.floor(time / 60);
        const ts = time % 60;

        document.getElementById('scoreDetails').innerHTML = `
            <div class="score-details">
                <div class="score-detail"><span class="score-detail-val correct-val">${result.score}</span><span class="score-detail-label">Correct</span></div>
                <div class="score-detail"><span class="score-detail-val wrong-val">${wrong - skipped}</span><span class="score-detail-label">Wrong</span></div>
                <div class="score-detail"><span class="score-detail-val skip-val">${skipped}</span><span class="score-detail-label">Skipped</span></div>
                <div class="score-detail"><span class="score-detail-val">${tm}m ${ts}s</span><span class="score-detail-label">Time</span></div>
            </div>
        `;

        const letters = ['A', 'B', 'C', 'D'];
        document.getElementById('reviewSection').innerHTML = result.answers.map((a, i) => {
            let statusClass = a.userAnswer === -1 ? 'skipped' : (a.correct ? 'correct' : 'wrong');
            let statusIcon = a.userAnswer === -1 ? '—' : (a.correct ? '✓' : '✗');
            return `
                <div class="review-item">
                    <div class="review-q-head">
                        <span class="review-status ${statusClass}">${statusIcon}</span>
                        <span class="review-q-text">Q${i + 1}. ${a.text}</span>
                    </div>
                    <div class="review-options">
                        ${a.options.map((opt, oi) => {
                            let cls = '';
                            if (oi === a.correctIndex) cls = 'is-correct';
                            else if (oi === a.userAnswer && !a.correct) cls = 'is-wrong';
                            return `<div class="review-opt ${cls}">${letters[oi]}. ${opt}</div>`;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    _retakeQuiz() {
        if (this.session) {
            this._startQuiz(this.session.quiz.id);
        }
    }

    _goHome() {
        this.session = null;
        document.getElementById('quizTimer').classList.remove('warning');
        this._doSwitchTab('quizzes');
    }

    _renderBookmarks() {
        const all = this.bookmarks.getAll();
        document.getElementById('bookmarkCount').textContent = all.length;
        const emptyEl = document.getElementById('bookmarkEmpty');
        const listEl = document.getElementById('bookmarkList');

        if (!all.length) {
            emptyEl.style.display = 'block';
            listEl.innerHTML = '';
            return;
        }

        emptyEl.style.display = 'none';
        const letters = ['A', 'B', 'C', 'D'];
        listEl.innerHTML = all.map(b => `
            <div class="bookmark-card">
                <div class="bookmark-head">
                    <span class="bookmark-cat">${b.category}</span>
                    <button class="bookmark-remove" onclick="app._removeBookmark('${b.id}')">✕</button>
                </div>
                <p class="bookmark-q">${b.text}</p>
                <div class="bookmark-opts">
                    ${b.options.map((o, i) => `
                        <div class="bookmark-opt ${i === b.correctIndex ? 'is-answer' : ''}">${letters[i]}. ${o}</div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    _removeBookmark(id) {
        this.bookmarks.remove(id);
        this._renderBookmarks();
    }

    _renderResults() {
        const stats = this.results.getStats();
        const all = this.results.getAll();
        const statsEl = document.getElementById('resultStats');
        const emptyEl = document.getElementById('resultEmpty');
        const listEl = document.getElementById('resultList');

        if (!stats) {
            statsEl.innerHTML = '';
            emptyEl.style.display = 'block';
            listEl.innerHTML = '';
            return;
        }

        emptyEl.style.display = 'none';

        statsEl.innerHTML = `
            <div class="stat-card"><span class="stat-val">${stats.total}</span><span class="stat-label">Quizzes Taken</span></div>
            <div class="stat-card"><span class="stat-val">${stats.avg}%</span><span class="stat-label">Avg Score</span></div>
            <div class="stat-card"><span class="stat-val">${stats.best}%</span><span class="stat-label">Best Score</span></div>
            <div class="stat-card"><span class="stat-val">${stats.accuracy}%</span><span class="stat-label">Accuracy</span></div>
            <div class="stat-card"><span class="stat-val">${stats.questions}</span><span class="stat-label">Questions</span></div>
            <div class="stat-card"><span class="stat-val">${stats.correct}</span><span class="stat-label">Correct</span></div>
        `;

        listEl.innerHTML = all.map(r => {
            let grade = 'poor';
            if (r.percentage >= 80) grade = 'excellent';
            else if (r.percentage >= 60) grade = 'good';
            else if (r.percentage >= 40) grade = 'average';

            const d = new Date(r.date);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const tm = Math.floor(r.timeTaken / 60);
            const ts = r.timeTaken % 60;

            return `
                <div class="result-item">
                    <div class="result-score-badge ${grade}">${r.percentage}%</div>
                    <div class="result-info">
                        <h4>${r.quizTitle}</h4>
                        <div class="result-meta">
                            <span>✓ ${r.score}/${r.total}</span>
                            <span>⏱ ${tm}m ${ts}s</span>
                            <span>📅 ${dateStr}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async _handleCreateMock(e) {
        e.preventDefault();
        const title = document.getElementById('mockTitle').value.trim();
        const sheetInput = document.getElementById('sheetInput').value.trim();
        const sheetName = document.getElementById('sheetName').value.trim();
        const numQ = parseInt(document.getElementById('numQuestions').value) || 10;
        const timeLim = (parseInt(document.getElementById('timeLimit').value) || 15) * 60;

        if (!title || !sheetInput) return;

        const statusEl = document.getElementById('loadStatus');
        const createBtn = document.getElementById('createBtn');

        statusEl.className = 'load-status loading';
        statusEl.innerHTML = '<div class="spinner"></div><span>Loading questions from Google Sheets...</span>';
        createBtn.disabled = true;

        try {
            const questions = await SheetLoader.load(sheetInput, sheetName);
            const shuffled = Quiz.fisherYatesShuffle([...questions]);
            const selected = shuffled.slice(0, Math.min(numQ, questions.length));

            const quizId = 'custom_' + Date.now();
            const quiz = new Quiz(quizId, title, selected, timeLim, 'Custom', '✨');
            quiz.isCustom = true;
            quiz.questions = questions;

            this.quizzes.set(quizId, quiz);
            this._saveCustomQuizzes();

            statusEl.className = 'load-status success';
            statusEl.textContent = `Loaded ${questions.length} questions successfully!`;

            setTimeout(() => {
                this._hideModal('modalOverlay');
                document.getElementById('mockForm').reset();
                statusEl.className = 'load-status';
                statusEl.textContent = '';
                createBtn.disabled = false;
                this._renderQuizList();
            }, 1200);

        } catch (err) {
            statusEl.className = 'load-status error';
            statusEl.textContent = err.message;
            createBtn.disabled = false;
        }
    }

    _deleteQuiz(quizId) {
        this._confirm('Delete Quiz', 'Are you sure you want to delete this quiz?', () => {
            this.quizzes.delete(quizId);
            this._saveCustomQuizzes();
            this._renderQuizList();
        });
    }
}

const app = new QuizApp();
