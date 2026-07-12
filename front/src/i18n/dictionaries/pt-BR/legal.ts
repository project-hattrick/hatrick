export const legal = {
  common: {
    lastUpdated: 'Última atualização: {date}',
    placeholder: 'Texto provisório de wireframe - substitua por conteúdo jurídico revisado antes do lançamento.',
    tabs: [
      { href: '/legal/privacy', label: 'Privacidade' },
      { href: '/legal/terms', label: 'Termos' },
      { href: '/legal/responsible-gaming', label: 'Jogo Responsável' },
      { href: '/legal/cookies', label: 'Cookies' },
    ],
  },
  privacy: {
    title: 'Política de Privacidade',
    updated: '30 de junho de 2026',
    intro:
      'Este wireframe descreve como o Hat-trick (demo devnet) trataria seus dados. Não é aconselhamento jurídico - o texto final depende de revisão.',
    sections: [
      { heading: 'Dados que coletamos', body: 'Endereço da carteira, nome de exibição e atividade no app (pacotes, elenco, previsões e apostas) necessários para operar a experiência. Não usamos analytics de terceiros nem rastreadores de publicidade.' },
      { heading: 'Carteira e dados on-chain', body: 'Lemos o endereço público da sua carteira devnet para identificar seu perfil. Nunca custodiamos fundos, e esta demo movimenta apenas tokens fictícios da devnet.' },
      { heading: 'Como usamos esses dados', body: 'Para alimentar seu perfil, recalcular atributos fantasy, liquidar previsões e melhorar a confiabilidade. Não vendemos dados pessoais.' },
      { heading: 'Cookies e armazenamento', body: 'Um cookie essencial httpOnly mantém sua sessão de login; o armazenamento local guarda preferências de UI e estado de elenco/apostas. Sem cookies de rastreamento ou publicidade - veja a Política de Cookies para detalhes.' },
      { heading: 'Seus direitos', body: 'Você pode solicitar acesso, correção ou exclusão dos dados do seu perfil a qualquer momento pelo contato abaixo.' },
      { heading: 'Contato', body: 'Dúvidas de privacidade: privacy@hat-trick.demo (placeholder).' },
    ],
  },
  terms: {
    title: 'Termos de Uso',
    updated: '30 de junho de 2026',
    intro:
      'Estes termos são texto provisório do MVP para a demo devnet do Hat-trick. Os termos finais exigem revisão jurídica antes do lançamento.',
    sections: [
      { heading: 'Elegibilidade', body: 'Você precisa ter 18 anos ou mais para usar áreas de apostas. Ao usar o Hat-trick, você confirma que atende aos requisitos de idade e jurisdição.' },
      { heading: 'Devnet e dinheiro fictício', body: 'Esta é uma demo na Solana Devnet. Todos os tokens são fictícios e não têm valor monetário. Nada aqui constitui aposta com dinheiro real.' },
      { heading: 'Apostas e restrições geográficas', body: 'Áreas de apostas (odds ao vivo, cupom de apostas, partidas) são bloqueadas em jurisdições restritas, como o Brasil (Res. CMN 5.298/2026), com aplicação por geolocalização na borda. Onde houver bloqueio, o restante do app - pacotes, fantasy e visualização da partida ao vivo - permanece disponível.' },
      { heading: 'Jogo limpo', body: 'Automação, exploração de falhas ou manipulação de feeds, pacotes, mercados ou matchmaking podem resultar em suspensão.' },
      { heading: 'Conteúdo e propriedade intelectual', body: 'Nomes de jogadores e seleções são exibidos apenas como dados. A direção de arte é genérica e não é afiliada nem endossada pela FIFA ou por qualquer liga.' },
      { heading: 'Responsabilidade e mudanças', body: 'O serviço é fornecido "como está" para demonstração. Podemos atualizar estes termos; o uso contínuo significa aceitação da versão mais recente.' },
    ],
  },
  responsibleGaming: {
    title: 'Jogo Responsável',
    description: 'Nosso compromisso com uma experiência segura, justa e responsável no Hat-trick.',
    updated: '30 de junho de 2026',
    intro:
      'O Hat-trick é uma demo devnet com dinheiro fictício, mas ainda modela controles de jogo responsável e proteções claras ao usuário.',
    sections: [
      { heading: 'Apenas 18+', body: 'O Hat-trick é destinado exclusivamente a usuários com 18 anos ou mais. Ao acessar qualquer área de previsão ou aposta, você confirma que atende à idade mínima exigida na sua jurisdição. Podemos solicitar comprovação de idade a qualquer momento.' },
      { heading: 'Dinheiro fictício / devnet', body: 'Esta plataforma roda na Solana Devnet. Todos os tokens, créditos e ganhos são dinheiro fictício sem valor monetário real. Nada no Hat-trick constitui aposta com dinheiro real. Nenhuma compra é necessária para aproveitar qualquer recurso.' },
      { heading: 'Autoexclusão', body: 'Se você sentir que seu envolvimento está se tornando problemático, pode se autoexcluir das áreas de previsão e apostas a qualquer momento pelas Configurações da conta. A autoexclusão vale imediatamente e dura no mínimo 24 horas. A reativação exige uma confirmação após período de resfriamento.' },
      { heading: 'Limites de depósito e aposta', body: 'Embora esta demo use apenas dinheiro fictício, modelamos controles de jogo responsável: limites diários e semanais de aposta podem ser configurados nas Configurações da conta. Reduções entram em vigor imediatamente; aumentos exigem revisão de 24 horas.' },
      { heading: 'Recursos de ajuda', body: 'Se você ou alguém que você conhece estiver enfrentando problemas com apostas, há suporte confidencial gratuito disponível globalmente. Visite GamCare (gamcare.org.uk), Gamblers Anonymous (gamblersanonymous.org) ou a linha do National Council on Problem Gambling em 1-800-522-4700. Em emergência, contate os serviços locais.' },
    ],
  },
  cookies: {
    title: 'Política de Cookies',
    description: 'Como o Hat-trick usa cookies e armazenamento do navegador, e como você pode gerenciá-los.',
    updated: '30 de junho de 2026',
    intro:
      'Esta página explica o armazenamento mínimo que o Hat-trick usa para manter a demo devnet funcional.',
    sections: [
      { heading: 'O que são cookies?', body: 'Cookies são pequenos arquivos de texto colocados no seu dispositivo quando você visita um site. O Hat-trick usa um único cookie do navegador mais armazenamento local apenas para manter você conectado e lembrar preferências - nunca para rastrear você pela web ou exibir anúncios.' },
      { heading: 'Cookies essenciais', body: 'Definimos um cookie estritamente necessário (ht_session) que mantém sua sessão de autenticação por carteira. Ele é httpOnly, same-site e expira com sua sessão. É necessário para manter o login, portanto é isento de consentimento.' },
      { heading: 'Armazenamento local funcional', body: 'Suas preferências de tema e idioma, elenco fantasy, cupom de apostas e progresso de onboarding ficam no armazenamento local do navegador para recarregamentos rápidos. Esses dados permanecem no seu dispositivo e só são enviados aos servidores quando você sincroniza explicitamente seu perfil.' },
      { heading: 'Sem rastreamento ou publicidade', body: 'Atualmente, o Hat-trick não usa analytics de terceiros, publicidade ou cookies de rastreamento entre sites. Se introduzirmos analytics opcionais no futuro, pediremos seu consentimento primeiro e atualizaremos esta política antes de definir qualquer cookie desse tipo.' },
      { heading: 'Gerenciamento de cookies', body: 'Você pode limpar cookies e armazenamento local a qualquer momento nas configurações do navegador. Limpar o cookie de sessão encerrará seu login; limpar o armazenamento local redefine preferências no dispositivo. Bloquear o cookie essencial pode impedir o funcionamento correto da plataforma.' },
      { heading: 'Atualizações desta política', body: 'Podemos atualizar esta Política de Cookies periodicamente. A data de "Última atualização" acima reflete a revisão mais recente. O uso contínuo do Hat-trick após uma atualização significa aceitação da política revisada.' },
    ],
  },
  geoRestricted: {
    title: 'Indisponível na sua região',
    description: 'Áreas de apostas são restritas na sua jurisdição.',
    updated: '30 de junho de 2026',
    intro:
      'O Hat-trick mantém recursos de fantasy e visualização de partidas disponíveis quando possível, enquanto bloqueia áreas de apostas em regiões restritas.',
    sections: [
      { heading: 'Por que você está vendo isto', body: 'Derivativos de eventos esportivos e áreas de apostas são restritos em algumas jurisdições (por exemplo, Brasil sob a Resolução CMN 5.298/2026). Com base na sua região, odds ao vivo, cupom de apostas e partidas estão indisponíveis para você.' },
      { heading: 'O que você ainda pode fazer', body: 'O restante do Hat-trick permanece aberto: abrir pacotes, montar seu XI fantasy, acompanhar a visualização 2D da partida ao vivo e explorar a loja. Apenas as áreas de apostas são bloqueadas.' },
      { heading: 'Dinheiro fictício / devnet', body: 'O Hat-trick roda na Solana Devnet com dinheiro fictício sem valor real. Esta restrição geográfica modela os controles de compliance que uma casa de apostas em produção aplicaria.' },
    ],
  },
} as const;
