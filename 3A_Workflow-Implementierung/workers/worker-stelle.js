/**
 * Worker 3: stelle-veroeffentlichen
 * Prozess: P4 – Recruiting und Mitarbeitereinstellung
 * Task:    P4_T2 "Stelle auf Plattformen veröffentlichen"
 *
 * REST-Call: GitHub Issues API – dient als internes Bewerbermanagement-/
 * Tracking-Board fuer neue Stellenausschreibungen (Ersatz fuer die urspruenglich
 * in Aufgabe 2 genannte LinkedIn-API, da deren Partner-API fuer Studierende
 * nicht zugaenglich ist).
 */

require('dotenv').config();
const axios = require('axios');

const CAMUNDA_URL = 'http://localhost:8080/engine-rest';
const BASIC_AUTH = { username: 'demo', password: 'demo' };

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/issues`;

if (!GITHUB_TOKEN || !GITHUB_REPO) {
  console.error('[Stelle] Fehler: GITHUB_TOKEN oder GITHUB_REPO fehlt in .env');
  process.exit(1);
}

async function fetchAndLock() {
  const payload = {
    workerId: 'stelle-worker-1',
    maxTasks: 10,
    usePriority: true,
    topics: [
      {
        topicName: 'stelle-veroeffentlichen',
        lockDuration: 60000,
        variables: ['stelle', 'einsatzort', 'anzahlStellen', 'meldungDurch'],
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
    console.error('[Stelle] fetchAndLock Fehler:', err.message);
    return [];
  }
}

async function completeTask(taskId, variables) {
  try {
    await axios.post(
      `${CAMUNDA_URL}/external-task/${taskId}/complete`,
      { workerId: 'stelle-worker-1', variables },
      { auth: BASIC_AUTH }
    );
    console.log(`[Stelle] Task ${taskId} abgeschlossen ✓`);
  } catch (err) {
    console.error('[Stelle] Fehler beim Complete:', err.message);
  }
}

async function mainLoop() {
  console.log('[Stelle] Worker gestartet – Topic: "stelle-veroeffentlichen"');

  while (true) {
    const tasks = await fetchAndLock();

    for (const task of tasks) {
      console.log(`[Stelle] Task erhalten – ID: ${task.id}`);

      const vars = task.variables || {};
      const stelle = vars.stelle?.value || 'Schädlingsbekämpfer/in';
      const einsatzort = vars.einsatzort?.value || 'Berlin';
      const anzahlStellen = vars.anzahlStellen?.value || 1;
      const meldungDurch = vars.meldungDurch?.value || 'Fachbereichsleitung';

      console.log(`[Stelle] Veröffentliche "${stelle}" in ${einsatzort}`);

      try {
        // REST-Call an GitHub Issues API (echtes internes Tracking-Board)
        const response = await axios.post(
          GITHUB_API_URL,
          {
            title: `${stelle} (${einsatzort})`,
            body: `PestPro GmbH sucht ${anzahlStellen}x ${stelle}. Gemeldet von: ${meldungDurch}.`,
            labels: ['offen', `Einsatzort:${einsatzort}`],
          },
          {
            headers: {
              Authorization: `Bearer ${GITHUB_TOKEN}`,
              Accept: 'application/vnd.github+json',
            },
          }
        );

        const anzeigenId = `ISSUE-${response.data.number}`;
        const anzeigenUrl = response.data.html_url;
        const heute = new Date().toISOString().split('T')[0];

        console.log(`[Stelle] Anzeige erstellt – ${anzeigenId} (${anzeigenUrl})`);

        await completeTask(task.id, {
          anzeigenId: { value: anzeigenId, type: 'String' },
          anzeigenUrl: { value: anzeigenUrl, type: 'String' },
          veroeffentlichtAuf: { value: 'GitHub Issues (intern)', type: 'String' },
          veroeffentlichtAm: { value: heute, type: 'String' },
          anzeigenStatus: { value: 'Aktiv', type: 'String' },
        });
      } catch (err) {
        console.error('[Stelle] Fehler bei REST-Call:', err.message);
      }
    }

    if (tasks.length === 0) {
      process.stdout.write('.');
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

mainLoop();
