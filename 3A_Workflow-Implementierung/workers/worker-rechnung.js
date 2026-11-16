/**
 * Worker 2: rechnung-erstellen
 * Prozess: P2 – Leistungserbringung
 * Task:    P2_T8 "Rechnung automatisiert erstellen"
 *
 * REST-Call: Frankfurter API (api.frankfurter.app) – kostenlos, kein API-Key.
 * Ruft aktuelle EUR-Wechselkurse ab und berechnet den Rechnungsbetrag.
 */

const axios = require('axios');

const CAMUNDA_URL = 'http://localhost:8080/engine-rest';
const BASIC_AUTH = { username: 'demo', password: 'demo' };

const ERP_RATES_URL = 'https://api.frankfurter.app/latest?from=EUR&to=USD,CHF';

const EINMALAUFTRAG_PREIS_PRO_QM = 12.50; // EUR/m²
const JAHRESVERTRAG_MONATSPAUSCHALE = 350; // EUR/Monat

async function fetchAndLock() {
  const payload = {
    workerId: 'rechnung-worker-1',
    maxTasks: 10,
    usePriority: true,
    topics: [
      {
        topicName: 'rechnung-erstellen',
        lockDuration: 60000,
        variables: ['auftragId', 'firmenname', 'vertragTyp', 'behandelteFlaeche'],
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
    console.error('[Rechnung] fetchAndLock Fehler:', err.message);
    return [];
  }
}

async function completeTask(taskId, variables) {
  try {
    await axios.post(
      `${CAMUNDA_URL}/external-task/${taskId}/complete`,
      { workerId: 'rechnung-worker-1', variables },
      { auth: BASIC_AUTH }
    );
    console.log(`[Rechnung] Task ${taskId} abgeschlossen ✓`);
  } catch (err) {
    console.error('[Rechnung] Fehler beim Complete:', err.message);
  }
}

async function mainLoop() {
  console.log('[Rechnung] Worker gestartet – Topic: "rechnung-erstellen"');

  while (true) {
    const tasks = await fetchAndLock();

    for (const task of tasks) {
      console.log(`[Rechnung] Task erhalten – ID: ${task.id}`);

      const vars = task.variables || {};
      const auftragId = vars.auftragId?.value || 'AU-UNBEKANNT';
      const firmenname = vars.firmenname?.value || 'Unbekannt';
      const vertragTyp = vars.vertragTyp?.value || 'einmalauftrag';
      const behandelteFlaeche = parseFloat(vars.behandelteFlaeche?.value || '50');

      console.log(`[Rechnung] Erstelle Rechnung für ${auftragId}, Typ: ${vertragTyp}`);

      try {
        // REST-Call: Wechselkurse abrufen (ERP-Simulation)
        const ratesResponse = await axios.get(ERP_RATES_URL);
        const rates = ratesResponse.data.rates;
        const basisDatum = ratesResponse.data.date;

        console.log(`[Rechnung] Wechselkurse abgerufen (${basisDatum}): USD=${rates.USD}, CHF=${rates.CHF}`);

        // Rechnungsbetrag berechnen
        let betragEUR;
        if (vertragTyp === 'jahresvertrag') {
          betragEUR = JAHRESVERTRAG_MONATSPAUSCHALE;
        } else {
          betragEUR = Math.round(behandelteFlaeche * EINMALAUFTRAG_PREIS_PRO_QM * 100) / 100;
        }

        const rechnungsId = `RE-${auftragId}-${Date.now()}`;
        console.log(`[Rechnung] Rechnungs-ID: ${rechnungsId}, Betrag: ${betragEUR} EUR`);

        await completeTask(task.id, {
          rechnungsId: { value: rechnungsId, type: 'String' },
          rechnungsBetragEUR: { value: betragEUR, type: 'Double' },
          rechnungsWaehrung: { value: 'EUR', type: 'String' },
          wechselkursUSD: { value: rates.USD, type: 'Double' },
          rechnungsDatum: { value: basisDatum, type: 'String' },
          rechnungsStatus: { value: 'Erstellt', type: 'String' },
        });
      } catch (err) {
        console.error('[Rechnung] Fehler bei REST-Call:', err.message);
      }
    }

    if (tasks.length === 0) {
      process.stdout.write('.');
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

mainLoop();
