import { useState, useEffect, useCallback, useRef } from "react";
import { ref, get, set, remove, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { Chat, Message, dummyChats } from "@/lib/chatData";
import { useAuth } from "@/contexts/AuthContext";

// Serialize/deserialize dates for Firebase
function serializeChat(chat: Chat): any {
  return {
    ...chat,
    createdAt: chat.createdAt instanceof Date ? chat.createdAt.toISOString() : chat.createdAt,
    messages: chat.messages.map((m) => ({
      ...m,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
    })),
  };
}

function deserializeChat(data: any): Chat {
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    messages: (data.messages || []).map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })),
  };
}

export function useFirebaseChats() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const prevUid = useRef<string | null>(null);

  // Load chats when user changes
  useEffect(() => {
    if (!user) {
      // Guest mode: use dummy chats
      setChats(dummyChats);
      setLoadingChats(false);
      prevUid.current = null;
      return;
    }

    if (prevUid.current === user.uid) return;
    prevUid.current = user.uid;

    setLoadingChats(true);
    const chatsRef = ref(db, `users/${user.uid}/chats`);
    get(chatsRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const chatList = Object.values(data).map((c: any) => deserializeChat(c));
        chatList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setChats(chatList);
      } else {
        setChats([]);
      }
      setLoadingChats(false);
    }).catch(() => {
      setChats([]);
      setLoadingChats(false);
    });
  }, [user]);

  // Save a single chat to Firebase
  const saveChat = useCallback(
    (chat: Chat) => {
      if (!user) return;
      const chatRef = ref(db, `users/${user.uid}/chats/${chat.id}`);
      set(chatRef, serializeChat(chat));
    },
    [user]
  );

  const updateChats = useCallback(
    (updater: (prev: Chat[]) => Chat[]) => {
      setChats((prev) => {
        const next = updater(prev);
        // Find changed chats and save them
        if (user) {
          next.forEach((chat) => {
            const old = prev.find((c) => c.id === chat.id);
            if (!old || old !== chat) {
              const chatRef = ref(db, `users/${user.uid}/chats/${chat.id}`);
              set(chatRef, serializeChat(chat));
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
        remove(ref(db, `users/${user.uid}/chats/${id}`));
      }
    },
    [user]
  );

  const addChat = useCallback(
    (chat: Chat) => {
      setChats((prev) => [chat, ...prev]);
      if (user) {
        set(ref(db, `users/${user.uid}/chats/${chat.id}`), serializeChat(chat));
      }
    },
    [user]
  );

  return { chats, setChats: updateChats, loadingChats, saveChat, deleteChat, addChat };
}
