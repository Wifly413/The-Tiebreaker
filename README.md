# The Tiebreaker

Instrumento web para desempatar decisiones. Escribes el dilema, eliges un método y recibes una
**lectura**: veredicto, inclinación de la balanza, confianza, el factor que decide, los supuestos
que hay que comprobar y un primer paso concreto para esta semana.

## Los tres métodos

| Método | Qué hace | Qué devuelve |
| --- | --- | --- |
| **Balanza ponderada** | Cada razón se pondera por impacto, certeza y plazo en lugar de ser una lista plana. | Factores en dos columnas + inclinación neta + factor decisivo. |
| **Cara a cara** | Enfrenta 2–4 opciones reales contra 4–6 criterios ponderados y las puntúa de 0 a 10. | Matriz con totales ponderados, ganador, margen y *trade-off*. |
| **Mapa estratégico** | Convierte el FODA en jugadas: atacar (F×O), defender (F×A), corregir (D×O), mitigar (D×A). | Cuadrantes del caso + cuatro jugadas priorizadas. |

Los tres comparten el mismo "sobre" (`AnalysisEnvelope` en `src/types/analysis.ts`), así que la
lectura se puede comparar entre métodos y archivar igual.

## Arquitectura

```
navegador ──► /api/analyze ──► servidor Node ──► OpenCode Console (OpenAI-compatible)
   │                              (clave aquí)
   └─ archivo en localStorage
```

- **La clave del proveedor nunca llega al navegador.** El front habla solo con `/api/*` del mismo
  origen; el servidor Node guarda la clave, arma el prompt, valida el JSON y aplica límites.
- El servidor sirve también el front compilado (`dist/`), así que en producción es **un único
  servicio** (Render Web Service).
- El cliente sigue normalizando la respuesta (rangos, enums, ganador recalculado) por si el modelo
  devuelve algo raro.

## Desarrollo local

```bash
npm install
cp .env.example .env.local     # y pon tu OPENCODE_API_KEY
npm run dev                    # Vite en :3000 + API en :3001 (proxy /api)
```

Sin `OPENCODE_API_KEY` la app entra en **modo ejemplo**: el botón principal carga una lectura
completa por método sin llamar a la API. Con la clave, el botón pasa a ser «Desempatar» y el
ejemplo queda como enlace secundario.

```bash
npm run build      # front a dist/
npm start          # sirve dist/ + API (PORT, por defecto 3001)
npm run lint       # tsc --noEmit
npm run test:api   # tests de la API con un proveedor falso (sin red ni saldo)
```

## Proveedor: OpenCode Console

La integración usa la API **compatible con OpenAI** de [OpenCode Console](https://opencode.ai/console):
`POST https://opencode.ai/inference/openai/v1/chat/completions` con `Authorization: Bearer <clave>`.

| Variable | Por defecto | Para qué |
| --- | --- | --- |
| `OPENCODE_API_KEY` | — | Clave personal o de service account de OpenCode Console (obligatoria para generar lecturas). |
| `OPENCODE_MODEL` | `deepseek-v4.1-flash` | Modelo a usar. **Tiene que ser de pago**: los gratuitos de OpenCode solo funcionan dentro de OpenCode y devuelven 403 a clientes externos. |
| `OPENCODE_BASE_URL` | `https://opencode.ai/inference/openai/v1` | Cambiar de gateway (OpenRouter, Groq, un proxy propio…) sin tocar código. |
| `OPENCODE_TEMPERATURE` | `0.5` | Creatividad del modelo. |
| `OPENCODE_JSON_MODE` | `json_object` | `none` si tu modelo rechaza `response_format` (el servidor reintenta solo sin él). |
| `OPENCODE_TIMEOUT_MS` | `60000` | Corte de la llamada al proveedor. |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` | `8` / `600000` | Lecturas por IP y ventana. |
| `DAILY_LIMIT` | `300` | Tope diario por instancia (protege tu saldo). |

**Modelos probados como buenos en español y baratos** (precio por 1 M tokens, entrada/salida):
`deepseek-v4.1-flash` ($0.30 / $1.20), `glm-5.3-flash` ($0.15 / $0.50), `gpt-5-nano` ($0.05 / $0.40).
Una lectura típica gasta ~1.000 tokens de entrada y ~600 de salida: **menos de un céntimo**.

También funciona cualquier endpoint compatible con OpenAI (OpenRouter, Groq, Together, DeepSeek):
basta con cambiar `OPENCODE_BASE_URL` y `OPENCODE_MODEL`.

### Si el proveedor responde con error

| Código | Qué significa | Qué hacer |
| --- | --- | --- |
| **402** `PROVIDER_BALANCE` | La cuenta de OpenCode Console no tiene saldo. | Añade créditos en https://opencode.ai/console o cambia `OPENCODE_MODEL`/`OPENCODE_BASE_URL` a otro proveedor que ya pagues. |
| **403** `MODEL_UNAVAILABLE` | Has elegido un modelo gratuito: solo funciona dentro de OpenCode. | Usa un modelo de pago (`deepseek-v4.1-flash`, `glm-5.3-flash`, `gpt-5-nano`…). |
| **502** `PROVIDER_AUTH` | La clave no es válida o ha caducado. | Revísala en *Environment* del servicio. |
| **429** `RATE_LIMIT` | Demasiadas peticiones al proveedor o a esta demo. | Espera; los límites por IP y diarios están en `.env.example`. |

El error exacto del proveedor se incluye en el mensaje que ve la persona (por ejemplo
`402: Insufficient account funds`), así que no hace falta mirar los logs para diagnosticar.

## Desplegar en Render

El repo trae `render.yaml` (Blueprint) preparado. Pasos:

1. Sube el proyecto a GitHub (incluye `package-lock.json`: el build usa `npm ci`).
2. En Render: **New → Blueprint** y conecta el repositorio.
3. Render lee `render.yaml` y crea un **Web Service** Node en la región de Fráncfort con:
   - build: `npm ci && npm run build`
   - start: `npm start`
   - health check: `/api/health`
4. Cuando lo pida, pega el valor de `OPENCODE_API_KEY` (se guarda como secreto; no está en el repo).
5. Deploy. La app queda en `https://<servicio>.onrender.com`.

Notas útiles:

- En el plan **free** el servicio se duerme tras ~15 minutos sin tráfico: la primera visita puede
  tardar ~1 minuto en despertar. El health check lo mantiene vivo mientras haya tráfico.
- Si prefieres crearlo a mano: **New → Web Service**, runtime Node, build `npm ci && npm run build`,
  start `npm start`, y añade las variables de `.env.example` en *Environment*.
- `region: frankfurt` está en el Blueprint; cámbialo si tu audiencia está en América.
- Sin clave, el despliegue funciona igual en modo ejemplo (el health check devuelve
  `ready: false` y la UI ofrece el caso de ejemplo).

## Estructura

```text
design/direction.md        dirección de arte (registro, paleta, tipografía, rejilla, movimiento)
server/                    API + prompts + cliente del proveedor + límites
  index.mjs                arranque (PORT)
  app.mjs                  rutas /api/health y /api/analyze, estático y errores
  analysis.mjs             prompts, contrato JSON y validación del payload
  provider.mjs             llamada OpenAI-compatible, reintento y errores legibles
  config.mjs               variables de entorno
  rateLimit.mjs            límites por IP y diario
scripts/mock-provider.mjs  proveedor falso para probar sin saldo
scripts/test-api.mjs       suite de la API (35 comprobaciones)
src/                       React: expediente, lectura (aguja + banda), archivo
src/api.ts                 cliente de /api
src/hooks/useAnalysis.ts   petición + normalización defensiva
src/hooks/useServiceStatus.ts  ¿hay clave en el servidor? → CTA correcta
src/data/demoCases.ts      lecturas de ejemplo (sin API)
```

## Decisiones que conviene no deshacer

- **La aguja es el dato.** `tilt` (−100…+100) es la lectura neta y la misma que dibuja la balanza;
  si se cambia el modelo de datos, hay que cambiar la aguja en el mismo commit.
- **La clave vive en el servidor.** Nunca vuelvas a inyectarla en el bundle (`VITE_*`/`define`).
- **La respuesta del modelo nunca manda sobre la UI.** El servidor valida el contrato y el cliente
  recorta rangos, valida enums y recalcula el ganador del cara a cara desde la matriz ponderada.
- **Sin tarjetas.** La jerarquía se construye con filetes de 1px, tamaño y peso tipográfico
  (ver `design/direction.md`, apéndice "Prohibido").
- **El archivo vive en el navegador.** La clave de `localStorage` es `tiebreaker-history`; el
  historial antiguo se migra al cargar.
