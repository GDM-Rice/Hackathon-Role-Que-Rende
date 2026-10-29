// Terraforma · planeta 3D
// Um único módulo, sem framework: serve para o protótipo e para o componente React do repositório.
// Regras de desempenho seguidas (three-best-practices, MIT): setAnimationLoop, pixel ratio <= 2,
// nada alocado dentro do loop, texturas em potência de dois, dispose completo ao desmontar.
import * as THREE from 'three';

const GRAU = Math.PI / 180;

// Regras do jogo (iguais às do canvas de design)
export const REGIOES = ['Sul', 'Sudeste', 'Centro-Oeste', 'Nordeste', 'Norte'];
export const LIMIARES = [7, 14, 30, 60, 90];
export const RIOS = ['Amazonas', 'São Francisco', 'Paraná'];

// dias, marés e marcos -> o que o planeta mostra. Nada regride: só depende de contadores que só sobem.
export function estadoDoPlaneta({ dias = 1, mares = 0, rios = {}, tempestade = false } = {}) {
  const rec = LIMIARES.map((lim, i) => {
    if (dias >= lim) return 1;
    const anterior = i ? LIMIARES[i - 1] : 0;
    if (dias >= anterior) return 0.12 + 0.38 * (dias - anterior) / (lim - anterior); // brotando
    return 0;
  });
  return {
    rec,
    mar: mares >= 10 ? 1 : mares >= 3 ? 0.5 : 0,
    rios: [rios.amazonas ? 1 : 0, rios.saoFrancisco ? 1 : 0, rios.parana ? 1 : 0],
    tempestade: tempestade ? 1 : 0,
  };
}

export function descreverPlaneta(e) {
  const verdes = e.rec.filter((r) => r >= 1).length;
  const mar = e.mar >= 1 ? 'limpo' : e.mar > 0 ? 'limpando' : 'poluído';
  const rios = e.rios.filter(Boolean).length;
  return `Planeta: ${verdes} de 5 regiões do Brasil recuperadas, mar ${mar}, ${rios} de 3 rios correndo` +
    (e.tempestade ? ', dia de tempestade' : '');
}

// Respiração da Maré: inspira 4 s, solta 6 s
export function respiracao(segundos) {
  const t = ((segundos % 10) + 10) % 10;
  const suave = (x) => 0.5 - 0.5 * Math.cos(Math.PI * x);
  return t < 4 ? { fase: 'Inspire', v: suave(t / 4), resta: Math.ceil(4 - t) }
               : { fase: 'Solte', v: 1 - suave((t - 4) / 6), resta: Math.ceil(10 - t) };
}

// ---------- GLSL ----------
// Ruído simplex 3D: Ashima Arts / Stefan Gustavson (licença MIT)
const RUIDO = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*snoise(p);p*=2.03;a*=.5;}return s;}
`;

const VERT = /* glsl */ `
varying vec2 vUv; varying vec3 vN; varying vec3 vP; varying vec3 vObj;
void main(){
  vUv=uv; vObj=position;
  vec4 w=modelMatrix*vec4(position,1.);
  vP=w.xyz; vN=normalize(mat3(modelMatrix)*normal);
  gl_Position=projectionMatrix*viewMatrix*w;
}`;

const fragTerra = (peca, fragmentado = false) => /* glsl */ `
precision highp float;
${peca ? '#define PECA' : ''}
${fragmentado ? '#define FRAGMENTADO' : ''}
uniform sampler2D uDia, uAgua, uRegioes, uLinhas, uRiosT;
uniform vec4 uCaixa;
uniform float uRec[5];
uniform vec3 uRios, uLuz;
uniform float uMar, uGlobal, uTempo, uPadrao, uDestaque, uPulso;
uniform float uMinha, uSolta;
varying vec2 vUv; varying vec3 vN; varying vec3 vP; varying vec3 vObj;
${RUIDO}
vec2 hash22(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
float rachaduras(vec2 p){
  vec2 i=floor(p),f=fract(p);float d1=8.,d2=8.;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
    vec2 g=vec2(float(x),float(y));vec2 r=g+hash22(i+g)-f;float d=dot(r,r);
    if(d<d1){d2=d1;d1=d;}else if(d<d2){d2=d;}
  }
  return sqrt(d2)-sqrt(d1);
}
vec3 seco(vec3 c){
  float l=dot(c,vec3(.3,.59,.11));
  vec3 t=mix(vec3(.5,.35,.19),vec3(.8,.64,.42),smoothstep(.06,.38,l));
  return t*(.82+.5*l);
}
vec3 viva(vec3 c){
  float l=dot(c,vec3(.3,.59,.11));
  vec3 v=mix(vec3(.13,.32,.08),vec3(.38,.58,.19),smoothstep(.04,.3,l));
  return mix(v,c*vec3(.9,1.15,.85),.22);
}
float idEm(vec2 m){return floor(texture2D(uRegioes,m).r*255./40.+.5);}
void main(){
#ifdef PECA
  // a placa cobre só um pedaço da esfera: a coordenada vem da posição, não do uv da malha
  vec3 q=normalize(vObj);
  float ph=atan(q.z,-q.x); if(ph<0.) ph+=6.2831853;
  vec2 uv=vec2(ph/6.2831853,1.-acos(clamp(q.y,-1.,1.))/3.1415927);
#else
  vec2 uv=vUv;
#endif
  vec3 base=texture2D(uDia,uv).rgb;
  float agua=smoothstep(.35,.65,texture2D(uAgua,uv).r);
  float lon=uv.x*360.-180., lat=uv.y*180.-90.;
  vec2 bp=vec2((lon-uCaixa.x)/(uCaixa.y-uCaixa.x),(uCaixa.w-lat)/(uCaixa.w-uCaixa.z));
  float dentro=step(0.,bp.x)*step(bp.x,1.)*step(0.,bp.y)*step(bp.y,1.);
  vec2 mt=vec2(bp.x,1.-bp.y);
  float rid=0.; vec4 lin=vec4(0.), rv=vec4(0.);
  if(dentro>.5){ rid=idEm(mt); lin=texture2D(uLinhas,mt); rv=texture2D(uRiosT,mt); }
#ifdef PECA
  if(abs(rid-uMinha)>.5) discard;
#endif

  // O resto do mundo acompanha o progresso médio, sem detalhe
  vec3 cor=mix(base,mix(base,seco(base),.75),(1.-uGlobal)*.6);

  if(rid>.5){
    float r=rid<1.5?uRec[0]:rid<2.5?uRec[1]:rid<3.5?uRec[2]:rid<4.5?uRec[3]:uRec[4];
    float k=r*1.25-.12;
    float nn=fbm(vObj*9.)*.5+.5;
    float t=smoothstep(nn-.05,nn+.05,k);
    vec3 sec=seco(base);
    float rach=1.-smoothstep(0.,.05,rachaduras(bp*vec2(46.,45.)));
    sec=mix(sec,vec3(.36,.22,.1),rach*.4);
    vec3 verde=viva(base);
    if(uPadrao>.5){
      // Daltonismo: seco fica escuro e listrado, verde fica claro. A diferença não depende de cor.
      float faixa=step(.5,fract((bp.x+bp.y)*70.));
      sec=mix(sec*.55,sec*.9,faixa);
      verde=mix(verde,vec3(.86,.93,.8),.45);
    }
    cor=mix(sec,verde,t);
    float frente=smoothstep(.07,0.,abs(nn-k))*step(.001,r)*step(r,.999);
    cor+=vec3(.5,.6,.22)*frente*.55;
    cor=mix(cor,vec3(.22,.12,.05),lin.a*(1.-t)*.8);
    if(abs(rid-uDestaque)<.5) cor=mix(cor,vec3(1.),.14+.12*uPulso);
    agua=0.;
#ifdef PECA
    // penhasco na borda da placa enquanto ela está solta
    float e=1.8/1024.;
    float dif4=abs(idEm(mt+vec2(e,0.))-rid)+abs(idEm(mt-vec2(e,0.))-rid)+abs(idEm(mt+vec2(0.,e))-rid)+abs(idEm(mt-vec2(0.,e))-rid);
    float borda=step(.5,dif4)*min(1.,uSolta*5.);
    cor=mix(cor,vec3(.24,.14,.06),borda*.9);
#else
#ifdef FRAGMENTADO
    // no planeta, onde a placa saiu fica o mar escuro entrando pela fenda
    if(r<.999){
      float fundo=fbm(vObj*14.+vec3(0.,uTempo*.02,0.))*.5+.5;
      vec3 abismo=mix(vec3(.02,.07,.13),vec3(.07,.17,.27),fundo);
      abismo=mix(mix(abismo,vec3(.09,.1,.08),.55),abismo,uMar);
      cor=abismo; lin=vec4(0.);
    }
#endif
#endif
  }
  // Rios: cada bacia é um campo suave (miolo = água, cauda = margem). Seco, o leito é um sulco de lama rachada;
  // quando o marco chega, a água desce das nascentes até a foz e a mata ciliar volta junto.
  float rioAgua=0.;
  if(dentro>.5 && max(rv.r,max(rv.g,rv.b))>.02){
    vec3 f=rv.rgb; float ao=rv.a;
    vec3 lim=vec3(1.06)-uRios*1.1;
    vec3 chegou=smoothstep(-.025,.025,vec3(ao)-lim);
    vec3 miolo=clamp((f-.45)/.55,0.,1.), cauda=clamp(f/.45,0.,1.);
    float larg=mix(.25,.55,ao);                       // mais largo perto da foz, fino nas nascentes
    vec3 nuc=smoothstep(vec3(larg),vec3(larg+.18),miolo), mar=smoothstep(.04,.7,cauda)*(1.-nuc);
    float molhado=dot(nuc,chegou), seco=dot(nuc,1.-chegou);
    float mata=dot(mar,chegou), barranco=dot(mar,1.-chegou);
    float irr=fbm(vObj*55.)*.5+.5;                    // quebra a linha: nada de traço contínuo
    // seco: sulco raso de lama rachada, que some e volta pelo caminho
    float lama=1.-smoothstep(0.,.08,rachaduras(bp*vec2(150.)));
    vec3 sulco=mix(cor*vec3(.8,.72,.64),vec3(.52,.38,.24),.3);
    sulco=mix(sulco,vec3(.33,.21,.11),lama*.5);
    cor=mix(cor,sulco,seco*(.35+.4*irr));
    cor+=vec3(.06,.05,.03)*barranco*.5*irr;
    // margem viva: mata ciliar em manchas, mais densa junto da água
    float folhas=fbm(vObj*90.)*.5+.5;
    float densa=smoothstep(.25,.75,irr*.6+folhas*.6)*mata;
    cor=mix(cor,mix(vec3(.06,.22,.06),vec3(.2,.42,.12),folhas),densa*.85);
    // terra úmida na beira da água
    float beira=dot(smoothstep(vec3(larg-.18),vec3(larg+.02),miolo)*(1.-nuc)*chegou,vec3(1.));
    cor=mix(cor,cor*vec3(.55,.5,.42),beira*.6);
    // água: verde-azulada nas bordas, mais funda e escura no meio, ondinhas andando e reflexo do céu
    float fundo=smoothstep(.6,1.,max(miolo.r,max(miolo.g,miolo.b)));
    float ond=fbm(vObj*240.+vec3(uTempo*.35,0.,uTempo*.2))*.5+.5;
    vec3 aguaRio=mix(vec3(.13,.36,.42),vec3(.04,.19,.32),fundo);
    aguaRio=mix(aguaRio,vec3(.45,.62,.78),.05+.1*ond);
    vec3 dist=abs(vec3(ao)-lim);
    float frente=dot(nuc*smoothstep(.05,0.,dist)*step(.002,uRios)*step(uRios,vec3(.998)),vec3(1.));
    aguaRio=mix(aguaRio,vec3(.88,.96,1.),frente*.55);
    cor=mix(cor,aguaRio,molhado*.92);
    rioAgua=molhado;
  }

  // Mar: turvo e manchado até as Marés limparem
  vec3 limpo=base*vec3(.95,1.05,1.14);
  vec3 oceano=limpo;
  if(uMar<.999){
    float manchas=smoothstep(.05,.55,fbm(vObj*5.+vec3(uTempo*.01,0.,0.)));
    vec3 turvo=mix(vec3(.31,.34,.28),vec3(.23,.21,.15),manchas)*(.75+.6*base.b);
    oceano=mix(mix(base,turvo,.75),limpo,uMar);
  }
  cor=mix(cor,oceano,agua);

  vec3 N=normalize(vN), V=normalize(cameraPosition-vP), L=normalize(uLuz);
  float dif=smoothstep(-.2,.8,dot(N,L));
  cor*=.4+.76*dif;
  vec3 H=normalize(L+V);
  cor+=vec3(1.,.97,.9)*pow(max(dot(N,H),0.),70.)*(agua*(.2+.8*uMar)+rioAgua*.35)*.55;
  float fr=pow(1.-max(dot(N,V),0.),2.6);
  cor=mix(cor,vec3(.45,.68,.98),fr*.55);
  gl_FragColor=vec4(cor,1.);
}`;

// Para onde cada região se afasta quando está seca (graus de longitude, latitude)
const DERIVA = [[-3, -4.5], [4.5, -3], [-5, -1.5], [5, 2.5], [-2, 5]];
function direcao(lon, lat, alvo) {
  const ph = (lon + 180) / 360 * Math.PI * 2, th = (90 - lat) / 180 * Math.PI;
  return alvo.set(-Math.cos(ph) * Math.sin(th), Math.cos(th), Math.sin(ph) * Math.sin(th));
}
const suaveJS = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

const FRAG_NUVENS = /* glsl */ `
precision highp float;
uniform float uTempo, uTempestade, uForca; uniform vec3 uLuz;
varying vec2 vUv; varying vec3 vN; varying vec3 vP; varying vec3 vObj;
${RUIDO}
void main(){
  float a=uTempo*.012; float c0=cos(a), s0=sin(a);
  vec3 p=vObj; p.xz=mat2(c0,-s0,s0,c0)*p.xz;
  float n=fbm(p*2.6+vec3(0.,uTempo*.004,0.))*.5+.5;
  float n2=snoise(p*7.)*.25+.5;   // detalhe fino: uma oitava só (fbm aqui custava 4 ruídos por pixel do planeta inteiro)
  float limiar=mix(.58,.4,uTempestade);
  float alfa=smoothstep(limiar,limiar+.22,n*.8+n2*.2);
  vec3 N=normalize(vN), L=normalize(uLuz), V=normalize(cameraPosition-vP);
  float dif=smoothstep(-.2,.8,dot(N,L));
  vec3 cor=mix(vec3(1.)*(.55+.5*dif),vec3(.5,.54,.62)*(.5+.5*dif),uTempestade);
  float limbo=pow(1.-max(dot(N,V),0.),3.);
  gl_FragColor=vec4(cor,alfa*mix(.72,.94,uTempestade)*(1.-limbo*.6)*uForca);
}`;

// Halo da atmosfera: um plano voltado para a câmera, com gradiente a partir da silhueta real da esfera
const VERT_HALO = /* glsl */ `varying vec2 vQ; void main(){ vQ=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const FRAG_HALO = /* glsl */ `
precision highp float;
uniform vec3 uCor; uniform float uForca, uSil;
varying vec2 vQ;
void main(){
  float d=length(vQ);
  float g=1.-smoothstep(0.,.15*uSil,d-uSil);
  float a=pow(g,2.4)*step(uSil*.96,d);
  gl_FragColor=vec4(uCor,a*uForca);
}`;

// ---------- utilidades ----------
const suavizar = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // ease in-out cúbico
const sair = (t) => 1 - Math.pow(1 - t, 3); // ease out cúbico
const lerp = (a, b, t) => a + (b - a) * t;
function lerpAngulo(a, b, t) { let d = ((b - a + 540) % 360) - 180; return a + d * t; }

function carregarImagem(url) {
  return new Promise((ok, erro) => { const im = new Image(); im.onload = () => ok(im); im.onerror = erro; im.src = url; });
}

// ---------- o planeta ----------
export async function criarGlobo(container, opcoes = {}) {
  const fragmentado = !!opcoes.fragmentado; // placas soltas que se juntam (desligado: o Brasil só reverdece)
  const base = opcoes.assets ?? 'assets/';
  const info = await fetch(base + 'brasil.json').then((r) => r.json());
  // carga progressiva: primeiro uma Terra leve (~50 KB) para o planeta aparecer logo;
  // a textura de 4K e os rios chegam depois e trocam no lugar, sem piscar
  const [imDia, imAgua, imReg, imLin] = await Promise.all(
    ['terra-dia-baixa.webp', 'terra-agua.png', 'brasil-regioes.png', 'brasil-linhas.png'].map((f) => carregarImagem(base + f)));
  const imRios = document.createElement('canvas'); imRios.width = imRios.height = 4;   // sem rios até o arquivo chegar

  // máscara das regiões também na CPU, para saber em que região o toque caiu
  const cv = document.createElement('canvas'); cv.width = imReg.width; cv.height = imReg.height;
  const ctx = cv.getContext('2d', { willReadFrequently: true }); ctx.drawImage(imReg, 0, 0);
  const pixelsRegiao = ctx.getImageData(0, 0, cv.width, cv.height).data;

  // em telas densas (celular) o pixel já é pequeno: o MSAA quase não aparece e pesa muito na GPU
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const renderer = new THREE.WebGLRenderer({ antialias: dpr < 1.5, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;outline:none;opacity:0;transition:opacity 700ms cubic-bezier(.2,.8,.2,1)';
  canvas.setAttribute('role', 'img');
  canvas.tabIndex = 0;
  container.appendChild(canvas);

  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
  const tex = (im, nearest) => {
    const t = new THREE.Texture(im); t.needsUpdate = true;
    t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    if (nearest) { t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; }
    return t;
  };
  const texturas = [tex(imDia), tex(imAgua), tex(imReg, true), tex(imLin), tex(imRios)];
  const luz = new THREE.Vector3(-0.55, 0.42, 0.95).normalize();

  const uTerra = {
    uDia: { value: texturas[0] }, uAgua: { value: texturas[1] }, uRegioes: { value: texturas[2] }, uLinhas: { value: texturas[3] }, uRiosT: { value: texturas[4] },
    uCaixa: { value: new THREE.Vector4(...info.caixa) },
    uRec: { value: [0, 0, 0, 0, 0] }, uRios: { value: new THREE.Vector3() }, uLuz: { value: luz },
    uMar: { value: 0 }, uGlobal: { value: 0 }, uTempo: { value: 0 }, uPadrao: { value: 0 }, uDestaque: { value: -1 }, uPulso: { value: 0 },
    uMinha: { value: 0 }, uSolta: { value: 0 },
  };
  const uNuvens = { uTempo: uTerra.uTempo, uTempestade: { value: 0 }, uForca: { value: 1 }, uLuz: { value: luz } };
  let forcaNuvens = 1;
  const uHalo = { uCor: { value: new THREE.Color('#6FA8E8') }, uForca: { value: 0.42 }, uSil: { value: 1.04 } };

  const grupo = new THREE.Group(); grupo.rotation.order = 'XYZ'; cena.add(grupo);
  const geoTerra = new THREE.SphereGeometry(1, 160, 80);
  const geoNuvens = new THREE.SphereGeometry(1.014, 96, 48);
  const geoHalo = new THREE.PlaneGeometry(3.4, 3.4);
  const matTerra = new THREE.ShaderMaterial({ uniforms: uTerra, vertexShader: VERT, fragmentShader: fragTerra(false, fragmentado) });
  const matNuvens = new THREE.ShaderMaterial({ uniforms: uNuvens, vertexShader: VERT, fragmentShader: FRAG_NUVENS, transparent: true, depthWrite: false });
  const matHalo = new THREE.ShaderMaterial({ uniforms: uHalo, vertexShader: VERT_HALO, fragmentShader: FRAG_HALO, transparent: true, depthWrite: false });
  const terra = new THREE.Mesh(geoTerra, matTerra); terra.name = 'terra';
  const nuvens = new THREE.Mesh(geoNuvens, matNuvens); nuvens.name = 'nuvens';
  const halo = new THREE.Mesh(geoHalo, matHalo); halo.name = 'halo'; halo.renderOrder = -1;
  grupo.add(terra, nuvens); cena.add(halo);

  // ---------- placas do Brasil: uma por região, soltas enquanto secas ----------
  const caixas = [1, 2, 3, 4, 5].map(() => [1e9, -1e9, 1e9, -1e9]);
  for (let y = 0; y < cv.height; y += 2) for (let x = 0; x < cv.width; x += 2) {
    const id = Math.round(pixelsRegiao[(y * cv.width + x) * 4] / 40);
    if (id < 1 || id > 5) continue;
    const c = caixas[id - 1];
    if (x < c[0]) c[0] = x; if (x > c[1]) c[1] = x; if (y < c[2]) c[2] = y; if (y > c[3]) c[3] = y;
  }
  const [L0, L1, A0, A1] = info.caixa;
  const pecas = !fragmentado ? [] : caixas.map((c, i) => {
    const lon0 = L0 + c[0] / cv.width * (L1 - L0) - 0.6, lon1 = L0 + c[1] / cv.width * (L1 - L0) + 0.6;
    const lat1 = A1 - c[2] / cv.height * (A1 - A0) + 0.6, lat0 = A1 - c[3] / cv.height * (A1 - A0) - 0.6;
    const geo = new THREE.SphereGeometry(1, Math.max(8, Math.ceil((lon1 - lon0) / 0.4)), Math.max(8, Math.ceil((lat1 - lat0) / 0.4)),
      (lon0 + 180) / 360 * Math.PI * 2, (lon1 - lon0) / 360 * Math.PI * 2, (90 - lat1) / 180 * Math.PI, (lat1 - lat0) / 180 * Math.PI);
    const mat = new THREE.ShaderMaterial({ uniforms: { ...uTerra, uMinha: { value: i + 1 }, uSolta: { value: 0 } }, vertexShader: VERT, fragmentShader: fragTerra(true) });
    const malha = new THREE.Mesh(geo, mat); malha.name = 'placa-' + (i + 1);
    const [clon, clat] = info.centros[i + 1];
    const de = direcao(clon, clat, new THREE.Vector3()), para = direcao(clon + DERIVA[i][0], clat + DERIVA[i][1], new THREE.Vector3());
    malha.userData = { id: i, qMax: new THREE.Quaternion().setFromUnitVectors(de, para), eixo: de.clone() };
    grupo.add(malha);
    return malha;
  });
  const qTmp = new THREE.Quaternion(), qId = new THREE.Quaternion(), vTmp = new THREE.Vector3();

  // ---------- Órbita: pessoas de confiança como satélites ----------
  // Não giram com a Terra (ficam fora do grupo), passam por trás do planeta e não mudam nada nele.
  // Cada órbita é um anel 3D fino (tubo) que só acende como um rastro atrás do satélite.
  const luzSol = new THREE.DirectionalLight(0xffffff, 2.2); luzSol.position.copy(luz).multiplyScalar(5);
  const luzAmb = new THREE.HemisphereLight(0xdcecff, 0x0b2a4a, 0.9);
  const orbita = new THREE.Group(); orbita.visible = false; cena.add(orbita, luzSol, luzAmb);
  const satelites = [];
  // inclinações pequenas e nós diferentes: as órbitas se cruzam na frente e atrás do planeta
  const ORBITAS = [ { r: 1.34, inc: 16, no: -28 }, { r: 1.55, inc: -22, no: 35 }, { r: 1.76, inc: 9, no: 80 } ];
  let periodoVolta = opcoes.periodoVolta ?? 40, aoVolta = opcoes.aoVoltaSatelite ?? (() => {});
  const VERT_RASTRO = `varying vec3 vL; void main(){ vL=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
  const FRAG_RASTRO = `uniform vec3 uCor; uniform float uAng, uForca; varying vec3 vL;
    void main(){ float a=atan(vL.z,vL.x); float d=mod(uAng-a,6.2831853);
      float rastro=1.-smoothstep(0.,2.6,d); float alfa=(.07+.85*rastro*rastro)*uForca;
      gl_FragColor=vec4(mix(uCor,vec3(1.),rastro*.35),alfa); }`;
  // painel solar com células (textura feita no código)
  const cvP = document.createElement('canvas'); cvP.width = 128; cvP.height = 48;
  const xP = cvP.getContext('2d'); xP.fillStyle = '#16305C'; xP.fillRect(0, 0, 128, 48);
  xP.strokeStyle = '#6E9BD8'; xP.lineWidth = 2;
  for (let k = 0; k <= 8; k++) { xP.beginPath(); xP.moveTo(k * 16, 0); xP.lineTo(k * 16, 48); xP.stroke(); }
  for (let k = 0; k <= 3; k++) { xP.beginPath(); xP.moveTo(0, k * 16); xP.lineTo(128, k * 16); xP.stroke(); }
  const texPainel = new THREE.CanvasTexture(cvP); texPainel.colorSpace = THREE.SRGBColorSpace;
  const geoCorpo = new THREE.BoxGeometry(0.09, 0.12, 0.09);
  const geoPainel = new THREE.BoxGeometry(0.24, 0.008, 0.09);
  const geoBraco = new THREE.CylinderGeometry(0.006, 0.006, 0.08, 6); geoBraco.rotateZ(Math.PI / 2);
  const geoAntena = new THREE.ConeGeometry(0.045, 0.035, 18, 1, true); geoAntena.rotateX(Math.PI);
  const geoFaixa = new THREE.TorusGeometry(0.066, 0.012, 8, 24); geoFaixa.rotateX(Math.PI / 2);
  const matPainel = new THREE.MeshStandardMaterial({ map: texPainel, metalness: 0.4, roughness: 0.35, emissive: '#0B2A4A', emissiveIntensity: 0.4 });
  const matOuro = new THREE.MeshStandardMaterial({ color: '#D8B25C', metalness: 0.75, roughness: 0.3, emissive: '#3A2A08', emissiveIntensity: 0.3 });
  const matBranco = new THREE.MeshStandardMaterial({ color: '#E8EEF5', metalness: 0.2, roughness: 0.5, side: THREE.DoubleSide });
  function etiqueta(letra, cor, borda) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    x.beginPath(); x.arc(64, 64, 54, 0, Math.PI * 2); x.fillStyle = '#FFFFFF'; x.fill(); x.lineWidth = 10; x.strokeStyle = borda; x.stroke();
    x.fillStyle = borda; x.font = '700 64px "Atkinson Hyperlegible", system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(letra, 64, 68);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function limparSatelites() {
    satelites.forEach((st) => { st.pivo.removeFromParent(); st.disp.forEach((d) => d.dispose()); });
    satelites.length = 0;
  }
  function setSatelites(lista) {
    limparSatelites();
    lista.slice(0, 3).forEach((p, i) => {
      const o = ORBITAS[i];
      const pivo = new THREE.Group(); pivo.rotation.set(o.inc * GRAU, o.no * GRAU, 0, 'YXZ'); orbita.add(pivo);
      const geoAnel = new THREE.TorusGeometry(o.r, 0.01, 6, 220); geoAnel.rotateX(Math.PI / 2);
      const matAnel = new THREE.ShaderMaterial({ uniforms: { uCor: { value: new THREE.Color(p.cor) }, uAng: { value: 0 }, uForca: { value: 1 } },
        vertexShader: VERT_RASTRO, fragmentShader: FRAG_RASTRO, transparent: true, depthWrite: false });
      pivo.add(new THREE.Mesh(geoAnel, matAnel));
      const sat = new THREE.Group();
      const matCor = new THREE.MeshStandardMaterial({ color: p.cor, metalness: 0.2, roughness: 0.45, emissive: p.cor, emissiveIntensity: 0.25 });
      const corpo = new THREE.Mesh(geoCorpo, matOuro);
      const faixa = new THREE.Mesh(geoFaixa, matCor);
      const pE = new THREE.Mesh(geoPainel, matPainel), pD = new THREE.Mesh(geoPainel, matPainel);
      pE.position.x = -0.2; pD.position.x = 0.2;
      const bE = new THREE.Mesh(geoBraco, matBranco), bD = new THREE.Mesh(geoBraco, matBranco); bE.position.x = -0.07; bD.position.x = 0.07;
      const antena = new THREE.Mesh(geoAntena, matBranco); antena.position.y = 0.085;
      const tex = etiqueta(p.nome[0].toUpperCase(), p.cor, p.borda || '#042C53');
      const matRot = new THREE.SpriteMaterial({ map: tex, depthTest: true });
      const rotulo = new THREE.Sprite(matRot); rotulo.scale.setScalar(0.17); rotulo.position.y = 0.21;
      sat.add(corpo, faixa, pE, pD, bE, bD, antena, rotulo); pivo.add(sat);
      satelites.push({ pivo, sat, anel: matAnel, fase: i * 2.1, voltas: 0, periodo: periodoVolta * (1 + i * 0.35), disp: [geoAnel, matAnel, matCor, tex, matRot] });
    });
  }
  const t0Orbita = performance.now();
  function proximaVolta(i) {
    const st = satelites[i]; if (!st) return null;
    const t = (performance.now() - t0Orbita) / 1000;
    return st.periodo - (t % st.periodo);
  }

  // ---------- estado de cena ----------
  const BRASIL = { lon: -53, lat: -13 };
  const vista = { lon: BRASIL.lon + 150, lat: BRASIL.lat, cx: 0, cy: 0, r: 0, opacidade: 1 };
  let alvoVista = null;            // transição em andamento {de, para, t0, dur}
  let foco = { ...BRASIL };        // para onde o planeta volta quando ninguém mexe
  let balanco = true;              // balanço suave em torno do foco (só no Início)
  const alvo = { rec: [0, 0, 0, 0, 0], mar: 0, rios: [0, 0, 0], tempestade: 0 };
  const atual = { rec: [0, 0, 0, 0, 0], mar: 0, rios: [0, 0, 0], tempestade: 0 };
  let reduzido = !!opcoes.movimentoReduzido;
  let pausado = false;
  let respirarDesde = null;
  let destaque = -1;
  let largura = 1, altura = 1;
  let ultimoToque = -1e9, arrastando = false, vel = { lon: 0, lat: 0 };
  let tempo = 0, intro = reduzido ? null : { t0: performance.now(), dur: 2400, de: vista.lon };
  const aoTocarRegiao = opcoes.aoTocarRegiao ?? (() => {});
  let estado = estadoDoPlaneta();

  function medir() {
    const r = container.getBoundingClientRect();
    largura = Math.max(1, r.width); altura = Math.max(1, r.height);
    renderer.setSize(largura, altura, false);
    camera.aspect = largura / altura;
  }
  const ro = new ResizeObserver(medir); ro.observe(container); medir();

  // posiciona a esfera num "lugar" da tela: centro (cx, cy) e raio em pixels
  function aplicarCamera() {
    const tanMeio = Math.tan(camera.fov * GRAU / 2);
    const k = (altura / 2) / (Math.max(vista.r, 1) * tanMeio);
    const D = Math.sqrt(1 + k * k);
    camera.position.set(0, 0, D);
    camera.near = Math.max(0.02, D - 1.3);
    camera.setViewOffset(largura, altura, largura / 2 - vista.cx, altura / 2 - vista.cy, largura, altura);
    camera.updateProjectionMatrix();
    uHalo.uSil.value = 1 / Math.sqrt(1 - 1 / (D * D));
    canvas.style.opacity = vista.opacidade;
  }

  // curva: 'inout' (padrão), 'queda' (zoom acelera, em escala logarítmica) ou 'subida' (zoom desacelera)
  function irPara(lugar, ms = 900, curva = 'inout') {
    const para = { ...vista, ...lugar };
    if (lugar.lon === undefined) { para.lon = foco.lon; para.lat = foco.lat; }
    if (reduzido || ms <= 0 || vista.r === 0) { Object.assign(vista, para); alvoVista = null; return; }
    alvoVista = { de: { ...vista }, para, t0: performance.now(), dur: ms, curva };
    intro = null; ocioso = false;
  }

  // ---------- interação ----------
  const ray = new THREE.Raycaster(), ponteiro = new THREE.Vector2();
  let inicio = null;
  function regiaoEm(x, y) {
    ponteiro.set((x / largura) * 2 - 1, -(y / altura) * 2 + 1);
    ray.setFromCamera(ponteiro, camera);
    const hits = ray.intersectObjects([...pecas, terra], false);
    for (const hit of hits) {
      if (hit.object === terra) return idEmUv(hit.uv.x * 360 - 180, hit.uv.y * 180 - 90);
      vTmp.copy(hit.point); hit.object.worldToLocal(vTmp).normalize();
      let ph = Math.atan2(vTmp.z, -vTmp.x); if (ph < 0) ph += Math.PI * 2;
      const id = idEmUv(ph / (Math.PI * 2) * 360 - 180, 90 - Math.acos(Math.max(-1, Math.min(1, vTmp.y))) * 180 / Math.PI);
      if (id === hit.object.userData.id) return id;
    }
    return -1;
  }
  function idEmUv(lon, lat) {
    const [l0, l1, a0, a1] = info.caixa;
    const bx = (lon - l0) / (l1 - l0), by = (a1 - lat) / (a1 - a0);
    if (bx < 0 || bx > 1 || by < 0 || by > 1) return -1;
    const px = Math.min(cv.width - 1, Math.floor(bx * cv.width)), py = Math.min(cv.height - 1, Math.floor(by * cv.height));
    const id = Math.round(pixelsRegiao[(py * cv.width + px) * 4] / 40);
    return id >= 1 && id <= 5 ? id - 1 : -1;
  }
  function noGlobo(x, y) { return Math.hypot(x - vista.cx, y - vista.cy) <= vista.r * 1.02; }
  const pos = (ev) => { const r = canvas.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };

  canvas.addEventListener('pointerdown', (ev) => {
    const [x, y] = pos(ev);
    if (!noGlobo(x, y) || vista.opacidade < 0.5) return;
    inicio = { x, y, t: performance.now(), lon: vista.lon, lat: vista.lat, ux: x, uy: y, ut: performance.now() };
    arrastando = true; alvoVista = null; intro = null; vel.lon = vel.lat = 0; ocioso = false;
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener('pointermove', (ev) => {
    const [x, y] = pos(ev);
    canvas.style.cursor = arrastando ? 'grabbing' : noGlobo(x, y) && vista.opacidade > 0.5 ? 'grab' : 'default';
    if (!arrastando || !inicio) return;
    const grausPorPx = 90 / Math.max(vista.r, 40);
    vista.lon = inicio.lon - (x - inicio.x) * grausPorPx;
    vista.lat = Math.max(-60, Math.min(60, inicio.lat + (y - inicio.y) * grausPorPx));
    const agora = performance.now(), dt = Math.max(1, agora - inicio.ut);
    vel.lon = -(x - inicio.ux) * grausPorPx / dt * 16; vel.lat = (y - inicio.uy) * grausPorPx / dt * 16;
    inicio.ux = x; inicio.uy = y; inicio.ut = agora;
    ultimoToque = agora;
  });
  const soltar = (ev) => {
    if (!arrastando) return;
    arrastando = false; ultimoToque = performance.now();
    const [x, y] = pos(ev);
    if (inicio && Math.hypot(x - inicio.x, y - inicio.y) < 6 && performance.now() - inicio.t < 450) {
      vel.lon = vel.lat = 0;
      const id = regiaoEm(x, y);
      aoTocarRegiao(id);
    }
    if (reduzido) vel.lon = vel.lat = 0;
    inicio = null;
  };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);
  canvas.addEventListener('keydown', (ev) => {
    const passo = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, 8], ArrowDown: [0, -8] }[ev.key];
    if (!passo) return;
    ev.preventDefault(); alvoVista = null; intro = null;
    vista.lon += passo[0]; vista.lat = Math.max(-60, Math.min(60, vista.lat + passo[1]));
    ultimoToque = performance.now();
  });

  // ---------- loop ----------
  let anterior = performance.now(), ocioso = false;
  function quadro(agora) {
    // no máximo 60 quadros por segundo (em tela de 120 Hz seria o dobro de trabalho); parado, só balançando, 30 bastam
    if (agora - anterior < (ocioso ? 28 : 12)) return;
    const dt = Math.min(0.05, (agora - anterior) / 1000); anterior = agora;
    const lon0 = vista.lon, lat0 = vista.lat;
    const anima = !reduzido && !pausado;
    if (anima) tempo += dt;
    uTerra.uTempo.value = tempo;

    // estado do planeta: aproxima devagar (a recuperação "acontece" diante do usuário)
    const passo = reduzido ? 1 : dt * 0.55;
    for (let i = 0; i < 5; i++) atual.rec[i] += Math.max(-passo, Math.min(passo, alvo.rec[i] - atual.rec[i]));
    for (let i = 0; i < 3; i++) atual.rios[i] += Math.max(-passo * 0.6, Math.min(passo * 0.6, alvo.rios[i] - atual.rios[i])); // ~3 s da nascente à foz
    atual.mar += Math.max(-passo, Math.min(passo, alvo.mar - atual.mar));
    atual.tempestade += Math.max(-passo * 1.6, Math.min(passo * 1.6, alvo.tempestade - atual.tempestade));
    for (let i = 0; i < 5; i++) uTerra.uRec.value[i] = atual.rec[i];
    uTerra.uRios.value.set(atual.rios[0], atual.rios[1], atual.rios[2]);
    uTerra.uMar.value = atual.mar;
    uTerra.uGlobal.value = (atual.rec[0] + atual.rec[1] + atual.rec[2] + atual.rec[3] + atual.rec[4]) / 5;
    uNuvens.uTempestade.value = atual.tempestade;
    for (let i = 0; i < pecas.length; i++) {
      const p = pecas[i], d = 1 - suaveJS(atual.rec[i]);
      p.material.uniforms.uSolta.value = d;
      qTmp.copy(qId).slerp(p.userData.qMax, d);
      // à deriva: balança de leve enquanto está solta
      if (d > 0.001 && !reduzido) p.quaternion.setFromAxisAngle(p.userData.eixo, d * 0.025 * Math.sin(tempo * 0.6 + i * 1.7)).premultiply(qTmp);
      else p.quaternion.copy(qTmp);
      p.scale.setScalar(1.002 + 0.009 * d);
    }
    uNuvens.uForca.value += (forcaNuvens - uNuvens.uForca.value) * (reduzido ? 1 : Math.min(1, dt * 3));
    uTerra.uPulso.value = reduzido ? 0.5 : 0.5 + 0.5 * Math.sin(agora / 260);

    // posição na tela
    if (alvoVista) {
      const t = Math.min(1, (agora - alvoVista.t0) / alvoVista.dur);
      const { de, para, curva } = alvoVista;
      let e = suavizar(t), eAng = e, eR = e;
      if (curva === 'queda') { eR = t * t; eAng = sair(Math.min(1, t * 1.4)); e = eAng; }
      else if (curva === 'subida') { eR = sair(t); eAng = suavizar(t); e = eR; }
      vista.cx = lerp(de.cx, para.cx, e); vista.cy = lerp(de.cy, para.cy, e);
      vista.r = curva === 'inout' ? lerp(de.r, para.r, eR) : Math.exp(lerp(Math.log(Math.max(de.r, 1)), Math.log(Math.max(para.r, 1)), eR));
      vista.opacidade = lerp(de.opacidade, para.opacidade, e);
      vista.lon = lerpAngulo(de.lon, para.lon, eAng); vista.lat = lerp(de.lat, para.lat, eAng);
      if (t >= 1) alvoVista = null;
    } else if (intro) {
      const t = Math.min(1, (agora - intro.t0) / intro.dur);
      vista.lon = lerpAngulo(intro.de, foco.lon, sair(t)); vista.lat = foco.lat;
      if (t >= 1) intro = null;
    } else if (!arrastando) {
      // inércia, depois volta suave ao foco (o Brasil)
      if (Math.abs(vel.lon) + Math.abs(vel.lat) > 0.01) {
        vista.lon += vel.lon; vista.lat = Math.max(-60, Math.min(60, vista.lat + vel.lat));
        vel.lon *= 0.92; vel.lat *= 0.92;
      } else if (agora - ultimoToque > 4000) {
        const sway = anima && balanco ? 24 * Math.sin(tempo * 0.13) : 0;
        const k = reduzido ? 1 : 1 - Math.exp(-dt * 1.6);
        vista.lon = lerpAngulo(vista.lon, foco.lon + sway, k);
        vista.lat = lerp(vista.lat, foco.lat, k);
      }
    }

    let escala = 1;
    if (respirarDesde !== null) escala = 1 + 0.07 * respiracao((agora - respirarDesde) / 1000).v * (reduzido ? 0 : 1);
    grupo.scale.setScalar(escala);
    grupo.rotation.x = vista.lat * GRAU;
    grupo.rotation.y = -(vista.lon + 90) * GRAU;
    // satélites: posição pelo tempo real; a volta conta mesmo fora da tela da Órbita
    const tOrb = (agora - t0Orbita) / 1000;
    for (let i = 0; i < satelites.length; i++) {
      const st = satelites[i], voltas = Math.floor(tOrb / st.periodo);
      if (voltas > st.voltas) { st.voltas = voltas; aoVolta(i); }
      const a = reduzido ? st.fase : st.fase + (tOrb / st.periodo) * Math.PI * 2;
      const r = ORBITAS[i].r;
      st.sat.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      st.sat.rotation.set(0.25 * Math.sin(a * 2 + i), -a, 0.15);   // painéis voltados ao longo da órbita, com leve oscilação
      st.anel.uniforms.uAng.value = a;
    }
    aplicarCamera();
    uHalo.uSil.value *= escala;
    if (vista.opacidade > 0.01) renderer.render(cena, camera);
    // ocioso: nada em transição, ninguém arrastando e o planeta girando devagar (o balanço anda ~3°/s)
    let mudando = Math.abs(atual.mar - alvo.mar) + Math.abs(atual.tempestade - alvo.tempestade) + Math.abs(forcaNuvens - uNuvens.uForca.value);
    for (let i = 0; i < 5; i++) mudando += Math.abs(atual.rec[i] - alvo.rec[i]);
    for (let i = 0; i < 3; i++) mudando += Math.abs(atual.rios[i] - alvo.rios[i]);
    const giro = (Math.abs(vista.lon - lon0) + Math.abs(vista.lat - lat0)) / Math.max(dt, 1e-3);
    ocioso = !alvoVista && !intro && !arrastando && respirarDesde === null && !orbita.visible && mudando < 0.01 && giro < 6;
  }
  renderer.setAnimationLoop(quadro);
  // só mostra o canvas depois do primeiro quadro desenhado com textura (entra com fade, por cima do marcador)
  requestAnimationFrame(() => requestAnimationFrame(() => { canvas.style.opacity = '1'; }));
  // a versão em alta chega em segundo plano
  const trocar = (t, im) => { t.dispose(); t.image = im; t.needsUpdate = true; };   // dispose: a textura muda de tamanho e precisa ser recriada na GPU
  carregarImagem(base + 'terra-dia.jpg').then((im) => trocar(texturas[0], im)).catch(() => {});
  carregarImagem(base + 'brasil-rios.png').then((im) => trocar(texturas[4], im)).catch(() => {});

  function setEstado(e) {
    estado = e;
    alvo.rec = e.rec.slice(); alvo.mar = e.mar; alvo.rios = e.rios.slice(); alvo.tempestade = e.tempestade;
    canvas.setAttribute('aria-label', descreverPlaneta(e) + '. Arraste ou use as setas para girar.');
  }
  setEstado(estado);
  // começa já no estado pedido, sem animar a primeira vez
  if (opcoes.estado) { setEstado(opcoes.estado); Object.assign(atual, JSON.parse(JSON.stringify(alvo))); }

  return {
    canvas,
    setEstado,
    irPara,
    focar(lonlat, comBalanco = false) { foco = { ...lonlat }; balanco = comBalanco; ultimoToque = -1e9; },
    focarRegiao(i) {
      destaque = i; uTerra.uDestaque.value = i >= 0 ? i + 1 : -1;
      if (i >= 0) { const [lon, lat] = info.centros[i + 1]; foco = { lon, lat }; balanco = false; ultimoToque = -1e9; }
    },
    centroBrasil: BRASIL,
    setOpcoes({ daltonismo, movimentoReduzido, tema } = {}) {
      if (daltonismo !== undefined) uTerra.uPadrao.value = daltonismo ? 1 : 0;
      if (movimentoReduzido !== undefined) { reduzido = movimentoReduzido; if (reduzido) { intro = null; vel.lon = vel.lat = 0; } }
      if (tema) { uHalo.uCor.value.set(tema === 'escuro' ? '#4C93E0' : '#6FA8E8'); uHalo.uForca.value = tema === 'escuro' ? 0.7 : 0.42; }
    },
    pausar(v) { pausado = v; },
    nuvens(v) { forcaNuvens = v; },
    setSatelites,
    mostrarSatelites(v) { orbita.visible = !!v; },
    proximaVolta,
    setPeriodoVolta(seg) { periodoVolta = seg; satelites.forEach((st, i) => { st.periodo = seg * (1 + i * 0.35); st.voltas = Math.floor((performance.now() - t0Orbita) / 1000 / st.periodo); }); },
    get pausado() { return pausado; },
    respirar(ligado) { respirarDesde = ligado ? performance.now() : null; return respirarDesde; },
    get vista() { return { ...vista }; },
    dispose() {
      renderer.setAnimationLoop(null); ro.disconnect();
      [geoTerra, geoNuvens, geoHalo, matTerra, matNuvens, matHalo, ...texturas].forEach((x) => x.dispose());
      pecas.forEach((p) => { p.geometry.dispose(); p.material.dispose(); });
      limparSatelites(); [geoCorpo, geoPainel, geoBraco, geoAntena, geoFaixa, matPainel, matOuro, matBranco, texPainel].forEach((x) => x.dispose());
      renderer.dispose(); canvas.remove();
    },
  };
}
