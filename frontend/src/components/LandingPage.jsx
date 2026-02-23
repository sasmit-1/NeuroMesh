import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const LandingPage = ({ onLaunch }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isBooted, setIsBooted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // 1. FAKE TERMINAL BOOT SEQUENCE
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsBooted(true);
            window.scrollTo(0, 0); 
          }, 400); // Sped up the transition slightly for a snappier feel
          return 100;
        }
        return prev + Math.floor(Math.random() * 20) + 5;
      });
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // 2. MOUSE TRACKER FOR CUSTOM CURSOR & BG
  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // --- COMPONENT: THE BOOT SCREEN ---
  if (!isBooted) {
    return (
      <div style={{ width: '100%', height: '100vh', background: '#050505', color: '#00ffff', fontFamily: 'monospace', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden', boxSizing: 'border-box' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: '#4ba3e3' }}>NEUROMESH OS [Version 2.0.1]</div>
          <div style={{ fontSize: '12px', color: '#4ba3e3' }}>Initializing Local Host...</div>
          <br/>
          <div style={{ color: '#fff' }}>C:\System\Kernel{'>'} allocate_vram --max</div>
          <div style={{ color: '#fff' }}>C:\System\Kernel{'>'} inject_taubin_filters</div>
          <div style={{ color: '#fff' }}>C:\System\Kernel{'>'} mount_dicom_pipeline</div>
          <br/>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ffff', textShadow: '0 0 10px rgba(0,255,255,0.5)' }}>
            IGNITING ENGINE... {loadingProgress > 100 ? 100 : loadingProgress}%
          </div>
          <div style={{ width: '100%', maxWidth: '600px', height: '2px', background: '#111', marginTop: '10px' }}>
            <motion.div style={{ height: '100%', background: '#00ffff' }} initial={{ width: '0%' }} animate={{ width: `${loadingProgress}%` }} />
          </div>
        </motion.div>
      </div>
    );
  }

  // --- COMPONENT: THE MAIN SCROLLING PAGE ---
  return (
    <div style={{ 
      width: '100%', minHeight: '100vh', background: '#020202', color: '#fff', 
      overflowX: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif',
      cursor: 'none', // Hides default cursor so we can use our custom animated one
      boxSizing: 'border-box'
    }}>
      
      {/* CUSTOM ANIMATED CURSOR */}
      <motion.div 
        animate={{ x: mousePos.x - 8, y: mousePos.y - 8 }}
        transition={{ type: 'spring', stiffness: 500, damping: 28, mass: 0.5 }}
        style={{
          position: 'fixed', top: 0, left: 0, width: '16px', height: '16px',
          background: '#00ffff', borderRadius: '50%', pointerEvents: 'none', zIndex: 9999,
          boxShadow: '0 0 15px #00ffff', mixBlendMode: 'screen'
        }} 
      />

      {/* GLOBAL BACKGROUND: INFINITELY PANNING GRID WITH FLASHLIGHT MASK */}
      <motion.div 
        animate={{ backgroundPosition: ['0px 0px', '40px 40px'] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          WebkitMaskImage: `radial-gradient(circle 600px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
          maskImage: `radial-gradient(circle 600px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
        }} 
      />

      {/* ================= SECTION 1: HERO ================= */}
      <section style={{ position: 'relative', width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }}
          style={{ position: 'absolute', top: '40px', left: '40px', color: '#4ba3e3', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '2px' }}>
          <div>STATUS: <span style={{ color: '#00ffff' }}>ONLINE</span></div>
          <div>WEBGL:  <span style={{ color: '#00ffff' }}>ACCELERATED</span></div>
        </motion.div>

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
          {/* THE FIX: Thicker Stroke, Minimal Animation */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ fontSize: 'clamp(80px, 13vw, 200px)', fontWeight: '900', color: 'transparent', WebkitTextStroke: '3px rgba(255,255,255,0.4)', lineHeight: '0.85', letterSpacing: '-0.02em', margin: 0 }}
          >
            NEURO
          </motion.h1>
          <motion.h1
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            style={{ fontSize: 'clamp(80px, 13vw, 200px)', fontWeight: '900', color: '#fff', lineHeight: '0.85', letterSpacing: '-0.02em', margin: 0 }}
          >
            MESH.
          </motion.h1>
          
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }}
            style={{ color: '#a0aab5', fontSize: '14px', letterSpacing: '4px', textTransform: 'uppercase', marginTop: '30px', fontFamily: 'monospace' }}>
            Clinical 3D Rendering & Data Processing Pipeline
          </motion.p>
        </div>

        <motion.button
          onClick={onLaunch}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }}
          whileHover={{ scale: 1.02, backgroundColor: '#00ffff', color: '#000' }} whileTap={{ scale: 0.98 }}
          style={{
            marginTop: '50px', padding: '18px 50px', background: 'transparent', border: '1px solid #00ffff', 
            borderRadius: '100px', color: '#00ffff', fontSize: '13px', fontWeight: 'bold', letterSpacing: '3px', 
            cursor: 'none', transition: 'background 0.3s ease, color 0.3s ease', zIndex: 10 // Cursor none so custom cursor hovers over it
          }}
        >
          ENTER ENGINE
        </motion.button>

        {/* Minimal Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          style={{ position: 'absolute', bottom: '40px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '2px', fontFamily: 'monospace' }}
        >
          SCROLL TO EXPLORE ↓
        </motion.div>
      </section>

      {/* ================= SECTION 2: ABOUT THE PROJECT ================= */}
      {/* THE FIX: Constrained width to 1200px and centered with margin: 0 auto */}
      <section style={{ position: 'relative', width: '100%', padding: '100px 5%', zIndex: 5 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, ease: "easeOut" }}>
            <h2 style={{ fontSize: '12px', color: '#00ffff', letterSpacing: '4px', fontFamily: 'monospace', marginBottom: '10px' }}>// SYSTEM ARCHITECTURE</h2>
            <h3 style={{ fontSize: '36px', fontWeight: '800', margin: '0 0 50px 0', letterSpacing: '-1px' }}>Beyond the Pixel.</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '40px' }}>
                <div style={{ fontSize: '20px', marginBottom: '15px', color: '#00ffff' }}>01.</div>
                <h4 style={{ fontSize: '18px', marginBottom: '10px', fontWeight: '600' }}>Omnidirectional Scalpel</h4>
                <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>Three independent clipping planes mapped to X, Y, and Z axes, allowing real-time cross-sectional analysis of complex clinical geometries.</p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '40px' }}>
                <div style={{ fontSize: '20px', marginBottom: '15px', color: '#00ffff' }}>02.</div>
                <h4 style={{ fontSize: '18px', marginBottom: '10px', fontWeight: '600' }}>Taubin Geometry Smoothing</h4>
                <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>Raw Marching Cubes arrays are passed through an enterprise-grade, non-shrinking smoothing algorithm to eliminate voxel-stepping artifacts.</p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '40px' }}>
                <div style={{ fontSize: '20px', marginBottom: '15px', color: '#00ffff' }}>03.</div>
                <h4 style={{ fontSize: '18px', marginBottom: '10px', fontWeight: '600' }}>WebGL Acceleration</h4>
                <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>Powered by Three.js and dynamic chunk-loading, capable of rendering over 400,000 polygons locally at 60FPS without cloud dependencies.</p>
              </div>

            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= SECTION 3: ABOUT ME (THE ARCHITECT) ================= */}
      {/* THE FIX: Constrained width to 900px and centered it perfectly */}
      <section style={{ position: 'relative', width: '100%', padding: '100px 5% 150px 5%', zIndex: 5 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ background: '#080c10', border: '1px solid rgba(0,255,255,0.15)', borderRadius: '24px', padding: '60px', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '30px', background: 'rgba(0,255,255,0.05)', borderBottom: '1px solid rgba(0,255,255,0.1)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff4d4d' }}></div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffcc00' }}></div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00cc00' }}></div>
              <span style={{ marginLeft: '10px', fontSize: '10px', color: '#00ffff', fontFamily: 'monospace' }}>sys_architect.exe</span>
            </div>

            <div style={{ marginTop: '20px' }}>
              <h2 style={{ fontSize: '12px', color: '#00ffff', letterSpacing: '4px', fontFamily: 'monospace', marginBottom: '10px' }}>// LEAD DEVELOPER</h2>
              <h3 style={{ fontSize: '36px', fontWeight: '800', margin: '0 0 15px 0', color: '#fff' }}>Sasmit Mondal</h3>
              <p style={{ color: '#a0aab5', fontSize: '15px', lineHeight: '1.8', maxWidth: '700px', marginBottom: '40px' }}>
                Computer Science Engineering student specializing in high-performance web applications, 3D graphics, and cybersecurity. 
                NeuroMesh was engineered to bridge the gap between heavy mathematical processing in Python and lightning-fast WebGL rendering in the browser.
              </p>

              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <a href="YOUR_GITHUB_LINK_HERE" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', cursor: 'none' }}>
                  <motion.div whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.1)' }} whileTap={{ scale: 0.98 }}
                    style={{ padding: '12px 24px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s ease' }}>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    GITHUB
                  </motion.div>
                </a>
                
                <a href="YOUR_LINKEDIN_LINK_HERE" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', cursor: 'none' }}>
                  <motion.div whileHover={{ scale: 1.02, background: 'rgba(0,119,181,0.1)', borderColor: '#0077b5' }} whileTap={{ scale: 0.98 }}
                    style={{ padding: '12px 24px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s ease, border-color 0.2s ease' }}>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                    LINKEDIN
                  </motion.div>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER MARQUEE (Fixed at bottom so it doesn't break layout) */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', overflow: 'hidden', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#020202', zIndex: 10 }}>
        <motion.div animate={{ x: [0, -1000] }} transition={{ repeat: Infinity, ease: 'linear', duration: 25 }}
          style={{ whiteSpace: 'nowrap', display: 'inline-block', color: 'rgba(255,255,255,0.2)', fontSize: '10px', letterSpacing: '3px', fontFamily: 'monospace' }}>
          // NEUROMESH v2.0 // LOCAL ENVIRONMENT SECURE // NO CLOUD DEPENDENCY // NEUROMESH v2.0 // LOCAL ENVIRONMENT SECURE // NO CLOUD DEPENDENCY //
        </motion.div>
      </div>

    </div>
  );
};

export default LandingPage;