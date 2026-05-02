function renderShellPage(content, variant = '') {
    return `
    <section class="shell-page shell-page-${variant}">
        ${content}
    </section>`;
}

function getShellPageStyles() {
    return `
    <style>
        .shell-page {
            min-height: calc(100dvh - 64px);
            padding: 112px 20px 72px;
            position: relative;
            overflow: hidden;
        }

        .shell-page::before,
        .shell-page::after {
            content: '';
            position: absolute;
            border-radius: 999px;
            filter: blur(80px);
            pointer-events: none;
            opacity: 0.16;
        }

        .shell-page::before {
            width: 380px;
            height: 380px;
            top: -80px;
            left: -120px;
            background: radial-gradient(circle, rgba(20,40,160,0.95), rgba(20,40,160,0));
        }

        .shell-page::after {
            width: 320px;
            height: 320px;
            right: -80px;
            bottom: -120px;
            background: radial-gradient(circle, rgba(0,119,200,0.65), rgba(0,119,200,0));
        }

        .shell-page-offline::before {
            background: radial-gradient(circle, rgba(239,68,68,0.65), rgba(239,68,68,0));
        }

        .shell-page-wrap {
            max-width: 860px;
            margin: 0 auto;
            position: relative;
            z-index: 1;
        }

        .shell-page-card {
            background: rgba(255,255,255,0.9);
            border: 1px solid var(--border);
            border-radius: 24px;
            box-shadow: var(--shadow-md);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
        }

        [data-theme="dark"] .shell-page-card {
            background: rgba(20,20,20,0.92);
        }

        .shell-center {
            min-height: calc(100dvh - 240px);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .shell-empty {
            max-width: 560px;
            margin: 0 auto;
            text-align: center;
            padding: 44px 28px;
        }

        .shell-kicker {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 7px 14px;
            border-radius: 999px;
            background: var(--primary-bg);
            color: var(--primary);
            font-size: 0.78rem;
            font-weight: 800;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            margin-bottom: 18px;
        }

        .shell-page-offline .shell-kicker {
            background: rgba(239,68,68,0.1);
            color: #dc2626;
        }

        .shell-code {
            font-size: clamp(4.2rem, 18vw, 8rem);
            line-height: 0.95;
            font-weight: 900;
            letter-spacing: 0;
            color: var(--primary);
            margin-bottom: 10px;
        }

        .shell-title {
            font-size: clamp(1.4rem, 4vw, 2.2rem);
            line-height: 1.2;
            margin-bottom: 12px;
        }

        .shell-desc {
            color: var(--text-muted);
            font-size: 0.98rem;
            line-height: 1.8;
            margin: 0 auto 28px;
            max-width: 460px;
        }

        .shell-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            justify-content: center;
        }

        .shell-secondary-btn {
            background: var(--bg-card);
            color: var(--text);
            border: 1px solid var(--border);
        }

        .shell-note {
            margin-top: 18px;
            color: var(--text-muted);
            font-size: 0.84rem;
        }

        .privacy-shell {
            padding: 36px 28px 44px;
        }

        .privacy-shell-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding-bottom: 18px;
            border-bottom: 2px solid var(--primary-bg2);
            margin-bottom: 28px;
        }

        .privacy-shell-title h1 {
            font-size: 1.9rem;
            line-height: 1.2;
            margin-bottom: 6px;
        }

        .privacy-shell-date {
            color: var(--text-muted);
            font-size: 0.9rem;
        }

        .privacy-shell-section + .privacy-shell-section {
            margin-top: 24px;
        }

        .privacy-shell-section h2 {
            font-size: 1.05rem;
            margin-bottom: 10px;
            color: var(--primary);
        }

        .privacy-shell-section p,
        .privacy-shell-section li {
            color: var(--text-secondary);
            line-height: 1.8;
            font-size: 0.95rem;
        }

        .privacy-shell-section ul {
            padding-left: 20px;
            margin: 10px 0 0;
        }

        .privacy-shell-highlight,
        .privacy-shell-contact {
            margin-top: 12px;
            border-radius: 18px;
            padding: 18px 20px;
        }

        .privacy-shell-highlight {
            background: var(--bg-subtle);
        }

        .privacy-shell-contact {
            background: linear-gradient(135deg, #1428A0, #2563eb);
            color: #fff;
        }

        .privacy-shell-contact p,
        .privacy-shell-contact a,
        .privacy-shell-contact h2 {
            color: #fff;
        }

        @media (max-width: 768px) {
            .shell-page {
                padding: 92px 16px 48px;
            }

            .shell-empty,
            .privacy-shell {
                padding: 28px 20px 32px;
            }

            .privacy-shell-header {
                flex-direction: column;
                align-items: flex-start;
            }
        }

        @media (max-width: 480px) {
            .shell-actions {
                flex-direction: column;
            }

            .shell-actions .btn {
                width: 100%;
            }
        }
    </style>`;
}

function renderNotFoundPage() {
    return renderShellPage(`
        ${getShellPageStyles()}
        <div class="shell-page-wrap shell-center">
            <div class="shell-page-card shell-empty">
                <div class="shell-kicker">Not Found</div>
                <div class="shell-code">404</div>
                <h1 class="shell-title">페이지를 찾을 수 없어요</h1>
                <p class="shell-desc">
                    주소가 잘못되었거나, 예전에 쓰던 링크일 수 있어요.
                    홈으로 돌아가서 다시 이동해 보세요.
                </p>
                <div class="shell-actions">
                    <button class="btn btn-primary" onclick="navigate('home')">홈으로 가기</button>
                    <button class="btn shell-secondary-btn" onclick="goBackOrHome()">이전으로</button>
                </div>
                <p class="shell-note">은가람중학교 1학년 2반 통합 사이트</p>
            </div>
        </div>
    `, 'not-found');
}

function renderOfflinePage() {
    return renderShellPage(`
        ${getShellPageStyles()}
        <div class="shell-page-wrap shell-center">
            <div class="shell-page-card shell-empty">
                <div class="shell-kicker">Offline</div>
                <h1 class="shell-title">인터넷 연결을 확인해 주세요</h1>
                <p class="shell-desc">
                    지금은 네트워크에 연결되어 있지 않아요.
                    연결이 돌아오면 다시 불러오거나 홈으로 이동할 수 있습니다.
                </p>
                <div class="shell-actions">
                    <button class="btn btn-primary" onclick="window.location.reload()">다시 시도</button>
                    <button class="btn shell-secondary-btn" onclick="goBackOrHome()">이전으로</button>
                </div>
                <p class="shell-note">일부 화면은 캐시된 정보만 보여줄 수 있어요.</p>
            </div>
        </div>
    `, 'offline');
}

function renderPrivacyPage() {
    return renderShellPage(`
        ${getShellPageStyles()}
        <div class="shell-page-wrap">
            <article class="shell-page-card privacy-shell">
                <div class="privacy-shell-header">
                    <div class="privacy-shell-title">
                        <h1>개인정보처리방침</h1>
                        <p class="privacy-shell-date">시행일: 2026년 4월 25일</p>
                    </div>
                    <button class="btn shell-secondary-btn" onclick="goBackOrHome()">돌아가기</button>
                </div>

                <section class="privacy-shell-section">
                    <h2>1. 개요</h2>
                    <p>은가람중학교 1학년 2반 통합 사이트는 시간표, 급식, 학사일정 등 학급 정보를 제공하면서 필요한 범위 안에서 최소한의 정보만 다룹니다.</p>
                </section>

                <section class="privacy-shell-section">
                    <h2>2. 수집할 수 있는 정보</h2>
                    <ul>
                        <li>접속 로그, 브라우저 정보, 오류 기록 같은 서비스 운영 정보</li>
                        <li>채팅, 건의, 투표 등 사용자가 직접 입력한 내용</li>
                        <li>테마 설정 같은 기기 로컬 저장 정보</li>
                    </ul>
                    <div class="privacy-shell-highlight">
                        <p>이름, 주민등록번호 같은 민감한 개인정보를 회원가입 형태로 따로 수집하지 않는 것을 기본 원칙으로 합니다.</p>
                    </div>
                </section>

                <section class="privacy-shell-section">
                    <h2>3. 이용 목적</h2>
                    <ul>
                        <li>학급 공지와 생활 정보를 제공하기 위해</li>
                        <li>오류 대응, 보안 점검, 비정상 이용 방지를 위해</li>
                        <li>서비스 품질을 개선하기 위해</li>
                    </ul>
                </section>

                <section class="privacy-shell-section">
                    <h2>4. 외부 서비스</h2>
                    <p>일부 기능은 Firebase, NEIS 등 외부 서비스를 함께 사용할 수 있으며, 해당 서비스의 정책은 각 제공처의 정책을 따릅니다.</p>
                    <ul>
                        <li><a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">Firebase 개인정보 안내</a></li>
                        <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google 개인정보처리방침</a></li>
                    </ul>
                </section>

                <section class="privacy-shell-section">
                    <h2>5. 저장 기간과 사용자 권리</h2>
                    <p>운영 목적이 끝난 정보는 가능한 범위에서 지체 없이 정리합니다. 사용자는 자신이 작성한 내용의 삭제나 정정을 요청할 수 있습니다.</p>
                </section>

                <section class="privacy-shell-section">
                    <div class="privacy-shell-contact">
                        <h2>문의</h2>
                        <p>학교: 은가람중학교</p>
                        <p>학급: 1학년 2반</p>
                        <p>이메일: <a href="mailto:slateblack9209@gmail.com">slateblack9209@gmail.com</a></p>
                    </div>
                </section>
            </article>
        </div>
    `, 'privacy');
}

function goBackOrHome() {
    if (history.length > 1) {
        history.back();
        return;
    }
    navigate('home');
}
