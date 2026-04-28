// =============================================
// 선생님 명언 모음
// =============================================

const TEACHER_QUOTES = [];

const CATEGORY_COLORS = {
    '학습': '#1428A0',
    '자기계발': '#7c3aed',
    '창의': '#db2777',
    '실천': '#059669',
    '교육': '#0891b2',
    '용기': '#dc2626',
    '겸손': '#92400e',
    '노력': '#b45309',
    '꿈': '#6d28d9',
    '호기심': '#0284c7',
    '끈기': '#047857',
    '지식': '#1d4ed8',
    '성장': '#be185d',
};

let _quoteRandomIdx = -1;

function renderQuotes() {
    return `
    <style>
        .quotes-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }
        .quote-card { background:var(--card); border:1px solid var(--border); border-radius:14px; padding:22px; display:flex; flex-direction:column; gap:12px; transition:transform 0.15s,box-shadow 0.15s; }
        .quote-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.08); }
        .quote-emoji { font-size:2rem; line-height:1; }
        .quote-text { font-size:0.92rem; line-height:1.7; color:var(--text); font-weight:500; flex:1; }
        .quote-author { font-size:0.78rem; color:var(--text-muted); font-weight:600; }
        .quote-category { display:inline-block; font-size:0.7rem; font-weight:700; padding:2px 8px; border-radius:999px; }
        .quote-random-box { background:var(--card); border:2px solid var(--primary); border-radius:16px; padding:28px 24px; text-align:center; margin-bottom:28px; }
        .quote-random-text { font-size:1.05rem; line-height:1.75; font-weight:600; color:var(--text); margin:12px 0; }
        .quote-random-author { font-size:0.85rem; color:var(--text-muted); font-weight:600; }
        @media(max-width:480px) { .quotes-grid { grid-template-columns:1fr; } }
    </style>
    <div class="page">
        <div class="page-header header-white">
            <h2>💬 선생님 명언 모음</h2>
            <p style="margin-top:8px;color:var(--text-muted);font-size:0.9rem">배움과 성장을 위한 소중한 말씀들</p>
        </div>
        <div class="container" style="max-width:900px;margin:0 auto;padding:0 20px 80px">
            <div style="text-align:center;margin:24px 0 20px">
                <button class="btn btn-outline" onclick="showRandomQuote()" style="font-size:1rem;padding:12px 28px">🎲 랜덤 명언 뽑기</button>
            </div>

            <div id="quoteRandomBox" style="display:none" class="quote-random-box">
                <div class="quote-emoji" id="quoteRandomEmoji"></div>
                <p class="quote-random-text" id="quoteRandomText"></p>
                <p class="quote-random-author" id="quoteRandomAuthor"></p>
            </div>

            <div class="quotes-grid">
                ${TEACHER_QUOTES.map((q, i) => _renderQuoteCard(q, i)).join('')}
            </div>
        </div>
    </div>`;
}

function _renderQuoteCard(q, idx) {
    const color = CATEGORY_COLORS[q.category] || '#1428A0';
    return `
    <div class="quote-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <span class="quote-emoji">${q.emoji}</span>
            <span class="quote-category" style="background:${color}15;color:${color}">${q.category}</span>
        </div>
        <p class="quote-text">"${escapeHtml(q.text)}"</p>
        <p class="quote-author">— ${escapeHtml(q.author)}</p>
    </div>`;
}

function showRandomQuote() {
    let idx;
    do { idx = Math.floor(Math.random() * TEACHER_QUOTES.length); }
    while (idx === _quoteRandomIdx && TEACHER_QUOTES.length > 1);
    _quoteRandomIdx = idx;

    const q = TEACHER_QUOTES[idx];
    const box = document.getElementById('quoteRandomBox');
    if (!box) return;

    document.getElementById('quoteRandomEmoji').textContent = q.emoji;
    document.getElementById('quoteRandomText').textContent = `"${q.text}"`;
    document.getElementById('quoteRandomAuthor').textContent = `— ${q.author}`;

    box.style.display = 'block';
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
