#!/usr/bin/env node
import { createInterface } from 'node:readline';
import { sendEmail } from './send-email.js';

const SUPPORTED_TOOLS = [
  {
    name: 'send_email',
    description: 'Send an email via SMTP (Gmail, Outlook, or any SMTP server)',
    inputSchema: {
      type: 'object',
      properties: {
        to:        { type: 'string', description: 'Recipient email address' },
        subject:   { type: 'string', description: 'Email subject' },
        body:      { type: 'string', description: 'Email body (plain text or HTML)' },
        cc:        { type: 'string', description: 'CC recipient (comma-separated)' },
        bcc:       { type: 'string', description: 'BCC recipient (comma-separated)' },
        html:      { type: 'boolean', description: 'Set to true if body is HTML' },
        attachments: { type: 'array', items: { type: 'string' }, description: 'File paths to attach' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
];

async function handleRequest(msg) {
  const { id, method, params } = msg;

  switch (method) {
    case 'initialize':
      return {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'mcp-email', version: '1.0.0' },
      };

    case 'tools/list':
      return { tools: SUPPORTED_TOOLS };

    case 'tools/call': {
      const { name, arguments: args } = params;
      if (name !== 'send_email') {
        throw { code: -32601, message: `Unknown tool: ${name}` };
      }
      const result = await sendEmail({
        to: args.to,
        subject: args.subject,
        body: args.body,
        cc: args.cc,
        bcc: args.bcc,
        html: args.html || false,
        attachments: args.attachments,
      });
      return {
        content: [{ type: 'text', text: `Email sent: ${result.messageId}` }],
      };
    }

    case 'notifications/initialized':
      return null;

    default:
      throw { code: -32601, message: `Unknown method: ${method}` };
  }
}

const rl = createInterface({ input: process.stdin });

rl.on('line', async (line) => {
  try {
    const msg = JSON.parse(line);
    if (msg.jsonrpc !== '2.0' || !msg.method) return;

    const result = await handleRequest(msg);
    if (result !== null) {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result }) + '\n');
    }
  } catch (err) {
    const code = err.code || -32603;
    const message = err.message || 'Internal error';
    process.stdout.write(JSON.stringify({
      jsonrpc: '2.0', id: msg?.id || null,
      error: { code, message },
    }) + '\n');
  }
});
