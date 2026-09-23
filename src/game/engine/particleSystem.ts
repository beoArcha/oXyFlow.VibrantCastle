import { Particle } from "../types";

/**
 * Particle simulation system decoupled from rendering.
 * Manages lifecycle, kinematics, turbulence, and emission of ambient and impact particles.
 */
export class ParticleSystem {
  private particles: Particle[] = [];

  constructor() {
    this.generateAmbientParticles();
  }

  public getParticles(): readonly Particle[] {
    return this.particles;
  }

  public generateAmbientParticles(count: number = 55) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * 3600,
        y: Math.random() * 700,
        vx: -0.5 - Math.random() * 0.8,
        vy: 0.3 + Math.random() * 0.6,
        color: ["#d97706", "#b45309", "#d97706", "#fbbf24", "#eab308", "#f59e0b"][Math.floor(Math.random() * 6)],
        size: 2 + Math.random() * 4,
        life: Math.random() * 100,
        maxLife: 100 + Math.random() * 200,
        type: Math.random() > 0.4 ? "leaf" : "dust",
      });
    }
  }

  public spawnBurst(x: number, y: number, color: string, type: "spark" | "dust" | "magic", count: number = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === "dust" ? 1.0 : 0),
        color,
        size: type === "spark" || type === "magic" ? 2 + Math.random() * 3 : 4 + Math.random() * 6,
        life: 0,
        maxLife: 20 + Math.random() * 25,
        type: type === "magic" ? "spark" : type,
      });
    }
  }

  /**
   * Updates particle positions and lifecycles during simulation tick.
   */
  public update(cameraX: number = 0) {
    // Replenish ambient leaves
    if (this.particles.filter((p) => p.type === "leaf").length < 45) {
      this.particles.push({
        x: Math.random() * 3600 + cameraX,
        y: -20,
        vx: -0.5 - Math.random() * 0.8,
        vy: 0.3 + Math.random() * 0.6,
        color: ["#d97706", "#b45309", "#d97706", "#fbbf24", "#f59e0b"][Math.floor(Math.random() * 5)],
        size: 2 + Math.random() * 4,
        life: 0,
        maxLife: 150 + Math.random() * 100,
        type: "leaf",
      });
    }

    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life++;

      if (p.type === "leaf") {
        p.vx += Math.sin(p.life * 0.05) * 0.02;
      }
    });

    this.particles = this.particles.filter(
      (p) => p.life < p.maxLife && p.x > -50 && p.x < 3700 && p.y < 750
    );
  }

  public clear() {
    this.particles = [];
  }
}
