// =============================================
// 미니게임 모음
// =============================================

const GAMES = [
    { name: '가위바위보', emoji: '✌️', desc: '컴퓨터와 가위바위보' },
    { name: '주사위', emoji: '🎲', desc: '주사위를 굴려보세요' },
    { name: '동전', emoji: '🪙', desc: '동전 앞뒤 맞추기' },
    { name: '이름 궁합', emoji: '💕', desc: '두 이름의 궁합' },
    { name: '반응속도', emoji: '⚡', desc: '반응 속도 측정' }
];

let _currentGame = null;

function renderGames() {
    let cardsHtml = GAMES.map((game, idx) => `
    <div onclick="startGame(${idx})" style="cursor:pointer;background:var(--card);border-radius:8px;padding:20px;text-align:center;border:2px solid transparent;transition:all 0.2s" onmouseover="this.style.borderColor='var(--primary)';this.style.transform='translateY(-4px)'" onmouseout="this.style.borderColor='transparent';this.style.transform='translateY(0)'">
        <div style="font-size:2.5rem;margin-bottom:10px">${game.emoji}</div>
        <h3 style="margin:10px 0;font-size:1rem">${game.name}</h3>
        <p style="font-size:0.85rem;color:var(--text-muted);margin:0">${game.desc}</p>
    </div>
    `).join('');

    return `
    <div class="page">
        <div class="page-header">
            <h2>🎮 미니게임</h2>
            <p>즐거운 게임을 즐겨보세요!</p>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:15px;padding:20px 0">
            ${cardsHtml}
        </div>
    </div>`;
}

function startGame(idx) {
    _currentGame = idx;
    const renderers = [
        renderGameRPS,
        renderGameDice,
        renderGameCoin,
        renderGameNameCompat,
        renderGameReaction
    ];
    document.getElementById('app').innerHTML = renderers[idx]();
}

function backToGames() {
    navigate('games');
}

// =================== 28. 가위바위보 ===================
function renderGameRPS() {
    const choices = ['바위', '보', '가위'];
    const emojis = ['✊', '✋', '✌️'];
    const stats = JSON.parse(localStorage.getItem('rpsStats') || '{"win":0,"loss":0,"draw":0}');

    return `
    <div class="page">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <h2>✌️ 가위바위보</h2>
            <button onclick="backToGames()" style="padding:8px 16px;background:var(--border);border:none;border-radius:4px;cursor:pointer">돌아가기</button>
        </div>
        <div style="background:var(--card);border-radius:8px;padding:20px;margin-bottom:20px;text-align:center">
            <p style="color:var(--text-muted);margin-bottom:15px">당신의 선택:</p>
            <div style="display:flex;gap:10px;justify-content:center;margin-bottom:20px" id="rpsChoices">
                ${['바위', '보', '가위'].map((c, i) => `<button onclick="playRPS(${i})" style="font-size:3rem;background:none;border:2px solid var(--border);border-radius:50%;width:80px;height:80px;cursor:pointer">${emojis[i]}</button>`).join('')}
            </div>
            <div id="rpsResult" style="min-height:40px;font-size:1.2rem;font-weight:bold;color:var(--primary)"></div>
        </div>
        <div style="background:var(--card);border-radius:8px;padding:20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;text-align:center">
            <div><strong>${stats.win}</strong><p style="color:var(--text-muted);margin:5px 0">승</p></div>
            <div><strong>${stats.loss}</strong><p style="color:var(--text-muted);margin:5px 0">패</p></div>
            <div><strong>${stats.draw}</strong><p style="color:var(--text-muted);margin:5px 0">무</p></div>
        </div>
    </div>`;
}

function playRPS(userChoice) {
    const choices = ['바위', '보', '가위'];
    const emojis = ['✊', '✋', '✌️'];
    const computerChoice = Math.floor(Math.random() * 3);
    const user = choices[userChoice];
    const computer = choices[computerChoice];
    let result = '';
    let status = '';

    if (userChoice === computerChoice) {
        result = '무승부! 👔';
        status = 'draw';
    } else if (
        (userChoice === 0 && computerChoice === 2) ||
        (userChoice === 1 && computerChoice === 0) ||
        (userChoice === 2 && computerChoice === 1)
    ) {
        result = '이겼어요! 🎉';
        status = 'win';
    } else {
        result = '졌어요... 😅';
        status = 'loss';
    }

    const stats = JSON.parse(localStorage.getItem('rpsStats') || '{"win":0,"loss":0,"draw":0}');
    stats[status]++;
    localStorage.setItem('rpsStats', JSON.stringify(stats));

    const resultDiv = document.getElementById('rpsResult');
    resultDiv.innerHTML = `당신: ${emojis[userChoice]} / 컴퓨터: ${emojis[computerChoice]}<br>${result}`;
    resultDiv.style.color = status === 'win' ? '#22c55e' : status === 'loss' ? '#ef4444' : '#3b82f6';
}

// =================== 29. 주사위 ===================
function renderGameDice() {
    return `
    <div class="page">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <h2>🎲 주사위</h2>
            <button onclick="backToGames()" style="padding:8px 16px;background:var(--border);border:none;border-radius:4px;cursor:pointer">돌아가기</button>
        </div>
        <div style="background:var(--card);border-radius:8px;padding:40px;text-align:center">
            <div id="diceResult" style="font-size:4rem;margin-bottom:20px;min-height:80px;display:flex;align-items:center;justify-content:center">🎲</div>
            <button onclick="rollDice()" style="padding:15px 30px;background:var(--primary);color:white;border:none;border-radius:6px;cursor:pointer;font-size:1.1rem;font-weight:bold">주사위 굴리기</button>
        </div>
    </div>`;
}

function rollDice() {
    const resultDiv = document.getElementById('diceResult');
    const numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];
    let current = 0;
    const interval = setInterval(() => {
        resultDiv.textContent = numbers[Math.floor(Math.random() * 6)];
        current++;
        if (current >= 20) {
            clearInterval(interval);
            const result = Math.floor(Math.random() * 6) + 1;
            resultDiv.textContent = numbers[result - 1];
        }
    }, 50);
}

// =================== 30. 동전 ===================
function renderGameCoin() {
    return `
    <div class="page">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <h2>🪙 동전</h2>
            <button onclick="backToGames()" style="padding:8px 16px;background:var(--border);border:none;border-radius:4px;cursor:pointer">돌아가기</button>
        </div>
        <div style="background:var(--card);border-radius:8px;padding:40px;text-align:center">
            <div id="coinResult" style="font-size:5rem;margin-bottom:20px;min-height:100px;display:flex;align-items:center;justify-content:center;perspective:1000px">🪙</div>
            <p id="coinText" style="color:var(--text-muted);margin-bottom:20px;min-height:30px">동전을 던져보세요</p>
            <button onclick="flipCoin()" style="padding:15px 30px;background:var(--primary);color:white;border:none;border-radius:6px;cursor:pointer;font-size:1.1rem;font-weight:bold">동전 던지기</button>
        </div>
    </div>`;
}

function flipCoin() {
    const coinDiv = document.getElementById('coinResult');
    const textDiv = document.getElementById('coinText');
    coinDiv.style.transition = 'none';
    let rotations = 0;
    const interval = setInterval(() => {
        coinDiv.style.transform = `rotateY(${rotations * 20}deg)`;
        rotations++;
        if (rotations >= 40) {
            clearInterval(interval);
            const result = Math.random() < 0.5;
            coinDiv.textContent = result ? '🪙 앞' : '🪙 뒤';
            textDiv.textContent = result ? '앞이 나왔어요!' : '뒤가 나왔어요!';
            coinDiv.style.transition = 'transform 0.3s';
        }
    }, 30);
}

// =================== 31. 끝말잇기 ===================
// const KOREAN_WORDS = ['사과','포도','도시','시간','간식','신발','발전','전기','기차','차이','이름','음악','악수','수박','박물관','관광','광장','장난','난처','처음','초원','원래','래프팅','팅팅이','이야기','기억','억울','울타리','리더십','십자가','가지','지우개','개구리','리소스','스포츠','츠쿠모','모기','기와','와인','인사','사랑','랑데뷰','뷰포인트','트럼펫','펫샵','샵','품질','질문','문제','제목','목표','표준','준비','비행','행운','운동','동작','작품','품평','평가','가치','치약','약국','국가','가족','족속','속옷','옷걸이','이상','상황','황금','금메달','달콤','콤팩트','트렌드','드라마','마라톤','톤마스','스마일','일상','상자','자동','동물','물질','질서','서울','울음','음식','식탁','탁구','구름','름뻥','뻥튀기','기분','분홍','홍콩','공항','항공','공부','부산','산악','악의','의자','자리','리모콘','콘서트','트롤','롤케이크','이득','득점','점수','수학','학교','교실','실패','패배','배경','경기','기술','술마시','시술','술'];

/*
function renderGameWordChain() {
    const lastWord = window._wordChainLastWord || '';
    const history = JSON.parse(localStorage.getItem('wordChainHistory') || '[]');

    return `
    <div class="page">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <h2>🔤 끝말잇기</h2>
            <button onclick="backToGames()" style="padding:8px 16px;background:var(--border);border:none;border-radius:4px;cursor:pointer">돌아가기</button>
        </div>
        <div style="background:var(--card);border-radius:8px;padding:20px;margin-bottom:20px">
            ${lastWord ? `<p style="margin-bottom:15px">현재 끝 글자: <strong style="font-size:1.3rem;color:var(--primary)">${lastWord}</strong></p>` : '<p style="color:var(--text-muted);margin-bottom:15px">시작 단어를 입력하세요</p>'}
            <input type="text" id="wordChainInput" placeholder="단어를 입력하세요" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:4px;margin-bottom:10px;box-sizing:border-box;font-size:1rem">
            <button onclick="playWordChain()" style="padding:10px 20px;background:var(--primary);color:white;border:none;border-radius:4px;cursor:pointer;width:100%">제출</button>
        </div>
        <div id="wordChainMessage" style="min-height:30px;margin-bottom:15px;text-align:center"></div>
        <div style="background:var(--bg);border-radius:8px;padding:15px;max-height:300px;overflow-y:auto">
            <p style="color:var(--text-muted);font-size:0.9rem;margin:0">단어 목록:</p>
            <div id="wordChainHistory" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">
                ${history.map(w => `<span style="background:var(--card);padding:6px 12px;border-radius:4px;font-size:0.85rem">${escapeHtml(w)}</span>`).join('')}
            </div>
        </div>
    </div>`;
}

/*
function playWordChain() {
    const input = document.getElementById('wordChainInput').value.trim();
    const msgDiv = document.getElementById('wordChainMessage');

    if (!input) {
        msgDiv.textContent = '단어를 입력하세요';
        msgDiv.style.color = '#ef4444';
        return;
    }

    const lastWord = window._wordChainLastWord || '';
    const history = JSON.parse(localStorage.getItem('wordChainHistory') || '[]');

    if (lastWord && !input.startsWith(lastWord)) {
        msgDiv.textContent = `❌ ${lastWord}로 시작해야 합니다`;
        msgDiv.style.color = '#ef4444';
        return;
    }

    if (history.includes(input)) {
        msgDiv.textContent = '❌ 이미 나온 단어입니다';
        msgDiv.style.color = '#ef4444';
        return;
    }

    if (!KOREAN_WORDS.some(w => w === input)) {
        msgDiv.textContent = '❌ 목록에 없는 단어입니다';
        msgDiv.style.color = '#ef4444';
        return;
    }

    const lastChar = input[input.length - 1];
    const computerWord = KOREAN_WORDS.find(w => w.startsWith(lastChar) && !history.includes(w) && w !== input);

    history.push(input);
    if (computerWord) history.push(computerWord);
    localStorage.setItem('wordChainHistory', JSON.stringify(history));

    window._wordChainLastWord = computerWord ? computerWord[computerWord.length - 1] : '';
    msgDiv.textContent = computerWord ? `✓ 맞아요! 컴퓨터: ${computerWord}` : '❌ 컴퓨터가 할 단어가 없어요. 당신이 이겼어요! 🎉';
    msgDiv.style.color = computerWord ? '#22c55e' : '#22c55e';

    document.getElementById('wordChainInput').value = '';
    setTimeout(() => {
        document.getElementById('app').innerHTML = renderGameWordChain();
        document.getElementById('wordChainInput').focus();
    }, 500);
}
*/

// =================== 32. 이름 궁합 ===================
function renderGameNameCompat() {
    return `
    <div class="page">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <h2>💕 이름 궁합</h2>
            <button onclick="backToGames()" style="padding:8px 16px;background:var(--border);border:none;border-radius:4px;cursor:pointer">돌아가기</button>
        </div>
        <div style="background:var(--card);border-radius:8px;padding:20px">
            <div style="margin-bottom:15px">
                <label style="display:block;margin-bottom:5px">첫 번째 이름:</label>
                <input type="text" id="nameCompat1" placeholder="이름을 입력하세요" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:4px;box-sizing:border-box;font-size:1rem">
            </div>
            <div style="margin-bottom:20px">
                <label style="display:block;margin-bottom:5px">두 번째 이름:</label>
                <input type="text" id="nameCompat2" placeholder="이름을 입력하세요" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:4px;box-sizing:border-box;font-size:1rem">
            </div>
            <button onclick="calculateCompat()" style="padding:10px 20px;background:var(--primary);color:white;border:none;border-radius:4px;cursor:pointer;width:100%;font-size:1rem;font-weight:bold">궁합 계산</button>
        </div>
        <div id="compatResult" style="margin-top:20px;background:var(--card);border-radius:8px;padding:20px;text-align:center;min-height:100px;display:none">
            <p id="compatPercent" style="font-size:2.5rem;font-weight:bold;color:var(--primary);margin:10px 0"></p>
            <p id="compatComment" style="color:var(--text-muted);margin:0"></p>
        </div>
    </div>`;
}

function calculateCompat() {
    const name1 = document.getElementById('nameCompat1').value.trim();
    const name2 = document.getElementById('nameCompat2').value.trim();

    if (!name1 || !name2) {
        alert('두 이름 모두 입력하세요');
        return;
    }

    let sum = 0;
    for (let char of (name1 + name2)) {
        sum += char.charCodeAt(0);
    }
    const compat = (sum % 101);

    const resultDiv = document.getElementById('compatResult');
    const percentDiv = document.getElementById('compatPercent');
    const commentDiv = document.getElementById('compatComment');

    percentDiv.textContent = compat + '%';
    let comment = '';
    if (compat >= 80) comment = '👫 대박! 완벽한 궁합이에요!';
    else if (compat >= 60) comment = '😊 좋은 궁합입니다!';
    else if (compat >= 40) comment = '🤔 보통 정도의 궁합입니다';
    else comment = '😅 조금 맞지 않을 수도...';

    commentDiv.textContent = comment;
    resultDiv.style.display = 'block';
}

// =================== 35. 타이핑 속도 ===================
/*
const TYPING_TEXTS = [
    '빠르면 빠를수록 좋은 세상입니다.',
    '꾸준함이 최고의 미덕이라고 생각합니다.',
    '새로운 도전은 항상 설레인다.',
    '음악은 삶의 일부이며 영혼입니다.',
    '읽는 것을 좋아하는 사람은 강하다.',
    '진정한 용기는 두려움 속에서 나온다.',
    '변화는 새로운 기회를 만든다.',
    '친구는 인생에서 가장 큰 선물이다.',
    '실패는 성공의 어머니이다.',
    '매일 조금씩 나아지는 것이 중요하다.'
];

function renderGameTyping() {
    const text = TYPING_TEXTS[Math.floor(Math.random() * TYPING_TEXTS.length)];
    const stats = JSON.parse(localStorage.getItem('typingStats') || '{"attempts":0,"bestWPM":0}');

    return `
    <div class="page">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <h2>⌨️ 타이핑 속도</h2>
            <button onclick="backToGames()" style="padding:8px 16px;background:var(--border);border:none;border-radius:4px;cursor:pointer">돌아가기</button>
        </div>
        <div style="background:var(--card);border-radius:8px;padding:20px;margin-bottom:20px">
            <p style="color:var(--text-muted);margin-bottom:10px;font-size:0.9rem">아래 문장을 정확하게 입력하세요 (60초)</p>
            <p id="typingText" style="background:var(--bg);padding:15px;border-radius:4px;font-size:1.1rem;min-height:60px;word-break:break-all;margin-bottom:15px">${text}</p>
            <input type="text" id="typingInput" placeholder="여기에 입력하세요" style="width:100%;padding:10px;border:2px solid var(--border);border-radius:4px;box-sizing:border-box;margin-bottom:10px;font-size:1rem">
            <div style="display:flex;gap:10px">
                <button onclick="startTypingTest()" style="flex:1;padding:10px;background:var(--primary);color:white;border:none;border-radius:4px;cursor:pointer">시작</button>
                <button onclick="resetTypingTest()" style="flex:1;padding:10px;background:var(--border);border:none;border-radius:4px;cursor:pointer">초기화</button>
            </div>
        </div>
        <div id="typingResult" style="min-height:60px"></div>
        <div style="background:var(--bg);border-radius:8px;padding:15px;text-align:center">
            <p style="color:var(--text-muted);margin:5px 0">최고 기록: <strong>${stats.bestWPM} WPM</strong></p>
        </div>
    </div>`;
}

function startTypingTest() {
    const input = document.getElementById('typingInput');
    const text = document.getElementById('typingText').textContent;
    const resultDiv = document.getElementById('typingResult');
    input.disabled = true;
    let timeLeft = 60;
    const timer = setInterval(() => {
        timeLeft--;
        if (timeLeft < 0) {
            clearInterval(timer);
            const typed = input.value;
            let correct = 0;
            for (let i = 0; i < Math.min(text.length, typed.length); i++) {
                if (text[i] === typed[i]) correct++;
            }
            const wpm = Math.round((correct / 5) / 1);
            const accuracy = Math.round((correct / text.length) * 100);
            resultDiv.innerHTML = `<div style="background:var(--card);border-radius:8px;padding:20px;text-align:center"><strong>${wpm} WPM</strong><br>정확도: ${accuracy}%</div>`;
            input.disabled = false;
        }
    }, 1000);
}

function resetTypingTest() {
    document.getElementById('typingInput').value = '';
    document.getElementById('typingResult').innerHTML = '';
}
*/

// =================== 36. 기억력 카드 ===================
/*
function renderGameMemory() {
    const emojis = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼'];
    const cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
    let html = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">';
    for (let i = 0; i < cards.length; i++) {
        html += `<div id="card${i}" onclick="flipMemoryCard(${i})" style="width:100%;aspect-ratio:1;background:var(--card);border:2px solid var(--border);border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:2rem;user-select:none" data-emoji="${cards[i]}">?</div>`;
    }
    html += '</div>';

    return `
    <div class="page">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <h2>🎴 기억력 카드</h2>
            <button onclick="backToGames()" style="padding:8px 16px;background:var(--border);border:none;border-radius:4px;cursor:pointer">돌아가기</button>
        </div>
        <div style="background:var(--card);border-radius:8px;padding:20px">
            <p style="color:var(--text-muted);margin-bottom:15px">같은 이모지 2개를 찾으세요!</p>
            ${html}
            <div id="memoryStats" style="margin-top:20px;text-align:center;color:var(--text-muted)">찾은 쌍: <strong id="memoryFound">0</strong> / 8</div>
        </div>
    </div>`;
}

function flipMemoryCard(idx) {
    const card = document.getElementById(`card${idx}`);
    if (card.dataset.flipped || window._memoryLocked) return;

    card.dataset.flipped = 'true';
    card.textContent = card.dataset.emoji;

    const flipped = Array.from(document.querySelectorAll('[data-flipped="true"]'));
    if (flipped.length === 2) {
        window._memoryLocked = true;
        const [card1, card2] = flipped;
        if (card1.dataset.emoji === card2.dataset.emoji) {
            card1.style.opacity = '0.5';
            card2.style.opacity = '0.5';
            const found = parseInt(document.getElementById('memoryFound').textContent) + 1;
            document.getElementById('memoryFound').textContent = found;
            window._memoryLocked = false;
            if (found === 8) setTimeout(() => alert('완벽해요! 🎉'), 300);
        } else {
            setTimeout(() => {
                card1.dataset.flipped = '';
                card2.dataset.flipped = '';
                card1.textContent = '?';
                card2.textContent = '?';
                window._memoryLocked = false;
            }, 500);
        }
    }
}
*/

// =================== 37. 반응속도 ===================
function renderGameReaction() {
    const stats = JSON.parse(localStorage.getItem('reactionStats') || '{"attempts":0,"avgTime":0}');
    return `
    <div class="page">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <h2>⚡ 반응속도</h2>
            <button onclick="backToGames()" style="padding:8px 16px;background:var(--border);border:none;border-radius:4px;cursor:pointer">돌아가기</button>
        </div>
        <div style="background:var(--card);border-radius:8px;padding:30px;text-align:center">
            <div id="reactionButton" onclick="startReaction()" style="background:#ef4444;color:white;padding:50px;border-radius:10px;font-size:1.5rem;font-weight:bold;cursor:pointer;margin-bottom:20px;user-select:none;transition:all 0.2s" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">클릭하면 녹색이 나타날 때까지 기다렸다가 클릭!</div>
            <div id="reactionResult" style="min-height:40px;font-size:1.2rem;font-weight:bold;color:var(--primary)"></div>
            <div style="margin-top:20px;color:var(--text-muted)">평균 반응속도: <strong>${stats.avgTime}ms</strong></div>
        </div>
    </div>`;
}

function startReaction() {
    const btn = document.getElementById('reactionButton');
    const resultDiv = document.getElementById('reactionResult');
    btn.onclick = null;
    btn.textContent = '기다리세요...';
    btn.style.background = '#3b82f6';
    const delay = Math.random() * 3000 + 1000;
    const startTime = Date.now();
    setTimeout(() => {
        btn.textContent = '지금 클릭!';
        btn.style.background = '#22c55e';
        btn.onclick = () => {
            const reactionTime = Date.now() - startTime;
            const stats = JSON.parse(localStorage.getItem('reactionStats') || '{"attempts":0,"avgTime":0}');
            stats.attempts++;
            stats.avgTime = Math.round((stats.avgTime * (stats.attempts - 1) + reactionTime) / stats.attempts);
            localStorage.setItem('reactionStats', JSON.stringify(stats));
            resultDiv.textContent = `⚡ ${reactionTime}ms (평균: ${stats.avgTime}ms)`;
            btn.style.background = '#ef4444';
            btn.textContent = '클릭하면 녹색이 나타날 때까지 기다렸다가 클릭!';
            btn.onclick = () => startReaction();
        };
    }, delay);
}

// =================== 38. 단어 숨은 그림 ===================
/*
function renderGameWordSearch() {
    const words = ['고양이', '강아지', '나비', '꽃', '태양'];
    const gridSize = 10;
    let grid = Array(gridSize * gridSize).fill('가');
    const alphabet = '가나다라마바사아자차카타파하'.split('');

    for (let i = 0; i < grid.length; i++) {
        grid[i] = alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    words.forEach(word => {
        let placed = false;
        while (!placed) {
            const row = Math.floor(Math.random() * gridSize);
            const col = Math.floor(Math.random() * (gridSize - word.length));
            let canPlace = true;
            for (let i = 0; i < word.length; i++) {
                if (grid[row * gridSize + col + i] !== '가' && grid[row * gridSize + col + i] !== word[i]) {
                    canPlace = false;
                    break;
                }
            }
            if (canPlace) {
                for (let i = 0; i < word.length; i++) {
                    grid[row * gridSize + col + i] = word[i];
                }
                placed = true;
            }
        }
    });

    let gridHtml = '<div style="display:grid;grid-template-columns:repeat(10,1fr);gap:4px;margin-bottom:20px">';
    for (let i = 0; i < grid.length; i++) {
        gridHtml += `<div style="width:100%;aspect-ratio:1;background:var(--card);border:1px solid var(--border);border-radius:4px;display:flex;align-items:center;justify-content:center;font-weight:bold">${grid[i]}</div>`;
    }
    gridHtml += '</div>';

    return `
    <div class="page">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <h2>🔍 단어 숨은 그림</h2>
            <button onclick="backToGames()" style="padding:8px 16px;background:var(--border);border:none;border-radius:4px;cursor:pointer">돌아가기</button>
        </div>
        <div style="background:var(--card);border-radius:8px;padding:20px">
            <p style="color:var(--text-muted);margin-bottom:15px">찾을 단어: <strong>${words.join(', ')}</strong></p>
            ${gridHtml}
            <p style="color:var(--text-muted);font-size:0.9rem">📌 이 게임은 수평으로 배치된 단어만 포함됩니다</p>
        </div>
    </div>`;
}
*/

// =================== 41. 클리커 ===================
/*
function renderGameClicker() {
    const stats = JSON.parse(localStorage.getItem('clickerStats') || '{"clicks":0,"autoClicks":0}');
    return `
    <div class="page">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <h2>👆 클리커</h2>
            <button onclick="backToGames()" style="padding:8px 16px;background:var(--border);border:none;border-radius:4px;cursor:pointer">돌아가기</button>
        </div>
        <div style="background:var(--card);border-radius:8px;padding:20px;text-align:center;margin-bottom:20px">
            <div id="clickCount" style="font-size:3rem;font-weight:bold;color:var(--primary);margin-bottom:10px">${stats.clicks}</div>
            <button onclick="addClick()" style="padding:20px 40px;background:var(--primary);color:white;border:none;border-radius:6px;cursor:pointer;font-size:1.2rem;font-weight:bold;width:100%">클릭!</button>
        </div>
        <div style="background:var(--card);border-radius:8px;padding:20px">
            <h3 style="margin:0 0 15px 0">🔥 업그레이드</h3>
            <button onclick="buyAutoClicker()" style="width:100%;padding:10px;background:var(--border);border:none;border-radius:4px;margin-bottom:10px;cursor:pointer">
                자동 클리커 (${stats.autoClicks}개) - 100클릭
            </button>
            <p style="color:var(--text-muted);font-size:0.85rem;margin:10px 0 0 0">자동 클리커 1개당 매초 1클릭 추가</p>
        </div>
    </div>`;
}

function addClick() {
    const stats = JSON.parse(localStorage.getItem('clickerStats') || '{"clicks":0,"autoClicks":0}');
    stats.clicks++;
    localStorage.setItem('clickerStats', JSON.stringify(stats));
    document.getElementById('clickCount').textContent = stats.clicks;
}

function buyAutoClicker() {
    const stats = JSON.parse(localStorage.getItem('clickerStats') || '{"clicks":0,"autoClicks":0}');
    if (stats.clicks >= 100) {
        stats.clicks -= 100;
        stats.autoClicks++;
        localStorage.setItem('clickerStats', JSON.stringify(stats));
        document.getElementById('app').innerHTML = renderGameClicker();
        startAutoClicker();
    } else {
        alert('클릭이 100개 이상 필요합니다');
    }
}

function startAutoClicker() {
    const stats = JSON.parse(localStorage.getItem('clickerStats') || '{"clicks":0,"autoClicks":0}');
    if (stats.autoClicks > 0) {
        setInterval(() => {
            const current = JSON.parse(localStorage.getItem('clickerStats') || '{"clicks":0,"autoClicks":0}');
            current.clicks += current.autoClicks;
            localStorage.setItem('clickerStats', JSON.stringify(current));
            const countDiv = document.getElementById('clickCount');
            if (countDiv) countDiv.textContent = current.clicks;
        }, 1000);
    }
}
*/

// =================== 42. 피아노 ===================
/*
function renderGamePiano() {
    const notes = [
        {name:'도',freq:262},{name:'레',freq:294},{name:'미',freq:330},
        {name:'파',freq:349},{name:'솔',freq:392},{name:'라',freq:440},{name:'시',freq:494}
    ];
    const blackNotes = [
        {name:'도#',freq:277,left:30},{name:'레#',freq:311,left:80},
        {name:'파#',freq:370,left:200},{name:'솔#',freq:415,left:250},{name:'라#',freq:466,left:300}
    ];

    let html = '<div style="position:relative;width:100%;height:200px;background:var(--card);border-radius:8px;margin-bottom:20px;padding:20px;box-sizing:border-box">';

    for (let note of notes) {
        html += `<button onclick="playPianoNote(${note.freq})" style="width:60px;height:120px;background:white;border:2px solid #999;border-radius:0 0 6px 6px;cursor:pointer;font-weight:bold;font-size:0.9rem;position:relative">${note.name}</button>`;
    }

    for (let note of blackNotes) {
        html += `<button onclick="playPianoNote(${note.freq})" style="width:40px;height:80px;background:#333;border:2px solid #000;border-radius:0 0 4px 4px;cursor:pointer;color:white;font-weight:bold;font-size:0.85rem;position:absolute;left:${note.left}px;top:20px">${note.name}</button>`;
    }

    html += '</div>';

    return `
    <div class="page">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <h2>🎹 피아노</h2>
            <button onclick="backToGames()" style="padding:8px 16px;background:var(--border);border:none;border-radius:4px;cursor:pointer">돌아가기</button>
        </div>
        ${html}
    </div>`;
}

function playPianoNote(freq) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.warn('오디오 재생 불가:', e);
    }
}
*/
