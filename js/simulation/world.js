// MCP Arena - 2D Simulation World

import { GRID, ROBOT_CONFIG } from '../types.js';

export class SimObject {
  constructor({ id, label, x, y, width, height, color, weight, type = 'box' }) {
    this.id = id;
    this.label = label;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.weight = weight;
    this.type = type;
    this.gripped = false;
    this.targetZone = null;
  }

  containsPoint(px, py) {
    return px >= this.x - this.width / 2 && px <= this.x + this.width / 2 &&
           py >= this.y - this.height / 2 && py <= this.y + this.height / 2;
  }

  distanceTo(px, py) {
    return Math.sqrt((this.x - px) ** 2 + (this.y - py) ** 2);
  }

  toJSON() {
    return {
      id: this.id, label: this.label,
      position: { x: this.x, y: this.y },
      size: { width: this.width, height: this.height },
      color: this.color, weight: this.weight, type: this.type,
    };
  }
}

export class Robot {
  constructor(x, y) {
    this.baseX = x;
    this.baseY = y;
    this.armX = x;
    this.armY = y - 60;
    this.rotation = 0; // degrees
    this.gripperOpen = true;
    this.grippedObject = null;
    this.battery = 100;
    this.temperature = 22;

    // Animation targets
    this.targetX = this.armX;
    this.targetY = this.armY;
    this.targetRotation = 0;
    this.isMoving = false;
    this.isScanning = false;
    this.scanRadius = 0;
    this.scanMaxRadius = 200;

    // Trail for visual effect
    this.trail = [];
  }

  get position() {
    return { x: this.armX, y: this.armY };
  }

  moveTo(x, y) {
    this.targetX = Math.max(30, Math.min(GRID.WIDTH - 30, x));
    this.targetY = Math.max(30, Math.min(GRID.HEIGHT - 30, y));
    this.isMoving = true;
  }

  rotateTo(degrees) {
    this.targetRotation = degrees;
    this.isMoving = true;
  }

  grab(object) {
    if (!object) return false;
    const dist = object.distanceTo(this.armX, this.armY);
    if (dist > 60) return false;
    this.grippedObject = object;
    this.gripperOpen = false;
    object.gripped = true;
    return true;
  }

  release() {
    if (this.grippedObject) {
      this.grippedObject.gripped = false;
      this.grippedObject = null;
    }
    this.gripperOpen = true;
  }

  startScan() {
    this.isScanning = true;
    this.scanRadius = 0;
  }

  update() {
    // Smooth movement
    if (this.isMoving) {
      const dx = this.targetX - this.armX;
      const dy = this.targetY - this.armY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 2) {
        const speed = ROBOT_CONFIG.MOVE_SPEED;
        this.armX += (dx / dist) * speed;
        this.armY += (dy / dist) * speed;
        this.trail.push({ x: this.armX, y: this.armY, age: 0 });
        if (this.trail.length > 30) this.trail.shift();
      } else {
        this.armX = this.targetX;
        this.armY = this.targetY;
        this.isMoving = false;
      }

      // Move gripped object
      if (this.grippedObject) {
        this.grippedObject.x = this.armX;
        this.grippedObject.y = this.armY;
      }

      // Rotation
      const dr = this.targetRotation - this.rotation;
      if (Math.abs(dr) > 1) {
        this.rotation += Math.sign(dr) * ROBOT_CONFIG.ROTATION_SPEED;
      } else {
        this.rotation = this.targetRotation;
      }

      this.battery = Math.max(0, this.battery - 0.02);
      this.temperature = Math.min(45, this.temperature + 0.01);
    }

    // Scan animation
    if (this.isScanning) {
      this.scanRadius += 5;
      if (this.scanRadius > this.scanMaxRadius) {
        this.isScanning = false;
        this.scanRadius = 0;
      }
    }

    // Age trail
    this.trail.forEach(t => t.age++);
    this.trail = this.trail.filter(t => t.age < 30);
  }

  toJSON() {
    return {
      position: this.position,
      rotation: this.rotation,
      gripperOpen: this.gripperOpen,
      grippedObject: this.grippedObject?.id || null,
      battery: this.battery,
      temperature: this.temperature,
      isMoving: this.isMoving,
    };
  }
}

export class TargetZone {
  constructor({ id, x, y, width, height, label, acceptsId }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.label = label;
    this.acceptsId = acceptsId;
    this.fulfilled = false;
  }

  containsObject(obj) {
    return Math.abs(obj.x - this.x) < this.width / 2 &&
           Math.abs(obj.y - this.y) < this.height / 2;
  }
}

export class World {
  constructor() {
    this.robot = null;
    this.objects = [];
    this.targetZones = [];
    this.events = [];
    this.startTime = Date.now();
  }

  init(taskConfig) {
    this.robot = new Robot(
      taskConfig.robot?.x || GRID.WIDTH / 2,
      taskConfig.robot?.y || GRID.HEIGHT - 80
    );

    this.objects = (taskConfig.objects || []).map(o => new SimObject(o));
    this.targetZones = (taskConfig.targetZones || []).map(z => new TargetZone(z));
    this.startTime = Date.now();
    this.events = [];
  }

  getObject(id) {
    return this.objects.find(o => o.id === id);
  }

  update() {
    if (this.robot) {
      this.robot.update();
    }
    // Check target zone fulfillment
    this.targetZones.forEach(zone => {
      const obj = this.objects.find(o => o.id === zone.acceptsId);
      if (obj && zone.containsObject(obj) && !obj.gripped) {
        zone.fulfilled = true;
      }
    });
  }

  getElapsedSeconds() {
    return ((Date.now() - this.startTime) / 1000).toFixed(1);
  }

  addEvent(type, data) {
    this.events.push({ type, data, timestamp: Date.now() });
  }

  getState() {
    return {
      robot: this.robot?.toJSON(),
      objects: this.objects.map(o => o.toJSON()),
      targetZones: this.targetZones.map(z => ({
        id: z.id, label: z.label, position: { x: z.x, y: z.y },
        size: { width: z.width, height: z.height }, fulfilled: z.fulfilled,
      })),
      elapsed: this.getElapsedSeconds(),
    };
  }
}
