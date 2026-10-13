#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
USER_NAME="$(whoami)"
PLIST_LABEL="com.${USER_NAME}.movacar"
PLIST_DEST="${HOME}/Library/LaunchAgents/${PLIST_LABEL}.plist"

echo "Setting up Movacar background LaunchAgent..."
mkdir -p "${HOME}/Library/LaunchAgents"

cat <<EOF > "${PLIST_DEST}"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_LABEL}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${PROJECT_ROOT}/scripts/run_movacar.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>21600</integer>
    <key>RunAtLoad</key>
    <false/>
</dict>
</plist>
EOF

echo "Written to: ${PLIST_DEST}"
echo "Loading into launchctl..."
launchctl unload "${PLIST_DEST}" 2>/dev/null || true
launchctl load "${PLIST_DEST}"

echo "Registered and scheduled ${PLIST_LABEL} (runs every 6 hours)."
echo "Status check: launchctl list | grep movacar"
