/**
 * AI 8-Puzzle Visualizer & Game - Synthesized Web Audio Effects
 * Uses browser Web Audio API to create clean, responsive sound effects with zero external audio assets.
 */

const SoundFX = {
    ctx: null,
    muted: false,

    init() {
        if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
    },

    ensureContext() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    toggleMute() {
        this.muted = !this.muted;
        const icon = document.getElementById('soundToggleIcon');
        if (icon) {
            icon.className = this.muted ? 'fas fa-volume-mute text-rose-400' : 'fas fa-volume-up text-blue-400';
        }
        return this.muted;
    },

    playSlide() {
        if (this.muted) return;
        try {
            this.ensureContext();
            if (!this.ctx) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const now = this.ctx.currentTime;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(180, now + 0.06);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.06);
        } catch (e) {
            // Audio context not allowed or unsupported
        }
    },

    playError() {
        if (this.muted) return;
        try {
            this.ensureContext();
            if (!this.ctx) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const now = this.ctx.currentTime;

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.12);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.12);
        } catch (e) {}
    },

    playHint() {
        if (this.muted) return;
        try {
            this.ensureContext();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            [523.25, 659.25, 783.99].forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const startTime = now + i * 0.07;

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0.15, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + 0.2);
            });
        } catch (e) {}
    },

    playTileLock() {
        if (this.muted) return;
        try {
            this.ensureContext();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now); // A5
            osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.12); // E6
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        } catch (e) {}
    },

    playCombo(combo = 2) {
        if (this.muted) return;
        try {
            this.ensureContext();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const baseFreq = Math.min(523.25 * Math.pow(1.15, combo), 1200);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.18);
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
        } catch (e) {}
    },

    playWin() {
        if (this.muted) return;
        try {
            this.ensureContext();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const melody = [
                { f: 523.25, d: 0.1 },  // C5
                { f: 659.25, d: 0.1 },  // E5
                { f: 783.99, d: 0.1 },  // G5
                { f: 1046.50, d: 0.3 }  // C6
            ];

            let t = now;
            melody.forEach((note) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(note.f, t);

                gain.gain.setValueAtTime(0.25, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(t);
                osc.stop(t + note.d);
                t += note.d * 0.85;
            });
        } catch (e) {}
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoundFX;
}
