import { useEffect, useState } from "react";

const InteractiveBackground = () => {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Gradient orbs that follow mouse */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-[100px] transition-all duration-1000 ease-out"
        style={{
          background: `radial-gradient(circle, hsl(var(--primary)), transparent)`,
          left: `calc(${mousePos.x}% - 300px)`,
          top: `calc(${mousePos.y}% - 300px)`,
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-20 blur-[80px] transition-all duration-700 ease-out"
        style={{
          background: `radial-gradient(circle, hsl(var(--accent)), transparent)`,
          left: `calc(${100 - mousePos.x}% - 200px)`,
          top: `calc(${100 - mousePos.y}% - 200px)`,
        }}
      />

      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary/20 blur-xl animate-float-orb" />
      <div className="absolute top-40 right-20 w-24 h-24 rounded-full bg-accent/20 blur-xl animate-float-orb" style={{ animationDelay: "2s" }} />
      <div className="absolute bottom-20 left-1/4 w-40 h-40 rounded-full bg-primary/15 blur-xl animate-float-orb" style={{ animationDelay: "4s" }} />
      <div className="absolute bottom-40 right-1/3 w-28 h-28 rounded-full bg-accent/15 blur-xl animate-float-orb" style={{ animationDelay: "1s" }} />

      {/* Animated grid */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/30 animate-particle-float"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${15 + Math.random() * 10}s`,
            animationDelay: `${Math.random() * 10}s`,
          }}
        />
      ))}

      {/* Rotating ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] animate-spin-slow opacity-5">
        <div className="w-full h-full rounded-full border border-primary/30" />
        <div className="absolute inset-8 rounded-full border border-accent/30" />
        <div className="absolute inset-16 rounded-full border border-primary/30" />
      </div>
    </div>
  );
};

export default InteractiveBackground;
