#!/bin/bash
# Start both backend and frontend servers

echo "=========================================="
echo "Starting MedTech Platform - Full System"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Start Backend
echo -e "\n${YELLOW}1. Checking Backend (Port 3001)...${NC}"
if check_port 3001; then
    echo -e "${GREEN}✅ Backend already running on port 3001${NC}"
else
    echo "Configuring backend..."
    cd backend
    
    # Check for .env
    if [ ! -f ".env" ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
    fi
    
    # Check for dependencies (simple check for fastapi)
    if ! python3 -c "import fastapi" > /dev/null 2>&1; then
        echo "Installing backend dependencies..."
        pip install -r requirements.txt
    fi
    
    echo "Starting backend server..."
    python3 app.py > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
    cd ..
    
    # Wait for backend to be ready
    echo "Waiting for backend to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend is ready!${NC}"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ Backend failed to start${NC}"
            exit 1
        fi
    done
fi

# Start Frontend
echo -e "\n${YELLOW}2. Checking Frontend (Port 8080)...${NC}"
if check_port 8080; then
    echo -e "${GREEN}✅ Frontend already running on port 8080${NC}"
else
    echo "Starting frontend server..."
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install
    fi
    
    npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend.pid
    echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
    
    # Wait for frontend to be ready
    echo "Waiting for frontend to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:8080 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Frontend is ready!${NC}"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            echo -e "${YELLOW}⚠️  Frontend may still be starting...${NC}"
        fi
    done
fi

# Summary
echo -e "\n${GREEN}=========================================="
echo "✅ SYSTEM STATUS"
echo "==========================================${NC}"
echo -e "${GREEN}Backend:${NC}  http://localhost:3001"
echo -e "${GREEN}Frontend:${NC} http://localhost:8080"
echo -e "${GREEN}API Docs:${NC} http://localhost:3001/docs"
echo ""
echo -e "${YELLOW}To stop servers:${NC}"
echo "  ./stop_full_system.sh"
echo "  or kill processes in backend.pid and frontend.pid"
echo -e "${GREEN}==========================================${NC}"

