import { Menu, Share2, MoreVertical } from "lucide-react";

interface ChatHeaderProps {
  title: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function ChatHeader({ title, sidebarOpen, onToggleSidebar }: ChatHeaderProps) {
  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border glass">
      <div className="flex items-center gap-3">
        {!sidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
        <h1 className="text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-none">
          {title || "New Chat"}
        </h1>
      </div>
      <div className="flex items-center gap-1">
        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
          <Share2 className="w-4 h-4 text-muted-foreground" />
        </button>
        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
