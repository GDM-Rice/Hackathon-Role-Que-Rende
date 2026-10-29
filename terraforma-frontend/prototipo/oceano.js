// Terraforma · oceano 3D da "Respire com a Terra"
// Ondas Gerstner calculadas no shader, céu procedural (dia, entardecer, noite) e camadas de nuvem
// que a câmera atravessa ao descer do planeta. Sem texturas externas: tudo é feito no momento.
import * as THREE from 'three';

const RUIDO2 = /* glsl */ `
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm2(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*vnoise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
float h31(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
`;

const CEU = /* glsl */ `
uniform vec3 uSol, uZenite, uHorizonte, uCorSol;
uniform float uNoite, uTempo, uVeu;
uniform vec3 uCorVeu;
${RUIDO2}
vec3 ceu(vec3 d, bool comNuvens){
  float h=max(d.y,0.);
  vec3 c=mix(uHorizonte,uZenite,pow(h,.42));
  float s=max(dot(d,uSol),0.);
  float disco=mix(1400.,4000.,uNoite);
  c+=uCorSol*(smoothstep(.9994,.99975,s)*mix(5.,1.6,uNoite)*step(0.,d.y)+pow(s,mix(14.,60.,uNoite))*mix(.45,.25,uNoite)+pow(s,3.)*.14*(1.-h)*(1.-uNoite));
  if(comNuvens && d.y>.015){
    vec2 p=d.xz/(d.y+.1)*1.15+vec2(uTempo*.006,uTempo*.002);
    float n=fbm2(p);
    float cl=smoothstep(.42,.78,n)*smoothstep(.015,.22,d.y);
    vec3 nuvem=mix(uHorizonte*1.02,vec3(1.)*mix(1.,.35,uNoite),.55)+uCorSol*.35*pow(s,5.);
    c=mix(c,nuvem,cl*mix(.85,.55,uNoite));
  }
  if(uNoite>.01 && d.y>0.){
    vec3 q=floor(d*420.);
    float st=step(.9978,h31(q))*(.55+.45*sin(uTempo*1.3+h31(q+3.)*40.));
    c+=vec3(.9,.94,1.)*st*uNoite*smoothstep(.03,.25,d.y);
  }
  return c;
}`;

const VERT_CEU = /* glsl */ `varying vec3 vDir; void main(){ vDir=normalize(position); vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position=p.xyww; }`;
const FRAG_CEU = /* glsl */ `precision highp float; varying vec3 vDir; ${CEU} void main(){ vec3 c=ceu(normalize(vDir),true); c=mix(c,uCorVeu,uVeu); gl_FragColor=vec4(clamp(c,0.,1.),1.); }`;

const VERT_AGUA = /* glsl */ `
uniform float uTempo, uMare, uAmp;
uniform vec2 uCentro;
varying vec3 vPos; varying vec3 vNorm; varying float vAlt;
vec3 onda(vec2 p, vec2 dir, float ingreme, float comp, inout vec3 T, inout vec3 B){
  float k=6.2831853/comp, c=sqrt(9.8/k); vec2 d=normalize(dir);
  float f=k*(dot(d,p)-c*uTempo), a=ingreme/k, sf=sin(f), cf=cos(f);
  T+=vec3(-d.x*d.x*ingreme*sf, d.x*ingreme*cf, -d.x*d.y*ingreme*sf);
  B+=vec3(-d.x*d.y*ingreme*sf, d.y*ingreme*cf, -d.y*d.y*ingreme*sf);
  return vec3(d.x*a*cf, a*sf, d.y*a*cf);
}
void main(){
  vec3 p=position; p.xz+=uCentro;
  float longe=length(position.xz);
  float at=1.-smoothstep(140.,420.,longe);
  vec3 T=vec3(1.,0.,0.), B=vec3(0.,0.,1.), g=vec3(0.);
  g+=onda(p.xz,vec2(1.,.3),.15*uAmp,42.,T,B);
  g+=onda(p.xz,vec2(.7,-.6),.13*uAmp,25.,T,B);
  g+=onda(p.xz,vec2(-.3,1.),.11*uAmp,15.,T,B);
  g+=onda(p.xz,vec2(.9,.5),.09*uAmp,9.,T,B);
  g+=onda(p.xz,vec2(-.8,-.4),.07*uAmp,5.5,T,B);
  g+=onda(p.xz,vec2(.2,-1.),.05*uAmp,3.4,T,B);
  p+=g*at; p.y+=uMare*.7;
  vNorm=normalize(mix(vec3(0.,1.,0.),normalize(cross(B,T)),at));
  vAlt=g.y*at; vPos=p;
  gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);
}`;

const FRAG_AGUA = /* glsl */ `
precision highp float;
uniform vec3 uFunda, uRasa;
uniform float uAmp;
varying vec3 vPos; varying vec3 vNorm; varying float vAlt;
${CEU}
void main(){
  vec3 V=normalize(cameraPosition-vPos);
  float dist=length(cameraPosition-vPos);
  vec3 N=normalize(vNorm);
  // ondulações finas (só perto da câmera)
  float perto=1.-smoothstep(15.,140.,dist);
  vec2 q=vPos.xz*.45; float t=uTempo;
  if(perto>0.){   // longe elas não aparecem: pula os 3 fbm (15 ruídos por pixel)
    float e=.08; vec2 m=vec2(t*.22,t*.07);
    float n0=fbm2(q+m), nx=fbm2(q+vec2(e,0.)+m), nz=fbm2(q+vec2(0.,e)+m);
    N=normalize(N+vec3(n0-nx,0.,n0-nz)*4.5*perto);
  }
  float F=.02+.98*pow(1.-max(dot(N,V),0.),5.);
  vec3 R=reflect(-V,N); R.y=abs(R.y)+.002;
  vec3 refl=ceu(normalize(R),false);
  float crista=clamp(vAlt*1.1+.45,0.,1.);
  vec3 corpo=mix(uFunda,uRasa,crista*.55);
  // luz do céu espalhada na água e relevo das ondas iluminado pelo sol (sem isso, visto do alto o mar fica preto)
  corpo+=uZenite*.32*(1.-uNoite*.6);
  corpo*=.7+.6*max(dot(N,uSol),0.);
  float sss=pow(max(dot(V,-uSol),0.),3.)*smoothstep(-.1,.7,vAlt)*(1.-uNoite*.6);
  corpo+=uRasa*sss*.55;
  vec3 cor=mix(corpo,refl,F);
  float rs=max(dot(normalize(R),uSol),0.);
  float alto=smoothstep(40.,220.,cameraPosition.y); // do alto, brilho largo e suave em vez de pontinhos
  cor+=uCorSol*(pow(rs,700.)*mix(9.,4.,uNoite)*(1.-alto*.85)+pow(rs,mix(70.,18.,alto))*mix(.3,.45,uNoite));
  float espuma=smoothstep(.9,1.5,vAlt/max(uAmp,.2))*(1.-alto);   // do alto a espuma vira pontilhado: some
  if(espuma>0.) espuma*=smoothstep(.45,.75,fbm2(vPos.xz*.6+t*.3));   // o ruído só nas cristas
  cor=mix(cor,vec3(.9,.95,1.)*mix(1.,.45,uNoite),espuma*.55);
  vec3 h=ceu(normalize(vec3(-V.x,.012,-V.z)),false);
  float dh=length(vPos.xz-cameraPosition.xz);
  cor=mix(cor,h,1.-exp(-dh*.0042));
  // ar entre a câmera e o mar quando se está no alto (casa com o brilho da atmosfera do planeta)
  cor=mix(cor,mix(uHorizonte,uZenite,.35),smoothstep(25.,300.,cameraPosition.y)*.38);
  cor=mix(cor,uCorVeu,uVeu);
  gl_FragColor=vec4(clamp(cor,0.,1.),1.);
}`;

const VERT_NUVEM = /* glsl */ `varying vec3 vPos; void main(){ vec4 w=modelMatrix*vec4(position,1.); vPos=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;
const FRAG_NUVEM = /* glsl */ `
precision highp float;
uniform float uTempo, uAlfa, uSemente; uniform vec3 uLuz, uSombra;
varying vec3 vPos;
${RUIDO2}
void main(){
  vec2 p=vPos.xz*.0055+vec2(uTempo*.006+uSemente,uSemente*.7);
  float n=fbm2(p)*.8+fbm2(p*2.3+7.1)*.2;
  float a=smoothstep(.46,.74,n);
  a*=1.-smoothstep(260.,600.,length(cameraPosition.xz-vPos.xz));
  a*=smoothstep(6.,60.,distance(cameraPosition,vPos));
  gl_FragColor=vec4(mix(uSombra,uLuz,smoothstep(.35,.8,n)),a*uAlfa);
}`;

// Paletas do céu e da água
const CEUS = {
  dia:        { zen: '#2A6DB5', hor: '#CFE3F5', sol: [-0.35, 0.42, -1], corSol: '#FFF4DE', noite: 0, funda: '#062A45', rasa: '#11708E', nuvem: ['#FFFFFF', '#A9BED3'], nevoa: ['#F2F7FC', '#C6DAEE'] },
  entardecer: { zen: '#23417A', hor: '#F2B487', sol: [0.05, 0.05, -1],  corSol: '#FFB070', noite: 0, funda: '#0A2238', rasa: '#2D5F78', nuvem: ['#FFD9C2', '#7C7C9E'], nevoa: ['#F6DCCB', '#B7A3B3'] },
  noite:      { zen: '#030B1C', hor: '#14294A', sol: [0.25, 0.22, -1],  corSol: '#C9D8F0', noite: 1, funda: '#020B16', rasa: '#0D2B44', nuvem: ['#53627C', '#1B2538'], nevoa: ['#5A6A84', '#26344D'] },
};
export const corDaNevoa = (nome) => (CEUS[nome] ?? CEUS.dia).nevoa;
export function ceuDaHora(h = new Date().getHours()) {
  return h >= 6 && h < 17 ? 'dia' : h >= 17 && h < 19 ? 'entardecer' : 'noite';
}

// Malha polar: muitos vértices perto da câmera, poucos no horizonte
function malhaPolar(aneis = 190, voltas = 256) {
  const pos = [], idx = [];
  pos.push(0, 0, 0);
  for (let i = 1; i <= aneis; i++) {
    const r = 0.45 * (Math.pow(1.04, i) - 1);
    for (let j = 0; j < voltas; j++) { const a = j / voltas * Math.PI * 2; pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); }
  }
  for (let j = 0; j < voltas; j++) idx.push(0, 1 + ((j + 1) % voltas), 1 + j);
  for (let i = 1; i < aneis; i++) {
    const a0 = 1 + (i - 1) * voltas, a1 = 1 + i * voltas;
    for (let j = 0; j < voltas; j++) {
      const j1 = (j + 1) % voltas;
      idx.push(a0 + j, a0 + j1, a1 + j, a0 + j1, a1 + j1, a1 + j);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}

const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const NUVENS_Y = [70, 140, 210];

export function criarOceano(container, opcoes = {}) {
  // tela cheia com shader pesado: 1,5x já fica nítido (céu e água são macios) e o MSAA só vale em tela comum
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const renderer = new THREE.WebGLRenderer({ antialias: dpr < 1.5, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);
  const canvas = renderer.domElement;
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);

  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 3000);
  const comum = {
    uSol: { value: new THREE.Vector3() }, uZenite: { value: new THREE.Color() }, uHorizonte: { value: new THREE.Color() },
    uCorSol: { value: new THREE.Color() }, uNoite: { value: 0 }, uTempo: { value: 0 },
    uVeu: { value: 0 }, uCorVeu: { value: new THREE.Color() },
  };
  const uAgua = { ...comum, uMare: { value: 0 }, uAmp: { value: 1 }, uCentro: { value: new THREE.Vector2() },
    uFunda: { value: new THREE.Color() }, uRasa: { value: new THREE.Color() } };

  const geoCeu = new THREE.SphereGeometry(1500, 48, 24);
  const matCeu = new THREE.ShaderMaterial({ uniforms: comum, vertexShader: VERT_CEU, fragmentShader: FRAG_CEU, side: THREE.BackSide, depthWrite: false });
  const ceu = new THREE.Mesh(geoCeu, matCeu); ceu.renderOrder = -2; ceu.frustumCulled = false;
  const geoAgua = malhaPolar();
  const matAgua = new THREE.ShaderMaterial({ uniforms: uAgua, vertexShader: VERT_AGUA, fragmentShader: FRAG_AGUA });
  const agua = new THREE.Mesh(geoAgua, matAgua); agua.frustumCulled = false;
  const geoNuvem = new THREE.PlaneGeometry(1400, 1400, 1, 1); geoNuvem.rotateX(-Math.PI / 2);
  const nuvens = NUVENS_Y.map((y, i) => {
    const m = new THREE.ShaderMaterial({
      uniforms: { uTempo: comum.uTempo, uAlfa: { value: 0 }, uSemente: { value: i * 13.7 }, uLuz: { value: new THREE.Color() }, uSombra: { value: new THREE.Color() } },
      vertexShader: VERT_NUVEM, fragmentShader: FRAG_NUVEM, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });
    const n = new THREE.Mesh(geoNuvem, m); n.position.y = y; n.frustumCulled = false; return n;
  });
  cena.add(ceu, agua, ...nuvens);

  let reduzido = !!opcoes.movimentoReduzido;
  let folego = 0, tempo = 0, anterior = performance.now();
  let voo = null; // {de, para, t0, dur, fim}
  const BAIXO = { y: 3.2, pitch: -0.035 }, ALTO = { y: 290, pitch: -1.52 };
  const cam = { ...ALTO };
  const aoNevoa = opcoes.aoNevoa ?? (() => {});

  function aplicarCeu(nome) {
    const p = CEUS[nome] ?? CEUS.dia;
    comum.uZenite.value.set(p.zen); comum.uHorizonte.value.set(p.hor); comum.uCorSol.value.set(p.corSol);
    comum.uSol.value.set(...p.sol).normalize(); comum.uNoite.value = p.noite;
    uAgua.uFunda.value.set(p.funda); uAgua.uRasa.value.set(p.rasa); comum.uCorVeu.value.set(p.nevoa[0]);
    nuvens.forEach((n) => { n.material.uniforms.uLuz.value.set(p.nuvem[0]); n.material.uniforms.uSombra.value.set(p.nuvem[1]); });
  }
  aplicarCeu(opcoes.ceu ?? ceuDaHora());

  function medir() {
    const r = container.getBoundingClientRect();
    renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
    camera.aspect = Math.max(1, r.width) / Math.max(1, r.height); camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(medir); ro.observe(container); medir();

  // névoa contínua: cheia lá em cima, some aos poucos até perto do mar (uma curva só, sem piscar)
  function nevoaEm(y) { const t = Math.max(0, Math.min(1, (y - 28) / (130 - 28))); return t * t * (3 - 2 * t); }

  // altura em escala logarítmica (cair parece natural); a câmera só levanta o olhar no fim da queda
  function voar(para, ms, curva) {
    return new Promise((ok) => {
      if (reduzido || ms <= 0) { Object.assign(cam, para); voo = null; ok(); return; }
      voo = { de: { ...cam }, para, t0: performance.now(), dur: ms, fim: ok, curva };
    });
  }

  function quadro(agora) {
    if (agora - anterior < 12) return;   // no máximo 60 quadros por segundo, mesmo em tela de 120 Hz
    const dt = Math.min(0.05, (agora - anterior) / 1000); anterior = agora;
    tempo += dt * (reduzido ? 0.35 : 1);
    comum.uTempo.value = tempo;
    let alfaNuvem = 0;
    if (voo) {
      const t = Math.min(1, (agora - voo.t0) / voo.dur);
      const eY = voo.curva === 'queda' ? 1 - Math.pow(1 - t, 2.2) : Math.pow(t, 2.2);
      const eP = voo.curva === 'queda' ? suave(Math.max(0, (t - 0.35) / 0.65)) : suave(Math.min(1, t / 0.65));
      cam.y = Math.exp(Math.log(voo.de.y) + (Math.log(voo.para.y) - Math.log(voo.de.y)) * eY);
      cam.pitch = voo.de.pitch + (voo.para.pitch - voo.de.pitch) * eP;
      alfaNuvem = 0.9;
      if (t >= 1) { const f = voo.fim; voo = null; f(); }
    }
    nuvens.forEach((n) => { n.material.uniforms.uAlfa.value += (alfaNuvem - n.material.uniforms.uAlfa.value) * Math.min(1, dt * 2); });
    // véu suave quando a câmera passa por dentro de uma camada (no máximo 30%)
    let veu = 0; for (const ny of NUVENS_Y) veu = Math.max(veu, Math.exp(-Math.pow((cam.y - ny) / 14, 2)));
    comum.uVeu.value = voo ? veu * 0.3 : 0;
    aoNevoa(0);
    const bob = reduzido ? 0 : 0.35 * folego;
    camera.position.set(0, cam.y + bob + uAgua.uMare.value * 0.4, 0);
    camera.rotation.set(cam.pitch, 0, 0, 'YXZ');
    uAgua.uMare.value += (folego - uAgua.uMare.value) * Math.min(1, dt * 6);
    uAgua.uAmp.value = reduzido ? 0.55 : 0.9 + 0.2 * folego;
    renderer.render(cena, camera);
  }
  renderer.compile(cena, camera);
  let ligado = false;
  const ligar = () => { if (!ligado) { ligado = true; anterior = performance.now(); renderer.setAnimationLoop(quadro); } };
  const desligar = () => { ligado = false; renderer.setAnimationLoop(null); };
  if (!opcoes.pausado) ligar(); else renderer.render(cena, camera); // um quadro já aquece os shaders

  return {
    canvas, ligar, desligar,
    preparar() { voo = null; Object.assign(cam, ALTO); nuvens.forEach((n) => { n.material.uniforms.uAlfa.value = 0.9; }); renderer.render(cena, camera); },
    descer(ms = 3600) { Object.assign(cam, ALTO); return voar(BAIXO, ms, 'queda'); },
    subir(ms = 1700) { return voar(ALTO, ms, 'subida'); },
    pousar() { Object.assign(cam, BAIXO); },
    setFolego(v) { folego = v; },
    setCeu: aplicarCeu,
    setOpcoes({ movimentoReduzido } = {}) { if (movimentoReduzido !== undefined) reduzido = movimentoReduzido; },
    dispose() {
      renderer.setAnimationLoop(null); ro.disconnect();
      [geoCeu, matCeu, geoAgua, matAgua, geoNuvem, ...nuvens.map((n) => n.material)].forEach((x) => x.dispose());
      renderer.dispose(); canvas.remove();
    },
  };
}

// ---------- som do mar ----------
// Áudio em loop sem emenda (Web Audio). O contexto abre dentro do toque, mas o volume só sobe depois.
// Um filtro passa-baixa tira o chiado agudo e deixa o som mais macio.
export function criarSomDoMar(url) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const filtro = ctx.createBiquadFilter(); filtro.type = 'lowpass'; filtro.frequency.value = 2400; filtro.Q.value = 0.5;
  const ganho = ctx.createGain(); ganho.gain.value = 0;
  filtro.connect(ganho).connect(ctx.destination);
  let fonte = null, buffer = null, querTocar = false;
  fetch(url).then((r) => r.arrayBuffer()).then((b) => new Promise((ok, erro) => ctx.decodeAudioData(b, ok, erro)))
    .then((b) => { buffer = b; if (querTocar) iniciar(); }).catch(() => {});
  function iniciar() {
    if (fonte || !buffer) return;
    fonte = ctx.createBufferSource(); fonte.buffer = buffer; fonte.loop = true;
    fonte.loopStart = 0.06; fonte.loopEnd = buffer.duration - 0.02;
    fonte.connect(filtro); fonte.start(0, 0.06);
  }
  return {
    abrir() { querTocar = true; ctx.resume(); iniciar(); },   // dentro do toque, ainda em silêncio
    volume(v, segundos = 3) {
      const t = ctx.currentTime;
      ganho.gain.cancelScheduledValues(t); ganho.gain.setValueAtTime(ganho.gain.value, t);
      ganho.gain.linearRampToValueAtTime(v, t + segundos);
    },
  };
}
