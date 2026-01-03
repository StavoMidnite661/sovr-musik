#!/usr/bin/env node

/**
 * Example usage of the Browser Vision MCP Server
 * 
 * This script demonstrates how to interact with the MCP server programmatically.
 * You can run this to test the server functionality.
 */

const { spawn } = require('child_process');
const path = require('path');

async function runExample() {
    console.log('🚀 Starting Browser Vision MCP Server Example...\n');

    // Start the MCP server
    const serverPath = path.join(__dirname, 'dist', 'index.js');
    const server = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe']
    });

    let responseBuffer = '';

    // Handle server output
    server.stdout.on('data', (data) => {
        responseBuffer += data.toString();
        
        // Process complete JSON-RPC messages
        let lines = responseBuffer.split('\n');
        responseBuffer = lines.pop() || ''; // Keep incomplete line for next chunk
        
        for (const line of lines) {
            if (line.trim()) {
                try {
                    const response = JSON.parse(line);
                    console.log('📨 Server Response:', JSON.stringify(response, null, 2));
                    console.log('─'.repeat(50));
                } catch (e) {
                    console.log('📨 Raw output:', line);
                }
            }
        }
    });

    server.stderr.on('data', (data) => {
        console.error('❌ Server Error:', data.toString());
    });

    server.on('close', (code) => {
        console.log(`\n🔚 Server exited with code ${code}`);
    });

    // Wait a bit for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Example MCP requests
    const examples = [
        {
            jsonrpc: "2.0",
            id: 1,
            method: "tools/list"
        },
        {
            jsonrpc: "2.0",
            id: 2,
            method: "tools/call",
            params: {
                name: "navigate_to_url",
                arguments: {
                    url: "https://example.com"
                }
            }
        },
        {
            jsonrpc: "2.0",
            id: 3,
            method: "tools/call",
            params: {
                name: "analyze_page_visual",
                arguments: {
                    analysisType: "basic"
                }
            }
        },
        {
            jsonrpc: "2.0",
            id: 4,
            method: "tools/call",
            params: {
                name: "take_screenshot",
                arguments: {
                    fullPage: false
                }
            }
        },
        {
            jsonrpc: "2.0",
            id: 5,
            method: "tools/call",
            params: {
                name: "get_page_content",
                arguments: {
                    includeHTML: false
                }
            }
        }
    ];

    console.log('📤 Sending example requests to server...\n');

    // Send requests with delays
    for (let i = 0; i < examples.length; i++) {
        const request = examples[i];
        console.log(`📤 Sending Request ${request.id}:`, request.method);
        
        server.stdin.write(JSON.stringify(request) + '\n');
        
        // Wait between requests
        if (i < examples.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // Wait a bit more for responses
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Close the server
    server.kill();

    console.log('\n✅ Example completed!');
}

// Handle command line arguments
if (require.main === module) {
    runExample().catch(console.error);
}

module.exports = { runExample };