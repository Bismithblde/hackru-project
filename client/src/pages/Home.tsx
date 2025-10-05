import React, { useRef } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
} from "framer-motion";
import bunnyLogo from "../assets/bunny.png";

const Home: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  // Smooth scroll progress
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Hero parallax effects
  const heroY = useTransform(smoothProgress, [0, 0.8], [0, 300]);
  const heroScale = useTransform(smoothProgress, [0, 0.5], [1, 0.95]);

  // Buttons fade out faster but start later
  const buttonsOpacity = useTransform(smoothProgress, [0.15, 0.3], [1, 0]);

  return (
    <div className="relative bg-slate-50 overflow-hidden">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative">
        <motion.div
          ref={heroRef}
          className="relative z-10 max-w-5xl mx-auto px-6 text-center"
          style={{
            y: heroY,
            scale: heroScale,
          }}
        >
          {/* Animated Icon */}
          <motion.div
            className="flex justify-center mb-4"
            initial={{ scale: 0, y: -100, rotate: -180 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
          >
            <motion.div
              className="relative"
              animate={{ y: [0, -15, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Dots Animation */}
              <div
                className="absolute inset-0 z-0"
                style={{ pointerEvents: "none" }}
              >
                {/* Red Dots - Most */}
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={`red-${i}`}
                    className="absolute w-3 h-3 bg-red-600 rounded-full"
                    style={{
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                    animate={{
                      x: [
                        0,
                        (Math.random() - 0.5) * 400,
                        (Math.random() - 0.5) * 800,
                      ],
                      y: [
                        0,
                        (Math.random() - 0.5) * 400,
                        (Math.random() - 0.5) * 800,
                      ],
                      scale: [0, 1.5, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 1,
                      ease: "easeOut",
                    }}
                  />
                ))}

                {/* Blue Dots - Medium */}
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={`blue-${i}`}
                    className="absolute w-3 h-3 bg-blue-600 rounded-full"
                    style={{
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                    animate={{
                      x: [
                        0,
                        (Math.random() - 0.5) * 400,
                        (Math.random() - 0.5) * 800,
                      ],
                      y: [
                        0,
                        (Math.random() - 0.5) * 400,
                        (Math.random() - 0.5) * 800,
                      ],
                      scale: [0, 1.5, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 1,
                      ease: "easeOut",
                    }}
                  />
                ))}

                {/* Yellow Dots - Least */}
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={`yellow-${i}`}
                    className="absolute w-3 h-3 bg-yellow-400 rounded-full"
                    style={{
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                    animate={{
                      x: [
                        0,
                        (Math.random() - 0.5) * 400,
                        (Math.random() - 0.5) * 800,
                      ],
                      y: [
                        0,
                        (Math.random() - 0.5) * 400,
                        (Math.random() - 0.5) * 800,
                      ],
                      scale: [0, 1.5, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 1,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </div>

              <motion.img
                src={bunnyLogo}
                alt="StudyBunny Logo"
                className="w-96 h-96 md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px] object-contain relative z-10"
                whileHover={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              />
            </motion.div>
          </motion.div>

          {/* Hero Text with stagger animation */}
          <motion.h1
            className="text-7xl md:text-8xl font-bold text-slate-900 mb-6 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Study<span style={{ color: "#c41610ff" }}>Bunny</span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Collaborate with friends, share knowledge, and study together in
            real-time with
            <span style={{ color: "#da8f02ff", fontWeight: "600" }}>
              {" "}
              voice chat
            </span>{" "}
            and
            <span style={{ color: "#068bb0ff", fontWeight: "600" }}>
              {" "}
              interactive features
            </span>
            .
          </motion.p>

          {/* CTA Buttons with animation */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            style={{ opacity: buttonsOpacity }}
          >
            <Link to="/rooms">
              <motion.button
                className="px-8 py-4 text-white rounded-xl font-semibold shadow-lg text-lg"
                style={{ backgroundColor: "#ae1207ff" }}
                whileHover={{
                  scale: 1.05,
                  y: -2,
                  boxShadow:
                    "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center gap-2">
                  Get Started Free
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </span>
              </motion.button>
            </Link>

            <motion.button
              onClick={() => {
                featuresRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-8 py-4 bg-white text-slate-900 rounded-xl border-2 border-slate-200 font-semibold shadow-sm text-lg"
              whileHover={{
                scale: 1.05,
                borderColor: "#cbd5e1",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              Learn More
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section
        ref={featuresRef}
        className="min-h-screen flex items-center justify-center py-20 px-6 bg-white"
      >
        <div className="max-w-7xl mx-auto">
          <FeatureHeader />
          <FeatureCards />
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />
    </div>
  );
};

// Feature Header Component
const FeatureHeader: React.FC = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <motion.div
      ref={ref}
      className="text-center mb-16"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4">
        Everything you need to{" "}
        <span style={{ color: "#ecbe08ff" }}>study smarter</span>
      </h2>
      <p className="text-xl text-slate-600 max-w-2xl mx-auto">
        Built for students who want to collaborate, compete, and succeed
        together
      </p>
    </motion.div>
  );
};

// Feature Cards Component
const FeatureCards: React.FC = () => {
  const features = [
    {
      icon: "🎤",
      title: "Crystal Clear Voice Chat",
      description:
        "Connect with your study group using high-quality audio powered by Daily.co. No lag, no interruptions.",
      color: "indigo",
    },
    {
      icon: "💬",
      title: "Real-time Messaging",
      description:
        "Share ideas, resources, and questions instantly with messenger-style chat that keeps conversations flowing.",
      color: "purple",
    },
    {
      icon: "🏆",
      title: "Competitive Leaderboard",
      description:
        "Stay motivated by tracking progress and competing with friends. Turn studying into a fun challenge.",
      color: "pink",
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {features.map((feature, index) => (
        <FeatureCard key={index} feature={feature} index={index} />
      ))}
    </div>
  );
};

// Individual Feature Card
const FeatureCard: React.FC<{ feature: any; index: number }> = ({
  feature,
  index,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      className="group relative bg-slate-50 rounded-2xl p-8 border border-slate-200"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay: index * 0.2 }}
      whileHover={{
        y: -8,
        borderColor: "#a5b4fc",
        boxShadow:
          "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      }}
    >
      <motion.div
        className="text-6xl mb-4"
        whileHover={{ scale: 1.1, rotate: 10 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {feature.icon}
      </motion.div>
      <h3 className="text-2xl font-bold text-slate-900 mb-3">
        {feature.title}
      </h3>
      <p className="text-slate-600 leading-relaxed">{feature.description}</p>
    </motion.div>
  );
};

// CTA Section Component
const CTASection: React.FC = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section className="py-24 px-6 bg-slate-50 relative overflow-hidden">
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          style={{ backgroundColor: "#cdf4c6ff" }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      <motion.div
        ref={ref}
        className="relative z-10 max-w-4xl mx-auto text-center"
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-5xl font-bold text-slate-900 mb-6">
          Ready to level up your study game?
        </h2>
        <p className="text-xl text-slate-600 mb-8">
          Join thousands of students already studying smarter together
        </p>
        <Link to="/rooms">
          <motion.button
            className="inline-flex items-center gap-2 px-10 py-5 text-white rounded-xl font-semibold shadow-xl text-xl"
            style={{ backgroundColor: "#c41610ff" }}
            whileHover={{
              scale: 1.05,
              y: -3,
              boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            Start Studying Now
            <motion.span
              className="text-2xl"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </motion.button>
        </Link>
      </motion.div>
    </section>
  );
};

export default Home;
