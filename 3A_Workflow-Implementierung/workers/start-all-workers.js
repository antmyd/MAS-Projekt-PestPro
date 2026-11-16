/**
 * Startet alle drei External Task Worker gleichzeitig.
 * Ausführen mit: node start-all-workers.js
 *
 * Voraussetzung: Camunda Run läuft auf http://localhost:8080
 */

console.log('=== PestPro GmbH – External Task Workers ===');
console.log('Starte alle 3 Worker...\n');

require('./worker-qs-ticket');
require('./worker-rechnung');
require('./worker-stelle');
