// =============================================
// A/B 테스팅 프레임워크
// =============================================
const ABTesting = {
    _experiments: {},
    _assignments: {}, // 사용자 배정 캐시

    // 실험 정의
    define(name, variants, options = {}) {
        this._experiments[name] = {
            variants, // ['control', 'treatment'] 또는 가중치 {control: 50, treatment: 50}
            enabled: options.enabled !== false,
            description: options.description || ''
        };
    },

    // 변형 배정 (같은 사용자에게는 같은 변형)
    assign(experimentName) {
        if (this._assignments[experimentName]) {
            return this._assignments[experimentName];
        }

        const exp = this._experiments[experimentName];
        if (!exp || !exp.enabled) return 'control';

        // localStorage에서 기존 배정 확인
        const stored = localStorage.getItem(`ab_${experimentName}`);
        if (stored) { this._assignments[experimentName] = stored; return stored; }

        // 새 배정
        let variant;
        if (Array.isArray(exp.variants)) {
            variant = exp.variants[Math.floor(Math.random() * exp.variants.length)];
        } else {
            const total = Object.values(exp.variants).reduce((a, b) => a + b, 0);
            let rand = Math.random() * total;
            for (const [v, weight] of Object.entries(exp.variants)) {
                rand -= weight;
                if (rand <= 0) { variant = v; break; }
            }
        }

        variant = variant || 'control';
        localStorage.setItem(`ab_${experimentName}`, variant);
        this._assignments[experimentName] = variant;

        // 배정 추적
        if (typeof Analytics !== 'undefined') {
            Analytics.track('ab_assignment', { experiment: experimentName, variant });
        }

        return variant;
    },

    isVariant(experimentName, variantName) {
        return this.assign(experimentName) === variantName;
    },

    // 전환 추적
    track(experimentName, conversionEvent) {
        const variant = this._assignments[experimentName] || this.assign(experimentName);
        if (typeof Analytics !== 'undefined') {
            Analytics.track('ab_conversion', { experiment: experimentName, variant, event: conversionEvent });
        }
        AppLogger.debug(`A/B conversion: ${experimentName}/${variant}/${conversionEvent}`);
    },

    // 현재 실험 상태 확인
    getStatus() {
        return Object.entries(this._experiments).map(([name, exp]) => ({
            name, enabled: exp.enabled, assigned: this._assignments[name] || null
        }));
    }
};

// 기본 실험 정의 예시
ABTesting.define('home_layout', ['grid', 'list'], {
    enabled: false,
    description: '홈 화면 레이아웃 A/B 테스트'
});

ABTesting.define('lunch_display', {control: 60, compact: 40}, {
    enabled: false,
    description: '급식 표시 방식 A/B 테스트'
});
