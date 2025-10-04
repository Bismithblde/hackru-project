import React, { useRef, useEffect } from "react";

type Message = { userId: string; message: string; ts: number };

const Chat: React.FC<{
  messages: Message[];
  onSend: (msg: string) => void;
}> = ({ messages, onSend }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className="flex flex-col h-64">
      <div
        ref={listRef}
        className="overflow-y-auto p-2 border rounded-md bg-white flex-1"
      >
        {messages.map((m, idx) => (
          <div key={idx} className="mb-2">
            <div className="text-xs text-slate-500">
              {new Date(m.ts).toLocaleTimeString()}
            </div>
            <div className="text-sm">{m.message}</div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <input
          ref={inputRef}
          className="flex-1 px-3 py-2 border rounded"
          placeholder="Message"
        />
        <button
          onClick={() => {
            const v = inputRef.current?.value?.trim();
            if (v) {
              onSend(v);
              if (inputRef.current) inputRef.current.value = "";
            }
          }}
          className="px-3 py-2 bg-indigo-600 text-white rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
