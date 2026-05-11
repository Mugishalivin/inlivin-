        {/* Message Settings Dialog */}
        <MessageSettingsDialog
          isOpen={showSettingsDialog}
          onOpenChange={setShowSettingsDialog}
          conversationId={activeConvo || ""}
          userId={user?.id || ""}
          isGroupChat={isGroupChat}
          isGroupAdmin={isGroupAdmin}
        />

        {/* Report Message Dialog */}
        {reportMessageId && (
          <ReportMessageDialog
            isOpen={!!reportMessageId}
            onOpenChange={() => setReportMessageId(null)}
            messageId={reportMessageId}
            reportedUserId={messages.find(m => m.id === reportMessageId)?.sender_id || ""}
            messageSender={localOtherUser?.profile?.display_name || "User"}
          />
        )}

        {/* Group Settings Dialog */}
        {isGroupChat && activeConvo && (
          <GroupChatSettingsDialog
            isOpen={showGroupSettings}
            onOpenChange={setShowGroupSettings}
            conversationId={activeConvo}
            currentUserId={user?.id || ""}
            groupName={conversations.find(c => c.id === activeConvo)?.participants?.[0]?.profile?.display_name || "Group"}
            isAdmin={isGroupAdmin}
          />
        )}
      </div>
    );
  }

  // ======================== CONVERSATION LIST ========================
  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
            Messages<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Connect and collaborate with other artists.</p>
        </div>
        <Button variant="hero" size="sm" onClick={() => setShowNewChat(true)}>
          <Plus size={16} /> New Chat
        </Button>
      </div>
