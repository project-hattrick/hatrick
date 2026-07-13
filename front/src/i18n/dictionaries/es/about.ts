export const about = {
  metadata: {
    title: 'Acerca de',
    description:
      'Hatrick es una plataforma de dos modos para el Mundial: predice partidos en vivo en tiempo real o crea tu XI y reta a tus amigos en duelos 1v1, todo impulsado por el feed de TxLINE.',
  },
  hero: {
    eyebrow: 'Hatrick',
    title: 'Una plataforma, dos formas de vivir el Mundial',
  },
  sections: {
    chooseMode: 'Elige tu modo',
    poweredBy: 'Impulsado por',
    txlineTitle: 'TxLINE - el feed en tiempo real',
    values: 'Nuestros valores',
    ready: '¿Listo para jugar?',
    readyBody: 'Conecta tu wallet de Solana y entra en el Mundial.',
  },
  modes: [
    {
      label: 'Modo Live',
      title: 'Partidos reales, emoción real',
      body: 'Sigue cada partido del Mundial mientras sucede. El feed de TxLINE entrega goles, tarjetas y sustituciones en milisegundos. Haz predicciones en mercados en vivo y mira cómo tu saldo reacciona a la acción en la cancha.',
      cta: 'Ir a Live',
    },
    {
      label: 'Modo Fantasy',
      title: 'Tu XI, tus reglas',
      body: 'Arma una plantilla de jugadores reales del Mundial cuyas puntuaciones se actualizan después de cada evento confirmado. Luego elige un rival del directorio de Duelistas y envía un reto 1v1: la arena 2D decide el resultado.',
      cta: 'Crear tu plantilla',
    },
  ],
  txline:
    'Cada evento que ves en Hatrick nace en TxLINE, un stream seguro de Server-Sent Events que entrega datos confirmados del partido en milisegundos tras el silbato. Los goles liquidan tus apuestas. Las asistencias suben la valoración de tu jugador. Las tarjetas rojas cambian la simulación. TxLINE es la fuente única de verdad que mantiene Live y Fantasy sincronizados con la realidad.',
  tags: ['Eventos del partido', 'Estadísticas de jugadores', 'Liquidación de mercados', 'Recalculo de atributos'],
  values: [
    {
      title: 'Todo en tiempo real',
      body: 'Cada gol, tarjeta y sustitución del feed de TxLINE fluye hacia las cuotas Live y las actualizaciones de atributos Fantasy en milisegundos.',
    },
    {
      title: 'Competitivo por diseño',
      body: 'Desde duelos 1v1 clasificatorios hasta predicciones en mercados en vivo, Hatrick está hecho para jugadores que quieren poner a prueba su conocimiento futbolístico contra rivales reales.',
    },
    {
      title: 'Escenario global',
      body: '32 equipos, 64 partidos, una plataforma. Cada encuentro del Mundial es una nueva oportunidad: en Live, Fantasy o ambos.',
    },
    {
      title: 'Transparente y justo',
      body: 'Las liquidaciones ocurren en Solana Devnet y son verificables on-chain. Solo dinero ficticio: sin fondos reales ni mecánicas ocultas.',
    },
    {
      title: 'Atributos basados en datos',
      body: 'Las valoraciones de los jugadores no son conjeturas. Reflejan métricas reales de rendimiento: goles, asistencias, pases clave, entradas, atajadas, recalculadas partido a partido.',
    },
    {
      title: 'Social desde el centro',
      body: 'Agrega amigos, reta rivales y sigue historiales cara a cara. El directorio de Duelistas pone a toda la comunidad de Hatrick a una búsqueda de distancia.',
    },
  ],
} as const;
