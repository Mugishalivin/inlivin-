import { Play } from "lucide-react";

export function VideoShowcaseSection() {
  const videos = [
    {
      title: "Getting Started Guide",
      duration: "5:32",
      thumbnail: "🎬",
      views: "125K",
    },
    {
      title: "Monetization Strategies",
      duration: "8:45",
      thumbnail: "💰",
      views: "89K",
    },
    {
      title: "Collaboration Features",
      duration: "6:20",
      thumbnail: "🤝",
      views: "64K",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="text-center mb-16 animate-fade-up">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Video Tutorials & Guides
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Watch how creators are succeeding on inlivin
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {videos.map((video, idx) => (
            <div
              key={idx}
              className="group cursor-pointer"
              style={{
                animationDelay: `${idx * 150}ms`,
              }}
            >
              {/* Video Card */}
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-500">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center overflow-hidden">
                  <div className="text-6xl group-hover:scale-125 transition-transform duration-500">
                    {video.thumbnail}
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                    <div className="bg-primary rounded-full p-4 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                      <Play
                        size={28}
                        className="fill-primary-foreground text-primary-foreground"
                      />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/70 text-white text-xs font-semibold group-hover:bg-primary transition-colors duration-300">
                    {video.duration}
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{video.views} views</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:-translate-y-1">
            View All Tutorials
          </button>
        </div>
      </div>
    </section>
  );
}
