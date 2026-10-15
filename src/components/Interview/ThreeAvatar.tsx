import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { audioService } from '../../services/audio';
import type { InterviewerPersona } from '../../types/interview';

interface ThreeAvatarProps {
  persona: InterviewerPersona;
  isSpeaking: boolean;
  isCandidateSpeaking: boolean;
}

export const ThreeAvatar: React.FC<ThreeAvatarProps> = ({
  persona,
  isSpeaking,
  isCandidateSpeaking
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isSpeakingRef = useRef(isSpeaking);
  const isCandidateSpeakingRef = useRef(isCandidateSpeaking);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    isCandidateSpeakingRef.current = isCandidateSpeaking;
  }, [isCandidateSpeaking]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);

    const initialWidth = container.clientWidth || 640;
    const initialHeight = container.clientHeight || 420;

    const camera = new THREE.PerspectiveCamera(34, initialWidth / initialHeight, 0.1, 100);
    camera.position.set(0, 0.15, 3.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.appendChild(renderer.domElement);

    // 2. Lighting Rig (High-end Conference Video Call)
    const ambientLight = new THREE.AmbientLight(0xdce7f5, 0.85);
    scene.add(ambientLight);

    const primaryColor = new THREE.Color(persona.primaryColor || '#0071e3');

    // Key Light (warm executive studio lighting)
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    keyLight.position.set(2.2, 3.8, 3.2);
    scene.add(keyLight);

    // Fill Light (soft cool blue fill)
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.9);
    fillLight.position.set(-2.8, 1.2, 2.4);
    scene.add(fillLight);

    // Persona Rim Light (dramatic hair and shoulder rim)
    const rimLight = new THREE.DirectionalLight(primaryColor, 3.0);
    rimLight.position.set(0, 2.5, -2.8);
    scene.add(rimLight);

    // Subtle bottom glow
    const bottomLight = new THREE.PointLight(primaryColor, 0.8, 5);
    bottomLight.position.set(0, -1.2, 1.2);
    scene.add(bottomLight);

    // 3. Studio Background Elements
    const backdropGroup = new THREE.Group();
    scene.add(backdropGroup);

    // Studio Halo Ring
    const ringGeo = new THREE.TorusGeometry(1.5, 0.012, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: primaryColor, transparent: true, opacity: 0.28 });
    const studioRing = new THREE.Mesh(ringGeo, ringMat);
    studioRing.position.set(0, 0.15, -1.2);
    backdropGroup.add(studioRing);

    // Soft Ambient Bokeh Spheres
    const bokehColors = [0x1e3a8a, 0x0284c7, 0x3b82f6];
    const bokehSpheres: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const bGeo = new THREE.SphereGeometry(0.25 + Math.random() * 0.35, 16, 16);
      const bMat = new THREE.MeshBasicMaterial({
        color: bokehColors[i % bokehColors.length],
        transparent: true,
        opacity: 0.08 + Math.random() * 0.08
      });
      const bMesh = new THREE.Mesh(bGeo, bMat);
      bMesh.position.set(
        (Math.random() - 0.5) * 4.5,
        (Math.random() - 0.5) * 2.8,
        -1.5 - Math.random() * 1.5
      );
      backdropGroup.add(bMesh);
      bokehSpheres.push(bMesh);
    }

    // 4. Male Interviewer Avatar Hierarchy
    const avatarGroup = new THREE.Group();
    scene.add(avatarGroup);

    // Materials
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xd9a882, // warm realistic male skin tone
      roughness: 0.52,
      metalness: 0.04,
    });

    const hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f1f23, // deep espresso/black
      roughness: 0.75,
      metalness: 0.12,
    });

    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xfafafa,
      roughness: 0.08,
      metalness: 0.02,
    });

    const irisMaterial = new THREE.MeshStandardMaterial({
      color: 0x3b2416, // deep warm brown eyes
      roughness: 0.15,
      metalness: 0.2,
    });

    const pupilMaterial = new THREE.MeshBasicMaterial({
      color: 0x0a0a0c,
    });

    const suitMaterial = new THREE.MeshStandardMaterial({
      color: 0x151b26, // modern midnight navy blazer
      roughness: 0.65,
      metalness: 0.18,
    });

    const shirtMaterial = new THREE.MeshStandardMaterial({
      color: 0x242d3d, // dark slate tech crewneck
      roughness: 0.75,
      metalness: 0.05,
    });

    // Head Base Group
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.38;
    avatarGroup.add(headGroup);

    // Sculpted Head & Jaw
    const headGeo = new THREE.SphereGeometry(0.56, 32, 32);
    headGeo.scale(0.88, 1.14, 0.94);
    const headMesh = new THREE.Mesh(headGeo, skinMaterial);
    headGroup.add(headMesh);

    // Defined Chin & Jawline
    const chinGeo = new THREE.BoxGeometry(0.32, 0.22, 0.28);
    const chinMesh = new THREE.Mesh(chinGeo, skinMaterial);
    chinMesh.position.set(0, -0.42, 0.34);
    chinMesh.rotation.x = 0.2;
    headGroup.add(chinMesh);

    // Stylized Male Hair with Volume & Part
    const hairGroup = new THREE.Group();
    headGroup.add(hairGroup);

    const hairGeo = new THREE.SphereGeometry(0.61, 32, 32);
    hairGeo.scale(0.92, 1.18, 0.98);
    const hairMesh = new THREE.Mesh(hairGeo, hairMaterial);
    hairMesh.position.set(0, 0.10, -0.05);
    hairGroup.add(hairMesh);

    // Front Hair Fringe / Side Taper
    const fringeGeo = new THREE.BoxGeometry(0.56, 0.16, 0.32);
    const fringeMesh = new THREE.Mesh(fringeGeo, hairMaterial);
    fringeMesh.position.set(0.04, 0.58, 0.32);
    fringeMesh.rotation.set(-0.2, 0.05, -0.08);
    hairGroup.add(fringeMesh);

    // Eyes Setup
    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.position.set(-0.19, 0.11, 0.45);
    headGroup.add(leftEyeGroup);

    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.position.set(0.19, 0.11, 0.45);
    headGroup.add(rightEyeGroup);

    const eyeGeo = new THREE.SphereGeometry(0.082, 20, 20);
    const irisGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.02, 20);
    irisGeo.rotateX(Math.PI / 2);
    const pupilGeo = new THREE.SphereGeometry(0.022, 16, 16);

    // Left Eye
    const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    const leftIris = new THREE.Mesh(irisGeo, irisMaterial);
    leftIris.position.z = 0.068;
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
    leftPupil.position.z = 0.076;
    leftEyeGroup.add(leftEye);
    leftEyeGroup.add(leftIris);
    leftEyeGroup.add(leftPupil);

    // Right Eye
    const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    const rightIris = new THREE.Mesh(irisGeo, irisMaterial);
    rightIris.position.z = 0.068;
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
    rightPupil.position.z = 0.076;
    rightEyeGroup.add(rightEye);
    rightEyeGroup.add(rightIris);
    rightEyeGroup.add(rightPupil);

    // Eyelids (Blinking)
    const eyelidGeo = new THREE.SphereGeometry(0.088, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    const leftEyelid = new THREE.Mesh(eyelidGeo, skinMaterial);
    leftEyelid.rotation.x = -Math.PI / 2;
    leftEyeGroup.add(leftEyelid);

    const rightEyelid = new THREE.Mesh(eyelidGeo, skinMaterial);
    rightEyelid.rotation.x = -Math.PI / 2;
    rightEyeGroup.add(rightEyelid);

    // Eyebrows
    const eyebrowGeo = new THREE.BoxGeometry(0.18, 0.032, 0.06);
    const leftEyebrow = new THREE.Mesh(eyebrowGeo, hairMaterial);
    leftEyebrow.position.set(-0.19, 0.24, 0.49);
    leftEyebrow.rotation.z = 0.08;
    headGroup.add(leftEyebrow);

    const rightEyebrow = new THREE.Mesh(eyebrowGeo, hairMaterial);
    rightEyebrow.position.set(0.19, 0.24, 0.49);
    rightEyebrow.rotation.z = -0.08;
    headGroup.add(rightEyebrow);

    // Nose
    const noseGeo = new THREE.ConeGeometry(0.072, 0.21, 16);
    const noseMesh = new THREE.Mesh(noseGeo, skinMaterial);
    noseMesh.position.set(0, -0.02, 0.55);
    noseMesh.rotation.x = 0.22;
    headGroup.add(noseMesh);

    // Mouth & Jaw Setup (Real-time Speech Morphing)
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.23, 0.50);
    headGroup.add(mouthGroup);

    const lipMaterial = new THREE.MeshStandardMaterial({
      color: 0x9f5c56, // natural warm lip tone
      roughness: 0.48
    });

    const lipGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.22, 20);
    lipGeo.rotateZ(Math.PI / 2);

    const upperLip = new THREE.Mesh(lipGeo, lipMaterial);
    upperLip.position.y = 0.022;
    mouthGroup.add(upperLip);

    const lowerLip = new THREE.Mesh(lipGeo, lipMaterial);
    lowerLip.position.y = -0.018;
    mouthGroup.add(lowerLip);

    // Mouth interior cavity
    const mouthCavityGeo = new THREE.SphereGeometry(0.085, 16, 16);
    mouthCavityGeo.scale(1.2, 0.6, 0.5);
    const mouthCavity = new THREE.Mesh(mouthCavityGeo, new THREE.MeshBasicMaterial({ color: 0x160707 }));
    mouthCavity.position.set(0, -0.01, -0.03);
    mouthCavity.scale.set(0, 0, 0);
    mouthGroup.add(mouthCavity);

    // Tech Glasses
    const glassesGroup = new THREE.Group();
    glassesGroup.position.set(0, 0.11, 0.47);
    headGroup.add(glassesGroup);

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.85,
      roughness: 0.25
    });
    const frameGeo = new THREE.TorusGeometry(0.115, 0.012, 12, 32);

    const leftFrame = new THREE.Mesh(frameGeo, frameMat);
    leftFrame.position.x = -0.19;
    glassesGroup.add(leftFrame);

    const rightFrame = new THREE.Mesh(frameGeo, frameMat);
    rightFrame.position.x = 0.19;
    glassesGroup.add(rightFrame);

    const bridgeGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.15);
    bridgeGeo.rotateZ(Math.PI / 2);
    const bridge = new THREE.Mesh(bridgeGeo, frameMat);
    glassesGroup.add(bridge);

    // Neck & Torso
    const neckGeo = new THREE.CylinderGeometry(0.20, 0.24, 0.42, 32);
    const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
    neckMesh.position.y = -0.16;
    avatarGroup.add(neckMesh);

    const torsoGeo = new THREE.CylinderGeometry(0.58, 0.88, 1.25, 32);
    torsoGeo.scale(1.25, 1, 0.72);
    const torsoMesh = new THREE.Mesh(torsoGeo, suitMaterial);
    torsoMesh.position.y = -0.88;
    avatarGroup.add(torsoMesh);

    const collarGeo = new THREE.ConeGeometry(0.32, 0.38, 3);
    const collarMesh = new THREE.Mesh(collarGeo, shirtMaterial);
    collarMesh.position.set(0, -0.34, 0.26);
    collarMesh.rotation.x = -0.32;
    avatarGroup.add(collarMesh);

    // 5. High-Fidelity Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const isCurrentlySpeaking = isSpeakingRef.current;
      const isCurrentlyCandidateSpeaking = isCandidateSpeakingRef.current;

      const viseme = audioService.getVisemeSample(elapsedTime, isCurrentlySpeaking);

      // Real-time Audio-driven Lip Sync
      const jawOpen = viseme.jawOpen;
      lowerLip.position.y = -0.018 - jawOpen * 0.12;
      lowerLip.scale.x = 1.0 + viseme.mouthWidth * 0.24;
      upperLip.scale.x = 1.0 + viseme.mouthWidth * 0.24;

      const openAmount = Math.max(0, jawOpen);
      mouthCavity.scale.set(1.0 + viseme.mouthWidth * 0.2, openAmount * 1.6, openAmount);

      // Eyelid Blinking
      const blinkLeft = viseme.eyeBlinkLeft;
      const blinkRight = viseme.eyeBlinkRight;
      leftEyelid.scale.y = 0.08 + blinkLeft * 0.92;
      rightEyelid.scale.y = 0.08 + blinkRight * 0.92;
      leftEyelid.visible = blinkLeft > 0.08;
      rightEyelid.visible = blinkRight > 0.08;

      // Eyebrow dynamics (emphasis on speech)
      leftEyebrow.position.y = 0.24 + viseme.eyebrowRaise * 0.025;
      rightEyebrow.position.y = 0.24 + viseme.eyebrowRaise * 0.025;

      // Head Movement & Gestures
      if (isCurrentlySpeaking) {
        // Natural speaking gestures: nodding, emphasis, subtle tilt
        const nodX = viseme.headTiltX + Math.sin(elapsedTime * 2.6) * 0.025;
        const turnY = viseme.headTiltY + Math.sin(elapsedTime * 1.3) * 0.025;
        const tiltZ = viseme.headTiltZ + Math.cos(elapsedTime * 1.1) * 0.015;

        headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, nodX, 0.15);
        headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, turnY, 0.12);
        headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, tiltZ, 0.12);
      } else if (isCurrentlyCandidateSpeaking) {
        // Attentive listening nod when candidate speaks
        const listeningNod = Math.sin(elapsedTime * 2.8) * 0.035;
        headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, 0.05 + listeningNod, 0.08);
        headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, 0.03, 0.06);
        headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, 0.02, 0.06);
      } else {
        // Natural calm breathing idle state
        headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, Math.sin(elapsedTime * 0.9) * 0.018, 0.05);
        headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, Math.sin(elapsedTime * 0.5) * 0.025, 0.05);
        headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, Math.cos(elapsedTime * 0.6) * 0.01, 0.05);
      }

      // Torso breathing animation
      torsoMesh.position.y = -0.88 + Math.sin(elapsedTime * 1.6) * 0.008;

      // Subtle studio ring rotation
      studioRing.rotation.z = elapsedTime * 0.08;

      // Subtle bokeh drift
      bokehSpheres.forEach((sphere, idx) => {
        sphere.position.y += Math.sin(elapsedTime * 0.5 + idx) * 0.0008;
      });

      renderer.render(scene, camera);
    };

    animate();

    // 6. Responsive Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [persona]);

  return (
    <div 
      ref={mountRef} 
      className="w-full h-full min-h-[360px] relative overflow-hidden"
    />
  );
};
