'use client';

import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 shadow-2xl ${className}`}
  >
    {children}
  </motion.div>
);

export default function CyberLanding() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-[#E2E8F0] overflow-hidden selection:bg-[#F43F5E] selection:text-white">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#F43F5E]/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#8B5CF6]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-[#38BDF8]/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24">
        {/* Navigation */}
        <nav className="absolute top-8 left-6 right-6 flex justify-between items-center">
          <div className="text-2xl font-black tracking-tighter italic text-white">VIDFLOW</div>
          <div className="flex gap-8 text-sm font-medium opacity-60">
            <a href="#" className="hover:opacity-100 transition-opacity">PIPELINE</a>
            <a href="#" className="hover:opacity-100 transition-opacity">NETWORK</a>
            <a href="#" className="hover:opacity-100 transition-opacity">PRICING</a>
            <button className="bg-[#F43F5E] text-white px-6 py-2 rounded-full font-bold hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all">START_RUN</button>
          </div>
        </nav>

        {/* Hero */}
        <div className="text-center mb-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white mb-8 leading-[0.8]">
              CONTENT_ <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F43F5E] to-[#8B5CF6]">AUTONOMY.</span>
            </h1>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl md:text-2xl opacity-60 max-w-2xl mx-auto mb-12 font-medium"
          >
            The world's first industrial-grade video production pipeline. 
            Deploy nodes. Scale channels. Own the algorithm.
          </motion.p>
          <div className="flex justify-center gap-6">
            <button className="bg-white text-black px-10 py-4 rounded-full font-black text-lg hover:bg-opacity-90 transition-all">
              EXPLORE_OS
            </button>
            <button className="border border-white/20 hover:border-white/40 px-10 py-4 rounded-full font-black text-lg transition-all backdrop-blur-sm">
              VIEW_DEMO
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-32">
          <GlassCard>
            <div className="w-12 h-12 bg-[#F43F5E]/20 rounded-lg flex items-center justify-center mb-6 border border-[#F43F5E]/30">
              <div className="w-6 h-6 bg-[#F43F5E] rounded-sm"></div>
            </div>
            <h3 className="text-2xl font-bold mb-4">NEURAL_SCRIPTING</h3>
            <p className="opacity-60 leading-relaxed">
              Proprietary fine-tuning on top of Claude 3.5. Scripts that don't just sound human—they sound like *your* brand.
            </p>
          </GlassCard>
          <GlassCard>
            <div className="w-12 h-12 bg-[#8B5CF6]/20 rounded-lg flex items-center justify-center mb-6 border border-[#8B5CF6]/30">
              <div className="w-6 h-6 bg-[#8B5CF6] rounded-sm"></div>
            </div>
            <h3 className="text-2xl font-bold mb-4">VOICE_SYNTHESIS</h3>
            <p className="opacity-60 leading-relaxed">
              Integrated ElevenLabs pipelines with custom emotional inflection layers. Retention-focused audio delivery.
            </p>
          </GlassCard>
          <GlassCard>
            <div className="w-12 h-12 bg-[#38BDF8]/20 rounded-lg flex items-center justify-center mb-6 border border-[#38BDF8]/30">
              <div className="w-6 h-6 bg-[#38BDF8] rounded-sm"></div>
            </div>
            <h3 className="text-2xl font-bold mb-4">AUTO_PUBLISH</h3>
            <p className="opacity-60 leading-relaxed">
              Secure YouTube API integration. Metadata optimization and scheduling based on real-time audience volatility.
            </p>
          </GlassCard>
        </div>

        {/* Interactive Element (Visual Placeholder) */}
        <div className="relative mb-32">
          <div className="absolute inset-0 bg-gradient-to-r from-[#F43F5E]/20 to-[#8B5CF6]/20 blur-[100px] opacity-50"></div>
          <div className="relative border border-white/10 bg-black/40 rounded-3xl p-4 backdrop-blur-2xl">
            <div className="aspect-video rounded-2xl overflow-hidden bg-[#0a0f1d] flex items-center justify-center group cursor-pointer">
              <div className="text-center group-hover:scale-110 transition-transform duration-700">
                <div className="w-24 h-24 border-2 border-white/40 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                   <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-2"></div>
                </div>
                <div className="text-sm font-bold tracking-[0.2em] opacity-40 uppercase">INIT_PREVIEW</div>
              </div>
              
              {/* Floating Node UI Elements */}
              <div className="absolute top-10 left-10 p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="text-[10px] font-bold opacity-40 mb-1">SCRIPT_STATUS</div>
                <div className="text-xs font-mono">GEN_COMPLETED (0.42s)</div>
              </div>
              <div className="absolute bottom-10 right-10 p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md animate-bounce" style={{ animationDuration: '4s' }}>
                <div className="text-[10px] font-bold opacity-40 mb-1">AUDIO_BITRATE</div>
                <div className="text-xs font-mono">192KBPS_VBR_STABLE</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-24 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-xs opacity-30 font-medium uppercase tracking-widest">
            © 2026 VIDFLOW_PIPELINE_SYSTEMS
          </div>
          <div className="flex gap-12 text-xs font-bold opacity-60 uppercase tracking-widest">
            <a href="#" className="hover:opacity-100">LOG_IN</a>
            <a href="#" className="hover:opacity-100 text-[#F43F5E]">CREATE_NODE</a>
            <a href="#" className="hover:opacity-100">DOCS</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
