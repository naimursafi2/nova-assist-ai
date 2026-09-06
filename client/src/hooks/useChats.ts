import { useState, useEffect, useCallback, useRef } from "react";
import { Chat, dummyChats } from "@/lib/chatData";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";
const LOCAL_CHATS_KEY = "nova-local-chats";

type SerializedMessage = Omit<Chat["messages"][number], "timestamp"> & { timestamp: string };

type MongoChat = Omit<Chat, "id" | "createdAt" | "messages"> & {
  _id?: string;
  id?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  messages: SerializedMessage[];
};

function serializeChat(chat: Chat): Omit<MongoChat, "userId"> {
  return {
    ...chat,
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
    messages: (data.messages || []).map((m) => ({
      ...m,
      timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
    })),
  } as Chat;
}

export function useChats() {
  const { user, getIdToken } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const prevUid = useRef<string | null>(null);

  const isRemote = !!API_URL && !!user && !user.isLocal;

  const authedRequest = useCallback(
    async <T,>(path: string, options?: RequestInit): Promise<T> => {
      const token = await getIdToken();
      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options?.headers || {}),
        },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Chat sync request failed");
      }
      return response.json();
    },
    [getIdToken]
  );

  useEffect(() => {
    const loadLocalChats = () => {
      const stored = localStorage.getItem(LOCAL_CHATS_KEY);
      if (!stored) return dummyChats;
      try {
        return (JSON.parse(stored) as MongoChat[]).map(deserializeChat);
      } catch {
        return dummyChats;
      }
    };

    if (!isRemote) {
      setChats(loadLocalChats());
      setLoadingChats(false);
      prevUid.current = null;
      return;
    }

    if (prevUid.current === user!.uid) return;
    prevUid.current = user!.uid;

    setLoadingChats(true);
    authedRequest<MongoChat[]>(`/api/chats/${user!.uid}`)
      .then((data) => setChats(data.map(deserializeChat)))
      .catch(() => setChats([]))
      .finally(() => setLoadingChats(false));
  }, [authedRequest, isRemote, user]);

  const persistLocal = useCallback((next: Chat[]) => {
    localStorage.setItem(LOCAL_CHATS_KEY, JSON.stringify(next.map(serializeChat)));
  }, []);

  const updateChats = useCallback(
    (updater: (prev: Chat[]) => Chat[]) => {
      setChats((prev) => {
        const next = updater(prev);
        if (!isRemote) {
          persistLocal(next);
        } else {
          next.forEach((chat) => {
            const old = prev.find((c) => c.id === chat.id);
            if (!old || old !== chat) {
              authedRequest(`/api/chats/${chat.id}`, { method: "PUT", body: JSON.stringify(serializeChat(chat)) }).catch(() => undefined);
            }
          });
        }
        return next;
      });
    },
    [authedRequest, isRemote, persistLocal]
  );

  const deleteChat = useCallback(
    (id: string) => {
      setChats((prev) => {
        const next = prev.filter((c) => c.id !== id);
        if (!isRemote) persistLocal(next);
        return next;
      });
      if (isRemote) {
        authedRequest(`/api/chats/${id}`, { method: "DELETE" }).catch(() => undefined);
      }
    },
    [authedRequest, isRemote, persistLocal]
  );

  const addChat = useCallback(
    (chat: Chat) => {
      setChats((prev) => {
        const next = [chat, ...prev];
        if (!isRemote) persistLocal(next);
        return next;
      });
      if (isRemote) {
        authedRequest<MongoChat>("/api/chats", { method: "POST", body: JSON.stringify(serializeChat(chat)) })
          .then((savedChat) => {
            setChats((prev) => prev.map((c) => (c.id === chat.id ? deserializeChat(savedChat) : c)));
          })
          .catch(() => undefined);
      }
    },
    [authedRequest, isRemote, persistLocal]
  );

  return { chats, setChats: updateChats, loadingChats, deleteChat, addChat };
}
