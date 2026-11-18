import * as THREE from 'three';

/*
 * Niebla RADIAL en vez de niebla por distancia a la cámara.
 * El mundo se disuelve hacia el color de fondo según la distancia al centro (x, z),
 * así el borde del piso es siempre un círculo suave y no "cambia de forma" al girar.
 *   scene.fog = new THREE.Fog(colorDeFondo, radioInicio, radioFin)
 * Se importa una sola vez (desde common.js) antes de compilar cualquier material.
 */
const C = THREE.ShaderChunk;

C.fog_pars_vertex = /* glsl */`
#ifdef USE_FOG
  varying vec2 vFogXZ;
#endif`;

C.fog_vertex = /* glsl */`
#ifdef USE_FOG
  vFogXZ = ( modelMatrix * vec4( transformed, 1.0 ) ).xz;
#endif`;

C.fog_pars_fragment = /* glsl */`
#ifdef USE_FOG
  uniform vec3 fogColor;
  varying vec2 vFogXZ;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear;
    uniform float fogFar;
  #endif
#endif`;

C.fog_fragment = /* glsl */`
#ifdef USE_FOG
  float fogR = length( vFogXZ );
  #ifdef FOG_EXP2
    float fogFactor = 1.0 - exp( - fogDensity * fogDensity * fogR * fogR );
  #else
    float fogFactor = smoothstep( fogNear, fogFar, fogR );
  #endif
  gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`;

export const radialFog = (color, near, far) => new THREE.Fog(color, near, far);
