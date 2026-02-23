// MCP Arena - sim-robot MCP Server
// Exposes robot arm control as MCP tools

import { defineTool } from '../types.js';

export class SimRobotServer {
  constructor(world) {
    this.world = world;
    this.name = 'sim-robot';
    this.description = 'Simulated robotic arm controller via MCP';
  }

  getTools() {
    return [
      defineTool('move', 'Move the robot arm to target coordinates (x, y)', {
        type: 'object',
        properties: {
          x: { type: 'number', description: 'Target X coordinate (0-800)' },
          y: { type: 'number', description: 'Target Y coordinate (0-500)' },
        },
        required: ['x', 'y'],
      }),
      defineTool('grab', 'Grab an object by its ID. Robot must be within 60px of the object.', {
        type: 'object',
        properties: {
          target_id: { type: 'string', description: 'ID of the object to grab' },
        },
        required: ['target_id'],
      }),
      defineTool('scan', 'Scan the workspace. Returns all visible objects with positions, sizes, and properties.', {
        type: 'object',
        properties: {},
      }),
      defineTool('rotate', 'Rotate the gripper by specified degrees.', {
        type: 'object',
        properties: {
          angle: { type: 'number', description: 'Rotation angle in degrees' },
        },
        required: ['angle'],
      }),
      defineTool('release', 'Release the currently held object.', {
        type: 'object',
        properties: {},
      }),
      defineTool('status', 'Get current robot status including position, battery, temperature.', {
        type: 'object',
        properties: {},
      }),
    ];
  }

  getResources() {
    return [
      { uri: 'sim-robot://state', name: 'Robot State', description: 'Current robot position, gripper, battery' },
      { uri: 'sim-robot://world', name: 'World Map', description: '2D grid with obstacles and zones' },
      { uri: 'sim-robot://objects', name: 'Object Catalog', description: 'All objects in workspace' },
    ];
  }

  async executeTool(toolName, params) {
    const robot = this.world.robot;
    if (!robot) throw new Error('Robot not initialized');

    switch (toolName) {
      case 'move': {
        const { x, y } = params;
        if (x < 0 || x > 800 || y < 0 || y > 500) {
          return { success: false, error: 'Coordinates out of bounds (0-800, 0-500)' };
        }
        robot.moveTo(x, y);
        this.world.addEvent('robot_move', { x, y });
        const dist = Math.sqrt((robot.armX - x) ** 2 + (robot.armY - y) ** 2);
        return {
          success: true,
          message: `Moving to (${x}, ${y})`,
          estimated_duration_ms: Math.round(dist / 4 * 16),
          from: { x: Math.round(robot.armX), y: Math.round(robot.armY) },
          to: { x, y },
        };
      }

      case 'grab': {
        const obj = this.world.getObject(params.target_id);
        if (!obj) {
          return { success: false, error: `Object "${params.target_id}" not found` };
        }
        const dist = obj.distanceTo(robot.armX, robot.armY);
        if (dist > 60) {
          return {
            success: false,
            error: `Too far from object. Distance: ${dist.toFixed(0)}px (max: 60px). Move closer first.`,
            current_position: robot.position,
            object_position: { x: obj.x, y: obj.y },
          };
        }
        if (robot.grippedObject) {
          return { success: false, error: `Already holding "${robot.grippedObject.id}". Release first.` };
        }
        const grabbed = robot.grab(obj);
        this.world.addEvent('robot_grab', { objectId: obj.id });
        return {
          success: grabbed,
          message: grabbed ? `Grabbed "${obj.label}" (${obj.weight}kg)` : 'Grab failed',
          object: obj.toJSON(),
        };
      }

      case 'scan': {
        robot.startScan();
        this.world.addEvent('robot_scan', {});
        const objects = this.world.objects.map(o => ({
          ...o.toJSON(),
          distance_from_robot: o.distanceTo(robot.armX, robot.armY).toFixed(0),
          reachable: o.distanceTo(robot.armX, robot.armY) <= 60,
        }));
        const zones = this.world.targetZones.map(z => ({
          id: z.id, label: z.label,
          position: { x: z.x, y: z.y },
          size: { width: z.width, height: z.height },
          fulfilled: z.fulfilled,
          accepts_object: z.acceptsId,
        }));
        return {
          success: true,
          objects,
          target_zones: zones,
          robot_position: robot.position,
          message: `Scan complete. Found ${objects.length} objects and ${zones.length} target zones.`,
        };
      }

      case 'rotate': {
        robot.rotateTo(params.angle);
        this.world.addEvent('robot_rotate', { angle: params.angle });
        return {
          success: true,
          message: `Rotating to ${params.angle} degrees`,
          rotation: params.angle,
        };
      }

      case 'release': {
        const held = robot.grippedObject?.id;
        robot.release();
        this.world.addEvent('robot_release', { objectId: held });
        return {
          success: true,
          message: held ? `Released "${held}"` : 'Nothing to release',
        };
      }

      case 'status': {
        return {
          success: true,
          ...robot.toJSON(),
          message: `Robot at (${Math.round(robot.armX)}, ${Math.round(robot.armY)}), ` +
                   `battery: ${robot.battery.toFixed(0)}%, ` +
                   `holding: ${robot.grippedObject?.label || 'nothing'}`,
        };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  }
}
