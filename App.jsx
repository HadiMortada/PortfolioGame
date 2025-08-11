import React, { Suspense, useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, Html, Text, Stars, Sparkles, MeshDistortMaterial } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, DepthOfField, Noise } from "@react-three/postprocessing";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Linkedin, Mail, Gamepad2, ExternalLink } from "lucide-react";

/*
  Hadi – Gameverse 3D Portfolio
  -------------------------------------------------------
  A game-like portfolio with 3D scene navigation, portals as projects,
  particle FX, neon palette, and cinematic post-processing.
*/

const PALETTE = {
  bg: "#05060A",
  primary: "#00D4FF",
  accent: "#9B5DE5",
  heat: "#FF6F3C",
  ink: "#E6E8EC",
};

const PROJECTS = [
  {
    id: "mship",
    title: "Mysterious Ship — HDRP",
    subtitle: "Cinematic puzzle on a sinking liner",
    desc: "Escape-room logics, dynamic water rise, HDRP lighting, and an AI hint system.",
    links: [
      { label: "Case Study", href: "#" },
      { label: "Unity WebGL", href: "#" }
    ],
    color: "#00D4FF",
    position: [ -4, 1, -2 ],
  },
  {
    id: "pacman",
    title: "PACMAN Clone — AI Ghosts",
    subtitle: "Behavior trees + pursuit logic",
    desc: "2D systems design with custom pathfinding, collision, and juicy feel.",
    links: [
      { label: "GitHub", href: "#" },
      { label: "Play Demo", href: "#" }
    ],
    color: "#9B5DE5",
    position: [ 0, 1.2, -4 ],
  },
  {
    id: "monster",
    title: "Monster Chase — Platformer",
    subtitle: "Animator-driven enemy AI",
    desc: "Tight controls, hit reactions, and polished feedback loops.",
    links: [
      { label: "GitHub", href: "#" },
      { label: "Play Demo", href: "#" }
    ],
    color: "#FF6F3C",
    position: [ 4, 1, -2 ],
  },
  {
    id: "arproto",
    title: "AR Interface Prototypes",
    subtitle: "Tracked overlays + anchors",
    desc: "Mobile AR flows with performance-aware UX and authoring pipelines.",
    links: [
      { label: "Video", href: "#" },
      { label: "Figma Flow", href: "#" }
    ],
    color: "#00FFA3",
    position: [ 0, 1.4, 0 ],
  },
];

function NeonRing({ radius = 1.2, thickness = 0.06, color = PALETTE.primary }) {
  const ref = useRef();
  useFrame((state, delta) => (ref.current.rotation.z += delta * 0.25));
  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, thickness, 64, 128]} />
      <meshStandardMaterial emissive={color} emissiveIntensity={1.5} color={"black"} metalness={0.2} roughness={0.3} />
    </mesh>
  );
}

function WobbleGem({ color = PALETTE.accent, position = [0, 1, 0] }) {
  const ref = useRef();
  useFrame((_, d) => {
    ref.current.rotation.y += d * 0.6;
    ref.current.position.y = position[1] + Math.sin(performance.now() / 900) * 0.15;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.6} floatIntensity={1.2}>
      <mesh ref={ref} position={position} castShadow>
        <icosahedronGeometry args={[0.45, 1]} />
        <MeshDistortMaterial distort={0.3} speed={2.2} color={color} emissive={color} emissiveIntensity={0.8} roughness={0.25} metalness={0.2} />
      </mesh>
    </Float>
  );
}

function ProjectPortal({ project, onOpen }) {
  const group = useRef();
  const { id, title, subtitle, position, color } = project;
  const hover = useRef(false);

  useFrame((state, delta) => {
    const s = hover.current ? 1.1 : 1;
    group.current.scale.x += (s - group.current.scale.x) * 0.1;
    group.current.scale.y += (s - group.current.scale.y) * 0.1;
    group.current.scale.z += (s - group.current.scale.z) * 0.1;
  });

  return (
    <group ref={group} position={position}>
      <NeonRing radius={1.15} thickness={0.05} color={color} />
      <WobbleGem color={color} position={[position[0], position[1] + 0.4, position[2]]} />
      <Html center transform distanceFactor={2}>
        <div
          onPointerEnter={() => (hover.current = true)}
          onPointerLeave={() => (hover.current = false)}
          onClick={() => onOpen(id)}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            background: "rgba(5,6,10,0.6)",
            border: `1px solid rgba(255,255,255,0.1)`,
            color: "white",
            backdropFilter: "blur(10px)",
            boxShadow: `0 10px 40px -10px ${color}66`,
            cursor: "pointer",
            textAlign: "center",
            width: 240,
          }}
        >
          <div style={{ fontWeight: 700, letterSpacing: 0.2 }}>{title}</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>{subtitle}</div>
          <div style={{ fontSize: 11, marginTop: 6, color }}>Click to enter</div>
        </div>
      </Html>
    </group>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[100, 100, 1, 1]} />
      <meshStandardMaterial color="#0C0F14" roughness={0.9} metalness={0.1} />
    </mesh>
  );
}

function Scene({ onOpen }) {
  const lightRef = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    lightRef.current.position.x = Math.sin(t / 3) * 4;
    lightRef.current.position.z = Math.cos(t / 3) * 4;
  });

  return (
    <>
      <color attach="background" args={[PALETTE.bg]} />
      <ambientLight intensity={0.2} />
      <directionalLight ref={lightRef} position={[5, 5, 5]} intensity={2} castShadow color={PALETTE.primary} />

      <Stars radius={80} depth={60} count={4000} factor={4} fade speed={1} />
      <Sparkles size={2} color={PALETTE.accent} opacity={0.3} scale={[30, 15, 30]} speed={0.5} />

      <Float speed={1} rotationIntensity={0.3} floatIntensity={0.6}>
        <Text position={[0, 2.2, 1]} fontSize={0.5} color={PALETTE.ink} anchorX="center" anchorY="middle">
          HADI MORTADA
        </Text>
        <Text position={[0, 1.7, 1]} fontSize={0.24} color={PALETTE.primary} anchorX="center" anchorY="middle">
          Unity AR Developer • XR & Immersive Interfaces
        </Text>
      </Float>

      {PROJECTS.map((p) => (
        <ProjectPortal key={p.id} project={p} onOpen={onOpen} />
      ))}

      <Ground />

      <EffectComposer>
        <Bloom intensity={1.2} luminanceThreshold={0.2} luminanceSmoothing={0.025} />
        <DepthOfField focusDistance={0.012} focalLength={0.018} bokehScale={2} />
        <Noise opacity={0.02} />
        <Vignette eskil={false} offset={0.2} darkness={0.8} />
      </EffectComposer>

      <OrbitControls enablePan={false} enableDamping dampingFactor={0.08} minDistance={3} maxDistance={12} />
    </>
  );
}

function HUD({ onContact, xp = 42 }) {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14 }}>
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 90, damping: 12 }}
          style={{ pointerEvents: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          <Gamepad2 color={PALETTE.primary} size={18} />
          <span style={{ color: PALETTE.ink, fontWeight: 600 }}>Gameverse</span>
        </motion.div>

        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 90, damping: 12 }}
          style={{ pointerEvents: "auto", display: "flex", gap: 12 }}>
          <a href="#" style={linkStyle}><Github size={16} /> GitHub</a>
          <a href="#" style={linkStyle}><Linkedin size={16} /> LinkedIn</a>
          <a href="#" style={linkStyle}><Mail size={16} /> Email</a>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        style={{ position: "fixed", left: 14, bottom: 14, pointerEvents: "auto", color: "#b9c2d0", fontSize: 12 }}>
        Drag/Pinch to explore • Tap a portal to open
        <div style={{ marginTop: 6, width: 180, height: 8, background: "#11151b", borderRadius: 999 }}>
          <div style={{ width: `${xp}%`, height: "100%", background: `linear-gradient(90deg, ${PALETTE.primary}, ${PALETTE.accent})`, borderRadius: 999 }} />
        </div>
      </motion.div>

      <motion.button whileTap={{ scale: 0.98 }} onClick={onContact}
        style={{ position: "fixed", right: 14, bottom: 14, pointerEvents: "auto", padding: "10px 14px", borderRadius: 12, border: `1px solid ${PALETTE.primary}55`, color: PALETTE.ink, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}>
        Contact Me
      </motion.button>
    </div>
  );
}

const linkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#E6E8EC",
  background: "rgba(8,10,14,0.35)",
  backdropFilter: "blur(8px)",
  textDecoration: "none",
};

function ProjectModal({ project, onClose }) {
  return (
    <AnimatePresence>
      {project && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "grid", placeItems: "center" }}>
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: "spring", stiffness: 120, damping: 16 }}
            style={{ width: "min(820px, 92vw)", borderRadius: 18, border: "1px solid rgba(255,255,255,0.1)", background: "linear-gradient(180deg, rgba(9,13,20,0.9), rgba(6,8,12,0.9))", color: "#E6E8EC", padding: 20, boxShadow: `0 20px 80px -20px ${project.color}88` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800, letterSpacing: 0.2, fontSize: 20 }}>{project.title}</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>{project.subtitle}</div>
              </div>
              <button onClick={onClose} style={{ padding: 8, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#DDE2EA" }}>
                Close
              </button>
            </div>
            <div style={{ marginTop: 14, lineHeight: 1.7, color: "#C9CDD3" }}>{project.desc}</div>
            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {project.links.map((l, idx) => (
                <a key={idx} href={l.href} style={{ ...linkStyle, borderColor: `${project.color}55` }}>
                  {l.label} <ExternalLink size={14} />
                </a>
              ))}
            </div>
            <div style={{ marginTop: 18, fontSize: 12, color: "#9AA3AF" }}>
              Tip: swap this block with a <code>Unity WebGL</code> iframe or a <code>Three.js</code> canvas preview.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ContactModal({ onClose }) {
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "grid", placeItems: "center" }}>
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: "spring", stiffness: 120, damping: 16 }}
          style={{ width: "min(680px, 92vw)", borderRadius: 18, border: "1px solid rgba(255,255,255,0.1)", background: "linear-gradient(180deg, rgba(9,13,20,0.9), rgba(6,8,12,0.9))", color: "#E6E8EC", padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 800, letterSpacing: 0.2, fontSize: 20 }}>Contact Me</div>
            <button onClick={onClose} style={{ padding: 8, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#DDE2EA" }}>Close</button>
          </div>
          <form style={{ marginTop: 16, display: "grid", gap: 10 }}>
            <input placeholder="Your name" style={inputStyle} />
            <input placeholder="Email" style={inputStyle} />
            <textarea placeholder="Tell me about your project" rows={5} style={inputStyle} />
            <button type="button" style={{ ...linkStyle, justifyContent: "center", borderColor: `${PALETTE.primary}55` }}>Send</button>
          </form>
          <div style={{ marginTop: 12, fontSize: 12, color: "#9AA3AF" }}>
            Bonus: add a QR code here that opens a WebAR scene.
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(7,9,13,0.5)",
  color: "#E6E8EC",
  outline: "none",
};

export default function GameversePortfolio() {
  const [active, setActive] = useState(null);
  const [contact, setContact] = useState(false);

  useEffect(() => {
    document.body.style.margin = 0;
    document.body.style.background = PALETTE.bg;
    document.body.style.color = PALETTE.ink;
  }, []);

  return (
    <div style={{ width: "100dvw", height: "100dvh", position: "relative" }}>
      <Canvas shadows camera={{ position: [0, 2, 6], fov: 55 }}>
        <Suspense fallback={null}>
          <Scene onOpen={(id) => setActive(PROJECTS.find(p => p.id === id))} />
        </Suspense>
      </Canvas>

      <HUD onContact={() => setContact(true)} />
      <ProjectModal project={active} onClose={() => setActive(null)} />
      {contact && <ContactModal onClose={() => setContact(false)} />}

      <div style={{ position: "fixed", right: 14, top: 56, fontSize: 11, color: "#9AA3AF", pointerEvents: "none" }}>
        Built with React • R3F • Drei • Postprocessing • Framer Motion
      </div>
    </div>
  );
}
