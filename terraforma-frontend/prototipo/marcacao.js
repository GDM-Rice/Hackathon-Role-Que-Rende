// Marcação das telas do protótipo (HTML estático). O motor em app.js liga o comportamento.
// Cada tela é um <section class="tela" id="tela-X" data-tela="X" hidden>. Fase 2: virar componente React (docs/MIGRACAO.md).
export const MARCACAO = `<div class="bancada">
  

  <div class="celular">
    <div class="app" id="app" data-tela="inicio">
      <div class="sombra-globo" id="sombra" aria-hidden="true"></div>
      <div class="estrelas" aria-hidden="true"></div>
      <div class="camada-globo" id="camada"></div>
      <div class="camada-oceano" id="camada-oceano"></div>

      <div class="telas">
        <!-- BOAS-VINDAS -->
        <section class="tela tela-boas tela-login" id="tela-login" data-tela="login" aria-label="Entrar" hidden>
          <div class="cab-boas"><p class="marca">Terraforma</p></div>
          <div class="slot" data-slot style="height: 150px"></div>
          <div class="boas-corpo login-corpo">
            <div><h2 class="boas-tit" id="login-tit">Um lugar para recomeçar.</h2><p class="boas-sub" style="margin-top: 6px">Apoio para quem quer parar de apostar. Sem julgamento.</p></div>
            <div class="seg-login" id="abas-login" role="tablist" aria-label="Entrar ou criar conta"><button type="button" role="tab" data-login="entrar" aria-selected="true">Entrar</button><button type="button" role="tab" data-login="criar" aria-selected="false">Criar conta</button></div>
            <form class="form-login" id="form-login" novalidate>
              <div class="campo-boas" id="campo-usuario" hidden><label for="login-usuario">Nome de usuário</label><input id="login-usuario" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="30" placeholder="ex.: verde.27" aria-describedby="dica-usuario"><small class="dica-boas" id="dica-usuario">Letras minúsculas, números, ponto, hífen ou sublinhado. É por ele que outras pessoas te chamam para conversar. Não use seu nome real.</small></div>
              <div class="campo-boas" id="campo-email"><label for="login-email">E-mail</label><input id="login-email" type="email" autocomplete="email" inputmode="email" placeholder="voce@email.com"></div>
              <div class="campo-boas"><label for="login-senha" id="rot-senha">Senha</label><span class="com-olho"><input id="login-senha" type="password" autocomplete="current-password" placeholder="mínimo 8 caracteres"><button type="button" id="ver-senha" aria-label="Mostrar senha" aria-pressed="false"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button></span></div>
              <p class="erro-login" id="erro-login" role="alert"></p>
              <button class="boas-botao" type="submit" id="login-ok">Entrar</button>
              <button class="link-login" type="button" id="esqueci">Esqueci a senha</button>
            </form>
            <div class="ou" id="ou-login"><span>ou</span></div>
            <button class="botao-sem-conta" type="button" id="sem-conta">Continuar sem conta</button>
            <p class="privado"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg><span id="login-priv">Sem conta, tudo fica só neste celular.</span></p>
          </div>
        </section>

        <section class="tela tela-boas" id="tela-boas" data-tela="boas" aria-label="Boas-vindas" hidden>
          <div class="cab-boas"><p class="marca">Terraforma</p><span class="pontos-boas" aria-hidden="true"><i></i><i></i><i></i></span><button class="pular" type="button" id="boas-pular">Pular</button></div>
          <div class="slot" data-slot id="boas-slot" style="height: 400px"></div>
          <div class="boas-corpo" id="boas-corpo" aria-live="polite"></div>
        </section>

        <!-- INÍCIO -->
        <section class="tela" id="tela-inicio" data-tela="inicio" aria-label="Início">
          <div class="topo"><p class="marca">Terraforma</p><button class="avatar" type="button" data-ir="perfil" aria-label="Seu perfil"><span>R</span></button></div>
          <div><h2 class="saudacao" id="saudacao">Boa noite, Rafael.</h2><p class="sub">Para voltar a dormir em paz.</p></div>
          <div class="slot" data-slot style="height: 286px">
            <button class="botao-redondo" type="button" id="pausar" style="left: 4px; bottom: -4px" aria-label="Pausar o movimento do planeta" aria-pressed="false"><span><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path id="icone-pausa" d="M3 2h2v8H3zM7 2h2v8H7z" fill="currentColor"></path></svg></span></button>
            <button class="botao-redondo" type="button" id="abrir-info" style="right: 4px; bottom: -4px" aria-label="Por que o planeta começa seco"><span>i</span></button>
          </div>
          <div class="progresso">
            <div class="linha-prog"><span>Próxima região: <b id="prox-nome">Centro-Oeste</b></span><span id="prox-falta" style="color: var(--suave)">faltam 9 dias</span></div>
            <div class="trilho" role="progressbar" id="prox-barra" aria-label="Progresso da próxima região" aria-valuemin="0" aria-valuemax="100" aria-valuenow="70"><div style="width: 70%"></div></div>
            <div class="numeros"><span><b id="n-dias">21</b> <span id="n-dias-txt">dias de recomeço</span></span><span id="n-reais-bloco"><b id="n-reais">R$ 360</b> longe das apostas</span><button type="button" class="link-reais" id="n-reais-definir" data-ir="perfil" hidden>Quanto você apostava? Definir</button></div>
          </div>
          <button class="cartao-mare" type="button" data-ir="mare"><span><small>A vontade de apostar apareceu? Respire uns minutos.</small><strong>Respire com a Terra</strong></span><i><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 10c3-3 6 3 9 0s6 3 9 0M3 15c3-3 6 3 9 0s6 3 9 0"></path></svg></i></button>
          <button class="botao-troca" type="button" data-ir="troca"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19c3-4 6-7 10-9"/></svg>Hábitos saudáveis</button>
          <button class="link-baixo" type="button" data-ir="tempestade">Apostei hoje. Contar sem medo</button>
          <nav class="nav" aria-label="Menu principal" data-nav></nav>
        </section>

        <!-- TRILHA -->
        <section class="tela tela-trilha" id="tela-trilha" data-tela="trilha" aria-label="Trilha" hidden>
          <div class="topo-trilha">
            <button class="voltar-planeta" type="button" id="subir-planeta"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>Planeta</button>
            <button class="chip-regiao" type="button" id="chip-regiao" aria-haspopup="true" aria-expanded="false"><span id="chip-regiao-nome">Sul</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
            <div class="lista-regioes" id="lista-regioes" hidden></div>
          </div>
          <div class="cab-trilha">
            <div><h2>Sua trilha</h2><p class="resumo" id="trilha-resumo">0 de 25 atividades</p><p class="vida" id="trilha-vida"></p></div>
            <button class="slot slot-mini" type="button" data-slot data-ir="mapa" aria-label="Ver o planeta de perto: regiões, mar e rios"></button>
          </div>
          <div class="rol-trilha" id="rol-trilha"></div>
          <div class="proxima" id="proxima"></div>
          <nav class="nav" aria-label="Menu principal" data-nav style="margin: 0"></nav>
        </section>

        <section class="tela tela-ativ" id="tela-atividade" data-tela="atividade" aria-label="Aula" hidden>
          <div class="ativ-topo"><button class="fechar" type="button" id="ativ-fechar" aria-label="Sair e voltar à trilha">×</button><div class="barra-ativ" role="progressbar" id="ativ-barra" aria-valuemin="0" aria-valuemax="100"><i></i></div><button class="apoio-topo" type="button" data-ir="ajuda">Apoio</button></div>
          <div class="ativ-corpo" id="ativ-corpo"></div>
          <div class="ativ-rodape" id="ativ-rodape"></div>
          <div class="sair-sheet" id="sair-sheet" hidden><div class="folha" role="alertdialog" aria-labelledby="sair-tit" aria-describedby="sair-txt">
            <h4 id="sair-tit">Sair do quiz agora?</h4><p id="sair-txt">O que você respondeu neste quiz não fica salvo. A aula continua liberada.</p>
            <button class="btn-duo marinho" type="button" id="sair-ficar">Continuar o quiz</button><button class="link-duo" type="button" id="sair-sim">Sair</button></div></div>
        </section>

        <!-- MAPA-MUNDI -->
        <section class="tela tela-mapa" id="tela-mapa" data-tela="mapa" aria-label="Mapa-Mundi" hidden>
          <div class="mapa-topo slot" data-slot data-zoom="1"><div class="mapa-titulo"><h2>Mapa-Mundi</h2><p>Toque numa região, no mapa ou na lista.</p></div></div>
          <div class="folha">
            <div class="alca" aria-hidden="true"></div>
            <div class="rolavel">
              <h3 class="secao">Brasil, pelos dias de recomeço</h3>
              <ul class="lista-regioes" id="lista-regioes"></ul>
              <p class="nota" id="nota-regiao"></p>
              <h3 class="secao">Mar e rios</h3>
              <div class="chips"><div class="chip"><p class="r">Mar</p><b id="chip-mar">Limpando</b><p class="r" id="chip-mar-s">9 de 10 Marés</p></div><div class="chip"><p class="r">Rios</p><b id="chip-rios">1 de 3</b><p class="r" id="chip-rios-s">Amazonas</p></div></div>
              <p class="nota" id="nota-rio"></p>
            </div>
            <nav class="nav" aria-label="Menu principal" data-nav style="margin: 0"></nav>
          </div>
        </section>

        <!-- RESPIRE COM A TERRA -->
        <section class="tela tela-mare" id="tela-mare" data-tela="mare" aria-label="Respire com a Terra" hidden>
          <p class="legenda-som vidro" id="legenda-som" aria-hidden="true" hidden>[ondas do mar]</p>
          <div class="mare-topo">
            <button class="pilula vidro" type="button" id="mare-voltar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg>Planeta</button>
            <button class="pilula vidro" type="button" id="som" aria-pressed="true" aria-label="Som do mar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"></path><path id="som-ondas" d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"></path><path id="som-x" d="M17 9l5 6M22 9l-5 6" hidden></path></svg><span id="som-texto">Som ligado</span></button>
          </div>

          <div class="mare-cartao vidro painel-mar" id="mare-escolha" hidden>
            <h2>Respire com a Terra</h2>
            <p>A vontade costuma subir, chegar a um pico e baixar. A maré sobe quando você inspira e desce quando você solta.</p>
            <fieldset><legend>Técnica</legend>
              <div class="tecnicas" id="tecnicas"></div>
            </fieldset>
            <fieldset><legend>Duração</legend>
              <div class="duracoes" id="duracoes"><button type="button" class="pilula" data-min="1" aria-pressed="false">1 min</button><button type="button" class="pilula" data-min="3" aria-pressed="true">3 min</button><button type="button" class="pilula" data-min="5" aria-pressed="false">5 min</button></div>
            </fieldset>
            <div class="vontade"><label for="vontade-antes">Quanto está a vontade agora?</label><output id="o-antes" for="vontade-antes">5</output><input type="range" id="vontade-antes" min="0" max="10" value="5"><span class="escala" aria-hidden="true"><span>0 · nenhuma</span><span>10 · muito forte</span></span></div>
            <button class="comecar" type="button" id="comecar">Começar</button>
            <details><summary>Por que essas técnicas</summary>
              <ul>
                <li>Respirar devagar, abaixo de 10 vezes por minuto, aumenta a variabilidade cardíaca e está ligado a menos ansiedade e mais relaxamento (Zaccaro et al., 2018; Laborde et al., 2022).</li>
                <li>5 minutos por dia de suspiro cíclico melhoraram o humor mais do que meditação, num estudo de 28 dias (Balban et al., 2023).</li>
                <li>Surfar a vontade: em fumantes, observar a vontade sem agir reduziu o consumo na semana seguinte (Bowen e Marlatt, 2009). Em jogo, terapia com atenção plena reduziu a fissura (Melero Ventola et al., 2020).</li>
                <li>Não substitui tratamento. Se a vontade não passar, ligue 188 (CVV) ou chame alguém da sua órbita.</li>
              </ul>
            </details>
          </div>

          <div class="sessao painel-mar" id="mare-sessao" hidden>
            <div class="anel" aria-hidden="true">
              <svg viewBox="0 0 220 220"><circle cx="110" cy="110" r="104" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="4"></circle><circle id="anel-prog" cx="110" cy="110" r="104" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-dasharray="653.5" stroke-dashoffset="653.5" transform="rotate(-90 110 110)"></circle></svg>
              <div class="bolha" id="bolha"></div>
            </div>
            <p class="fase" id="fase">Inspire</p>
            <p class="dica" id="dica">pelo nariz</p>
            <p class="prompt vidro" id="prompt" aria-live="polite"></p>
          </div>
          <div class="sessao-rodape vidro painel-mar" id="mare-rodape" hidden>
            <span class="tempo" id="tempo">3:00<small id="tecnica-nome">Respiração lenta</small></span>
            <div><button type="button" id="pausa-sessao">Pausar</button><button type="button" id="encerrar">Encerrar</button></div>
          </div>

          <div class="mare-cartao vidro painel-mar" id="mare-fim" hidden>
            <h2 id="fim-titulo">Passou?</h2>
            <div class="vontade"><label for="vontade-depois">E agora, quanto está a vontade?</label><output id="o-depois" for="vontade-depois">5</output><input type="range" id="vontade-depois" min="0" max="10" value="5"><span class="escala" aria-hidden="true"><span>0 · nenhuma</span><span>10 · muito forte</span></span></div>
            <p class="resultado" id="resultado" aria-live="polite"></p>
            <p id="fim-mare"></p>
            <button class="comecar" type="button" id="fim-voltar">Voltar ao planeta</button>
            <button class="pilula" type="button" id="fim-mais" style="justify-content: center; border: 1px solid rgba(230,241,251,.3); background: transparent; color: #FFFFFF">Mais uma rodada</button>
          </div>
        </section>

        <!-- TEMPESTADE -->
        <section class="tela" id="tela-tempestade" data-tela="tempestade" aria-label="Dia de tempestade" hidden>
          <button class="voltar" type="button" data-ir="inicio"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg>Início</button>
          <div class="slot" data-slot style="height: 210px"></div>
          <div class="centro-texto"><p style="font-size: 14px">Dia de tempestade registrado</p><h2>Você voltou. Isso conta.</h2><p>As nuvens passam. Nada do que você recuperou foi perdido.</p></div>
          <div class="cartoes2"><div><p>Dias de recomeço</p><b id="t-dias">21</b><p>continuam aqui</p></div><div><p>Regiões verdes</p><b id="t-verdes">2 de 5</b><p id="t-verdes-nomes">Sul e Sudeste</p></div></div>
          <div class="pilha">
            <button class="botao cheio" type="button" data-ir="mare" style="text-align: left">Respirar com a Terra</button>
            <button class="botao contorno" type="button" id="avisar-orbita">Chamar alguém da Órbita</button>
            <button class="botao contorno" type="button" data-ir="ajuda">Falar com um profissional</button>
          </div>
        </section>

        <!-- AJUDA -->
        <section class="tela tela-ajuda" id="tela-ajuda" data-tela="ajuda" aria-label="Ajuda" hidden>
          <div class="rol-ajuda">
            <h2>Ajuda</h2>
            <p class="sub-ajuda">De graça, pelo SUS. Você não precisa passar por isso sozinho.</p>
            <section class="urgente" aria-labelledby="tit-urg"><b id="tit-urg">Emergência</b><span>Se você corre risco de se machucar, ligue para o SAMU ou vá a uma UPA ou pronto-socorro.</span>
                <div class="bts"><a href="tel:192" class="ligar">Ligar 192 · SAMU</a><a href="tel:188" class="sec">Conversar: CVV 188</a></div><small>CVV: apoio emocional 24 horas, gratuito, também por chat em cvv.org.br.</small></section>
              <section class="psi" aria-labelledby="tit-psi"><span class="rot">Gratuito pelo SUS</span><b id="tit-psi">Falar com um psicólogo por vídeo</b>
                <ol><li>Entre no app <b>Meu SUS Digital</b> com a conta gov.br.</li><li>Toque em <b>Miniapps</b> e escolha <b>"Agora Tem Especialistas em Saúde Mental para Quem Aposta"</b>.</li><li>Faça o autoteste e preencha o formulário.</li><li>Você recebe um protocolo e, depois, o link da videochamada.</li></ol>
                <p>Consultas de cerca de 50 minutos, de preferência uma por semana, num primeiro ciclo de até 10 sessões. Dá para pedir também para um familiar.</p>
                <a class="btn-psi" href="https://www.gov.br/saude/pt-br/assuntos/noticias-ms/2026/agosto/meu-sus-digital-oferecera-ate-100-mil-teleatendimentos-mensais-para-pessoas-com-necessidades-relacionadas-a-jogos-e-apostas" target="_blank" rel="noopener">Ver o passo a passo no gov.br</a>
                <small class="fonte">Ministério da Saúde, 2026 · Não Aposte Sua Saúde</small></section>
            <section class="psi presencial" aria-labelledby="tit-pres"><span class="rot">Perto de você</span><b id="tit-pres">Atendimento presencial</b>
              <p>A <b>UBS</b> é a porta de entrada do SUS. O <b>CAPS</b> é aberto à comunidade e cuida de saúde mental. Todo atendimento é gratuito.</p>
              <p>Não sabe aonde ir? <b>Disque Saúde 136</b>: segunda a sexta, das 8h às 20h; sábado, das 8h às 18h.</p>
              <a class="btn-sec" href="https://www.gov.br/saude/pt-br/composicao/saes/desmad/raps" target="_blank" rel="noopener">Como funciona a rede (gov.br)</a>
              <small class="fonte">Ministério da Saúde · Rede de Atenção Psicossocial (RAPS)</small></section>
            <p class="sec-apoio">Enquanto isso, no app</p>
            <button type="button" class="op-apoio" data-ir="mare"><span class="ic" style="background: #E1F5EE; color: #0F6E56"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M3 10c3-3 6 3 9 0s6 3 9 0M3 15c3-3 6 3 9 0s6 3 9 0"/></svg></span><span><b>Atravessar a vontade agora</b><small>Respire com a Terra, de 1 a 5 minutos.</small></span></button>
            <button type="button" class="op-apoio" data-ir="luneta"><span class="ic" style="background: #EEEDFE; color: #3C3489"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg></span><span><b>Pedir apoio à comunidade</b><small>Na Luneta, só seu planeta aparece.</small></span></button>
            <p class="nota-ajuda">O Terraforma apoia, mas não substitui atendimento profissional.</p>
          </div>
          <nav class="nav" aria-label="Menu principal" data-nav style="margin: 0"></nav>
        </section>

        <!-- PERFIL (resumido) -->
        <section class="tela tela-rol" id="tela-perfil" data-tela="perfil" aria-label="Perfil" hidden>
          <div class="rol-tela">
          <button class="voltar" type="button" data-ir="inicio"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg>Início</button>
          <div class="cab-perfil"><span class="bola-perfil" id="perfil-bola" aria-hidden="true"></span>
            <div class="nomes"><h2 id="perfil-nome">Rafael</h2><p id="perfil-luneta">Na Luneta: Planeta Verde-21</p></div>
            <button type="button" class="link-perfil" id="editar-perfil">Editar</button></div>
          <p class="motivo-perfil" id="perfil-motivo">"Para voltar a dormir em paz."</p>
          <div class="edicao-perfil" id="edicao-perfil" hidden>
            <label class="campo-claro"><span>Como quer ser chamado</span><input id="ed-nome" maxlength="24" autocomplete="nickname"></label>
            <label class="campo-claro"><span>Seu motivo</span><input id="ed-motivo" maxlength="60"></label>
            <div class="dois"><button type="button" class="botao contorno" id="cancelar-perfil">Cancelar</button><button type="button" class="botao cheio-p" id="salvar-perfil">Salvar</button></div>
          </div>
          <button class="linha-perfil" type="button" data-ir="orbita"><svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true"><ellipse cx="18" cy="18" rx="16" ry="6" transform="rotate(-15 18 18)" fill="none" stroke="#5DCAA5" stroke-width="1.4"></ellipse><circle cx="18" cy="18" r="8" fill="#85B7EB" stroke="#185FA5"></circle><rect x="29" y="11" width="5" height="5" rx="1" fill="#5DCAA5" stroke="#0F6E56"></rect></svg><span class="quem"><b>Sua órbita</b><small id="perfil-orbita-sub">Pessoas de confiança · Preciso de você · recados</small></span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"></path></svg></button>
          <div class="cartao-valor">
            <label for="perfil-valor"><b>Quanto você apostava</b><small>O app multiplica pelos seus dias de recomeço e mostra no Início o dinheiro que ficou com você. Nunca mostra quanto você perdeu.</small></label>
            <div class="valor-periodo claro"><span class="pref-boas"><b aria-hidden="true">R$</b><input id="perfil-valor" inputmode="numeric" maxlength="7" autocomplete="off" placeholder="não quero informar"></span>
              <div class="seg-login periodo" role="radiogroup" aria-label="Por período" id="perfil-periodo"></div></div>
            <button type="button" class="botao fin" id="salvar-valor" style="background: var(--primaria); color: var(--sobre-primaria)">Salvar</button>
          </div>
          <h3 class="sec-perfil">Sobre você</h3>
          <p class="nota-perfil">Opcional. Ajusta as dicas e as metas. <span id="sobre-onde">Fica só neste celular.</span></p>
          <div class="sobre" id="sobre"></div>
          <section class="pesquisa"><h3>Participar da pesquisa</h3><p>Envie de forma anônima a vontade antes e depois de cada respiração e seus dias de recomeço, para estudarmos se o app ajuda. O que você escreve nunca é enviado. Dá para sair quando quiser.</p>
            <label class="interr"><span><b>Quero participar</b></span><input type="checkbox" role="switch" id="pesquisa-on"></label></section>
          <button type="button" class="linha-perfil" data-ir="ajustes"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg><span style="flex-grow: 1; text-align: left"><b>Ajustes e acessibilidade</b></span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
          <button type="button" class="link-perfil centro" id="conta-perfil">Sair da conta</button>
          <p class="nota-perfil">Na demonstração, todos os dados são fictícios e nada é enviado.</p>
          </div>
        </section>

        <section class="tela tela-rol" id="tela-ajustes" data-tela="ajustes" aria-label="Ajustes e acessibilidade" hidden>
          <div class="rol-tela">
          <button class="voltar" type="button" data-ir="perfil"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg>Perfil</button>
          <h2 class="tit-tela">Ajustes e acessibilidade</h2>
          <p class="nota-perfil" style="margin-top: -6px">Tudo muda na hora e vale para o app inteiro.</p>
          <h3 class="sec-perfil">Aparência</h3>
          <div class="grupo-aj">
            <div class="item-aj col"><span>Tema</span><div class="seg-aj" role="radiogroup" aria-label="Tema" data-grupo="tema"></div></div>
            <label class="item-aj interr"><span><b>Alto contraste</b><small>Bordas mais fortes e texto mais escuro</small></span><input type="checkbox" role="switch" id="aj-contraste"></label>
            <label class="item-aj interr"><span><b>Modo para daltonismo</b><small>Regiões secas ficam escuras e listradas; recuperadas, verde bem claro</small></span><input type="checkbox" role="switch" id="aj-dalt"></label>
          </div>
          <h3 class="sec-perfil">Leitura</h3>
          <div class="grupo-aj">
            <div class="item-aj col"><span>Tamanho do texto</span><div class="seg-aj" role="radiogroup" aria-label="Tamanho do texto" data-grupo="texto"></div></div>
            <label class="item-aj interr"><span><b>Mais espaço entre as linhas</b><small>Ajuda na leitura com dislexia</small></span><input type="checkbox" role="switch" id="aj-espaco"></label>
            <p class="item-aj nota-aj">Para ouvir a tela em voz alta, use o leitor do celular (TalkBack ou VoiceOver). O app tem descrição para cada imagem, inclusive o planeta.</p>
          </div>
          <h3 class="sec-perfil">Movimento e som</h3>
          <div class="grupo-aj">
            <div class="item-aj col"><span>Animações</span><div class="seg-aj" role="radiogroup" aria-label="Animações" data-grupo="anim"></div></div>
            <label class="item-aj interr"><span><b>Som do mar</b><small>Na Respire com a Terra</small></span><input type="checkbox" role="switch" id="aj-som"></label>
            <label class="item-aj interr"><span><b>Legendas dos sons</b><small>Ex.: [ondas do mar]</small></span><input type="checkbox" role="switch" id="aj-legendas"></label>
          </div>
          <h3 class="sec-perfil">Prévia</h3>
          <div class="previa-aj"><span class="p1">✓ Recuperada</span><span class="p2">● Agora</span><span class="p3">○ Depois</span></div>
          <p class="nota-perfil">Toda informação usa ícone e texto, não só cor.</p>
          <div class="rodape-aj"><button type="button" class="link-perfil" id="aj-fontes">De onde vêm as informações</button><button type="button" class="link-perfil perigo" id="aj-apagar">Apagar meus dados</button></div>
          </div>
        </section>

        <!-- ÓRBITA -->
        <section class="tela simples" id="tela-orbita" data-tela="orbita" aria-label="Sua órbita" hidden>
          <button class="voltar" type="button" data-ir="perfil"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg>Perfil</button>
          <div><h2>Sua órbita</h2><p class="sub">Pessoas de confiança giram em volta do seu planeta. A cada volta, um satélite traz um recado.</p></div>
          <div class="slot" data-slot data-orbita="1" style="height: 206px"></div>
          <button class="preciso" type="button" id="preciso">Preciso de você</button>
          <ul class="lista-orbita" id="lista-orbita"></ul>
          <div class="caixa"><label for="recados-on">Recados a cada volta<input type="checkbox" id="recados-on" checked></label><p class="nota" style="font-size: 12.5px">Só com o app aberto, nunca durante uma respiração. Os números ficam só neste celular.</p></div>
          <div class="folha-lun" id="folha-orbita" role="dialog" aria-modal="true" aria-labelledby="tit-orbita" hidden>
            <div class="folha-corpo">
              <div class="folha-topo"><h3 id="tit-orbita">Colocar alguém na órbita</h3><button type="button" class="fechar-folha" data-fechar-folha aria-label="Fechar">×</button></div>
              <p class="dica-fin" style="margin: -6px 0 0">Alguém de confiança, que você possa chamar quando a vontade apertar. Até 3 pessoas. Fica só neste celular.</p>
              <label class="campo-fin"><span>Nome <small>ou apelido</small></span><input id="orb-nome" maxlength="20" autocomplete="off"></label>
              <label class="campo-fin"><span>Quem é para você? <small>opcional: irmã, amigo, mãe...</small></span><input id="orb-rel" maxlength="20" autocomplete="off"></label>
              <label class="campo-fin"><span>Telefone <small>opcional, para chamar daqui</small></span><input id="orb-tel" type="tel" inputmode="tel" maxlength="20" autocomplete="off" placeholder="(61) 99999-9999"></label>
              <button type="button" class="botao cheio" id="salvar-orbita" disabled>Colocar na órbita</button>
            </div>
          </div>
          <div class="folha-lun" id="folha-preciso" role="dialog" aria-modal="true" aria-labelledby="tit-preciso" hidden>
            <div class="folha-corpo">
              <div class="folha-topo"><h3 id="tit-preciso">Quem você quer chamar?</h3><button type="button" class="fechar-folha" data-fechar-folha aria-label="Fechar">×</button></div>
              <p class="dica-fin" style="margin: -6px 0 0">A mensagem já vai escrita: “Estou num momento difícil. Pode me ligar?”</p>
              <ul class="lista-orbita" id="lista-preciso"></ul>
            </div>
          </div>
        </section>

        <!-- ESCREVER RECADO -->
        <section class="tela simples" id="tela-recado" data-tela="recado" aria-label="Deixar um recado" hidden>
          <button class="voltar" type="button" data-ir="orbita"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg>Sua órbita</button>
          <h2 id="recado-titulo" style="font-size: 26px; line-height: 1.15">Deixe um recado</h2>
          <p class="sub" style="margin: 0">Passe o celular para a pessoa. O recado aparece quando o satélite dela der a volta no planeta.</p>
          <label for="recado-texto" style="font-weight: 700; font-size: 14px">Recado</label>
          <textarea id="recado-texto" class="recado-area" rows="4" maxlength="140" style="pointer-events: auto"></textarea>
          <div style="display: flex; flex-wrap: wrap; gap: 6px" id="ideias"><button type="button" class="chip-ideia">Tô aqui.</button><button type="button" class="chip-ideia">Lembrei de você hoje.</button><button type="button" class="chip-ideia">Bora tomar um café essa semana?</button><button type="button" class="chip-ideia">Se apertar, me liga.</button></div>
          <div class="caixa" style="background: var(--verde-claro); border: 0"><b style="font-size: 14px">Como apoiar sem julgar</b><p class="nota" style="font-size: 13px">Fale do carinho, não das apostas. Sem cobrar dias ou dinheiro. Convide para algo simples.</p></div>
          <button class="botao cheio" type="button" id="salvar-recado" style="margin-top: auto; margin-bottom: 20px">Salvar recado</button>
        </section>

        <!-- LUNETA e FINANÇAS: só referência -->
        <section class="tela tela-luneta" id="tela-luneta" data-tela="luneta" aria-label="Luneta" hidden>
          <div class="cab-luneta">
            <svg class="ceu-luneta" viewBox="0 0 390 170" preserveAspectRatio="xMaxYMax slice" aria-hidden="true"><g fill="#E6F1FB"><circle cx="30" cy="22" r="1"/><circle cx="96" cy="60" r="1.2"/><circle cx="170" cy="18" r="1"/><circle cx="232" cy="74" r="1"/><circle cx="300" cy="30" r="1.3"/><circle cx="360" cy="80" r="1"/><circle cx="340" cy="140" r="1"/><circle cx="250" cy="150" r="1"/><circle cx="140" cy="120" r=".9"/></g><circle class="pl" cx="340" cy="138" r="13" fill="#639922"/><circle class="pl" cx="376" cy="160" r="5" fill="#378ADD"/><circle class="pl" cx="296" cy="160" r="4" fill="#B5C27A"/></svg>
            <div class="linha-lun"><h2>Luneta</h2><button type="button" class="eu-planeta" id="eu-planeta" aria-label="Seu planeta na Luneta. Toque para mudar nome e cor"><i id="eu-cor" style="background: #639922"></i><span id="eu-nome">Planeta Verde-21</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg></button></div>
            <div class="linha-sub"><p>Planetas em recomeço, sem nome e sem rosto.</p></div>
            <div class="abas-lun" role="tablist" aria-label="Partes da Luneta">
              <button type="button" role="tab" id="aba-mural" aria-selected="true" aria-controls="painel-lun" data-lun="mural">Mural</button>
              <button type="button" role="tab" id="aba-conversas" aria-selected="false" aria-controls="painel-lun" data-lun="conversas">Conversas<span class="bol" id="bol-conv" aria-label="mensagens novas"></span></button>
              <span class="sub" id="ind-lun" aria-hidden="true"></span>
            </div>
          </div>
          <div class="rol-lun" id="painel-lun" role="tabpanel"></div>
          <button type="button" class="escrever" id="escrever" aria-label="Escrever para a constelação"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg></button>
          <div class="folha-lun" id="folha-escrever" role="dialog" aria-modal="true" aria-labelledby="tit-escrever" hidden>
            <div class="folha-corpo">
              <div class="folha-topo"><h3 id="tit-escrever">Escrever para a constelação</h3><button type="button" class="fechar-folha" id="fechar-escrever" aria-label="Fechar">×</button></div>
              <div class="chips" id="escolha-const" role="radiogroup" aria-label="Constelação"></div>
              <label class="campo-post"><span class="sr">Seu texto</span><textarea id="txt-post" rows="4" maxlength="400" placeholder="Como você está? O que ajudou hoje?"></textarea></label>
              <ul class="checagem" id="checagem" aria-live="polite"></ul>
              <div id="aviso-crise"></div>
              <button type="button" class="btn-lun" id="publicar" disabled>Publicar como <span id="pub-nome">Planeta Verde-21</span></button>
            </div>
          </div>
          
          <div class="folha-lun" id="folha-acoes" role="dialog" aria-modal="true" aria-labelledby="tit-acoes" hidden>
            <div class="folha-corpo">
              <div class="folha-topo"><h3 id="tit-acoes">Este post</h3><button type="button" class="fechar-folha" id="fechar-acoes" aria-label="Fechar">×</button></div>
              <button type="button" class="op-apoio" id="acao-denunciar"><span class="ic" style="background: #FCEBEB; color: #A32D2D"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg></span><span><b>Denunciar post</b><small>Link, valor, assédio, convite para apostar ou exposição de alguém.</small></span></button>
              <button type="button" class="op-apoio" id="acao-bloquear"><span class="ic" style="background: var(--trilho); color: var(--texto)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/></svg></span><span><b id="acao-bloquear-tit">Bloquear planeta</b><small>Você não vê mais posts, respostas e mensagens dele. Ele não é avisado.</small></span></button>
            </div>
          </div>
          <div class="folha-lun" id="folha-planeta" role="dialog" aria-modal="true" aria-labelledby="tit-planeta" hidden>
            <div class="folha-corpo">
              <div class="folha-topo"><h3 id="tit-planeta">Seu planeta</h3><button type="button" class="fechar-folha" id="fechar-planeta" aria-label="Fechar">×</button></div>
              <div class="previa-pl"><span class="bola" id="previa-bola"></span><b id="previa-nome">Planeta Verde-21</b><small>É assim que os outros planetas veem você.</small></div>
              <label class="campo-nome"><span class="pref" aria-hidden="true">Planeta</span><span class="sr">Nome do seu planeta</span><input id="txt-planeta" maxlength="18" autocomplete="off" spellcheck="false"></label>
              <div class="chips" id="sugestoes-pl" role="group" aria-label="Sugestões de nome"></div>
              <fieldset class="cores-pl"><legend>Cor</legend><div id="cores-pl"></div></fieldset>
              <fieldset class="regiao-pl"><legend>Sua região <small>· só a região aparece, nunca a cidade</small></legend><div class="chips" id="regiao-pl" role="radiogroup" aria-label="Sua região"></div></fieldset>
              <label class="interr"><span><b>Mostrar meus dias de recomeço</b><small>Se desligar, ninguém vê há quantos dias você está sem apostar.</small></span><input type="checkbox" id="mostrar-dias" role="switch"></label>
              <div id="bloqueados-pl"></div>
              <ul class="checagem" id="checagem-pl" aria-live="polite"></ul>
              <p class="regra-lun">Escolha um nome que não mostre quem você é: nada de nome real, apelido conhecido, @ ou cidade. Você pode trocar quando quiser.</p>
              <button type="button" class="btn-lun" id="salvar-planeta">Salvar planeta</button>
            </div>
          </div>
          <nav class="nav" aria-label="Menu principal" data-nav style="margin: 0"></nav>
        </section>

        <section class="tela tela-fio" id="tela-fio" data-tela="fio" aria-label="Conversa do mural" hidden>
          <div class="topo-fio"><button class="voltar" type="button" data-ir="luneta"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg>Luneta</button><span id="fio-const"></span></div>
          <div class="rol-fio" id="rol-fio"></div>
          <div class="rapidas" id="rapidas-fio"></div>
          <form class="compor" id="compor-fio" autocomplete="off"><label class="sr" for="txt-fio">Responder</label><input id="txt-fio" maxlength="300" placeholder="Responder com cuidado…"><button type="submit" aria-label="Enviar"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12l16-8-6 16-3-7z"/></svg></button></form>
        </section>

        <section class="tela tela-conversa" id="tela-conversa" data-tela="conversa" aria-label="Conversa" hidden>
          <div class="topo-fio"><button class="voltar" type="button" id="voltar-conversa"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg>Conversas</button><span id="conv-sub"></span></div>
          <h3 class="tit-conv" id="conv-tit"></h3>
          <div class="rol-msgs" id="rol-msgs" aria-live="polite"></div>
          <div class="rapidas" id="rapidas"></div>
          <form class="compor" id="compor-conv" autocomplete="off"><label class="sr" for="txt-conv">Mensagem</label><input id="txt-conv" maxlength="300" placeholder="Escreva para a roda…"><button type="submit" aria-label="Enviar"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12l16-8-6 16-3-7z"/></svg></button></form>
        </section>
        <section class="tela tela-fin" id="tela-financas" data-tela="financas" aria-label="Finanças" hidden>
          <div class="cab-fin">
            <div class="linha-tit"><h2>Finanças</h2></div>
            <p class="sub-fin">Seu controle financeiro pessoal. Só você vê.</p>
            <div class="rios-faixa" role="img" id="rios-faixa" aria-label="Rios do seu planeta">
              <svg viewBox="0 0 350 128" preserveAspectRatio="none" aria-hidden="true">
                <defs><linearGradient id="grad-agua" x1="0" x2="1"><stop offset="0" stop-color="var(--agua-1)"/><stop offset=".5" stop-color="var(--agua-2)"/><stop offset="1" stop-color="var(--agua-1)"/></linearGradient></defs>
                <path class="risco" d="M20 50 l14 6 l8 -5 M210 22 l10 8 l12 -3 M120 86 l9 -6 l11 4 M290 112 l12 -7 M60 120 l8 -5 M318 48 l-9 7"/>
                <g class="rio" data-rio="amazonas"><path class="margem" d="M-10 34 C 40 14, 80 46, 140 28 S 240 12, 290 34 S 360 40, 400 24"/><path class="leito" d="M-10 34 C 40 14, 80 46, 140 28 S 240 12, 290 34 S 360 40, 400 24"/><path class="agua" d="M-10 34 C 40 14, 80 46, 140 28 S 240 12, 290 34 S 360 40, 400 24" pathLength="420"/><path class="brilho" d="M-10 34 C 40 14, 80 46, 140 28 S 240 12, 290 34 S 360 40, 400 24"/></g><g class="rio" data-rio="saoFrancisco"><path class="margem" d="M-10 70 C 50 84, 100 54, 160 68 S 250 86, 300 64 S 370 58, 400 72"/><path class="leito" d="M-10 70 C 50 84, 100 54, 160 68 S 250 86, 300 64 S 370 58, 400 72"/><path class="agua" d="M-10 70 C 50 84, 100 54, 160 68 S 250 86, 300 64 S 370 58, 400 72" pathLength="420"/><path class="brilho" d="M-10 70 C 50 84, 100 54, 160 68 S 250 86, 300 64 S 370 58, 400 72"/></g><g class="rio" data-rio="parana"><path class="margem" d="M-10 100 C 30 112, 90 92, 150 106 S 230 120, 280 98 S 360 94, 400 108"/><path class="leito" d="M-10 100 C 30 112, 90 92, 150 106 S 230 120, 280 98 S 360 94, 400 108"/><path class="agua" d="M-10 100 C 30 112, 90 92, 150 106 S 230 120, 280 98 S 360 94, 400 108" pathLength="420"/><path class="brilho" d="M-10 100 C 30 112, 90 92, 150 106 S 230 120, 280 98 S 360 94, 400 108"/></g>
              </svg>
              <div class="rotulos" aria-hidden="true"><span class="rot" data-rot="amazonas" style="top: 30px"><b>Amazonas</b><small>Pix menor à noite</small></span><span class="rot" data-rot="saoFrancisco" style="top: 66px"><b>São Francisco</b><small>Bloqueador de sites</small></span><span class="rot" data-rot="parana" style="top: 102px"><b>Paraná</b><small>Combinar com alguém</small></span></div>
            </div>
            <div class="seg" role="tablist" aria-label="Partes das finanças" style="--n: 3">
              <span class="ind" id="ind-abas" aria-hidden="true"></span>
              <button type="button" role="tab" id="aba-basico" aria-selected="false" aria-controls="painel-fin" data-aba="basico">Básico</button>
              <button type="button" role="tab" id="aba-dividas" aria-selected="true" aria-controls="painel-fin" data-aba="dividas">Dívidas</button>
              <button type="button" role="tab" id="aba-barreiras" aria-selected="false" aria-controls="painel-fin" data-aba="barreiras">Barreiras</button>
            </div>
          </div>
          <div class="rol-fin" id="painel-fin" role="tabpanel"></div>
          <div class="folha-lun" id="folha-divida" role="dialog" aria-modal="true" aria-labelledby="tit-nova-div" hidden>
            <div class="folha-corpo">
              <div class="folha-topo"><h3 id="tit-nova-div">Anotar uma dívida</h3><button type="button" class="fechar-folha" id="fechar-divida" aria-label="Fechar">×</button></div>
              <p class="dica-fin" style="margin: -6px 0 0">Só você vê esta lista. O app não acessa banco nem CPF.</p>
              <p class="rotulo-fin">Que tipo de dívida?</p>
              <div class="chips chips-fin" id="tipos-div" role="radiogroup" aria-label="Tipo de dívida"></div>
              <label class="campo-fin" id="campo-quem" hidden><span>Com quem? <small>só o primeiro nome ou apelido</small></span><input id="div-quem" maxlength="24" autocomplete="off"></label>
              <label class="campo-fin"><span>Valor aproximado <small>opcional</small></span><span class="com-pref"><b aria-hidden="true">R$</b><input id="div-valor" inputmode="numeric" maxlength="9" autocomplete="off" placeholder="não sei ainda"></span></label>
              <button type="button" class="botao fin" id="salvar-divida" disabled>Anotar dívida</button>
            </div>
          </div>
          <nav class="nav" aria-label="Menu principal" data-nav style="margin: 0"></nav>
        </section>

        <section class="tela tela-troca" id="tela-troca" data-tela="troca" aria-label="Hábitos saudáveis" hidden>
          <div class="cab-troca">
            <button class="voltar" type="button" data-ir="inicio"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg>Início</button>
            <h2>Hábitos saudáveis</h2>
            <p class="lead">Quando a vontade aparece, troque a aposta por outra coisa. Ela passa mais rápido.</p>
            <p class="rotulo-fin" id="rot-tempo" style="margin-top: 4px">Quanto tempo você tem agora?</p>
            <div class="seg" role="group" aria-labelledby="rot-tempo" style="--n: 3"><span class="ind" id="ind-tempo" aria-hidden="true"></span><button type="button" data-tempo="0" aria-pressed="true">2 min</button><button type="button" data-tempo="1" aria-pressed="false">15 min</button><button type="button" data-tempo="2" aria-pressed="false">1 hora ou mais</button></div>
          </div>
          <div class="rol-fin" id="painel-troca" aria-live="polite"></div>
          <div class="passou" id="passou" role="dialog" aria-labelledby="passou-tit">
            <h3 id="passou-tit">Como está a vontade agora?</h3>
            <div class="notas" role="group" aria-label="Vontade de 0 a 10" id="notas-troca"></div>
            <div class="legenda-notas"><span>0 · passou</span><span>10 · muito forte</span></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px"><button class="botao contorno" type="button" id="passou-depois" style="text-align: center">Ainda não sei</button><button class="botao cheio" type="button" id="passou-ok" disabled style="background: #0F6E56; color: #FFFFFF">Registrar</button></div>
          </div>
        </section>

        <section class="tela simples" id="tela-divida" data-tela="divida" aria-label="Dívida" hidden style="padding: 16px 0 0; gap: 0">
          <div style="padding: 0 20px 4px"><button class="voltar" type="button" data-ir="financas"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg>Finanças</button></div>
          <div class="rol-fin" id="painel-divida"></div>
        </section>
      </div>

      <div class="veu" id="veu"></div>
      <div class="info" id="info" role="dialog" aria-modal="true" aria-labelledby="info-titulo" aria-hidden="true" inert>
        <div class="alca" aria-hidden="true" style="width: 40px; height: 4px; border-radius: 2px; background: var(--borda); margin: 4px auto 8px"></div>
        <h2 id="info-titulo">Por que o planeta começa seco</h2>
        <p class="sub" style="margin: 0 0 12px">As apostas tiraram dinheiro e tranquilidade de muitas famílias. Isso tem tratamento.</p>
        <h3 class="sec-info">No mundo</h3>
        <div class="grupo">
          <div><b>1,2%</b><p>dos adultos têm transtorno do jogo, uma condição de saúde reconhecida pela OMS.</p><p class="fonte">OMS, ficha sobre jogos de azar, 2024</p></div>
          <div><b>6 pessoas</b><p>em média são afetadas por cada pessoa que aposta em nível de risco, quase sempre a família.</p><p class="fonte">OMS, 2024</p></div>
          <div><b>15,8%</b><p>de quem joga cassino online tem jogo problemático. Na população em geral são 1,41%.</p><p class="fonte">Tran et al., The Lancet Public Health, 2024</p></div>
        </div>
        <h3 class="sec-info">No Brasil</h3>
        <div class="grupo">
          <div><b>R$ 62,5 bilhões</b><p>perdidos pelas famílias brasileiras em apostas em 2025.</p><p class="fonte">Comsefaz, Boletim Fiscal dos Estados, via Agência Brasil</p></div>
          <div><b>925 mil</b><p>pessoas bloquearam o próprio CPF nas casas de aposta até julho de 2026.</p><p class="fonte">Ministério da Fazenda, julho de 2026</p></div>
          <div><b>25/09/2026</b><p>a Medida Provisória 1.394 proibiu as apostas de quota fixa no país. O STF discute a medida. Quem já foi afetado continua precisando de apoio.</p><p class="fonte">MP 1.394/2026, Planalto</p></div>
        </div>
        <h3 class="sec-info">Pelas regiões</h3>
        <div class="grupo">
          <div><p class="reg-info">Sul</p><p>No Paraná, em Santa Catarina e no Rio Grande do Sul, cerca de <b class="inl">1 em cada 8 pessoas</b> com 16 anos ou mais apostou em bets no mês anterior à pesquisa.</p><p class="fonte">DataSenado, Panorama Político 2024</p></div>
          <div><p class="reg-info">Sudeste</p><p>A cidade do Rio tinha <b class="inl">1.793.348 CPFs</b> ligados a sites de apostas em março de 2026.</p><p class="fonte">SIGAP, Ministério da Fazenda, março de 2026</p></div>
          <div><p class="reg-info">Centro-Oeste</p><p>Em Mato Grosso do Sul, entre <b class="inl">R$ 520 milhões e R$ 4,4 bilhões</b> foi o impacto negativo das apostas na economia em 2024 (estimativa).</p><p class="fonte">CNC, janeiro de 2025</p></div>
          <div><p class="reg-info">Nordeste</p><p><b class="inl">65%</b> dos entrevistados disseram que o dinheiro das apostas fez falta no orçamento. A média do país foi 56%.</p><p class="fonte">Radar Febraban, pesquisa Ipespe, outubro de 2024</p></div>
          <div><p class="reg-info">Norte</p><p>Pará e Roraima tiveram o maior índice do país: <b class="inl">17%</b> das pessoas com 16 anos ou mais apostaram em bets no último mês. A média nacional foi 12%.</p><p class="fonte">DataSenado, Panorama Político 2024</p></div>
        </div>
        <p class="sub" style="margin: 10px 0 0; font-size: 12.5px">Cada número mede uma coisa diferente: eles mostram o problema, não servem para comparar pessoas ou regiões.</p>
        <div class="pilha" style="margin-top: 14px"><button class="botao cheio" type="button" data-ir="ajuda" id="info-ajuda">Ver caminhos de ajuda</button></div>
        <div class="pilha" style="margin-top: 8px"><button class="botao contorno" type="button" id="fechar-info" style="text-align: center">Entendi</button></div>
      </div>
      <div class="aviso" id="aviso" role="status"></div>
      <div class="recado" id="recado" role="status" aria-live="polite">
        <div class="cab"><span class="ini" id="recado-ini">A</span><span class="quem"><b id="recado-quem">Ana passou pela sua órbita</b><small id="recado-quando">Recado que ela escreveu</small></span><button class="fechar" type="button" id="recado-fechar" aria-label="Fechar recado">×</button></div>
        <blockquote id="recado-txt"></blockquote>
        <div class="botoes"><button class="botao cheio" type="button" id="recado-responder">Responder</button><button class="botao contorno" type="button" id="recado-ok" style="text-align: center">Obrigado</button></div>
      </div>
      <div class="nevoa" id="nevoa" aria-hidden="true"></div>
      <div class="recado" id="rio-volta" role="status" aria-live="polite" style="border-color: #85B7EB">
        <div class="cab"><span class="ini" style="background: #E6F1FB; border-color: #185FA5; color: #185FA5">≈</span><span class="quem"><b id="rio-titulo">O Amazonas voltou a correr</b><small id="rio-sub">Você ativou uma Barreira.</small></span><button class="fechar" type="button" id="rio-fechar" aria-label="Fechar">×</button></div>
        <div class="botoes"><button class="botao cheio" type="button" id="rio-ver">Ver no planeta</button><button class="botao contorno" type="button" id="rio-ok" style="text-align: center">Continuar aqui</button></div>
      </div>
    </div>
  </div>

  
</div>
`;
