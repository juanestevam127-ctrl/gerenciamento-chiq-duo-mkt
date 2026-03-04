const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const LOG_FILE = path.join(__dirname, 'verification_log.txt');

// Initialize log file
try {
    fs.writeFileSync(LOG_FILE, `API Verification Log - ${new Date().toISOString()}\n\n`);
} catch (e) {
    console.error("Could not write to log file:", e);
}

function log(message) {
    console.log(message);
    try {
        fs.appendFileSync(LOG_FILE, message + '\n');
    } catch (e) {
        // ignore
    }
}

async function testEndpoint(endpoint, description) {
    try {
        log(`Testing ${description} (${endpoint})...`);
        const response = await fetch(`${BASE_URL}${endpoint}`);

        if (response.status === 200) {
            const data = await response.json();
            log(`✅ Success: ${description} (Status 200)`);
            if (Array.isArray(data)) {
                log(`   - Returned ${data.length} items`);
            } else if (data && typeof data === 'object') {
                log(`   - Returned object with keys: ${Object.keys(data).join(', ')}`);
            }
            return true;
        } else {
            log(`❌ Failed: ${description} (Status ${response.status})`);
            const text = await response.text();
            log(`   - Response: ${text.substring(0, 500)}`);
            return false;
        }
    } catch (error) {
        log(`❌ Error testing ${description}: ${error.message}`);
        if (error.cause) log(`   - Cause: ${error.cause}`);
        return false;
    }
}

async function runTests() {
    log('🚀 Starting API Verification...\n');

    const results = [];

    results.push(await testEndpoint('/api/clientes', 'List Clientes'));
    results.push(await testEndpoint('/api/conteudos', 'List Conteudos'));

    // Test controle endpoint with date parameter
    const today = new Date().toISOString().split('T')[0];
    results.push(await testEndpoint(`/api/controle?date=${today}`, 'Controle Postagens'));

    log('\n--------------------------------------------------');
    if (results.every(r => r)) {
        log('✅ ALL TESTS PASSED');
        process.exit(0);
    } else {
        log('⚠️ SOME TESTS FAILED');
        process.exit(1);
    }
}

runTests();
