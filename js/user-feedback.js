// =============================================
// 사용자 피드백 위젯
// =============================================
const UserFeedback = {
    _widget: null,
    _open: false,

    init() {
        this._createWidget();
        AppLogger.info('UserFeedback initialized');
    },

    _createWidget() {
        // 피드백 버튼
        const btn = document.createElement('button');
        btn.id = 'feedbackBtn';
        btn.title = '피드백 보내기';
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
        btn.style.cssText = `
            position:fixed;bottom:24px;right:24px;z-index:999;
            width:48px;height:48px;border-radius:50%;
            background:linear-gradient(135deg,#1428A0,#2563eb);
            border:none;cursor:pointer;color:white;
            box-shadow:0 4px 16px rgba(20,40,160,0.4);
            display:flex;align-items:center;justify-content:center;
            transition:transform 0.2s,box-shadow 0.2s;
        `;
        btn.addEventListener('click', () => this.toggle());
        btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.1)');
        btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
        document.body.appendChild(btn);

        // 피드백 패널
        const panel = document.createElement('div');
        panel.id = 'feedbackPanel';
        panel.style.cssText = `
            position:fixed;bottom:84px;right:24px;z-index:1000;
            width:300px;background:var(--card-bg,#fff);
            border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.15);
            padding:20px;display:none;
            border:1px solid var(--border,#e2e8f0);
        `;
        panel.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                <strong style="color:var(--text-primary,#1e293b);font-size:0.95rem">피드백 보내기</strong>
                <button onclick="UserFeedback.close()" style="background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted,#94a3b8)">&times;</button>
            </div>
            <div style="display:flex;gap:8px;margin-bottom:12px">
                <button class="fb-rate-btn" data-rating="good" style="flex:1;padding:8px;border:1px solid #22c55e;border-radius:8px;background:transparent;cursor:pointer;font-size:1rem">👍 좋아요</button>
                <button class="fb-rate-btn" data-rating="bad" style="flex:1;padding:8px;border:1px solid #ef4444;border-radius:8px;background:transparent;cursor:pointer;font-size:1rem">👎 아쉬워요</button>
            </div>
            <textarea id="feedbackText" placeholder="의견을 자유롭게 입력해주세요 (선택)" rows="3" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--border,#e2e8f0);border-radius:8px;resize:vertical;font-size:0.85rem;font-family:inherit;background:var(--card-bg,#fff);color:var(--text-primary,#1e293b)"></textarea>
            <button onclick="UserFeedback.submit()" style="width:100%;margin-top:8px;padding:10px;background:linear-gradient(135deg,#1428A0,#2563eb);color:white;border:none;border-radius:8px;cursor:pointer;font-size:0.9rem;font-weight:600">전송</button>
            <p style="font-size:0.75rem;color:var(--text-muted,#94a3b8);margin-top:8px;text-align:center">익명으로 전송됩니다</p>
        `;

        // 평점 버튼 클릭
        panel.querySelectorAll('.fb-rate-btn').forEach(b => {
            b.addEventListener('click', () => {
                panel.querySelectorAll('.fb-rate-btn').forEach(bb => bb.style.background = 'transparent');
                b.style.background = b.dataset.rating === 'good' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)';
                panel.dataset.selectedRating = b.dataset.rating;
            });
        });

        document.body.appendChild(panel);
        this._widget = { btn, panel };
    },

    toggle() { this._open ? this.close() : this.open(); },

    open() {
        if (this._widget) { this._widget.panel.style.display = 'block'; this._open = true; }
    },

    close() {
        if (this._widget) { this._widget.panel.style.display = 'none'; this._open = false; }
    },

    async submit() {
        const rating = this._widget.panel.dataset.selectedRating;
        const text = document.getElementById('feedbackText')?.value?.trim();

        const feedback = {
            rating: rating || 'none',
            text: text || '',
            page: location.search || '/',
            time: new Date().toISOString(),
            ua: navigator.userAgent.slice(0, 80)
        };

        AppLogger.info('Feedback submitted:', feedback);

        // Firebase에 저장 (fbReady 확인)
        try {
            if (typeof fbReady === 'function' && fbReady() && typeof _fbDB !== 'undefined') {
                const existing = JSON.parse((await _fbDB.ref('data/feedback').get()).val() || '[]');
                existing.push(feedback);
                if (existing.length > 200) existing.splice(0, existing.length - 200);
                await _fbDB.ref('data/feedback').set(JSON.stringify(existing));
            }
        } catch(e) {
            AppLogger.warn('Failed to save feedback to Firebase:', e);
        }

        this.close();
        if (typeof showToast === 'function') {
            showToast('피드백을 보내주셔서 감사합니다! 💙', 'success');
        }
    }
};
