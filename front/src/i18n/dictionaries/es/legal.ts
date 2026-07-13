export const legal = {
  common: {
    lastUpdated: 'Última actualización: {date}',
    placeholder: 'Texto placeholder de wireframe: reemplazar por texto legal revisado antes del lanzamiento.',
    tabs: [
      { href: '/legal/privacy', label: 'Privacidad' },
      { href: '/legal/terms', label: 'Términos' },
      { href: '/legal/responsible-gaming', label: 'Juego Responsable' },
      { href: '/legal/cookies', label: 'Cookies' },
    ],
  },
  privacy: {
    title: 'Política de Privacidad',
    updated: '30 de junio de 2026',
    intro:
      'Este wireframe describe cómo Hatrick (demo devnet) manejaría tus datos. No es asesoría legal: el texto final queda pendiente de revisión.',
    sections: [
      { heading: 'Datos que recopilamos', body: 'Dirección de wallet, nombre visible y actividad en la app (packs, plantilla, predicciones y apuestas) necesarios para operar la experiencia. No usamos analítica de terceros ni trackers publicitarios.' },
      { heading: 'Wallet y datos on-chain', body: 'Leemos tu dirección pública de wallet devnet para identificar tu perfil. Nunca custodiamos fondos y esta demo mueve solo tokens devnet ficticios.' },
      { heading: 'Cómo los usamos', body: 'Para impulsar tu perfil, recalcular atributos fantasy, liquidar predicciones y mejorar la fiabilidad. No vendemos datos personales.' },
      { heading: 'Cookies y almacenamiento', body: 'Una cookie httpOnly esencial mantiene tu sesión; el almacenamiento local guarda preferencias de UI y estado de plantilla/apuestas. Sin cookies de seguimiento o publicidad: consulta la Política de Cookies para más detalles.' },
      { heading: 'Tus derechos', body: 'Puedes solicitar acceso, corrección o eliminación de los datos de tu perfil en cualquier momento mediante el contacto indicado abajo.' },
      { heading: 'Contacto', body: 'Para preguntas de privacidad, contáctanos desde la página de Contacto. Esta es una demo devnet de hackathon, no un servicio de producción.' },
    ],
  },
  terms: {
    title: 'Términos de Uso',
    updated: '30 de junio de 2026',
    intro:
      'Estos términos son texto placeholder MVP para la demo devnet de Hatrick. Los términos finales requieren revisión legal antes del lanzamiento.',
    sections: [
      { heading: 'Elegibilidad', body: 'Debes tener 18+ para usar superficies de apuestas. Al usar Hatrick confirmas que cumples los requisitos de edad y jurisdicción.' },
      { heading: 'Devnet y dinero ficticio', body: 'Esta es una demo en Solana devnet. Todos los tokens son ficticios y no tienen valor monetario. Nada aquí es juego con dinero real.' },
      { heading: 'Apuestas y georrestricciones', body: 'Las superficies de apuestas (cuotas en vivo, boleto de apuestas, partidos) se bloquean en jurisdicciones restringidas como Brasil (Res. CMN 5.298/2026), aplicadas por geolocalización en el edge. Donde estén bloqueadas, el resto de la app - packs, fantasy y vista del partido en vivo - sigue disponible.' },
      { heading: 'Juego limpio', body: 'La automatización, exploits o manipulación de feeds, packs, mercados o matchmaking puede resultar en suspensión.' },
      { heading: 'Contenido e IP', body: 'Los nombres de jugadores y equipos se muestran solo como datos. La dirección artística es genérica y no está afiliada ni respaldada por FIFA ni ninguna liga.' },
      { heading: 'Responsabilidad y cambios', body: 'El servicio se ofrece "tal cual" con fines de demostración. Podemos actualizar estos términos; el uso continuo implica aceptar la versión más reciente.' },
    ],
  },
  responsibleGaming: {
    title: 'Juego Responsable',
    description: 'Nuestro compromiso con un juego seguro, justo y responsable en Hatrick.',
    updated: '30 de junio de 2026',
    intro:
      'Hatrick es una demo devnet con dinero ficticio, pero aun así modela controles de juego responsable y protecciones claras para usuarios.',
    sections: [
      { heading: 'Solo 18+', body: 'Hatrick está destinado exclusivamente a usuarios de 18 años o más. Al acceder a cualquier superficie de predicción o apuesta confirmas que cumples la edad mínima de tu jurisdicción. Nos reservamos el derecho de solicitar prueba de edad en cualquier momento.' },
      { heading: 'Dinero ficticio / devnet', body: 'Esta plataforma funciona en Solana Devnet. Todos los tokens, créditos y ganancias son dinero ficticio sin valor monetario real. Nada en Hatrick constituye juego con dinero real. No se requiere compra para disfrutar ninguna función.' },
      { heading: 'Autoexclusión', body: 'Si sientes que tu participación se vuelve problemática, puedes autoexcluirte de las superficies de predicción y apuestas en cualquier momento desde Configuración en tu menú de cuenta. La autoexclusión es inmediata y dura un mínimo de 24 horas. La reactivación requiere una confirmación tras un periodo de enfriamiento.' },
      { heading: 'Límites de depósito y apuesta', body: 'Aunque esta demo usa solo dinero ficticio, modelamos controles de juego responsable: los límites diarios y semanales de apuesta se configuran desde Configuración en tu menú de cuenta. Los límites entran en vigor al instante y solo pueden reducirse; un aumento requiere un periodo de revisión de 24 horas.' },
      { heading: 'Recursos de ayuda', body: 'Si tú o alguien que conoces tiene dificultades con el juego, hay apoyo confidencial gratuito disponible globalmente. Visita GamCare (gamcare.org.uk), Gamblers Anonymous (gamblersanonymous.org) o la línea del National Council on Problem Gambling en 1-800-522-4700. En una emergencia, contacta a tus servicios locales de emergencia.' },
    ],
  },
  cookies: {
    title: 'Política de Cookies',
    description: 'Cómo Hatrick usa cookies y almacenamiento del navegador, y cómo puedes gestionarlos.',
    updated: '30 de junio de 2026',
    intro:
      'Esta página explica el almacenamiento mínimo que Hatrick usa para mantener funcional la demo devnet.',
    sections: [
      { heading: '¿Qué son las cookies?', body: 'Las cookies son pequeños archivos de texto colocados en tu dispositivo cuando visitas un sitio web. Hatrick usa una sola cookie del navegador más almacenamiento local, solo para mantener tu sesión y recordar preferencias, nunca para rastrearte en la web ni mostrar publicidad.' },
      { heading: 'Cookies esenciales', body: 'Configuramos una cookie estrictamente necesaria (ht_session) que mantiene tu sesión de autenticación de wallet. Es httpOnly, same-site y expira con tu sesión. Es necesaria para permanecer conectado, por lo que está exenta de consentimiento.' },
      { heading: 'Almacenamiento local funcional', body: 'Tus preferencias de tema e idioma, plantilla fantasy, estado del boleto de apuestas y progreso de onboarding se guardan en el almacenamiento local del navegador para recargas rápidas. Estos datos permanecen en tu dispositivo y solo se envían a nuestros servidores cuando sincronizas tu perfil explícitamente.' },
      { heading: 'Sin seguimiento ni publicidad', body: 'Hatrick no ejecuta actualmente analítica de terceros, publicidad ni cookies de seguimiento entre sitios. Si introducimos analítica opcional en el futuro, pediremos tu consentimiento primero y actualizaremos esta política antes de configurar cualquier cookie de ese tipo.' },
      { heading: 'Gestionar cookies', body: 'Puedes borrar todas las cookies y el almacenamiento local en cualquier momento desde la configuración de tu navegador. Borrar la cookie de sesión cerrará tu sesión; borrar el almacenamiento local reinicia tus preferencias en el dispositivo. Bloquear la cookie esencial puede impedir que la plataforma funcione correctamente.' },
      { heading: 'Actualizaciones de esta política', body: 'Podemos actualizar esta Política de Cookies de vez en cuando. La fecha de "Última actualización" refleja la revisión más reciente. El uso continuo de Hatrick después de una actualización implica aceptación de la política revisada.' },
    ],
  },
  geoRestricted: {
    title: 'No disponible en tu región',
    description: 'Las superficies de apuestas están restringidas en tu jurisdicción.',
    updated: '30 de junio de 2026',
    intro:
      'Hatrick mantiene disponibles las funciones fantasy y de visualización de partidos cuando es posible, mientras bloquea superficies de apuestas en regiones restringidas.',
    sections: [
      { heading: 'Por qué ves esto', body: 'Los derivados de eventos deportivos y superficies de apuestas están restringidos en algunas jurisdicciones (por ejemplo, Brasil bajo la Resolución CMN 5.298/2026). Según tu región, las cuotas en vivo, el boleto de apuestas y los partidos no están disponibles para ti.' },
      { heading: 'Qué puedes seguir haciendo', body: 'El resto de Hatrick permanece abierto: abre packs, crea tu XI fantasy, sigue la vista 2D del partido en vivo y explora la tienda. Solo se bloquean las superficies de apuestas.' },
      { heading: 'Dinero ficticio / devnet', body: 'Hatrick funciona en Solana Devnet con dinero ficticio que no tiene valor real. Esta georrestricción modela los controles de cumplimiento que aplicaría una casa de apuestas de producción.' },
    ],
  },
} as const;
