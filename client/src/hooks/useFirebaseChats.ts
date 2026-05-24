import { useState, useEffect, useCallback, useRef } from "react";
import { Chat, dummyChats } from "@/lib/chatData";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

type MongoChat = Omit<Chat, "id" | "createdAt"> & {
  _id?: string;
  id?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
};

function serializeChat(chat: Chat, userId: string): MongoChat {
  return {
    ...chat,
    userId,
    messages: chat.messages.map((m) => ({
      ...m,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
    })),
    createdAt: chat.createdAt instanceof Date ? chat.createdAt.toISOString() : chat.createdAt,
  };
}

function deserializeChat(data: MongoChat): Chat {
  return {
    ...data,
    id: data._id || data.id || crypto.randomUUID(),
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    messages: (data.messages || []).map((m: any) => ({
      ...m,
      timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
    })),
  } as Chat;
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error("সার্ভার থেকে সঠিক উত্তর পাওয়া যায়নি");
  }

  return response.json();
}

export function useFirebaseChats() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const prevUid = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      setChats(dummyChats);
      setLoadingChats(false);
      prevUid.current = null;
      return;
    }

    if (prevUid.current === user.uid) return;
    prevUid.current = user.uid;

    setLoadingChats(true);
    apiRequest<MongoChat[]>(`/api/chats/${user.uid}`)
      .then((data) => {
        setChats(data.map(deserializeChat));
      })
      .catch(() => {
        setChats([]);
      })
      .finally(() => {
        setLoadingChats(false);
      });
  }, [user]);

  const saveChat = useCallback(
    async (chat: Chat) => {
      if (!user) return;
      await apiRequest(`/api/chats/${chat.id}`, {
        method: "PUT",
        body: JSON.stringify(serializeChat(chat, user.uid)),
      });
    },
    [user]
  );

  const updateChats = useCallback(
    (updater: (prev: Chat[]) => Chat[]) => {
      setChats((prev) => {
        const next = updater(prev);

        if (user) {
          next.forEach((chat) => {
            const old = prev.find((c) => c.id === chat.id);
            if (!old || old !== chat) {
              apiRequest(`/api/chats/${chat.id}`, {
                method: "PUT",
                body: JSON.stringify(serializeChat(chat, user.uid)),
              }).catch(() => undefined);
            }
          });
        }

        return next;
      });
    },
    [user]
  );

  const deleteChat = useCallback(
    (id: string) => {
      setChats((prev) => prev.filter((c) => c.id !== id));
      if (user) {
        apiRequest(`/api/chats/${id}`, { method: "DELETE" }).catch(() => undefined);
      }
    },
    [user]
  );

  const addChat = useCallback(
    (chat: Chat) => {
      setChats((prev) => [chat, ...prev]);
      if (user) {
        apiRequest<MongoChat>("/api/chats", {
          method: "POST",
          body: JSON.stringify(serializeChat(chat, user.uid)),
        })
          .then((savedChat) => {
            setChats((prev) =>
              prev.map((c) => (c.id === chat.id ? deserializeChat(savedChat) : c))
            );
          })
          .catch(() => undefined);
      }
    },
    [user]
  );

  return { chats, setChats: updateChats, loadingChats, saveChat, deleteChat, addChat };
}
