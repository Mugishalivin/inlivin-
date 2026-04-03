import { createContext, useContext, useState, useRef, ReactNode } from "react";

interface CallSession {
  id: string;
  conversation_id: string;
  initiator_id: string;
  recipient_id: string;
  mode: "voice" | "video" | "emoji";
  status: "pending" | "accepted" | "active" | "rejected" | "ended";
  offer_sdp: string | null;
  answer_sdp: string | null;
  caller_candidates: unknown;
  callee_candidates: unknown;
  burst_emojis: string[];
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  started_at: string | null;
  ended_at: string | null;
}

interface OtherUser {
  user_id: string;
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

interface CallContextType {
  currentCallSession: CallSession | null;
  setCurrentCallSession: (session: CallSession | null) => void;
  callRoomOpen: boolean;
  setCallRoomOpen: (open: boolean) => void;
  otherUser: OtherUser | null;
  setOtherUser: (user: OtherUser | null) => void;
  isMicMuted: boolean;
  setIsMicMuted: (muted: boolean | ((prev: boolean) => boolean)) => void;
  endCallSession: (id: string) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const useCall = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
};

interface CallProviderProps {
  children: ReactNode;
  endCallSession: (id: string) => void;
}

export const CallProvider = ({ children, endCallSession }: CallProviderProps) => {
  const [currentCallSession, setCurrentCallSession] = useState<CallSession | null>(null);
  const [callRoomOpen, setCallRoomOpen] = useState(false);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);

  const value = {
    currentCallSession,
    setCurrentCallSession,
    callRoomOpen,
    setCallRoomOpen,
    otherUser,
    setOtherUser,
    isMicMuted,
    setIsMicMuted,
    endCallSession,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};