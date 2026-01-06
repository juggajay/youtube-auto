'use client';

import React, { useState, useEffect } from 'react';

const TerminalLine = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;

  return (
    <div className="font-mono text-[#00FF41] mb-1">
      <span className="opacity-50 mr-2">[SYSTEM]</span>
      {children}
    </div>
  );
};

const NodeBox = ({ title, status, desc }: { title: string, status: string, desc: string }) => (
  <div className="border border-[#333] p-4 bg-black hover:border-[#00FF41] transition-colors group cursor-crosshair">
    <div className="flex justify-between items-center mb-2">
      <h3 className="font-mono text-xl font-bold uppercase tracking-tighter text-[#00FF41]">{title}</h3>
      <span className="text-[10px] bg-[#00FF41] text-black px-1 font-bold">{status}</span>
    </div>
    <p className="font-mono text-xs text-[#00FF41]/70 leading-tight">{desc}</p>
    <div className="mt-4 flex gap-1">
      <div className="h-1 w-full bg-[#333] overflow-hidden">
        <div className="h-full bg-[#00FF41] w-[65%] group-hover:w-full transition-all duration-1000"></div>
      </div>
    </div>
  </div>
);

export default function BrutalistLanding() {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBooted(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-[#00FF41] selection:bg-[#00FF41] selection:text-black">
      {/* Scanline Effect */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
        <div className="absolute inset-0 animate-pulse bg-[#00FF41]/[0.02]"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <header className="border-b border-[#333] pb-4 mb-12 flex justify-between items-end">
          <div>
            <h1 className="font-mono text-4xl font-black tracking-tighter uppercase leading-none">
              VIDFLOW_OS <span className="text-xs align-top bg-[#00FF41] text-black px-1">v1.0.4</span>
            </h1>
            <p className="font-mono text-xs mt-2 opacity-70">TERMINAL_NODE: C:\USERS\GHOST\PIPELINE_INIT</p>
          </div>
          <div className="text-right font-mono text-xs hidden md:block">
            <p>STATUS: <span className="animate-pulse">ONLINE</span></p>
            <p>UPTIME: 1,402:42:12</p>
            <p>REGION: GLOBAL_EDGE</p>
          </div>
        </header>

        {/* Hero Section */}
        <section className="mb-24">
          {!booted ? (
            <div className="h-[400px] border border-[#333] p-8 flex flex-col justify-end bg-[#050505]">
              <TerminalLine delay={100}>INITIALIZING BOOT SEQUENCE...</TerminalLine>
              <TerminalLine delay={400}>LOADING NEURAL SCRIPT ENGINE (CLAUDE-3.5-SONNET)... OK</TerminalLine>
              <TerminalLine delay={700}>CONNECTING ELEVENLABS VOICE API... OK</TerminalLine>
              <TerminalLine delay={1000}>ESTABLISHING YOUTUBE_DATA_STREAM... OK</TerminalLine>
              <TerminalLine delay={1300}>OPTIMIZING THROUGHPUT ARCHITECTURE... OK</TerminalLine>
              <TerminalLine delay={1600}>REMOVING HUMAN BIAS... OK</TerminalLine>
              <TerminalLine delay={2000}>SYSTEM READY.</TerminalLine>
              <div className="mt-4 h-1 bg-[#333] w-full">
                <div className="h-full bg-[#00FF41] animate-[progress_2s_ease-in-out]"></div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block border border-[#00FF41] px-2 py-1 mb-6 text-xs font-bold uppercase tracking-widest">
                  Industrial Content Manufacturing
                </div>
                <h2 className="font-mono text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-8">
                  YOUR PASSION IS A <span className="bg-[#00FF41] text-black px-2">BOTTLENECK</span>.
                </h2>
                <p className="font-mono text-lg text-[#00FF41]/80 max-w-md mb-8 leading-tight">
                  Stop "creating." Start deploying. VidFlow is a high-speed assembly line for the YouTube attention economy. 
                  Connect nodes. Run the pipeline. Collect the revenue.
                </p>
                <button className="bg-[#00FF41] text-black font-mono font-black text-2xl px-8 py-4 hover:bg-white transition-colors uppercase tracking-tighter">
                  INITIALIZE_ACCESS_COMMAND
                </button>
              </div>
              <div className="border border-[#333] p-2 bg-[#050505] relative group">
                <div className="absolute -top-3 -right-3 bg-red-600 text-white px-2 py-1 text-[10px] font-bold animate-bounce">
                  LIVE_EXECUTION
                </div>
                <div className="aspect-square bg-black border border-[#222] p-4 flex flex-col">
                  <div className="flex-1 overflow-hidden font-mono text-[10px] text-[#00FF41]/40 leading-none">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div key={i} className="whitespace-nowrap overflow-hidden">
                        {Math.random().toString(36).substring(2, 15).repeat(5)}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-4 border border-[#00FF41] bg-black">
                    <div className="flex justify-between text-xs mb-2">
                      <span>SCRIPT_NODE_v2</span>
                      <span>98% COMPLETE</span>
                    </div>
                    <div className="h-2 bg-[#111]">
                      <div className="h-full bg-[#00FF41] w-[98%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* The Grid / Nodes */}
        <section className="mb-24">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-mono text-3xl font-black uppercase tracking-tighter">NODE_ARCHITECTURE</h2>
            <div className="h-[1px] flex-1 bg-[#333]"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
            <NodeBox 
              title="TRIGGER" 
              status="ACTIVE" 
              desc="NicheRadar integration detects high-velocity trends before they saturate. Auto-triggers production." 
            />
            <NodeBox 
              title="SCRIPT" 
              status="READY" 
              desc="Claude-powered engine generates scripts in your specific channel bible voice. Zero generic output." 
            />
            <NodeBox 
              title="VOICE" 
              status="CONNECTED" 
              desc="ElevenLabs synthesis with emotion mapping. Cloned voices that hold retention better than humans." 
            />
            <NodeBox 
              title="THUMBNAIL" 
              status="GEN_WAIT" 
              desc="Gemini-driven visual analysis creates 3 variants with predicted CTR scores based on current metadata." 
            />
            <NodeBox 
              title="ASSEMBLY" 
              status="IDLE" 
              desc="FFmpeg pipeline marries script, audio, and B-roll. Auto-subtitles and brand-compliant overlays." 
            />
            <NodeBox 
              title="PUBLISH" 
              status="SECURE" 
              desc="OAuth2 secure publishing with templated SEO. Scheduled for peak audience engagement windows." 
            />
          </div>
        </section>

        {/* The "Arbitrage" Quote */}
        <section className="mb-24 py-16 border-y border-[#333] text-center">
          <p className="font-mono text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none max-w-4xl mx-auto italic">
            "WHILE YOU WERE FIGURING OUT HOW TO OPEN PREMIERE, MY PIPELINE JUST PUBLISHED THREE VIDEOS. THE ARBITRAGE IS REAL."
          </p>
          <p className="mt-8 font-mono text-sm opacity-50 uppercase tracking-widest">— SHADOW_OPERATOR_01 (1.2M SUBS)</p>
        </section>

        {/* Access Levels (Pricing) */}
        <section className="mb-24">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="border border-[#333] p-8 flex flex-col hover:bg-[#050505] transition-colors">
              <span className="text-xs opacity-50 font-mono mb-2">LVL_01</span>
              <h3 className="font-mono text-4xl font-black uppercase mb-4">OPERATOR</h3>
              <p className="font-mono text-sm mb-8 flex-1 opacity-70">Single pipeline. Manual overrides enabled. Ideal for validating new niches.</p>
              <div className="text-2xl font-mono font-bold mb-8">$49/MO</div>
              <button className="border border-[#00FF41] py-2 font-mono uppercase text-sm font-bold hover:bg-[#00FF41] hover:text-black transition-colors">REQUEST_ACCESS</button>
            </div>
            <div className="border-2 border-[#00FF41] p-8 flex flex-col bg-[#050505] relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#00FF41] text-black text-[10px] font-bold px-2 py-1 transform translate-x-3 rotate-45 w-32 text-center">MOST_COMMON</div>
              <span className="text-xs opacity-50 font-mono mb-2">LVL_02</span>
              <h3 className="font-mono text-4xl font-black uppercase mb-4">INDUSTRIAL</h3>
              <p className="font-mono text-sm mb-8 flex-1 opacity-70">5 parallel pipelines. Full automation capability. Advanced channel bible training.</p>
              <div className="text-2xl font-mono font-bold mb-8">$199/MO</div>
              <button className="bg-[#00FF41] text-black py-2 font-mono uppercase text-sm font-bold hover:bg-white transition-colors">REQUEST_ACCESS</button>
            </div>
            <div className="border border-[#333] p-8 flex flex-col hover:bg-[#050505] transition-colors">
              <span className="text-xs opacity-50 font-mono mb-2">LVL_03</span>
              <h3 className="font-mono text-4xl font-black uppercase mb-4">NETWORK</h3>
              <p className="font-mono text-sm mb-8 flex-1 opacity-70">Unlimited pipelines. Agency-grade workspace. Custom node integration support.</p>
              <div className="text-2xl font-mono font-bold mb-8">$599/MO</div>
              <button className="border border-[#00FF41] py-2 font-mono uppercase text-sm font-bold hover:bg-[#00FF41] hover:text-black transition-colors">REQUEST_ACCESS</button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#333] pt-8 flex flex-col md:flex-row justify-between gap-8">
          <div className="font-mono text-[10px] opacity-40">
            © 2026 VIDFLOW_OS. ALL RIGHTS RESERVED. <br />
            UNAUTHORIZED REPRODUCTION OF PIPELINE ARCHITECTURE WILL BE LOGGED.
          </div>
          <div className="flex gap-8 font-mono text-xs uppercase font-bold tracking-widest">
            <a href="#" className="hover:text-white">API_DOCS</a>
            <a href="#" className="hover:text-white">SECURITY_POLICY</a>
            <a href="#" className="hover:text-white">SYSTEM_STATUS</a>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @font-face {
          font-family: 'Space Mono';
          font-style: normal;
          font-weight: 400;
          src: local('Space Mono'), local('SpaceMono-Regular'), url(https://fonts.gstatic.com/s/spacemono/v12/i74Mm-9LR6F4uKTS3ERSC98.woff2) format('woff2');
        }
      `}</style>
    </div>
  );
}
