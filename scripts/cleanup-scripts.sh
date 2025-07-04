#!/bin/bash

# Define the directory containing the scripts
SCRIPTS_DIR=$(dirname "$0")

# List of scripts to keep
KEEP_SCRIPTS=(
    "fix-browser-deps.cjs"
    "fix-pg-module.cjs"
    "check-frontend-imports.mjs"
    "check-server-status.mjs"
    "migrate-config.cjs"
    "final-cleanup.ps1"
    "cleanup-scripts.sh"
    "keep-scripts.txt"
    "node_modules"
    "package.json"
    "tsconfig.json"
)

echo "Starting script cleanup process..."
echo "Scripts to keep:"
for script in "${KEEP_SCRIPTS[@]}"; do
    echo "  - $script"
done

# Get all files in the scripts directory
cd "$SCRIPTS_DIR" || exit

# Loop through all files and delete those not in the keep list
for file in *; do
    # Check if the file is in the keep list
    keep=false
    for keep_script in "${KEEP_SCRIPTS[@]}"; do
        if [ "$file" = "$keep_script" ]; then
            keep=true
            break
        fi
    done
    
    # Delete the file if it's not in the keep list
    if [ "$keep" = false ]; then
        echo "Removing script: $file"
        rm -f "$file"
    fi
done

echo "Script cleanup completed successfully!"
