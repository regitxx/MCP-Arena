// MCP Arena — Runtime Care Server
// Caregiver notification, scheduling, and care team management
// Demo: logs to console. Real: sends webhooks/emails

export class MCPCareServer {
  constructor() {
    this.name = 'mcp-care';
    this.description = 'Caregiver notification, scheduling, and care notes';
    this.notifications = [];
    this.appointments = [];
    this.careTeam = this._getDefaultCareTeam();
  }

  getTools() {
    return [
      {
        name: 'notify_caregiver',
        description: 'Send a notification to the primary caregiver',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            urgency: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            message: { type: 'string' },
            type: { type: 'string', enum: ['info', 'concern', 'alert', 'emergency'], default: 'info' },
          },
          required: ['userId', 'message'],
        },
      },
      {
        name: 'schedule_appointment',
        description: 'Schedule or note an upcoming appointment',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            type: { type: 'string', description: 'Appointment type (doctor, physio, social, etc.)' },
            date: { type: 'string', description: 'Date/time description' },
            notes: { type: 'string' },
            remindBefore: { type: 'number', default: 60, description: 'Minutes before to remind' },
          },
          required: ['userId', 'type', 'date'],
        },
      },
      {
        name: 'draft_care_notes',
        description: 'Generate care notes from recent interactions',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            period: { type: 'string', default: 'today', description: 'Time period: today, week, month' },
            includeEmotions: { type: 'boolean', default: true },
            includeTopics: { type: 'boolean', default: true },
          },
          required: ['userId'],
        },
      },
      {
        name: 'get_care_team',
        description: 'Get the care team for a user',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
      },
      {
        name: 'get_notifications',
        description: 'Get recent notifications sent',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            limit: { type: 'number', default: 20 },
          },
          required: ['userId'],
        },
      },
    ];
  }

  async executeTool(toolName, params) {
    switch (toolName) {
      case 'notify_caregiver': {
        const notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          userId: params.userId,
          urgency: params.urgency || 'medium',
          type: params.type || 'info',
          message: params.message,
          timestamp: Date.now(),
          delivered: false, // Demo mode: not actually sent
          deliveryMethod: 'console', // Would be 'webhook', 'email', 'sms' in production
        };

        this.notifications.push(notification);
        console.log(`[MCP-CARE] Notification (${notification.urgency}): ${notification.message}`);

        // In production, would send via webhook/email/SMS
        return {
          notificationId: notification.id,
          status: 'queued',
          urgency: notification.urgency,
          mode: 'demo',
          note: 'In production, this would be sent to the caregiver via their preferred channel',
        };
      }

      case 'schedule_appointment': {
        const appointment = {
          id: `appt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          userId: params.userId,
          type: params.type,
          date: params.date,
          notes: params.notes || '',
          remindBefore: params.remindBefore || 60,
          createdAt: Date.now(),
          status: 'scheduled',
        };

        this.appointments.push(appointment);
        return {
          appointmentId: appointment.id,
          status: 'scheduled',
          type: appointment.type,
          date: appointment.date,
          reminder: `${appointment.remindBefore} minutes before`,
        };
      }

      case 'draft_care_notes': {
        // In production, would pull from memory server
        const notes = this._generateDemoCareNotes(params.userId, params.period || 'today');
        return {
          userId: params.userId,
          period: params.period || 'today',
          notes,
          generatedAt: new Date().toISOString(),
          mode: 'demo',
        };
      }

      case 'get_care_team': {
        return {
          userId: params.userId,
          team: this.careTeam,
          totalMembers: this.careTeam.length,
        };
      }

      case 'get_notifications': {
        const userNotifs = this.notifications
          .filter(n => n.userId === params.userId)
          .slice(-(params.limit || 20));
        return {
          count: userNotifs.length,
          notifications: userNotifs,
        };
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }

  _getDefaultCareTeam() {
    return [
      { role: 'primary_caregiver', name: 'Demo Caregiver', contact: 'caregiver@example.com', notifyPreference: 'email' },
      { role: 'doctor', name: 'Dr. Demo', contact: 'doctor@example.com', notifyPreference: 'portal' },
      { role: 'family', name: 'Family Member', contact: 'family@example.com', notifyPreference: 'sms' },
    ];
  }

  _generateDemoCareNotes(userId, period) {
    return {
      summary: `Care notes for user ${userId} (${period})`,
      observations: [
        'User engaged in 3 conversations today',
        'Primary emotions detected: loneliness (2x), contentment (1x)',
        'No safety concerns flagged',
        'User mentioned missing family member once',
      ],
      recommendations: [
        'Consider scheduling a video call with family',
        'Morning conversations show higher engagement',
        'User responds well to reminiscence topics',
      ],
      alerts: [],
    };
  }
}
