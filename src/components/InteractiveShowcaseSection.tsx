import { Rotating3DObject } from "./Rotating3DObject";

export default function InteractiveShowcaseSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-muted/50 to-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="container relative z-10">
        <div className="text-center mb-16 animate-fade-up">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Interactive Platform Experience
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore what inlivin offers by rotating the cube below
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* 3D Object */}
          <div className="flex items-center justify-center">
            <div className="w-full bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-3xl border border-primary/20 p-8">
              <Rotating3DObject />
              <p className="text-center text-sm text-muted-foreground mt-4">
                Hover to interact with the cube
              </p>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-6">
            {[
              {
                title: "Create",
                description: "Upload, edit, and manage all your creative content",
                icon: "✨",
              },
              {
                title: "Build",
                description: "Develop your brand with powerful customization tools",
                icon: "🛠️",
              },
              {
                title: "Connect",
                description: "Collaborate with other creators and your audience",
                icon: "🤝",
              },
              {
                title: "Share",
                description: "Distribute your work across multiple platforms",
                icon: "📤",
              },
              {
                title: "Earn",
                description: "Monetize through various revenue streams",
                icon: "💰",
              },
              {
                title: "Grow",
                description: "Scale your presence with analytics and insights",
                icon: "📈",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group flex gap-4 p-4 rounded-xl border border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 cursor-pointer"
                style={{
                  animationDelay: `${idx * 100}ms`,
                }}
              >
                <div className="text-3xl group-hover:scale-125 transition-transform duration-300">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {feature.description}
                  </p>
                </div>
                <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  →
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
