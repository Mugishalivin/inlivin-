import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { getMentionSuggestion } from "@/lib/mention-utils";
import { useQuery } from "@tanstack/react-query";

interface MentionAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
}

interface UserProfile {
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
}

export function MentionAutocompleteInput({
  value,
  onChange,
  onKeyDown,
  placeholder = "Type a message...",
  disabled = false,
  className = "",
  rows = 3,
}: MentionAutocompleteInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const mentionSuggestion = getMentionSuggestion(value, cursorPosition);

  // Fetch user suggestions based on mention query
  const { data: userSuggestions = [] } = useQuery({
    queryKey: ["user-mentions", mentionSuggestion?.query],
    queryFn: async () => {
      if (!mentionSuggestion || mentionSuggestion.query.length === 0) {
        return [];
      }

      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .or(
          `username.ilike.${mentionSuggestion.query}%,display_name.ilike.${mentionSuggestion.query}%`
        )
        .limit(5);

      if (error) {
        console.error("Error fetching users:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!mentionSuggestion && mentionSuggestion.query.length > 0,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleSelectionChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setCursorPosition(target.selectionStart);
    setSelectedIndex(0);
  };

  const handleSelectMention = (user: UserProfile) => {
    if (!mentionSuggestion) return;

    const before = value.substring(0, mentionSuggestion.start);
    const after = value.substring(mentionSuggestion.end);
    const mention = `@${user.username}`;
    const newValue = before + mention + " " + after;

    onChange(newValue);

    // Move cursor after mention
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = before.length + mention.length + 1;
        inputRef.current.selectionStart = newCursorPos;
        inputRef.current.selectionEnd = newCursorPos;
        inputRef.current.focus();
        setCursorPosition(newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle mention selection with arrow keys
    if (mentionSuggestion && userSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % userSuggestions.length);
        return;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? userSuggestions.length - 1 : prev - 1
        );
        return;
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSelectMention(userSuggestions[selectedIndex]);
        return;
      }
    }

    // Call the original onKeyDown handler
    onKeyDown?.(e);
  };

  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onSelect={handleSelectionChange}
        onClick={(e) => setCursorPosition(e.currentTarget.selectionStart)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none ${className}`}
      />

      {/* Mention Autocomplete Dropdown */}
      <AnimatePresence>
        {mentionSuggestion && userSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full mb-1 left-0 w-full bg-popover border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
          >
            {userSuggestions.map((user: UserProfile, index: number) => (
              <button
                key={user.user_id}
                onClick={() => handleSelectMention(user)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                  index === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatar_url || ""} />
                  <AvatarFallback>{user.display_name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div className="text-left min-w-0">
                  <p className="font-medium truncate">{user.display_name}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
