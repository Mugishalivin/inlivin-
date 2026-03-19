import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function MessagesPage() {
  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
          Messages<span className="text-primary">.</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Connect and collaborate with other artists.</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search conversations..." className="pl-10 h-11 bg-card" />
      </div>

      {/* Empty state */}
      <Card className="border-border/50 border-dashed">
        <CardContent className="py-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
            <MessageCircle size={28} className="text-accent" />
          </div>
          <h3 className="font-display font-bold text-lg text-foreground mb-1">No messages yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Start a conversation by finding artists to collaborate with in the Explore section.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
