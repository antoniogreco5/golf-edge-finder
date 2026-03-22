import { EdgeOpportunity, EdgeTier } from '@/types';

/**
 * Send email notification via Resend API
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set, skipping email');
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Edge Finder <alerts@yourdomain.com>',
        to: [to],
        subject,
        html,
      }),
    });

    return res.ok;
  } catch (err) {
    console.error('Email send error:', err);
    return false;
  }
}

/**
 * Send push notification via ntfy.sh (free, no account needed)
 * Just subscribe to the topic on your phone's ntfy app
 */
async function sendPush(
  topic: string,
  title: string,
  message: string,
  priority: number = 3
): Promise<boolean> {
  try {
    const res = await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: {
        'Title': title,
        'Priority': String(priority),
        'Tags': 'golf,chart_with_upwards_trend',
      },
      body: message,
    });

    return res.ok;
  } catch (err) {
    console.error('Push send error:', err);
    return false;
  }
}

/**
 * Format edge for notification
 */
function formatEdgeAlert(edge: EdgeOpportunity): {
  subject: string;
  text: string;
  html: string;
  priority: number;
} {
  const emoji = edge.tier === 'strong' ? '🟢' : '🟡';
  const tierLabel = edge.tier === 'strong' ? 'STRONG EDGE' : 'PLAYABLE EDGE';

  const subject = `${tierLabel}: ${edge.player_name} ${edge.market_label} (+${edge.edge.toFixed(1)}%)`;

  const text = [
    `${tierLabel}: ${edge.player_name}`,
    `Market: ${edge.market_label}`,
    `Model: ${edge.model_prob.toFixed(1)}% | Market: ${edge.market_prob.toFixed(1)}%`,
    `Edge: +${edge.edge.toFixed(1)} pts (${edge.edge_pct.toFixed(0)}% relative)`,
    `Contract: $${(edge.contract_price / 100).toFixed(2)}`,
    `Kelly (1/4): ${(edge.quarter_kelly * 100).toFixed(1)}%`,
    `Liquidity: ${edge.liquidity_grade} | Vol: ${edge.volume}`,
    edge.is_live ? '⚡ LIVE TOURNAMENT' : '📋 Pre-Tournament',
  ].join('\n');

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
      <div style="background: ${edge.tier === 'strong' ? '#052e16' : '#422006'}; border: 1px solid ${edge.tier === 'strong' ? '#166534' : '#854d0e'}; border-radius: 12px; padding: 20px; color: white;">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: ${edge.tier === 'strong' ? '#4ade80' : '#fbbf24'}; margin-bottom: 8px;">
          ${emoji} ${tierLabel} ${edge.is_live ? '⚡ LIVE' : ''}
        </div>
        <div style="font-size: 22px; font-weight: 700; margin-bottom: 4px;">
          ${edge.player_name}
        </div>
        <div style="font-size: 14px; color: #94a3b8; margin-bottom: 16px;">
          ${edge.market_label}
        </div>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Model</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600;">${edge.model_prob.toFixed(1)}%</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Market</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600;">${edge.market_prob.toFixed(1)}%</td>
          </tr>
          <tr style="border-top: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 8px 0; color: ${edge.tier === 'strong' ? '#4ade80' : '#fbbf24'}; font-weight: 600;">Edge</td>
            <td style="padding: 8px 0; text-align: right; color: ${edge.tier === 'strong' ? '#4ade80' : '#fbbf24'}; font-weight: 700; font-size: 18px;">+${edge.edge.toFixed(1)} pts</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Contract</td>
            <td style="padding: 6px 0; text-align: right;">$${(edge.contract_price / 100).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Kelly (¼)</td>
            <td style="padding: 6px 0; text-align: right;">${(edge.quarter_kelly * 100).toFixed(1)}%</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Liquidity</td>
            <td style="padding: 6px 0; text-align: right;">${edge.liquidity_grade} (${edge.volume} vol)</td>
          </tr>
        </table>
      </div>
      <div style="font-size: 11px; color: #64748b; text-align: center; margin-top: 12px;">
        Golf Edge Finder • ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET
      </div>
    </div>
  `;

  return {
    subject,
    text,
    html,
    priority: edge.tier === 'strong' ? 4 : 3, // ntfy priority scale
  };
}

/**
 * Send alerts for qualifying edges
 */
export async function sendEdgeAlerts(
  edges: EdgeOpportunity[],
  minTier: EdgeTier = 'playable'
): Promise<{ sent: number; method: string }> {
  const tierOrder: Record<EdgeTier, number> = { strong: 0, playable: 1, monitor: 2, none: 3 };
  const qualifying = edges.filter((e) => tierOrder[e.tier] <= tierOrder[minTier]);

  if (qualifying.length === 0) return { sent: 0, method: 'none' };

  const email = process.env.ALERT_EMAIL;
  const pushTopic = process.env.NTFY_TOPIC;
  let sent = 0;
  const methods: string[] = [];

  for (const edge of qualifying) {
    const { subject, text, html, priority } = formatEdgeAlert(edge);

    if (email) {
      const ok = await sendEmail(email, subject, html);
      if (ok) sent++;
      if (!methods.includes('email')) methods.push('email');
    }

    if (pushTopic) {
      const ok = await sendPush(pushTopic, subject, text, priority);
      if (ok) sent++;
      if (!methods.includes('push')) methods.push('push');
    }
  }

  return { sent, method: methods.join('+') || 'none' };
}
