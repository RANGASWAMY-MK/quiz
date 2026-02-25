class MindDB {
    constructor(name, version) {
        this.name = name;
        this.version = version;
        this.db = null;
    }

    open() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(this.name, this.version);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('bookmarks')) {
                    db.createObjectStore('bookmarks', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('results')) {
                    db.createObjectStore('results', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('sheets')) {
                    db.createObjectStore('sheets', { keyPath: 'id' });
                }
            };
            req.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this.db);
            };
            req.onerror = () => reject(req.error);
        });
    }

    _tx(store, mode) {
        return this.db.transaction(store, mode).objectStore(store);
    }

    put(store, data) {
        return new Promise((resolve, reject) => {
            const req = this._tx(store, 'readwrite').put(data);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    get(store, key) {
        return new Promise((resolve, reject) => {
            const req = this._tx(store, 'readonly').get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    getAll(store) {
        return new Promise((resolve, reject) => {
            const req = this._tx(store, 'readonly').getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    }

    del(store, key) {
        return new Promise((resolve, reject) => {
            const req = this._tx(store, 'readwrite').delete(key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    clear(store) {
        return new Promise((resolve, reject) => {
            const req = this._tx(store, 'readwrite').clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }
}

class HashMap {
    constructor(sz = 53) {
        this.buckets = new Array(sz);
        this.sz = sz;
        this.count = 0;
    }

    _hash(k) {
        let h = 0;
        const s = String(k);
        for (let i = 0; i < Math.min(s.length, 100); i++) {
            h = (h * 31 + s.charCodeAt(i)) % this.sz;
        }
        return Math.abs(h);
    }

    set(k, v) {
        const i = this._hash(k);
        if (!this.buckets[i]) this.buckets[i] = [];
        const p = this.buckets[i].find(x => x[0] === k);
        if (p) p[1] = v;
        else { this.buckets[i].push([k, v]); this.count++; }
    }

    get(k) {
        const b = this.buckets[this._hash(k)];
        if (b) { const p = b.find(x => x[0] === k); if (p) return p[1]; }
        return undefined;
    }

    has(k) { return this.get(k) !== undefined; }

    delete(k) {
        const i = this._hash(k);
        const b = this.buckets[i];
        if (b) {
            const idx = b.findIndex(x => x[0] === k);
            if (idx !== -1) { b.splice(idx, 1); this.count--; return true; }
        }
        return false;
    }

    values() {
        const r = [];
        this.buckets.forEach(b => { if (b) b.forEach(p => r.push(p[1])); });
        return r;
    }

    keys() {
        const r = [];
        this.buckets.forEach(b => { if (b) b.forEach(p => r.push(p[0])); });
        return r;
    }
}

class PriorityQueue {
    constructor(cmp) {
        this.data = [];
        this.cmp = cmp || ((a, b) => a.val - b.val);
    }

    push(v) {
        this.data.push(v);
        let i = this.data.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (this.cmp(this.data[i], this.data[p]) >= 0) break;
            [this.data[i], this.data[p]] = [this.data[p], this.data[i]];
            i = p;
        }
    }

    pop() {
        if (!this.data.length) return null;
        const top = this.data[0];
        const last = this.data.pop();
        if (this.data.length) {
            this.data[0] = last;
            let i = 0;
            while (true) {
                let s = i, l = 2 * i + 1, r = 2 * i + 2;
                if (l < this.data.length && this.cmp(this.data[l], this.data[s]) < 0) s = l;
                if (r < this.data.length && this.cmp(this.data[r], this.data[s]) < 0) s = r;
                if (s === i) break;
                [this.data[i], this.data[s]] = [this.data[s], this.data[i]];
                i = s;
            }
        }
        return top;
    }

    peek() { return this.data[0]; }
    get length() { return this.data.length; }

    sorted() {
        const c = new PriorityQueue(this.cmp);
        c.data = [...this.data];
        const r = [];
        while (c.length) r.push(c.pop());
        return r;
    }
}

class Stack {
    constructor() { this.items = []; }
    push(v) { this.items.push(v); }
    pop() { return this.items.pop(); }
    peek() { return this.items[this.items.length - 1]; }
    get size() { return this.items.length; }
}

class Question {
    constructor(id, text, options, correctIndex, category) {
        this.id = id;
        this.text = text;
        this.options = options;
        this.correctIndex = correctIndex;
        this.category = category || 'General';
    }
}

class QuizData {
    constructor(id, title, questions, timeSec, icon) {
        this.id = id;
        this.title = title;
        this.questions = questions;
        this.timeSec = timeSec || 600;
        this.icon = icon || '📝';
        this.createdAt = Date.now();
        this.sheetId = '';
        this.sheetTab = '';
    }

    static shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    pick(n, doShuffle) {
        const q = doShuffle !== false ? QuizData.shuffle(this.questions) : [...this.questions];
        return q.slice(0, Math.min(n || q.length, q.length));
    }
}

class Session {
    constructor(quiz, questions) {
        this.quiz = quiz;
        this.questions = questions;
        this.idx = 0;
        this.answers = new HashMap();
        this.t0 = Date.now();
        this.timeLeft = quiz.timeSec;
        this.alive = true;
        this.timer = null;
        this.history = new Stack();
    }

    cur() { return this.questions[this.idx]; }

    go(i) {
        if (i >= 0 && i < this.questions.length && i !== this.idx) {
            this.history.push(this.idx);
            this.idx = i;
            return true;
        }
        return false;
    }

    next() { return this.idx < this.questions.length - 1 ? (this.history.push(this.idx), ++this.idx, true) : false; }
    prev() { return this.idx > 0 ? (this.history.push(this.idx), --this.idx, true) : false; }
    pick(qid, oi) { this.answers.set(qid, oi); }
    picked(qid) { return this.answers.get(qid); }

    finish() {
        this.alive = false;
        if (this.timer) clearInterval(this.timer);
        let correct = 0;
        const detail = this.questions.map(q => {
            const ua = this.answers.has(q.id) ? this.answers.get(q.id) : -1;
            const ok = ua === q.correctIndex;
            if (ok) correct++;
            return { qid: q.id, text: q.text, options: q.options, ci: q.correctIndex, ua, ok, cat: q.category };
        });
        return {
            id: 'r' + Date.now(),
            quizId: this.quiz.id,
            quizTitle: this.quiz.title,
            score: correct,
            total: this.questions.length,
            pct: Math.round((correct / this.questions.length) * 100),
            detail,
            elapsed: Math.floor((Date.now() - this.t0) / 1000),
            date: new Date().toISOString()
        };
    }

    get isLast() { return this.idx === this.questions.length - 1; }
    get isFirst() { return this.idx === 0; }
    get nAnswered() { return this.answers.count; }
}

class SheetParser {
    static extractId(input) {
        const m = input.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (m) return m[1];
        if (/^[a-zA-Z0-9_-]{20,}$/.test(input.trim())) return input.trim();
        return null;
    }

    static async fetch(input, tab) {
        const id = SheetParser.extractId(input);
        if (!id) throw new Error('Invalid Google Sheet URL or ID');
        let url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv`;
        if (tab && tab.trim()) url += `&sheet=${encodeURIComponent(tab.trim())}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Cannot fetch sheet. Make sure it is published/shared publicly.');
        return await res.text();
    }

    static parse(csv) {
        const rows = SheetParser._csvRows(csv);
        if (rows.length < 2) throw new Error('Sheet has no data rows');
        const qs = [];
        for (let i = 1; i < rows.length; i++) {
            const r = rows[i];
            if (r.length < 6 || !r[0].trim()) continue;
            const opts = [r[1], r[2], r[3], r[4]].map(s => (s || '').trim()).filter(Boolean);
            if (opts.length < 2) continue;
            let ci = 0;
            const a = (r[5] || '').trim().toUpperCase();
            if (a === 'A' || a === '1') ci = 0;
            else if (a === 'B' || a === '2') ci = 1;
            else if (a === 'C' || a === '3') ci = 2;
            else if (a === 'D' || a === '4') ci = 3;
            else {
                const fi = opts.findIndex(o => o.toLowerCase() === r[5].trim().toLowerCase());
                if (fi !== -1) ci = fi;
            }
            qs.push(new Question('q' + Date.now() + '_' + i, r[0].trim(), opts, ci, (r[6] || 'General').trim()));
        }
        if (!qs.length) throw new Error('No valid questions found. Check sheet column format.');
        return qs;
    }

    static _csvRows(csv) {
        const rows = [];
        let row = [], f = '', inQ = false;
        for (let i = 0; i < csv.length; i++) {
            const c = csv[i], n = csv[i + 1];
            if (inQ) {
                if (c === '"' && n === '"') { f += '"'; i++; }
                else if (c === '"') inQ = false;
                else f += c;
            } else {
                if (c === '"') inQ = true;
                else if (c === ',') { row.push(f); f = ''; }
                else if (c === '\n' || (c === '\r' && n === '\n')) {
                    row.push(f); rows.push(row); row = []; f = '';
                    if (c === '\r') i++;
                } else if (c === '\r') { row.push(f); rows.push(row); row = []; f = ''; }
                else f += c;
            }
        }
        if (f || row.length) { row.push(f); rows.push(row); }
        return rows;
    }
}

class MindLuster {
    constructor() {
        this.db = new MindDB('MindLusterDB', 1);
        this.quizMap = new HashMap();
        this.bmSet = new HashMap();
        this.resultPQ = new PriorityQueue((a, b) => b.pct - a.pct);
        this.allResults = [];
        this.session = null;
        this.lastResult = null;
        this.theme = localStorage.getItem('ml_theme') || 'light';
        this._cfAction = null;
        this._init();
    }

    async _init() {
        await this.db.open();
        await this._loadBookmarks();
        await this._loadResults();
        await this._loadSheets();
        this._applyTheme();
        this._bind();
        this._renderQuizzes();
        this._updateBmBadge();
    }

    async _loadBookmarks() {
        const bms = await this.db.getAll('bookmarks');
        bms.forEach(b => {
            const qs = b.questions.map(q => new Question(q.id, q.text, q.options, q.correctIndex, q.category));
            const qd = new QuizData(b.id, b.title, qs, b.timeSec, b.icon);
            qd.sheetId = b.sheetId || '';
            qd.sheetTab = b.sheetTab || '';
            qd.createdAt = b.createdAt || Date.now();
            this.bmSet.set(b.id, qd);
        });
    }

    async _loadResults() {
        const rs = await this.db.getAll('results');
        rs.forEach(r => {
            this.allResults.push(r);
            this.resultPQ.push(r);
        });
    }

    async _loadSheets() {
        const sheets = await this.db.getAll('sheets');
        sheets.forEach(s => {
            const qs = s.questions.map(q => new Question(q.id, q.text, q.options, q.correctIndex, q.category));
            const qd = new QuizData(s.id, s.title, qs, s.timeSec, s.icon);
            qd.sheetId = s.sheetId || '';
            qd.sheetTab = s.sheetTab || '';
            qd.createdAt = s.createdAt || Date.now();
            this.quizMap.set(s.id, qd);
        });
    }

    _applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
    }

    _bind() {
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.theme = this.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem('ml_theme', this.theme);
            this._applyTheme();
        });

        document.querySelectorAll('.tab').forEach(t => {
            t.addEventListener('click', () => this._switchTab(t.dataset.tab));
        });

        document.getElementById('btnAddSheet').addEventListener('click', () => this._openModal('sheetModal'));

        document.querySelector('#sheetModal .modal-close').addEventListener('click', () => this._closeModal('sheetModal'));
        document.getElementById('sheetModal').addEventListener('click', e => { if (e.target.id === 'sheetModal') this._closeModal('sheetModal'); });

        document.getElementById('sheetForm').addEventListener('submit', e => this._onSheetSubmit(e));

        document.getElementById('btnPrev').addEventListener('click', () => this._navPrev());
        document.getElementById('btnNext').addEventListener('click', () => this._navNext());
        document.getElementById('btnSubmit').addEventListener('click', () => this._askSubmit());
        document.getElementById('btnQuit').addEventListener('click', () => this._askQuit());

        document.getElementById('btnSaveResult').addEventListener('click', () => this._saveResult());
        document.getElementById('btnRetake').addEventListener('click', () => this._retake());
        document.getElementById('btnHome').addEventListener('click', () => this._goHome());

        document.getElementById('btnClearResults').addEventListener('click', () => {
            this._confirm('Clear Results', 'Delete all saved results?', () => this._clearResults());
        });

        document.getElementById('cfYes').addEventListener('click', () => {
            this._closeModal('confirmModal');
            if (this._cfAction) this._cfAction();
        });
        document.getElementById('cfNo').addEventListener('click', () => this._closeModal('confirmModal'));
    }

    _switchTab(name) {
        if (this.session && this.session.alive) {
            this._askQuit(() => this._doSwitch(name));
            return;
        }
        this._doSwitch(name);
    }

    _doSwitch(name) {
        document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        const el = document.getElementById('sec-' + name);
        if (el) el.classList.add('active');

        if (name === 'bookmarks') this._renderBookmarks();
        if (name === 'results') this._renderResults();
        if (name === 'quizzes') this._renderQuizzes();
    }

    _showSection(id) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    }

    _openModal(id) { document.getElementById(id).classList.add('open'); }
    _closeModal(id) { document.getElementById(id).classList.remove('open'); }

    _confirm(title, msg, fn) {
        document.getElementById('cfTitle').textContent = title;
        document.getElementById('cfMsg').textContent = msg;
        this._cfAction = fn;
        this._openModal('confirmModal');
    }

    _renderQuizzes() {
        const grid = document.getElementById('quizGrid');
        const empty = document.getElementById('quizEmpty');
        const quizzes = this.quizMap.values().sort((a, b) => b.createdAt - a.createdAt);

        if (!quizzes.length) {
            grid.innerHTML = '';
            empty.classList.remove('hidden');
            return;
        }

        empty.classList.add('hidden');
        grid.innerHTML = quizzes.map(q => {
            const isBm = this.bmSet.has(q.id);
            return `<div class="qcard">
                <span class="qcard-tag">${this._topCat(q)}</span>
                <span class="qcard-emoji">${q.icon}</span>
                <h3>${this._esc(q.title)}</h3>
                <div class="qcard-meta">
                    <span>📋 ${q.questions.length} Qs</span>
                    <span>⏱ ${Math.ceil(q.timeSec / 60)} min</span>
                </div>
                <div class="qcard-btns">
                    <button class="qbtn-start" data-start="${q.id}">▶ Start</button>
                    <button class="qbtn-bm ${isBm ? 'is-bm' : ''}" data-bm="${q.id}">${isBm ? '★' : '☆'}</button>
                    <button class="qbtn-del" data-del="${q.id}">🗑</button>
                </div>
            </div>`;
        }).join('');

        grid.querySelectorAll('[data-start]').forEach(b => b.addEventListener('click', () => this._startQuiz(b.dataset.start)));
        grid.querySelectorAll('[data-bm]').forEach(b => b.addEventListener('click', () => this._toggleBookmark(b.dataset.bm)));
        grid.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
            this._confirm('Delete Quiz', 'Remove this quiz?', () => this._deleteQuiz(b.dataset.del));
        }));
    }

    _topCat(q) {
        const freq = {};
        q.questions.forEach(x => { freq[x.category] = (freq[x.category] || 0) + 1; });
        let top = 'General', mx = 0;
        Object.entries(freq).forEach(([k, v]) => { if (v > mx) { mx = v; top = k; } });
        return top;
    }

    _esc(s) {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    async _toggleBookmark(qid) {
        const quiz = this.quizMap.get(qid);
        if (!quiz) return;

        if (this.bmSet.has(qid)) {
            this.bmSet.delete(qid);
            await this.db.del('bookmarks', qid);
        } else {
            this.bmSet.set(qid, quiz);
            await this.db.put('bookmarks', {
                id: quiz.id, title: quiz.title, icon: quiz.icon,
                timeSec: quiz.timeSec, sheetId: quiz.sheetId, sheetTab: quiz.sheetTab,
                createdAt: quiz.createdAt,
                questions: quiz.questions.map(q => ({ id: q.id, text: q.text, options: q.options, correctIndex: q.correctIndex, category: q.category }))
            });
        }
        this._updateBmBadge();
        this._renderQuizzes();
    }

    async _deleteQuiz(qid) {
        this.quizMap.delete(qid);
        await this.db.del('sheets', qid);
        this._renderQuizzes();
    }

    _updateBmBadge() {
        const badge = document.getElementById('bmBadge');
        const c = this.bmSet.count;
        badge.textContent = c;
        badge.classList.toggle('hidden', c === 0);
    }

    _renderBookmarks() {
        const list = document.getElementById('bmList');
        const empty = document.getElementById('bmEmpty');
        const bms = this.bmSet.values().sort((a, b) => b.createdAt - a.createdAt);

        if (!bms.length) {
            list.innerHTML = '';
            empty.classList.remove('hidden');
            return;
        }

        empty.classList.add('hidden');
        list.innerHTML = bms.map(q => `<div class="bm-card">
            <span class="bm-emoji">${q.icon}</span>
            <div class="bm-info">
                <h4>${this._esc(q.title)}</h4>
                <div class="bm-info-meta">
                    <span>📋 ${q.questions.length} Qs</span>
                    <span>⏱ ${Math.ceil(q.timeSec / 60)} min</span>
                    <span>📂 ${this._topCat(q)}</span>
                </div>
            </div>
            <div class="bm-actions">
                <button class="qbtn-start" data-bmstart="${q.id}">▶ Start</button>
                <button class="qbtn-del" data-bmdel="${q.id}">✕</button>
            </div>
        </div>`).join('');

        list.querySelectorAll('[data-bmstart]').forEach(b => b.addEventListener('click', () => this._startFromBookmark(b.dataset.bmstart)));
        list.querySelectorAll('[data-bmdel]').forEach(b => b.addEventListener('click', () => this._removeBookmark(b.dataset.bmdel)));
    }

    _startFromBookmark(id) {
        const q = this.bmSet.get(id);
        if (!q) return;
        if (!this.quizMap.has(id)) this.quizMap.set(id, q);
        this._startQuiz(id);
    }

    async _removeBookmark(id) {
        this.bmSet.delete(id);
        await this.db.del('bookmarks', id);
        this._updateBmBadge();
        this._renderBookmarks();
    }

    _renderResults() {
        const listEl = document.getElementById('resultList');
        const emptyEl = document.getElementById('resEmpty');
        const statsEl = document.getElementById('statsRow');
        const clearBtn = document.getElementById('btnClearResults');

        if (!this.allResults.length) {
            listEl.innerHTML = '';
            emptyEl.classList.remove('hidden');
            statsEl.classList.add('hidden');
            clearBtn.classList.add('hidden');
            return;
        }

        emptyEl.classList.add('hidden');
        statsEl.classList.remove('hidden');
        clearBtn.classList.remove('hidden');

        const tot = this.allResults.length;
        const avg = Math.round(this.allResults.reduce((s, r) => s + r.pct, 0) / tot);
        const best = Math.max(...this.allResults.map(r => r.pct));
        const tq = this.allResults.reduce((s, r) => s + r.total, 0);
        const tc = this.allResults.reduce((s, r) => s + r.score, 0);

        statsEl.innerHTML = `
            <div class="stat-box"><b>${tot}</b><small>Quizzes</small></div>
            <div class="stat-box"><b>${avg}%</b><small>Average</small></div>
            <div class="stat-box"><b>${best}%</b><small>Best</small></div>
            <div class="stat-box"><b>${Math.round((tc / tq) * 100)}%</b><small>Accuracy</small></div>
            <div class="stat-box"><b>${tq}</b><small>Questions</small></div>
            <div class="stat-box"><b>${tc}</b><small>Correct</small></div>
        `;

        const sorted = [...this.allResults].reverse();
        listEl.innerHTML = sorted.map(r => {
            const g = r.pct >= 80 ? 'rg' : r.pct >= 60 ? 'ra' : r.pct >= 40 ? 'rw' : 'rb';
            const d = new Date(r.date);
            const ds = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const mm = Math.floor(r.elapsed / 60), ss = r.elapsed % 60;
            return `<div class="res-item">
                <div class="res-badge ${g}">${r.pct}%</div>
                <div class="res-info">
                    <h4>${this._esc(r.quizTitle)}</h4>
                    <div class="res-meta">
                        <span>✓ ${r.score}/${r.total}</span>
                        <span>⏱ ${mm}m${ss}s</span>
                        <span>📅 ${ds}</span>
                    </div>
                </div>
                <button class="res-del" data-rdel="${r.id}">✕</button>
            </div>`;
        }).join('');

        listEl.querySelectorAll('[data-rdel]').forEach(b => b.addEventListener('click', () => this._deleteResult(b.dataset.rdel)));
    }

    async _deleteResult(id) {
        this.allResults = this.allResults.filter(r => r.id !== id);
        this.resultPQ = new PriorityQueue((a, b) => b.pct - a.pct);
        this.allResults.forEach(r => this.resultPQ.push(r));
        await this.db.del('results', id);
        this._renderResults();
    }

    async _clearResults() {
        this.allResults = [];
        this.resultPQ = new PriorityQueue((a, b) => b.pct - a.pct);
        await this.db.clear('results');
        this._renderResults();
    }

    async _onSheetSubmit(e) {
        e.preventDefault();
        const title = document.getElementById('fTitle').value.trim();
        const sheetInput = document.getElementById('fSheet').value.trim();
        const tab = document.getElementById('fTab').value.trim();
        const count = parseInt(document.getElementById('fCount').value) || 10;
        const mins = parseInt(document.getElementById('fTime').value) || 10;
        const shuffle = document.getElementById('fShuffle').checked;

        if (!title || !sheetInput) return;

        const msg = document.getElementById('loadMsg');
        const btn = document.getElementById('btnLoad');
        msg.className = 'load-msg info';
        msg.innerHTML = '<div class="spin"></div> Loading from Google Sheets...';
        msg.classList.remove('hidden');
        btn.disabled = true;

        try {
            const csv = await SheetParser.fetch(sheetInput, tab);
            let questions = SheetParser.parse(csv);

            if (shuffle) questions = QuizData.shuffle(questions);
            const selected = questions.slice(0, Math.min(count, questions.length));

            const icons = ['📝', '📚', '🧠', '💡', '🎯', '⚡', '🔬', '🌟', '📖', '🎓'];
            const icon = icons[Math.floor(Math.random() * icons.length)];

            const qid = 'sh_' + Date.now();
            const qd = new QuizData(qid, title, selected, mins * 60, icon);
            qd.sheetId = SheetParser.extractId(sheetInput) || '';
            qd.sheetTab = tab;
            qd.questions = questions;

            this.quizMap.set(qid, qd);

            await this.db.put('sheets', {
                id: qd.id, title: qd.title, icon: qd.icon,
                timeSec: qd.timeSec, sheetId: qd.sheetId, sheetTab: qd.sheetTab,
                createdAt: qd.createdAt,
                questions: qd.questions.map(q => ({ id: q.id, text: q.text, options: q.options, correctIndex: q.correctIndex, category: q.category }))
            });

            msg.className = 'load-msg ok';
            msg.textContent = `Loaded ${questions.length} questions! Using ${selected.length} for this quiz.`;

            setTimeout(() => {
                this._closeModal('sheetModal');
                document.getElementById('sheetForm').reset();
                msg.classList.add('hidden');
                btn.disabled = false;
                this._renderQuizzes();
            }, 1000);
        } catch (err) {
            msg.className = 'load-msg err';
            msg.textContent = err.message;
            msg.classList.remove('hidden');
            btn.disabled = false;
        }
    }

    _startQuiz(qid) {
        const quiz = this.quizMap.get(qid) || this.bmSet.get(qid);
        if (!quiz) return;

        if (this.session && this.session.timer) clearInterval(this.session.timer);

        const questions = quiz.pick(quiz.questions.length, true);
        this.session = new Session(quiz, questions);
        this._showSection('sec-quiz');
        document.getElementById('qzTitle').textContent = quiz.title;
        this._buildDots();
        this._renderQ();
        this._startTimer();
    }

    _startTimer() {
        this._tickTimer();
        this.session.timer = setInterval(() => {
            if (!this.session || !this.session.alive) return;
            this.session.timeLeft--;
            this._tickTimer();
            const el = document.getElementById('qzTimer');
            el.classList.toggle('danger', this.session.timeLeft <= 60);
            if (this.session.timeLeft <= 0) {
                clearInterval(this.session.timer);
                this._submitQuiz();
            }
        }, 1000);
    }

    _tickTimer() {
        const t = Math.max(0, this.session.timeLeft);
        const m = String(Math.floor(t / 60)).padStart(2, '0');
        const s = String(t % 60).padStart(2, '0');
        document.getElementById('qzTimer').textContent = m + ':' + s;
    }

    _buildDots() {
        const wrap = document.getElementById('dotWrap');
        wrap.innerHTML = this.session.questions.map((_, i) =>
            `<span class="dot" data-di="${i}">${i + 1}</span>`
        ).join('');
        wrap.querySelectorAll('.dot').forEach(d => d.addEventListener('click', () => this._jumpTo(parseInt(d.dataset.di))));
    }

    _renderQ() {
        const s = this.session;
        const q = s.cur();
        const i = s.idx;
        const n = s.questions.length;
        const sel = s.picked(q.id);

        document.getElementById('qNum').textContent = 'Q' + (i + 1);
        document.getElementById('qCat').textContent = q.category;
        document.getElementById('qText').textContent = q.text;
        document.getElementById('qzProgress').textContent = `${i + 1} of ${n}  •  ${s.nAnswered} answered`;
        document.getElementById('progFill').style.width = ((i + 1) / n * 100) + '%';

        const ltrs = ['A', 'B', 'C', 'D'];
        document.getElementById('qOpts').innerHTML = q.options.map((o, oi) =>
            `<button class="opt-btn ${sel === oi ? 'picked' : ''}" data-oi="${oi}">
                <span class="opt-ltr">${ltrs[oi]}</span>
                <span class="opt-txt">${this._esc(o)}</span>
            </button>`
        ).join('');

        document.getElementById('qOpts').querySelectorAll('.opt-btn').forEach(b =>
            b.addEventListener('click', () => this._pickOpt(parseInt(b.dataset.oi)))
        );

        document.getElementById('btnPrev').disabled = s.isFirst;

        if (s.isLast) {
            document.getElementById('btnNext').classList.add('hidden');
            document.getElementById('btnSubmit').classList.remove('hidden');
        } else {
            document.getElementById('btnNext').classList.remove('hidden');
            document.getElementById('btnSubmit').classList.add('hidden');
        }

        this._syncDots();
    }

    _syncDots() {
        document.querySelectorAll('.dot').forEach((d, i) => {
            d.classList.remove('now', 'done');
            if (i === this.session.idx) d.classList.add('now');
            else if (this.session.answers.has(this.session.questions[i].id)) d.classList.add('done');
        });
    }

    _pickOpt(oi) {
        this.session.pick(this.session.cur().id, oi);
        this._renderQ();
    }

    _navNext() { if (this.session.next()) this._renderQ(); }
    _navPrev() { if (this.session.prev()) this._renderQ(); }
    _jumpTo(i) { if (this.session.go(i)) this._renderQ(); }

    _askSubmit() {
        const un = this.session.questions.length - this.session.nAnswered;
        const msg = un > 0 ? `You have ${un} unanswered question(s). Submit anyway?` : 'Submit your answers?';
        this._confirm('Submit Quiz', msg, () => this._submitQuiz());
    }

    _askQuit(cb) {
        this._confirm('Leave Quiz', 'Your progress will be lost. Leave?', () => {
            if (this.session && this.session.timer) clearInterval(this.session.timer);
            this.session = null;
            document.getElementById('qzTimer').classList.remove('danger');
            if (cb) cb();
            else this._doSwitch('quizzes');
        });
    }

    _submitQuiz() {
        const result = this.session.finish();
        this.lastResult = result;
        this._showSection('sec-result-view');
        this._renderResultView(result);
    }

    _renderResultView(r) {
        const circ = 2 * Math.PI * 50;
        const off = circ - (r.pct / 100) * circ;
        const arc = document.getElementById('rvArc');
        arc.style.strokeDasharray = circ;
        arc.style.strokeDashoffset = circ;
        arc.className = 'rv-arc';

        let gc = r.pct >= 80 ? 's-great' : r.pct >= 60 ? 's-good' : r.pct >= 40 ? 's-ok' : 's-bad';
        requestAnimationFrame(() => {
            arc.classList.add(gc);
            arc.style.strokeDashoffset = off;
        });

        document.getElementById('rvPct').textContent = r.pct + '%';

        const skip = r.detail.filter(d => d.ua === -1).length;
        const wrong = r.total - r.score - skip;
        const mm = Math.floor(r.elapsed / 60), ss = r.elapsed % 60;

        document.getElementById('rvStats').innerHTML = `
            <div class="rv-stat"><b class="g">${r.score}</b><small>Correct</small></div>
            <div class="rv-stat"><b class="r">${wrong}</b><small>Wrong</small></div>
            <div class="rv-stat"><b class="m">${skip}</b><small>Skipped</small></div>
            <div class="rv-stat"><b>${mm}m ${ss}s</b><small>Time</small></div>
        `;

        const ltrs = ['A', 'B', 'C', 'D'];
        document.getElementById('rvReview').innerHTML = r.detail.map((d, i) => {
            const ic = d.ua === -1 ? 'ic-s' : d.ok ? 'ic-g' : 'ic-r';
            const sym = d.ua === -1 ? '—' : d.ok ? '✓' : '✗';
            return `<div class="rr-item">
                <div class="rr-head">
                    <span class="rr-icon ${ic}">${sym}</span>
                    <span class="rr-q">Q${i + 1}. ${this._esc(d.text)}</span>
                </div>
                <div class="rr-opts">${d.options.map((o, oi) => {
                    let cls = '';
                    if (oi === d.ci) cls = 'is-right';
                    else if (oi === d.ua && !d.ok) cls = 'is-wrong';
                    return `<div class="rr-o ${cls}">${ltrs[oi]}. ${this._esc(o)}</div>`;
                }).join('')}</div>
            </div>`;
        }).join('');

        const saveBtn = document.getElementById('btnSaveResult');
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Save Result';
    }

    async _saveResult() {
        if (!this.lastResult) return;
        const btn = document.getElementById('btnSaveResult');
        this.allResults.push(this.lastResult);
        this.resultPQ.push(this.lastResult);
        await this.db.put('results', this.lastResult);
        btn.textContent = '✅ Saved!';
        btn.disabled = true;
    }

    _retake() {
        if (this.session) this._startQuiz(this.session.quiz.id);
    }

    _goHome() {
        this.session = null;
        document.getElementById('qzTimer').classList.remove('danger');
        this._doSwitch('quizzes');
    }
}

const app = new MindLuster();
