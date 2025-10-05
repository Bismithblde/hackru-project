import React, { useRef, useEffect, useState } from "react";
import type { Message } from "../types";
import { formatTime } from "../utils";
import { emit, on, off } from "../lib/socket";
import { SOCKET_EVENTS } from "../constants";

interface ChatProps {
  messages: Message[];
  currentUserId: string;
  currentUsername: string;
  roomId: string;
  onSend: (msg: string) => void;
}

const Chat: React.FC<ChatProps> = ({
  messages,
  currentUserId,
  currentUsername,
  roomId,
  onSend,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  // Listen for typing events
  useEffect(() => {
    const handleTyping = (data: { username: string; userId: string }) => {
      if (data.userId !== currentUserId) {
        setTypingUsers((prev) =>
          prev.includes(data.username) ? prev : [...prev, data.username]
        );

        // Remove after 3 seconds
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== data.username));
        }, 3000);
      }
    };

    const handleStopTyping = (data: { username: string; userId: string }) => {
      if (data.userId !== currentUserId) {
        setTypingUsers((prev) => prev.filter((u) => u !== data.username));
      }
    };

    on(SOCKET_EVENTS.CHAT_TYPING, handleTyping);
    on(SOCKET_EVENTS.CHAT_STOP_TYPING, handleStopTyping);

    return () => {
      off(SOCKET_EVENTS.CHAT_TYPING, handleTyping);
      off(SOCKET_EVENTS.CHAT_STOP_TYPING, handleStopTyping);
    };
  }, [currentUserId]);

  const handleInputChange = () => {
    // Emit typing event
    emit(SOCKET_EVENTS.CHAT_TYPING, {
      roomId,
      username: currentUsername,
      userId: currentUserId,
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to emit stop typing
    typingTimeoutRef.current = setTimeout(() => {
      emit(SOCKET_EVENTS.CHAT_STOP_TYPING, {
        roomId,
        username: currentUsername,
        userId: currentUserId,
      });
    }, 1000);
  };

  const handleSend = () => {
    const v = inputRef.current?.value?.trim();
    if (v) {
      onSend(v);
      if (inputRef.current) inputRef.current.value = "";

      // Stop typing indicator
      emit(SOCKET_EVENTS.CHAT_STOP_TYPING, {
        roomId,
        username: currentUsername,
        userId: currentUserId,
      });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

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
                className={`flex ${
                  isMe ? "justify-end" : "justify-start"
                } mb-2`}
              >
                <div
                  className={`flex flex-col ${
                    isMe ? "items-end" : "items-start"
                  } max-w-[70%]`}
                >
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
                    {formatTime(m.ts)}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start mb-2 animate-fadeIn">
            <div className="flex items-center gap-2 bg-slate-200 rounded-lg px-4 py-2">
              <span className="text-xs text-slate-600">
                {typingUsers.length === 1
                  ? `${typingUsers[0]} is typing`
                  : typingUsers.length === 2
                  ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
                  : `${typingUsers.length} people are typing`}
              </span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0ms]"></div>
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:150ms]"></div>
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:300ms]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <input
          ref={inputRef}
          className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
          placeholder="Type a message..."
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
        />
        <button
          onClick={handleSend}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
