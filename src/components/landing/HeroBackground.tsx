import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Node {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  isInteractive?: boolean;
  createdAt?: number;
}

interface Connection {
  from: number;
  to: number;
  opacity: number;
}

interface HeroBackgroundProps {
  mousePosition?: { x: number; y: number } | null;
}

// Grid-based distribution for better coverage
const generateNodes = (count: number): Node[] => {
  const nodes: Node[] = [];
  const cols = 7;
  const rows = Math.ceil(count / cols);
  const cellWidth = 100 / cols;
  const cellHeight = 100 / rows;
  
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    nodes.push({
      id: i,
      x: col * cellWidth + Math.random() * cellWidth * 0.8 + cellWidth * 0.1,
      y: row * cellHeight + Math.random() * cellHeight * 0.8 + cellHeight * 0.1,
      size: 4 + Math.random() * 8,
      delay: Math.random() * 2,
      duration: 8 + Math.random() * 7,
    });
  }
  return nodes;
};

const calculateConnections = (nodes: Node[], maxDistance: number): Connection[] => {
  const connections: Connection[] = [];
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < maxDistance) {
        connections.push({
          from: i,
          to: j,
          opacity: 0.15 * (1 - distance / maxDistance),
        });
      }
    }
  }
  
  return connections;
};

export function HeroBackground({ mousePosition }: HeroBackgroundProps) {
  const [nodes] = useState(() => generateNodes(35));
  const [interactiveNodes, setInteractiveNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const nodeIdCounter = useRef(100);
  const lastNodeTime = useRef(0);

  // Only calculate connections for static nodes
  useEffect(() => {
    setConnections(calculateConnections(nodes, 30));
  }, [nodes]);

  // Auto-remove old interactive nodes
  useEffect(() => {
    const cleanup = setInterval(() => {
      setInteractiveNodes(prev => 
        prev.filter(node => Date.now() - (node.createdAt || 0) < 4000)
      );
    }, 500);
    
    return () => clearInterval(cleanup);
  }, []);

  // Create nodes when mouse moves (triggered from parent)
  useEffect(() => {
    if (!mousePosition) return;
    
    const now = Date.now();
    if (now - lastNodeTime.current < 100) return;
    lastNodeTime.current = now;
    
    const newNode: Node = {
      id: nodeIdCounter.current++,
      x: mousePosition.x,
      y: mousePosition.y,
      size: 3 + Math.random() * 5,
      delay: 0,
      duration: 3 + Math.random() * 2,
      isInteractive: true,
      createdAt: Date.now(),
    };
    
    setInteractiveNodes(prev => [...prev, newNode].slice(-15));
  }, [mousePosition]);

  return (
    <div 
      className="absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Base gradient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* SVG for connection lines */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {connections.map((conn, index) => (
          <motion.line
            key={index}
            x1={`${nodes[conn.from].x}%`}
            y1={`${nodes[conn.from].y}%`}
            x2={`${nodes[conn.to].x}%`}
            y2={`${nodes[conn.to].y}%`}
            stroke="url(#lineGradient)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: conn.opacity,
            }}
            transition={{
              duration: 2,
              delay: index * 0.05,
              ease: "easeOut",
            }}
          />
        ))}
      </svg>

      {/* Animated nodes */}
      {nodes.map((node) => (
        <motion.div
          key={node.id}
          className="absolute rounded-full bg-primary"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            width: node.size,
            height: node.size,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.2, 1],
            x: [0, 15, -10, 5, 0],
            y: [0, -10, 15, -5, 0],
          }}
          transition={{
            duration: node.duration,
            delay: node.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Glow effect for larger nodes */}
          {node.size > 8 && (
            <motion.div
              className="absolute inset-0 rounded-full bg-primary blur-md"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1.5, 2, 1.5],
              }}
              transition={{
                duration: node.duration * 0.8,
                delay: node.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </motion.div>
      ))}

      {/* Interactive nodes created by mouse */}
      <AnimatePresence>
        {interactiveNodes.map((node) => (
          <motion.div
            key={node.id}
            className="absolute rounded-full bg-primary pointer-events-none"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              width: node.size,
              height: node.size,
              marginLeft: -node.size / 2,
              marginTop: -node.size / 2,
            }}
            initial={{ opacity: 0.8, scale: 0 }}
            animate={{
              opacity: [0.8, 0.5, 0],
              scale: [0, 1.5, 2.5],
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              duration: 3,
              ease: "easeOut",
            }}
          >
            <motion.div
              className="absolute inset-0 rounded-full bg-primary blur-md"
              animate={{
                opacity: [0.6, 0.3, 0],
                scale: [1, 2, 3],
              }}
              transition={{
                duration: 3,
                ease: "easeOut",
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Central accent glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-primary/20 blur-2xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
