#!/bin/sh
# Numera Production Run Script
# Compatible with both Bash and Fish shells.

# 1. Ensure Python virtual environment exists
[ ! -d "venv" ] && python3 -m venv venv

# 2. Install/verify dependencies
./venv/bin/pip install -r requirements.txt

# 3. Delegate to python3 to run uvicorn with environment variable overrides.
# Using python's execvp avoids shell-specific syntax and delegates directly to Uvicorn.
./venv/bin/python3 -c '
import os
uvicorn_path = os.path.join("venv", "bin", "uvicorn")
host = os.environ.get("NUMERA_HOST", "0.0.0.0")
port = os.environ.get("NUMERA_PORT", "9025")
print(f"Starting Numera on http://{host}:{port}")
os.execvp(uvicorn_path, [uvicorn_path, "main:app", "--host", host, "--port", port])
'
