#!/bin/bash
# Stop both backend and frontend servers

echo "Stopping MedTech Platform servers..."

# Stop backend
if [ -f "backend.pid" ]; then
    PID=$(cat backend.pid)
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "✅ Backend stopped (PID: $PID)"
    fi
    rm -f backend.pid
fi

# Stop frontend
if [ -f "frontend.pid" ]; then
    PID=$(cat frontend.pid)
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "✅ Frontend stopped (PID: $PID)"
    fi
    rm -f frontend.pid
fi

# Also kill by process name
pkill -f "python3 app.py" 2>/dev/null
pkill -f "vite" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null

echo "✅ All servers stopped"

