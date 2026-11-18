import { useEffect, useState } from "react";

export default function App() {
  const [username, setUsername] = useState("");
  const [connectedUsername, setConnectedUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!connectedUsername) return undefined;

    const ws = new WebSocket(`ws://localhost:8000/ws/${encodeURIComponent(connectedUsername)}`);
    ws.onmessage = (event) => setMessages((current) => [...current, JSON.parse(event.data)]);
    setSocket(ws);

    return () => ws.close();
  }, [connectedUsername]);

  function connect(event) {
    event.preventDefault();
    if (username) setConnectedUsername(username);
  }

  function sendMessage(event) {
    event.preventDefault();
    if (!message || !socket) return;
    socket.send(JSON.stringify({ text: message }));
    setMessage("");
  }

  if (!connectedUsername) {
    return (
      <form onSubmit={connect}>
        <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Имя пользователя" required />
        <button type="submit">Войти</button>
      </form>
    );
  }

  return (
    <main>
      <div>
        {messages.map((item, index) => (
          <p className={item.type === "system" ? "system" : "message"} key={index}>
            {item.type === "system" ? item.text : `${item.username}: ${item.text}`}
          </p>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Сообщение" />
        <button type="submit">Отправить</button>
      </form>
    </main>
  );
}
