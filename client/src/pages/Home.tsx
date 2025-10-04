import React from "react";
import { Link } from "react-router-dom";

const Home: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center">
              <span className="text-4xl">📚</span>
            </div>
          </div>
          <h1 className="text-6xl font-bold text-slate-900">
            StudyBunny
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Collaborate with friends, share knowledge, and study together in real-time with voice chat and interactive features.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-lg p-6 border border-slate-200 hover:border-slate-300 transition-colors">
            <div className="text-4xl mb-3">🎤</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Voice Chat</h3>
            <p className="text-sm text-slate-600">Crystal clear audio communication powered by Daily.co</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-slate-200 hover:border-slate-300 transition-colors">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Real-time Chat</h3>
            <p className="text-sm text-slate-600">Instant messaging to share ideas and resources</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-slate-200 hover:border-slate-300 transition-colors">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Leaderboard</h3>
            <p className="text-sm text-slate-600">Track progress and motivate each other</p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-12">
          <Link
            to="/rooms"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-base font-medium"
          >
            <span>Get Started</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
