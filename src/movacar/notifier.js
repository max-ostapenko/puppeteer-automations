const { execFile } = require('child_process');
const https = require('https');
const http = require('http');
const path = require('path');

const REPORT_FILE_PATH = path.resolve(__dirname, 'index.html');
const REPORT_FILE_URL = `file://${REPORT_FILE_PATH}`;

/**
 * Open the HTML report in Google Chrome.
 */
function openReportInChrome(reportUrl = REPORT_FILE_URL) {
  return new Promise((resolve) => {
    execFile('open', [reportUrl], (error) => {
      if (error) {
        console.warn('Could not open in Google Chrome, attempting default browser:', error.message);
        execFile('open', [reportUrl], () => resolve());
      } else {
        console.log(`Opened HTML report in Google Chrome: ${reportUrl}`);
        resolve();
      }
    });
  });
}

/**
 * Dispatch desktop notification via macOS AppleScript.
 */
function sendMacOSNotification(title, message, sound = 'Submarine') {
  return new Promise((resolve) => {
    const escapedMsg = message.replace(/["\\]/g, '\\$&');
    const escapedTitle = title.replace(/["\\]/g, '\\$&');
    const script = `display notification "${escapedMsg}" with title "${escapedTitle}" sound name "${sound}"`;

    execFile('osascript', ['-e', script], (error) => {
      if (error) {
        console.error('Failed to send macOS notification:', error.message);
      }
      resolve();
    });
  });
}

/**
 * Optionally send webhook payload if MOVACAR_WEBHOOK_URL is set.
 */
async function sendWebhookNotification(webhookUrl, payload) {
  return new Promise((resolve) => {
    try {
      const url = new URL(webhookUrl);
      const postData = JSON.stringify(payload);
      const client = url.protocol === 'https:' ? https : http;

      const req = client.request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
          timeout: 5000,
        },
        (res) => {
          res.resume();
          resolve();
        }
      );

      req.on('error', (err) => {
        console.error('Webhook notification error:', err.message);
        resolve();
      });

      req.write(postData);
      req.end();
    } catch (e) {
      console.error('Invalid webhook URL:', e.message);
      resolve();
    }
  });
}

/**
 * Format duration string with included days prominently displayed.
 */
function formatDuration(offer) {
  const inc =
    offer.includedDaysNum !== undefined
      ? offer.includedDaysNum
      : offer.includedDays
      ? parseInt(offer.includedDays, 10) || 0
      : 0;
  const extra =
    offer.extraDaysNum !== undefined
      ? offer.extraDaysNum
      : offer.extraDays
      ? parseInt(offer.extraDays, 10) || 0
      : 0;

  const tot = offer.totalDays !== undefined ? offer.totalDays : inc + extra;
  if (inc > 0 && extra > 0) {
    return `${inc}d incl. (+${extra}d extra, ${tot}d total)`;
  }
  if (inc > 0) {
    return `${inc}d incl.`;
  }
  if (tot) {
    return `${tot}d total`;
  }
  return offer.includedDays || '';
}

/**
 * Notify the user of newly discovered matching offers.
 * @param {Array<Object>} newOffers - List of newly found offers
 */
async function notifyOffers(newOffers) {
  if (!newOffers || newOffers.length === 0) {
    console.log('No new matching offers to alert.');
    return;
  }

  // Sort with highest included days first, then total days (extra as nice-to-have), then price
  const sortedOffers = [...newOffers].sort((a, b) => {
    const incA =
      a.includedDaysNum !== undefined
        ? a.includedDaysNum
        : a.includedDays
        ? parseInt(a.includedDays, 10) || 0
        : 0;
    const incB =
      b.includedDaysNum !== undefined
        ? b.includedDaysNum
        : b.includedDays
        ? parseInt(b.includedDays, 10) || 0
        : 0;
    if (incB !== incA) return incB - incA;

    const totA = a.totalDays !== undefined ? a.totalDays : incA + (a.extraDaysNum || 0);
    const totB = b.totalDays !== undefined ? b.totalDays : incB + (b.extraDaysNum || 0);
    if (totB !== totA) return totB - totA;

    const priceA = a.priceEur !== undefined ? a.priceEur : 9999;
    const priceB = b.priceEur !== undefined ? b.priceEur : 9999;
    return priceA - priceB;
  });

  console.log(`\n🔔 Alerting on ${sortedOffers.length} new matching offer(s):`);

  const webhookUrl = process.env.MOVACAR_WEBHOOK_URL;

  // Group notifications if multiple, or notify top 3 individually
  if (sortedOffers.length <= 3) {
    for (const offer of sortedOffers) {
      const durationText = formatDuration(offer);
      const tag =
        offer.matchedRules && offer.matchedRules.length > 0
          ? `[${offer.matchedRules.join(' & ')}] `
          : '';
      const title = `🚗 ${tag}${offer.origin} → ${offer.destination} (${durationText} | ${offer.price})`;
      const details = `${offer.title} (${offer.provider}) | ${offer.earliestPickup || ''} - ${
        offer.latestDelivery || ''
      } | ${offer.distance || ''}`.trim();
      console.log(`- ${title} (${offer.url})`);

      await sendMacOSNotification(title, details);

      if (webhookUrl) {
        await sendWebhookNotification(webhookUrl, {
          title,
          details,
          offer,
        });
      }
    }
  } else {
    // Summary notification prioritizing offers with the most included days
    const summaryTitle = `🚗 ${sortedOffers.length} New Matching Movacar Routes!`;
    const topRoutes = sortedOffers
      .slice(0, 3)
      .map((o) => {
        const tag = o.matchedRules && o.matchedRules[0] ? `[${o.matchedRules[0]}] ` : '';
        return `${tag}${o.origin} → ${o.destination} (${formatDuration(o)}, ${o.price})`;
      })
      .join('; ');
    const summaryMsg = `${topRoutes}... and ${sortedOffers.length - 3} more. Check destinations.json!`;
    console.log(`- ${summaryTitle}: ${summaryMsg}`);

    await sendMacOSNotification(summaryTitle, summaryMsg);

    if (webhookUrl) {
      await sendWebhookNotification(webhookUrl, {
        title: summaryTitle,
        details: summaryMsg,
        count: sortedOffers.length,
        offers: sortedOffers,
      });
    }
  }

  // Open the HTML report in Google Chrome when new matching offers are found
  await openReportInChrome();
}

module.exports = {
  sendMacOSNotification,
  sendWebhookNotification,
  openReportInChrome,
  notifyOffers,
  REPORT_FILE_URL,
};
