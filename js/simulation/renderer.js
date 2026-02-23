// MCP Arena - Canvas Renderer

import { GRID, COLORS, ROBOT_CONFIG } from '../types.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = GRID.WIDTH;
    this.canvas.height = GRID.HEIGHT;
    this.particles = [];
    this.notifications = [];
    this.time = 0;
  }

  clear() {
    this.ctx.fillStyle = COLORS.BG;
    this.ctx.fillRect(0, 0, GRID.WIDTH, GRID.HEIGHT);
  }

  drawGrid() {
    const ctx = this.ctx;
    ctx.strokeStyle = COLORS.GRID_LINE;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;
    for (let x = 0; x <= GRID.WIDTH; x += GRID.CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GRID.HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID.HEIGHT; y += GRID.CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GRID.WIDTH, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  drawTargetZones(zones) {
    const ctx = this.ctx;
    zones.forEach(zone => {
      const pulse = Math.sin(this.time * 0.03) * 0.15 + 0.25;
      ctx.strokeStyle = zone.fulfilled ? COLORS.SUCCESS : COLORS.WARNING;
      ctx.globalAlpha = zone.fulfilled ? 0.6 : pulse;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(
        zone.x - zone.width / 2, zone.y - zone.height / 2,
        zone.width, zone.height
      );
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = zone.fulfilled ? COLORS.SUCCESS : COLORS.WARNING;
      ctx.fillRect(
        zone.x - zone.width / 2, zone.y - zone.height / 2,
        zone.width, zone.height
      );
      ctx.globalAlpha = 1;

      // Label
      ctx.font = '11px monospace';
      ctx.fillStyle = COLORS.TEXT_DIM;
      ctx.textAlign = 'center';
      ctx.fillText(zone.label, zone.x, zone.y + zone.height / 2 + 14);

      if (zone.fulfilled) {
        ctx.font = '20px sans-serif';
        ctx.fillText('\u2713', zone.x, zone.y + 6);
      }
    });
  }

  drawObjects(objects) {
    const ctx = this.ctx;
    objects.forEach(obj => {
      ctx.save();
      ctx.translate(obj.x, obj.y);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(-obj.width / 2 + 3, -obj.height / 2 + 3, obj.width, obj.height);

      // Object body
      ctx.fillStyle = obj.color;
      ctx.strokeStyle = obj.gripped ? COLORS.ROBOT_ACTIVE : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = obj.gripped ? 2 : 1;
      ctx.fillRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);
      ctx.strokeRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);

      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height / 3);

      // Label
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(obj.label, 0, 0);

      // Weight badge
      ctx.font = '8px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(`${obj.weight}kg`, 0, obj.height / 2 - 6);

      ctx.restore();
    });
  }

  drawRobot(robot) {
    if (!robot) return;
    const ctx = this.ctx;

    // Trail
    robot.trail.forEach(t => {
      ctx.fillStyle = COLORS.ROBOT_ACTIVE;
      ctx.globalAlpha = (30 - t.age) / 60;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Scan ring
    if (robot.isScanning) {
      ctx.strokeStyle = COLORS.SCAN_RING;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 1 - robot.scanRadius / robot.scanMaxRadius;
      ctx.beginPath();
      ctx.arc(robot.armX, robot.armY, robot.scanRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Connection line (base to arm)
    ctx.strokeStyle = COLORS.ROBOT_ARM;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(robot.baseX, robot.baseY);

    // Elbow (midpoint with offset for visual curve)
    const midX = (robot.baseX + robot.armX) / 2;
    const midY = (robot.baseY + robot.armY) / 2 - 20;
    ctx.quadraticCurveTo(midX, midY, robot.armX, robot.armY);
    ctx.stroke();

    // Joint at elbow
    ctx.fillStyle = COLORS.ROBOT_ARM;
    ctx.beginPath();
    ctx.arc(midX, midY, ROBOT_CONFIG.JOINT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Base
    ctx.fillStyle = COLORS.ROBOT_BASE;
    ctx.beginPath();
    ctx.arc(robot.baseX, robot.baseY, ROBOT_CONFIG.BASE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Base inner ring
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.arc(robot.baseX, robot.baseY, ROBOT_CONFIG.BASE_RADIUS * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Gripper
    ctx.save();
    ctx.translate(robot.armX, robot.armY);
    ctx.rotate((robot.rotation * Math.PI) / 180);

    const gs = ROBOT_CONFIG.GRIPPER_SIZE;
    const openAngle = robot.gripperOpen ? 0.4 : 0.05;

    // Left finger
    ctx.fillStyle = robot.grippedObject ? COLORS.ROBOT_ACTIVE : COLORS.ROBOT_GRIPPER;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-gs * openAngle * 2, -gs);
    ctx.lineTo(gs * 0.15, -gs);
    ctx.closePath();
    ctx.fill();

    // Right finger
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(gs * openAngle * 2, -gs);
    ctx.lineTo(-gs * 0.15, -gs);
    ctx.closePath();
    ctx.fill();

    // Center dot
    ctx.fillStyle = robot.isMoving ? COLORS.ROBOT_ACTIVE : COLORS.ROBOT_GRIPPER;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Coordinates label
    ctx.font = '9px monospace';
    ctx.fillStyle = COLORS.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.fillText(
      `(${Math.round(robot.armX)}, ${Math.round(robot.armY)})`,
      robot.armX, robot.armY + 28
    );
  }

  drawNotifications() {
    const ctx = this.ctx;
    this.notifications = this.notifications.filter(n => n.life > 0);
    this.notifications.forEach(n => {
      n.life--;
      n.y -= 0.5;
      ctx.globalAlpha = n.life / n.maxLife;
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = n.color || COLORS.ROBOT_ACTIVE;
      ctx.textAlign = 'center';
      ctx.fillText(n.text, n.x, n.y);
    });
    ctx.globalAlpha = 1;
  }

  addNotification(text, x, y, color) {
    this.notifications.push({ text, x, y, color, life: 60, maxLife: 60 });
  }

  drawHUD(state) {
    const ctx = this.ctx;
    // Top-left: elapsed time
    ctx.font = '11px monospace';
    ctx.fillStyle = COLORS.TEXT_DIM;
    ctx.textAlign = 'left';
    ctx.fillText(`T+${state.elapsed}s`, 10, 18);

    // Top-right: robot status
    if (state.robot) {
      ctx.textAlign = 'right';
      const batteryColor = state.robot.battery > 50 ? COLORS.SUCCESS :
                           state.robot.battery > 20 ? COLORS.WARNING : COLORS.ERROR;
      ctx.fillStyle = batteryColor;
      ctx.fillText(`\u{1F50B} ${state.robot.battery.toFixed(0)}%`, GRID.WIDTH - 10, 18);
      ctx.fillStyle = COLORS.TEXT_DIM;
      ctx.fillText(`${state.robot.temperature.toFixed(0)}\u00B0C`, GRID.WIDTH - 70, 18);
    }

    // Bottom: MCP Arena watermark
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
    ctx.textAlign = 'center';
    ctx.fillText('MCP ARENA \u00B7 Simulation Layer', GRID.WIDTH / 2, GRID.HEIGHT - 8);
  }

  render(world) {
    this.time++;
    this.clear();
    this.drawGrid();

    const state = world.getState();
    this.drawTargetZones(world.targetZones);
    this.drawObjects(world.objects);
    this.drawRobot(world.robot);
    this.drawNotifications();
    this.drawHUD(state);
  }
}
