# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a multiplayer online implementation of Exploding Kittens card game with real-time WebSocket communication. The project has both online multiplayer and local fallback modes, supporting 2-4 players per room.

## Tech Stack
- **Frontend**: React 19 + TypeScript + Vite + Socket.IO Client
- **Backend**: Node.js + Express + Socket.IO + TypeScript
- **Real-time Communication**: Socket.IO for bidirectional WebSocket communication
- **Development**: TypeScript with strict type checking across client and server

## Essential Commands

### Development
```bash
# Start development (from root directory)
npm run dev              # Start Vite dev server (port 5173)
cd server && npm run dev # Start server dev mode (port 3001)

# Or use one-click scripts:
./start-game.sh         # Start both client and server
./stop-game.sh          # Stop all processes
```

### Building and Production
```bash
# Build client
npm run build

# Build server
cd server && npm run build

# Run production
npm run start:prod       # Client production mode
cd server && npm start   # Server production mode
```

### Code Quality
```bash
npm run lint            # ESLint for client code
cd server && npm run lint # Server linting (if available)
```

## Architecture

### Directory Structure
- **src/**: React frontend application
  - **components/**: Game UI components (GameBoard, PlayerHand, RoomList, etc.)
  - **services/socket.ts**: Socket.IO client wrapper
  - **types/game.ts**: Shared TypeScript types
  - **utils/gameLogic.ts**: Client-side game logic
  - **data/cards.ts**: Card definitions and deck creation
- **server/src/**: Node.js backend
  - **server.ts**: Express + Socket.IO entry point
  - **managers/RoomManager.ts**: Room and player management
  - **game/**: Game logic modules (gameLogic.ts, cards.ts)
  - **types/**: Server-side type definitions

### Key Architectural Patterns

#### Client-Server Communication
- **Event-driven architecture** using Socket.IO
- **Server-authoritative game state** with client validation
- **Real-time synchronization** for all game actions
- **Graceful fallback** to local mode when server unavailable

#### Room-Based Multiplayer
- **RoomManager** handles room lifecycle and player management
- **UUID-based identifiers** for rooms and players
- **Maximum 4 players per room**
- **Automatic cleanup** of empty rooms

#### Type Safety
- **Shared TypeScript types** between client and server in `types/`
- **Strict type checking** for game state and Socket.IO events
- **Interface-based design** for extensibility

### Game State Management
- **Centralized state** managed on server
- **Event-driven updates** (playCard, drawCard, endTurn, etc.)
- **Optimistic updates** on client with server validation
- **Real-time broadcasting** to all room participants

## Development Guidelines

### Code Organization
- Maintain **separation of concerns** between components, services, and utilities
- Use **modular architecture** with clear boundaries between client and server
- Keep **game logic** separated from UI components
- **Shared types** must be consistent between client and server

### Socket.IO Events
Key events handled by the system:
- `createRoom`, `joinRoom`, `leaveRoom`
- `playerReady`, `startGame`
- `playCard`, `drawCard`, `endTurn`
- `gameState`, `gameOver`, `playerLeft`

### Game Logic
- **13 different card types** with specific behaviors
- **Turn-based gameplay** with real-time updates
- **Special card mechanics**: See the Future, Attack, Defuse, Shuffle
- **Win condition**: Last player standing (others eliminated by exploding kittens)

### Error Handling
- **Graceful degradation** for network issues
- **User-friendly error messages** (Chinese UI text)
- **Connection retry logic** with exponential backoff
- **Comprehensive logging** for debugging

## Deployment Notes
- **Local development**: Uses localhost:3001 for server
- **LAN multiplayer**: Uses local IP address
- **Online deployment**: Requires ngrok or similar for external access
- **One-click scripts** handle different deployment scenarios

## Testing
- Test both **online multiplayer** and **local fallback** modes
- Verify **real-time synchronization** across multiple clients
- Test **game mechanics** including special card effects
- Ensure **graceful handling** of player disconnections