import { Star, Quote } from "lucide-react";

export function TestimonialsSection() {
  const testimonials = [
    {
      text: "inlivin completely transformed how I monetize my music. The platform is intuitive and the community is incredible.",
      author: "Jordan Lee",
      role: "Electronic Music Producer",
      avatar: "👨‍🎤",
      rating: 5,
    },
    {
      text: "As a visual artist, having all my tools in one place has been game-changing. My earnings tripled in the first quarter.",
      author: "Alicia Martinez",
      role: "Digital Artist",
      avatar: "👩‍🎨",
      rating: 5,
    },
    {
      text: "The collaboration features are outstanding. Working with my team has never been easier. Highly recommend!",
      author: "David Park",
      role: "Creative Director",
      avatar: "👨‍💼",
      rating: 5,
    },
    {
      text: "I love how accessible inlivin makes it to reach a global audience. The tools are powerful yet easy to use.",
      author: "Sophie Turner",
      role: "Content Creator",
      avatar: "👩‍💻",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="text-center mb-16 animate-fade-up">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Loved by Creators Worldwide
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See what creators are saying about inlivin
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, idx) => (
            <div
              key={idx}
              className="group relative p-8 rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 hover:border-primary/50 hover:shadow-xl transition-all duration-500 overflow-hidden"
              style={{
                animationDelay: `${idx * 150}ms`,
              }}
            >
              {/* Animated background shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full" />

              <div className="relative z-10">
                {/* Quote Icon */}
                <Quote className="text-primary/20 absolute top-4 right-4 w-12 h-12" />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className="fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform"
                      style={{ transitionDelay: `${i * 50}ms` }}
                    />
                  ))}
                </div>

                {/* Text */}
                <p className="text-foreground mb-6 leading-relaxed italic">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{testimonial.avatar}</div>
                  <div>
                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center mt-12">
          <button className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:-translate-y-1">
            Read More Reviews
          </button>
        </div>
      </div>
    </section>
  );
}
