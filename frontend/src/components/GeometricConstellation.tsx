import { useEffect, useRef } from 'react';

interface ConstellationNode {
    id: number;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    size: number;
    glow: number;
    targetX?: number;
    targetY?: number;
    targetZ?: number;
}

interface GeometricConstellationProps {
    state: 'idle' | 'username' | 'password' | 'auth' | 'error';
    mousePosition: { x: number; y: number };
}

export default function GeometricConstellation({ state, mousePosition }: GeometricConstellationProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const nodesRef = useRef<ConstellationNode[]>([]);
    const animationFrameRef = useRef<number>();

    // Initialize nodes
    useEffect(() => {
        const nodeCount = 60;
        const nodes: ConstellationNode[] = [];

        for (let i = 0; i < nodeCount; i++) {
            // Spherical distribution for idle state
            const phi = Math.acos(-1 + (2 * i) / nodeCount);
            const theta = Math.sqrt(nodeCount * Math.PI) * phi;
            const radius = 180;

            nodes.push({
                id: i,
                x: radius * Math.cos(theta) * Math.sin(phi),
                y: radius * Math.sin(theta) * Math.sin(phi),
                z: radius * Math.cos(phi),
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                vz: (Math.random() - 0.5) * 0.3,
                size: 3 + Math.random() * 3,
                glow: 0.5 + Math.random() * 0.5,
            });
        }

        nodesRef.current = nodes;
    }, []);

    // Get target positions based on state
    // Wrapped in useRef to be accessible in useEffect without dependency issues or recreated on render
    const getTargetPositionsRef = useRef((currentState: string): Array<{ x: number; y: number; z: number }> => {
        const nodes = nodesRef.current;
        const positions: Array<{ x: number; y: number; z: number }> = [];

        switch (currentState) {
            case 'idle': {
                // Spherical distribution with rotation
                nodes.forEach((_, i) => {
                    const phi = Math.acos(-1 + (2 * i) / nodes.length);
                    const theta = Math.sqrt(nodes.length * Math.PI) * phi;
                    const radius = 180;
                    positions.push({
                        x: radius * Math.cos(theta) * Math.sin(phi),
                        y: radius * Math.sin(theta) * Math.sin(phi),
                        z: radius * Math.cos(phi),
                    });
                });
                break;
            }

            case 'username': {
                // Keyhole/Portal shape
                nodes.forEach((_, i) => {
                    const ratio = i / nodes.length;

                    if (ratio < 0.7) {
                        // Outer ring
                        const angle = (i / (nodes.length * 0.7)) * Math.PI * 2;
                        const radius = 160;
                        const wobble = Math.sin(angle * 3) * 10;
                        positions.push({
                            x: Math.cos(angle) * (radius + wobble),
                            y: Math.sin(angle) * (radius + wobble),
                            z: Math.cos(angle * 2) * 30,
                        });
                    } else {
                        // Inner hole (keyhole part)
                        const angle = ((i - nodes.length * 0.7) / (nodes.length * 0.3)) * Math.PI * 2;
                        const radius = 60;
                        positions.push({
                            x: Math.cos(angle) * radius,
                            y: Math.sin(angle) * radius + 40,
                            z: Math.sin(angle * 3) * 15,
                        });
                    }
                });
                break;
            }

            case 'password': {
                // Lock formation
                nodes.forEach((_, i) => {
                    const ratio = i / nodes.length;

                    if (ratio < 0.4) {
                        // Lock shackle (top arc)
                        const angle = (ratio / 0.4) * Math.PI;
                        const radius = 80;
                        positions.push({
                            x: Math.cos(angle) * radius,
                            y: Math.sin(angle) * radius - 100,
                            z: Math.cos(angle * 2) * 20,
                        });
                    } else {
                        // Lock body (bottom rectangle cluster)
                        const localIdx = i - nodes.length * 0.4;
                        const cols = 8;
                        const col = localIdx % cols;
                        const row = Math.floor(localIdx / cols);

                        positions.push({
                            x: (col - cols / 2) * 25,
                            y: row * 20 + 20,
                            z: (Math.sin(col) * Math.cos(row)) * 15,
                        });
                    }
                });
                break;
            }

            case 'auth': {
                // Checkmark formation
                nodes.forEach((_, i) => {
                    const ratio = i / nodes.length;

                    if (ratio < 0.35) {
                        // Left stroke (going down)
                        const t = ratio / 0.35;
                        positions.push({
                            x: -80 + t * 60,
                            y: -40 + t * 80,
                            z: Math.sin(t * Math.PI) * 20,
                        });
                    } else {
                        // Right stroke (going up)
                        const t = (ratio - 0.35) / 0.65;
                        positions.push({
                            x: -20 + t * 140,
                            y: 40 - t * 140,
                            z: Math.sin(t * Math.PI) * 25,
                        });
                    }
                });
                break;
            }

            case 'error': {
                // Scattered/dispersed
                nodes.forEach((_, i) => {
                    const angle = (i / nodes.length) * Math.PI * 2;
                    const distance = 250 + Math.random() * 100;
                    // Add some variance based on mouse position for dynamic scatter
                    const mouseInfluence = (mousePosition.x + mousePosition.y) * 0.5;
                    positions.push({
                        x: Math.cos(angle) * distance + (Math.random() - 0.5) * 100 + mouseInfluence,
                        y: Math.sin(angle) * distance + (Math.random() - 0.5) * 100,
                        z: (Math.random() - 0.5) * 150,
                    });
                });
                break;
            }

            default:
                return positions;
        }

        return positions;
    });

    // Animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;

        let rotation = 0;
        let authAnimationStart = 0;
        const getTargetPositions = getTargetPositionsRef.current;

        const animate = (timestamp: number) => {
            if (!ctx) return;

            // Clear canvas
            ctx.fillStyle = 'rgba(0, 0, 0, 0)';
            ctx.clearRect(0, 0, width, height);

            const nodes = nodesRef.current;
            const targetPositions = getTargetPositions(state);

            // Update rotation for idle state
            if (state === 'idle') {
                rotation += 0.003;
            }

            // Update auth animation progress
            let authProgress = 0;
            if (state === 'auth') {
                if (authAnimationStart === 0) {
                    authAnimationStart = timestamp;
                }
                const elapsed = timestamp - authAnimationStart;
                authProgress = Math.min(elapsed / 2000, 1);
            } else {
                authAnimationStart = 0;
                authProgress = 0;
            }

            // Update node positions
            nodes.forEach((node, i) => {
                const target = targetPositions[i];
                if (!target) return;

                // Smooth transition to target
                const easing = state === 'error' ? 0.02 : 0.08;
                node.x += (target.x - node.x) * easing;
                node.y += (target.y - node.y) * easing;
                node.z += (target.z - node.z) * easing;

                // Add floating motion in idle state
                if (state === 'idle') {
                    node.x += Math.sin(timestamp * 0.001 + node.id) * 0.3;
                    node.y += Math.cos(timestamp * 0.001 + node.id) * 0.3;
                    node.z += Math.sin(timestamp * 0.0015 + node.id) * 0.2;
                }
            });

            // Apply rotation for idle state
            const rotatedNodes = nodes.map(node => {
                if (state === 'idle') {
                    const cosx = Math.cos(rotation);
                    const sinx = Math.sin(rotation);
                    const cosy = Math.cos(rotation * 0.7);
                    const siny = Math.sin(rotation * 0.7);

                    // Rotate around Y axis
                    const x = node.x * cosy + node.z * siny;
                    let z = -node.x * siny + node.z * cosy;

                    // Rotate around X axis
                    const y = node.y * cosx - z * sinx;
                    z = node.y * sinx + z * cosx;

                    return { ...node, x, y, z };
                }
                return node;
            });

            // Sort nodes by z-depth for proper rendering
            const sortedNodes = [...rotatedNodes].sort((a, b) => a.z - b.z);

            // Draw connections
            ctx.strokeStyle = state === 'error' ? 'rgba(239, 68, 68, 0.3)' :
                state === 'password' ? 'rgba(147, 51, 234, 0.4)' :
                    state === 'username' ? 'rgba(59, 130, 246, 0.4)' :
                        state === 'auth' ? 'rgba(6, 212, 160, 0.5)' :
                            'rgba(6, 182, 212, 0.35)';

            rotatedNodes.forEach((node, i) => {
                rotatedNodes.forEach((otherNode, j) => {
                    if (i >= j) return;

                    const dx = node.x - otherNode.x;
                    const dy = node.y - otherNode.y;
                    const dz = node.z - otherNode.z;
                    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    const maxDistance = state === 'idle' ? 120 :
                        state === 'password' ? 80 :
                            state === 'username' ? 100 :
                                state === 'auth' ? 150 : 100;

                    if (distance < maxDistance) {
                        const opacity = 1 - distance / maxDistance;
                        const avgZ = (node.z + otherNode.z) / 2;
                        const depthOpacity = Math.max(0.2, 1 - (avgZ + 200) / 400);

                        ctx.beginPath();
                        ctx.moveTo(centerX + node.x, centerY + node.y);
                        ctx.lineTo(centerX + otherNode.x, centerY + otherNode.y);

                        const baseOpacity = opacity * depthOpacity;
                        ctx.strokeStyle = state === 'error' ? `rgba(239, 68, 68, ${baseOpacity * 0.4})` :
                            state === 'password' ? `rgba(147, 51, 234, ${baseOpacity * 0.5})` :
                                state === 'username' ? `rgba(59, 130, 246, ${baseOpacity * 0.5})` :
                                    state === 'auth' ? `rgba(6, 212, 160, ${baseOpacity * 0.6})` :
                                        `rgba(6, 182, 212, ${baseOpacity * 0.45})`;

                        ctx.lineWidth = state === 'auth' ? 2 : 1;
                        ctx.stroke();
                    }
                });
            });

            // Draw nodes
            sortedNodes.forEach((node, i) => {
                const screenX = centerX + node.x;
                const screenY = centerY + node.y;

                // Depth-based size and opacity
                const depthScale = Math.max(0.3, 1 - (node.z + 200) / 600);
                const nodeSize = node.size * depthScale;
                const depthOpacity = Math.max(0.3, 1 - (node.z + 200) / 500);

                // Auth animation: sequential lighting
                let authGlow = 1;
                if (state === 'auth') {
                    const nodeProgress = i / nodes.length;
                    if (authProgress > nodeProgress) {
                        authGlow = 2 + Math.sin((authProgress - nodeProgress) * Math.PI * 4);
                    } else {
                        authGlow = 0.3;
                    }
                }

                // Outer glow
                const glowSize = nodeSize * 3 * node.glow * authGlow;
                const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, glowSize);

                const glowColor = state === 'error' ? '239, 68, 68' :
                    state === 'password' ? '147, 51, 234' :
                        state === 'username' ? '59, 130, 246' :
                            state === 'auth' ? '6, 212, 160' :
                                '6, 182, 212';

                gradient.addColorStop(0, `rgba(${glowColor}, ${0.8 * depthOpacity * authGlow})`);
                gradient.addColorStop(0.4, `rgba(${glowColor}, ${0.4 * depthOpacity * authGlow})`);
                gradient.addColorStop(1, `rgba(${glowColor}, 0)`);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenX, screenY, glowSize, 0, Math.PI * 2);
                ctx.fill();

                // Core node
                const coreGradient = ctx.createRadialGradient(
                    screenX - nodeSize * 0.3,
                    screenY - nodeSize * 0.3,
                    0,
                    screenX,
                    screenY,
                    nodeSize
                );
                coreGradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * depthOpacity})`);
                coreGradient.addColorStop(0.3, `rgba(${glowColor}, ${0.9 * depthOpacity})`);
                coreGradient.addColorStop(1, `rgba(${glowColor}, ${0.6 * depthOpacity})`);

                ctx.fillStyle = coreGradient;
                ctx.beginPath();
                ctx.arc(screenX, screenY, nodeSize, 0, Math.PI * 2);
                ctx.fill();

                // Highlight
                ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * depthOpacity})`;
                ctx.beginPath();
                ctx.arc(screenX - nodeSize * 0.3, screenY - nodeSize * 0.3, nodeSize * 0.3, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [state]);

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <canvas
                ref={canvasRef}
                width={600}
                height={600}
                className="max-w-full max-h-full"
                style={{ filter: 'contrast(1.1) brightness(1.05)' }}
            />
        </div>
    );
}
