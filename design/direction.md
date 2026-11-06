# Dirección de arte — The Tiebreaker

## Sujeto

- **Qué es, en palabras del cliente:** un instrumento web para desempatar decisiones. Escribes el dilema, eliges un método y recibes una *lectura*: veredicto, inclinación de la balanza, confianza, supuestos y primer paso.
- **Audiencia:** alguien con un dilema real y concreto (aceptar una oferta, mudarse, cambiar de carrera, contratar o no). Llega desde el móvil, muchas veces de noche, con prisa y con la decisión ya medio tomada. No quiere un chat: quiere una lectura que pueda citar.
- **Un solo trabajo de la página:** que el dilema pase de "no sé" a "esto hago y esto compruebo". Todo lo demás es soporte.

## Material que solo tiene este sujeto

- **Físico:** balanzas de laboratorio, agujas, escalas graduadas, pesas calibradas, marcas de calibración, papel cuadriculado, lápiz rojo de corregir.
- **Documental:** expedientes, fichas con número de caso, sellos de fecha, tablas de doble entrada, actas, veredictos firmados, ledgers con columnas.
- **Cultural:** el "juicio" cotidiano (pros y contras garabateados en una servilleta), el cuadro de decisiones de una pizarra de oficina, la tradición del *broadside* que publica un veredicto.

## Registro

- **Elegido:** *spec sheet / technical*, con una enmienda: el campo es **papel de boceto** y la lectura se comporta como el **acta de un instrumento**.
- **Por qué:** la decisión es una medida, no una conversación. El registro técnico impone lo que el producto necesita: cifras tabulares, reglas de 1px, densidad, cero adornos. La enmienda de papel mantiene el objeto humano (un caso, no un dashboard).

## Intención de paleta (palabras antes que hex)

- **Campo:** papel de boceto, cálido-neutro y muy claro, no crema.
- **Tinta:** grafito (casi negro, sin azul).
- **Señal:** lápiz rojo de corregir, reservado a lo que decide: el veredicto, el factor que inclina, la acción principal. Nunca decorativo.
- **Dos tintas de pluma:** verde pino para lo que suma, óxido para lo que resta. Se usan como tinta de anotación (texto fino, marcas), no como relleno de interfaz.
- **No debe aparecer:** crema + serif + terracota; índigo/violeta SaaS; degradados; glassmorphism; rejillas de tarjetas redondeadas; verde/rojo de semáforo saturados.

## Tipografía

- **Display y texto:** **Archivo** (grotesca de señalética, eje de anchura variable). El wordmark y las cifras grandes se estampan con el eje estrecho; el texto corrido usa el ancho normal.
- **Datos y etiquetas:** **IBM Plex Mono** con cifras tabulares. Tiene un trabajo real: pesos, puntuaciones, fechas, números de caso y etiquetas de campo son valores que se leen como máquina.
- **Por qué no el par por defecto:** nada de Inter/Roboto/Geist. La grotesca no es neutra: viene de rótulos y prensa deportiva, y su eje de anchura permite que la marca se lea como una etiqueta estampada, no como un logo de startup.
- **Escala:** 1.25; cinco roles (`display`, `título`, `cuerpo`, `pequeño`, `micro`).

## Rejilla y densidad

- **Ancho máximo:** 1240px, 12 columnas, canal 24px.
- **Asimetría:** 7/5 (expediente / lectura) en escritorio; apilado a una columna por debajo de 900px.
- **Relleno de sección:** 72–112px; el bloque de la pregunta respira, la tabla de factores va apretada.
- **Densidad:** apretada donde hay datos (factores, matriz, cuadrantes), aireada en la pregunta y en el veredicto. Nunca alternar al azar.

## Intención de movimiento

- **Una sola frase:** la aguja se asienta una vez.
- **El único momento orquestado:** al llegar una lectura, la viga de la balanza gira desde la horizontal hasta su inclinación real (560ms, `ease-out`, solo `transform`), y solo entonces aparecen la cifra y el veredicto.
- **Explícitamente nada de:** entradas con fade+slide por sección, hover con elevación y sombra, parallax, scroll-triggered, animación del ruido de papel.

## El elemento memorable (exactamente uno)

- **Qué es:** **la aguja** — una balanza dibujada con líneas de 1px que siempre está en pantalla (en reposo en la columna de lectura, inclinada en el resultado) y cuya inclinación es la lectura misma. La cifra de inclinación y los dos platillos cuelgan de ella.
- **Por qué se recuerda:** es el nombre del producto hecho objeto y, a la vez, el dato principal. No es un adorno: si la aguja se quita, la lectura se queda sin su forma.
- **Todo lo demás se queda quieto:** wordmark, formulario, placas de método, tablas, historial, pie.

## Prohibido en este brief

- Tarjetas redondeadas con radio grande, sombra suave y borde tenue (kit SaaS): un solo radio de 2px para controles y 0 para paneles; elevación por filete, no por sombra.
- Etiqueta en versalitas con tracking sobre *cada* título: las etiquetas son nombres de campo y metadatos reales, en caja baja y mono.
- Iconos genéricos de línea en tres tarjetas de características: las placas de método llevan un **esquema del instrumento** (balanza, matriz, cuadrantes), no un icono.
- Emoji, degradados, texto con degradado, estadísticas inventadas, testimonios, "trusted by".
- Cadenas de metadatos unidas con puntos medios, flechas "→" en cada enlace.
- Hero centrado con icono + titular + subtítulo: la página abre con el expediente, no con una portada.

## Prueba de sustitución

- **Otro cliente al que este plan también encajaría:** cualquier "AI analysis tool" con tarjetas de resultado.
- **Eje cambiado tras la comprobación:** la salida deja de ser texto (conclusión + listas) y pasa a ser una **lectura instrumental** (inclinación + confianza + factor decisivo) con la aguja como forma; el registro pasa de tarjetas SaaS a pliego técnico sobre papel. Si se cambia el sujeto, se cae la aguja y se cae el producto.

## Design Read (diales)

```yaml
artifact: herramienta web (formulario + lectura + archivo)
audience: adulto con un dilema concreto, en móvil, con prisa
visual-language: pliego técnico sobre papel de boceto, grafito + lápiz rojo
mode: overhaul
visual-variance: 6
motion-intensity: 3
information-density: 7
asset-dependence: 1
brand-fidelity: 3
```
