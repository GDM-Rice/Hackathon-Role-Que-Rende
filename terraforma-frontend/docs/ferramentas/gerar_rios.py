"""Gera brasil-rios.png: campo suave de cada bacia (R Amazonas, G São Francisco, B Paraná) e,
no alfa, a distância de cada ponto até a foz pelo leito (para a água avançar pelo rio).
Fonte: Natural Earth 1:50m, rios e estados (domínio público)."""
import json, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

DL, OUT = sys.argv[1], sys.argv[2]
LON0, LON1, LAT0, LAT1 = -74.5, -33.5, -34.5, 6.0
W = H = 2048
def px(lon, lat): return ((lon-LON0)/(LON1-LON0)*W, (LAT1-lat)/(LAT1-LAT0)*H)

BACIAS = {
 0: {'principal': ['Amazonas'], 'afluentes': ['Purús','Madeira','Negro','Xingu','Tapajós','Japurá','Branco','Mamoré','Guaporé','Juruena','Culuene'], 'foz': (-50.0, -0.6)},
 1: {'principal': ['São  Francisco'], 'afluentes': [], 'foz': (-36.4, -10.5)},
 2: {'principal': ['Paraná'], 'afluentes': ['Grande','Paranaíba'], 'foz': None},  # sai pelo sul da caixa
}
# Brasil (para não pintar rios no Peru, na Bolívia ou na Argentina)
est = json.load(open(f'{DL}/ne_50m_admin_1_states_provinces.geojson'))
br = Image.new('L', (W, H), 0); d = ImageDraw.Draw(br)
for f in est['features']:
    if f['properties'].get('adm0_a3') != 'BRA': continue
    g = f['geometry']; polys = g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
    for p in polys: d.polygon([px(*c) for c in p[0]], fill=255)
brasil = ndimage.binary_dilation(np.array(br) > 0, iterations=6)

rios = json.load(open(f'{DL}/ne_50m_rivers_lake_centerlines.geojson'))
def linhas(nomes):
    for f in rios['features']:
        if (f['properties'].get('name') or '') not in nomes: continue
        g = f['geometry']; ls = g['coordinates'] if g['type']=='MultiLineString' else [g['coordinates']]
        for l in ls: yield [px(*c) for c in l]

campos, esqueletos = [], []
for k in range(3):
    b = BACIAS[k]
    larg = Image.new('L', (W, H), 0); dl = ImageDraw.Draw(larg)      # largura: tronco grosso, afluente fino
    esq = Image.new('L', (W, H), 0); de = ImageDraw.Draw(esq)        # traço de 1 px para medir o caminho
    for pts in linhas(b['afluentes']):
        dl.line(pts, fill=150, width=5, joint='curve'); de.line(pts, fill=255, width=4)
    for pts in linhas(b['principal']):
        dl.line(pts, fill=255, width=11, joint='curve'); de.line(pts, fill=255, width=4)
    a = np.array(larg).astype(np.float32) / 255.
    # campo suave: o miolo é a água, a cauda larga vira a mata ciliar
    # 0 a .45: cauda larga (margem); .45 a 1: miolo estreito (água). Assim a margem nunca alarga o rio.
    cauda = np.clip(ndimage.gaussian_filter(a, 14) * 3.0, 0, 1)
    miolo = np.clip(ndimage.gaussian_filter(a, 1.6) * 1.7, 0, 1)
    campo = np.where(miolo > 0.02, 0.45 + 0.55 * miolo, 0.45 * cauda)
    campo = np.maximum(campo, 0.45 * cauda)
    campo = np.clip(campo, 0, 1) * brasil
    campos.append(campo)
    esqueletos.append((np.array(esq) > 0) & brasil)

# distância pelo leito até a foz (BFS no esqueleto de cada bacia)
from collections import deque
ao_longo = np.full((H, W), np.nan, np.float32)
for k in range(3):
    m = esqueletos[k]; ys, xs = np.nonzero(m)
    if BACIAS[k]['foz']:
        fx, fy = px(*BACIAS[k]['foz'])
        i = np.argmin((xs-fx)**2 + (ys-fy)**2)
    else:
        i = np.argmax(ys)  # ponto mais ao sul dentro do Brasil
    dist = np.full(m.shape, -1, np.int32)
    def bfs(sy, sx, d0):
        q = deque([(sy, sx)]); dist[sy, sx] = d0
        while q:
            y, x = q.popleft()
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y+dy, x+dx
                    if 0 <= yy < H and 0 <= xx < W and m[yy, xx] and dist[yy, xx] < 0:
                        dist[yy, xx] = dist[y, x] + 1; q.append((yy, xx))
    bfs(ys[i], xs[i], 0)
    # pedaços soltos (afluentes que não encostam no tronco): liga ao ponto mais próximo já alcançado
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    for _ in range(n):
        falt = m & (dist < 0)
        if not falt.any(): break
        dt, (ry, rx) = ndimage.distance_transform_edt(dist < 0, return_indices=True)
        dt = np.where(falt, dt, np.inf); j = np.unravel_index(np.argmin(dt), dt.shape)
        if not np.isfinite(dt[j]) or dt[j] > 60: break
        bfs(j[0], j[1], int(dist[ry[j], rx[j]] + dt[j]))
    ok = dist >= 0
    perto = ndimage.distance_transform_edt(~ok) < 28
    campos[k] = campos[k] * perto   # pedaço que não liga na bacia fica de fora
    print(k, 'alcançado', ok.sum(), 'de', m.sum(), 'max', dist.max())
    norm = np.where(ok, dist / max(1, dist.max()), np.nan)
    ao_longo = np.where(np.isnan(ao_longo) & ok, norm, ao_longo)
# espalha o valor do esqueleto para toda a área do campo (vizinho mais próximo)
falta = np.isnan(ao_longo)
_, (iy, ix) = ndimage.distance_transform_edt(falta, return_indices=True)
ao_longo = ao_longo[iy, ix]

rgba = np.dstack([c for c in campos] + [ao_longo]).clip(0, 1)
Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA').save(f'{OUT}/brasil-rios.png', optimize=True)
print('ok')
