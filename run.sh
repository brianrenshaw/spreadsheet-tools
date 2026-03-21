#!/bin/bash
# Start the Spreadsheet Tools webapp
# All processing happens in the browser — this just serves the static files.

set -e
cd "$(dirname "$0")/frontend"

# Build if dist doesn't exist
if [ ! -d "dist" ]; then
    echo "Building frontend..."
    npm run build
fi

echo ""
echo "Spreadsheet Tools running at:"
echo "  Local:   http://localhost:8080"
echo "  Network: http://$(ipconfig getifaddr en0 2>/dev/null || echo '<your-ip>'):8080"
echo ""
echo "All file processing happens in the browser. No data is uploaded."
echo "Press Ctrl+C to stop."
echo ""
npx serve dist -l 8080
