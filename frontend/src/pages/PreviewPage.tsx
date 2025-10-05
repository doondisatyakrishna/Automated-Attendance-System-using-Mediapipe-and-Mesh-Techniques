import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import {
  CalendarDays,
  BrainCircuit,
  Rocket,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react"; // ✅ use lucide-react icons

// If you have your own logo icon, keep it here
import { LogoIcon } from "../components/icons"; 

interface PreviewProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

const slideContent = [
  {
    icon: <CalendarDays className="h-16 w-16 text-primary" />,
    title: "Automated Attendance",
    description:
      "Effortlessly track attendance using cutting-edge facial recognition. Save time, reduce errors, and gain real-time insights.",
  },
  {
    icon: <BrainCircuit className="h-16 w-16 text-primary" />,
    title: "Powered by MediaPipe",
    description:
      "Built on Google's powerful, open-source framework for on-device machine learning. Enjoy fast, accurate, and resource-efficient solutions.",
  },
  {
    icon: <Rocket className="h-16 w-16 text-primary" />,
    title: "Secure & On-Device",
    description:
      "We use on-device processing to ensure security and responsiveness without sending sensitive video data to servers.",
  },
];

const PreviewPage: React.FC<PreviewProps> = ({ onNavigateToLogin, onNavigateToRegister }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { theme, setTheme } = useTheme();

  const handleThemeToggle = () => setTheme(theme === "dark" ? "light" : "dark");

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideContent.length);
    }, 7000);
    return () => clearInterval(slideInterval);
  }, []);

  const nextSlide = () =>
    setCurrentSlide((prev) =>
      prev === slideContent.length - 1 ? 0 : prev + 1
    );

  const prevSlide = () =>
    setCurrentSlide((prev) =>
      prev === 0 ? slideContent.length - 1 : prev - 1
    );

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary font-sans">
      {/* Header */}
      <header className="sticky top-0 bg-surface/80 backdrop-blur-md z-20 border-b border-border shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="text-primary">
              <LogoIcon className="h-8 w-8" />
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
              Automated Attendance
            </h1>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-full hover:bg-background transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-6 w-6" />
              ) : (
                <Moon className="h-6 w-6" />
              )}
            </button>
            <button
              onClick={onNavigateToLogin}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-colors"
            >
              Login
            </button>
            <button
              onClick={onNavigateToRegister}
              className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg shadow hover:bg-primary/80 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Main slider */}
      <main className="flex-grow flex items-center justify-center px-6 py-16">
        <div className="container mx-auto flex flex-col items-center text-center">
          <div className="w-full max-w-3xl relative">
            <div className="relative h-80 flex items-center justify-center overflow-hidden">
              {slideContent.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute w-full h-full transform transition-opacity duration-700 ease-in-out ${
                    index === currentSlide ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center h-full p-6">
                    <div className="mb-4">{slide.icon}</div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-text-primary">
                      {slide.title}
                    </h2>
                    <p className="text-base md:text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
                      {slide.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Slider controls */}
            <button
              onClick={prevSlide}
              aria-label="Previous Slide"
              className="absolute top-1/2 -translate-y-1/2 left-0 md:-left-14 p-2 rounded-full bg-surface/60 hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next Slide"
              className="absolute top-1/2 -translate-y-1/2 right-0 md:-right-14 p-2 rounded-full bg-surface/60 hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Slide indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {slideContent.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  index === currentSlide
                    ? "bg-primary w-8"
                    : "bg-border w-2.5 hover:bg-border/70"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-border py-4 text-center text-sm text-text-secondary">
        © {new Date().getFullYear()} Automated Attendance — Powered by AI & MediaPipe
      </footer>
    </div>
  );
};

export default PreviewPage;
