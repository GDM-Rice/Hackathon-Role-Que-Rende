# Guia de estrutura do app (cópia)

Cópia dos quadros e telas do guia de design de 28/10/2026. O guia vivo, com o canvas navegável e as imagens, é:
https://claude.ai/artifact/YXKCM76orqrM7i5411vc6d

- `canvas.json`: posição de cada quadro e as **notas por tela** (campo `notes`) — o que cada tela precisa ter e as regras.
- `Main`, `Missoes`, `Estilo`, `Embasamento`, `PlanetaMergulho`: quadros de visão geral, regras do jogo, estilo, fontes científicas e o planeta 3D.
- `Tela01…Tela15b`: telas do celular (390 × 844). `Nav.dc.html` é o componente do menu.
- `TesteCores`, `TesteMenu`: testes de paleta (ainda não decididos).

Os arquivos `.dc.html` usam um formato do editor de design; abrem melhor pelo link acima. As imagens (`/_blob/...`) só carregam lá.
