import React, { useRef, useEffect } from "react";

type Message = { userId: string; username?: string; message: string; ts: number };

const Chat: React.FC<{
  messages: Message[];
  currentUserId: string;
  onSend: (msg: string) => void;
}> = ({ messages, currentUserId, onSend }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className="flex flex-col h-96">
      <div
        ref={listRef}
        className="overflow-y-auto p-4 border border-slate-200 rounded-lg bg-slate-50 flex-1 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 mt-8">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.userId === currentUserId;
            return (
              <div
                key={idx}
                className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}
              >
                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%]`}>
                  {/* Username */}
                  <div className="text-xs text-slate-500 mb-1 px-3">
                    {m.username || "Anonymous"}
                  </div>
                  
                  {/* Message Bubble */}
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      isMe
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-slate-900 border border-slate-200"
                    }`}
                  >
                    <div className="text-sm break-words">{m.message}</div>
                  </div>
                  
                  {/* Timestamp */}
                  <div className="text-xs text-slate-400 mt-1 px-3">
                    {new Date(m.ts).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <input
          ref={inputRef}
          className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
          placeholder="Type a message..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const v = inputRef.current?.value?.trim();
              if (v) {
                onSend(v);
                if (inputRef.current) inputRef.current.value = "";
              }
            }
          }}
        />
        <button
          onClick={() => {
            const v = inputRef.current?.value?.trim();
            if (v) {
              onSend(v);
              if (inputRef.current) inputRef.current.value = "";
            }
          }}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
