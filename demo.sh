#!/bin/bash

# VR Classroom Demo Script
# Auto-launches server and multiple client windows for easy testing
# Usage: bash demo.sh

set -e

SERVER_PORT=3001
CLIENT_PORT=3000

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║       VR Classroom Multi-User Demo - Quick Launcher        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if server is already running
if lsof -Pi :${SERVER_PORT} -sTCP:LISTEN -t >/dev/null; then
    echo -e "${YELLOW}⚠️  Server already running on port ${SERVER_PORT}${NC}"
else
    echo -e "${GREEN}✓ Starting VR Server on port ${SERVER_PORT}...${NC}"
    cd server
    npm install > /dev/null 2>&1
    npm start &
    SERVER_PID=$!
    cd ..
    sleep 2
    echo -e "${GREEN}✓ Server started (PID: $SERVER_PID)${NC}"
fi

# Check if client is already running
if lsof -Pi :${CLIENT_PORT} -sTCP:LISTEN -t >/dev/null; then
    echo -e "${YELLOW}⚠️  Client already running on port ${CLIENT_PORT}${NC}"
else
    echo -e "${GREEN}✓ Starting Next.js Client on port ${CLIENT_PORT}...${NC}"
    npm install > /dev/null 2>&1
    npm run dev > /dev/null 2>&1 &
    CLIENT_PID=$!
    sleep 4
    echo -e "${GREEN}✓ Client started (PID: $CLIENT_PID)${NC}"
fi

# Open browser windows
echo ""
echo -e "${BLUE}📱 Opening classroom rooms in browser...${NC}"
echo ""

# Room ID
ROOM_ID="demo-$(date +%s)"
ROOM_NAME="Demo%20Classroom"

# Teacher window
TEACHER_URL="http://localhost:${CLIENT_PORT}/classroom/room/${ROOM_ID}?host=true&user=Teacher&name=${ROOM_NAME}"
echo -e "${GREEN}✓ Teacher:${NC} $TEACHER_URL"

# Student windows
STUDENT1_URL="http://localhost:${CLIENT_PORT}/classroom/room/${ROOM_ID}?host=false&user=Student1&name=${ROOM_NAME}"
STUDENT2_URL="http://localhost:${CLIENT_PORT}/classroom/room/${ROOM_ID}?host=false&user=Student2&name=${ROOM_NAME}"
STUDENT3_URL="http://localhost:${CLIENT_PORT}/classroom/room/${ROOM_ID}?host=false&user=Student3&name=${ROOM_NAME}"

echo -e "${GREEN}✓ Student 1:${NC} $STUDENT1_URL"
echo -e "${GREEN}✓ Student 2:${NC} $STUDENT2_URL"
echo -e "${GREEN}✓ Student 3:${NC} $STUDENT3_URL"

echo ""
echo -e "${BLUE}🌐 Opening in browser...${NC}"

# Detect OS and open in browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$TEACHER_URL"
    sleep 1
    open "$STUDENT1_URL"
    open "$STUDENT2_URL"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "$TEACHER_URL" &
    sleep 1
    xdg-open "$STUDENT1_URL" &
    xdg-open "$STUDENT2_URL" &
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows
    start "$TEACHER_URL"
    start "$STUDENT1_URL"
    start "$STUDENT2_URL"
fi

echo ""
echo -e "${GREEN}✓ Demo ready!${NC}"
echo ""
echo -e "${YELLOW}💡 Quick Testing Tips:${NC}"
echo "  1. Open DevTools (F12) → Network tab → filter by 'websocket'"
echo "  2. Click 'Enter VR' button to test WebXR (requires headset or emulator)"
echo "  3. Click 'Whiteboard' to open collaborative drawing"
echo "  4. Teacher can click 'Mute All' to silence students"
echo "  5. See participants panel on right side"
echo "  6. Try dragging camera (mouse) to move around and see avatar updates"
echo ""
echo -e "${BLUE}📊 Monitoring:${NC}"
echo "  Server logs above ↑"
echo "  Browser console (F12 → Console) for client logs"
echo ""
echo -e "${YELLOW}🛑 To stop:${NC} Press Ctrl+C"
echo ""

# Keep script running
wait
