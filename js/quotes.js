// =============================================
// 선생님 명언 모음
// =============================================

const TEACHER_QUOTES = [
    { emoji: '📚', text: '배우고 때때로 익히면 또한 기쁘지 아니한가?', author: '공자 (孔子)', category: '학습' },
    { emoji: '🌱', text: '배우기만 하고 생각하지 않으면 헛되고, 생각하기만 하고 배우지 않으면 위태롭다.', author: '공자 (孔子)', category: '학습' },
    { emoji: '🔍', text: '너 자신을 알라.', author: '소크라테스 (Socrates)', category: '자기계발' },
    { emoji: '✨', text: '상상력이 지식보다 더 중요하다. 지식은 한계가 있지만, 상상력은 세계를 품는다.', author: '알베르트 아인슈타인', category: '창의' },
    { emoji: '🏃', text: '아는 것으로는 충분하지 않다. 응용해야 한다. 의지하는 것으로는 충분하지 않다. 실행해야 한다.', author: '요한 볼프강 폰 괴테', category: '실천' },
    { emoji: '🌟', text: '교육의 목적은 올바른 것을 좋아하도록 가르치는 것이다.', author: '플라톤 (Plato)', category: '교육' },
    { emoji: '💪', text: '삶에서 무서운 것은 아무것도 없다. 다만 이해해야 할 것들이 있을 뿐이다.', author: '마리 퀴리 (Marie Curie)', category: '용기' },
    { emoji: '🎯', text: '성공은 최종 목적지가 아니며, 실패는 치명적인 것이 아니다. 계속하려는 용기가 중요하다.', author: '윈스턴 처칠', category: '용기' },
    { emoji: '🎓', text: '교육은 세상에서 가장 강력한 무기다. 세상을 바꾸는 데 쓸 수 있다.', author: '넬슨 만델라', category: '교육' },
    { emoji: '🌊', text: '물이 낮은 곳으로 흘러가듯, 지혜는 낮은 마음에 쌓인다.', author: '노자 (老子)', category: '겸손' },
    { emoji: '🔥', text: '천재는 99%의 노력과 1%의 영감으로 이루어진다.', author: '토마스 에디슨', category: '노력' },
    { emoji: '🌙', text: '실수란 경험의 다른 이름이다.', author: '오스카 와일드', category: '성장' },
    { emoji: '🚀', text: '꿈을 크게 가져라. 그래야 실현될 가능성도 크다.', author: '노먼 빈센트 필', category: '꿈' },
    { emoji: '🌸', text: '천 리 길도 한 걸음부터.', author: '노자 (老子)', category: '실천' },
    { emoji: '💡', text: '가장 중요한 것은 끊임없이 질문하는 것이다.', author: '알베르트 아인슈타인', category: '호기심' },
    { emoji: '🦁', text: '용기란 두려움이 없는 것이 아니라, 두려움보다 더 중요한 것이 있다고 판단하는 것이다.', author: '넬슨 만델라', category: '용기' },
    { emoji: '🌍', text: '내가 더 멀리 볼 수 있었던 건, 거인들의 어깨 위에 서 있었기 때문이다.', author: '아이작 뉴턴', category: '겸손' },
    { emoji: '⚡', text: '성공한 사람들은 다른 사람들이 포기할 때도 계속한다.', author: '컨래드 힐튼', category: '끈기' },
    { emoji: '🌹', text: '배움은 어떤 보물보다 값지다.', author: '이솝 (Aesop)', category: '학습' },
    { emoji: '💭', text: '우리가 알고 있는 것은 한 방울의 물이요, 모르는 것은 바다다.', author: '아이작 뉴턴', category: '겸손' },
    { emoji: '🎵', text: '지식은 힘이다.', author: '프랜시스 베이컨', category: '지식' },
    { emoji: '⭐', text: '지금 하지 않으면 언제 하겠는가?', author: '히포크라테스', category: '실천' },
    { emoji: '🌻', text: '오늘 배운 것이 내일의 나를 만든다.', author: '은가람 중학교 선생님', category: '학습' },
    { emoji: '🏅', text: '포기하지 마라. 위대한 것들은 시간이 걸린다.', author: '은가람 중학교 선생님', category: '끈기' },
    { emoji: '🌈', text: '틀려도 괜찮다. 틀리면서 배우는 것이다.', author: '은가람 중학교 선생님', category: '성장' },
];

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
                <button class="btn btn-primary" onclick="showRandomQuote()" style="font-size:1rem;padding:12px 28px">🎲 랜덤 명언 뽑기</button>
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
