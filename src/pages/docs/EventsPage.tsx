import { DocsLayout } from "@/components/DocsLayout";
import { Calendar, MapPin, Users, Mic } from "lucide-react";

const events = [
  {
    name: "Creator Summit 2026",
    date: "May 15-17, 2026",
    type: "Virtual Conference",
    icon: <Mic size={24} />,
    description: "The largest gathering of creators in our community",
  },
  {
    name: "Monthly Live Q&A",
    date: "Every 3rd Thursday, 7 PM UTC",
    type: "Live Session",
    icon: <Users size={24} />,
    description: "Ask our team anything about the platform",
  },
  {
    name: "Creator Masterclass Series",
    date: "Wednesdays 6-7 PM UTC",
    type: "Workshop",
    icon: <Calendar size={24} />,
    description: "Expert-led workshops on content creation and monetization",
  },
];

export function EventsPage() {
  return (
    <DocsLayout
      title="Events & Community"
      description="Join events, workshops, and meetups"
      breadcrumbs={[{ label: "Community", href: "/docs" }]}
    >
      <div className="space-y-12">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Upcoming Events</h2>
          <div className="space-y-4">
            {events.map((event, idx) => (
              <div
                key={idx}
                className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-4 mb-3">
                  <div className="text-primary">{event.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg">{event.name}</h3>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Calendar size={16} />
                    {event.date}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {event.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg border border-border bg-card">
            <Users className="text-primary mb-3" size={24} />
            <h3 className="font-semibold text-foreground mb-2">Community Meetups</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect with creators in your region
            </p>
            <button className="text-primary hover:underline text-sm font-semibold">
              Find Meetups →
            </button>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card">
            <Mic className="text-primary mb-3" size={24} />
            <h3 className="font-semibold text-foreground mb-2">Live Streams</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Catch creators going live daily
            </p>
            <button className="text-primary hover:underline text-sm font-semibold">
              View Schedule →
            </button>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card">
            <Calendar className="text-primary mb-3" size={24} />
            <h3 className="font-semibold text-foreground mb-2">Challenges</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Participate in monthly creative challenges
            </p>
            <button className="text-primary hover:underline text-sm font-semibold">
              Join Now →
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-3">Event Sponsorships</h2>
          <p className="text-muted-foreground mb-4">
            Is your company interested in sponsoring inlivin events?
          </p>
          <button className="text-primary hover:underline font-semibold">
            Contact Partnerships Team
          </button>
        </div>
      </div>
    </DocsLayout>
  );
}
