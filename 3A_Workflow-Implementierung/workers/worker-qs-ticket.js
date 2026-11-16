/**
 * Worker 1: qs-ticket-erstellen
 * Prozess: P2 – Leistungserbringung
 * Task:    P2_T4 "Bericht an QS weiterleiten"
 *
 * REST-Call: Slack (chat.postMessage) dient als technischer Stellvertreter
 * fuer das interne Ticketsystem. Der QS-Verantwortliche sieht die Anfrage im
 * Kanal und erteilt die Freigabe anschliessend ueber einen User Task in Camunda.
 * Pollt alle 5 Sekunden auf Topic "qs-ticket-erstellen".
 */

require('dotenv').config();
const axios = require('axios');

const CAMUNDA_URL = 'http://localhost:8080/engine-rest';
const BASIC_AUTH = { username: 'demo', password: 'demo' };

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL;
const SLACK_API_URL = 'https://slack.com/api/chat.postMessage';

if (!SLACK_BOT_TOKEN || !SLACK_CHANNEL) {
  console.error('[QS-Ticket] Fehler: SLACK_BOT_TOKEN oder SLACK_CHANNEL fehlt in .env');
  process.exit(1);
}

async function fetchAndLock() {
  const payload = {
    workerId: 'qs-ticket-worker-1',
    maxTasks: 10,
    usePriority: true,
    topics: [
      {
        topicName: 'qs-ticket-erstellen',
        lockDuration: 60000,
        variables: ['auftragId', 'firmenname', 'befallsart'],
      },
    ],
  };

  try {
    const response = await axios.post(
      `${CAMUNDA_URL}/external-task/fetchAndLock`,
      payload,
      { auth: BASIC_AUTH }
    );
    return response.data;
  } catch (err) {
    console.error('[QS-Ticket] fetchAndLock Fehler:', err.message);
    return [];
  }
}

async function completeTask(taskId, variables) {
  try {
    await axios.post(
      `${CAMUNDA_URL}/external-task/${taskId}/complete`,
      { workerId: 'qs-ticket-worker-1', variables },
      { auth: BASIC_AUTH }
    );
    console.log(`[QS-Ticket] Task ${taskId} abgeschlossen ✓`);
  } catch (err) {
    console.error(`[QS-Ticket] Fehler beim Complete:`, err.message);
  }
}

async function mainLoop() {
  console.log('[QS-Ticket] Worker gestartet – Topic: "qs-ticket-erstellen"');

  while (true) {
    const tasks = await fetchAndLock();

    for (const task of tasks) {
      console.log(`[QS-Ticket] Task erhalten – ID: ${task.id}`);

      const vars = task.variables || {};
      const auftragId = vars.auftragId?.value || 'AU-UNBEKANNT';
      const firmenname = vars.firmenname?.value || 'Unbekannt';
      const befallsart = vars.befallsart?.value || 'sonstige';

      console.log(`[QS-Ticket] Erstelle Ticket für Auftrag ${auftragId} (${firmenname})`);

      try {
        // REST-Call an Slack (echtes internes Ticketsystem-Surrogat)
        const response = await axios.post(
          SLACK_API_URL,
          {
            channel: SLACK_CHANNEL,
            text: `:warning: *QS-Prüfanfrage: ${auftragId}*\nKunde: ${firmenname}\nBefallsart: ${befallsart}\nSLA: 24h`,
          },
          {
            headers: {
              Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
              'Content-Type': 'application/json; charset=utf-8',
            },
          }
        );

        if (!response.data.ok) {
          throw new Error(`Slack API Fehler: ${response.data.error}`);
        }

        const qsTicketId = response.data.ts;
        console.log(`[QS-Ticket] Ticket erstellt – ID: ${qsTicketId}`);

        await completeTask(task.id, {
          qsTicketId: { value: qsTicketId, type: 'String' },
          qsStatus: { value: 'Offen', type: 'String' },
          qsErstellt: { value: new Date().toISOString(), type: 'String' },
        });
      } catch (err) {
        console.error('[QS-Ticket] Fehler bei REST-Call:', err.message);
      }
    }

    if (tasks.length === 0) {
      process.stdout.write('.');
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

mainLoop();
