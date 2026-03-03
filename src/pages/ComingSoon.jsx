import { motion } from "framer-motion";
import { ArrowRight, Circle } from "lucide-react";

export default function ComingSoonPage() {
  const features = [
    {
      title: "VR TASKS",
      subtitle: "Virtual reality",
      quarter: "Q2 2025",
    },
    {
      title: "REMOTE WORK",
      subtitle: "Work without borders",
      quarter: "Q1 2025",
    },
    {
      title: "SMART MATCHING",
      subtitle: "Smart task matching",
      quarter: "Q3 2025",
    },
    {
      title: "METAVERSE",
      subtitle: "Meetings in the metaverse",
      quarter: "Q4 2025",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-black overflow-auto">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(#e5e7eb_1px,transparent_1px),linear-gradient(90deg,#e5e7eb_1px,transparent_1px)] bg-[size:100px_100px] opacity-50 pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center pt-24 pb-16 px-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-8"
          >
            <Circle className="w-20 h-20 stroke-1" />
          </motion.div>

          <h1 className="text-7xl md:text-9xl font-black mb-6 tracking-tighter">
            COMING SOON
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
            The future of micro-tasks is being built.
            <br />
            Revolutionary features coming in 2025.
          </p>

          <div className="mt-12 inline-flex items-center gap-3 text-sm tracking-wider">
            <span className="w-12 h-[1px] bg-black" />
            <span>INNOVATIONS AHEAD</span>
            <span className="w-12 h-[1px] bg-black" />
          </div>
        </motion.div>

        {/* Features */}
        <div className="max-w-6xl mx-auto px-4 pb-24">
          <div className="grid md:grid-cols-2 gap-px bg-gray-200">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="bg-white p-12 group cursor-pointer hover:bg-black hover:text-white transition-all duration-500"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="text-sm tracking-widest text-gray-400 group-hover:text-gray-300">
                    {feature.quarter}
                  </div>
                  <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
                </div>

                <h3 className="text-4xl md:text-5xl font-black mb-3 tracking-tighter">
                  {feature.title}
                </h3>

                <p className="text-lg font-light text-gray-600 group-hover:text-gray-300">
                  {feature.subtitle}
                </p>

                <div className="mt-8 w-16 h-[1px] bg-gray-300 group-hover:bg-white group-hover:w-full transition-all duration-500" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="max-w-4xl mx-auto px-4 pb-24">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <h2 className="text-3xl font-black mb-12 text-center tracking-tighter">
              ROADMAP 2025
            </h2>

            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gray-300" />

                {[
                { q: "Q1", title: "Remote Tasks", active: true },
                { q: "Q2", title: "VR Integration", active: false },
                { q: "Q3", title: "Smart Matching", active: false },
                { q: "Q4", title: "Metaverse", active: false },
                ].map((item, index) => (
                <motion.div
                  key={item.q}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                  className="relative pl-12 pb-12 last:pb-0"
                >
                  <div
                    className={`absolute left-0 top-2 w-6 h-6 rounded-full border-2 transform -translate-x-1/2 ${
                      item.active
                        ? "bg-black border-black"
                        : "bg-white border-gray-300"
                    }`}
                  />

                  <div className="flex items-baseline gap-4">
                    <span className="text-5xl font-black tracking-tighter">
                      {item.q}
                    </span>
                    <span className="text-2xl font-light text-gray-600">
                      {item.title}
                    </span>
                  </div>

                  {item.active && (
                    <span className="inline-block mt-2 text-xs tracking-widest border border-black px-3 py-1">
                      IN DEVELOPMENT
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center pb-24 px-4"
        >
          <button className="group inline-flex items-center gap-4 px-12 py-6 border-2 border-black hover:bg-black hover:text-white transition-all duration-500">
            <span className="text-lg font-bold tracking-wider">
              NOTIFY ME
            </span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </button>

          <p className="mt-8 text-sm tracking-widest text-gray-500">
            BE THE FIRST TO KNOW
          </p>
        </motion.div>
      </div>
    </div>
  );
}