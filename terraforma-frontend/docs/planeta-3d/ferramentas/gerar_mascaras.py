"""Gera as máscaras do Brasil (regiões, fronteiras e rios) a partir do Natural Earth (domínio público)."""
import json, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

DL = sys.argv[1]; OUT = sys.argv[2]
LON0, LON1, LAT0, LAT1 = -74.5, -33.5, -34.5, 6.0   # caixa do Brasil
W = H = 1024
REGIAO = {  # 1 Sul, 2 Sudeste, 3 Centro-Oeste, 4 Nordeste, 5 Norte (ordem de recuperação)
 'Paraná':1,'Santa Catarina':1,'Rio Grande do Sul':1,
 'São Paulo':2,'Rio de Janeiro':2,'Minas Gerais':2,'Espírito Santo':2,
 'Mato Grosso':3,'Mato Grosso do Sul':3,'Goiás':3,'Distrito Federal':3,
 'Bahia':4,'Sergipe':4,'Alagoas':4,'Pernambuco':4,'Paraíba':4,'Rio Grande do Norte':4,'Ceará':4,'Piauí':4,'Maranhão':4,
 'Pará':5,'Amazonas':5,'Acre':5,'Rondônia':5,'Roraima':5,'Amapá':5,'Tocantins':5}

def px(lon, lat):
    return ((lon-LON0)/(LON1-LON0)*W, (LAT1-lat)/(LAT1-LAT0)*H)

def aneis(geom):
    polys = geom['coordinates'] if geom['type']=='MultiPolygon' else [geom['coordinates']]
    for p in polys:
        yield p[0], p[1:]

estados = json.load(open(f'{DL}/ne_50m_admin_1_states_provinces.geojson'))
reg = Image.new('L', (W, H), 0); d = ImageDraw.Draw(reg)
centros = {i: [] for i in range(1, 6)}
for f in estados['features']:
    if f['properties'].get('adm0_a3') != 'BRA': continue
    rid = REGIAO[f['properties']['name']]
    for ext, furos in aneis(f['geometry']):
        d.polygon([px(*c) for c in ext], fill=rid*40)
        for fu in furos: d.polygon([px(*c) for c in fu], fill=0)
a = np.array(reg)
ids = a//40
# centroides em lon/lat (para câmera e rótulos)
cent = {}
for i in range(1, 6):
    ys, xs = np.nonzero(ids == i)
    cent[i] = [round(LON0 + xs.mean()/W*(LON1-LON0), 2), round(LAT1 - ys.mean()/H*(LAT1-LAT0), 2)]
# fronteiras entre regiões (fissuras)
b = np.zeros_like(ids, dtype=bool)
for dy, dx in [(0,1),(1,0),(1,1),(1,-1)]:
    s = np.roll(np.roll(ids, dy, 0), dx, 1)
    b |= (ids != s) & (ids > 0) & (s > 0)
borda = Image.fromarray((b*255).astype('uint8')).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.6))

rios = json.load(open(f'{DL}/ne_50m_rivers_lake_centerlines.geojson'))
canais = {}
for nome, alvo in [('Amazonas','Amazonas'), ('São  Francisco','SaoFrancisco'), ('Paraná','Parana')]:
    im = Image.new('L', (W, H), 0); dr = ImageDraw.Draw(im)
    for f in rios['features']:
        if (f['properties'].get('name') or '') != nome: continue
        g = f['geometry']; linhas = g['coordinates'] if g['type']=='MultiLineString' else [g['coordinates']]
        for l in linhas:
            pts = [px(*c) for c in l]
            if all(not(0 <= x < W and 0 <= y < H) for x, y in pts): continue
            dr.line(pts, fill=255, width=5, joint='curve')
    canais[alvo] = im.filter(ImageFilter.GaussianBlur(1.0))
linhas = Image.merge('RGBA', (canais['Amazonas'], canais['SaoFrancisco'], canais['Parana'], borda))
reg.save(f'{OUT}/brasil-regioes.png', optimize=True)
linhas.save(f'{OUT}/brasil-linhas.png', optimize=True)
json.dump({'caixa': [LON0, LON1, LAT0, LAT1], 'centros': cent}, open(f'{OUT}/brasil.json', 'w'))
print(cent)
