#!/usr/bin/env bash
set -euo pipefail

# Set up log directory in user's Library
LOG_DIR="${HOME}/Library/Logs/movacar"
mkdir -p "${LOG_DIR}"

# Redirect stdout and stderr for launchd execution
exec >> "${LOG_DIR}/launchd_stdout.log" 2>> "${LOG_DIR}/launchd_stderr.log"

# Resolve script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Ensure PATH includes common Node / NVM paths and system binaries
export PATH="${HOME}/.nvm/versions/node/v24.11.1/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH}"

LOG_FILE="${LOG_DIR}/scraper.log"

echo "=== Movacar Scraper Run started at $(date -u '+%Y-%m-%dT%H:%M:%SZ') ===" >> "${LOG_FILE}"

cd "${PROJECT_ROOT}"

# Run Movacar scraper using Node
node src/movacar/index.js >> "${LOG_FILE}" 2>&1

echo "=== Movacar Scraper Run finished at $(date -u '+%Y-%m-%dT%H:%M:%SZ') ===" >> "${LOG_FILE}"
