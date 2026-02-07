/* ============================================
   Particle Background (subtle floating particles)
   ============================================ */

const Particles = {
    canvas: null,
    ctx: null,
    particles: [],
    animId: null,

    init() {
        this.canvas = document.getElementById('particle-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.createParticles();
        this.animate();
        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    createParticles() {
        const count = Math.floor((window.innerWidth * window.innerHeight) / 15000);
        this.particles = [];
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.2 - 0.1,
                opacity: Math.random() * 0.5 + 0.1,
                pulse: Math.random() * Math.PI * 2
            });
        }
    },

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        const color = isDark ? '136, 179, 255' : '88, 130, 200';

        for (const p of this.particles) {
            p.x += p.speedX;
            p.y += p.speedY;
            p.pulse += 0.01;

            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;

            const alpha = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${color}, ${alpha})`;
            this.ctx.fill();
        }

        this.animId = requestAnimationFrame(() => this.animate());
    },

    destroy() {
        if (this.animId) cancelAnimationFrame(this.animId);
    }
};
