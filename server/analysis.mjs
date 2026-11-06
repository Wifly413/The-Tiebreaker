/**
 * Prompts y contrato JSON de los tres métodos.
 *
 * Vive en el servidor a propósito: la clave del proveedor y las instrucciones no
 * viajan al navegador. El cliente solo normaliza lo que recibe.
 */

export const ANALYSIS_TYPES = ['balance', 'head-to-head', 'strategy'];

export const MAX_DECISION = 2000;
export const MAX_LENS = 500;

const BASE_RULES = `Eres analista de decisiones. Trabajas en español de España y escribes para alguien que tiene que decidir esta semana.

Reglas del oficio:
1. Usa los datos del caso. Cada afirmación se apoya en algo que la persona ha escrito (una cifra, un plazo, una persona, una condición). Prohibido el consejo que valdría para cualquier dilema.
2. Si falta un dato que cambia la decisión, no lo inventes: conviértelo en un supuesto explícito y comprobable.
3. Nada de "depende de lo que valores", "considera tus prioridades" ni "podrías plantearte". El veredicto es una decisión, en voz activa y en presente.
4. Escribe para que se pueda actuar: verbos concretos, plazos, cifras. Sin emojis, sin markdown, sin listas dentro de un campo de texto.
5. Coherencia interna: el veredicto, la inclinación y el cuerpo del análisis no pueden contradecirse. Si el cuerpo no sostiene el veredicto, cambia el veredicto.
6. "tilt" es la lectura neta: -100 = todo empuja en contra, 0 = empate real, +100 = todo empuja a favor de la mejor opción. Debe corresponder al peso y la certeza del cuerpo. No devuelvas 0 si el cuerpo contiene un desequilibrio claro.
7. "confidence" es honesta: 20-40 si el caso tiene poca información o datos duros; 75-90 solo si hay hechos verificables y criterios claros.
8. "decisiveFactor" es un único factor: el que, si cambiara, cambiaría el veredicto.
9. "assumptions": 2-4 supuestos que la persona puede comprobar esta semana.
10. "openQuestion": una sola pregunta, cuya respuesta reduciría más la incertidumbre.
11. "nextStep": una acción concreta de menos de una hora, sin dinero de por medio, ejecutable antes de siete días.
12. Idioma: español de España, tuteo, frases cortas. Veredicto: 1-2 frases. Resto de campos: una frase cada uno.`;

/** Sobre común: es lo que convierte una lista en una lectura accionable. */
const ENVELOPE = `{
  "verdict": "recomendación final en 1-2 frases, voz activa, sin condicionales blandos",
  "tilt": 0,
  "confidence": 50,
  "decisiveFactor": "el único factor que, si cambiara, cambiaría el veredicto",
  "assumptions": ["supuesto comprobable", "supuesto comprobable"],
  "openQuestion": "la pregunta cuya respuesta reduciría más la incertidumbre",
  "nextStep": "acción concreta de menos de una hora, ejecutable esta semana"`;

export const MODE_RULES = {
  balance: `Método: BALANZA PONDERADA.
Devuelve entre 6 y 10 factores, con al menos 3 por cada lado.
Cada factor es una razón concreta del caso, no una categoría: "el sueldo sube un 18% y la mudanza cuesta 4.000 €", no "mejora económica".
Asigna a cada factor: "weight" (1-3; 1 táctico, 2 importante, 3 estructural; reparte y no pongas todo en 3), "certainty" ("alta" = hecho verificable, "media" = inferencia razonable, "baja" = especulación) y "horizon" ("corto" = se nota en meses, "medio" = uno o dos años, "largo" = más de tres).
No dupliques el mismo argumento en los dos lados y no incluyas factores que valgan para cualquier decisión.
El orden de "factors" va de mayor a menor peso.`,

  'head-to-head': `Método: CARA A CARA.
Extrae de 2 a 4 opciones reales del texto del caso. Si no están nombradas, usa las implícitas ("seguir como estoy", "aceptar", "negociar") y nómbralas como las diría la persona. No inventes opciones que no pueda elegir.
Define de 4 a 6 criterios con nombre corto en caja baja y "weight" (1-3; 1 deseable, 2 importante, 3 eliminatorio; al menos un criterio debe pesar 3).
Puntúa cada opción de 0 a 10 en cada criterio: "scores" es una matriz con una fila por opción y una columna por criterio, en el mismo orden que "options" y "criteria".
Las puntuaciones deben discriminar: cuando una opción es claramente mejor en un criterio, la diferencia mínima es de 2 puntos; no puntúes todo entre 6 y 8.
"winner" y "runnerUp" son índices de 0 en adelante y deben coincidir con los totales ponderados (puntuación × peso).
"summary" de cada opción: máximo 12 palabras, retrato honesto, sin lenguaje de venta.
"tradeoff": qué sacrifica quien elige al ganador.`,

  strategy: `Método: MAPA ESTRATÉGICO (FODA convertido en jugadas).
"quadrants": entre 3 y 4 ítems por cuadrante, concretos y del caso.
- strengths y weaknesses: internos, en poder de la persona.
- opportunities y threats: del entorno, fuera de su control.
Después deriva exactamente 4 "moves", una por cuadrante:
- "atacar" = fortaleza × oportunidad
- "defender" = fortaleza × amenaza
- "corregir" = debilidad × oportunidad
- "mitigar" = debilidad × amenaza
Cada "detail" nombra explícitamente el factor interno y el externo que cruza, y dice qué hacer esta semana; no repitas el mismo par en dos jugadas.
"priority" es 1, 2 o 3 y no se repite la misma prioridad en las cuatro jugadas.
El "title" de cada jugada es un imperativo corto (máximo 8 palabras).`,
};

export const MODE_SHAPES = {
  balance: `${ENVELOPE},
  "factors": [
    {
      "text": "razón concreta, con los datos del caso",
      "side": "for",
      "weight": 3,
      "certainty": "alta",
      "horizon": "corto"
    }
  ]
}`,

  'head-to-head': `${ENVELOPE},
  "options": [{ "name": "nombre de la opción", "summary": "retrato honesto en 12 palabras o menos" }],
  "criteria": [{ "name": "criterio corto en caja baja", "weight": 2 }],
  "scores": [[7, 9, 5, 6]],
  "winner": 0,
  "runnerUp": 1,
  "tradeoff": "qué sacrifica quien elige al ganador"
}`,

  strategy: `${ENVELOPE},
  "quadrants": {
    "strengths": ["factor interno a favor"],
    "weaknesses": ["factor interno en contra"],
    "opportunities": ["factor del entorno aprovechable"],
    "threats": ["factor del entorno que amenaza"]
  },
  "moves": [
    {
      "kind": "atacar",
      "title": "imperativo corto",
      "detail": "cruza un factor interno con uno externo y dice qué hacer esta semana",
      "priority": 1
    }
  ]
}`,
};

export const VALID_VALUES = {
  side: ['for', 'against'],
  certainty: ['alta', 'media', 'baja'],
  horizon: ['corto', 'medio', 'largo'],
  kind: ['atacar', 'defender', 'corregir', 'mitigar'],
};

const FORMAT_RULES = `FORMATO DE RESPUESTA (obligatorio):
Devuelve SOLO un objeto JSON válido, sin texto antes ni después, sin bloques de código ni markdown.
Los valores enteros van sin comillas. Los textos, sin comillas tipográficas.
El objeto debe tener exactamente esta forma (los corchetes indican el tipo de contenido, no se copian):`;

/**
 * Construye los mensajes del proveedor.
 * @param {'balance'|'head-to-head'|'strategy'} analysisType
 * @param {string} decision
 * @param {string} lens
 * @returns {Array<{role: 'system'|'user', content: string}>}
 */
export function buildMessages(analysisType, decision, lens = '') {
  const rules = MODE_RULES[analysisType];
  const shape = MODE_SHAPES[analysisType];
  if (!rules || !shape) throw new Error(`Método desconocido: ${analysisType}`);

  const lensBlock = lens.trim()
    ? `\n\nLente solicitada por la persona (aplícala al análisis y al veredicto sin romper las reglas anteriores): ${lens.trim()}`
    : '';

  return [
    {
      role: 'system',
      content: `${BASE_RULES}\n\n${rules}${lensBlock}\n\n${FORMAT_RULES}\n${shape}`,
    },
    {
      role: 'user',
      content: `Dilema que tengo que resolver:\n${decision.trim()}`,
    },
  ];
}

/** Quita el cercado de código por si el modelo envuelve el JSON en ```json. */
export function unwrapJson(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readStringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()) : [];
}

/**
 * Validación mínima del contrato en el servidor. El cliente vuelve a normalizar
 * (recorta rangos, recalcula el ganador…), pero una respuesta claramente rota no
 * debe llegar al navegador como si fuera una lectura.
 */
export function assertPayload(payload, analysisType) {
  if (!isRecord(payload)) throw new Error('La respuesta no es un objeto JSON.');
  for (const key of ['verdict', 'decisiveFactor', 'openQuestion', 'nextStep']) {
    if (typeof payload[key] !== 'string' || !payload[key].trim()) {
      throw new Error(`La respuesta no trae "${key}".`);
    }
  }
  if (!Array.isArray(payload.assumptions) || readStringArray(payload.assumptions).length === 0) {
    throw new Error('La respuesta no trae supuestos.');
  }
  if (typeof payload.tilt !== 'number' || typeof payload.confidence !== 'number') {
    throw new Error('La respuesta no trae inclinación o confianza numéricas.');
  }

  if (analysisType === 'balance') {
    if (!Array.isArray(payload.factors) || payload.factors.length === 0) {
      throw new Error('La balanza no trae factores.');
    }
  }

  if (analysisType === 'head-to-head') {
    const options = Array.isArray(payload.options) ? payload.options : [];
    const criteria = Array.isArray(payload.criteria) ? payload.criteria : [];
    if (options.length < 2 || criteria.length === 0) {
      throw new Error('El cara a cara no trae opciones y criterios suficientes.');
    }
    if (!Array.isArray(payload.scores) || payload.scores.length === 0) {
      throw new Error('El cara a cara no trae la matriz de puntuaciones.');
    }
  }

  if (analysisType === 'strategy') {
    const quadrants = isRecord(payload.quadrants) ? payload.quadrants : {};
    const items = ['strengths', 'weaknesses', 'opportunities', 'threats'].every(
      (key) => readStringArray(quadrants[key]).length > 0,
    );
    if (!items) throw new Error('El mapa estratégico no trae los cuatro cuadrantes.');
    if (!Array.isArray(payload.moves) || payload.moves.length === 0) {
      throw new Error('El mapa estratégico no trae jugadas.');
    }
  }

  return payload;
}
