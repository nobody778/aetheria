import * as THREE from 'three';

// -------------------------------------------------------------------------
// 1. DETERMINISTIC SEEDED 2D SIMPLEX-VALUE NOISE & FBM (O(1) World Queries)
// -------------------------------------------------------------------------
class SeededNoise {
  constructor(seed = 7741) {
    this.setSeed(seed);
  }

  setSeed(seed) {
    this.seed = seed >>> 0;
    this.perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = this.seed || 1;
    for (let i = 255; i > 0; i--) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const j = s % (i + 1);
      const tmp = p[i];
      p[i] = p[j];
      p[j] = tmp;
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  noise2D(x, y) {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);

    const aa = this.perm[this.perm[xi] + yi];
    const ab = this.perm[this.perm[xi] + yi + 1];
    const ba = this.perm[this.perm[xi + 1] + yi];
    const bb = this.perm[this.perm[xi + 1] + yi + 1];

    const grad = (hash, gx, gy) => {
      const h = hash & 7;
      const gu = h < 4 ? gx : gy;
      const gv = h < 4 ? gy : gx;
      return ((h & 1) ? -gu : gu) + ((h & 2) ? -2.0 * gv : 2.0 * gv);
    };

    const x1 = THREE.MathUtils.lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
    const x2 = THREE.MathUtils.lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);
    return THREE.MathUtils.lerp(x1, x2, v) * 0.45;
  }

  fbm(x, y, octaves = 5, lacunarity = 2.04, gain = 0.5) {
    let sum = 0;
    let amp = 0.5;
    let freq = 1.0;
    for (let i = 0; i < octaves; i++) {
      sum += amp * this.noise2D(x * freq, y * freq);
      freq *= lacunarity;
      amp *= gain;
    }
    return sum;
  }

  ridged(x, y, octaves = 4) {
    let sum = 0;
    let amp = 0.5;
    let freq = 1.0;
    for (let i = 0; i < octaves; i++) {
      const n = 1.0 - Math.abs(this.noise2D(x * freq, y * freq) * 1.4);
      sum += n * n * amp;
      freq *= 2.12;
      amp *= 0.48;
    }
    return sum;
  }
}

// -------------------------------------------------------------------------
// 2. CUSTOM GLSL ATMOSPHERIC SKY DOME & CELESTIAL DAY/NIGHT CYCLE
// -------------------------------------------------------------------------
class SkyAtmosphere {
  constructor(scene) {
    this.scene = scene;
    this.timeOfDay = 7.5; // 0..24 hours
    this.autoAdvance = true;
    this.sunDir = new THREE.Vector3(0.5, 0.4, -0.6).normalize();

    // Fog for AAA Aerial Perspective Depth across 1km+ Streaming Horizon
    this.fog = new THREE.FogExp2(0x9ec0d8, 0.0014);
    scene.fog = this.fog;

    // Sun + Ambient Hemisphere + Moon Rim Lights
    this.hemiLight = new THREE.HemisphereLight(0xdbeeff, 0x4f5d43, 0.85);
    scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff1d6, 2.4);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 360;
    const sd = 95;
    this.sunLight.shadow.camera.left = -sd;
    this.sunLight.shadow.camera.right = sd;
    this.sunLight.shadow.camera.top = sd;
    this.sunLight.shadow.camera.bottom = -sd;
    this.sunLight.shadow.bias = -0.0005;
    scene.add(this.sunLight);
    scene.add(this.sunLight.target);

    this.uniforms = {
      uSunDir: { value: this.sunDir },
      uZenithColor: { value: new THREE.Color(0x1f5594) },
      uHorizonColor: { value: new THREE.Color(0xb8d9eb) },
      uSunGlowColor: { value: new THREE.Color(0xffe1a8) },
      uStarIntensity: { value: 0.0 },
      uTime: { value: 0 }
    };

    const skyGeo = new THREE.SphereGeometry(1400, 48, 32);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: this.uniforms,
      vertexShader: /* glsl */`
        varying vec3 vWorldDir;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldDir = normalize(position);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: /* glsl */`
        varying vec3 vWorldDir;
        uniform vec3 uSunDir;
        uniform vec3 uZenithColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uSunGlowColor;
        uniform float uStarIntensity;
        uniform float uTime;

        float hash(vec3 p) {
          p = fract(p * 0.3183099 + 0.1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        void main() {
          vec3 dir = normalize(vWorldDir);
          float h = clamp(dir.y, 0.0, 1.0);
          vec3 col = mix(uHorizonColor, uZenithColor, pow(h, 0.58));

          // Solar Mie Scattering & Crisp Sun Disc
          float sunAmt = max(dot(dir, uSunDir), 0.0);
          col += uSunGlowColor * pow(sunAmt, 9.0) * 0.45;
          col += uSunGlowColor * smoothstep(0.9982, 0.9996, sunAmt) * 2.2;

          // Lunar Disc opposite the Sun
          float moonAmt = max(dot(dir, -uSunDir), 0.0);
          col += vec3(0.75, 0.85, 1.0) * smoothstep(0.9988, 0.9996, moonAmt) * uStarIntensity * 1.6;

          // Subtle High-Altitude Cirrus Wisps
          if (dir.y > 0.03) {
            vec2 uv = dir.xz / (dir.y + 0.18) * 1.4 + vec2(uTime * 0.004, uTime * 0.002);
            float wisp = sin(uv.x * 2.3 + sin(uv.y * 1.9)) * cos(uv.y * 2.1 - sin(uv.x * 1.4));
            float cloudMask = smoothstep(0.25, 0.92, wisp) * smoothstep(0.03, 0.25, dir.y) * 0.18;
            col = mix(col, mix(uHorizonColor, vec3(1.0), 0.55), cloudMask);
          }

          // Procedural Night Starfield
          if (uStarIntensity > 0.01 && dir.y > 0.02) {
            float s = hash(floor(dir * 380.0));
            if (s > 0.9965) {
              float twinkle = 0.65 + 0.35 * sin(uTime * 3.0 + s * 90.0);
              col += vec3(0.9, 0.94, 1.0) * twinkle * uStarIntensity * smoothstep(0.02, 0.22, dir.y);
            }
          }

          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    scene.add(this.skyMesh);

    this.cZenithDay = new THREE.Color(0x1b5299);
    this.cZenithDusk = new THREE.Color(0x28234a);
    this.cZenithNight = new THREE.Color(0x060a17);

    this.cHorizDay = new THREE.Color(0xb7daeb);
    this.cHorizDusk = new THREE.Color(0xe8834d);
    this.cHorizNight = new THREE.Color(0x111b30);

    this.cGlowDay = new THREE.Color(0xfff0cc);
    this.cGlowDusk = new THREE.Color(0xff6f3c);
    this.cStormSlate = new THREE.Color(0x232d3d);
    this.cBlizzardMist = new THREE.Color(0xc8d8e6);
    this.cFlashTint = new THREE.Color(0xdbeafe);
  }

  update(dt, elapsed, playerPos, weatherMod = null) {
    if (this.autoAdvance) {
      this.timeOfDay = (this.timeOfDay + dt * 0.12) % 24;
    }
    this.uniforms.uTime.value = elapsed;

    const overcast = weatherMod ? weatherMod.overcast : 0.0;
    const snowMist = weatherMod ? weatherMod.snowAmount : 0.0;
    const flash = weatherMod ? weatherMod.lightningFlash : 0.0;
    const targetFogDens = weatherMod ? weatherMod.fogDensity : 0.0014;

    // Convert 24h clock into solar elevation angle
    const solarAngle = ((this.timeOfDay - 6.0) / 24.0) * Math.PI * 2.0;
    const elev = Math.sin(solarAngle);
    const azim = Math.cos(solarAngle);
    this.sunDir.set(azim * 0.82, elev, -0.52).normalize();

    const dayFactor = THREE.MathUtils.smoothstep(elev, -0.12, 0.32);
    const twilightFactor = 1.0 - Math.min(1.0, Math.abs(elev) / 0.28);
    const nightFactor = 1.0 - THREE.MathUtils.smoothstep(elev, -0.22, 0.04);

    this.uniforms.uZenithColor.value.copy(this.cZenithNight)
      .lerp(this.cZenithDay, dayFactor)
      .lerp(this.cZenithDusk, twilightFactor * 0.55);

    this.uniforms.uHorizonColor.value.copy(this.cHorizNight)
      .lerp(this.cHorizDay, dayFactor)
      .lerp(this.cHorizDusk, twilightFactor * 0.85);

    // Modulate sky & fog for Monsoon / Thunderstorm / Alpine Blizzard
    if (overcast > 0.001) {
      const stormTone = this.cStormSlate.clone().multiplyScalar(THREE.MathUtils.lerp(0.32, 1.05, dayFactor));
      this.uniforms.uZenithColor.value.lerp(stormTone, overcast * 0.82);
      this.uniforms.uHorizonColor.value.lerp(stormTone, overcast * 0.78);
    }
    if (snowMist > 0.01) {
      const blizTone = this.cBlizzardMist.clone().multiplyScalar(THREE.MathUtils.lerp(0.25, 0.95, dayFactor));
      this.uniforms.uHorizonColor.value.lerp(blizTone, snowMist * 0.65);
    }
    if (flash > 0.01) {
      this.uniforms.uZenithColor.value.lerp(this.cFlashTint, flash * 0.55);
      this.uniforms.uHorizonColor.value.lerp(this.cFlashTint, flash * 0.70);
    }

    this.uniforms.uSunGlowColor.value.copy(this.cGlowDay)
      .lerp(this.cGlowDusk, twilightFactor)
      .multiplyScalar(1.0 - overcast * 0.72);
    this.uniforms.uStarIntensity.value = nightFactor * (1.0 - Math.max(overcast, snowMist));

    this.fog.color.copy(this.uniforms.uHorizonColor.value);
    this.fog.density += (targetFogDens - this.fog.density) * Math.min(1, dt * 3.0);

    // Keep shadow frustum anchored around player for crisp close-up shadows across open world
    const lightDir = elev >= -0.05 ? this.sunDir : this.sunDir.clone().negate();
    this.sunLight.position.copy(playerPos).addScaledVector(lightDir, 130);
    this.sunLight.target.position.copy(playerPos);
    this.sunLight.color.copy(this.uniforms.uSunGlowColor.value);
    const baseSunInt = elev >= -0.05
      ? THREE.MathUtils.lerp(0.55, 2.55, dayFactor)
      : 0.42;
    this.sunLight.intensity = baseSunInt * (1.0 - overcast * 0.64) + flash * 4.2;
    if (elev < -0.05 && flash < 0.1) this.sunLight.color.setHex(0x8fb2ff);
    if (flash > 0.15) this.sunLight.color.lerp(this.cFlashTint, flash * 0.8);

    this.hemiLight.color.copy(this.uniforms.uZenithColor.value).lerp(new THREE.Color(0xffffff), 0.45);
    this.hemiLight.intensity = THREE.MathUtils.lerp(0.35, 0.95, dayFactor) * (1.0 - overcast * 0.25) + flash * 1.4;
    this.skyMesh.position.copy(playerPos);
  }

  getFormattedClock() {
    const hrs = Math.floor(this.timeOfDay);
    const mins = Math.floor((this.timeOfDay - hrs) * 60);
    const hh = String(hrs).padStart(2, '0');
    const mm = String(mins).padStart(2, '0');
    let phase = 'Night';
    if (this.timeOfDay >= 5 && this.timeOfDay < 8) phase = 'Dawn';
    else if (this.timeOfDay >= 8 && this.timeOfDay < 17) phase = 'Daylight';
    else if (this.timeOfDay >= 17 && this.timeOfDay < 20) phase = 'Golden Dusk';
    return `${hh}:${mm} • ${phase}`;
  }
}

// -------------------------------------------------------------------------
// 2B. CHUNK 007: RAYMARCHED 3D VOLUMETRIC CUMULUS CLOUDS & GROUND SHADOWS
// -------------------------------------------------------------------------
class VolumetricCloudSystem {
  constructor(scene) {
    this.scene = scene;
    this.cloudBaseY = 215.0;
    this.cloudTopY = 330.0;

    this.states = [
      { name: 'Cumulus',  coverage: 0.56, density: 0.052, shadowStrength: 0.36 },
      { name: 'Fair',     coverage: 0.38, density: 0.044, shadowStrength: 0.24 },
      { name: 'Overcast', coverage: 0.78, density: 0.068, shadowStrength: 0.48 },
      { name: 'Clear',    coverage: 0.00, density: 0.000, shadowStrength: 0.00 }
    ];
    this.stateIdx = 0;

    this.uniforms = {
      uTime:           { value: 0 },
      uCloudBaseY:     { value: this.cloudBaseY },
      uCloudTopY:      { value: this.cloudTopY },
      uCoverage:       { value: this.states[0].coverage },
      uDensityMult:    { value: this.states[0].density },
      uShadowStrength: { value: this.states[0].shadowStrength },
      uSunDir:         { value: new THREE.Vector3(0.5, 0.5, -0.5) },
      uSunColor:       { value: new THREE.Color(0xfff0cc) },
      uSkyZenith:      { value: new THREE.Color(0x1b5299) },
      uSkyHorizon:     { value: new THREE.Color(0xb7daeb) },
      uDayFactor:      { value: 1.0 }
    };

    this.material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      uniforms: this.uniforms,
      vertexShader: /* glsl */`
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uTime;
        uniform float uCloudBaseY;
        uniform float uCloudTopY;
        uniform float uCoverage;
        uniform float uDensityMult;
        uniform vec3 uSunDir;
        uniform vec3 uSunColor;
        uniform vec3 uSkyZenith;
        uniform vec3 uSkyHorizon;
        uniform float uDayFactor;

        varying vec3 vWorldPos;

        float hash21(vec2 p) {
          p = fract(p * vec2(127.1, 311.7));
          p += dot(p, p + 34.23);
          return fract(p.x * p.y);
        }

        float vnoise2(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
            mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        float hash31(vec3 p) {
          p = fract(p * 0.1031);
          p += dot(p, p.yzx + 33.33);
          return fract((p.x + p.y) * p.z);
        }

        float vnoise3(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          vec3 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(
              mix(hash31(i), hash31(i + vec3(1,0,0)), u.x),
              mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), u.x),
              u.y
            ),
            mix(
              mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), u.x),
              mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), u.x),
              u.y
            ),
            u.z
          );
        }

        // Shared Macro 2D Cloud Weather Map (Matches Terrain Ground Shadows!)
        float sampleMacroCoverage(vec2 xz) {
          vec2 windShift = vec2(11.5, 7.2) * uTime;
          vec2 uv = (xz - windShift) * 0.00165;
          float m1 = vnoise2(uv);
          float m2 = vnoise2(uv * 2.13 + vec2(4.7, -3.1));
          float macro = m1 * 0.65 + m2 * 0.35;
          return smoothstep(1.0 - uCoverage, 1.0 - uCoverage + 0.38, macro);
        }

        // Sculpted 3D Cumulus Density with Flat Anvil Bases & Billowy Tops
        float sampleCloudDensity(vec3 p) {
          float hFrac = (p.y - uCloudBaseY) / (uCloudTopY - uCloudBaseY);
          if (hFrac <= 0.0 || hFrac >= 1.0) return 0.0;

          float macro = sampleMacroCoverage(p.xz);
          if (macro <= 0.002) return 0.0;

          float heightProfile = smoothstep(0.0, 0.18, hFrac) * (1.0 - smoothstep(0.56, 1.0, hFrac));
          vec3 wind3 = vec3(11.5, 0.0, 7.2) * uTime;
          vec3 q = (p - wind3) * 0.0135;

          float n1 = vnoise3(q);
          float n2 = vnoise3(q * 2.35 + vec3(5.2, 1.7, -3.4));
          float billow = n1 * 0.65 + n2 * 0.35;

          // Erode edges into fluffy cauliflower puffs
          float sculpted = smoothstep(0.34, 0.78, macro * heightProfile * 1.28 - (1.0 - billow) * 0.42);
          return sculpted * uDensityMult;
        }

        // Henyey-Greenstein Anisotropic Mie Phase Function
        float hgPhase(float cosTheta, float g) {
          float g2 = g * g;
          return (1.0 - g2) / (4.0 * 3.14159265 * pow(max(1.0 + g2 - 2.0 * g * cosTheta, 0.001), 1.5));
        }

        void main() {
          if (uCoverage <= 0.005) discard;

          vec3 ro = cameraPosition;
          vec3 rd = normalize(vWorldPos - cameraPosition);

          // Ray-Slab Intersection against [uCloudBaseY, uCloudTopY] (Supports below, inside & above!)
          float tEnter = 0.0;
          float tExit = 0.0;
          if (abs(rd.y) < 0.003) {
            if (ro.y > uCloudBaseY && ro.y < uCloudTopY) {
              tEnter = 0.0;
              tExit = 1100.0;
            } else {
              discard;
            }
          } else {
            float t0 = (uCloudBaseY - ro.y) / rd.y;
            float t1 = (uCloudTopY - ro.y) / rd.y;
            tEnter = max(0.0, min(t0, t1));
            tExit = min(1950.0, max(t0, t1));
          }

          if (tExit <= tEnter || tEnter >= 1900.0) discard;

          // Cap march thickness at shallow grazing horizon angles
          float marchSpan = min(tExit - tEnter, 460.0);
          const int STEPS = 10;
          float stepLen = marchSpan / float(STEPS);

          // Blue-noise style screen-ray jitter to eliminate slice banding
          float jitter = hash31(rd * 413.7 + fract(uTime * 0.37));
          float t = tEnter + jitter * stepLen;

          vec3 activeLight = uSunDir.y >= -0.06 ? uSunDir : normalize(-uSunDir);
          float cosTheta = dot(rd, activeLight);
          float phase = mix(hgPhase(cosTheta, 0.58), hgPhase(cosTheta, -0.22), 0.32) * 2.4 + 0.35;

          vec3 litTone = mix(vec3(0.45, 0.55, 0.78), uSunColor * 1.25, mix(0.18, 1.0, uDayFactor));
          vec3 shadowTone = mix(vec3(0.07, 0.10, 0.20), mix(uSkyZenith, uSkyHorizon, 0.48) * 0.72, uDayFactor);

          vec3 accumLight = vec3(0.0);
          float transmittance = 1.0;

          for (int i = 0; i < STEPS; i++) {
            vec3 p = ro + rd * t;
            float dens = sampleCloudDensity(p);
            if (dens > 0.0004) {
              // 1-Tap Volumetric Sun Shadow + Beer-Powder Silver-Lining Term
              float sunOcc = sampleCloudDensity(p + activeLight * 26.0) * 22.0;
              float lightTrans = exp(-sunOcc * 1.65);
              float powder = 1.0 - exp(-dens * stepLen * 5.5);
              float silverLining = lightTrans * (0.45 + 0.55 * powder) * phase;

              float hFrac = clamp((p.y - uCloudBaseY) / (uCloudTopY - uCloudBaseY), 0.0, 1.0);
              vec3 ambient = shadowTone * mix(0.58, 1.12, hFrac);
              vec3 sampleCol = ambient + litTone * silverLining;

              float stepTrans = exp(-dens * stepLen);
              accumLight += transmittance * sampleCol * (1.0 - stepTrans);
              transmittance *= stepTrans;

              if (transmittance < 0.03) break;
            }
            t += stepLen;
          }

          float alpha = 1.0 - transmittance;
          if (alpha <= 0.006) discard;

          // Blend distant horizon clouds seamlessly into atmospheric horizon haze
          float horizonFade = 1.0 - smoothstep(820.0, 1880.0, tEnter);
          alpha *= horizonFade;
          accumLight = mix(uSkyHorizon * alpha, accumLight, mix(0.35, 1.0, horizonFade));

          gl_FragColor = vec4(accumLight / max(alpha, 0.001), alpha);
        }
      `
    });

    const shellGeo = new THREE.SphereGeometry(1950, 48, 32);
    this.mesh = new THREE.Mesh(shellGeo, this.material);
    this.mesh.renderOrder = 2;
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
  }

  // Injects Sun-Projected Moving Cloud-Shadow Dapples into Terrain MeshStandardMaterials!
  injectTerrainCloudShadows(material) {
    material.onBeforeCompile = shader => {
      shader.uniforms.uCloudTime = this.uniforms.uTime;
      shader.uniforms.uCloudCoverage = this.uniforms.uCoverage;
      shader.uniforms.uCloudShadowStr = this.uniforms.uShadowStrength;
      shader.uniforms.uCloudBaseY = this.uniforms.uCloudBaseY;
      shader.uniforms.uCloudSunDir = this.uniforms.uSunDir;
      shader.uniforms.uCloudDayFactor = this.uniforms.uDayFactor;

      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          /* glsl */`
          #include <common>
          varying vec3 vTerrainWorldPos;
          `
        )
        .replace(
          '#include <worldpos_vertex>',
          /* glsl */`
          #include <worldpos_vertex>
          vTerrainWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
          `
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          /* glsl */`
          #include <common>
          varying vec3 vTerrainWorldPos;
          uniform float uCloudTime;
          uniform float uCloudCoverage;
          uniform float uCloudShadowStr;
          uniform float uCloudBaseY;
          uniform vec3 uCloudSunDir;
          uniform float uCloudDayFactor;

          float csHash21(vec2 p) {
            p = fract(p * vec2(127.1, 311.7));
            p += dot(p, p + 34.23);
            return fract(p.x * p.y);
          }
          float csNoise2(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(csHash21(i), csHash21(i + vec2(1.0, 0.0)), u.x),
              mix(csHash21(i + vec2(0.0, 1.0)), csHash21(i + vec2(1.0, 1.0)), u.x),
              u.y
            );
          }
          `
        )
        .replace(
          '#include <dithering_fragment>',
          /* glsl */`
          if (uCloudCoverage > 0.01 && uCloudDayFactor > 0.05) {
            // Project ground point upward along uCloudSunDir to cloud base altitude
            float sunY = max(uCloudSunDir.y, 0.22);
            vec2 projXZ = vTerrainWorldPos.xz + uCloudSunDir.xz * ((uCloudBaseY - vTerrainWorldPos.y) / sunY);
            vec2 windShift = vec2(11.5, 7.2) * uCloudTime;
            vec2 uv = (projXZ - windShift) * 0.00165;
            float m1 = csNoise2(uv);
            float m2 = csNoise2(uv * 2.13 + vec2(4.7, -3.1));
            float macro = m1 * 0.65 + m2 * 0.35;
            float shadowMask = smoothstep(1.0 - uCloudCoverage + 0.04, 1.0 - uCloudCoverage + 0.36, macro);
            float darken = 1.0 - shadowMask * uCloudShadowStr * uCloudDayFactor;
            gl_FragColor.rgb *= vec3(darken * 0.96, darken * 0.98, darken * 1.02);
          }
          #include <dithering_fragment>
          `
        );
    };
  }

  cycleCloudState() {
    this.stateIdx = (this.stateIdx + 1) % this.states.length;
    const st = this.states[this.stateIdx];
    this.uniforms.uCoverage.value = st.coverage;
    this.uniforms.uDensityMult.value = st.density;
    this.uniforms.uShadowStrength.value = st.shadowStrength;
    this.mesh.visible = st.coverage > 0.005;
    return st.name;
  }

  update(elapsed, sky, cameraPos) {
    this.uniforms.uTime.value = elapsed;
    this.uniforms.uSunDir.value.copy(sky.sunDir);
    this.uniforms.uSunColor.value.copy(sky.sunLight.color);
    this.uniforms.uSkyZenith.value.copy(sky.uniforms.uZenithColor.value);
    this.uniforms.uSkyHorizon.value.copy(sky.uniforms.uHorizonColor.value);
    this.uniforms.uDayFactor.value = THREE.MathUtils.smoothstep(sky.sunDir.y, -0.12, 0.32);

    this.mesh.position.copy(cameraPos);
    // Below cloud deck: hardware depthTest lets foreground mountains/trees occlude clouds;
    // Inside/Above cloud deck (God-Fly y > 205m): disable depthTest so cloud sea renders over valleys below!
    const wantDepthTest = cameraPos.y < this.cloudBaseY - 10.0;
    if (this.material.depthTest !== wantDepthTest) {
      this.material.depthTest = wantDepthTest;
    }
  }
}

// -------------------------------------------------------------------------
// 2C. CHUNK 008: DYNAMIC OPEN-WORLD WEATHER ENGINE (RAIN, SNOW & LIGHTNING)
// -------------------------------------------------------------------------
class DynamicWeatherSystem {
  constructor(scene) {
    this.scene = scene;

    this.presets = [
      { id: 'clear',     label: 'Clear',        rain: 0.00, snow: 0.00, overcast: 0.00, fog: 0.0014, cloudCov: 0.54, waveMult: 1.00, storm: false },
      { id: 'auto',      label: 'Auto Biome',   auto: true },
      { id: 'sunshower', label: 'Sunshower',    rain: 0.42, snow: 0.00, overcast: 0.16, fog: 0.0019, cloudCov: 0.62, waveMult: 1.10, storm: false },
      { id: 'monsoon',   label: 'Monsoon Rain', rain: 0.85, snow: 0.00, overcast: 0.68, fog: 0.0033, cloudCov: 0.80, waveMult: 1.45, storm: false },
      { id: 'storm',     label: 'Thunderstorm', rain: 1.00, snow: 0.00, overcast: 0.88, fog: 0.0040, cloudCov: 0.88, waveMult: 1.92, storm: true  },
      { id: 'blizzard',  label: 'Blizzard',     rain: 0.00, snow: 1.00, overcast: 0.72, fog: 0.0046, cloudCov: 0.84, waveMult: 1.30, storm: false }
    ];
    this.modeIdx = 0;

    // Smoothly interpolated live atmospheric state
    this.live = {
      rainAmount: 0.0,
      snowAmount: 0.0,
      overcast: 0.0,
      fogDensity: 0.0014,
      wetness: 0.0,
      lightningFlash: 0.0,
      activeBanner: 'CLEAR SKIES'
    };

    this.precipUniforms = {
      uTime:       { value: 0 },
      uCamPos:     { value: new THREE.Vector3() },
      uRainAmount: { value: 0.0 },
      uSnowAmount: { value: 0.0 },
      uLightScale: { value: 1.0 }
    };

    this.weatherGroup = new THREE.Group();
    this.scene.add(this.weatherGroup);

    this.buildRainStreaks();
    this.buildSplashRings();
    this.buildSnowFlakes();
    this.buildLightningBoltSystem();
  }

  // 1. Zero-CPU-Loop Toroidal GPU Rain Streaks (6,500 Wind-Slanted Drops around Camera)
  buildRainStreaks() {
    const count = 6500;
    const baseGeo = new THREE.BufferGeometry();
    // Thin vertical quad ribbon per raindrop
    const verts = new Float32Array([
      -0.014,  0.0, 0.0,
       0.014,  0.0, 0.0,
      -0.014,  1.0, 0.0,
       0.014,  1.0, 0.0
    ]);
    const uvs = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
    baseGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    baseGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    baseGeo.setIndex([0, 1, 2, 1, 3, 2]);

    const instGeo = new THREE.InstancedBufferGeometry();
    instGeo.index = baseGeo.index;
    instGeo.attributes.position = baseGeo.attributes.position;
    instGeo.attributes.uv = baseGeo.attributes.uv;

    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      seeds[i * 4]     = (Math.random() - 0.5) * 88.0; // X box offset
      seeds[i * 4 + 1] = Math.random() * 52.0;         // Y box phase
      seeds[i * 4 + 2] = (Math.random() - 0.5) * 88.0; // Z box offset
      seeds[i * 4 + 3] = 0.78 + Math.random() * 0.52;  // Speed & length variation
    }
    instGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4));
    instGeo.instanceCount = count;

    const rainMat = new THREE.ShaderMaterial({
      uniforms: this.precipUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec4 aSeed;
        uniform float uTime;
        uniform vec3 uCamPos;
        uniform float uRainAmount;

        varying vec2 vUv;
        varying float vAlpha;

        void main() {
          vUv = uv;
          // Cull excess instances smoothly based on uRainAmount
          float idFrac = fract(aSeed.x * 13.37 + aSeed.z * 7.91);
          if (uRainAmount <= 0.01 || idFrac > uRainAmount) {
            gl_Position = vec4(2.0, 2.0, 2.0, 0.0);
            return;
          }

          float boxW = 88.0;
          float boxH = 52.0;
          float fallSpeed = 38.0 * aSeed.w;
          vec2 windVel = vec2(7.5, 4.8);

          // Toroidal Modulo Wrapping around Camera Position
          vec3 worldDrop;
          worldDrop.x = uCamPos.x + mod(aSeed.x + uTime * windVel.x - uCamPos.x + boxW * 0.5, boxW) - boxW * 0.5;
          worldDrop.y = uCamPos.y + mod(aSeed.y - uTime * fallSpeed - uCamPos.y + boxH * 0.55, boxH) - boxH * 0.45;
          worldDrop.z = uCamPos.z + mod(aSeed.z + uTime * windVel.y - uCamPos.z + boxW * 0.5, boxW) - boxW * 0.5;

          // Billboard streak facing camera horizontally + slanted along wind vector
          vec3 toCam = normalize(vec3(uCamPos.x - worldDrop.x, 0.0, uCamPos.z - worldDrop.z) + vec3(0.0001));
          vec3 sideAxis = cross(vec3(0.0, 1.0, 0.0), toCam);

          float streakLen = (1.15 + uRainAmount * 0.75) * aSeed.w;
          vec3 streakUp = normalize(vec3(-windVel.x, fallSpeed, -windVel.y)) * streakLen;

          vec3 finalPos = worldDrop + sideAxis * position.x + streakUp * position.y;
          float dist = distance(uCamPos, finalPos);
          vAlpha = (1.0 - smoothstep(26.0, 44.0, dist)) * smoothstep(0.8, 3.2, dist) * (0.28 + 0.30 * uRainAmount);

          gl_Position = projectionMatrix * viewMatrix * vec4(finalPos, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uLightScale;
        varying vec2 vUv;
        varying float vAlpha;

        void main() {
          float edge = sin(vUv.y * 3.14159265) * (1.0 - abs(vUv.x - 0.5) * 2.0);
          if (edge * vAlpha < 0.01) discard;
          vec3 rainCol = mix(vec3(0.42, 0.52, 0.68), vec3(0.82, 0.90, 0.98), uLightScale);
          gl_FragColor = vec4(rainCol, edge * vAlpha);
        }
      `
    });

    this.rainMesh = new THREE.Mesh(instGeo, rainMat);
    this.rainMesh.frustumCulled = false;
    this.rainMesh.visible = false;
    this.weatherGroup.add(this.rainMesh);
  }

  // 2. Ground & Water Surface Raindrop Splash Ripples (140 Pooled Rings around Player)
  buildSplashRings() {
    const count = 140;
    const ringGeo = new THREE.RingGeometry(0.10, 0.16, 14);
    ringGeo.rotateX(-Math.PI * 0.5);
    this.splashMat = new THREE.MeshBasicMaterial({
      color: 0xdbeafe,
      transparent: true,
      opacity: 0.42,
      depthWrite: false
    });
    this.splashInst = new THREE.InstancedMesh(ringGeo, this.splashMat, count);
    this.splashInst.frustumCulled = false;
    this.splashInst.visible = false;
    this.weatherGroup.add(this.splashInst);

    this.splashes = [];
    for (let i = 0; i < count; i++) {
      this.splashes.push({
        ox: (Math.random() - 0.5) * 32.0,
        oz: (Math.random() - 0.5) * 32.0,
        phase: Math.random(),
        speed: 1.8 + Math.random() * 1.4
      });
    }
    this._splashDummy = new THREE.Object3D();
  }

  // 3. Toroidal GPU Alpine Snowflakes (6,500 Tumbling Soft Flakes)
  buildSnowFlakes() {
    const count = 6500;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 92.0;
      positions[i * 3 + 1] = Math.random() * 48.0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 92.0;

      seeds[i * 3]     = Math.random() * Math.PI * 2.0;
      seeds[i * 3 + 1] = 0.65 + Math.random() * 0.75; // Fall speed
      seeds[i * 3 + 2] = 0.70 + Math.random() * 0.85; // Flake size
    }

    const snowGeo = new THREE.BufferGeometry();
    snowGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    snowGeo.setAttribute('aSnowSeed', new THREE.BufferAttribute(seeds, 3));

    const snowMat = new THREE.ShaderMaterial({
      uniforms: this.precipUniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */`
        attribute vec3 aSnowSeed;
        uniform float uTime;
        uniform vec3 uCamPos;
        uniform float uSnowAmount;

        varying float vAlpha;

        void main() {
          float idFrac = fract(aSnowSeed.x * 3.17 + aSnowSeed.y * 5.23);
          if (uSnowAmount <= 0.01 || idFrac > uSnowAmount) {
            gl_Position = vec4(2.0, 2.0, 2.0, 0.0);
            gl_PointSize = 0.0;
            return;
          }

          float boxW = 92.0;
          float boxH = 48.0;
          float fall = 3.8 * aSnowSeed.y;

          vec3 wp;
          wp.x = uCamPos.x + mod(position.x + uTime * 3.2 + sin(uTime * 1.4 + aSnowSeed.x) * 1.6 - uCamPos.x + boxW * 0.5, boxW) - boxW * 0.5;
          wp.y = uCamPos.y + mod(position.y - uTime * fall - uCamPos.y + boxH * 0.55, boxH) - boxH * 0.45;
          wp.z = uCamPos.z + mod(position.z + uTime * 2.1 + cos(uTime * 1.2 + aSnowSeed.x) * 1.6 - uCamPos.z + boxW * 0.5, boxW) - boxW * 0.5;

          vec4 mvPos = viewMatrix * vec4(wp, 1.0);
          float dist = length(mvPos.xyz);
          vAlpha = (1.0 - smoothstep(28.0, 46.0, dist)) * smoothstep(0.6, 2.5, dist) * 0.88;

          gl_PointSize = clamp((38.0 / max(dist, 1.0)) * aSnowSeed.z, 1.5, 9.0);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uLightScale;
        varying float vAlpha;

        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float r = length(c) * 2.0;
          if (r > 1.0) discard;
          float softFlake = pow(1.0 - r, 1.6);
          vec3 snowCol = mix(vec3(0.58, 0.68, 0.85), vec3(0.98, 0.99, 1.0), uLightScale);
          gl_FragColor = vec4(snowCol, softFlake * vAlpha);
        }
      `
    });

    this.snowPoints = new THREE.Points(snowGeo, snowMat);
    this.snowPoints.frustumCulled = false;
    this.snowPoints.visible = false;
    this.weatherGroup.add(this.snowPoints);
  }

  // 4. Jagged 3D Forked Lightning Bolt Renderer for Thunderstorms
  buildLightningBoltSystem() {
    this.boltMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.0
    });
    this.boltGroup = new THREE.Group();
    this.weatherGroup.add(this.boltGroup);
    this.nextStrikeTimer = 3.2;
    this.activeBoltAge = 99.0;
  }

  spawnLightningBolt(playerPos, terrain) {
    // Clear previous bolt meshes
    while (this.boltGroup.children.length > 0) {
      const ch = this.boltGroup.children.pop();
      if (ch.geometry) ch.geometry.dispose();
    }

    const angle = Math.random() * Math.PI * 2.0;
    const dist = 95.0 + Math.random() * 185.0;
    const strikeX = playerPos.x + Math.cos(angle) * dist;
    const strikeZ = playerPos.z + Math.sin(angle) * dist;
    const groundY = Math.max(0.0, terrain.getHeightAt(strikeX, strikeZ));

    // Build jagged main trunk from cloud base (215m) down to terrain
    const pts = [];
    const segs = 14;
    let cx = strikeX + (Math.random() - 0.5) * 18.0;
    let cz = strikeZ + (Math.random() - 0.5) * 18.0;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const py = THREE.MathUtils.lerp(218.0, groundY, t);
      const jitter = (1.0 - t) * 9.5;
      const px = THREE.MathUtils.lerp(cx, strikeX, t) + (i === 0 || i === segs ? 0 : (Math.random() - 0.5) * jitter);
      const pz = THREE.MathUtils.lerp(cz, strikeZ, t) + (i === 0 || i === segs ? 0 : (Math.random() - 0.5) * jitter);
      pts.push(new THREE.Vector3(px, py, pz));
    }

    const mainCurve = new THREE.CatmullRomCurve3(pts);
    const mainBolt = new THREE.Mesh(new THREE.TubeGeometry(mainCurve, 20, 0.55, 5, false), this.boltMat);
    this.boltGroup.add(mainBolt);

    // Add 2 secondary sky branches
    for (let b = 0; b < 2; b++) {
      const anchor = pts[3 + b * 4];
      const bPts = [
        anchor.clone(),
        anchor.clone().add(new THREE.Vector3((Math.random() - 0.5) * 22, -24, (Math.random() - 0.5) * 22)),
        anchor.clone().add(new THREE.Vector3((Math.random() - 0.5) * 38, -52, (Math.random() - 0.5) * 38))
      ];
      const branchMesh = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bPts), 8, 0.28, 4, false),
        this.boltMat
      );
      this.boltGroup.add(branchMesh);
    }

    this.activeBoltAge = 0.0;
  }

  cycleWeather() {
    this.modeIdx = (this.modeIdx + 1) % this.presets.length;
    return this.presets[this.modeIdx].label;
  }

  resolveTargets(playerPos, terrain) {
    const preset = this.presets[this.modeIdx];
    if (!preset.auto) return preset;

    // Auto Biome Weather: Snowfall in Glacial Crown Peaks, Misty Drizzle in Wet Pine Wilds, Clear elsewhere!
    const py = playerPos.y;
    const { temp, moisture } = terrain.getClimateAt(playerPos.x, playerPos.z);
    if (py > 32.0) {
      const snowAmt = THREE.MathUtils.smoothstep(py, 32.0, 44.0);
      return {
        label: 'Alpine Snow',
        rain: 0.0,
        snow: snowAmt * 0.90,
        overcast: snowAmt * 0.55,
        fog: THREE.MathUtils.lerp(0.0015, 0.0038, snowAmt),
        cloudCov: THREE.MathUtils.lerp(0.56, 0.78, snowAmt),
        waveMult: 1.0,
        storm: false
      };
    }
    if (moisture > 0.62 && temp < 0.58) {
      return {
        label: 'Forest Mist',
        rain: 0.36,
        snow: 0.0,
        overcast: 0.34,
        fog: 0.0024,
        cloudCov: 0.68,
        waveMult: 1.15,
        storm: false
      };
    }
    return {
      label: 'Fair Skies',
      rain: 0.0,
      snow: 0.0,
      overcast: 0.0,
      fog: 0.0014,
      cloudCov: 0.52,
      waveMult: 1.0,
      storm: false
    };
  }

  update(dt, elapsed, cameraPos, playerPos, sky, clouds, ocean, terrain) {
    const target = this.resolveTargets(playerPos, terrain);
    const rate = Math.min(1.0, dt * 1.8);

    this.live.rainAmount += (target.rain - this.live.rainAmount) * rate;
    this.live.snowAmount += (target.snow - this.live.snowAmount) * rate;
    this.live.overcast   += (target.overcast - this.live.overcast) * rate;
    this.live.fogDensity += (target.fog - this.live.fogDensity) * rate;

    // Ground wetness builds up during rain and dries gradually in clear sun
    const wetTarget = target.rain > 0.1 ? Math.min(1.0, target.rain * 1.1) : 0.0;
    this.live.wetness += (wetTarget - this.live.wetness) * Math.min(1.0, dt * 0.65);

    this.live.activeBanner = (this.presets[this.modeIdx].auto
      ? `AUTO • ${target.label}`
      : target.label).toUpperCase();

    // Sync Volumetric Cloud Coverage & Wet Terrain Roughness Sheen
    if (this.modeIdx !== 0) {
      clouds.uniforms.uCoverage.value += (target.cloudCov - clouds.uniforms.uCoverage.value) * rate;
      clouds.mesh.visible = clouds.uniforms.uCoverage.value > 0.01;
    }
    const wetRoughness = THREE.MathUtils.lerp(0.86, 0.38, this.live.wetness);
    for (let i = 0; i < terrain.lodMaterials.length; i++) {
      terrain.lodMaterials[i].roughness = wetRoughness;
    }

    // Modulate Ocean Storm Swell gently when storm/monsoon weather is active
    if (this.modeIdx !== 0) {
      const baseWave = ocean.seaStates[ocean.seaStateIdx].waveScale;
      ocean.uniforms.uWaveScale.value += (baseWave * target.waveMult - ocean.uniforms.uWaveScale.value) * rate;
    }

    // Update GPU Rain & Snow Uniforms
    const dayLightScale = THREE.MathUtils.lerp(0.28, 1.0, THREE.MathUtils.smoothstep(sky.sunDir.y, -0.12, 0.32));
    this.precipUniforms.uTime.value = elapsed;
    this.precipUniforms.uCamPos.value.copy(cameraPos);
    this.precipUniforms.uRainAmount.value = this.live.rainAmount;
    this.precipUniforms.uSnowAmount.value = this.live.snowAmount;
    this.precipUniforms.uLightScale.value = Math.min(1.3, dayLightScale + this.live.lightningFlash * 0.8);

    this.rainMesh.visible = this.live.rainAmount > 0.015;
    this.snowPoints.visible = this.live.snowAmount > 0.015;

    // Update Ground & Water Surface Raindrop Splash Rings around Player
    this.splashInst.visible = this.live.rainAmount > 0.08 && !player.flyMode;
    if (this.splashInst.visible) {
      const activeSplashes = Math.floor(this.splashes.length * Math.min(1.0, this.live.rainAmount));
      this.splashInst.count = activeSplashes;
      this.splashMat.opacity = 0.28 * this.live.rainAmount * dayLightScale;

      for (let i = 0; i < activeSplashes; i++) {
        const s = this.splashes[i];
        s.phase += dt * s.speed;
        if (s.phase >= 1.0) {
          s.phase -= 1.0;
          s.ox = (Math.random() - 0.5) * 30.0;
          s.oz = (Math.random() - 0.5) * 30.0;
        }
        const wx = playerPos.x + s.ox;
        const wz = playerPos.z + s.oz;
        const sy = Math.max(terrain.seaLevel + 0.04, terrain.getHeightAt(wx, wz) + 0.04);
        const ringScale = 0.3 + s.phase * 1.45;
        this._splashDummy.position.set(wx, sy, wz);
        this._splashDummy.scale.setScalar(ringScale * (1.0 - s.phase * 0.35));
        this._splashDummy.updateMatrix();
        this.splashInst.setMatrixAt(i, this._splashDummy.matrix);
      }
      this.splashInst.instanceMatrix.needsUpdate = true;
    }

    // Update Thunderstorm Forked Lightning Bolts & Multi-Pulse Sky Flash!
    if (target.storm) {
      this.nextStrikeTimer -= dt;
      if (this.nextStrikeTimer <= 0.0) {
        this.spawnLightningBolt(playerPos, terrain);
        this.nextStrikeTimer = 3.2 + Math.random() * 5.2;
      }
    }
    if (this.activeBoltAge < 0.42) {
      this.activeBoltAge += dt;
      // Double-flicker lightning envelope
      const a = this.activeBoltAge;
      const pulse = (a < 0.09 || (a > 0.14 && a < 0.24)) ? 1.0 : Math.max(0.0, 1.0 - (a - 0.24) / 0.18);
      this.live.lightningFlash = pulse;
      this.boltMat.opacity = pulse * 0.95;
      this.boltGroup.visible = pulse > 0.02;
    } else {
      this.live.lightningFlash = 0.0;
      this.boltGroup.visible = false;
    }
  }
}

// -------------------------------------------------------------------------
// 3A. CHUNK 003: CUSTOM GLSL GERSTNER OCEAN, LAGOON ABSORPTION & SHORE FOAM
// -------------------------------------------------------------------------
class OceanWaterSystem {
  constructor(scene, seaLevel = 0.0, chunkSize = 96, viewRadius = 5) {
    this.scene = scene;
    this.seaLevel = seaLevel;
    this.seaStates = [
      { name: 'Calm',  waveScale: 0.36, chop: 0.55 },
      { name: 'Swell', waveScale: 1.00, chop: 1.00 },
      { name: 'Storm', waveScale: 1.85, chop: 1.55 }
    ];
    this.seaStateIdx = 1;

    // 4 Gerstner Wave Definitions (Shared between GPU Shader & CPU Buoyancy!)
    this.waves = [
      { dx:  0.82, dz:  0.57, len: 28.0, steep: 0.22, amp: 0.34 },
      { dx:  0.38, dz: -0.92, len: 16.0, steep: 0.20, amp: 0.18 },
      { dx: -0.74, dz:  0.67, len:  9.2, steep: 0.18, amp: 0.095 },
      { dx: -0.45, dz: -0.89, len:  4.8, steep: 0.15, amp: 0.048 }
    ];
    this.waves.forEach(w => {
      const inv = 1.0 / Math.hypot(w.dx, w.dz);
      w.dx *= inv;
      w.dz *= inv;
      w.k = (Math.PI * 2.0) / w.len;
      w.c = Math.sqrt(9.81 / w.k);
    });

    this.uniforms = {
      uTime:          { value: 0 },
      uSeaLevel:      { value: this.seaLevel },
      uWaveScale:     { value: 1.0 },
      uChop:          { value: 1.0 },
      uLightDir:      { value: new THREE.Vector3(0.5, 0.5, -0.5) },
      uLightColor:    { value: new THREE.Color(0xfff0cc) },
      uDayFactor:     { value: 1.0 },
      uZenithColor:   { value: new THREE.Color(0x1b5299) },
      uHorizonColor:  { value: new THREE.Color(0xb7daeb) },
      uFogColor:      { value: new THREE.Color(0xb7daeb) },
      uFogDensity:    { value: 0.0014 },
      uPlayerPos:     { value: new THREE.Vector3() },
      uWakeStrength:  { value: 0.0 }
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute float aSeabedY;

        uniform float uTime;
        uniform float uSeaLevel;
        uniform float uWaveScale;

        varying vec3 vWorldPos;
        varying vec3 vNormalW;
        varying float vSeabedY;
        varying float vCrestFactor;
        varying float vFogDepth;

        void addGerstner(
          vec2 xz, vec2 dir, float k, float c, float steep, float amp,
          inout vec3 disp, inout vec3 tangent, inout vec3 binormal
        ) {
          float phase = k * (dot(dir, xz) - c * uTime);
          float s = sin(phase);
          float co = cos(phase);
          float q = steep / max(k * amp * 4.0, 0.001);

          disp.x += dir.x * (q * amp * co);
          disp.y += amp * s;
          disp.z += dir.y * (q * amp * co);

          float wa = k * amp;
          tangent  += vec3(-dir.x * dir.x * (steep * s), dir.x * (wa * co), -dir.x * dir.y * (steep * s));
          binormal += vec3(-dir.x * dir.y * (steep * s), dir.y * (wa * co), -dir.y * dir.y * (steep * s));
        }

        void main() {
          vec4 worldBase = modelMatrix * vec4(position, 1.0);
          vSeabedY = aSeabedY;

          // Shoaling Attenuation: waves calm smoothly as water shallows onto sandy beaches
          float rawDepth = max(0.0, uSeaLevel - aSeabedY);
          float shoreDamp = clamp(rawDepth / 2.6, 0.05, 1.0) * uWaveScale;

          vec3 disp = vec3(0.0);
          vec3 tangent = vec3(1.0, 0.0, 0.0);
          vec3 binormal = vec3(0.0, 0.0, 1.0);

          if (shoreDamp > 0.002) {
            addGerstner(worldBase.xz, vec2( 0.821,  0.571), 0.2244, 6.612, 0.22, 0.34  * shoreDamp, disp, tangent, binormal);
            addGerstner(worldBase.xz, vec2( 0.381, -0.924), 0.3927, 4.998, 0.20, 0.18  * shoreDamp, disp, tangent, binormal);
            addGerstner(worldBase.xz, vec2(-0.741,  0.671), 0.6830, 3.790, 0.18, 0.095 * shoreDamp, disp, tangent, binormal);
            addGerstner(worldBase.xz, vec2(-0.451, -0.892), 1.3090, 2.737, 0.15, 0.048 * shoreDamp, disp, tangent, binormal);
          }

          vec3 displacedWorld = worldBase.xyz + disp;
          vWorldPos = displacedWorld;
          vNormalW = normalize(cross(binormal, tangent));
          vCrestFactor = clamp(disp.y / max(0.38 * max(uWaveScale, 0.35), 0.01), 0.0, 1.0);

          vec4 mvPos = viewMatrix * vec4(displacedWorld, 1.0);
          vFogDepth = -mvPos.z;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uTime;
        uniform float uChop;
        uniform vec3 uLightDir;
        uniform vec3 uLightColor;
        uniform float uDayFactor;
        uniform vec3 uZenithColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uFogColor;
        uniform float uFogDensity;
        uniform vec3 uPlayerPos;
        uniform float uWakeStrength;

        varying vec3 vWorldPos;
        varying vec3 vNormalW;
        varying float vSeabedY;
        varying float vCrestFactor;
        varying float vFogDepth;

        // Fast procedural value noise for capillary ripples & lacy shore surf breakup
        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float vnoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
            mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        void main() {
          float waterDepth = vWorldPos.y - vSeabedY;
          if (waterDepth <= -0.02) discard;

          // 1. Dual Counter-Scrolling Capillary Normal Ripples
          vec2 uv1 = vWorldPos.xz * 0.42 + vec2(uTime * 0.32, uTime * 0.19);
          vec2 uv2 = vWorldPos.xz * 0.87 - vec2(uTime * 0.24, uTime * 0.36);
          float r1 = vnoise(uv1) - 0.5;
          float r2 = vnoise(uv2) - 0.5;
          float r3 = vnoise(vWorldPos.xz * 1.9 + vec2(-uTime * 0.45, uTime * 0.28)) - 0.5;

          vec3 N = normalize(vNormalW + vec3((r1 + r3 * 0.5) * 0.15 * uChop, 0.0, (r2 - r3 * 0.5) * 0.15 * uChop));

          // 2. Interactive Player Wading / Swimming Wake Ripples
          float dPlayer = length(vWorldPos.xz - uPlayerPos.xz);
          float wakeMask = exp(-dPlayer * 0.52) * smoothstep(0.15, 0.65, dPlayer) * uWakeStrength;
          float wakeRing = sin(dPlayer * 7.5 - uTime * 7.2);
          N = normalize(N + vec3(
            (vWorldPos.x - uPlayerPos.x) / max(dPlayer, 0.05) * wakeRing * wakeMask * 0.28,
            0.0,
            (vWorldPos.z - uPlayerPos.z) / max(dPlayer, 0.05) * wakeRing * wakeMask * 0.28
          ));

          vec3 V = normalize(cameraPosition - vWorldPos);
          float NdotV = max(dot(N, V), 0.001);

          // 3. Beer-Lambert Lagoon Depth Absorption (Turquoise Shallows -> Emerald -> Abyssal Sapphire)
          float lightScale = mix(0.22, 1.0, uDayFactor);
          vec3 shallowLagoon = vec3(0.15, 0.72, 0.69) * lightScale;
          vec3 midOcean      = vec3(0.05, 0.36, 0.49) * lightScale;
          vec3 deepAbyss     = vec3(0.02, 0.12, 0.24) * lightScale;

          float shallowMix = 1.0 - exp(-max(waterDepth, 0.0) * 0.52);
          float deepMix    = 1.0 - exp(-max(waterDepth, 0.0) * 0.13);
          vec3 bodyColor = mix(shallowLagoon, midOcean, shallowMix);
          bodyColor = mix(bodyColor, deepAbyss, deepMix);

          // Subsurface Turquoise Wave-Crest Scatter when backlit by Sun
          float backScatter = pow(max(dot(V, -uLightDir), 0.0), 3.0) * vCrestFactor * uDayFactor;
          bodyColor += vec3(0.08, 0.48, 0.46) * backScatter * 0.65;

          // 4. Schlick Fresnel Sky Reflection
          float fresnel = 0.03 + 0.97 * pow(1.0 - NdotV, 4.6);
          vec3 reflDir = reflect(-V, N);
          vec3 skyRefl = mix(uHorizonColor, uZenithColor, clamp(reflDir.y * 0.75 + 0.2, 0.0, 1.0));
          vec3 waterCol = mix(bodyColor, skyRefl, clamp(fresnel * 0.86, 0.0, 0.92));

          // 5. Crisp Solar / Lunar Specular Glint Path
          vec3 H = normalize(uLightDir + V);
          float NdotH = max(dot(N, H), 0.0);
          float sunGlintTight = pow(NdotH, 320.0) * 2.6;
          float sunGlintBroad = pow(NdotH, 28.0) * 0.24;
          waterCol += uLightColor * (sunGlintTight + sunGlintBroad);

          // 6. Animated Breaking Shoreline Surf Foam + Steep Crest Whitecaps + Player Wake Foam
          float foamNoise = vnoise(vWorldPos.xz * 1.35 + vec2(uTime * 0.18, -uTime * 0.14));
          float shoreBand = 1.0 - smoothstep(0.0, 1.85, waterDepth);
          float surfRibbons = sin(waterDepth * 6.4 - uTime * 3.1 + foamNoise * 3.8);
          float shoreFoam = shoreBand * smoothstep(0.15, 0.72, surfRibbons * 0.5 + 0.5) * (0.45 + 0.55 * foamNoise);
          // Extra crisp wet-foam rim right at water's contact line
          shoreFoam = max(shoreFoam, (1.0 - smoothstep(0.0, 0.26, waterDepth)) * (0.55 + 0.45 * foamNoise));

          float crestFoam = smoothstep(0.62, 0.96, vCrestFactor + foamNoise * 0.28 - 0.12) * smoothstep(1.2, 4.0, waterDepth) * 0.75;
          float playerFoam = smoothstep(0.25, 0.85, wakeRing * 0.5 + 0.5) * wakeMask * 0.75;

          float totalFoam = clamp(shoreFoam + crestFoam + playerFoam, 0.0, 1.0);
          vec3 foamColor = mix(vec3(0.28, 0.34, 0.45), vec3(0.95, 0.98, 1.0), mix(0.25, 1.0, uDayFactor));
          waterCol = mix(waterCol, foamColor, totalFoam);

          // 7. Smooth Shoreline Alpha Feathering & Exponential Aerial Fog
          float edgeAlpha = smoothstep(0.0, 0.22, waterDepth);
          float alpha = clamp(edgeAlpha * (0.76 + 0.20 * deepMix) + fresnel * 0.22 + totalFoam * 0.45, 0.0, 0.97);

          float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
          waterCol = mix(waterCol, uFogColor, clamp(fogFactor, 0.0, 1.0));

          gl_FragColor = vec4(waterCol, alpha);
        }
      `
    });

    // Build 4-Panel Outer Distant Horizon Sea Frame outside the 11x11 active chunk box
    this.outerWaterGroup = new THREE.Group();
    this.scene.add(this.outerWaterGroup);
    this.buildOuterHorizonSea(chunkSize, viewRadius);
  }

  buildOuterHorizonSea(chunkSize, viewRadius) {
    const innerHalf = (viewRadius + 0.5) * chunkSize; // Exact 528m boundary of 11x11 chunk grid!
    const outerHalf = 1750;
    const bandWidth = outerHalf - innerHalf;
    const fullWidth = outerHalf * 2;

    const addSlab = (w, d, ox, oz, segX, segZ) => {
      const geo = new THREE.PlaneGeometry(w, d, segX, segZ);
      geo.rotateX(-Math.PI * 0.5);
      geo.translate(ox, this.seaLevel, oz);
      const count = geo.attributes.position.count;
      const seabedAttr = new Float32Array(count).fill(-26.0);
      geo.setAttribute('aSeabedY', new THREE.BufferAttribute(seabedAttr, 1));
      const m = new THREE.Mesh(geo, this.material);
      m.frustumCulled = false;
      this.outerWaterGroup.add(m);
    };

    // North & South full-span slabs + West & East side slabs (Zero overlap with inner 11x11 grid!)
    addSlab(fullWidth, bandWidth, 0, -(innerHalf + bandWidth * 0.5), 48, 16);
    addSlab(fullWidth, bandWidth, 0,  (innerHalf + bandWidth * 0.5), 48, 16);
    addSlab(bandWidth, innerHalf * 2, -(innerHalf + bandWidth * 0.5), 0, 16, 32);
    addSlab(bandWidth, innerHalf * 2,  (innerHalf + bandWidth * 0.5), 0, 16, 32);
  }

  // Builds per-chunk water tile with exact seabed depth attribute (returns null for dry mountain chunks!)
  buildChunkWaterGeometry(cx, cz, chunkSize, lod, heightFn) {
    const segsByLod = [28, 20, 12, 6];
    const S = segsByLod[lod] || 12;
    const stride = S + 1;
    const vertCount = stride * stride;

    const originX = cx * chunkSize;
    const originZ = cz * chunkSize;
    const half = chunkSize * 0.5;
    const step = chunkSize / S;

    let minSeabed = Infinity;
    const positions = new Float32Array(vertCount * 3);
    const seabedY = new Float32Array(vertCount);

    let vPtr = 0;
    let sPtr = 0;
    for (let iz = 0; iz <= S; iz++) {
      const vz = originZ - half + iz * step;
      for (let ix = 0; ix <= S; ix++) {
        const vx = originX - half + ix * step;
        const h = heightFn(vx, vz);
        if (h < minSeabed) minSeabed = h;

        positions[vPtr++] = vx;
        positions[vPtr++] = this.seaLevel;
        positions[vPtr++] = vz;
        seabedY[sPtr++] = h;
      }
    }

    // Skip water mesh entirely if every single point in this chunk is high dry land!
    if (minSeabed > this.seaLevel + 1.8) return null;

    const indices = new Uint32Array(S * S * 6);
    let iPtr = 0;
    for (let iz = 0; iz < S; iz++) {
      for (let ix = 0; ix < S; ix++) {
        const a = iz * stride + ix;
        const b = (iz + 1) * stride + ix;
        const c = iz * stride + (ix + 1);
        const d = (iz + 1) * stride + (ix + 1);
        indices[iPtr++] = a; indices[iPtr++] = b; indices[iPtr++] = c;
        indices[iPtr++] = b; indices[iPtr++] = d; indices[iPtr++] = c;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeabedY', new THREE.BufferAttribute(seabedY, 1));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeBoundingSphere();
    return geo;
  }

  // Exact CPU mirror of the 4-wave Gerstner height for buoyant swimming & boats
  getWaveHeightAt(x, z, elapsed, seabedY = -10.0) {
    const rawDepth = Math.max(0.0, this.seaLevel - seabedY);
    const shoreDamp = THREE.MathUtils.clamp(rawDepth / 2.6, 0.05, 1.0) * this.uniforms.uWaveScale.value;
    let yDisp = 0;
    for (let i = 0; i < this.waves.length; i++) {
      const w = this.waves[i];
      const phase = w.k * (w.dx * x + w.dz * z - w.c * elapsed);
      yDisp += w.amp * shoreDamp * Math.sin(phase);
    }
    return this.seaLevel + yDisp;
  }

  cycleSeaState() {
    this.seaStateIdx = (this.seaStateIdx + 1) % this.seaStates.length;
    const st = this.seaStates[this.seaStateIdx];
    this.uniforms.uWaveScale.value = st.waveScale;
    this.uniforms.uChop.value = st.chop;
    return st.name;
  }

  setWireframe(enabled) {
    this.material.wireframe = enabled;
  }

  update(elapsed, sky, playerPos, playerWaterWake, pcx, pcz, chunkSize) {
    this.uniforms.uTime.value = elapsed;

    const solarElev = sky.sunDir.y;
    const dayFactor = THREE.MathUtils.smoothstep(solarElev, -0.12, 0.32);
    const activeLightDir = solarElev >= -0.05 ? sky.sunDir : sky.sunDir.clone().negate();

    this.uniforms.uLightDir.value.copy(activeLightDir);
    this.uniforms.uLightColor.value.copy(sky.sunLight.color);
    this.uniforms.uDayFactor.value = dayFactor;
    this.uniforms.uZenithColor.value.copy(sky.uniforms.uZenithColor.value);
    this.uniforms.uHorizonColor.value.copy(sky.uniforms.uHorizonColor.value);
    this.uniforms.uFogColor.value.copy(sky.fog.color);
    this.uniforms.uFogDensity.value = sky.fog.density;

    this.uniforms.uPlayerPos.value.copy(playerPos);
    this.uniforms.uWakeStrength.value += (playerWaterWake - this.uniforms.uWakeStrength.value) * 0.12;

    // Keep outer horizon sea frame locked to active 11x11 chunk grid center
    this.outerWaterGroup.position.set(pcx * chunkSize, 0, pcz * chunkSize);
  }
}

// -------------------------------------------------------------------------
// 3B. CHUNK 004: GPU-INSTANCED WIND-SWEPT GRASS, WILDFLOWERS & TRAMPLE SHADER
// -------------------------------------------------------------------------
class GrassFoliageSystem {
  constructor(scene) {
    this.scene = scene;
    this.foliageGroup = new THREE.Group();
    this.scene.add(this.foliageGroup);

    this.densityModes = [
      { name: 'Lush',   mult: 1.00 },
      { name: 'Ultra',  mult: 1.55 },
      { name: 'Sparse', mult: 0.45 },
      { name: 'Off',    mult: 0.00 }
    ];
    this.densityIdx = 0;
    this.totalActiveBlades = 0;

    this.uniforms = {
      uTime:        { value: 0 },
      uPlayerPos:   { value: new THREE.Vector3() },
      uLightDir:    { value: new THREE.Vector3(0.5, 0.6, -0.5) },
      uLightColor:  { value: new THREE.Color(0xfff0cc) },
      uDayFactor:   { value: 1.0 },
      uAmbientCol:  { value: new THREE.Color(0x6e8ca8) },
      uFogColor:    { value: new THREE.Color(0xb7daeb) },
      uFogDensity:  { value: 0.0014 },
      uFadeNear:    { value: 175.0 },
      uFadeFar:     { value: 222.0 }
    };

    this.bladeGeo = this.createCurvedBladeGeometry();
    this.flowerGeo = this.createWildflowerGeometry();

    this.grassMat = this.createFoliageMaterial(false);
    this.flowerMat = this.createFoliageMaterial(true);
  }

  // 4-Segment Curved & Tapered Single-Blade Geometry (9 Vertices, 7 Triangles)
  createCurvedBladeGeometry() {
    const segs = 4;
    const baseHalfW = 0.068;
    const height = 1.0;

    const positions = [];
    const heights = [];
    const indices = [];

    for (let i = 0; i < segs; i++) {
      const t = i / segs;
      const w = baseHalfW * (1.0 - t * 0.78);
      const y = t * height;
      const zArc = t * t * 0.16; // Natural organic droop curve

      positions.push(-w, y, zArc, w, y, zArc);
      heights.push(t, t);
    }
    // Sharp apex tip vertex
    positions.push(0.0, height, 0.22);
    heights.push(1.0);

    for (let i = 0; i < segs - 1; i++) {
      const b = i * 2;
      indices.push(b, b + 1, b + 2);
      indices.push(b + 1, b + 3, b + 2);
    }
    const topBase = (segs - 1) * 2;
    const tipIdx = segs * 2;
    indices.push(topBase, topBase + 1, tipIdx);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('aHeightFrac', new THREE.Float32BufferAttribute(heights, 1));
    geo.setIndex(indices);
    return geo;
  }

  // Lightweight Crossed-Star Wildflower Blossom + Stem Geometry (12 Triangles)
  createWildflowerGeometry() {
    const positions = [];
    const heights = [];
    const blossomMask = [];
    const indices = [];

    // Thin stem quad
    const sw = 0.022;
    const sh = 0.72;
    positions.push(-sw, 0, 0,  sw, 0, 0,  -sw * 0.7, sh, 0.05,  sw * 0.7, sh, 0.05);
    heights.push(0, 0, 0.85, 0.85);
    blossomMask.push(0, 0, 0, 0);
    indices.push(0, 1, 2,  1, 3, 2);

    // 2 Crossed Diamond Blossom Planes at stem apex
    const r = 0.15;
    const cy = sh + 0.04;
    const planes = [
      [-r, cy, 0.05,  r, cy, 0.05,  0, cy + r * 0.9, 0.05,  0, cy - r * 0.7, 0.05],
      [0, cy, 0.05 - r,  0, cy, 0.05 + r,  0, cy + r * 0.9, 0.05,  0, cy - r * 0.7, 0.05]
    ];
    planes.forEach(p => {
      const base = positions.length / 3;
      positions.push(...p);
      heights.push(0.95, 0.95, 1.0, 0.9);
      blossomMask.push(1, 1, 1, 1);
      indices.push(base, base + 2, base + 1,  base, base + 1, base + 3);
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('aHeightFrac', new THREE.Float32BufferAttribute(heights, 1));
    geo.setAttribute('aBlossom', new THREE.Float32BufferAttribute(blossomMask, 1));
    geo.setIndex(indices);
    return geo;
  }

  createFoliageMaterial(isFlower = false) {
    return new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec4 aOffsetScale; // xyz: world root pos, w: height scale
        attribute vec4 aRotTint;     // x: yaw, y:r, z:g, w:b
        attribute float aHeightFrac;
        ${isFlower ? 'attribute float aBlossom;' : ''}

        uniform float uTime;
        uniform vec3 uPlayerPos;
        uniform float uFadeNear;
        uniform float uFadeFar;

        varying float vHeightFrac;
        varying vec3 vTint;
        varying vec3 vWorldPos;
        varying float vFogDepth;
        varying float vWindGust;
        ${isFlower ? 'varying float vBlossom;' : ''}

        void main() {
          vec3 rootPos = aOffsetScale.xyz;
          float distToCam = distance(cameraPosition.xz, rootPos.xz);
          float distScale = 1.0 - smoothstep(uFadeNear, uFadeFar, distToCam);

          if (distScale <= 0.005) {
            gl_Position = vec4(2.0, 2.0, 2.0, 0.0);
            return;
          }

          float scaleH = aOffsetScale.w * distScale;
          float yaw = aRotTint.x;
          float s = sin(yaw);
          float c = cos(yaw);

          vec3 local = position;
          local.y *= scaleH;
          local.xz *= mix(0.82, 1.18, clamp(aOffsetScale.w * 0.65, 0.0, 1.0)) * distScale;

          // Rotate blade around Y axis
          vec3 rotated = vec3(
            local.x * c + local.z * s,
            local.y,
            -local.x * s + local.z * c
          );

          // Travelling Open-World Wind Gust Field + Individual Blade Flutter
          float gustPhase = rootPos.x * 0.065 + rootPos.z * 0.048 - uTime * 2.15;
          float macroGust = sin(gustPhase) * 0.6 + sin(gustPhase * 0.43 + 1.7) * 0.4;
          float flutter = sin(uTime * 5.6 + rootPos.x * 1.9 - rootPos.z * 1.7) * 0.14;
          float bendAmt = (macroGust * 0.36 + 0.16 + flutter) * (aHeightFrac * aHeightFrac) * scaleH;

          vec2 windDir = normalize(vec2(0.84, 0.54));
          rotated.xz += windDir * bendAmt;
          rotated.y -= abs(bendAmt) * 0.26; // Volume-preserving arc dip

          // Interactive Player Trample Sphere (Grass parts smoothly around Explorer's feet!)
          vec3 deltaP = rootPos - uPlayerPos;
          float horizDist = length(deltaP.xz);
          float vertProximity = 1.0 - smoothstep(0.4, 2.6, abs(deltaP.y));
          float trample = (1.0 - smoothstep(0.25, 1.75, horizDist)) * vertProximity * (aHeightFrac * aHeightFrac);
          if (trample > 0.001) {
            vec2 pushOut = horizDist > 0.02 ? normalize(deltaP.xz) : vec2(1.0, 0.0);
            rotated.xz += pushOut * trample * 0.85 * scaleH;
            rotated.y -= trample * 0.52 * scaleH;
          }

          vec3 finalWorld = rootPos + rotated;
          vWorldPos = finalWorld;
          vHeightFrac = aHeightFrac;
          vTint = aRotTint.yzw;
          vWindGust = macroGust * 0.5 + 0.5;
          ${isFlower ? 'vBlossom = aBlossom;' : ''}

          vec4 mvPos = viewMatrix * vec4(finalWorld, 1.0);
          vFogDepth = -mvPos.z;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */`
        uniform vec3 uLightDir;
        uniform vec3 uLightColor;
        uniform float uDayFactor;
        uniform vec3 uAmbientCol;
        uniform vec3 uFogColor;
        uniform float uFogDensity;

        varying float vHeightFrac;
        varying vec3 vTint;
        varying vec3 vWorldPos;
        varying float vFogDepth;
        varying float vWindGust;
        ${isFlower ? 'varying float vBlossom;' : ''}

        void main() {
          vec3 V = normalize(cameraPosition - vWorldPos);

          // Upward-blended Terrain Normal Approximation for Velvet Meadow Shading
          vec3 pseudoN = normalize(vec3(0.0, 1.0, 0.0));
          float sunDiff = max(dot(pseudoN, uLightDir), 0.0);

          // Root-to-Tip Ambient Occlusion & Golden Tip Warmth
          vec3 rootShadow = vTint * 0.36;
          vec3 tipColor = mix(vTint * 1.24, vec3(0.76, 0.86, 0.36), 0.26 * uDayFactor);
          vec3 albedo = mix(rootShadow, tipColor, pow(vHeightFrac, 0.78));

          // Subtle Sunlit Gust Shimmer Wave across Hillsides
          albedo *= mix(0.92, 1.10, vWindGust * vHeightFrac);

          ${isFlower ? `
            if (vBlossom > 0.5) {
              albedo = vTint;
            } else {
              albedo = vec3(0.24, 0.48, 0.22) * mix(0.45, 1.05, vHeightFrac);
            }
          ` : ''}

          // Subsurface Backlit Translucency when looking toward low Dawn/Dusk Sun!
          float backLight = pow(max(dot(V, -uLightDir), 0.0), 3.2) * vHeightFrac * uDayFactor;
          vec3 sunTerm = uLightColor * (sunDiff * 0.85 + backLight * 0.75);
          vec3 ambTerm = mix(vec3(0.08, 0.12, 0.22), uAmbientCol, uDayFactor) * mix(0.48, 1.0, vHeightFrac);

          vec3 col = albedo * (ambTerm + sunTerm);

          // Aerial Perspective Exponential Fog Match
          float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
          col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));

          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
  }

  // Deterministic Fast Hash for Zero-Alloc Chunk Seeding
  hash2(x, z, salt = 0) {
    let n = Math.imul(Math.floor(x * 13 + salt * 31), 374761393) + Math.imul(Math.floor(z * 17 - salt * 19), 668265263);
    n = (n ^ (n >>> 13)) >>> 0;
    n = Math.imul(n, 1274126177) >>> 0;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }

  buildChunkFoliage(cx, cz, chunkSize, lod, terrain) {
    const mode = this.densityModes[this.densityIdx];
    if (mode.mult <= 0.001 || lod > 1) return null;

    // LOD 0 inner 3x3 chunks: lush dense carpet; LOD 1 middle ring: graceful medium density
    const baseSamples = lod === 0 ? 3400 : 1050;
    const sampleCount = Math.floor(baseSamples * mode.mult);
    const flowerSamples = lod === 0 ? Math.floor(140 * mode.mult) : Math.floor(40 * mode.mult);

    const originX = cx * chunkSize;
    const originZ = cz * chunkSize;
    const half = chunkSize * 0.5;
    const normTmp = new THREE.Vector3();

    const grassOffsets = [];
    const grassRotTints = [];

    for (let i = 0; i < sampleCount; i++) {
      const rx = this.hash2(cx * 97 + i, cz * 131 - i, 1);
      const rz = this.hash2(cx * 53 - i, cz * 89 + i, 2);
      const wx = originX - half + rx * chunkSize;
      const wz = originZ - half + rz * chunkSize;

      const wy = terrain.getHeightAt(wx, wz);
      // Skip underwater, wet surf beach, or high alpine snow!
      if (wy < terrain.seaLevel + 1.35 || wy > 35.5) continue;

      terrain.getNormalAt(wx, wz, normTmp);
      // Skip sheer rocky cliffs
      if (normTmp.y < 0.77) continue;

      const { temp, moisture } = terrain.getClimateAt(wx, wz);
      const aridMask = THREE.MathUtils.smoothstep(temp, 0.56, 0.78) * (1.0 - THREE.MathUtils.smoothstep(moisture, 0.22, 0.46));
      // Sparse dry scrub tufts only occasionally in desert margins; zero in deep dunes
      if (aridMask > 0.35 && this.hash2(wx, wz, 3) < aridMask * 1.15) continue;

      // Organic meadow clumping via noise
      const clump = terrain.noise.noise2D(wx * 0.06, wz * 0.06) * 0.5 + 0.5;
      if (clump < 0.16) continue;

      const altFade = 1.0 - THREE.MathUtils.smoothstep(wy, 24.0, 35.5);
      const hScale = (0.58 + clump * 0.72 + this.hash2(wx, wz, 4) * 0.35) * (0.55 + 0.45 * altFade) * (1.0 - aridMask * 0.4);
      const yaw = this.hash2(wx, wz, 5) * Math.PI * 2.0;

      // Biome-tuned Grass Blade Color (Lush Emerald -> Deep Pine -> Golden Savanna/Highland)
      let r = 0.26, g = 0.52, b = 0.21;
      if (moisture > 0.55) {
        r = 0.19; g = 0.44; b = 0.21; // Cool rich pine forest grass
      }
      if (wy > 20.0) {
        const hMix = THREE.MathUtils.smoothstep(wy, 20.0, 33.0);
        r = THREE.MathUtils.lerp(r, 0.46, hMix);
        g = THREE.MathUtils.lerp(g, 0.49, hMix);
        b = THREE.MathUtils.lerp(b, 0.25, hMix);
      }
      if (aridMask > 0.05) {
        r = THREE.MathUtils.lerp(r, 0.68, aridMask);
        g = THREE.MathUtils.lerp(g, 0.58, aridMask);
        b = THREE.MathUtils.lerp(b, 0.28, aridMask);
      }
      // Subtle per-blade tonal variation
      const jitter = 0.88 + this.hash2(wx, wz, 6) * 0.26;
      grassOffsets.push(wx, wy - 0.03, wz, hScale);
      grassRotTints.push(yaw, r * jitter, g * jitter, b * jitter);
    }

    // Scatter Wildflower Clusters across Lush Lowlands & Forest Glades
    const flowerOffsets = [];
    const flowerRotTints = [];
    const flowerPalette = [
      [0.98, 0.82, 0.24], // Sunlit Buttercup Gold
      [0.96, 0.95, 0.92], // Meadow Daisy White
      [0.72, 0.52, 0.94], // Wild Lavender
      [0.94, 0.42, 0.48]  // Poppy Coral
    ];

    for (let i = 0; i < flowerSamples; i++) {
      const rx = this.hash2(cx * 71 + i, cz * 43 - i, 7);
      const rz = this.hash2(cx * 37 - i, cz * 113 + i, 8);
      const wx = originX - half + rx * chunkSize;
      const wz = originZ - half + rz * chunkSize;
      const wy = terrain.getHeightAt(wx, wz);

      if (wy < terrain.seaLevel + 2.0 || wy > 23.0) continue;
      terrain.getNormalAt(wx, wz, normTmp);
      if (normTmp.y < 0.84) continue;

      const { temp, moisture } = terrain.getClimateAt(wx, wz);
      if (temp > 0.62 && moisture < 0.44) continue; // No flowers in scorched desert

      const patch = terrain.noise.noise2D(wx * 0.045 + 9.2, wz * 0.045 - 4.7);
      if (patch < 0.06) continue;

      const col = flowerPalette[Math.floor(this.hash2(wx, wz, 9) * flowerPalette.length) % flowerPalette.length];
      const fScale = 0.68 + this.hash2(wx, wz, 10) * 0.45;
      const yaw = this.hash2(wx, wz, 11) * Math.PI * 2.0;

      flowerOffsets.push(wx, wy - 0.02, wz, fScale);
      flowerRotTints.push(yaw, col[0], col[1], col[2]);
    }

    const grassCount = grassOffsets.length / 4;
    const flowerCount = flowerOffsets.length / 4;
    if (grassCount === 0 && flowerCount === 0) return null;

    const bundle = new THREE.Group();
    bundle.userData.bladeCount = grassCount + flowerCount;

    if (grassCount > 0) {
      const instGeo = new THREE.InstancedBufferGeometry();
      instGeo.index = this.bladeGeo.index;
      instGeo.attributes.position = this.bladeGeo.attributes.position;
      instGeo.attributes.aHeightFrac = this.bladeGeo.attributes.aHeightFrac;
      instGeo.setAttribute('aOffsetScale', new THREE.InstancedBufferAttribute(new Float32Array(grassOffsets), 4));
      instGeo.setAttribute('aRotTint', new THREE.InstancedBufferAttribute(new Float32Array(grassRotTints), 4));
      instGeo.instanceCount = grassCount;
      instGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(originX, 20, originZ), chunkSize * 0.95);

      const gMesh = new THREE.Mesh(instGeo, this.grassMat);
      gMesh.frustumCulled = true;
      bundle.add(gMesh);
    }

    if (flowerCount > 0) {
      const fInstGeo = new THREE.InstancedBufferGeometry();
      fInstGeo.index = this.flowerGeo.index;
      fInstGeo.attributes.position = this.flowerGeo.attributes.position;
      fInstGeo.attributes.aHeightFrac = this.flowerGeo.attributes.aHeightFrac;
      fInstGeo.attributes.aBlossom = this.flowerGeo.attributes.aBlossom;
      fInstGeo.setAttribute('aOffsetScale', new THREE.InstancedBufferAttribute(new Float32Array(flowerOffsets), 4));
      fInstGeo.setAttribute('aRotTint', new THREE.InstancedBufferAttribute(new Float32Array(flowerRotTints), 4));
      fInstGeo.instanceCount = flowerCount;
      fInstGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(originX, 20, originZ), chunkSize * 0.95);

      const fMesh = new THREE.Mesh(fInstGeo, this.flowerMat);
      fMesh.frustumCulled = true;
      bundle.add(fMesh);
    }

    this.foliageGroup.add(bundle);
    this.totalActiveBlades += bundle.userData.bladeCount;
    return bundle;
  }

  disposeBundle(bundle) {
    if (!bundle) return;
    this.totalActiveBlades = Math.max(0, this.totalActiveBlades - (bundle.userData.bladeCount || 0));
    bundle.children.forEach(ch => {
      if (ch.geometry) ch.geometry.dispose();
    });
    this.foliageGroup.remove(bundle);
  }

  cycleDensity() {
    this.densityIdx = (this.densityIdx + 1) % this.densityModes.length;
    return this.densityModes[this.densityIdx].name;
  }

  setWireframe(enabled) {
    this.grassMat.wireframe = enabled;
    this.flowerMat.wireframe = enabled;
  }

  update(elapsed, sky, playerPos) {
    this.uniforms.uTime.value = elapsed;
    this.uniforms.uPlayerPos.value.copy(playerPos);

    const solarElev = sky.sunDir.y;
    const dayFactor = THREE.MathUtils.smoothstep(solarElev, -0.12, 0.32);
    const activeLightDir = solarElev >= -0.05 ? sky.sunDir : sky.sunDir.clone().negate();

    this.uniforms.uLightDir.value.copy(activeLightDir);
    this.uniforms.uLightColor.value.copy(sky.sunLight.color);
    this.uniforms.uDayFactor.value = dayFactor;
    this.uniforms.uAmbientCol.value.copy(sky.hemiLight.color);
    this.uniforms.uFogColor.value.copy(sky.fog.color);
    this.uniforms.uFogDensity.value = sky.fog.density;
  }
}

// -------------------------------------------------------------------------
// 3C. CHUNK 005: PROCEDURAL MULTI-BIOME 3D FORESTS, WIND SWAY & COLLISION
// -------------------------------------------------------------------------
class ProceduralForestSystem {
  constructor(scene) {
    this.scene = scene;
    this.forestGroup = new THREE.Group();
    this.scene.add(this.forestGroup);

    this.densityModes = [
      { name: 'Full',   mult: 1.00 },
      { name: 'Dense',  mult: 1.45 },
      { name: 'Light',  mult: 0.45 },
      { name: 'Off',    mult: 0.00 }
    ];
    this.densityIdx = 0;
    this.totalActiveTrees = 0;

    this.windUniforms = {
      uTime: { value: 0 }
    };

    // PBR Vertex-Colored Material with Injected GPU Canopy Wind Sway (Supports Real-Time Shadows!)
    this.treeMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.82,
      metalness: 0.02
    });

    this.treeMaterial.onBeforeCompile = shader => {
      shader.uniforms.uTime = this.windUniforms.uTime;
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          /* glsl */`
          #include <common>
          uniform float uTime;
          `
        )
        .replace(
          '#include <begin_vertex>',
          /* glsl */`
          #include <begin_vertex>
          #ifdef USE_INSTANCING
            vec3 instOrigin = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
            float swayWeight = clamp((position.y - 1.1) / 7.5, 0.0, 1.0);
            swayWeight *= swayWeight;
            float phase = instOrigin.x * 0.07 + instOrigin.z * 0.05 - uTime * 1.85;
            float gust = sin(phase) * 0.16 + sin(phase * 2.3 + position.x * 1.6) * 0.05;
            transformed.x += gust * swayWeight * 0.84;
            transformed.z += gust * swayWeight * 0.54;
          #endif
          `
        );
    };

    // Also inject matching wind sway into custom Depth Material so cast shadows sway with canopies!
    this.treeDepthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking
    });
    this.treeDepthMaterial.onBeforeCompile = shader => {
      shader.uniforms.uTime = this.windUniforms.uTime;
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          /* glsl */`
          #include <common>
          uniform float uTime;
          `
        )
        .replace(
          '#include <begin_vertex>',
          /* glsl */`
          #include <begin_vertex>
          #ifdef USE_INSTANCING
            vec3 instOrigin = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
            float swayWeight = clamp((position.y - 1.1) / 7.5, 0.0, 1.0);
            swayWeight *= swayWeight;
            float phase = instOrigin.x * 0.07 + instOrigin.z * 0.05 - uTime * 1.85;
            float gust = sin(phase) * 0.16 + sin(phase * 2.3 + position.x * 1.6) * 0.05;
            transformed.x += gust * swayWeight * 0.84;
            transformed.z += gust * swayWeight * 0.54;
          #endif
          `
        );
    };

    this.archetypes = {
      pine:   this.buildPineArchetype(),
      oak:    this.buildOakArchetype(),
      palm:   this.buildPalmArchetype(),
      cactus: this.buildCactusArchetype()
    };

    this._dummy = new THREE.Object3D();
    this._tint = new THREE.Color();
  }

  // Lightweight Sub-Mesh Merger with Per-Part Gradient Vertex Colors
  mergeParts(parts) {
    const positions = [];
    const normals = [];
    const colors = [];
    const tmpV = new THREE.Vector3();
    const tmpN = new THREE.Vector3();
    const cBot = new THREE.Color();
    const cTop = new THREE.Color();
    const cOut = new THREE.Color();

    for (const part of parts) {
      const nonIdx = part.geo.index ? part.geo.toNonIndexed() : part.geo;
      if (part.matrix) nonIdx.applyMatrix4(part.matrix);

      const posAttr = nonIdx.attributes.position;
      const normAttr = nonIdx.attributes.normal;
      cBot.setHex(part.colorBottom);
      cTop.setHex(part.colorTop !== undefined ? part.colorTop : part.colorBottom);

      let minY = Infinity, maxY = -Infinity;
      for (let i = 0; i < posAttr.count; i++) {
        const py = posAttr.getY(i);
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
      const spanY = Math.max(0.001, maxY - minY);

      for (let i = 0; i < posAttr.count; i++) {
        tmpV.fromBufferAttribute(posAttr, i);
        tmpN.fromBufferAttribute(normAttr, i).normalize();
        const t = (tmpV.y - minY) / spanY;
        cOut.copy(cBot).lerp(cTop, t);

        positions.push(tmpV.x, tmpV.y, tmpV.z);
        normals.push(tmpN.x, tmpN.y, tmpN.z);
        colors.push(cOut.r, cOut.g, cOut.b);
      }
      if (nonIdx !== part.geo) nonIdx.dispose();
      part.geo.dispose();
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    merged.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    merged.computeBoundingSphere();
    return merged;
  }

  // 1. Towering Alpine Conifer Pine (Tiered Cones + Flared Cedar Trunk)
  buildPineArchetype() {
    const parts = [];
    const m = new THREE.Matrix4();

    // Trunk + Root Flare
    parts.push({
      geo: new THREE.CylinderGeometry(0.16, 0.34, 3.2, 8),
      matrix: m.clone().makeTranslation(0, 1.55, 0),
      colorBottom: 0x3b2618,
      colorTop: 0x593a25
    });

    // 4 Overlapping Conifer Needle Tiers
    const tiers = [
      { r: 1.95, h: 2.55, y: 3.15, bot: 0x163322, top: 0x285436 },
      { r: 1.62, h: 2.35, y: 4.55, bot: 0x1a3b27, top: 0x2f613e },
      { r: 1.24, h: 2.10, y: 5.85, bot: 0x1e442d, top: 0x387048 },
      { r: 0.82, h: 1.85, y: 7.05, bot: 0x234d33, top: 0x458556 }
    ];
    tiers.forEach((t, idx) => {
      const rotM = new THREE.Matrix4().makeRotationY(idx * 0.42);
      const transM = new THREE.Matrix4().makeTranslation(0, t.y, 0).multiply(rotM);
      parts.push({
        geo: new THREE.ConeGeometry(t.r, t.h, 9),
        matrix: transM,
        colorBottom: t.bot,
        colorTop: t.top
      });
    });
    return this.mergeParts(parts);
  }

  // 2. Ancient Broadleaf Meadow Oak (Sculpted Boughs + Clustered Sunlit Crown)
  buildOakArchetype() {
    const parts = [];

    // Sturdy Oak Trunk
    parts.push({
      geo: new THREE.CylinderGeometry(0.24, 0.44, 2.85, 8),
      matrix: new THREE.Matrix4().makeTranslation(0, 1.38, 0),
      colorBottom: 0x453020,
      colorTop: 0x61442e
    });

    // 3 Diverging Primary Branches
    for (let i = 0; i < 3; i++) {
      const ang = (i / 3) * Math.PI * 2 + 0.35;
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.48, ang, 0, 'YXZ'));
      const bm = new THREE.Matrix4().compose(
        new THREE.Vector3(Math.sin(ang) * 0.42, 2.85, Math.cos(ang) * 0.42),
        q,
        new THREE.Vector3(1, 1, 1)
      );
      parts.push({
        geo: new THREE.CylinderGeometry(0.11, 0.20, 1.55, 6),
        matrix: bm,
        colorBottom: 0x523926,
        colorTop: 0x634630
      });
    }

    // 5 Sculpted Broadleaf Foliage Clusters
    const crownLobes = [
      { pos: [ 0.00, 4.55,  0.00], s: [2.15, 1.65, 2.15], bot: 0x264d23, top: 0x548c3a },
      { pos: [ 1.05, 3.85,  0.55], s: [1.45, 1.25, 1.45], bot: 0x244721, top: 0x4d8235 },
      { pos: [-1.02, 3.92,  0.48], s: [1.50, 1.28, 1.42], bot: 0x244721, top: 0x528838 },
      { pos: [ 0.15, 3.88, -1.05], s: [1.48, 1.22, 1.45], bot: 0x21421e, top: 0x497d32 },
      { pos: [-0.25, 5.25,  0.18], s: [1.35, 1.15, 1.35], bot: 0x2f5c2a, top: 0x67a144 }
    ];
    crownLobes.forEach(l => {
      const lm = new THREE.Matrix4().compose(
        new THREE.Vector3(...l.pos),
        new THREE.Quaternion(),
        new THREE.Vector3(...l.s)
      );
      parts.push({
        geo: new THREE.IcosahedronGeometry(1.0, 1),
        matrix: lm,
        colorBottom: l.bot,
        colorTop: l.top
      });
    });

    return this.mergeParts(parts);
  }

  // 3. Coastal & Sunscorch Oasis Date Palm (Curved Ringed Trunk + Arching Fronds)
  buildPalmArchetype() {
    const parts = [];

    // 5 Stacked Gentlycurving Trunk Segments
    const segs = 5;
    let curX = 0, curY = 0;
    for (let i = 0; i < segs; i++) {
      const t = i / segs;
      const tilt = 0.08 + t * 0.14;
      const h = 1.18;
      const nextX = curX + Math.sin(tilt) * h;
      const nextY = curY + Math.cos(tilt) * h;
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -tilt));
      const tm = new THREE.Matrix4().compose(
        new THREE.Vector3((curX + nextX) * 0.5, (curY + nextY) * 0.5, 0),
        q,
        new THREE.Vector3(1, 1, 1)
      );
      const rBot = 0.27 * (1.0 - t * 0.34);
      const rTop = 0.27 * (1.0 - (t + 0.2) * 0.34);
      parts.push({
        geo: new THREE.CylinderGeometry(rTop, rBot, h + 0.06, 7),
        matrix: tm,
        colorBottom: 0x6b5039,
        colorTop: 0x87674b
      });
      curX = nextX;
      curY = nextY;
    }

    // 7 Arching Tropical Palm Fronds radiating from Crown
    for (let i = 0; i < 7; i++) {
      const azim = (i / 7) * Math.PI * 2;
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.52, azim, 0, 'YXZ'));
      const fm = new THREE.Matrix4().compose(
        new THREE.Vector3(curX + Math.sin(azim) * 1.05, curY + 0.05, Math.cos(azim) * 1.05),
        q,
        new THREE.Vector3(0.42, 0.08, 1.35)
      );
      parts.push({
        geo: new THREE.SphereGeometry(1.0, 7, 5),
        matrix: fm,
        colorBottom: 0x2f6329,
        colorTop: 0x689e3c
      });
    }

    return this.mergeParts(parts);
  }

  // 4. Sunscorch Saguaro Ribbed Cactus (Desert Dunes Archetype)
  buildCactusArchetype() {
    const parts = [];
    // Main Column + Dome Cap
    parts.push({
      geo: new THREE.CapsuleGeometry(0.26, 2.8, 5, 9),
      matrix: new THREE.Matrix4().makeTranslation(0, 1.55, 0),
      colorBottom: 0x2d5e34,
      colorTop: 0x4b8744
    });
    // Left Arm
    parts.push({
      geo: new THREE.CapsuleGeometry(0.18, 0.95, 4, 8),
      matrix: new THREE.Matrix4().makeTranslation(-0.56, 2.15, 0),
      colorBottom: 0x316638,
      colorTop: 0x4f8c47
    });
    parts.push({
      geo: new THREE.CylinderGeometry(0.17, 0.18, 0.55, 8),
      matrix: new THREE.Matrix4().compose(
        new THREE.Vector3(-0.32, 1.68, 0),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI * 0.5)),
        new THREE.Vector3(1, 1, 1)
      ),
      colorBottom: 0x2f6136,
      colorTop: 0x3a7340
    });
    // Right Higher Arm
    parts.push({
      geo: new THREE.CapsuleGeometry(0.17, 0.85, 4, 8),
      matrix: new THREE.Matrix4().makeTranslation(0.54, 2.52, 0),
      colorBottom: 0x316638,
      colorTop: 0x529149
    });
    parts.push({
      geo: new THREE.CylinderGeometry(0.16, 0.17, 0.52, 8),
      matrix: new THREE.Matrix4().compose(
        new THREE.Vector3(0.30, 2.10, 0),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI * 0.5)),
        new THREE.Vector3(1, 1, 1)
      ),
      colorBottom: 0x2f6136,
      colorTop: 0x3a7340
    });

    return this.mergeParts(parts);
  }

  hash2(x, z, salt = 0) {
    let n = Math.imul(Math.floor(x * 19 + salt * 37), 374761393) + Math.imul(Math.floor(z * 23 - salt * 41), 668265263);
    n = (n ^ (n >>> 13)) >>> 0;
    n = Math.imul(n, 1274126177) >>> 0;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }

  // Deterministic Chunk Forest Builder (Streams across LOD 0, LOD 1 & LOD 2!)
  buildChunkForest(cx, cz, chunkSize, lod, terrain) {
    const mode = this.densityModes[this.densityIdx];
    if (mode.mult <= 0.001 || lod > 2) return null;

    // Jittered 9.6m Forest Candidate Cells (10x10 max candidates per 96m chunk)
    const gridRes = lod === 2 ? 7 : 10;
    const cellSpan = chunkSize / gridRes;
    const originX = cx * chunkSize;
    const originZ = cz * chunkSize;
    const half = chunkSize * 0.5;
    const normTmp = new THREE.Vector3();

    const buckets = { pine: [], oak: [], palm: [], cactus: [] };
    const colliders = [];

    for (let gz = 0; gz < gridRes; gz++) {
      for (let gx = 0; gx < gridRes; gx++) {
        const seedX = cx * 31 + gx;
        const seedZ = cz * 37 + gz;

        const jx = (this.hash2(seedX, seedZ, 1) - 0.5) * cellSpan * 0.82;
        const jz = (this.hash2(seedX, seedZ, 2) - 0.5) * cellSpan * 0.82;
        const wx = originX - half + (gx + 0.5) * cellSpan + jx;
        const wz = originZ - half + (gz + 0.5) * cellSpan + jz;

        // Keep immediate starting clearing around (0, 0) open for vista & player spawn
        if (Math.hypot(wx, wz) < 16.0) continue;

        const wy = terrain.getHeightAt(wx, wz);
        if (wy < terrain.seaLevel + 0.85 || wy > 34.5) continue;

        terrain.getNormalAt(wx, wz, normTmp);
        if (normTmp.y < 0.80) continue; // Trees don't grow on sheer vertical cliff faces

        const { temp, moisture } = terrain.getClimateAt(wx, wz);
        const aridMask = THREE.MathUtils.smoothstep(temp, 0.58, 0.80) * (1.0 - THREE.MathUtils.smoothstep(moisture, 0.22, 0.45));
        const groveNoise = terrain.noise.fbm(wx * 0.016 + 5.4, wz * 0.016 - 3.8, 3) * 0.5 + 0.5;
        const roll = this.hash2(seedX, seedZ, 3);

        let species = null;
        let baseScale = 1.0;
        let trunkRadius = 0.42;

        if (wy < terrain.seaLevel + 3.1 && temp > 0.44) {
          // Sunlit Coastal Palm Groves
          if (roll < 0.22 * mode.mult && groveNoise > 0.42) {
            species = 'palm';
            baseScale = 0.88 + this.hash2(seedX, seedZ, 4) * 0.46;
            trunkRadius = 0.34 * baseScale;
          }
        } else if (aridMask > 0.45) {
          // Amber Sunscorch Dunes: Saguaro Cacti & Rare Oasis Palms
          if (wy < terrain.seaLevel + 4.5 && roll < 0.24 * mode.mult) {
            species = 'palm';
            baseScale = 0.85 + this.hash2(seedX, seedZ, 4) * 0.42;
            trunkRadius = 0.32 * baseScale;
          } else if (roll < 0.16 * mode.mult) {
            species = 'cactus';
            baseScale = 0.80 + this.hash2(seedX, seedZ, 4) * 0.58;
            trunkRadius = 0.32 * baseScale;
          }
        } else if (wy > 18.5 || moisture > 0.53) {
          // Whispering Pine Wilds & Sub-Alpine Timberline Conifers
          const pineDensity = (moisture > 0.55 ? 0.62 : 0.38) * mode.mult * THREE.MathUtils.smoothstep(groveNoise, 0.28, 0.68);
          if (roll < pineDensity) {
            species = this.hash2(seedX, seedZ, 5) < 0.86 ? 'pine' : 'oak';
            baseScale = 0.82 + this.hash2(seedX, seedZ, 4) * 0.65;
            trunkRadius = (species === 'pine' ? 0.36 : 0.45) * baseScale;
          }
        } else {
          // Emerald Lowlands: Broadleaf Oak Coppices & Scattered Pines
          const meadowDensity = 0.30 * mode.mult * THREE.MathUtils.smoothstep(groveNoise, 0.36, 0.75);
          if (roll < meadowDensity) {
            species = this.hash2(seedX, seedZ, 5) < 0.76 ? 'oak' : 'pine';
            baseScale = 0.85 + this.hash2(seedX, seedZ, 4) * 0.58;
            trunkRadius = (species === 'oak' ? 0.46 : 0.36) * baseScale;
          }
        }

        if (!species) continue;

        const yaw = this.hash2(seedX, seedZ, 6) * Math.PI * 2.0;
        const tiltX = (this.hash2(seedX, seedZ, 7) - 0.5) * 0.08;
        const tiltZ = (this.hash2(seedX, seedZ, 8) - 0.5) * 0.08;
        const shadeJitter = 0.86 + this.hash2(seedX, seedZ, 9) * 0.28;

        buckets[species].push({ wx, wy: wy - 0.12, wz, scale: baseScale, yaw, tiltX, tiltZ, shade: shadeJitter });
        if (lod <= 1) {
          colliders.push({ x: wx, y: wy, z: wz, r: trunkRadius });
        }
      }
    }

    const totalInChunk = buckets.pine.length + buckets.oak.length + buckets.palm.length + buckets.cactus.length;
    if (totalInChunk === 0) return null;

    const bundle = new THREE.Group();
    bundle.userData.treeCount = totalInChunk;
    bundle.userData.colliders = colliders;

    const castRealShadows = lod <= 1;

    for (const [type, list] of Object.entries(buckets)) {
      if (list.length === 0) continue;
      const inst = new THREE.InstancedMesh(this.archetypes[type], this.treeMaterial, list.length);
      inst.customDepthMaterial = this.treeDepthMaterial;
      inst.castShadow = castRealShadows;
      inst.receiveShadow = true;

      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        this._dummy.position.set(item.wx, item.wy, item.wz);
        this._dummy.rotation.set(item.tiltX, item.yaw, item.tiltZ);
        this._dummy.scale.set(item.scale, item.scale * (0.94 + (i % 3) * 0.05), item.scale);
        this._dummy.updateMatrix();
        inst.setMatrixAt(i, this._dummy.matrix);

        this._tint.setRGB(item.shade, item.shade, item.shade);
        inst.setColorAt(i, this._tint);
      }

      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      inst.computeBoundingSphere();
      bundle.add(inst);
    }

    this.forestGroup.add(bundle);
    this.totalActiveTrees += totalInChunk;
    return bundle;
  }

  disposeBundle(bundle) {
    if (!bundle) return;
    this.totalActiveTrees = Math.max(0, this.totalActiveTrees - (bundle.userData.treeCount || 0));
    bundle.children.forEach(inst => {
      if (inst.dispose) inst.dispose();
    });
    this.forestGroup.remove(bundle);
  }

  cycleDensity() {
    this.densityIdx = (this.densityIdx + 1) % this.densityModes.length;
    return this.densityModes[this.densityIdx].name;
  }

  setWireframe(enabled) {
    this.treeMaterial.wireframe = enabled;
  }

  update(elapsed) {
    this.windUniforms.uTime.value = elapsed;
  }
}

// -------------------------------------------------------------------------
// 3D. CHUNK 006: PROCEDURAL BOULDERS, BASALT CLIFFS, MESAS & CRYSTAL VEINS
// -------------------------------------------------------------------------
class ProceduralGeologySystem {
  constructor(scene) {
    this.scene = scene;
    this.rockGroup = new THREE.Group();
    this.scene.add(this.rockGroup);

    this.densityModes = [
      { name: 'Full',   mult: 1.00 },
      { name: 'Rich',   mult: 1.50 },
      { name: 'Sparse', mult: 0.45 },
      { name: 'Off',    mult: 0.00 }
    ];
    this.densityIdx = 0;
    this.totalActiveRocks = 0;
    this.totalActiveCrystals = 0;

    // Crisp Angular Chiseled Rock PBR Material
    this.rockMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.06,
      flatShading: true
    });

    // Luminous Aetherium Crystal Vein Material (Pulses brighter at Dusk/Night!)
    this.crystalMaterial = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      color: 0x7ef9ff,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.75,
      roughness: 0.14,
      metalness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08
    });

    this.archetypes = {
      boulder:     this.buildMossyBoulderArchetype(),
      basalt:      this.buildBasaltColumnsArchetype(),
      sandstone:   this.buildSandstoneSlabArchetype(),
      crystalBase: this.buildCrystalHostRockArchetype(),
      crystalGem:  this.buildCrystalPrismsArchetype()
    };

    this._dummy = new THREE.Object3D();
    this._tint = new THREE.Color();
  }

  // Deterministic Vertex Perturbation + Per-Vertex Gradient Merger for Angular Rock Facets
  mergeRockParts(parts) {
    const positions = [];
    const normals = [];
    const colors = [];
    const tmpV = new THREE.Vector3();
    const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
    const cb = new THREE.Vector3(), ab = new THREE.Vector3();
    const cBot = new THREE.Color(), cTop = new THREE.Color(), cCap = new THREE.Color(), cOut = new THREE.Color();

    for (const part of parts) {
      const g = part.geo.index ? part.geo.toNonIndexed() : part.geo;
      const posAttr = g.attributes.position;

      if (part.cragAmp) {
        for (let i = 0; i < posAttr.count; i++) {
          tmpV.fromBufferAttribute(posAttr, i);
          const nHash = Math.sin(tmpV.x * 5.7 + (part.seed || 1.0)) * Math.cos(tmpV.y * 6.3 - tmpV.z * 5.1);
          const disp = 1.0 + nHash * part.cragAmp;
          tmpV.multiplyScalar(disp);
          // Flatten underside slightly so boulders sit solidly in soil
          if (tmpV.y < -0.35) tmpV.y *= 0.62;
          posAttr.setXYZ(i, tmpV.x, tmpV.y, tmpV.z);
        }
      }

      if (part.matrix) g.applyMatrix4(part.matrix);

      let minY = Infinity, maxY = -Infinity;
      for (let i = 0; i < posAttr.count; i++) {
        const py = posAttr.getY(i);
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
      const spanY = Math.max(0.001, maxY - minY);

      cBot.setHex(part.colorBottom);
      cTop.setHex(part.colorTop !== undefined ? part.colorTop : part.colorBottom);
      const hasCap = part.capColor !== undefined;
      if (hasCap) cCap.setHex(part.capColor);

      // Compute crisp flat-shaded facet normals per triangle
      for (let i = 0; i < posAttr.count; i += 3) {
        vA.fromBufferAttribute(posAttr, i);
        vB.fromBufferAttribute(posAttr, i + 1);
        vC.fromBufferAttribute(posAttr, i + 2);
        cb.subVectors(vC, vB);
        ab.subVectors(vA, vB);
        cb.cross(ab).normalize();

        const triVerts = [vA, vB, vC];
        for (let k = 0; k < 3; k++) {
          const v = triVerts[k];
          const t = (v.y - minY) / spanY;
          cOut.copy(cBot).lerp(cTop, t);
          if (hasCap && cb.y > 0.58 && t > 0.58) {
            cOut.lerp(cCap, THREE.MathUtils.smoothstep(cb.y, 0.58, 0.88) * 0.72);
          }
          positions.push(v.x, v.y, v.z);
          normals.push(cb.x, cb.y, cb.z);
          colors.push(cOut.r, cOut.g, cOut.b);
        }
      }

      if (g !== part.geo) g.dispose();
      part.geo.dispose();
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    merged.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    merged.computeBoundingSphere();
    return merged;
  }

  // 1. Weathered Granite & Moss-Capped Meadow / Coastal Boulder Cluster
  buildMossyBoulderArchetype() {
    const parts = [
      {
        geo: new THREE.DodecahedronGeometry(1.15, 1),
        matrix: new THREE.Matrix4().compose(
          new THREE.Vector3(0, 0.62, 0),
          new THREE.Quaternion(),
          new THREE.Vector3(1.22, 0.84, 1.06)
        ),
        cragAmp: 0.16,
        seed: 2.1,
        colorBottom: 0x45494f,
        colorTop: 0x7c8288,
        capColor: 0x567844
      },
      {
        geo: new THREE.DodecahedronGeometry(0.68, 0),
        matrix: new THREE.Matrix4().compose(
          new THREE.Vector3(0.88, 0.36, 0.42),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, 0.8, -0.15)),
          new THREE.Vector3(1.1, 0.78, 0.95)
        ),
        cragAmp: 0.14,
        seed: 5.4,
        colorBottom: 0x3e4248,
        colorTop: 0x70767c,
        capColor: 0x4f703f
      }
    ];
    return this.mergeRockParts(parts);
  }

  // 2. Jagged Hexagonal Columnar Basalt Cliff Spire Cluster
  buildBasaltColumnsArchetype() {
    const cols = [
      { x:  0.00, z:  0.00, r: 0.62, h: 3.35, tiltX:  0.05, tiltZ: -0.04 },
      { x:  0.68, z:  0.34, r: 0.50, h: 2.35, tiltX:  0.09, tiltZ:  0.06 },
      { x: -0.62, z:  0.28, r: 0.48, h: 2.65, tiltX: -0.07, tiltZ:  0.08 },
      { x:  0.14, z: -0.66, r: 0.52, h: 1.95, tiltX: -0.08, tiltZ: -0.06 },
      { x: -0.36, z: -0.52, r: 0.40, h: 1.45, tiltX:  0.04, tiltZ: -0.09 }
    ];
    const parts = cols.map((c, idx) => {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(c.tiltX, idx * 0.52, c.tiltZ));
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(c.x, c.h * 0.46, c.z),
        q,
        new THREE.Vector3(1, 1, 1)
      );
      return {
        geo: new THREE.CylinderGeometry(c.r * 0.82, c.r, c.h, 6),
        matrix: m,
        cragAmp: 0.06,
        seed: idx * 3.1,
        colorBottom: 0x23252b,
        colorTop: 0x4c515c,
        capColor: 0x676d78
      };
    });
    return this.mergeRockParts(parts);
  }

  // 3. Stratified Sunscorch Red Sandstone Outcrop
  buildSandstoneSlabArchetype() {
    const layers = [
      { y: 0.34, sx: 1.55, sy: 0.48, sz: 1.18, colB: 0x8f492d, colT: 0xb86640 },
      { y: 0.82, sx: 1.24, sy: 0.44, sz: 0.96, colB: 0x9c5234, colT: 0xcf7b4e },
      { y: 1.24, sx: 0.86, sy: 0.38, sz: 0.74, colB: 0xa85b3b, colT: 0xdf9462 }
    ];
    const parts = layers.map((l, idx) => ({
      geo: new THREE.CylinderGeometry(0.88, 1.0, 1.0, 7),
      matrix: new THREE.Matrix4().compose(
        new THREE.Vector3((idx - 1) * 0.12, l.y, 0),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0.03, idx * 0.45, -0.04)),
        new THREE.Vector3(l.sx, l.sy, l.sz)
      ),
      cragAmp: 0.10,
      seed: 8.2 + idx,
      colorBottom: l.colB,
      colorTop: l.colT,
      capColor: 0xe6b07e
    }));
    return this.mergeRockParts(parts);
  }

  // 4A. Dark Obsidian Cradle Base for Aetherium Crystal Veins
  buildCrystalHostRockArchetype() {
    return this.mergeRockParts([
      {
        geo: new THREE.DodecahedronGeometry(0.76, 0),
        matrix: new THREE.Matrix4().compose(
          new THREE.Vector3(0, 0.28, 0),
          new THREE.Quaternion(),
          new THREE.Vector3(1.15, 0.62, 1.10)
        ),
        cragAmp: 0.12,
        seed: 12.4,
        colorBottom: 0x1b1e28,
        colorTop: 0x33394a
      }
    ]);
  }

  // 4B. 5 Angled Hexagonal Aetherium Crystal Prisms
  buildCrystalPrismsArchetype() {
    const shards = [
      { pos: [ 0.00, 0.95,  0.00], r: 0.21, h: 1.65, rot: [ 0.06, 0.2, -0.05] },
      { pos: [ 0.32, 0.72,  0.18], r: 0.16, h: 1.18, rot: [ 0.28, 0.9, -0.34] },
      { pos: [-0.30, 0.76,  0.14], r: 0.17, h: 1.25, rot: [ 0.22, 2.1,  0.36] },
      { pos: [ 0.12, 0.66, -0.32], r: 0.14, h: 1.02, rot: [-0.35, 3.4, -0.18] },
      { pos: [-0.18, 0.60, -0.26], r: 0.13, h: 0.88, rot: [-0.28, 4.7,  0.26] }
    ];
    const parts = [];
    shards.forEach(s => {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...s.rot));
      // Hexagonal prism shaft + sharp pyramidal apex
      const shaftM = new THREE.Matrix4().compose(
        new THREE.Vector3(...s.pos),
        q,
        new THREE.Vector3(1, 1, 1)
      );
      const tipOffset = new THREE.Vector3(0, s.h * 0.5 + 0.18, 0).applyQuaternion(q).add(new THREE.Vector3(...s.pos));
      const tipM = new THREE.Matrix4().compose(tipOffset, q, new THREE.Vector3(1, 1, 1));

      parts.push({
        geo: new THREE.CylinderGeometry(s.r * 0.86, s.r, s.h, 6),
        matrix: shaftM,
        colorBottom: 0x0f766e,
        colorTop: 0x67e8f9
      });
      parts.push({
        geo: new THREE.ConeGeometry(s.r * 0.86, 0.38, 6),
        matrix: tipM,
        colorBottom: 0x67e8f9,
        colorTop: 0xe0f2fe
      });
    });
    return this.mergeRockParts(parts);
  }

  hash2(x, z, salt = 0) {
    let n = Math.imul(Math.floor(x * 29 + salt * 53), 374761393) + Math.imul(Math.floor(z * 43 - salt * 61), 668265263);
    n = (n ^ (n >>> 13)) >>> 0;
    n = Math.imul(n, 1274126177) >>> 0;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }

  buildChunkGeology(cx, cz, chunkSize, lod, terrain) {
    const mode = this.densityModes[this.densityIdx];
    if (mode.mult <= 0.001 || lod > 2) return null;

    const gridRes = lod === 2 ? 6 : 9;
    const cellSpan = chunkSize / gridRes;
    const originX = cx * chunkSize;
    const originZ = cz * chunkSize;
    const half = chunkSize * 0.5;
    const normTmp = new THREE.Vector3();

    const buckets = { boulder: [], basalt: [], sandstone: [], crystal: [] };
    const colliders = [];

    // Place 1 guaranteed Aetherium Crystal Vein near initialvista ridge in chunk (0, 0) so players spot one right away!
    if (cx === 0 && cz === 0 && lod <= 1) {
      const cx0 = 13.5, cz0 = -15.5;
      const cy0 = terrain.getHeightAt(cx0, cz0);
      if (cy0 > terrain.seaLevel + 1.0) {
        buckets.crystal.push({ wx: cx0, wy: cy0 - 0.08, wz: cz0, scale: 1.15, yaw: 0.7, tiltX: 0.03, tiltZ: -0.02, shade: 1.0 });
        colliders.push({ x: cx0, y: cy0, z: cz0, r: 0.88, h: 1.55, walkable: false });
      }
    }

    for (let gz = 0; gz < gridRes; gz++) {
      for (let gx = 0; gx < gridRes; gx++) {
        const seedX = cx * 47 + gx;
        const seedZ = cz * 59 + gz;

        const jx = (this.hash2(seedX, seedZ, 1) - 0.5) * cellSpan * 0.84;
        const jz = (this.hash2(seedX, seedZ, 2) - 0.5) * cellSpan * 0.84;
        const wx = originX - half + (gx + 0.5) * cellSpan + jx;
        const wz = originZ - half + (gz + 0.5) * cellSpan + jz;

        if (Math.hypot(wx, wz) < 11.5) continue;

        const wy = terrain.getHeightAt(wx, wz);
        if (wy < terrain.seaLevel - 0.45) continue;

        terrain.getNormalAt(wx, wz, normTmp);
        const slope = 1.0 - THREE.MathUtils.clamp(normTmp.y, 0, 1);
        const { temp, moisture } = terrain.getClimateAt(wx, wz);
        const aridMask = THREE.MathUtils.smoothstep(temp, 0.58, 0.80) * (1.0 - THREE.MathUtils.smoothstep(moisture, 0.22, 0.45));
        const roll = this.hash2(seedX, seedZ, 3);

        let kind = null;
        let scale = 1.0;
        let radius = 1.0;
        let topH = 1.2;
        let walkable = true;

        // 1. Rare Luminous Aetherium Crystal Veins along Highlands, Cliff Bases & Rocky Coasts
        if (lod <= 1 && roll < 0.024 * mode.mult && (wy > 16.0 || (wy > 0.6 && slope > 0.14))) {
          kind = 'crystal';
          scale = 0.85 + this.hash2(seedX, seedZ, 4) * 0.52;
          radius = 0.78 * scale;
          topH = 1.45 * scale;
          walkable = false;
        }
        // 2. Steep Cliff Faces & Shattered Basalt Highlands -> Hexagonal Basalt Spires
        else if (slope > 0.19 || wy > 23.5) {
          const cliffProb = (slope > 0.22 ? 0.34 : 0.20) * mode.mult;
          if (roll < cliffProb) {
            kind = aridMask > 0.55 ? 'sandstone' : 'basalt';
            scale = 0.82 + this.hash2(seedX, seedZ, 4) * 0.88;
            radius = (kind === 'basalt' ? 0.95 : 1.25) * scale;
            topH = (kind === 'basalt' ? 2.65 : 1.35) * scale;
          }
        }
        // 3. Sunscorch Desert Dunes -> Stratified Red Sandstone Slabs
        else if (aridMask > 0.48) {
          if (roll < 0.15 * mode.mult) {
            kind = 'sandstone';
            scale = 0.85 + this.hash2(seedX, seedZ, 4) * 0.95;
            radius = 1.28 * scale;
            topH = 1.35 * scale;
          }
        }
        // 4. Coastal Tidal Boulders & Scattered Meadow Erratics
        else {
          const isShore = wy >= terrain.seaLevel - 0.35 && wy <= terrain.seaLevel + 2.4;
          const prob = (isShore ? 0.24 : 0.085) * mode.mult;
          if (roll < prob) {
            kind = 'boulder';
            scale = (isShore ? 0.75 : 0.68) + this.hash2(seedX, seedZ, 4) * 0.85;
            radius = 1.15 * scale;
            topH = 1.05 * scale;
          }
        }

        if (!kind) continue;

        const yaw = this.hash2(seedX, seedZ, 5) * Math.PI * 2.0;
        const tiltX = (this.hash2(seedX, seedZ, 6) - 0.5) * 0.14;
        const tiltZ = (this.hash2(seedX, seedZ, 7) - 0.5) * 0.14;
        const shade = 0.84 + this.hash2(seedX, seedZ, 8) * 0.30;

        buckets[kind].push({ wx, wy: wy - 0.16, wz, scale, yaw, tiltX, tiltZ, shade });
        if (lod <= 1) {
          colliders.push({ x: wx, y: wy, z: wz, r: radius, h: topH, walkable });
        }
      }
    }

    const rockCount = buckets.boulder.length + buckets.basalt.length + buckets.sandstone.length;
    const crystalCount = buckets.crystal.length;
    if (rockCount === 0 && crystalCount === 0) return null;

    const bundle = new THREE.Group();
    bundle.userData.rockCount = rockCount;
    bundle.userData.crystalCount = crystalCount;
    bundle.userData.colliders = colliders;

    const castShadows = lod <= 1;

    ['boulder', 'basalt', 'sandstone'].forEach(type => {
      const list = buckets[type];
      if (list.length === 0) return;
      const inst = new THREE.InstancedMesh(this.archetypes[type], this.rockMaterial, list.length);
      inst.castShadow = castShadows;
      inst.receiveShadow = true;

      for (let i = 0; i < list.length; i++) {
        const it = list[i];
        this._dummy.position.set(it.wx, it.wy, it.wz);
        this._dummy.rotation.set(it.tiltX, it.yaw, it.tiltZ);
        this._dummy.scale.set(it.scale, it.scale * (0.86 + (i % 3) * 0.12), it.scale);
        this._dummy.updateMatrix();
        inst.setMatrixAt(i, this._dummy.matrix);
        this._tint.setRGB(it.shade, it.shade, it.shade);
        inst.setColorAt(i, this._tint);
      }
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      inst.computeBoundingSphere();
      bundle.add(inst);
    });

    if (crystalCount > 0) {
      const list = buckets.crystal;
      const baseInst = new THREE.InstancedMesh(this.archetypes.crystalBase, this.rockMaterial, crystalCount);
      const gemInst = new THREE.InstancedMesh(this.archetypes.crystalGem, this.crystalMaterial, crystalCount);
      baseInst.castShadow = castShadows;
      baseInst.receiveShadow = true;
      gemInst.castShadow = castShadows;

      for (let i = 0; i < crystalCount; i++) {
        const it = list[i];
        this._dummy.position.set(it.wx, it.wy, it.wz);
        this._dummy.rotation.set(it.tiltX, it.yaw, it.tiltZ);
        this._dummy.scale.setScalar(it.scale);
        this._dummy.updateMatrix();
        baseInst.setMatrixAt(i, this._dummy.matrix);
        gemInst.setMatrixAt(i, this._dummy.matrix);
      }
      baseInst.instanceMatrix.needsUpdate = true;
      gemInst.instanceMatrix.needsUpdate = true;
      baseInst.computeBoundingSphere();
      gemInst.computeBoundingSphere();
      bundle.add(baseInst, gemInst);
    }

    this.rockGroup.add(bundle);
    this.totalActiveRocks += rockCount;
    this.totalActiveCrystals += crystalCount;
    return bundle;
  }

  disposeBundle(bundle) {
    if (!bundle) return;
    this.totalActiveRocks = Math.max(0, this.totalActiveRocks - (bundle.userData.rockCount || 0));
    this.totalActiveCrystals = Math.max(0, this.totalActiveCrystals - (bundle.userData.crystalCount || 0));
    bundle.children.forEach(inst => {
      if (inst.dispose) inst.dispose();
    });
    this.rockGroup.remove(bundle);
  }

  cycleDensity() {
    this.densityIdx = (this.densityIdx + 1) % this.densityModes.length;
    return this.densityModes[this.densityIdx].name;
  }

  setWireframe(enabled) {
    this.rockMaterial.wireframe = enabled;
    this.crystalMaterial.wireframe = enabled;
  }

  update(elapsed, sky) {
    // Gentle Aetherium resonance pulse — glows extra vividly under Dusk & Starlight!
    const nightBoost = 1.0 - THREE.MathUtils.smoothstep(sky.sunDir.y, -0.10, 0.25);
    const pulse = 0.65 + 0.35 * Math.sin(elapsed * 2.6);
    this.crystalMaterial.emissiveIntensity = (0.42 + nightBoost * 0.95) * pulse;
  }
}

// -------------------------------------------------------------------------
// 3E. CHUNK 009: ANCIENT MEGALITHIC LANDMARKS, RUIN ARCHES & WAYSTONES
// -------------------------------------------------------------------------
class AncientLandmarksSystem {
  constructor(scene) {
    this.scene = scene;
    this.landmarkGroup = new THREE.Group();
    this.fxGroup = new THREE.Group();
    this.scene.add(this.landmarkGroup);
    this.scene.add(this.fxGroup);

    this.attunedKeys = new Set();     // Persists attuned waystone IDs across chunk unload/reload!
    this.activeWaystones = new Map(); // key -> { key, name, x, y, z, coreMesh, ringMesh, runeMeshes, beaconMesh, attuned }
    this.shockwaves = [];
    this.nearestPromptWaystone = null;
    this.bannerTimer = 0;
    this.audioCtx = null;

    this.stoneMat = new THREE.MeshStandardMaterial({
      color: 0x7a7d82,
      roughness: 0.86,
      metalness: 0.05,
      flatShading: true
    });

    this.obsidianMat = new THREE.MeshStandardMaterial({
      color: 0x222631,
      roughness: 0.38,
      metalness: 0.28,
      flatShading: true
    });

    this.mossyStoneMat = new THREE.MeshStandardMaterial({
      color: 0x5d6e58,
      roughness: 0.90,
      metalness: 0.03,
      flatShading: true
    });

    this.dormantRuneMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 1.35,
      roughness: 0.22
    });

    this.attunedRuneMat = new THREE.MeshStandardMaterial({
      color: 0x67e8f9,
      emissive: 0x06b6d4,
      emissiveIntensity: 2.25,
      roughness: 0.15
    });

    this.dormantBeaconMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.attunedBeaconMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    // Shared Primitive Geometries for Landmarks
    this.geos = {
      daisOuter:  new THREE.CylinderGeometry(3.8, 4.3, 0.48, 8),
      daisInner:  new THREE.CylinderGeometry(2.4, 2.75, 0.44, 8),
      obelisk:    new THREE.CylinderGeometry(0.32, 0.72, 5.2, 4),
      obeliskTip: new THREE.ConeGeometry(0.32, 0.85, 4),
      guardPost:  new THREE.CylinderGeometry(0.26, 0.34, 2.3, 6),
      runeStrip:  new THREE.BoxGeometry(0.11, 3.8, 0.82),
      coreGem:    new THREE.OctahedronGeometry(0.52, 0),
      orbitRing:  new THREE.TorusGeometry(0.92, 0.045, 8, 28),
      beaconCol:  new THREE.CylinderGeometry(0.28, 0.95, 195.0, 16, 1, true),
      megalith:   new THREE.BoxGeometry(1.15, 5.2, 0.72),
      lintel:     new THREE.BoxGeometry(3.4, 0.78, 0.92),
      altarSlab:  new THREE.BoxGeometry(2.4, 0.68, 1.5),
      archCol:    new THREE.CylinderGeometry(0.42, 0.48, 5.4, 10),
      archBase:   new THREE.BoxGeometry(1.35, 0.65, 1.35),
      archSpan:   new THREE.BoxGeometry(5.6, 0.95, 1.15),
      archCrest:  new THREE.ConeGeometry(0.85, 1.1, 4),
      shockRing:  new THREE.RingGeometry(0.85, 1.25, 36)
    };
    this.geos.shockRing.rotateX(-Math.PI * 0.5);

    this.waystoneNames = [
      'Sanctum of Dawn', 'Whispering Spire', 'Highwatch Obelisk', 'Starfall Beacon',
      'Sunscorch Pillar', 'Tidewater Sanctum', 'Frostcrown Monolith', 'Aetherwatch Altar',
      'eldervale Waystone', 'Shattered Crest Spire', 'Solstice Obelisk', 'Azure Haven Stone'
    ];
  }

  hash2(x, z, salt = 0) {
    let n = Math.imul(x * 73 + salt * 97, 374761393) + Math.imul(z * 131 - salt * 53, 668265263);
    n = (n ^ (n >>> 13)) >>> 0;
    n = Math.imul(n, 1274126177) >>> 0;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }

  getWaystoneTitle(cx, cz) {
    if (cx === 0 && cz === 0) return 'Sanctum of Dawn';
    const idx = Math.floor(this.hash2(cx, cz, 21) * this.waystoneNames.length) % this.waystoneNames.length;
    return this.waystoneNames[idx].replace(/^\w/, c => c.toUpperCase());
  }

  // Synthesized Celestial Harmonic Chord when Attuning an Ancient Waystone!
  playAttuneChord() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.audioCtx && AudioCtx) this.audioCtx = new AudioCtx();
      const ctx = this.audioCtx;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      [261.63, 329.63, 392.00, 523.25, 659.25, 783.99].forEach((freq, idx) => {
        const t = now + idx * 0.075;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.10, t + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0008, t + 1.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 1.5);
      });
    } catch (_) {}
  }

  // Build Interactive Waystone Sanctuary
  createWaystoneMonument(wx, wy, wz, cx, cz, colliders) {
    const key = `${cx},${cz}`;
    const isAttuned = this.attunedKeys.has(key);
    const rMat = isAttuned ? this.attunedRuneMat : this.dormantRuneMat;

    const root = new THREE.Group();
    root.position.set(wx, wy, wz);

    // Stepped Octagonal Stone Dais (Walkable!)
    const dOuter = new THREE.Mesh(this.geos.daisOuter, this.stoneMat);
    dOuter.position.y = 0.20;
    dOuter.castShadow = true;
    dOuter.receiveShadow = true;

    const dInner = new THREE.Mesh(this.geos.daisInner, this.obsidianMat);
    dInner.position.y = 0.56;
    dInner.castShadow = true;
    dInner.receiveShadow = true;
    root.add(dOuter, dInner);

    colliders.push({ x: wx, y: wy, z: wz, r: 3.85, h: 0.44, walkable: true });
    colliders.push({ x: wx, y: wy, z: wz, r: 2.45, h: 0.78, walkable: true });

    // 4 Corner Guardian Pillars
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
      const px = Math.cos(a) * 3.25;
      const pz = Math.sin(a) * 3.25;
      const post = new THREE.Mesh(this.geos.guardPost, this.stoneMat);
      post.position.set(px, 1.25, pz);
      post.scale.y = i === 2 ? 0.65 : 1.0; // One weathered broken pillar!
      post.castShadow = true;
      post.receiveShadow = true;
      root.add(post);
      colliders.push({ x: wx + px, y: wy + 0.3, z: wz + pz, r: 0.42, h: 2.3, walkable: false });
    }

    // Central Obsidian Obelisk + Glowing Inlaid Rune Channels
    const obelisk = new THREE.Mesh(this.geos.obelisk, this.obsidianMat);
    obelisk.position.y = 3.35;
    obelisk.rotation.y = Math.PI * 0.25;
    obelisk.castShadow = true;
    obelisk.receiveShadow = true;

    const tip = new THREE.Mesh(this.geos.obeliskTip, this.obsidianMat);
    tip.position.y = 6.37;
    tip.rotation.y = Math.PI * 0.25;
    tip.castShadow = true;
    root.add(obelisk, tip);
    colliders.push({ x: wx, y: wy + 0.75, z: wz, r: 0.82, h: 5.8, walkable: false });

    const strip1 = new THREE.Mesh(this.geos.runeStrip, rMat);
    strip1.position.y = 3.35;
    const strip2 = new THREE.Mesh(this.geos.runeStrip, rMat);
    strip2.position.y = 3.35;
    strip2.rotation.y = Math.PI * 0.5;
    root.add(strip1, strip2);

    // Levitating Rotating Aetherium Core + Orbiting Halo Ring
    const coreMesh = new THREE.Mesh(this.geos.coreGem, rMat);
    coreMesh.position.y = 7.55;
    const ringMesh = new THREE.Mesh(this.geos.orbitRing, rMat);
    ringMesh.position.y = 7.55;
    root.add(coreMesh, ringMesh);

    // Skyward Light Pillar Beacon (Subtle amber when dormant, radiant tall cyan beam when attuned!)
    const beaconMesh = new THREE.Mesh(
      this.geos.beaconCol,
      isAttuned ? this.attunedBeaconMat : this.dormantBeaconMat
    );
    beaconMesh.position.y = 98.0;
    beaconMesh.scale.set(isAttuned ? 1.0 : 0.45, 1.0, isAttuned ? 1.0 : 0.45);
    root.add(beaconMesh);

    const wsData = {
      key,
      name: this.getWaystoneTitle(cx, cz),
      x: wx,
      y: wy,
      z: wz,
      coreMesh,
      ringMesh,
      runeMeshes: [strip1, strip2, coreMesh, ringMesh],
      beaconMesh,
      attuned: isAttuned
    };
    this.activeWaystones.set(key, wsData);
    root.userData.waystoneKey = key;
    return root;
  }

  // Build Ancient Megalithic Trilithon Stonehenge Ring
  createMonolithRing(wx, wy, wz, seedSalt, colliders) {
    const root = new THREE.Group();
    root.position.set(wx, wy, wz);

    const count = 7;
    const ringRadius = 7.8;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + seedSalt;
      const sx = Math.cos(a) * ringRadius;
      const sz = Math.sin(a) * ringRadius;
      const localGround = 0;

      const pillar = new THREE.Mesh(this.geos.megalith, i % 2 === 0 ? this.stoneMat : this.mossyStoneMat);
      const broken = (i === 3);
      pillar.scale.y = broken ? 0.52 : (0.92 + (i % 3) * 0.08);
      pillar.position.set(sx, localGround + 2.4 * pillar.scale.y - 0.3, sz);
      pillar.rotation.y = -a + Math.PI * 0.5;
      pillar.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.04;
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      root.add(pillar);

      colliders.push({ x: wx + sx, y: wy, z: wz + sz, r: 0.85, h: 4.8 * pillar.scale.y, walkable: broken });

      // Add massive horizontal lintel capstone bridging pairs!
      if (!broken && i % 2 === 0 && i < count - 1) {
        const nextA = ((i + 1) / count) * Math.PI * 2 + seedSalt;
        const mx = (sx + Math.cos(nextA) * ringRadius) * 0.5;
        const mz = (sz + Math.sin(nextA) * ringRadius) * 0.5;
        const lintel = new THREE.Mesh(this.geos.lintel, this.mossyStoneMat);
        lintel.position.set(mx, 4.85, mz);
        lintel.rotation.y = -((a + nextA) * 0.5);
        lintel.scale.x = 1.95;
        lintel.castShadow = true;
        lintel.receiveShadow = true;
        root.add(lintel);
      }
    }

    // Central Walkable Sun-Altar Slab
    const altar = new THREE.Mesh(this.geos.altarSlab, this.mossyStoneMat);
    altar.position.y = 0.30;
    altar.rotation.y = seedSalt;
    altar.castShadow = true;
    altar.receiveShadow = true;
    root.add(altar);
    colliders.push({ x: wx, y: wy, z: wz, r: 1.45, h: 0.64, walkable: true });

    return root;
  }

  // Build Carved Imperial Ruin Archway
  createRuinArchway(wx, wy, wz, yaw, colliders) {
    const root = new THREE.Group();
    root.position.set(wx, wy, wz);
    root.rotation.y = yaw;

    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);

    [-2.15, 2.15].forEach(lx => {
      const ped = new THREE.Mesh(this.geos.archBase, this.stoneMat);
      ped.position.set(lx, 0.25, 0);
      ped.castShadow = true;
      ped.receiveShadow = true;

      const col = new THREE.Mesh(this.geos.archCol, this.stoneMat);
      col.position.set(lx, 3.15, 0);
      col.castShadow = true;
      col.receiveShadow = true;
      root.add(ped, col);

      const worldColX = wx + lx * cosY;
      const worldColZ = wz - lx * sinY;
      colliders.push({ x: worldColX, y: wy, z: worldColZ, r: 0.72, h: 5.8, walkable: false });
    });

    const span = new THREE.Mesh(this.geos.archSpan, this.mossyStoneMat);
    span.position.set(0, 6.15, 0);
    span.castShadow = true;
    span.receiveShadow = true;

    const crest = new THREE.Mesh(this.geos.archCrest, this.stoneMat);
    crest.position.set(0, 7.12, 0);
    crest.rotation.y = Math.PI * 0.25;
    crest.castShadow = true;
    root.add(span, crest);

    // Fallen Ruin Column Drum nearby (Walkable!)
    const fallen = new THREE.Mesh(this.geos.guardPost, this.mossyStoneMat);
    fallen.position.set(1.6, 0.28, 2.2);
    fallen.rotation.set(Math.PI * 0.5, 0.4, 0.2);
    fallen.castShadow = true;
    fallen.receiveShadow = true;
    root.add(fallen);

    return root;
  }

  // Streams Landmarks across LOD 0–3 so Waystone Beacons & Megaliths anchor distant vistas!
  buildChunkLandmarks(cx, cz, chunkSize, lod, terrain) {
    const colliders = [];
    const bundle = new THREE.Group();
    let count = 0;

    // 1. Origin Sanctuary ("Sanctum of Dawn") right ahead of player spawn at (0, -23)!
    if (cx === 0 && cz === 0) {
      const wx = 0.0;
      const wz = -23.5;
      const wy = terrain.getHeightAt(wx, wz);
      const sanctum = this.createWaystoneMonument(wx, wy, wz, 0, 0, colliders);
      bundle.add(sanctum);
      count++;
    } else {
      const originX = cx * chunkSize;
      const originZ = cz * chunkSize;
      const roll = this.hash2(cx, cz, 1);
      const offX = (this.hash2(cx, cz, 2) - 0.5) * chunkSize * 0.52;
      const offZ = (this.hash2(cx, cz, 3) - 0.5) * chunkSize * 0.52;
      const wx = originX + offX;
      const wz = originZ + offZ;
      const wy = terrain.getHeightAt(wx, wz);

      const normTmp = new THREE.Vector3();
      terrain.getNormalAt(wx, wz, normTmp);

      // Only build monumental architecture above sea level on reasonably level plateaus/valleys
      if (wy > terrain.seaLevel + 1.8 && wy < 38.0 && normTmp.y > 0.86) {
        // Regional Waystone Grid: Every 3x3 chunk sector has a candidate Waystone!
        const isWaystoneSector = (Math.abs(cx) % 3 === 0 && Math.abs(cz) % 3 === 0);
        if (isWaystoneSector) {
          const sanctum = this.createWaystoneMonument(wx, wy, wz, cx, cz, colliders);
          bundle.add(sanctum);
          count++;
        } else if (lod <= 2 && roll < 0.12) {
          const ring = this.createMonolithRing(wx, wy, wz, this.hash2(cx, cz, 4) * 6.28, colliders);
          bundle.add(ring);
          count++;
        } else if (lod <= 2 && roll >= 0.12 && roll < 0.27) {
          const arch = this.createRuinArchway(wx, wy, wz, this.hash2(cx, cz, 5) * 6.28, colliders);
          bundle.add(arch);
          count++;
        }
      }
    }

    if (count === 0) return null;
    bundle.userData.colliders = colliders;
    this.landmarkGroup.add(bundle);
    return bundle;
  }

  disposeBundle(bundle) {
    if (!bundle) return;
    bundle.children.forEach(child => {
      if (child.userData && child.userData.waystoneKey) {
        this.activeWaystones.delete(child.userData.waystoneKey);
      }
    });
    this.landmarkGroup.remove(bundle);
  }

  attuneNearbyWaystone() {
    const ws = this.nearestPromptWaystone;
    if (!ws || ws.attuned) return false;

    ws.attuned = true;
    this.attunedKeys.add(ws.key);
    ws.runeMeshes.forEach(m => { m.material = this.attunedRuneMat; });
    ws.beaconMesh.material = this.attunedBeaconMat;
    ws.beaconMesh.scale.set(1.0, 1.0, 1.0);

    this.playAttuneChord();

    // Spawn Expanding 3D Celestial Shockwave Ring!
    const sMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const sMesh = new THREE.Mesh(this.geos.shockRing, sMat);
    sMesh.position.set(ws.x, ws.y + 0.9, ws.z);
    this.fxGroup.add(sMesh);
    this.shockwaves.push({ mesh: sMesh, mat: sMat, age: 0, life: 1.35 });

    // Show Cinematic AAA Discovery Banner
    const banner = document.getElementById('discovery-banner');
    document.getElementById('discovery-title').textContent = ws.name.toUpperCase();
    document.getElementById('discovery-sub').textContent =
      `Waystones Attuned: ${this.attunedKeys.size} • Skyward Fast-Travel Beacon Active`;
    banner.classList.remove('opacity-0', '-translate-y-2');
    banner.classList.add('opacity-100', 'translate-y-0');
    this.bannerTimer = 4.2;

    return true;
  }

  setWireframe(enabled) {
    this.stoneMat.wireframe = enabled;
    this.obsidianMat.wireframe = enabled;
    this.mossyStoneMat.wireframe = enabled;
  }

  resetForNewSeed() {
    this.attunedKeys.clear();
    this.activeWaystones.clear();
    this.nearestPromptWaystone = null;
  }

  getCompassRadarText(playerPos) {
    let best = null;
    let bestDist = Infinity;
    for (const ws of this.activeWaystones.values()) {
      const d = Math.hypot(ws.x - playerPos.x, ws.z - playerPos.z);
      if (d < bestDist) {
        bestDist = d;
        best = ws;
      }
    }
    if (!best) return `✦ ${this.attunedKeys.size} Attuned`;

    const angle = Math.atan2(best.x - playerPos.x, -(best.z - playerPos.z));
    const deg = ((THREE.MathUtils.radToDeg(angle) % 360) + 360) % 360;
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const dirTag = dirs[Math.round(deg / 45) % 8];
    const icon = best.attuned ? '✦' : '◆';
    return `${icon} ${Math.round(bestDist)}m ${dirTag} (${this.attunedKeys.size})`;
  }

  update(dt, elapsed, playerPos) {
    // Animate levitating Waystone cores & check interaction proximity
    let promptCandidate = null;
    let promptDist = 7.2;

    for (const ws of this.activeWaystones.values()) {
      const spinSpeed = ws.attuned ? 2.1 : 0.85;
      ws.coreMesh.rotation.y = elapsed * spinSpeed;
      ws.coreMesh.position.y = 7.55 + Math.sin(elapsed * 2.2 + ws.x) * 0.22;

      ws.ringMesh.rotation.x = Math.PI * 0.35 + Math.sin(elapsed * 1.3) * 0.25;
      ws.ringMesh.rotation.y = -elapsed * (spinSpeed * 0.75);
      ws.ringMesh.position.y = ws.coreMesh.position.y;

      const d = Math.hypot(ws.x - playerPos.x, ws.z - playerPos.z);
      if (!ws.attuned && d < promptDist) {
        promptDist = d;
        promptCandidate = ws;
      }
    }

    this.nearestPromptWaystone = promptCandidate;
    const promptEl = document.getElementById('interact-prompt');
    if (promptCandidate) {
      promptEl.classList.remove('hidden');
      document.getElementById('interact-label').textContent = `Attune ${promptCandidate.name}`;
    } else {
      promptEl.classList.add('hidden');
    }

    // Update Discovery Banner Fade-Out
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) {
        const banner = document.getElementById('discovery-banner');
        banner.classList.remove('opacity-100', 'translate-y-0');
        banner.classList.add('opacity-0', '-translate-y-2');
      }
    }

    // Update Expanding 3D Attunement Shockwave Rings
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.age += dt;
      const u = sw.age / sw.life;
      if (u >= 1.0) {
        this.fxGroup.remove(sw.mesh);
        sw.mat.dispose();
        this.shockwaves.splice(i, 1);
        continue;
      }
      const radius = 1.0 + u * 28.0;
      sw.mesh.scale.setScalar(radius);
      sw.mat.opacity = (1.0 - u) * (1.0 - u) * 0.9;
    }
  }
}

// -------------------------------------------------------------------------
// 3F. CHUNK 002: INFINITE STREAMING MULTI-LOD TERRAIN & 6-BIOME CLIMATE ENGINE
// -------------------------------------------------------------------------
class WorldTerrain {
  constructor(scene, noise, ocean, foliage, forest, geology, clouds, landmarks) {
    this.scene = scene;
    this.noise = noise;
    this.ocean = ocean;
    this.foliage = foliage;
    this.forest = forest;
    this.geology = geology;
    this.clouds = clouds;
    this.landmarks = landmarks;

    // Streaming Grid Architecture: 11x11 active chunks (1,056m x 1,056m live footprint)
    this.chunkSize = 96;
    this.viewRadius = 5;
    this.lodSegments = [48, 24, 12, 6]; // LOD 0 (2m), LOD 1 (4m), LOD 2 (8m), LOD 3 (16m)
    this.skirtDepth = 15.0;             // Hides T-junction seams between differing LOD rings
    this.seaLevel = ocean.seaLevel;

    this.lodDebug = false;
    this.wireframe = false;

    // 4 Per-LOD Materials with Synchronized Sun-Projected Cloud Shadows
    this.lodDebugColors = [0x34d399, 0x38bdf8, 0xfbbf24, 0xa78bfa];
    this.lodMaterials = this.lodSegments.map(() => {
      const mat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        color: 0xffffff,
        roughness: 0.86,
        metalness: 0.03
      });
      if (this.clouds) this.clouds.injectTerrainCloudShadows(mat);
      return mat;
    });

    // Reusable Biome Palette Colors (Zero per-vertex allocations)
    this.palette = {
      deepSand:   new THREE.Color(0xc2ac7e),
      wetShore:   new THREE.Color(0xdcc79b),
      duneGold:   new THREE.Color(0xdca963),
      duneMesa:   new THREE.Color(0xb56d45),
      lushGrass:  new THREE.Color(0x4c7c40),
      pineFloor:  new THREE.Color(0x2f5932),
      highland:   new THREE.Color(0x6d7447),
      cliffRock:  new THREE.Color(0x4b4c52),
      snowCap:    new THREE.Color(0xf2f6fa)
    };
    this._tmpColor = new THREE.Color();
    this._tmpNorm = new THREE.Vector3();

    this.chunkGroup = new THREE.Group();
    this.waterChunkGroup = new THREE.Group();
    this.scene.add(this.chunkGroup);
    this.scene.add(this.waterChunkGroup);

    this.chunks = new Map();     // key "cx,cz" -> { cx, cz, lod, mesh, waterMesh }
    this.buildQueue = [];        // Prioritized { cx, cz, lod, distSq }
    this.queuedKeys = new Set();
    this.lastPlayerChunkX = 0;
    this.lastPlayerChunkZ = 0;
    this.heightBound = (x, z) => this.getHeightAt(x, z);

    // Prime initial core chunks synchronously around spawn (0, 0)
    this.lastPlayerChunkX = null;
    this.updateStreaming(0, 0, true);
  }

  // Macro Temperature & Moisture fields for infinite biome diversity
  getClimateAt(x, z) {
    const temp = THREE.MathUtils.clamp(
      0.50 + this.noise.fbm(x * 0.00085 + 31.7, z * 0.00085 - 19.4, 3) * 1.25,
      0.0, 1.0
    );
    const moisture = THREE.MathUtils.clamp(
      0.50 + this.noise.fbm(x * 0.00095 - 52.1, z * 0.00095 + 43.8, 3) * 1.25,
      0.0, 1.0
    );
    return { temp, moisture };
  }

  // Exact O(1) continuous height query across infinite coordinates
  getHeightAt(x, z) {
    // 1. Macro Continental Shelves & Ocean Straits
    const macroContinent = this.noise.fbm(x * 0.0012, z * 0.0012, 4) * 38.0 + 5.5;
    const rollingHills = this.noise.fbm(x * 0.0046, z * 0.0046, 4) * 21.0;

    // 2. Tectonic Alpine Mountain Chains
    const chainMask = THREE.MathUtils.smoothstep(
      this.noise.ridged(x * 0.0011 + 7.4, z * 0.0011 - 5.2, 3),
      0.30, 0.76
    );
    const distFromSpawn = Math.hypot(x, z);
    const spawnPeakSuppress = THREE.MathUtils.smoothstep(distFromSpawn, 55, 210);
    const alpinePeaks = this.noise.ridged(x * 0.0052 + 4.2, z * 0.0052 - 2.7, 4) * 74.0 * chainMask * spawnPeakSuppress;

    // 3. Wind-Sculpted Desert Dunes in Hot/Arid Climate Zones
    const { temp, moisture } = this.getClimateAt(x, z);
    const aridMask = THREE.MathUtils.smoothstep(temp, 0.60, 0.82) * (1.0 - THREE.MathUtils.smoothstep(moisture, 0.22, 0.46));
    const duneRipples = Math.abs(Math.sin(x * 0.034 + this.noise.noise2D(x * 0.014, z * 0.014) * 3.2)) * 5.2 * aridMask;

    // 4. Meandering River Canyons & Estuaries
    const riverWave = Math.abs(this.noise.fbm(x * 0.0021 + 13.5, z * 0.0021 - 9.1, 3));
    const riverCarve = (1.0 - THREE.MathUtils.smoothstep(riverWave, 0.0, 0.048)) * 16.5;

    // 5. Welcoming Starting Plateau at (0, 0) overlooking river & distant peaks
    const originContinentBoost = (1.0 - THREE.MathUtils.smoothstep(distFromSpawn, 35, 165)) * 10.0;
    const spawnPlateau = 1.0 - THREE.MathUtils.smoothstep(distFromSpawn, 10, 44);

    const rawH = macroContinent + rollingHills + alpinePeaks + duneRipples + originContinentBoost - riverCarve;
    return THREE.MathUtils.lerp(rawH, 8.8, spawnPlateau * 0.66);
  }

  // Exact Central-Difference Analytic Normal (100% Seam-Free across Chunk & LOD Borders!)
  getNormalAt(x, z, outVec) {
    const eps = 1.15;
    const hL = this.getHeightAt(x - eps, z);
    const hR = this.getHeightAt(x + eps, z);
    const hD = this.getHeightAt(x, z - eps);
    const hU = this.getHeightAt(x, z + eps);
    return outVec.set(hL - hR, 2.0 * eps, hD - hU).normalize();
  }

  getBiomeAt(x, y, z) {
    if (y < this.seaLevel + 1.3) return 'Sunlit Azure Coast';
    if (y > 42.0) return 'Glacial Crown Peaks';
    if (y > 25.0) return 'Shattered Basalt Highlands';
    const { temp, moisture } = this.getClimateAt(x, z);
    if (temp > 0.62 && moisture < 0.42) return 'Amber Sunscorch Dunes';
    if (moisture > 0.54) return 'Whispering Pine Wilds';
    return 'Emerald Lowlands';
  }

  evaluateVertexColor(vx, vy, vz, ny, outColor) {
    const p = this.palette;
    const slope = 1.0 - THREE.MathUtils.clamp(ny, 0, 1);
    const micro = this.noise.noise2D(vx * 0.075, vz * 0.075) * 0.5 + 0.5;
    const { temp, moisture } = this.getClimateAt(vx, vz);
    const aridMask = THREE.MathUtils.smoothstep(temp, 0.58, 0.80) * (1.0 - THREE.MathUtils.smoothstep(moisture, 0.22, 0.46));
    const lushMask = THREE.MathUtils.smoothstep(moisture, 0.48, 0.72);

    if (vy < 0.55) {
      // Damp, darkened seabed & wet tidal shoreline sand
      outColor.copy(p.deepSand).multiplyScalar(THREE.MathUtils.lerp(0.66, 0.90, THREE.MathUtils.smoothstep(vy, -3.5, 0.55)));
    } else if (vy < 2.6) {
      outColor.copy(p.wetShore).lerp(p.lushGrass, THREE.MathUtils.smoothstep(vy, 0.65, 2.6) * (1.0 - aridMask * 0.8));
    } else if (vy < 21.0) {
      outColor.copy(p.lushGrass).lerp(p.pineFloor, lushMask * 0.75 + micro * 0.25);
      if (aridMask > 0.01) {
        const desertTone = p.duneGold.clone().lerp(p.duneMesa, micro * 0.45);
        outColor.lerp(desertTone, aridMask);
      }
    } else if (vy < 38.0) {
      outColor.copy(p.highland).lerp(p.cliffRock, THREE.MathUtils.smoothstep(vy, 23.0, 38.0) * 0.55);
      if (aridMask > 0.2) outColor.lerp(p.duneMesa, aridMask * 0.65);
    } else {
      outColor.copy(p.snowCap);
    }

    const rockMask = THREE.MathUtils.smoothstep(slope, 0.22, 0.48);
    outColor.lerp(p.cliffRock, rockMask * (vy > 40 ? 0.55 : 0.92));
    return outColor;
  }

  // Crack-Free Skirted Chunk Geometry Builder
  buildChunkGeometry(cx, cz, lod) {
    const S = this.lodSegments[lod];
    const stride = S + 1;
    const surfaceCount = stride * stride;
    const perimCount = 4 * S;
    const totalVerts = surfaceCount + perimCount * 2; // Top + Bottom skirt ring

    const positions = new Float32Array(totalVerts * 3);
    const normals = new Float32Array(totalVerts * 3);
    const colors = new Float32Array(totalVerts * 3);

    const originX = cx * this.chunkSize;
    const originZ = cz * this.chunkSize;
    const half = this.chunkSize * 0.5;
    const step = this.chunkSize / S;

    // 1. Populate Main Surface Grid
    let ptr = 0;
    for (let iz = 0; iz <= S; iz++) {
      const vz = originZ - half + iz * step;
      for (let ix = 0; ix <= S; ix++) {
        const vx = originX - half + ix * step;
        const vy = this.getHeightAt(vx, vz);
        const n = this.getNormalAt(vx, vz, this._tmpNorm);
        const c = this.evaluateVertexColor(vx, vy, vz, n.y, this._tmpColor);

        positions[ptr] = vx;
        positions[ptr + 1] = vy;
        positions[ptr + 2] = vz;

        normals[ptr] = n.x;
        normals[ptr + 1] = n.y;
        normals[ptr + 2] = n.z;

        colors[ptr] = c.r;
        colors[ptr + 1] = c.g;
        colors[ptr + 2] = c.b;
        ptr += 3;
      }
    }

    // Collect Perimeter Surface Indices (CCW from above: North S->0, West 0->S, South 0->S, East S->0)
    const borderLoop = [];
    for (let ix = S; ix > 0; ix--) borderLoop.push(ix);                         // North (iz = 0)
    for (let iz = 0; iz < S; iz++) borderLoop.push(iz * stride);                // West  (ix = 0)
    for (let ix = 0; ix < S; ix++) borderLoop.push(S * stride + ix);            // South (iz = S)
    for (let iz = S; iz > 0; iz--) borderLoop.push(iz * stride + S);            // East  (ix = S)

    // 2. Append Top & Bottom Skirt Vertices (inheriting exact surface normal & color!)
    const skirtTopStart = surfaceCount;
    const skirtBotStart = surfaceCount + perimCount;
    for (let k = 0; k < perimCount; k++) {
      const srcIdx3 = borderLoop[k] * 3;
      const topIdx3 = (skirtTopStart + k) * 3;
      const botIdx3 = (skirtBotStart + k) * 3;

      positions[topIdx3]     = positions[srcIdx3];
      positions[topIdx3 + 1] = positions[srcIdx3 + 1];
      positions[topIdx3 + 2] = positions[srcIdx3 + 2];

      positions[botIdx3]     = positions[srcIdx3];
      positions[botIdx3 + 1] = positions[srcIdx3 + 1] - this.skirtDepth;
      positions[botIdx3 + 2] = positions[srcIdx3 + 2];

      for (let j = 0; j < 3; j++) {
        normals[topIdx3 + j] = normals[srcIdx3 + j];
        normals[botIdx3 + j] = normals[srcIdx3 + j];
        colors[topIdx3 + j]  = colors[srcIdx3 + j];
        colors[botIdx3 + j]  = colors[srcIdx3 + j];
      }
    }

    // 3. Build Surface + Outward Skirt Triangle Indices
    const surfaceQuads = S * S;
    const totalQuads = surfaceQuads + perimCount;
    const indices = new Uint32Array(totalQuads * 6);
    let iPtr = 0;

    for (let iz = 0; iz < S; iz++) {
      for (let ix = 0; ix < S; ix++) {
        const a = iz * stride + ix;
        const b = (iz + 1) * stride + ix;
        const c = iz * stride + (ix + 1);
        const d = (iz + 1) * stride + (ix + 1);

        indices[iPtr++] = a;
        indices[iPtr++] = b;
        indices[iPtr++] = c;

        indices[iPtr++] = b;
        indices[iPtr++] = d;
        indices[iPtr++] = c;
      }
    }

    for (let k = 0; k < perimCount; k++) {
      const nextK = (k + 1) % perimCount;
      const t0 = skirtTopStart + k;
      const t1 = skirtTopStart + nextK;
      const b0 = skirtBotStart + k;
      const b1 = skirtBotStart + nextK;

      indices[iPtr++] = t0;
      indices[iPtr++] = b0;
      indices[iPtr++] = t1;

      indices[iPtr++] = b0;
      indices[iPtr++] = b1;
      indices[iPtr++] = t1;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeBoundingSphere();
    return geo;
  }

  getTargetLod(chebyshevDist) {
    if (chebyshevDist <= 1) return 0;
    if (chebyshevDist === 2) return 1;
    if (chebyshevDist === 3) return 2;
    return 3;
  }

  instantiateOrUpgradeChunk(cx, cz, lod) {
    const key = `${cx},${cz}`;
    const existing = this.chunks.get(key);
    if (existing && existing.lod === lod) return;

    const newGeo = this.buildChunkGeometry(cx, cz, lod);
    const waterGeo = this.ocean.buildChunkWaterGeometry(cx, cz, this.chunkSize, lod, this.heightBound);
    const foliageBundle = this.foliage.buildChunkFoliage(cx, cz, this.chunkSize, lod, this);
    const forestBundle = this.forest.buildChunkForest(cx, cz, this.chunkSize, lod, this);
    const geologyBundle = this.geology.buildChunkGeology(cx, cz, this.chunkSize, lod, this);

    if (existing) {
      existing.mesh.geometry.dispose();
      existing.mesh.geometry = newGeo;
      existing.mesh.material = this.lodMaterials[lod];
      existing.mesh.castShadow = lod <= 1;
      existing.lod = lod;

      if (existing.waterMesh) {
        existing.waterMesh.geometry.dispose();
        this.waterChunkGroup.remove(existing.waterMesh);
        existing.waterMesh = null;
      }
      if (waterGeo) {
        const wMesh = new THREE.Mesh(waterGeo, this.ocean.material);
        this.waterChunkGroup.add(wMesh);
        existing.waterMesh = wMesh;
      }

      if (existing.foliageBundle) {
        this.foliage.disposeBundle(existing.foliageBundle);
      }
      existing.foliageBundle = foliageBundle;

      if (existing.forestBundle) {
        this.forest.disposeBundle(existing.forestBundle);
      }
      existing.forestBundle = forestBundle;

      if (existing.geologyBundle) {
        this.geology.disposeBundle(existing.geologyBundle);
      }
      existing.geologyBundle = geologyBundle;

      // Build or keep chunk landmarks when upgrading from outer LOD 3 into closer rings
      if (!existing.landmarkBundle && lod <= 2) {
        existing.landmarkBundle = this.landmarks.buildChunkLandmarks(cx, cz, this.chunkSize, lod, this);
      }
    } else {
      const mesh = new THREE.Mesh(newGeo, this.lodMaterials[lod]);
      mesh.receiveShadow = true;
      mesh.castShadow = lod <= 1;
      this.chunkGroup.add(mesh);

      let waterMesh = null;
      if (waterGeo) {
        waterMesh = new THREE.Mesh(waterGeo, this.ocean.material);
        this.waterChunkGroup.add(waterMesh);
      }
      const landmarkBundle = this.landmarks.buildChunkLandmarks(cx, cz, this.chunkSize, lod, this);
      this.chunks.set(key, { cx, cz, lod, mesh, waterMesh, foliageBundle, forestBundle, geologyBundle, landmarkBundle });
    }
  }

  updateStreaming(playerX, playerZ, immediateCore = false) {
    const pcx = Math.round(playerX / this.chunkSize);
    const pcz = Math.round(playerZ / this.chunkSize);

    if (!immediateCore && pcx === this.lastPlayerChunkX && pcz === this.lastPlayerChunkZ) {
      this.processBuildQueue(4.2);
      return;
    }

    this.lastPlayerChunkX = pcx;
    this.lastPlayerChunkZ = pcz;

    // 1. Unload out-of-range chunks cleanly & free GPU BufferGeometries
    for (const [key, entry] of this.chunks.entries()) {
      const dist = Math.max(Math.abs(entry.cx - pcx), Math.abs(entry.cz - pcz));
      if (dist > this.viewRadius + 1) {
        entry.mesh.geometry.dispose();
        this.chunkGroup.remove(entry.mesh);
        if (entry.waterMesh) {
          entry.waterMesh.geometry.dispose();
          this.waterChunkGroup.remove(entry.waterMesh);
        }
        if (entry.foliageBundle) {
          this.foliage.disposeBundle(entry.foliageBundle);
        }
        if (entry.forestBundle) {
          this.forest.disposeBundle(entry.forestBundle);
        }
        if (entry.geologyBundle) {
          this.geology.disposeBundle(entry.geologyBundle);
        }
        if (entry.landmarkBundle) {
          this.landmarks.disposeBundle(entry.landmarkBundle);
        }
        this.chunks.delete(key);
      }
    }

    // 2. Rebuild prioritized streaming queue sorted radially from player
    this.buildQueue.length = 0;
    this.queuedKeys.clear();

    for (let dz = -this.viewRadius; dz <= this.viewRadius; dz++) {
      for (let dx = -this.viewRadius; dx <= this.viewRadius; dx++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        const ringDist = Math.max(Math.abs(dx), Math.abs(dz));
        const targetLod = this.getTargetLod(ringDist);
        const key = `${cx},${cz}`;
        const existing = this.chunks.get(key);

        if (!existing || existing.lod !== targetLod) {
          const distSq = dx * dx + dz * dz;
          if (immediateCore && ringDist <= 1) {
            this.instantiateOrUpgradeChunk(cx, cz, targetLod);
          } else {
            this.buildQueue.push({ cx, cz, lod: targetLod, distSq });
            this.queuedKeys.add(key);
          }
        }
      }
    }

    this.buildQueue.sort((a, b) => a.distSq - b.distSq);

    // Always guarantee the chunk directly beneath the player's feet exists immediately
    const underKey = `${pcx},${pcz}`;
    if (!this.chunks.has(underKey)) {
      this.instantiateOrUpgradeChunk(pcx, pcz, 0);
    }

    this.processBuildQueue(immediateCore ? 24.0 : 4.5);
  }

  processBuildQueue(budgetMs = 4.2) {
    if (this.buildQueue.length === 0) return;
    const tStart = performance.now();
    while (this.buildQueue.length > 0) {
      const job = this.buildQueue.shift();
      this.queuedKeys.delete(`${job.cx},${job.cz}`);
      this.instantiateOrUpgradeChunk(job.cx, job.cz, job.lod);
      if (performance.now() - tStart >= budgetMs) break;
    }
  }

  setWireframe(enabled) {
    this.wireframe = enabled;
    this.lodMaterials.forEach(m => { m.wireframe = enabled; });
    this.ocean.setWireframe(enabled);
    this.foliage.setWireframe(enabled);
    this.forest.setWireframe(enabled);
    this.geology.setWireframe(enabled);
    this.landmarks.setWireframe(enabled);
  }

  setLodDebug(enabled) {
    this.lodDebug = enabled;
    this.lodMaterials.forEach((m, idx) => {
      m.vertexColors = !enabled;
      m.color.setHex(enabled ? this.lodDebugColors[idx] : 0xffffff);
      m.needsUpdate = true;
    });
  }

  rebuildFoliageOnly() {
    for (const entry of this.chunks.values()) {
      if (entry.foliageBundle) {
        this.foliage.disposeBundle(entry.foliageBundle);
        entry.foliageBundle = null;
      }
      if (entry.lod <= 1) {
        entry.foliageBundle = this.foliage.buildChunkFoliage(entry.cx, entry.cz, this.chunkSize, entry.lod, this);
      }
    }
  }

  rebuildForestOnly() {
    for (const entry of this.chunks.values()) {
      if (entry.forestBundle) {
        this.forest.disposeBundle(entry.forestBundle);
        entry.forestBundle = null;
      }
      if (entry.lod <= 2) {
        entry.forestBundle = this.forest.buildChunkForest(entry.cx, entry.cz, this.chunkSize, entry.lod, this);
      }
    }
  }

  rebuildGeologyOnly() {
    for (const entry of this.chunks.values()) {
      if (entry.geologyBundle) {
        this.geology.disposeBundle(entry.geologyBundle);
        entry.geologyBundle = null;
      }
      if (entry.lod <= 2) {
        entry.geologyBundle = this.geology.buildChunkGeology(entry.cx, entry.cz, this.chunkSize, entry.lod, this);
      }
    }
  }

  // Returns Terrain Height OR Walkable Boulder/Waystone Dais Height!
  getSupportHeightAt(x, z, currentY) {
    let supportY = this.getHeightAt(x, z);
    const pcx = Math.round(x / this.chunkSize);
    const pcz = Math.round(z / this.chunkSize);

    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const entry = this.chunks.get(`${pcx + dx},${pcz + dz}`);
        if (!entry) continue;

        // Check Walkable Boulders & Mesas
        if (entry.geologyBundle && entry.geologyBundle.userData.colliders) {
          const colliders = entry.geologyBundle.userData.colliders;
          for (let i = 0; i < colliders.length; i++) {
            const c = colliders[i];
            if (!c.walkable) continue;
            const ox = x - c.x;
            const oz = z - c.z;
            const distSq = ox * ox + oz * oz;
            if (distSq < c.r * c.r) {
              const domeProfile = Math.sqrt(Math.max(0.0, 1.0 - distSq / (c.r * c.r)));
              const rockSurfaceY = c.y + c.h * (0.55 + 0.45 * domeProfile);
              if (currentY >= rockSurfaceY - 0.65 && rockSurfaceY > supportY) {
                supportY = rockSurfaceY;
              }
            }
          }
        }

        // Check Stepped Waystone Dais & Sun-Altar Platforms (Smooth auto-step up <= 0.55m!)
        if (entry.landmarkBundle && entry.landmarkBundle.userData.colliders) {
          const lCols = entry.landmarkBundle.userData.colliders;
          for (let i = 0; i < lCols.length; i++) {
            const c = lCols[i];
            if (!c.walkable) continue;
            const ox = x - c.x;
            const oz = z - c.z;
            if (ox * ox + oz * oz < c.r * c.r) {
              const platY = c.y + c.h;
              if (currentY >= platY - 0.58 && platY > supportY) {
                supportY = platY;
              }
            }
          }
        }
      }
    }
    return supportY;
  }

  // Fast 3x3 Neighborhood Cylindrical Tree Trunk, Rock & Monument Wall Collider Resolution
  resolvePropCollisions(pos, playerRadius = 0.42) {
    const pcx = Math.round(pos.x / this.chunkSize);
    const pcz = Math.round(pos.z / this.chunkSize);
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const entry = this.chunks.get(`${pcx + dx},${pcz + dz}`);
        if (!entry) continue;

        // 1. Tree Trunks
        if (entry.forestBundle && entry.forestBundle.userData.colliders) {
          const treeCols = entry.forestBundle.userData.colliders;
          for (let i = 0; i < treeCols.length; i++) {
            const c = treeCols[i];
            if (pos.y > c.y + 4.8 || pos.y + 1.8 < c.y) continue;
            const ox = pos.x - c.x;
            const oz = pos.z - c.z;
            const minSep = playerRadius + c.r;
            const distSq = ox * ox + oz * oz;
            if (distSq < minSep * minSep && distSq > 0.00001) {
              const dist = Math.sqrt(distSq);
              const push = (minSep - dist) / dist;
              pos.x += ox * push;
              pos.z += oz * push;
            }
          }
        }

        // 2. Boulders, Basalt Spires & Crystal Veins
        if (entry.geologyBundle && entry.geologyBundle.userData.colliders) {
          const rockCols = entry.geologyBundle.userData.colliders;
          for (let i = 0; i < rockCols.length; i++) {
            const c = rockCols[i];
            const topY = c.y + c.h;
            if (c.walkable && pos.y >= topY - 0.58) continue;
            if (pos.y > topY + 0.3 || pos.y + 1.8 < c.y) continue;

            const ox = pos.x - c.x;
            const oz = pos.z - c.z;
            const minSep = playerRadius + c.r * 0.88;
            const distSq = ox * ox + oz * oz;
            if (distSq < minSep * minSep && distSq > 0.00001) {
              const dist = Math.sqrt(distSq);
              const push = (minSep - dist) / dist;
              pos.x += ox * push;
              pos.z += oz * push;
            }
          }
        }

        // 3. Ancient Monument Pillars, Obelisks & Megaliths
        if (entry.landmarkBundle && entry.landmarkBundle.userData.colliders) {
          const lCols = entry.landmarkBundle.userData.colliders;
          for (let i = 0; i < lCols.length; i++) {
            const c = lCols[i];
            const topY = c.y + c.h;
            if (c.walkable && pos.y >= topY - 0.58) continue;
            if (pos.y > topY + 0.3 || pos.y + 1.8 < c.y) continue;

            const ox = pos.x - c.x;
            const oz = pos.z - c.z;
            const minSep = playerRadius + c.r;
            const distSq = ox * ox + oz * oz;
            if (distSq < minSep * minSep && distSq > 0.00001) {
              const dist = Math.sqrt(distSq);
              const push = (minSep - dist) / dist;
              pos.x += ox * push;
              pos.z += oz * push;
            }
          }
        }
      }
    }
  }

  rebuildAllForNewSeed(playerX, playerZ) {
    for (const entry of this.chunks.values()) {
      entry.mesh.geometry.dispose();
      this.chunkGroup.remove(entry.mesh);
      if (entry.waterMesh) {
        entry.waterMesh.geometry.dispose();
        this.waterChunkGroup.remove(entry.waterMesh);
      }
      if (entry.foliageBundle) {
        this.foliage.disposeBundle(entry.foliageBundle);
      }
      if (entry.forestBundle) {
        this.forest.disposeBundle(entry.forestBundle);
      }
      if (entry.geologyBundle) {
        this.geology.disposeBundle(entry.geologyBundle);
      }
      if (entry.landmarkBundle) {
        this.landmarks.disposeBundle(entry.landmarkBundle);
      }
    }
    this.chunks.clear();
    this.buildQueue.length = 0;
    this.queuedKeys.clear();
    this.lastPlayerChunkX = null;
    this.lastPlayerChunkZ = null;
    this.landmarks.resetForNewSeed();
    this.updateStreaming(playerX, playerZ, true);
  }
}

// -------------------------------------------------------------------------
// 4. PLAYABLE THIRD-PERSON EXPLORER, SWIMMING & GOD-CAM CONTROLLER
// -------------------------------------------------------------------------
class ExplorerController {
  constructor(scene, camera, domElement, terrain, ocean) {
    this.camera = camera;
    this.domElement = domElement;
    this.terrain = terrain;
    this.ocean = ocean;

    this.position = new THREE.Vector3(0, terrain.getHeightAt(0, 0), 0);
    this.velocity = new THREE.Vector3();
    this.yaw = 0.35;
    this.pitch = 0.22;
    this.camDist = 7.2;

    this.onGround = true;
    this.isSwimming = false;
    this.waterWake = 0.0;
    this.flyMode = false;
    this.pointerLocked = false;
    this.draggingLook = false;

    this.keys = {};
    this.buildAvatarPlaceholder(scene);
    this.bindInputs();
  }

  buildAvatarPlaceholder(scene) {
    // Clean articulated Explorer Ranger silhouette (Upgraded in Epoch II!)
    this.avatar = new THREE.Group();
    const cloakMat = new THREE.MeshStandardMaterial({ color: 0x243b4a, roughness: 0.65 });
    const armorMat = new THREE.MeshStandardMaterial({ color: 0xd4a859, roughness: 0.35, metalness: 0.65 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe6bfa0, roughness: 0.6 });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.68, 8, 16), cloakMat);
    torso.position.y = 1.05;
    torso.castShadow = true;

    const pauldron = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.29, 0.22, 16), armorMat);
    pauldron.position.y = 1.32;
    pauldron.castShadow = true;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 18, 16), skinMat);
    head.position.y = 1.68;
    head.castShadow = true;

    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.34, 16), cloakMat);
    hood.position.set(0, 1.78, -0.03);
    hood.rotation.x = -0.18;

    this.legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.10, 0.45, 6, 12), cloakMat);
    this.legL.position.set(-0.14, 0.38, 0);
    this.legL.castShadow = true;

    this.legR = new THREE.Mesh(new THREE.CapsuleGeometry(0.10, 0.45, 6, 12), cloakMat);
    this.legR.position.set(0.14, 0.38, 0);
    this.legR.castShadow = true;

    this.avatar.add(torso, pauldron, head, hood, this.legL, this.legR);
    scene.add(this.avatar);
    this.walkCycle = 0;
  }

  bindInputs() {
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (e.code === 'KeyV') this.toggleFlyMode();
    });
    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
    });

    this.domElement.addEventListener('click', () => {
      if (!this.pointerLocked && this.domElement.requestPointerLock) {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.domElement;
      const xhair = document.getElementById('crosshair');
      xhair.classList.toggle('hidden', !this.pointerLocked);
      xhair.classList.toggle('flex', this.pointerLocked);
    });

    this.domElement.addEventListener('mousedown', e => {
      if (!this.pointerLocked && e.button === 0) this.draggingLook = true;
    });
    window.addEventListener('mouseup', () => { this.draggingLook = false; });

    window.addEventListener('mousemove', e => {
      if (!this.pointerLocked && !this.draggingLook) return;
      this.yaw -= e.movementX * 0.0026;
      this.pitch = THREE.MathUtils.clamp(this.pitch + e.movementY * 0.0022, -0.65, 1.25);
    });

    this.domElement.addEventListener('wheel', e => {
      this.camDist = THREE.MathUtils.clamp(this.camDist + e.deltaY * 0.006, 3.2, 22.0);
    }, { passive: true });
  }

  toggleFlyMode(force = null) {
    this.flyMode = force !== null ? force : !this.flyMode;
    this.velocity.set(0, 0, 0);
    this.avatar.visible = !this.flyMode;
    document.getElementById('btn-fly-mode').textContent = this.flyMode ? '[V] Free-Fly: On' : '[V] Free-Fly: Off';
    document.getElementById('hud-mode-badge').textContent = this.flyMode
      ? 'Mode: God-Cam World Fly'
      : 'Mode: Third-Person Explorer';
  }

  update(dt, elapsed = 0) {
    const fwdX = -Math.sin(this.yaw);
    const fwdZ = -Math.cos(this.yaw);
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);

    let moveX = 0;
    let moveZ = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp'])    { moveX += fwdX; moveZ += fwdZ; }
    if (this.keys['KeyS'] || this.keys['ArrowDown'])  { moveX -= fwdX; moveZ -= fwdZ; }
    if (this.keys['KeyD'] || this.keys['ArrowRight']) { moveX += rightX; moveZ += rightZ; }
    if (this.keys['KeyA'] || this.keys['ArrowLeft'])  { moveX -= rightX; moveZ -= rightZ; }

    const len = Math.hypot(moveX, moveZ);
    if (len > 0.001) { moveX /= len; moveZ /= len; }

    const sprinting = Boolean(this.keys['ShiftLeft'] || this.keys['ShiftRight']);

    if (this.flyMode) {
      this.isSwimming = false;
      this.waterWake = 0.0;
      const flySpeed = sprinting ? 95.0 : 38.0;
      this.position.x += moveX * flySpeed * dt;
      this.position.z += moveZ * flySpeed * dt;
      if (this.keys['Space'] || this.keys['KeyE']) this.position.y += flySpeed * 0.7 * dt;
      if (this.keys['KeyQ'] || this.keys['ControlLeft']) this.position.y -= flySpeed * 0.7 * dt;

      const minGround = Math.max(this.terrain.getHeightAt(this.position.x, this.position.z), this.ocean.seaLevel) + 1.4;
      if (this.position.y < minGround) this.position.y = minGround;

      this.camera.position.copy(this.position);
      const lookTarget = new THREE.Vector3(
        this.position.x + fwdX * Math.cos(this.pitch) * 10,
        this.position.y - Math.sin(this.pitch) * 10,
        this.position.z + fwdZ * Math.cos(this.pitch) * 10
      );
      this.camera.lookAt(lookTarget);
      return;
    }

    // Evaluate Seabed & Real-Time Gerstner Wave Surface at Player Coordinates
    const seabedY = this.terrain.getHeightAt(this.position.x, this.position.z);
    const waveY = this.ocean.getWaveHeightAt(this.position.x, this.position.z, elapsed, seabedY);
    const waterDepth = waveY - seabedY;
    const swimChestOffset = 1.12;

    // Enter/exit Buoyant Surface Swimming when water is chest-deep
    const wasSwimming = this.isSwimming;
    if (waterDepth > 1.18 && this.position.y <= waveY - swimChestOffset + 0.18) {
      this.isSwimming = true;
    } else if (waterDepth < 0.98) {
      this.isSwimming = false;
    }

    if (this.isSwimming !== wasSwimming) {
      document.getElementById('hud-mode-badge').textContent = this.isSwimming
        ? 'Mode: Buoyant Swimming'
        : 'Mode: Third-Person Explorer';
    }

    if (this.isSwimming) {
      const swimSpeed = sprinting ? 9.4 : 5.4;
      this.velocity.x = moveX * swimSpeed;
      this.velocity.z = moveZ * swimSpeed;
      this.position.x += this.velocity.x * dt;
      this.position.z += this.velocity.z * dt;

      const nextSeabed = this.terrain.getHeightAt(this.position.x, this.position.z);
      const nextWaveY = this.ocean.getWaveHeightAt(this.position.x, this.position.z, elapsed, nextSeabed);
      const targetBuoyantY = Math.max(nextSeabed, nextWaveY - swimChestOffset);

      if (this.keys['Space']) {
        // Breach-hop upward to climb onto riverbanks or future docks!
        this.velocity.y = 8.6;
        this.isSwimming = false;
        this.position.y += this.velocity.y * dt;
      } else {
        this.velocity.y = 0;
        this.position.y += (targetBuoyantY - this.position.y) * Math.min(1, dt * 10.0);
      }
      this.onGround = false;
      this.waterWake = len > 0.01 ? (sprinting ? 1.25 : 0.88) : 0.38;
    } else {
      // Ground & Shallow-Surf Wading Physics
      const isWading = waterDepth > 0.08 && this.position.y < waveY + 0.05;
      const wadeDrag = isWading ? 0.78 : 1.0;
      const speed = (sprinting ? 14.5 : 7.2) * wadeDrag;
      this.velocity.x = moveX * speed;
      this.velocity.z = moveZ * speed;

      if (this.onGround && this.keys['Space']) {
        this.velocity.y = 10.5;
        this.onGround = false;
      }
      this.velocity.y -= 26.0 * dt;

      const prevY = this.position.y;
      this.position.x += this.velocity.x * dt;
      this.position.z += this.velocity.z * dt;
      this.terrain.resolvePropCollisions(this.position, 0.42);
      this.position.y += this.velocity.y * dt;

      const floorY = this.terrain.getSupportHeightAt(this.position.x, this.position.z, prevY);
      if (this.position.y <= floorY) {
        this.position.y = floorY;
        this.velocity.y = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
      this.waterWake = isWading ? (len > 0.01 ? 0.82 : 0.25) : 0.0;
    }

    // Update Explorer Avatar Pose, Swim Tilt & Stride/Kick Animation
    this.avatar.position.copy(this.position);
    const targetForwardTilt = (this.isSwimming && len > 0.01) ? 0.36 : 0.0;
    this.avatar.rotation.x += (targetForwardTilt - this.avatar.rotation.x) * Math.min(1, dt * 8);

    if (len > 0.01) {
      const targetHeading = Math.atan2(moveX, moveZ);
      let diff = targetHeading - this.avatar.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.avatar.rotation.y += diff * Math.min(1, dt * 12);

      const cadence = this.isSwimming ? (sprinting ? 11 : 7.5) : (sprinting ? 14 : 8.5);
      this.walkCycle += dt * cadence;
      const swingAmp = this.isSwimming ? 0.42 : 0.55;
      this.legL.rotation.x = Math.sin(this.walkCycle) * swingAmp;
      this.legR.rotation.x = -Math.sin(this.walkCycle) * swingAmp;
    } else {
      this.legL.rotation.x *= 0.82;
      this.legR.rotation.x *= 0.82;
    }

    // Smooth Third-Person Spring Camera with Terrain & Ocean Surface Anti-Clip
    const focusHeight = this.isSwimming ? 1.48 : 1.65;
    const focusPt = new THREE.Vector3(this.position.x, this.position.y + focusHeight, this.position.z);
    const camOffset = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch) * this.camDist,
      Math.sin(this.pitch) * this.camDist,
      Math.cos(this.yaw) * Math.cos(this.pitch) * this.camDist
    );
    const desiredCam = focusPt.clone().add(camOffset);
    const camSurface = Math.max(this.terrain.getHeightAt(desiredCam.x, desiredCam.z), this.ocean.seaLevel) + 0.82;
    if (desiredCam.y < camSurface) desiredCam.y = camSurface;

    this.camera.position.lerp(desiredCam, Math.min(1, dt * 16));
    this.camera.lookAt(focusPt);
  }
}

// -------------------------------------------------------------------------
// 5. BOOTSTRAP ENGINE, TELEMETRY & UI CONTROLS
// -------------------------------------------------------------------------
const stageEl = document.getElementById('webgl-stage');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.2, 2400);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
stageEl.appendChild(renderer.domElement);

const worldNoise = new SeededNoise(7741);
const sky = new SkyAtmosphere(scene);
const clouds = new VolumetricCloudSystem(scene);
const weather = new DynamicWeatherSystem(scene);
const ocean = new OceanWaterSystem(scene, 0.0, 96, 5);
const foliage = new GrassFoliageSystem(scene);
const forest = new ProceduralForestSystem(scene);
const geology = new ProceduralGeologySystem(scene);
const landmarks = new AncientLandmarksSystem(scene);
const terrain = new WorldTerrain(scene, worldNoise, ocean, foliage, forest, geology, clouds, landmarks);
const player = new ExplorerController(scene, camera, renderer.domElement, terrain, ocean);

// UI Bindings
const sliderTime = document.getElementById('slider-time');
const btnTimeCycle = document.getElementById('btn-time-cycle');
sliderTime.addEventListener('input', e => {
  sky.timeOfDay = parseFloat(e.target.value);
  sky.autoAdvance = false;
  btnTimeCycle.textContent = 'Paused';
});
btnTimeCycle.addEventListener('click', () => {
  sky.autoAdvance = !sky.autoAdvance;
  btnTimeCycle.textContent = sky.autoAdvance ? 'Auto' : 'Paused';
});

document.getElementById('btn-fly-mode').addEventListener('click', () => player.toggleFlyMode());

const btnWeatherState = document.getElementById('btn-weather-state');
function triggerWeatherStateCycle() {
  const modeName = weather.cycleWeather();
  btnWeatherState.textContent = `[K] Weather: ${modeName}`;
}
btnWeatherState.addEventListener('click', triggerWeatherStateCycle);

const btnCloudState = document.getElementById('btn-cloud-state');
function triggerCloudStateCycle() {
  const stateName = clouds.cycleCloudState();
  btnCloudState.textContent = `[C] Clouds: ${stateName}`;
}
btnCloudState.addEventListener('click', triggerCloudStateCycle);

const btnRockDensity = document.getElementById('btn-rock-density');
function triggerRockDensityCycle() {
  const modeName = geology.cycleDensity();
  terrain.rebuildGeologyOnly();
  btnRockDensity.textContent = `[R] Rocks: ${modeName}`;
}
btnRockDensity.addEventListener('click', triggerRockDensityCycle);

const btnTreeDensity = document.getElementById('btn-tree-density');
function triggerTreeDensityCycle() {
  const modeName = forest.cycleDensity();
  terrain.rebuildForestOnly();
  btnTreeDensity.textContent = `[T] Trees: ${modeName}`;
}
btnTreeDensity.addEventListener('click', triggerTreeDensityCycle);

const btnGrassDensity = document.getElementById('btn-grass-density');
function triggerGrassDensityCycle() {
  const modeName = foliage.cycleDensity();
  terrain.rebuildFoliageOnly();
  btnGrassDensity.textContent = `[G] Grass: ${modeName}`;
}
btnGrassDensity.addEventListener('click', triggerGrassDensityCycle);

const btnSeaState = document.getElementById('btn-sea-state');
function triggerSeaStateCycle() {
  const stateName = ocean.cycleSeaState();
  btnSeaState.textContent = `[O] Sea: ${stateName}`;
}
btnSeaState.addEventListener('click', triggerSeaStateCycle);

const btnLodDebug = document.getElementById('btn-lod-debug');
function toggleLodHeatmap() {
  terrain.setLodDebug(!terrain.lodDebug);
  btnLodDebug.textContent = terrain.lodDebug ? '[L] LOD Rings: On' : '[L] LOD Rings: Off';
  btnLodDebug.classList.toggle('text-emerald-300', terrain.lodDebug);
}
btnLodDebug.addEventListener('click', toggleLodHeatmap);
document.getElementById('btn-interact-waystone').addEventListener('click', e => {
  e.stopPropagation();
  landmarks.attuneNearbyWaystone();
});

window.addEventListener('keydown', e => {
  if (e.code === 'KeyL') toggleLodHeatmap();
  if (e.code === 'KeyO') triggerSeaStateCycle();
  if (e.code === 'KeyG') triggerGrassDensityCycle();
  if (e.code === 'KeyT') triggerTreeDensityCycle();
  if (e.code === 'KeyR') triggerRockDensityCycle();
  if (e.code === 'KeyC') triggerCloudStateCycle();
  if (e.code === 'KeyK') triggerWeatherStateCycle();
  if (e.code === 'KeyF') landmarks.attuneNearbyWaystone();
});

let wireframe = false;
document.getElementById('btn-wireframe').addEventListener('click', e => {
  wireframe = !wireframe;
  terrain.setWireframe(wireframe);
  e.currentTarget.textContent = wireframe ? 'Wireframe: On' : 'Wireframe: Off';
});

document.getElementById('btn-reseed').addEventListener('click', () => {
  const nextSeed = Math.floor(1000 + Math.random() * 8999);
  worldNoise.setSeed(nextSeed);
  terrain.rebuildAllForNewSeed(player.position.x, player.position.z);
  player.position.y = Math.max(terrain.seaLevel, terrain.getHeightAt(player.position.x, player.position.z));
  player.velocity.set(0, 0, 0);
  player.isSwimming = false;
});

const drawer = document.getElementById('blueprint-drawer');
document.getElementById('btn-open-blueprint').addEventListener('click', () => drawer.classList.toggle('translate-x-full'));
document.getElementById('btn-close-blueprint').addEventListener('click', () => drawer.classList.add('translate-x-full'));

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Compass & Telemetry Helpers
const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const clock = new THREE.Clock();
let fpsFrames = 0;
let fpsAccum = 0;
let currentFps = 60;
let uiTick = 0;

function updateHUD() {
  const deg = ((THREE.MathUtils.radToDeg(-player.yaw) % 360) + 360) % 360;
  const idx = Math.round(deg / 45) % 8;
  document.getElementById('compass-heading').textContent = `${CARDINALS[idx]} ${String(Math.round(deg)).padStart(3, '0')}°`;
  document.getElementById('compass-left').textContent = CARDINALS[(idx + 7) % 8];
  document.getElementById('compass-right').textContent = CARDINALS[(idx + 1) % 8];

  const p = player.position;
  document.getElementById('compass-waystone').textContent = landmarks.getCompassRadarText(p);

  const cx = Math.round(p.x / terrain.chunkSize);
  const cz = Math.round(p.z / terrain.chunkSize);
  document.getElementById('hud-coords').textContent =
    `XYZ: ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)} • Cell (${cx}, ${cz})`;
  document.getElementById('hud-biome').textContent = terrain.getBiomeAt(p.x, p.y, p.z);
  document.getElementById('hud-weather').textContent = weather.live.activeBanner;
  document.getElementById('hud-clock').textContent = sky.getFormattedClock();
  if (sky.autoAdvance) sliderTime.value = sky.timeOfDay.toFixed(2);

  const bladesK = (foliage.totalActiveBlades / 1000).toFixed(1);
  const treesN = forest.totalActiveTrees.toLocaleString();
  const rocksN = (geology.totalActiveRocks + geology.totalActiveCrystals).toLocaleString();
  const qLen = terrain.buildQueue.length;
  const qTag = qLen > 0 ? ` (+${qLen}Q)` : '';
  document.getElementById('hud-telemetry').textContent =
    `${currentFps} FPS • ${treesN} Trees • ${rocksN} Rocks • ${bladesK}k Grass${qTag}`;
}

// Main Engine Loop
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  fpsFrames++;
  fpsAccum += dt;
  if (fpsAccum >= 0.5) {
    currentFps = Math.round(fpsFrames / fpsAccum);
    fpsFrames = 0;
    fpsAccum = 0;
  }

  player.update(dt, elapsed);
  terrain.updateStreaming(player.position.x, player.position.z);
  weather.update(dt, elapsed, camera.position, player.position, sky, clouds, ocean, terrain);
  sky.update(dt, elapsed, player.position, weather.live);
  clouds.update(elapsed, sky, camera.position);
  ocean.update(
    elapsed,
    sky,
    player.position,
    player.waterWake,
    terrain.lastPlayerChunkX || 0,
    terrain.lastPlayerChunkZ || 0,
    terrain.chunkSize
  );
  foliage.update(elapsed, sky, player.position);
  forest.update(elapsed);
  geology.update(elapsed, sky);
  landmarks.update(dt, elapsed, player.position);

  renderer.render(scene, camera);

  uiTick += dt;
  if (uiTick >= 0.1) {
    uiTick = 0;
    updateHUD();
  }
}

updateHUD();
tick();

export {
  SeededNoise,
  SkyAtmosphere,
  VolumetricCloudSystem,
  DynamicWeatherSystem,
  OceanWaterSystem,
  GrassFoliageSystem,
  ProceduralForestSystem,
  ProceduralGeologySystem,
  AncientLandmarksSystem,
  WorldTerrain,
  ExplorerController,
  scene,
  camera,
  renderer,
  worldNoise,
  sky,
  clouds,
  weather,
  ocean,
  foliage,
  forest,
  geology,
  landmarks,
  terrain,
  player
};