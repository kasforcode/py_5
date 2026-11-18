from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, username: str):
        await websocket.accept()
        self.active_connections[websocket] = username

    def disconnect(self, websocket: WebSocket):
        self.active_connections.pop(websocket, None)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)


manager = ConnectionManager()


def system_message(username: str, text: str) -> dict:
    return {
        "type": "system",
        "username": username,
        "text": text,
        "timestamp": datetime.now().isoformat(),
    }


@app.websocket("/ws/{username}")
async def chat(websocket: WebSocket, username: str):
    await manager.connect(websocket, username)
    await manager.broadcast(system_message(username, f"{username} присоединился к чату"))
    try:
        while True:
            received = await websocket.receive_json()
            await manager.broadcast(
                {
                    "type": "message",
                    "username": username,
                    "text": received["text"],
                    "timestamp": datetime.now().isoformat(),
                }
            )
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(system_message(username, f"{username} покинул чат"))
