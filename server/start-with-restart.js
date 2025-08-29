const { spawn } = require('child_process');
const path = require('path');

let restartCount = 0;
const MAX_RESTARTS = 10;

function startServer() {
    console.log('\n� Starting/Restarting WhatsApp MCP Server...');

    const server = spawn('node', ['dist/main.js'], {
        stdio: 'inherit',
        env: {
            ...process.env,
            PRESERVE_AUTH: 'true' // Add this flag to prevent auth cleanup
        }
    });

    server.on('exit', (code) => {
        if (code === 0) { // Clean exit, restart requested
            console.log('♻️  Server requested restart...');
            if (restartCount < MAX_RESTARTS) {
                restartCount++;
                console.log(`🔄 Restarting server (attempt ${restartCount}/${MAX_RESTARTS})...`);
                setTimeout(startServer, 2000); // Wait 2 seconds before restarting
            } else {
                console.log('❌ Maximum restart attempts reached. Please check your WhatsApp connection.');
                process.exit(1);
            }
        } else {
            console.log(`❌ Server exited with code ${code}`);
            process.exit(code);
        }
    });

    return server;
}

// Handle termination signals
['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, () => {
        console.log(`\n🛑 Received ${signal}, shutting down...`);
        process.exit(0);
    });
});

startServer();