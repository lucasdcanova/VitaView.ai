import { useEffect, useRef } from "react";

interface AntigravityCanvasProps {
    className?: string;
}

export function AntigravityCanvas({ className }: AntigravityCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const config = {
            particleCount: 50,
            speedFactor: 0.6,
            colors: ["#212121", "#9E9E9E", "#BDBDBD", "#E0E0E0", "#424242", "#757575"],
            gravity: -0.04,
            interactionRadius: 160,
            friction: 0.98,
        };

        let width = 0;
        let height = 0;
        let mouseX = -1000;
        let mouseY = -1000;
        let animId: number;

        function resize() {
            const dpr = window.devicePixelRatio || 1;
            width = canvas!.parentElement?.clientWidth || window.innerWidth;
            height = canvas!.parentElement?.clientHeight || window.innerHeight;
            canvas!.width = width * dpr;
            canvas!.height = height * dpr;
            canvas!.style.width = `${width}px`;
            canvas!.style.height = `${height}px`;
            ctx!.scale(dpr, dpr);
        }

        class Particle {
            x = 0;
            y = 0;
            size = 0;
            vx = 0;
            vy = 0;
            color = "";
            rotation = 0;
            rotationSpeed = 0;
            type = 0;
            depth = 0;
            opacity = 0;

            constructor() {
                this.init(true);
            }

            init(randomY: boolean) {
                this.x = Math.random() * width;
                this.y = randomY ? Math.random() * height : height + 50;
                this.size = Math.random() * 14 + 4;
                this.vx = (Math.random() - 0.5) * 2 * config.speedFactor;
                this.vy = (Math.random() - 0.5) * 2 * config.speedFactor;
                this.vy -= Math.random() * 1 * Math.abs(config.gravity);
                this.color = config.colors[Math.floor(Math.random() * config.colors.length)];
                this.rotation = Math.random() * Math.PI * 2;
                this.rotationSpeed = (Math.random() - 0.5) * 0.04;
                this.type = Math.floor(Math.random() * 3); // 0=circle, 1=square, 2=triangle
                this.depth = Math.random() * 0.8 + 0.4;
                this.opacity = Math.random() * 0.4 + 0.15;
            }

            update() {
                this.vy += config.gravity * 0.05 * this.depth;
                this.x += this.vx * this.depth;
                this.y += this.vy * this.depth;
                this.rotation += this.rotationSpeed;

                const dx = this.x - mouseX;
                const dy = this.y - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < config.interactionRadius) {
                    const force = (config.interactionRadius - dist) / config.interactionRadius;
                    const angle = Math.atan2(dy, dx);
                    const push = force * 3.5;
                    this.vx += Math.cos(angle) * push;
                    this.vy += Math.sin(angle) * push;
                }

                this.vx *= config.friction;
                this.vy *= config.friction;

                if (this.x < -50) this.x = width + 50;
                if (this.x > width + 50) this.x = -50;
                if (this.y < -60) this.init(false);
            }

            draw(c: CanvasRenderingContext2D) {
                c.save();
                c.translate(this.x, this.y);
                c.rotate(this.rotation);
                c.globalAlpha = this.opacity;
                c.fillStyle = this.color;

                const s = this.size * this.depth;

                c.beginPath();
                if (this.type === 0) {
                    c.arc(0, 0, s / 2, 0, Math.PI * 2);
                } else if (this.type === 1) {
                    c.rect(-s / 2, -s / 2, s, s);
                } else {
                    c.moveTo(0, -s / 2);
                    c.lineTo(s / 2, s / 2);
                    c.lineTo(-s / 2, s / 2);
                    c.closePath();
                }
                c.fill();
                c.restore();
            }
        }

        const particles: Particle[] = [];
        for (let i = 0; i < config.particleCount; i++) {
            particles.push(new Particle());
        }

        function onMouseMove(e: MouseEvent) {
            const rect = canvas!.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        }

        function onTouchMove(e: TouchEvent) {
            const rect = canvas!.getBoundingClientRect();
            mouseX = e.touches[0].clientX - rect.left;
            mouseY = e.touches[0].clientY - rect.top;
        }

        function onMouseLeave() {
            mouseX = -1000;
            mouseY = -1000;
        }

        function animate() {
            ctx!.clearRect(0, 0, width, height);
            for (const p of particles) {
                p.update();
                p.draw(ctx!);
            }
            animId = requestAnimationFrame(animate);
        }

        resize();
        animate();

        window.addEventListener("resize", resize);
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("touchmove", onTouchMove, { passive: true });
        canvas.addEventListener("mouseleave", onMouseLeave);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", resize);
            canvas.removeEventListener("mousemove", onMouseMove);
            canvas.removeEventListener("touchmove", onTouchMove);
            canvas.removeEventListener("mouseleave", onMouseLeave);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{ display: "block" }}
        />
    );
}
