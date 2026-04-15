import { Music, Palette, Video, Code, Book, Gamepad2 } from "lucide-react";

export default function UseCasesSection() {
  const useCases = [
    {
      icon: <Music size={40} />,
      title: "Musicians & Producers",
      description: "Release music, stream royalties, and sell exclusive content to fans",
      features: ["Streaming", "Royalties", "Exclusive Releases"],
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Palette size={40} />,
      title: "Visual Artists",
      description: "Showcase artwork, sell prints, and offer commissions",
      features: ["Portfolio", "Commerce", "Commissions"],
      color: "from-pink-500 to-rose-500",
    },
    {
      icon: <Video size={40} />,
      title: "Content Creators",
      description: "Build audience, monetize videos, and grow passionate fanbase",
      features: ["Analytics", "Monetization", "Community"],
      color: "from-purple-500 to-indigo-500",
    },
    {
      icon: <Code size={40} />,
      title: "Developers",
      description: "Share projects, sell tools, and collaborate with teams",
      features: ["Collaboration", "Marketplace", "API"],
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: <Book size={40} />,
      title: "Writers & Authors",
      description: "Publish stories, offer writing services, build subscriber base",
      features: ["Publishing", "Subscriptions", "Community"],
      color: "from-orange-500 to-amber-500",
    },
    {
      icon: <Gamepad2 size={40} />,
      title: "Game Developers",
      description: "Launch games, get funding, and connect with players",
      features: ["Fundraising", "Community", "Distribution"],
      color: "from-red-500 to-pink-500",
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background via-muted/50 to-background">
      <div className="container">
        <div className="text-center mb-16 animate-fade-up">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Built for Every Creator Type
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you're a musician, artist, developer, or writer, inlivin has tools for you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-500 cursor-pointer"
              style={{
                animationDelay: `${idx * 100}ms`,
              }}
            >
              {/* Gradient overlay on hover */}
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${useCase.color} transition-opacity duration-500`}
              />

              <div className="relative z-10 h-full p-8 flex flex-col">
                <div
                  className={`bg-gradient-to-br ${useCase.color} bg-clip-text text-transparent mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  {useCase.icon}
                </div>

                <h3 className="text-xl font-bold text-foreground mb-2">{useCase.title}</h3>
                <p className="text-muted-foreground mb-6 flex-1">{useCase.description}</p>

                <div className="space-y-2">
                  {useCase.features.map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors"
                      style={{
                        transitionDelay: `${i * 50}ms`,
                      }}
                    >
                      <div
                        className={`w-2 h-2 rounded-full bg-gradient-to-r ${useCase.color}`}
                      />
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <span>Learn more</span>
                  <svg
                    className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
