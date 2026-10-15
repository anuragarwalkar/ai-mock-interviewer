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
    scene.background = new THREE.Color(0x0a0e17);

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 1000);
    camera.position.set(0, 0.2, 3.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.appendChild(renderer.domElement);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const primaryColor = new THREE.Color(persona.primaryColor || '#0071e3');

    // Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(2, 4, 3);
    scene.add(keyLight);

    // Fill Light
    const fillLight = new THREE.DirectionalLight(0x7090b0, 0.6);
    fillLight.position.set(-3, 1, 2);
    scene.add(fillLight);

    // Persona Rim Light
    const rimLight = new THREE.DirectionalLight(primaryColor, 2.5);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    // Subtle floor glow
    const pointLight = new THREE.PointLight(primaryColor, 1.2, 6);
    pointLight.position.set(0, -1, 1);
    scene.add(pointLight);

    // 3. Avatar Mesh Hierarchy
    const avatarGroup = new THREE.Group();
    scene.add(avatarGroup);

    // Skin & Material Colors
    const skinColor = persona.voiceGender === 'female' ? 0xf0d5c2 : 0xd8ad8d;
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: 0.55,
      metalness: 0.05,
    });

    const hairMaterial = new THREE.MeshStandardMaterial({
      color: persona.voiceGender === 'female' ? 0x221a15 : 0x1b1b1b,
      roughness: 0.8,
      metalness: 0.1,
    });

    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.05,
    });

    const pupilMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a2430,
      roughness: 0.1,
      metalness: 0.8,
    });

    const suitMaterial = new THREE.MeshStandardMaterial({
      color: 0x161c28,
      roughness: 0.6,
      metalness: 0.15,
    });

    const shirtMaterial = new THREE.MeshStandardMaterial({
      color: 0x283344,
      roughness: 0.7,
      metalness: 0.05,
    });

    // Head Base
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.35;
    avatarGroup.add(headGroup);

    const headGeo = new THREE.SphereGeometry(0.58, 32, 32);
    headGeo.scale(0.9, 1.15, 0.95);
    const headMesh = new THREE.Mesh(headGeo, skinMaterial);
    headGroup.add(headMesh);

    // Hair
    const hairGeo = new THREE.SphereGeometry(0.62, 32, 32);
    hairGeo.scale(0.92, 1.18, 0.98);
    const hairMesh = new THREE.Mesh(hairGeo, hairMaterial);
    hairMesh.position.set(0, 0.08, -0.06);
    headGroup.add(hairMesh);

    // Eyes
    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.position.set(-0.2, 0.1, 0.44);
    headGroup.add(leftEyeGroup);

    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.position.set(0.2, 0.1, 0.44);
    headGroup.add(rightEyeGroup);

    const eyeGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const pupilGeo = new THREE.SphereGeometry(0.045, 16, 16);

    const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
    leftPupil.position.z = 0.05;
    leftEyeGroup.add(leftEye);
    leftEyeGroup.add(leftPupil);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
    rightPupil.position.z = 0.05;
    rightEyeGroup.add(rightEye);
    rightEyeGroup.add(rightPupil);

    // Eyelids (for blinking)
    const eyelidGeo = new THREE.SphereGeometry(0.085, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const leftEyelid = new THREE.Mesh(eyelidGeo, skinMaterial);
    leftEyelid.rotation.x = -Math.PI / 2;
    leftEyeGroup.add(leftEyelid);

    const rightEyelid = new THREE.Mesh(eyelidGeo, skinMaterial);
    rightEyelid.rotation.x = -Math.PI / 2;
    rightEyeGroup.add(rightEyelid);

    // Eyebrows
    const eyebrowGeo = new THREE.BoxGeometry(0.16, 0.03, 0.05);
    const leftEyebrow = new THREE.Mesh(eyebrowGeo, hairMaterial);
    leftEyebrow.position.set(-0.2, 0.23, 0.48);
    leftEyebrow.rotation.z = 0.08;
    headGroup.add(leftEyebrow);

    const rightEyebrow = new THREE.Mesh(eyebrowGeo, hairMaterial);
    rightEyebrow.position.set(0.2, 0.23, 0.48);
    rightEyebrow.rotation.z = -0.08;
    headGroup.add(rightEyebrow);

    // Nose
    const noseGeo = new THREE.ConeGeometry(0.07, 0.18, 16);
    const noseMesh = new THREE.Mesh(noseGeo, skinMaterial);
    noseMesh.position.set(0, -0.02, 0.54);
    noseMesh.rotation.x = 0.2;
    headGroup.add(noseMesh);

    // Mouth & Jaw
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.24, 0.48);
    headGroup.add(mouthGroup);

    // Upper Lip
    const lipGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.22, 16);
    lipGeo.rotateZ(Math.PI / 2);
    const upperLipMaterial = new THREE.MeshStandardMaterial({ color: 0x9c515a, roughness: 0.4 });
    const upperLip = new THREE.Mesh(lipGeo, upperLipMaterial);
    upperLip.position.y = 0.02;
    mouthGroup.add(upperLip);

    // Lower Lip / Jaw (moves with speech)
    const lowerLip = new THREE.Mesh(lipGeo, upperLipMaterial);
    lowerLip.position.y = -0.02;
    mouthGroup.add(lowerLip);

    // Inside mouth dark cavity
    const mouthCavityGeo = new THREE.SphereGeometry(0.08, 16, 16);
    mouthCavityGeo.scale(1.2, 0.6, 0.5);
    const cavityMat = new THREE.MeshBasicMaterial({ color: 0x1a0505 });
    const mouthCavity = new THREE.Mesh(mouthCavityGeo, cavityMat);
    mouthCavity.position.set(0, -0.02, -0.04);
    mouthCavity.scale.set(0, 0, 0); // hidden when mouth is closed
    mouthGroup.add(mouthCavity);

    // Glasses for tech look
    const glassesGroup = new THREE.Group();
    glassesGroup.position.set(0, 0.1, 0.46);
    headGroup.add(glassesGroup);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.2 });
    const frameGeo = new THREE.TorusGeometry(0.11, 0.014, 8, 24);
    const leftFrame = new THREE.Mesh(frameGeo, frameMat);
    leftFrame.position.x = -0.2;
    glassesGroup.add(leftFrame);

    const rightFrame = new THREE.Mesh(frameGeo, frameMat);
    rightFrame.position.x = 0.2;
    glassesGroup.add(rightFrame);

    const bridgeGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.16);
    bridgeGeo.rotateZ(Math.PI / 2);
    const bridge = new THREE.Mesh(bridgeGeo, frameMat);
    glassesGroup.add(bridge);

    // Neck & Torso
    const neckGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.4, 32);
    const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
    neckMesh.position.y = -0.15;
    avatarGroup.add(neckMesh);

    const torsoGeo = new THREE.CylinderGeometry(0.55, 0.85, 1.2, 32);
    torsoGeo.scale(1.2, 1, 0.7);
    const torsoMesh = new THREE.Mesh(torsoGeo, suitMaterial);
    torsoMesh.position.y = -0.85;
    avatarGroup.add(torsoMesh);

    const collarGeo = new THREE.ConeGeometry(0.3, 0.35, 3);
    const collarMesh = new THREE.Mesh(collarGeo, shirtMaterial);
    collarMesh.position.set(0, -0.32, 0.25);
    collarMesh.rotation.x = -0.3;
    avatarGroup.add(collarMesh);

    // Studio backdrop ring
    const ringGeo = new THREE.TorusGeometry(1.6, 0.015, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: primaryColor, transparent: true, opacity: 0.35 });
    const studioRing = new THREE.Mesh(ringGeo, ringMat);
    studioRing.position.set(0, 0.2, -0.8);
    scene.add(studioRing);

    // 4. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const viseme = audioService.getVisemeSample(elapsedTime, isSpeakingRef.current);

      // Audio-driven mouth opening and lip morphing
      const targetJawOpen = viseme.jawOpen;
      lowerLip.position.y = -0.02 - targetJawOpen * 0.12;
      lowerLip.scale.x = 1.0 + viseme.mouthWidth * 0.25;
      upperLip.scale.x = 1.0 + viseme.mouthWidth * 0.25;

      // Inside cavity opens when talking
      const openAmount = Math.max(0, targetJawOpen);
      mouthCavity.scale.set(1.0 + viseme.mouthWidth * 0.2, openAmount * 1.5, openAmount);

      // Eyelid blink animation
      const blinkLeft = viseme.eyeBlinkLeft;
      const blinkRight = viseme.eyeBlinkRight;
      leftEyelid.scale.y = 0.1 + blinkLeft * 0.9;
      rightEyelid.scale.y = 0.1 + blinkRight * 0.9;
      leftEyelid.visible = blinkLeft > 0.1;
      rightEyelid.visible = blinkRight > 0.1;

      // Eyebrow movement with emphasis
      leftEyebrow.position.y = 0.23 + viseme.eyebrowRaise * 0.03;
      rightEyebrow.position.y = 0.23 + viseme.eyebrowRaise * 0.03;

      // Head motion: nodding, breathing, listening tilt
      if (isSpeakingRef.current) {
        headGroup.rotation.x = viseme.headTiltX;
        headGroup.rotation.y = viseme.headTiltY;
        headGroup.rotation.z = viseme.headTiltZ;
      } else if (isCandidateSpeakingRef.current) {
        // Attentive listening nod
        const listeningNod = Math.sin(elapsedTime * 2.8) * 0.04;
        headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, 0.06 + listeningNod, 0.08);
        headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, 0.04, 0.05);
        headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, 0.03, 0.05);
      } else {
        // Natural idle breathing
        headGroup.rotation.x = Math.sin(elapsedTime * 0.9) * 0.02;
        headGroup.rotation.y = Math.sin(elapsedTime * 0.6) * 0.03;
        headGroup.rotation.z = Math.cos(elapsedTime * 0.7) * 0.01;
      }

      // Torso breathing
      torsoMesh.position.y = -0.85 + Math.sin(elapsedTime * 1.5) * 0.008;

      // Ring rotation
      studioRing.rotation.z = elapsedTime * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    // 5. Resize handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [persona]);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        minHeight: '320px',
        position: 'relative', 
        overflow: 'hidden' 
      }} 
    />
  );
};
