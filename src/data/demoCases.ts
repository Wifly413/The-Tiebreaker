import type { DemoCase } from '../types/analysis';
import type { AnalysisType } from '../types/analysis';

export type { DemoCase };

/**
 * Tres casos completos, uno por método. Se cargan sin llamar a la API: son la
 * carta de presentación de la lectura, así que los números cuadran entre sí
 * (pesos, puntuaciones, totales, inclinación y veredicto).
 */

const BALANCE: DemoCase = {
  decision:
    'Me han ofrecido una jefatura de equipo en Ámsterdam: 68.000 € brutos, cuatro días de oficina y mudanza pagada. Mi pareja no puede salir de su contrato hasta junio de 2027 y mi madre, de 78 años, vive sola en Valencia. ¿Acepto y me mudo ahora, o me quedo?',
  result: {
    type: 'balance',
    verdict:
      'No te mudes ahora: pide la jefatura en remoto desde Valencia y firma la mudanza cuando tu pareja pueda salir de su contrato. El dinero no paga catorce meses de distancia ni la vuelta cada dos fines de semana.',
    tilt: -34,
    confidence: 66,
    decisiveFactor:
      'El alquiler: pasar de 950 € a 1.850 € se come casi todo el aumento neto de 1.250 € al mes. Si la empresa cubriera el alquiler los primeros dieciocho meses, el traslado compensaría.',
    assumptions: [
      'Tu pareja puede pedir excedencia o traslado antes de junio de 2027; todavía no lo habéis preguntado.',
      'La empresa mantiene por escrito los cuatro días de oficina y las dos semanas remotas al mes.',
      'El alquiler de 1.850 € incluye gastos; en Ámsterdam lo habitual es pagarlos aparte.',
    ],
    openQuestion:
      '¿La empresa aceptaría firmar la jefatura con incorporación en julio de 2027, cuando tu pareja puede salir de su contrato?',
    nextStep:
      'Escribe esta semana a la responsable de selección y pídele dos cosas por escrito: incorporación en julio de 2027 y cuatro días de oficina. Menos de una hora.',
    factors: [
      {
        text: 'El sueldo neto pasa de 2.450 € a 3.700 € al mes: unos 15.000 € más al año después de impuestos.',
        side: 'for',
        weight: 3,
        certainty: 'alta',
        horizon: 'corto',
      },
      {
        text: 'La jefatura de equipo no existe en la oficina de Valencia: es la única vía de ascenso en los próximos tres años.',
        side: 'for',
        weight: 2,
        certainty: 'alta',
        horizon: 'largo',
      },
      {
        text: 'La empresa paga la mudanza completa (6.500 €) y dos vuelos al mes durante el primer año.',
        side: 'for',
        weight: 2,
        certainty: 'media',
        horizon: 'corto',
      },
      {
        text: 'El contrato permite cuatro días de oficina y dos semanas al mes en remoto desde España.',
        side: 'for',
        weight: 1,
        certainty: 'media',
        horizon: 'medio',
      },
      {
        text: 'Tu pareja no puede salir de su contrato hasta junio de 2027: catorce meses de distancia o de renuncia a su carrera.',
        side: 'against',
        weight: 3,
        certainty: 'alta',
        horizon: 'medio',
      },
      {
        text: 'Tu madre tiene 78 años y vive sola: hoy la ves tres veces por semana y no tienes hermanos en Valencia.',
        side: 'against',
        weight: 3,
        certainty: 'alta',
        horizon: 'corto',
      },
      {
        text: 'El alquiler sube de 950 € a 1.850 €: 10.800 € más al año, casi todo el aumento neto.',
        side: 'against',
        weight: 3,
        certainty: 'alta',
        horizon: 'corto',
      },
      {
        text: 'Dos viajes al mes a Valencia cuestan entre 280 € y 440 €: unos 3.600 € al año.',
        side: 'against',
        weight: 2,
        certainty: 'alta',
        horizon: 'medio',
      },
      {
        text: 'El equipo que dirigirías viene de dos años con dos bajas y rotación alta; no hay datos del clima laboral.',
        side: 'against',
        weight: 2,
        certainty: 'media',
        horizon: 'largo',
      },
    ],
  },
};

const HEAD_TO_HEAD: DemoCase = {
  decision:
    'Se me acaba el contrato de alquiler en septiembre y tengo que decidir dónde vivo los próximos tres años con mi pareja y el niño: ¿piso con terraza en Ruzafa, piso grande en L’Olivereta o me quedo en el actual?',
  result: {
    type: 'head-to-head',
    verdict:
      'Firma el piso de L’Olivereta: gana la matriz por cinco puntos y es el único que te da tres habitaciones sin sacar al niño del colegio. Ruzafa no compensa 300 € más al mes y un quinto sin ascensor.',
    tilt: 32,
    confidence: 58,
    decisiveFactor:
      'El precio: si L’Olivereta subiera 100 €, el piso actual ganaría por un punto. La diferencia entre los dos es de cinco.',
    assumptions: [
      'El piso de L’Olivereta sigue libre en septiembre y el casero firma tres años.',
      'El trayecto de veinte minutos es en bici; en coche, a las 8:00, son treinta y cinco.',
      'El colegio mantiene la línea de infantil el curso que viene.',
    ],
    openQuestion: '¿Cuánto sube el alquiler del piso actual si renuevas en septiembre?',
    nextStep:
      'Pide esta semana el contrato de L’Olivereta por escrito y confirma por teléfono la plaza de infantil: dos llamadas, menos de una hora.',
    options: [
      {
        name: 'Ruzafa, 68 m² con terraza',
        summary: 'Barrio vivo y terraza; 1.250 € y un quinto sin ascensor.',
      },
      {
        name: 'L’Olivereta, 92 m² reformado',
        summary: 'Tres habitaciones por 1.050 €; veinte minutos al trabajo.',
      },
      {
        name: 'Quedarme en el actual',
        summary: '950 € y el colegio al lado, pero 55 m² se quedan cortos.',
      },
    ],
    criteria: [
      { name: 'precio', weight: 3 },
      { name: 'espacio', weight: 3 },
      { name: 'trayecto al trabajo', weight: 2 },
      { name: 'colegio del niño', weight: 2 },
      { name: 'luz y terraza', weight: 1 },
      { name: 'ascensor y acceso', weight: 1 },
    ],
    scores: [
      [4, 5, 8, 6, 9, 2],
      [7, 9, 5, 6, 6, 8],
      [9, 2, 10, 9, 2, 6],
    ],
    winner: 1,
    runnerUp: 2,
    tradeoff:
      'Elegir L’Olivereta te cuesta veinte minutos de trayecto cada día y un barrio con menos vida; a cambio, tu hijo no cambia de colegio y ganas la habitación que hoy os falta.',
  },
};

const STRATEGY: DemoCase = {
  decision:
    'Quiero dejar la consultoría en septiembre para montar un estudio de cerámica con mi hermana. Tengo 24.000 € ahorrados y una hipoteca de 640 € al mes. ¿Lo hago ahora o espero a 2028?',
  result: {
    type: 'strategy',
    verdict:
      'Firma el local en junio y deja la consultoría en septiembre con dos pedidos firmados: el colchón cubre once meses y la ayuda se resuelve en abril. Esperar a 2028 te deja sin el local y sin la ayuda.',
    tilt: 54,
    confidence: 61,
    decisiveFactor:
      'El local de 480 €: si no lo coges en junio, el alquiler del polígono sube a 620 € y el plan deja de caber en los 24.000 € de ahorros.',
    assumptions: [
      'El local sigue libre en junio y el dueño acepta seis meses con opción a otros seis.',
      'Las tres tiendas mantienen el pedido de septiembre por escrito.',
      'Tu hermana puede cubrir dos tardes de ventas desde enero de 2027, ni una antes.',
    ],
    openQuestion: '¿Cuánto factura tu hermana en los tres mercados al año, con cifras y no con impresiones?',
    nextStep:
      'Manda un correo a tu hermana y al dueño del local con tres cifras: facturación de 2025, presupuesto del horno y condiciones del alquiler. Menos de una hora.',
    quadrants: {
      strengths: [
        'Nueve años gestionando proyectos: presupuestas y cierras plazos sin que te tiemble la mano.',
        'Tienes 24.000 € ahorrados: cubren once meses de gastos fijos sin tocar la hipoteca.',
        'Tu hermana vende en tres mercados locales desde 2023 y ya tiene clientes fijos.',
        'El polígono alquila el horno compartido a 180 € al mes y no exige exclusividad.',
      ],
      weaknesses: [
        'No tienes cartera propia: el 100 % de la facturación del primer año sería nueva.',
        'El taller necesita 14.000 € de inversión: horno, torno y tres meses de alquiler.',
        'Tu hermana no puede cubrir las ventas hasta enero de 2027: sigue a jornada completa.',
      ],
      opportunities: [
        'El local de 90 m² del polígono queda libre en junio por 480 € al mes.',
        'Tres tiendas del barrio han pedido cerámica local para la campaña de septiembre.',
        'La ayuda de 6.000 € para autónomos menores de 40 se resuelve en abril.',
      ],
      threats: [
        'Dos estudios abrieron en 2025 en el mismo radio: el precio medio ha bajado un 12 %.',
        'La renovación del alquiler de 2027 sube un 8 % pactado en el contrato.',
        'El horno compartido cierra en agosto por vacaciones: dos semanas sin producción.',
      ],
    },
    moves: [
      {
        kind: 'atacar',
        title: 'Firma el local en junio',
        detail:
          'Cruza tus nueve años de gestión con el local de 480 €: negocia seis meses con opción a otros seis y firma antes de que lo anuncie el polígono.',
        priority: 1,
      },
      {
        kind: 'defender',
        title: 'Vende en tres mercados antes de abrir',
        detail:
          'Cruza la cartera de tu hermana con la bajada del 12 %: entra en los tres mercados con series cortas de veinte piezas y no compitas por precio.',
        priority: 2,
      },
      {
        kind: 'corregir',
        title: 'Haz diez piezas de muestra',
        detail:
          'Cruza la falta de cartera con las tres tiendas que han pedido cerámica local: llévales diez piezas de muestra antes de septiembre.',
        priority: 2,
      },
      {
        kind: 'mitigar',
        title: 'Compra un horno de segunda mano',
        detail:
          'Cruza los 14.000 € de inversión con el cierre del horno en agosto: compra uno de segunda mano por 4.500 € antes de junio y no dependas del compartido en verano.',
        priority: 3,
      },
    ],
  },
};

export const DEMO_CASES: Record<AnalysisType, DemoCase> = {
  balance: BALANCE,
  'head-to-head': HEAD_TO_HEAD,
  strategy: STRATEGY,
};
