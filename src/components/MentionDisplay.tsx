import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseMentions } from "@/lib/mention-utils";

interface MentionDisplayProps {
  text: string;
}

export function MentionDisplay({ text }: MentionDisplayProps) {
  const navigate = useNavigate();
  const parts = parseMentions(text);

  const handleMentionClick = async (username: string) => {
    // Query for the user by username
    const { data } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("username", username)
      .single();

    if (data?.user_id) {
      navigate(`/profile/${data.user_id}`);
    }
  };

  return (
    <span>
      {parts.map((part, index) => {
        if (part.type === "mention") {
          return (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                handleMentionClick(part.username!);
              }}
              className="text-primary font-semibold hover:underline hover:opacity-80 transition-opacity"
            >
              {part.content}
            </button>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </span>
  );
}
