import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types/models';
import { useApp } from '../store/AppContext';
import { useCooldown } from '../hooks/useCooldown';
import { Send, Clock, Shield, User, HardHat, MessageSquare } from 'lucide-react';

interface RoadChatProps {
  reportId: string;
  chatMessages: ChatMessage[];
}

export const RoadChat: React.FC<RoadChatProps> = ({
  reportId,
  chatMessages,
}) => {
  const { state, dispatch } = useApp();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 120s per-road chat cooldown as specified in §7.5
  const { isCoolingDown, remainingSeconds, startCooldown } = useCooldown(120, `road_${reportId}`);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isCoolingDown) return;

    dispatch({
      type: 'ADD_CHAT_MESSAGE',
      payload: {
        reportId,
        text: text.trim(),
      },
    });

    setText('');
    startCooldown();
  };

  const getRoleBadge = (role?: 'citizen' | 'contractor' | 'officer') => {
    if (role === 'officer') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 font-semibold border border-sky-500/30">
          <Shield className="w-2.5 h-2.5" />
          OFFICER
        </span>
      );
    }
    if (role === 'contractor') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/30">
          <HardHat className="w-2.5 h-2.5" />
          CONTRACTOR
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-500/10 text-stone-600 dark:text-stone-400">
        <User className="w-2.5 h-2.5" />
        CITIZEN
      </span>
    );
  };

  return (
    <div className="flex flex-col h-[400px] rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/40">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
            Neighbourhood & Crew Thread
          </h3>
          <span className="text-xs text-stone-500 font-mono-data">
            ({chatMessages.length} updates)
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>120s cooldown policy</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500">
            <MessageSquare className="w-8 h-8 stroke-1 text-stone-400 mb-2 opacity-60" />
            <p className="text-sm font-medium">No messages on this stretch yet.</p>
            <p className="text-xs text-stone-400 max-w-xs mt-1">
              Share real-time traffic alerts, lighting status, or repair progress with the neighbourhood.
            </p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isMe = msg.userId === state.currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                    {msg.userName}
                  </span>
                  {getRoleBadge(msg.role)}
                  <span className="text-[10px] text-stone-400 font-mono">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] rounded-lg px-3.5 py-2 text-sm leading-relaxed ${
                    isMe
                      ? 'bg-amber-500 text-stone-950 font-medium rounded-tr-none'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-tl-none border border-stone-200/60 dark:border-stone-700/60'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Send Input with 120s Cooldown State */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/30 flex items-center gap-2"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            isCoolingDown
              ? `Cooldown active: please wait ${remainingSeconds}s before next update...`
              : `Post update as ${state.currentUser.name}...`
          }
          disabled={isCoolingDown}
          className="flex-1 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-3.5 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={!text.trim() || isCoolingDown}
          className={`px-4 py-2 rounded-lg text-xs font-bold font-mono uppercase transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            isCoolingDown
              ? 'bg-stone-200 dark:bg-stone-800 text-stone-500 cursor-not-allowed'
              : text.trim()
              ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-sm'
              : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
          }`}
        >
          {isCoolingDown ? (
            <>
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>{remainingSeconds}s</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
