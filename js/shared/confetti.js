/**
 * X-29 Module: shared/confetti.js
 * High-performance canvas confetti and visual celebration effects
 */

/**
 * Fires full-screen confetti animation with burst and raining flower particles.
 */
export function fireConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#f43f5e', '#06b6d4'];

    // Initial Firework Burst
    for (let i = 0; i < 200; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2 + 100,
            r: Math.random() * 6 + 3,
            dx: Math.random() * 24 - 12,
            dy: Math.random() * -24 - 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.floor(Math.random() * 10) - 10,
            tiltAngleIncrement: (Math.random() * 0.07) + 0.05,
            tiltAngle: 0,
            type: Math.random() > 0.5 ? 'circle' : 'rect'
        });
    }

    let animationId;
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, index) => {
            p.tiltAngle += p.tiltAngleIncrement;
            p.y += (Math.cos(p.tiltAngle) + 1 + p.r / 2) / 2;
            p.x += Math.sin(p.tiltAngle) * 2;
            p.dy += 0.08; // gravity
            p.x += p.dx;
            p.y += p.dy;

            ctx.beginPath();
            if (p.type === 'circle') {
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            } else {
                ctx.lineWidth = p.r;
                ctx.strokeStyle = p.color;
                ctx.moveTo(p.x + p.tilt + p.r, p.y);
                ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
                ctx.stroke();
            }

            if (p.y > canvas.height || p.x < -50 || p.x > canvas.width + 50) {
                particles.splice(index, 1);
            }
        });

        if (particles.length > 0) {
            animationId = requestAnimationFrame(render);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    render();

    // Raining Flowers/Confetti phase
    let shoots = 0;
    const shootInterval = setInterval(() => {
        shoots++;
        if (shoots > 8) {
            clearInterval(shootInterval);
            return;
        }
        for (let i = 0; i < 40; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: -20,
                r: Math.random() * 6 + 3,
                dx: Math.random() * 4 - 2,
                dy: Math.random() * 5 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.floor(Math.random() * 10) - 10,
                tiltAngleIncrement: (Math.random() * 0.07) + 0.05,
                tiltAngle: 0,
                type: Math.random() > 0.5 ? 'circle' : 'rect'
            });
        }
    }, 600);
}

// Global window compatibility bridge
if (typeof window !== 'undefined') {
    window.fireConfetti = fireConfetti;
}
