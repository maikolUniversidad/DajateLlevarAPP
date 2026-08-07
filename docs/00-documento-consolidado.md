# DÉJATELLEVAR
## Documento Maestro Consolidado
### Investigación de mercado · Especificación de producto · Arquitectura · Guía de construcción

---

**Versión:** 3.0 — Documento único consolidado
**Mercado inicial:** Villavicencio y departamento del Meta, Colombia
**Proyección:** Colombia → LatAm
**Naturaleza:** plataforma de servicios y contratación de creadores de contenido, operable de extremo a extremo, con IA nativa e interoperabilidad total

---

## Cómo usar este documento

Este documento consolida tres cuerpos de trabajo que antes estaban separados: la investigación de validación del mercado, la especificación completa del producto, y la guía técnica para construirlo con Claude Code.

Está organizado en cinco partes. No hace falta leerlo linealmente, pero sí conviene leer la Parte I antes de la Parte IV: **construir antes de validar es el error más caro y más común**.

| Parte | Contenido | Para quién y cuándo |
|---|---|---|
| **I** | Investigación: mercado, competidores, DOFA, regulación, riesgos | Antes de comprometer dinero o tiempo. Base para inversionistas y convocatorias |
| **II** | Producto: visión, actores, módulos, creadores, IA, interoperabilidad, MCP | Al definir qué se construye y en qué orden |
| **III** | Arquitectura: stack, modelo de datos, portabilidad, seguridad, cumplimiento | Antes de la primera línea de código |
| **IV** | Construcción: preparación, prompt inicial, sprints, migración | Al abrir VS Code |
| **V** | Gobierno: hoja de ruta, métricas, riesgos, checklists | Continuamente |

---

## Índice general

### PARTE I — INVESTIGACIÓN Y VALIDACIÓN
1. [Resumen ejecutivo de la investigación](#1-resumen-ejecutivo-de-la-investigación)
2. [Tamaño y dinámica del mercado](#2-tamaño-y-dinámica-del-mercado)
3. [Análisis de competidores](#3-análisis-de-competidores)
4. [DOFA, Porter y PESTEL](#4-dofa-porter-y-pestel)
5. [Marco regulatorio colombiano](#5-marco-regulatorio-colombiano)
6. [Riesgos estructurales y lecciones de fracasos documentados](#6-riesgos-estructurales-y-lecciones-de-fracasos-documentados)
7. [Validación previa: la Fase 0](#7-validación-previa-la-fase-0)

### PARTE II — EL PRODUCTO
8. [Visión, propuesta de valor y posicionamiento](#8-visión-propuesta-de-valor-y-posicionamiento)
9. [Qué cambia frente al documento base y por qué](#9-qué-cambia-frente-al-documento-base-y-por-qué)
10. [Actores, roles y modelo operativo](#10-actores-roles-y-modelo-operativo)
11. [Módulos funcionales: todo se opera desde la plataforma](#11-módulos-funcionales-todo-se-opera-desde-la-plataforma)
12. [El núcleo: contratación de creadores de contenido](#12-el-núcleo-contratación-de-creadores-de-contenido)
13. [Capa de Inteligencia Artificial](#13-capa-de-inteligencia-artificial)
14. [Interoperabilidad](#14-interoperabilidad)
15. [MCP — Model Context Protocol](#15-mcp--model-context-protocol)
16. [Modelo de monetización](#16-modelo-de-monetización)

### PARTE III — ARQUITECTURA E IMPLEMENTACIÓN
17. [Arquitectura técnica](#17-arquitectura-técnica)
18. [Modelo de datos](#18-modelo-de-datos)
19. [Stack tecnológico y regla de portabilidad](#19-stack-tecnológico-y-regla-de-portabilidad)
20. [Seguridad, cumplimiento y gobernanza técnica](#20-seguridad-cumplimiento-y-gobernanza-técnica)

### PARTE IV — CONSTRUCCIÓN CON CLAUDE CODE
21. [Preparación: cuentas, herramientas, entorno](#21-preparación-cuentas-herramientas-entorno)
22. [Archivos base del repositorio](#22-archivos-base-del-repositorio)
23. [El prompt inicial](#23-el-prompt-inicial)
24. [La sesión inicial paso a paso](#24-la-sesión-inicial-paso-a-paso)
25. [Prompts de sprint](#25-prompts-de-sprint)
26. [Plan de migración: salir de Vercel y Supabase](#26-plan-de-migración-salir-de-vercel-y-supabase)
27. [Cómo trabajar bien con Claude Code](#27-cómo-trabajar-bien-con-claude-code)

### PARTE V — GOBIERNO DEL PROYECTO
28. [Hoja de ruta por fases](#28-hoja-de-ruta-por-fases)
29. [Métricas y umbrales de decisión](#29-métricas-y-umbrales-de-decisión)
30. [Riesgos y mitigaciones](#30-riesgos-y-mitigaciones)
31. [Checklists operativos](#31-checklists-operativos)

### ANEXOS
- [A. Glosario](#anexo-a--glosario)
- [B. Catálogo completo de eventos de dominio](#anexo-b--catálogo-completo-de-eventos-de-dominio)
- [C. Catálogo completo de herramientas MCP](#anexo-c--catálogo-completo-de-herramientas-mcp)
- [D. Artefactos a producir](#anexo-d--artefactos-a-producir)
- [E. Financiación y apoyo al emprendimiento en Colombia](#anexo-e--financiación-y-apoyo-al-emprendimiento-en-colombia)
- [F. Advertencias sobre los datos de esta investigación](#anexo-f--advertencias-sobre-los-datos-de-esta-investigación)

---
---

# PARTE I — INVESTIGACIÓN Y VALIDACIÓN

---

## 1. Resumen ejecutivo de la investigación

### 1.1 El veredicto

**El concepto es viable, pero de dificultad muy alta.** Es un marketplace de tres lados —clientes, empresas y creadores— en un sector que a nivel global mueve US$271.000 millones en 2025 y crece al 8% anual, pero que solo digitaliza un tercio de sus reservas.

La conclusión operativa es incómoda pero necesaria: **intentar arrancar los tres lados a la vez, con cartera digital propia, IA avanzada y video alojado, es el camino más probable al fracaso.** No porque las ideas sean malas, sino porque cada una de esas piezas multiplica las condiciones que deben cumplirse simultáneamente para que la red tenga tracción.

### 1.2 Las tres recomendaciones que gobiernan todo lo demás

**Primera — Recortar a dos lados.** Arrancar con empresas y clientes en un nicho geográfico estrecho (Villavicencio y el Meta). Activar la capa de creadores solo cuando exista liquidez comprobada: reservas recurrentes semanales en al menos una categoría.

**Segunda — No construir wallet.** Usar un proveedor de pagos licenciado con capacidad de dispersión (Wompi o Mercado Pago) y llevar internamente un ledger de doble entrada. La experiencia del usuario es idéntica; el requisito regulatorio desaparece.

**Tercera — No alojar video.** Embeber TikTok, Instagram y YouTube. El costo de entrega de video escala con las vistas, no con el almacenamiento: un solo video viral puede costar miles de dólares al mes en una etapa donde no hay ingresos que lo sostengan.

### 1.3 Los tres hechos regulatorios que pueden matar el proyecto antes de nacer

| Hecho | Norma | Consecuencia si se ignora |
|---|---|---|
| La plataforma **debe** inscribirse en el Registro Nacional de Turismo | Ley 2068 de 2020, art. 38, y decretos reglamentarios de 2021 | Sanción y obligación de suspender operación |
| Guardar saldo de usuarios **es captación** y exige licencia SEDPE | Ley 1735 de 2014 — capital mínimo cercano a COP $5.846 millones (~US$2M) | Operación ilegal bajo vigilancia de la Superintendencia Financiera |
| El marco de datos aplicable es **colombiano, no europeo** | Ley 1581 de 2012 y Decreto 1377 de 2013; registro ante la SIC | Sanción de la SIC; el documento base citaba GDPR, que no aplica salvo tratamiento de datos de residentes en la UE |

A esto se suma que **Stripe no opera oficialmente en Colombia**, lo que invalida la arquitectura de pagos del documento original.

### 1.4 El diferenciador defendible

De toda la investigación, el hallazgo más valioso es que **nadie mide la brecha entre lo prometido y lo entregado**. Ni las OTAs, ni las plataformas de reservas, ni las de marketing de influencers.

El eje **Expectativa vs Realidad** —donde el cliente califica de −3 a +3 qué tan fiel fue el servicio respecto a lo anunciado— genera el **Índice de Fidelidad Promocional** de cada creador y empresa. Esto convierte la honestidad publicitaria en un activo económico medible, y es muy difícil de copiar porque exige la transacción completa dentro de la plataforma para vincular la cadena *vio el contenido → compró → calificó la fidelidad*.

---

## 2. Tamaño y dinámica del mercado

### 2.1 El mercado global de experiencias

El sector global de tours, actividades y atracciones alcanzó **US$271.000 millones en 2025** y se proyecta a **US$342.000 millones en 2029**, con una tasa de crecimiento anual compuesta del 8% entre 2023 y 2029 — frente al 5% del turismo total. Es el segmento de más rápido crecimiento de todo el sector de viajes (Arival/Phocuswright, *The Outlook for Travel Experiences 2019–2029*).

Douglas Quinby, CEO y cofundador de Arival, lo resume así: *"For years, experiences were called travel's last untapped opportunity, but this report marks a turning point… it is now the fastest-growing segment of travel."*

**El dato más importante del informe:** solo el **33% de esas reservas se hacen en línea**, frente al 64% del turismo global. Ese vacío es simultáneamente la oportunidad y la advertencia. La oportunidad es obvia. La advertencia es que si tantos operadores todavía no venden en línea después de dos décadas de comercio electrónico, es porque el producto es estructuralmente difícil de digitalizar: inventario irregular, capacidad variable, dependencia del clima, operadores pequeños con baja alfabetización digital.

### 2.2 Latinoamérica

El mercado total de viajes de LatAm generó **US$67.900 millones en reservas brutas en 2024** y se proyectaba a **US$79.200 millones en 2025** (Phocuswright). México y Brasil concentran más del 75% del volumen.

**Advertencia metodológica importante:** no existe una cifra pública desglosada exclusivamente del segmento de tours y actividades para LatAm. Phocuswright la comercializa en reportes de pago. Las cifras citadas corresponden al mercado de viajes total, y usarlas como si fueran del segmento de experiencias sería un error de magnitud considerable en cualquier proyección financiera.

### 2.3 Colombia

| Indicador | Cifra | Fuente |
|---|---|---|
| Visitantes no residentes 2024 | **6.696.835** (+8,5% frente a 6.170.221 en 2023) | MinCIT con base en Migración Colombia, anuncio de Presidencia del 21-ene-2025 |
| Divisas por turismo 2025 | **más de US$11.166 millones** | MinCIT, marzo 2026 |
| Comercio electrónico 2024 | **COP 105,4 billones** (+26,7%) | Cámara Colombiana de Comercio Electrónico |
| Cuentas de billeteras digitales | **más de 54 millones** (Nequi, Daviplata, Bancolombia a la Mano) | Colombia Fintech |
| Participación en oferta de actividades de la región | **8,4%**, detrás de Perú y México | Mabrian by Data Appeal, con datos de Civitatis y GetYourGuide |

La llegada de **Bre-B** (sistema de pagos inmediatos interoperables) reduce todavía más la fricción de pago y habilita dispersión instantánea a creadores y prestadores.

### 2.4 El departamento del Meta

| Indicador | Cifra | Fuente |
|---|---|---|
| Turistas recibidos en 2024 | **más de 600.000** (+25%) | MinCIT |
| Visitantes a Caño Cristales / La Macarena 2025 | **8.712** | Reportes de temporada |

**Lectura estratégica:** Caño Cristales es icónico pero minúsculo en volumen y fuertemente estacional, con capacidad de carga limitada por razones de conservación. **No puede ser la base del negocio.** El activo real de Villavicencio es otro: es la puerta de entrada del turismo doméstico bogotano, a 90 kilómetros de una ciudad de once millones de habitantes, con flujo constante de fin de semana y una economía de servicios urbanos —gastronomía, bienestar, deporte, formación— que opera todo el año.

Esto define el catálogo inicial: **mezcla de turismo estacional y servicios urbanos recurrentes**. Los segundos son los que generan la recurrencia que sostiene la liquidez del marketplace entre temporadas.

### 2.5 Economía de creadores

Se proyecta que la economía de creadores en Latinoamérica pase de **US$38.500 millones en 2025 a US$112.700 millones en 2031**, con una tasa de crecimiento anual compuesta del 19,7% (Mobility Foresights).

**Matiz crítico:** la monetización real de los creadores en la región sigue siendo baja. En Brasil, el mercado más maduro de LatAm, solo alrededor del 9% de los creadores vive de ello. Esto significa que el lado "creador" del marketplace tiene abundancia de oferta y escasez de ingresos — lo cual es una ventaja para el arranque (hay muchos creadores dispuestos) y un riesgo de sostenibilidad (si no ganan dinero, se van).

La implicación de producto es directa: **la plataforma debe hacer que el creador cobre, y cobre pronto.** Esa es su promesa central hacia ese lado del mercado, no la vanidad de tener un perfil.

---

## 3. Análisis de competidores

Ningún competidor combina exactamente "marketplace de servicios + contratación de creadores con atribución + operación completa del negocio". Pero cada componente por separado tiene actores fuertes y bien financiados. Ignorarlos sería ingenuo; enfrentarlos de frente, suicida. La estrategia correcta es distinta para cada grupo.

### 3.1 Marketplaces de experiencias y actividades

| Competidor | Propuesta de valor | Comisión | Presencia en Colombia | Amenaza / Oportunidad |
|---|---|---|---|---|
| **Viator** (Tripadvisor) | Mayor marketplace de day tours: más de 300.000 experiencias en 2.500 destinos | 20-30% (25% típico) + tarifa de US$29 por producto desde ago-2025 | Sí, global | Amenaza en tours turísticos. Débil en servicios locales no turísticos y sin capa de creadores |
| **GetYourGuide** | OTA de experiencias con foco en sostenibilidad, 14 idiomas | 20-30% (arranca en 30%, negociable a 25-28%) | Sí, global | Nació como marketplace entre pares y pivotó a OTA tradicional — dato relevante, ver §6 |
| **Airbnb Experiences** | Relanzado el 13-may-2025 en 650 ciudades y 19 categorías; foco en video corto y funciones sociales desde oct-2025 | 20% plano | Sí, catálogo aún pequeño | **El competidor conceptualmente más cercano.** Inversión anunciada de US$200-250 millones. Brian Chesky: *"Now you can Airbnb more than an Airbnb."* El catálogo pequeño es una ventana temporal |
| **Civitatis** | Líder en experiencias en español: más de 90.000 actividades en 4.000 destinos | Comisión a operadores, modelo B2B con agencias | **Aproximadamente 1.300 agencias activas en Colombia** (María Carolina Padilla, Country Manager, Anato 2025), más app móvil recién lanzada | **Amenaza directa.** Ya tiene el terreno, el idioma y la relación con las agencias |
| **Klook** | OTA fuerte en Asia | 15-25% | Menor presencia en LatAm | Solape bajo |
| **Denomades** | Excursiones enfocadas en Sudamérica | Comisión OTA | Fuerte en Chile, Perú y Cusco | Competidor regional directo |
| **Fever, Tiqets, Headout, Musement, TourRadar** | OTAs de nicho (eventos, atracciones, viajes de varios días) | 15-30% | Global | Solape bajo con el nicho local |

**Estrategia frente a este grupo: conectarse, no competir.** Un prestador debe poder publicar simultáneamente en DéjateLlevar y en Viator o Civitatis, con la disponibilidad sincronizada y las reservas consolidadas en una sola agenda. Esto convierte al competidor en canal y da una razón poderosa para adoptar la plataforma aunque su volumen propio todavía sea bajo — resolviendo parcialmente el arranque en frío del lado de la oferta.

### 3.2 Plataformas de reservas y gestión de servicios locales

| Competidor | Modelo | Precio | Presencia |
|---|---|---|---|
| **AgendaPro** | Software de gestión + marketplace propio; respaldo de Y Combinator | Suscripción por profesional | **Líder en LatAm: más de 20.000 negocios** en México, Colombia, Argentina y Chile |
| **Booksy** | Gestión de citas para belleza y barbería | Suscripción mensual predecible por miembro | Global |
| **Fresha** | Software base gratuito + comisión de marketplace | ~20% (o 30% con impulso pagado) sobre el primer cliente nuevo | Global |
| **Mindbody** | Bienestar y fitness, segmento empresarial | Suscripción | Global, poca presencia local |

**Estrategia frente a este grupo: igualar en gestión, superar en demanda y promoción.** Estas plataformas resuelven la agenda pero no traen clientes nuevos ni ofrecen promoción medible. DéjateLlevar debe ser al menos tan buena en gestión —o el prestador no migra— y claramente mejor en generar demanda.

### 3.3 Plataformas de contratación de creadores

| Plataforma | Modelo | Precio | Nota |
|---|---|---|---|
| **Collabstr** | Marketplace autoservicio para contratar creadores | Plan gratuito + 10% de tarifa de contratación | El más cercano al flujo de "contratar creador" |
| **Aspire** (antes AspireIQ) | Suite de gestión para marcas | Desde aproximadamente US$2.000/mes con contrato anual | Segmento empresarial |
| **GRIN** | Enterprise, comercio electrónico | Desde aproximadamente US$2.500/mes | Segmento empresarial |
| **Upfluence, Influencity, Heepsy** | Descubrimiento y gestión | Suscripción | Influencity tiene estudio propio del mercado LatAm |

**El vacío que dejan todas:** ninguna conecta la contratación con la **venta real del servicio**. Miden alcance e interacciones, no reservas pagadas. Y todas están fuera del alcance económico de una PyME colombiana. Ese es exactamente el hueco donde entra DéjateLlevar.

### 3.4 Comercio social y descubrimiento local

**TikTok Shop** entró a Colombia en fase de acceso gradual en 2026, con comisiones de 5-8% y pagos vía PSE, Nequi y Daviplata (antecedentes: España en diciembre de 2024, México en febrero de 2025). Es simultáneamente competidor —ya tiene capa de afiliados y creadores— y **amenaza estructural**: si TikTok habilita servicios agendables y experiencias locales, puede absorber el caso de uso completo.

**Google Business Profile** es el competidor real más grande y el menos visible: domina el descubrimiento local. No tiene reserva transaccional profunda ni contratación de creadores, pero es donde la gente busca.

**Estrategia frente a este grupo: integrarse, no confrontar.** Sincronizar la ficha de Google, aceptar tráfico de TikTok con atribución propia, y competir donde ellos no llegan: la ejecución completa de la transacción y la contratación medible de promoción.

### 3.5 Mapa de posicionamiento

```
                    OPERACIÓN COMPLETA DEL NEGOCIO
                              alta
                               │
              AgendaPro ●      │      ● DÉJATELLEVAR
              Booksy ●         │        (objetivo)
              Fresha ●         │
                               │
    baja ──────────────────────┼────────────────────── alta
    PROMOCIÓN                  │              PROMOCIÓN
    MEDIBLE                    │              MEDIBLE
                               │
              Google ●         │      ● Collabstr
              Civitatis ●      │      ● TikTok Shop
              Viator ●         │      ● Aspire / GRIN
                               │
                              baja
```

El cuadrante superior derecho —operación completa **y** promoción medible— está vacío. Ese es el posicionamiento.

**Frase de posicionamiento:** *DéjateLlevar es donde se opera el servicio y se contrata a quien lo promociona — conectado a todo lo demás.*

---

## 4. DOFA, Porter y PESTEL

### 4.1 Matriz DOFA

#### FORTALEZAS (internas, positivas)

| # | Fortaleza | Sustento |
|---|---|---|
| F1 | Conocimiento del mercado local del Meta y de la cultura llanera | Nicho que ningún competidor global atiende con especificidad |
| F2 | Concepto diferenciado de Expectativa vs Realidad | Nadie mide la brecha promesa-entrega; es defendible y difícil de copiar |
| F3 | Combinación de operación completa + contratación de creadores | El cuadrante vacío del mapa de posicionamiento |
| F4 | Cercanía al cliente para iterar rápido | Un fundador local puede hacer entrevistas y ajustes en días, no en trimestres |
| F5 | Estructura de costos baja | Sin la carga de una organización grande, el punto de equilibrio es alcanzable con volúmenes modestos |
| F6 | Diseño de accesibilidad estructurada | Diferenciador ético y de posicionamiento en un mercado donde nadie lo hace bien |

#### DEBILIDADES (internas, negativas)

| # | Debilidad | Mitigación |
|---|---|---|
| D1 | Marketplace de tres lados: exponencialmente más difícil | Arrancar con dos lados; activar el tercero solo con liquidez comprobada |
| D2 | Alcance sobredimensionado en el planteamiento original | Recorte disciplinado documentado en §9 |
| D3 | Presupuesto y equipo mínimos frente a competidores con cientos de millones | Nicho geográfico donde el tamaño no es ventaja |
| D4 | Dependencia de creadores cuya monetización real en LatAm es baja | La promesa hacia ese lado es *cobrar pronto*, no vanidad |
| D5 | Sin marca ni tráfico inicial | Operación manual previa que genera casos reales antes de construir |
| D6 | Riesgo de dispersión del fundador entre producto, ventas y legal | Secuencia de fases con criterios de avance explícitos |

#### OPORTUNIDADES (externas, positivas)

| # | Oportunidad | Sustento |
|---|---|---|
| O1 | Solo el 33% de las experiencias se reservan en línea | Espacio enorme de digitalización |
| O2 | Turismo colombiano en récord: 6,7 millones de visitantes en 2024; Meta +25% | Viento de cola del sector |
| O3 | 54 millones de billeteras digitales y llegada de Bre-B | Fricción de pago históricamente baja |
| O4 | Comercio electrónico creciendo 26,7% anual | Comportamiento de compra digital consolidado |
| O5 | Fondos públicos no dilutivos disponibles | Fondo Emprender, iNNpulsa, Apps.co |
| O6 | Catálogo de Airbnb Experiences aún pequeño en Colombia | Ventana temporal antes de que el gigante llene el espacio |
| O7 | Creadores locales sin herramientas para cobrar ni demostrar valor | Lado del mercado con necesidad urgente y desatendida |

#### AMENAZAS (externas, negativas)

| # | Amenaza | Mitigación |
|---|---|---|
| A1 | Civitatis, Viator, GetYourGuide y Airbnb con presupuestos gigantes | Conectarse como canal en lugar de competir de frente |
| A2 | TikTok Shop y Meta pueden absorber la capa de creadores | Integrarse como origen de tráfico con atribución propia |
| A3 | Desintermediación: empresas y creadores cierran por fuera | Concentrar valor en la transacción interna, no en candados |
| A4 | Riesgo regulatorio (RNT, SEDPE, tributario) mal gestionado | Cumplimiento desde el día uno, documentado en §5 |
| A5 | Estacionalidad y capacidad de carga limitada de destinos naturales | Catálogo mixto con servicios urbanos recurrentes |
| A6 | Responsabilidad civil en experiencias de aventura | Póliza obligatoria verificada; ver §5.7 |
| A7 | AgendaPro puede sumar capa de promoción | Ventaja de tiempo y foco en el ángulo de creadores |

### 4.2 Cinco Fuerzas de Porter (Colombia)

| Fuerza | Intensidad | Análisis |
|---|---|---|
| **Rivalidad entre competidores** | **ALTA** | OTAs globales con capital, SaaS de reservas consolidados y plataformas de creadores. Ninguno hace exactamente lo mismo, pero todos compiten por el mismo presupuesto y la misma atención |
| **Poder de negociación de proveedores** (empresas y creadores) | **ALTO** | Pueden desintermediar en cualquier momento. No hay costo de cambio real. El poder solo baja si la plataforma aporta demanda que ellos no consiguen solos |
| **Poder de negociación de compradores** | **ALTO** | Múltiples alternativas, cero fidelidad, comparación de precios trivial |
| **Amenaza de sustitutos** | **ALTA** | Google Maps, Instagram y WhatsApp directo con el prestador son sustitutos gratuitos y ya instalados en el hábito |
| **Amenaza de nuevos entrantes** | **MEDIA-ALTA** | Las barreras tecnológicas son bajas; las barreras reales son la liquidez del marketplace y los datos de atribución acumulados |

**Conclusión de Porter:** un entorno estructuralmente duro. La única defensa sostenible es **la acumulación de datos propios** —atribución verificada, índices de fidelidad, historial de conversión por creador— que ningún entrante nuevo puede replicar sin operar el mismo tiempo.

### 4.3 PESTEL (Colombia)

| Dimensión | Factores | Impacto |
|---|---|---|
| **Político** | Gobierno con narrativa pro-turismo; estabilidad regulatoria media; elecciones que pueden cambiar prioridades sectoriales | Neutro-positivo |
| **Económico** | Comercio electrónico y turismo en crecimiento; volatilidad del peso; inflación que afecta el gasto discrecional | Positivo con riesgo cambiario |
| **Social** | Alta adopción de redes sociales; cultura de recomendación entre pares; desconfianza en pagos en línea aún presente en segmentos | Positivo |
| **Tecnológico** | Buena penetración de teléfonos inteligentes; billeteras digitales masificadas; Bre-B; conectividad desigual fuera de cabeceras municipales | Positivo con brecha rural |
| **Ecológico** | Destinos naturales frágiles con capacidad de carga limitada; creciente demanda de turismo sostenible; eventos climáticos que suspenden actividades | Riesgo operativo y oportunidad de diferenciación |
| **Legal** | RNT, Ley 1581 de datos, régimen SEDPE, Estatuto del Consumidor, guía SIC de influenciadores, facturación electrónica DIAN | **Alto — es la dimensión que más condiciona el diseño del producto** |

---

## 5. Marco regulatorio colombiano

Esta es la sección que más decisiones de producto determina. No es un anexo legal: cada norma aquí cambia algo concreto del código o de la operación.

### 5.1 Registro Nacional de Turismo

**Norma:** Ley 300 de 1996, Ley 2068 de 2020 (artículo 38) y decretos reglamentarios de 2021.

**Qué obliga:**
- La plataforma electrónica o digital de servicios turísticos **debe inscribirse** en el RNT.
- Debe interoperar con el registro y permitir que los prestadores exhiban su número de RNT.
- **No debe publicar ofertas de prestadores sin RNT vigente.**
- Aplica la contribución parafiscal al turismo.

**Consecuencia de producto:** el alta de un prestador turístico incluye un campo de RNT que se valida antes de permitir publicar. Es una regla de negocio, no un trámite administrativo. Debe estar en el modelo de datos desde la primera migración.

### 5.2 ¿Intermediario o agencia de viajes?

La diferencia práctica es **quién organiza, empaqueta y responde por el plan**:

- Si la plataforma **solo intermedia** entre prestador y cliente → basta el registro como plataforma digital.
- Si la plataforma **vende, opera u organiza planes propios** → debe constituirse como agencia de viajes, con obligaciones considerablemente mayores.

**Decisión de diseño:** DéjateLlevar permanece como **intermediario tecnológico**. No arma paquetes propios. Si en el futuro se quisiera hacerlo, es un cambio de categoría regulatoria que exige análisis jurídico previo, no una función más del producto.

### 5.3 Protección de datos personales

**Norma:** Ley 1581 de 2012, Decreto 1377 de 2013.

**Qué obliga:**
- Política de tratamiento de datos publicada y accesible.
- **Autorización previa, expresa e informada** del titular.
- Inscripción de las bases de datos en el **Registro Nacional de Bases de Datos** ante la SIC.
- Canal de atención de consultas y reclamos con plazos definidos.
- Tratamiento reforzado de **datos sensibles** y de datos de menores.

**Consecuencia de producto:**
- Tabla de consentimientos con marca de tiempo, versión de la política aceptada y finalidad específica. No basta un booleano.
- Política de retención por tabla.
- Flujo de exportación y eliminación de datos a solicitud del titular.
- **La información sobre accesibilidad y discapacidad puede constituir dato sensible.** Se trata como declaración voluntaria con autorización separada, y las reseñas de accesibilidad se agregan de forma que no identifiquen a la persona.

**Sobre el GDPR:** el documento base lo citaba. **No aplica** salvo que se traten datos de residentes en la Unión Europea. Citar una norma extranjera mientras se incumple la local es el peor de los dos mundos.

### 5.4 Pagos, wallet y prevención de lavado

**Norma:** Ley 1735 de 2014 (régimen SEDPE), normativa SARLAFT y reportes a la UIAF.

**El punto crítico:** guardar saldo de usuarios constituye **captación** y exige licencia como Sociedad Especializada en Depósitos y Pagos Electrónicos, con **capital mínimo cercano a COP $5.846 millones** y vigilancia de la Superintendencia Financiera. En Colombia solo un puñado de empresas la tiene (Movii, Coink, Dale!, Powwi, Ding, Global66).

**Arquitectura que evita el requisito** —y que es la razón de ser del diseño de pagos de este proyecto:

```
1. RECAUDO    El PSP licenciado (Wompi / Mercado Pago) cobra al cliente
              Métodos: tarjetas, PSE, Nequi, Daviplata, Bre-B, efectivo

2. CUSTODIA   El dinero permanece en la cuenta del PSP hasta la liberación
              DéjateLlevar nunca lo tiene

3. LEDGER     La plataforma lleva un libro contable de doble entrada:
              asientos por reserva, comisión, retención, impuesto y pago
              El "saldo" que ve el usuario es la posición neta calculada

4. DISPERSIÓN El PSP transfiere a empresa y creador según el split
```

**Las tres reglas que mantienen el producto fuera del perímetro de captación:**
1. No se permite recargar saldo sin destino transaccional identificado.
2. No se permite transferencia entre usuarios sin una transacción de servicio subyacente.
3. Los retiros van siempre a una cuenta a nombre del titular verificado.

Estas tres reglas deben estar codificadas como invariantes del dominio, no como política escrita.

**SARLAFT:** conocimiento del cliente proporcional al riesgo, monitoreo de operaciones inusuales y reporte de operaciones sospechosas a la UIAF.

### 5.5 Obligaciones tributarias

| Obligación | Detalle |
|---|---|
| **IVA** | 19% sobre las comisiones de la plataforma |
| **Retención en la fuente** | Sobre pagos a prestadores y creadores, según su calidad tributaria |
| **ReteICA** | Por municipio donde se presta el servicio — relevante en operación multi-ciudad |
| **Facturación electrónica** | Obligatoria ante la DIAN, vía proveedor tecnológico autorizado |
| **Documento soporte** | Para pagos a creadores no obligados a facturar |
| **Forma societaria** | Constituir SAS (Ley 1258 de 2008) |

**Consecuencia de producto:** el cálculo tributario ocurre **en el momento de la transacción**, no al cierre del mes. Cada asiento del ledger lleva su desglose fiscal. Reconstruir esto después es un infierno contable.

### 5.6 Publicidad con influenciadores

**Norma:** Guía de buenas prácticas en la publicidad a través de influenciadores, expedida por la SIC en 2020.

**Qué obliga:** revelación destacada y clara del contenido pagado. Incluye no solo el dinero, sino productos gratuitos, invitaciones y cualquier incentivo. La prensa ha reportado multas de hasta 2.000 SMMLV por publicidad engañosa.

**Consecuencia de producto:**
- El contrato de campaña incluye cláusula obligatoria de revelación.
- El sistema **verifica** que la publicación incluya la revelación antes de aprobar el entregable.
- Es a la vez cumplimiento legal y refuerzo del diferenciador de honestidad.

### 5.7 Responsabilidad en experiencias de riesgo

En junio de 2025 se suspendieron indefinidamente las actividades de rafting y tubing en el cañón del río Güejar, en Mesetas (Meta), tras la muerte de cuatro turistas en una creciente súbita.

**Este antecedente fija el estándar mínimo de diligencia** para cualquier plataforma que intermedie experiencias de aventura en la región. Consecuencias de producto no negociables:

- Categorías de riesgo identificadas en el modelo de datos.
- **Póliza de responsabilidad civil vigente**, cargada y verificada, como requisito para publicar en esas categorías.
- Protocolo de suspensión automática por alerta climática o de autoridad.
- Exención de responsabilidad firmada digitalmente por el cliente.
- Registro de las condiciones bajo las cuales se autorizó cada prestación.

### 5.8 Estatuto del Consumidor

**Norma:** Ley 1480 de 2011.

Información clara y veraz, derecho de retracto, reversión de pago, y responsabilidad del intermediario en comercio electrónico. La autoridad es la SIC.

**Consecuencia de producto:** las políticas de cancelación y reembolso deben ser explícitas antes del pago, no en un enlace enterrado. El flujo de reversión de pago debe existir desde el MVP.

### 5.9 Resumen de cumplimiento con impacto en el código

| Norma | Cambio concreto en el producto |
|---|---|
| Ley 2068/2020 (RNT) | Campo RNT validado antes de publicar servicio turístico |
| Ley 1581/2012 | Tabla de consentimientos versionada; exportación y borrado; política de retención |
| Ley 1735/2014 | Ledger de doble entrada; prohibición de recarga libre y de transferencias entre usuarios |
| Guía SIC influenciadores | Cláusula contractual + verificación de revelación en el entregable |
| Ley 1480/2011 | Política de cancelación visible antes del pago; flujo de reversión |
| Estatuto Tributario | Desglose fiscal por asiento contable, en el momento de la transacción |
| Antecedente Güejar | Póliza verificada por categoría de riesgo; suspensión por alerta |

---

## 6. Riesgos estructurales y lecciones de fracasos documentados

### 6.1 Casos de fracaso

**Vayable** — marketplace entre pares de experiencias con locales, incubado en Y Combinator. Cerró en noviembre-diciembre de 2019 tras casi una década de operación. Su mensaje de despedida fue *"Goodbye. It's been a great adventure."* (Arival, TechCrunch).

*Lección:* el marketplace entre pares puro de experiencias no escala. La confirmación más elocuente es que **GetYourGuide empezó con el mismo modelo y sobrevivió justamente porque pivotó a OTA tradicional con inventario curado.**

**Tripping.com** — metabuscador de alquileres vacacionales que levantó aproximadamente US$52 millones. Fue comprado casi en quiebra por HomeToGo en diciembre de 2018. Skift lo describió como *"a shell of a company after it burned through millions of dollars in cash on TV advertising"*, sumado a conflictos entre fundadores y junta directiva.

*Lección:* un costo de adquisición de clientes financiado con publicidad masiva mata la economía unitaria. Es el fracaso más común y el más fácil de racionalizar mientras ocurre.

### 6.2 El contraejemplo que enseña más

**ToursByLocals.** Según TechCrunch (13 de enero de 2020), sus fundadores —Paul Melhus, Dave Vincent y Luciano Bullorsky— mantuvieron la empresa **diez años sin capital externo hasta alcanzar 1,45 millones de clientes y aproximadamente US$45 millones en ingresos** antes de su primera ronda (C$33 millones / US$25 millones de Tritium Partners). Aceptaban *"only one in 10 applicants"*.

*Lección:* la **curación estricta de la oferta** fue lo que resolvió el arranque en frío. Menos inventario, mejor inventario, mejor experiencia, más recomendación. Es exactamente lo contrario del instinto de "publicar todo lo posible para tener catálogo".

**Nota de precisión:** Withlocals y Peek siguen operando. No deben citarse como fracasos.

### 6.3 El problema del arranque en frío

El concepto de **"red atómica"** de Andrew Chen (*The Cold Start Problem*) es el marco más útil: la red más pequeña, más densa y autosostenible en la que todos los participantes encuentran suficiente valor para quedarse.

Estrategias documentadas que han funcionado:

| Estrategia | Cómo se aplica aquí |
|---|---|
| **"Come for the tool, stay for the network"** | La agenda y el cobro sirven al prestador aunque no haya ni un cliente de la plataforma. Hipcamp y OpenTable hicieron exactamente esto |
| **Nicho geográfico estrecho** | Villavicencio, no Colombia. La densidad importa más que el tamaño |
| **Subsidiar el lado difícil** | Plan gratuito permanente para prestadores: sin costo fijo, no hay razón para no publicar |
| **Curación estricta** | La lección de ToursByLocals: pocos servicios excelentes vencen a muchos mediocres |
| **Gestor de canales hacia OTAs** | Valor inmediato aunque el volumen propio sea cero |

### 6.4 Por qué tres lados es exponencialmente más difícil

Cada lado adicional multiplica las condiciones que deben cumplirse **simultáneamente** para que la red funcione. Con dos lados hacen falta clientes y oferta al mismo tiempo, en la misma ciudad, en la misma categoría. Con tres, hace falta además que existan creadores relevantes para esa categoría, con audiencia en esa ciudad, y marcas con presupuesto para contratarlos.

La probabilidad de que las tres condiciones coincidan al inicio es baja. Por eso la Fase 2 está **bloqueada** hasta demostrar liquidez en la Fase 1. No es prudencia excesiva: es la diferencia entre este proyecto y Vayable.

### 6.5 Desintermediación

El riesgo de que empresas y creadores cierren tratos por fuera de la plataforma es real e imposible de eliminar.

**Lo que no funciona:** bloquear el intercambio de contactos. Es hostil, se evade fácilmente y envenena la relación con ambos lados.

**Lo que funciona:** concentrar el valor en la transacción interna. Pago protegido, escrow, resolución de disputas, atribución verificable, reputación acumulada, facturación automática. Cuando salirse cuesta más de lo que se ahorra en comisión, la gente se queda.

**Umbral de alarma:** si la tasa estimada de desintermediación supera el 20%, la respuesta correcta es revisar qué valor falta en la transacción interna, no endurecer los candados.

---

## 7. Validación previa: la Fase 0

Esta sección es la más importante del documento y la más fácil de saltarse.

### 7.1 Por qué existe

El error más común y más caro en proyectos como este no es técnico: es **construir seis meses antes de hablar con un solo cliente**. Toda la Parte IV de este documento es inútil si lo que se construye no lo quiere nadie.

### 7.2 Las cuatro actividades

**1. Entrevistas de descubrimiento (20-30 personas)**

Metodología: *The Mom Test*. La regla central es **preguntar por comportamientos pasados y gastos reales, nunca por opiniones o intenciones futuras.**

| No preguntar | Preguntar |
|---|---|
| "¿Usarías una app para esto?" | "¿Cómo conseguiste tu último cliente?" |
| "¿Te parece buena idea?" | "¿Cuánto pagaste la última vez que promocionaste tu negocio?" |
| "¿Pagarías por esto?" | "¿Qué hiciste la última vez que se te cayó una reserva?" |
| "¿Qué características te gustaría?" | "Muéstrame cómo llevas tu agenda hoy" |

Divide las entrevistas: al menos 15 prestadores de servicios, 10 clientes y 5 creadores locales.

**2. Operación manual tipo concierge**

Gestionar **20-30 reservas reales** por WhatsApp y hoja de cálculo, cobrando de verdad, sin una sola línea de código. Esto revela:

- Cuáles son las objeciones reales al momento de pagar.
- Cuánto trabajo operativo real hay detrás de una reserva.
- Qué categorías tienen demanda y cuáles no.
- Si los prestadores responden a tiempo (si no lo hacen, ninguna app lo arregla).

**3. Página de aterrizaje con medición**

Una sola página que explique la propuesta y capture correos. Lo que importa no es el número de visitas sino **la tasa de conversión**: qué porcentaje de quienes leen dejan su correo. Por debajo del 5%, el mensaje no está funcionando.

**4. Cartas de intención**

Conseguir **5 a 10 prestadores** que firmen una carta simple de intención de publicar su servicio cuando la plataforma exista. No tiene valor legal; tiene valor de señal. Si nadie firma, el problema no es el producto: es que no hay dolor suficiente.

### 7.3 Duración y umbral de avance

**Duración:** 4 a 8 semanas.

**Umbral para pasar a construir:**
- [ ] 20+ entrevistas completadas con notas estructuradas
- [ ] 20+ reservas reales gestionadas manualmente y cobradas
- [ ] 5-10 cartas de intención firmadas
- [ ] Al menos una categoría con demanda repetida identificada
- [ ] Tasa de conversión de la página por encima del 5%

**Si estos umbrales no se cumplen, no se construye.** Se ajusta la propuesta y se repite. Es infinitamente más barato repetir la Fase 0 que construir sobre una hipótesis falsa.

### 7.4 Lo que la Fase 0 produce y sirve después

- El catálogo inicial real, con nombres de prestadores comprometidos.
- Las categorías prioritarias basadas en demanda observada, no supuesta.
- Las objeciones de pago que el producto debe resolver.
- Los primeros casos de éxito para vender a los siguientes prestadores.
- El material de sustentación para convocatorias de Fondo Emprender o iNNpulsa, que valoran precisamente esta evidencia.


---
---

# PARTE II — EL PRODUCTO

---

## 8. Visión, propuesta de valor y posicionamiento

### 8.1 Visión

> Que cualquier persona o negocio que ofrezca un servicio pueda venderlo, agendarlo, cobrarlo y promocionarlo con la misma facilidad con que hoy publica una foto — y que quien lo contrata sepa exactamente qué va a recibir antes de pagar.

### 8.2 Qué es DéjateLlevar

Un **sistema operativo comercial** para la economía de servicios y creadores. No es un marketplace más: es la capa donde un negocio publica su servicio, lo vende, lo agenda, lo cobra, lo promociona contratando creadores, mide el resultado y factura — sin salir de la plataforma y sin abandonar las herramientas que ya usa.

Tres decisiones estratégicas la definen:

**Primera: el foco es contratar servicios y contratar creadores.** El planteamiento original repartía el peso entre marketplace de experiencias, red social, cartera digital y gamificación. Aquí el eje es uno solo: **conectar demanda con oferta de servicios y ejecutar la transacción completa**, con la contratación de creadores como el mercado diferenciador. Todo lo demás es soporte de ese eje.

**Segunda: interoperabilidad como característica de primera clase.** La plataforma expone API REST y GraphQL, webhooks, feeds iCalendar y un servidor MCP. Cualquier sistema —Google Calendar, Wompi, HubSpot, Siigo, WhatsApp, n8n, o un asistente de IA— puede leer y escribir con permisos granulares. Y en sentido inverso, la plataforma actúa como cliente MCP para operar herramientas externas en nombre del usuario.

**Tercera: la IA no es un módulo, es el tejido.** Emparejamiento marca-creador, redacción de briefs, precios sugeridos, verificación de audiencia, detección de fraude, resúmenes de reseñas, agentes que agendan. Con gobernanza explícita: trazabilidad, límites de autonomía y persona en el bucle donde hay dinero o reputación en juego.

**Principio operativo transversal — lo mejor para cada actor.** La plataforma no optimiza solo su comisión. Optimiza que el cliente encuentre el servicio correcto, que la empresa consiga el creador con audiencia real, y que el creador cobre lo justo a tiempo. Cuando esos intereses divergen, la plataforma explicita el conflicto en lugar de esconderlo detrás de un algoritmo opaco.

### 8.3 El problema real, por actor

**Para el cliente:** descubrir un servicio local confiable es un proceso roto. Ve un video atractivo, no encuentra cómo reservar, escribe por WhatsApp, no le responden, y cuando llega el servicio no se parece a lo prometido. El vacío entre **lo que se promete** y **lo que se entrega** no tiene ningún mecanismo de medición.

**Para la empresa:** tiene el servicio, pero su operación está partida entre WhatsApp, un cuaderno, Instagram, una hoja de cálculo y un datáfono. Contratar un creador es un salto al vacío: no sabe si la audiencia es real, no sabe cuánto pagar, no sabe si el video generó ventas.

**Para el creador:** su trabajo se cotiza a ojo, cobra tarde o no cobra, negocia por mensaje directo sin contrato, y no puede demostrar con datos que su contenido genera ventas — lo que le impide subir de tarifa.

### 8.4 Propuesta de valor

| Actor | Promesa central | Cómo se cumple |
|---|---|---|
| **Cliente** | *"Sabes qué vas a recibir antes de pagar."* | Reseñas con eje Expectativa vs Realidad, accesibilidad declarada y verificada, disponibilidad real, pago protegido, cancelación clara |
| **Empresa** | *"Opera todo tu negocio desde un solo lugar y contrata promoción que puedes medir."* | Agenda, reservas, cobros, CRM, facturación, contratación de creadores con atribución de ventas real |
| **Creador** | *"Cobra lo que vales, a tiempo, con datos que lo demuestran."* | Tarifas de referencia de mercado, contrato y escrow, atribución verificable, portafolio de resultados exportable |

### 8.5 El diferenciador defendible: Expectativa vs Realidad

Es la métrica que ningún competidor tiene y que ata a los tres actores:

- **El cliente** califica de −3 a +3 qué tan fiel fue la experiencia real respecto a lo que vio anunciado.
- **La empresa** obtiene una señal accionable: si su promesa está inflada, lo sabe antes de que las reseñas negativas se acumulen.
- **El creador** acumula un **Índice de Fidelidad Promocional**: qué tan honesto es su contenido según los clientes que compraron por su recomendación.

Este índice **convierte la honestidad en un activo económico medible**. Un creador con alta fidelidad cobra más y aparece primero en el emparejamiento. Es el mecanismo que hace que promocionar bien sea más rentable que exagerar.

Es difícil de copiar porque exige la transacción completa dentro de la plataforma para vincular la cadena: *vio el contenido → compró → calificó la fidelidad*. Una plataforma que solo mide alcance no puede construirlo.

---

## 9. Qué cambia frente al documento base y por qué

Esta tabla es la bisagra entre el planteamiento original y esta especificación. Cada cambio responde a un hallazgo de la Parte I.

| # | Documento base | Esta versión | Razón |
|---|---|---|---|
| 1 | **Cartera digital propia** con saldo de usuarios | **Ledger interno + custodia en PSP licenciado** | Guardar saldo es captación: exige licencia SEDPE con capital cercano a COP $5.846 millones (§5.4) |
| 2 | **Microservicios desde el inicio** | **Monolito modular** con fronteras de dominio explícitas | Un equipo pequeño paga un sobrecosto enorme por microservicios prematuros. Las fronteras bien definidas permiten extraer después sin reescribir |
| 3 | **Alojamiento propio de Reels** | **Embebido vía oEmbed** de TikTok, Instagram y YouTube | El costo de entrega escala con las vistas. Un video viral puede costar miles de dólares al mes |
| 4 | **Stripe** como pasarela principal | **Wompi y Mercado Pago** | Stripe no opera oficialmente en Colombia (§3, §5.4) |
| 5 | **GDPR** como marco de datos | **Ley 1581/2012 + Decreto 1377/2013 + RNBD** | El marco aplicable es el colombiano (§5.3) |
| 6 | Sin mención de registro turístico | **Inscripción en el RNT** y validación del RNT de cada prestador | Ley 2068/2020 lo obliga (§5.1) |
| 7 | **AWS Personalize** desde el día uno | **Reglas + señales de comportamiento**, luego modelo entrenado | Un recomendador sin datos recomienda peor que una regla de popularidad y cercanía, y cuesta más |
| 8 | Contratación de creadores dispersa en varias vistas | **Módulo central con ciclo de vida completo de 12 etapas** | Es el diferenciador competitivo. Merece ser el corazón, no una función entre veinte |
| 9 | Integraciones no contempladas | **Capa completa de interoperabilidad + servidor MCP** | Un negocio no abandona sus herramientas. La plataforma que se conecta gana sobre la que exige migrar |
| 10 | IA como "recomendaciones y chatbot" | **Doce casos de uso con gobernanza explícita** | La IA genérica no diferencia; la aplicada a emparejamiento, precio y verificación sí |
| 11 | Gamificación extensa por rol | **Reputación funcional** que afecta ranking y precio | Las insignias sin consecuencia económica no cambian comportamiento |
| 12 | Tres lados simultáneos | **Dos lados primero**, tercero con liquidez comprobada | Vayable cerró intentando el modelo puro (§6.1) |
| 13 | Tres tipos de usuario separados | **Una cuenta con perfiles activables** | Un creador que vende sus asesorías no debería necesitar dos cuentas |
| 14 | Accesibilidad como comentario libre | **Campo estructurado declarado y verificado por reseñas** | Diferenciador ético y de posicionamiento; además, dato potencialmente sensible que exige tratamiento cuidadoso |
| 15 | Sin consideración de seguros | **Póliza obligatoria verificada por categoría de riesgo** | El antecedente del río Güejar fija el estándar de diligencia (§5.7) |

---

## 10. Actores, roles y modelo operativo

### 10.1 Identidad unificada

Un error frecuente es crear tres tipos de usuario incompatibles. Aquí la identidad es **una sola cuenta con perfiles activables**:

```
Cuenta (identidad verificada)
├── Perfil Cliente          siempre activo
├── Perfil Creador          activable, requiere verificación de audiencia
├── Perfil Empresa          activable, requiere NIT y RNT si aplica
└── Perfil Agencia          activable, gestiona múltiples empresas o creadores
```

Un creador que además vende sus propias asesorías activa el perfil Empresa sobre la misma identidad. Esto elimina la duplicación que el documento base tenía entre "marketplace del creador" y "empresa".

### 10.2 Niveles de verificación

| Nivel | Requisito | Qué habilita |
|---|---|---|
| 0 | Correo verificado | Navegar, guardar favoritos |
| 1 | Teléfono verificado | Reservar y pagar |
| 2 | Documento de identidad | Recibir pagos, activar perfil Creador |
| 3 | NIT + cámara de comercio | Activar perfil Empresa |
| 4 | RNT vigente | Publicar servicios turísticos |
| 5 | Póliza de responsabilidad civil | Publicar en categorías de riesgo |

### 10.3 Matriz de permisos

| Recurso | Cliente | Creador | Empresa | Agencia | Admin |
|---|---|---|---|---|---|
| Catálogo | Leer | Leer, crear propios | CRUD propios | CRUD gestionados | Todo |
| Reservas | Crear/cancelar propias | Leer atribuidas | Gestionar recibidas | Gestionar delegadas | Todo |
| Campañas | — | Postular, entregar | Crear, aprobar, pagar | Crear en nombre de | Auditar |
| Ledger | Propio | Propio + retiros | Propio + dispersión | Consolidado | Conciliación |
| Reseñas | Crear post-servicio | Responder propias | Responder propias | Responder | Moderar |
| API / MCP | Tokens propios | Tokens propios | Tokens + alcances de organización | Multi-organización | Gestión global |

Los permisos combinan **rol** con **atributos**: un usuario Empresa solo accede a reservas cuya organización coincide con la suya. En PostgreSQL esto se implementa con Row Level Security, de modo que un error en la capa de aplicación no pueda exponer datos de otra organización.

### 10.4 Ciclo de vida de una transacción

```
DESCUBRIMIENTO → COTIZACIÓN → RESERVA → PAGO RETENIDO →
PRESTACIÓN → CONFIRMACIÓN → LIBERACIÓN DE FONDOS →
RESEÑA (Expectativa vs Realidad) → ATRIBUCIÓN → LIQUIDACIÓN
```

Cada transición emite un evento de dominio que alimenta webhooks, integraciones externas, la capa de IA y la analítica. **Ningún estado cambia sin evento.** Esto es lo que permite que la interoperabilidad sea real y no un parche añadido después.

---

## 11. Módulos funcionales: todo se opera desde la plataforma

Doce módulos que cubren el ciclo completo de un negocio de servicios.

### 11.1 Catálogo y ficha de servicio

El objeto central es **Servicio**, con cuatro modalidades que cubren todos los casos:

| Modalidad | Ejemplos | Lógica de disponibilidad |
|---|---|---|
| **Agendado** | Corte de cabello, asesoría, masaje | Slots sobre calendario, duración fija, recursos asignados |
| **Cupo** | Tour, clase grupal, taller | Fechas con aforo, cierre por capacidad, lista de espera |
| **Bajo demanda** | Fotografía de evento, catering | Cotización previa, sin calendario público |
| **Digital** | Curso grabado, consultoría asíncrona | Sin agenda, entrega inmediata o por hitos |

**Campos:** nombre, descripción, categoría y subcategoría, precio (fijo / desde / por cotizar), duración, ubicación o modalidad remota, política de cancelación, requisitos previos, idiomas, capacidad, medios, RNT si aplica, categoría de riesgo, y **accesibilidad estructurada** (movilidad reducida, apoyo visual, apoyo auditivo, apto neurodivergencia, apto menores).

**Mejora clave:** la accesibilidad deja de ser comentario libre del cliente y pasa a ser **campo declarado por la empresa y verificado por las reseñas**. Cuando hay divergencia entre lo declarado y lo reportado, el sistema genera una señal de revisión.

### 11.2 Agenda y disponibilidad

- Horarios base por día de la semana, con excepciones y bloqueos.
- **Recursos**: personas, salas, equipos, vehículos. Una reserva puede consumir varios; la disponibilidad es la intersección.
- Tiempos de preparación y limpieza entre reservas.
- Antelación mínima y máxima de reserva.
- Zonas horarias correctas: almacenamiento en UTC, presentación en la zona del usuario.
- **Sincronización bidireccional** con Google Calendar, Microsoft 365 y CalDAV, más feed iCal de solo lectura.
- Prevención de doble reserva con bloqueo optimista al confirmar.

### 11.3 Reservas y cotizaciones

- Reserva instantánea o con confirmación, configurable por servicio.
- **Cotizaciones** para servicios bajo demanda: el cliente describe la necesidad, la empresa responde con propuesta, se negocia en hilo y se convierte en reserva.
- Reprogramación y cancelación con política automatizada.
- Lista de espera con notificación al liberarse cupo.
- Reservas recurrentes y paquetes de sesiones.
- Check-in con código QR y confirmación de prestación.

### 11.4 Pagos, ledger y liquidaciones

Arquitectura de cuatro capas descrita en §5.4. Elementos adicionales:

**Split por transacción:** comisión de plataforma, comisión del creador atribuido, monto neto de la empresa, retenciones e IVA. Todo calculado y registrado en el momento, no al cierre del mes.

**Escrow para campañas:** el dinero se retiene al aceptar el contrato y se libera contra entregables aprobados. Resuelve simultáneamente el problema número uno del creador —cobrar— y el de la marca —recibir lo pactado.

**Reglas del ledger:** doble entrada estricta. Nunca se actualiza un campo `saldo`; el saldo se calcula sumando asientos. Esto hace la contabilidad auditable y a prueba de condiciones de carrera.

### 11.5 Reseñas y reputación

Formulario estructurado en cinco ejes:

1. **Expectativa vs Realidad** (−3 a +3) — el eje diferenciador
2. **Calidad del servicio** (1-5)
3. **Puntualidad** — tiempo declarado frente a tiempo real
4. **Accesibilidad** — validación de lo declarado por la empresa
5. **Relación valor-precio** (1-5)

Más comentario libre y medios. Solo puede reseñar quien tenga una reserva completada y pagada.

**Reputación derivada** — calculada, no auto-declarada:

| Actor | Índices |
|---|---|
| Empresa | Fidelidad de promesa, tasa de confirmación, puntualidad, tasa de disputa |
| Creador | Índice de Fidelidad Promocional, tasa de conversión, cumplimiento de plazos, calidad de entregables |
| Cliente | Tasa de asistencia, calidad de reseñas |

### 11.6 CRM nativo

- **Ficha de cliente** unificada: historial, gasto acumulado, preferencias, notas internas, canal de origen, etiquetas.
- **Segmentos dinámicos**: "no reservan hace 60 días", "top 10% por gasto", "vinieron por campaña X".
- **Pipeline de cotizaciones** con etapas y probabilidad.
- **Campañas de retención** por correo y WhatsApp, disparadas por evento o segmento.
- **Sincronización bidireccional** con HubSpot, Salesforce, Zoho o Pipedrive.

### 11.7 Mensajería y colaboración

Bandeja unificada donde convergen los hilos cliente-empresa, empresa-creador y soporte. Plantillas, respuestas rápidas, adjuntos y borradores sugeridos por IA. Conectada a WhatsApp Business API.

**Regla anti-desintermediación proporcionada:** no se bloquea el intercambio de contactos, pero las garantías de la plataforma —pago protegido, escrow, disputas, atribución, reputación— solo aplican a transacciones internas. La retención se gana por valor, no por candado.

### 11.8 Facturación y contabilidad

- Factura electrónica DIAN por transacción, vía proveedor tecnológico autorizado o Siigo/Alegra.
- Documento soporte para pagos a creadores no obligados a facturar.
- Cálculo automático de IVA sobre comisión, retención en la fuente y ReteICA por municipio.
- Reportes exportables y sincronización con software contable.

### 11.9 Analítica y reportes

Tableros por rol, todos derivados del mismo flujo de eventos:

- **Empresa:** ingresos, ocupación de agenda, servicios más vendidos, origen del tráfico, retorno por campaña, tasa de cancelación, cohortes de recurrencia.
- **Creador:** vistas, clics, reservas atribuidas, ingresos generados para marcas, comisión propia, fidelidad promocional, comparativa con su segmento.
- **Cliente:** historial, gasto, ahorros por promociones.
- **Plataforma:** GMV, take rate, liquidez, disputas, salud del emparejamiento.

Exportación a CSV, API de reportes, conectores a Google Sheets, Looker Studio y Power BI.

### 11.10 Promociones y programas

Cupones, descuentos por temporada, paquetes multi-servicio, bonos regalo, créditos promocionales, programas de referidos y códigos exclusivos por creador. Todos con reglas de acumulación explícitas y presupuesto máximo.

### 11.11 Confianza, seguridad y disputas

- Verificación por niveles (§10.2).
- **Verificación de audiencia del creador** mediante conexión OAuth a sus plataformas — datos reales de la API, no capturas de pantalla.
- **Centro de disputas** con evidencia, plazos y escalamiento a mediación.
- **Seguros y responsabilidad** para categorías de riesgo (§5.7).
- Moderación de contenido asistida por IA con revisión humana.

### 11.12 Backoffice y administración

Consola interna para moderación, disputas, conciliación de pagos, configuración de comisiones, banderas de funcionalidad, auditoría de acciones administrativas, y panel de salud del marketplace (liquidez por categoría y ciudad).

---

## 12. El núcleo: contratación de creadores de contenido

Este es el módulo que define el producto. Todo lo demás lo sostiene.

### 12.1 Los dos modelos de contratación

| Modelo | Cómo funciona | Para quién |
|---|---|---|
| **Afiliación (por resultado)** | El creador promociona con su enlace o código y gana un porcentaje de cada reserva atribuida. Sin costo fijo para la empresa | PyMEs sin presupuesto, creadores que apuestan por conversión, productos con margen |
| **Campaña (por contratación)** | La empresa contrata entregables definidos por un precio fijo, con escrow. Puede sumar comisión variable | Marcas con presupuesto, lanzamientos, contenido para uso propio, creadores consolidados |

Un mismo acuerdo puede ser híbrido: honorario fijo reducido más comisión por venta. La plataforma calcula qué estructura conviene a cada parte según datos históricos.

### 12.2 Ciclo de vida completo de una campaña

```
1. BRIEF          La empresa define objetivo, presupuesto, entregables, plazos,
                  uso del contenido y territorio.
                  → IA redacta el brief desde una descripción libre

2. EMPAREJAMIENTO El sistema propone creadores ordenados por ajuste real:
                  audiencia verificada, afinidad temática, geografía,
                  conversión histórica, fidelidad promocional, precio.
                  → IA explica POR QUÉ cada creador encaja

3. INVITACIÓN     La empresa invita, o publica el brief abierto y los creadores
                  postulan. Ambos flujos coexisten.

4. NEGOCIACIÓN    Hilo estructurado: contraofertas de precio, entregables y
                  plazos. Cada versión queda registrada.
                  → IA sugiere rango de precio justo para ambas partes

5. CONTRATO       Acuerdo desde plantillas legales colombianas: entregables,
                  plazos, licencia de uso del contenido, exclusividad, causales
                  de terminación, y cláusula obligatoria de revelación
                  publicitaria conforme a la guía SIC.
                  Firma electrónica de ambas partes.

6. ESCROW         El presupuesto se retiene. El creador tiene certeza de cobro;
                  la empresa, de recibir lo pactado.

7. PRODUCCIÓN     Espacio de trabajo: materiales de marca, referencias, guion,
                  cargue de borradores, comentarios con marca de tiempo sobre
                  el video, rondas de revisión limitadas.

8. APROBACIÓN     La empresa aprueba o solicita cambios. El silencio tras N días
                  equivale a aprobación — esto protege al creador.

9. PUBLICACIÓN    El creador publica en sus canales. La plataforma detecta la
                  publicación vía API social, VERIFICA que incluya la revelación
                  de contenido pagado, y registra el enlace de atribución.

10. ATRIBUCIÓN    Cada reserva originada se vincula a la campaña.
                  Modelo multi-toque configurable.

11. LIQUIDACIÓN   Liberación del escrow más comisiones variables.
                  Retenciones y documento soporte automáticos.

12. REPORTE       Cierre con resultados: alcance, clics, reservas, GMV generado,
                  ROAS, fidelidad promocional obtenida.
                  Exportable como caso de éxito por ambas partes.
```

### 12.3 Perfil del creador: datos verificados, no declarados

| Bloque | Contenido | Fuente |
|---|---|---|
| **Audiencia** | Seguidores, alcance medio, interacción, demografía (edad, género, ciudad), horarios activos | OAuth a TikTok, Instagram Graph, YouTube Data — datos de API, no capturas |
| **Contenido** | Categorías, formatos, muestras, calidad de producción | Portafolio + análisis IA |
| **Desempeño comercial** | Reservas generadas, GMV atribuido, tasa de conversión, ticket medio | Interno, verificable |
| **Confiabilidad** | Cumplimiento de plazos, rondas de revisión medias, tasa de cancelación | Interno |
| **Honestidad** | Índice de Fidelidad Promocional | Reseñas de clientes convertidos |
| **Comercial** | Tarifas por formato, disponibilidad, exclusividades vigentes | Declarado + validado por transacciones |

**Alerta de audiencia inflada:** la IA cruza seguidores contra interacción, crecimiento contra picos anómalos, y demografía declarada contra la geografía real de las conversiones. Un creador con 200.000 seguidores y conversión nula queda por debajo de uno con 8.000 seguidores hiperlocales y alta conversión. **El ranking premia resultado, no tamaño.**

### 12.4 Atribución: cómo se sabe quién generó la venta

| Mecanismo | Cobertura | Fiabilidad |
|---|---|---|
| Enlace de seguimiento con parámetros firmados | Clic directo desde biografía o descripción | Alta |
| **Código de creador** aplicado en el pago | Cliente que recuerda el código | Alta — resiste cambios de dispositivo |
| Deep link con atribución diferida | Instalación de app tras ver contenido | Media-alta |
| Encuesta post-reserva "¿cómo nos conociste?" | Todo lo demás | Media, pero cubre el vacío |
| Ventana de vista sin clic | Vio el video, buscó después | Baja — solo señal complementaria |

**Reglas explícitas y publicadas:** ventana de atribución de 30 días por defecto, modelo de último toque no directo por defecto, multi-toque configurable, y procedimiento de resolución de conflictos entre creadores. La transparencia de estas reglas es requisito de confianza: la disputa por atribución es la fuente principal de conflicto en marketing de afiliación.

### 12.5 El motor de equidad: "lo mejor para cada uno"

| Mecanismo | Qué protege |
|---|---|
| **Precio justo bilateral** | La sugerencia de tarifa muestra ambos lados —lo que pagan empresas similares y lo que cobran creadores similares—, no solo el número que conviene a quien pregunta |
| **Transparencia de comisiones** | Cada actor ve el desglose completo antes de aceptar |
| **Aprobación tácita por silencio** | Protege al creador de la empresa que nunca responde |
| **Límite de rondas de revisión** | Protege al creador del trabajo infinito no pagado |
| **Escrow** | Protege a ambos: uno tiene certeza de cobro, el otro de entrega |
| **Licencia de uso acotada** | La empresa no puede usar el contenido fuera de lo pactado |
| **Reseña de fidelidad no eliminable** | Ni la marca ni el creador pueden borrarla; solo se modera por causal objetiva |
| **El ranking no se vende** | Existe pauta destacada, rotulada visiblemente, que no altera el puntaje de ajuste |

---

## 13. Capa de Inteligencia Artificial

### 13.1 Principios de gobernanza

1. **La IA propone, la persona decide** donde hay dinero, contrato o reputación en juego.
2. **Toda salida es trazable**: se registra modelo, versión, entrada resumida, salida y quién la aceptó.
3. **La IA se etiqueta**: el usuario siempre sabe cuándo un texto o recomendación fue generado por IA.
4. **Degradación elegante**: si el proveedor falla, la funcionalidad cae a reglas deterministas, nunca a error.
5. **Costo controlado**: caché semántico, modelos pequeños para tareas simples, modelos grandes solo donde aportan.

### 13.2 Los doce casos de uso

| # | Caso de uso | Qué hace | Técnica | Fase |
|---|---|---|---|---|
| 1 | **Búsqueda semántica** | "algo tranquilo para hacer con mi mamá el domingo" devuelve resultados correctos | Embeddings + `pgvector`, reordenado por disponibilidad y cercanía | 1 |
| 2 | **Asistente de publicación** | La empresa describe su servicio en voz o texto libre; la IA genera ficha completa, categorías, precio sugerido y campos de accesibilidad | LLM con salida estructurada validada contra esquema | 1 |
| 3 | **Resumen de reseñas** | Convierte 200 reseñas en cinco líneas útiles con lo bueno, lo malo y los patrones | LLM sobre agregado, recalculado por lote | 1 |
| 4 | **Emparejamiento marca-creador** | Ordena creadores por ajuste real y explica el porqué de cada uno | Embeddings de afinidad + señales cuantitativas + ranking aprendido | 2 |
| 5 | **Redacción de briefs** | Convierte "quiero que promocionen mi restaurante" en un brief completo | LLM con plantilla guiada | 2 |
| 6 | **Precio justo bilateral** | Rango de tarifa para creador y presupuesto para empresa, con percentiles de mercado | Regresión sobre transacciones históricas + reglas | 2 |
| 7 | **Verificación de audiencia** | Detecta seguidores comprados e interacción artificial | Detección de anomalías sobre series temporales de la API social | 2 |
| 8 | **Detección de fraude** | Reseñas falsas, cuentas duplicadas, colusión empresa-creador, lavado transaccional | Modelo de grafo + reglas + señales de comportamiento | 2 |
| 9 | **Agente de agendamiento** | Conversa con el cliente, consulta disponibilidad real y confirma la reserva | LLM con herramientas sobre la API interna | 3 |
| 10 | **Analista conversacional** | "¿Qué campaña me dio mejor retorno este trimestre?" respondido en lenguaje natural | LLM con acceso de solo lectura a métricas agregadas | 3 |
| 11 | **Predicción de demanda y no-show** | Anticipa ocupación y riesgo de inasistencia para sobreagendar con criterio | Series temporales + clasificación | 3 |
| 12 | **Asistente de contenido para creadores** | Sugiere ganchos, estructura y momentos de publicación según brief y audiencia | LLM + datos de desempeño histórico | 3 |

### 13.3 Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│  ORQUESTADOR DE IA                                      │
│  • Enrutamiento por tarea (modelo pequeño vs. grande)   │
│  • Caché semántico  • Límites de gasto por organización │
│  • Registro de auditoría  • Reintentos y respaldo       │
└───────────┬─────────────────────────────┬───────────────┘
            │                             │
    ┌───────▼────────┐          ┌─────────▼──────────┐
    │ CONOCIMIENTO   │          │ HERRAMIENTAS       │
    │ • pgvector     │          │ • API interna      │
    │ • Métricas     │          │ • Clientes MCP     │
    │ • Documentos   │          │   externos         │
    └────────────────┘          └────────────────────┘
```

El orquestador es **agnóstico del proveedor**: una interfaz común permite usar Claude, GPT, Gemini o modelos abiertos autoalojados, y cambiar por tarea según costo y calidad. En un componente tan central, atarse a un solo proveedor sería un riesgo estratégico innecesario.

### 13.4 Gobernanza

- **Clasificación por riesgo:** alto (decisiones sobre dinero o acceso al mercado), medio (recomendaciones), bajo (asistencia de redacción). Cada nivel tiene requisitos distintos de revisión humana.
- **Derecho de explicación:** cualquier creador puede preguntar por qué no apareció en un emparejamiento, y el sistema debe responder con factores concretos.
- **Auditoría de sesgo:** revisión periódica de si el emparejamiento favorece sistemáticamente por género, ciudad o tamaño de audiencia sin justificación de desempeño.
- **Datos de entrenamiento:** el contenido de los usuarios no se usa para entrenar modelos de terceros sin consentimiento explícito y separado.
- **Ley 1581:** todo procesamiento con IA sobre datos personales queda cubierto en la política de tratamiento.


---

## 14. Interoperabilidad

### 14.1 Los cinco principios

1. **API primero.** Toda funcionalidad de la interfaz existe antes como endpoint. No hay funciones exclusivas de la web o la app.
2. **Los datos son del usuario.** Exportación completa en formatos abiertos, en cualquier momento. Una plataforma que retiene por secuestro de datos pierde en cuanto aparece una alternativa.
3. **Estándares antes que formatos propios.** iCalendar para calendarios, schema.org para catálogo, OAuth 2.1 y OIDC para identidad, ISO 8601 para fechas, ISO 4217 para monedas.
4. **Bidireccionalidad real.** Si se lee de un sistema, se debe poder escribir en él. Una integración de solo lectura es media integración.
5. **Fallo aislado.** La caída de un conector externo degrada solo esa función, con cola de reintentos y alerta al usuario. Nunca tumba la reserva.

### 14.2 API pública

**REST** en `https://api.dejatellevar.com/v1`, con paginación por cursor, `ETag` para caché condicional, idempotencia mediante `Idempotency-Key` en todas las escrituras, versionado en la ruta y política de obsolescencia de doce meses.

**GraphQL** en `/graphql` para consultas compuestas donde un cliente necesita catálogo, disponibilidad y reseñas en una sola llamada.

**Webhooks salientes** con firma HMAC-SHA256, reintentos con retroceso exponencial, cola de mensajes fallidos y reenvío manual desde la consola. El catálogo completo de eventos está en el Anexo B.

**Autenticación:** OAuth 2.1 con PKCE para aplicaciones de terceros, claves de API para integraciones servidor a servidor, JWT de corta vida para las apps propias. Alcances granulares por recurso y operación: `catalog:read`, `bookings:write`, `campaigns:write`, `payments:read`, `crm:write`, `calendar:sync`.

**Portal de desarrolladores:** documentación OpenAPI 3.1 navegable, entorno de pruebas con datos ficticios, SDK en TypeScript, Python y PHP, colección de Postman, y registro de aplicaciones.

### 14.3 Calendarios

| Sistema | Mecanismo | Dirección |
|---|---|---|
| **Google Calendar** | Calendar API + canales de notificación push | Bidireccional |
| **Microsoft 365 / Outlook** | Microsoft Graph + suscripciones a cambios | Bidireccional |
| **Apple Calendar y genéricos** | CalDAV (RFC 4791) | Bidireccional |
| **Cualquier lector** | Feed iCalendar (RFC 5545) con token secreto | Solo lectura |
| **Videollamadas** | Google Meet, Zoom, Teams | Sala creada automáticamente al confirmar |

**Lógica:** los eventos externos del prestador bloquean disponibilidad en DéjateLlevar, evitando choques con compromisos personales. Las reservas de DéjateLlevar se escriben en el calendario externo con los detalles del servicio y del cliente. Sincronización incremental por tokens de cambio, no barrido completo.

### 14.4 Pagos

| Proveedor | Rol | Capacidades |
|---|---|---|
| **Wompi (Bancolombia)** | Principal Colombia | Tarjetas, PSE, Nequi, Bancolombia, efectivo, dispersión a cuentas y llaves Bre-B |
| **Mercado Pago** | Alternativo y regional | Split nativo, alta cobertura LatAm |
| **PayU / ePayco / Bold** | Redundancia | Enrutamiento de respaldo |
| **dLocal** | Expansión regional | Cobro y pago multi-país |
| **Stripe / PayPal** | Cobro internacional | Solo vía entidad legal fuera de Colombia |
| **Bre-B** | Pago inmediato | Dispersión instantánea a creadores |

Una interfaz de dominio (`PaymentProvider`) con implementaciones por proveedor. Cambiar de pasarela no toca la lógica de negocio.

### 14.5 CRM y automatización

| Sistema | Integración | Qué se sincroniza |
|---|---|---|
| **HubSpot** | API + webhooks | Contactos, negocios, actividades, ingresos por cliente |
| **Salesforce** | REST API + Platform Events | Cuentas, oportunidades, casos |
| **Zoho CRM / Pipedrive** | API | Contactos y negocios |
| **Zapier / Make / n8n** | Conector publicado + webhooks | Cualquier automatización sin código |
| **Google Sheets** | API | Exportación viva de reservas y métricas |
| **Slack / Discord / Telegram** | Webhooks entrantes | Notificaciones al equipo |

El conector publicado en Zapier, Make y n8n es estratégicamente desproporcionado en valor: convierte cada evento de la plataforma en un disparador disponible para miles de aplicaciones sin construir una sola integración adicional.

### 14.6 Contabilidad y operaciones

- **DIAN:** factura electrónica vía proveedor tecnológico autorizado.
- **Siigo, Alegra, World Office:** sincronización de facturas, terceros y comprobantes.
- **Registro Nacional de Turismo:** validación del RNT de los prestadores.
- **QuickBooks / Xero:** para la fase de expansión internacional.

### 14.7 Redes sociales

| Plataforma | API | Uso |
|---|---|---|
| **TikTok** | Login Kit, Display API, Business API | Verificación de audiencia, detección de publicación, métricas |
| **Instagram / Facebook** | Instagram Graph API | Verificación, insights, catálogo |
| **YouTube** | YouTube Data API | Verificación, métricas de video |
| **WhatsApp** | WhatsApp Business Platform (Cloud API) | Conversación, confirmaciones, recordatorios |
| **Google Business Profile** | API | Ficha del negocio, reseñas, enlace de reserva |

**El contenido de video se embebe, no se aloja.** La plataforma guarda la referencia, las métricas y la atribución; el video vive donde ya tiene distribución.

### 14.8 Distribución hacia OTAs

Un prestador puede publicar simultáneamente en DéjateLlevar y en Viator, GetYourGuide o Civitatis. La plataforma actúa como **gestor de canales**: sincroniza disponibilidad, evita sobreventa y consolida las reservas de todos los canales en una sola agenda.

Esto convierte al competidor en canal y da una razón para adoptar la plataforma aunque su volumen propio todavía sea bajo — atacando directamente el arranque en frío del lado de la oferta.

### 14.9 Identidad e importación

- **Inicio de sesión federado:** Google, Apple, Microsoft, Facebook, TikTok (OIDC).
- **SSO empresarial:** SAML 2.0 y SCIM para cuentas de agencia o cadenas.
- **Importación asistida:** catálogo y clientes desde CSV, Excel, Google Business Profile o el sistema anterior, con mapeo de columnas sugerido por IA.
- **Exportación total:** todos los datos en JSON y CSV, catálogo en schema.org, agenda en iCalendar.

### 14.10 Datos abiertos

Marcado **schema.org** (`Service`, `Offer`, `Reservation`, `Review`, `LocalBusiness`) en las páginas públicas, para que Google, asistentes de IA y agregadores entiendan el catálogo sin integración previa. Es interoperabilidad pasiva: funciona sin que nadie firme un acuerdo.

---

## 15. MCP — Model Context Protocol

### 15.1 Qué es y por qué es estratégico

El **Model Context Protocol** es un estándar abierto creado por Anthropic que define cómo un modelo de lenguaje se conecta a fuentes de datos y herramientas externas. Usa JSON-RPC 2.0 y ha sido adoptado ampliamente por el ecosistema de IA.

Su relevancia es directa: **la próxima interfaz de descubrimiento y contratación no será solo una app, será un asistente de IA.** Cuando alguien le pida a un asistente "consígueme tres creadores gastronómicos en Villavicencio para una campaña de dos millones", la plataforma expuesta como servidor MCP recibirá esa transacción. Las que no lo estén serán invisibles.

Hay dos direcciones, y ambas importan:

- **DéjateLlevar como servidor MCP** → cualquier asistente de IA opera la plataforma.
- **DéjateLlevar como cliente MCP** → los agentes internos operan las herramientas externas del usuario.

### 15.2 Arquitectura del servidor

```
Asistente de IA (Claude, ChatGPT, agente propio, IDE, app de terceros)
              │
              │  JSON-RPC 2.0 sobre HTTP con streaming
              │  Autorización: OAuth 2.1 + PKCE
              ▼
   ┌──────────────────────────────────────┐
   │  SERVIDOR MCP DE DÉJATELLEVAR        │
   │  mcp.dejatellevar.com                │
   │                                      │
   │  • Tools       acciones              │
   │  • Resources   datos legibles        │
   │  • Prompts     flujos guiados        │
   │  • Elicitation pedir datos al user   │
   └──────────────┬───────────────────────┘
                  │  mismos alcances que la API pública
                  ▼
         Núcleo de dominio de la plataforma
```

**Transporte:** HTTP con streaming para el servidor remoto multiusuario. Además, un paquete local ejecutable vía `stdio` para desarrolladores trabajando contra el entorno de pruebas.

**Autorización:** OAuth 2.1 con PKCE. El servidor MCP funciona como servidor de recursos protegido y publica sus metadatos para que el cliente descubra el servidor de autorización. Registro dinámico de clientes para que un asistente nuevo pueda conectarse sin trámite manual. **Los alcances son exactamente los mismos de la API REST**: no existe puerta trasera con más privilegios.

El catálogo completo de herramientas está en el Anexo C.

### 15.3 Recursos expuestos

Datos legibles que el asistente carga como contexto sin ejecutar acciones:

```
dejatellevar://organizacion/{id}/perfil
dejatellevar://organizacion/{id}/catalogo
dejatellevar://organizacion/{id}/agenda/{semana}
dejatellevar://organizacion/{id}/metricas/{periodo}
dejatellevar://creador/{id}/mediakit
dejatellevar://campana/{id}/brief
dejatellevar://campana/{id}/contrato
dejatellevar://campana/{id}/reporte
dejatellevar://politicas/cancelacion
dejatellevar://politicas/comisiones
dejatellevar://taxonomia/categorias
```

### 15.4 Prompts guiados

| Prompt | Qué desencadena |
|---|---|
| `lanzar_campana` | Entrevista guiada: objetivo → presupuesto → entregables → emparejamiento → invitación |
| `publicar_mi_servicio` | Recoge la descripción y genera la ficha completa con precio y accesibilidad |
| `revision_semanal` | Resumen de reservas, ingresos, reseñas nuevas y acciones pendientes |
| `analizar_competencia` | Comparativa de precio y posicionamiento en su categoría y ciudad |
| `preparar_mediakit` | Genera el kit de medios del creador con datos verificados |
| `diagnostico_de_promesa` | Analiza la brecha Expectativa vs Realidad y sugiere ajustes al anuncio |

### 15.5 Seguridad del servidor MCP

Exponer un servidor MCP es exponer capacidad de acción sobre dinero y contratos. Siete reglas no negociables:

1. **Confirmación humana obligatoria** para toda acción con consecuencia financiera o contractual: `crear_reserva`, `aceptar_propuesta`, `solicitar_retiro`, `cancelar_reserva`. El protocolo permite solicitar confirmación al usuario; estas herramientas siempre la usan.

2. **Defensa contra inyección de instrucciones.** El contenido generado por usuarios —descripciones, mensajes, reseñas— puede contener instrucciones dirigidas al modelo. Todo texto de terceros se devuelve marcado como contenido no confiable y saneado, nunca como instrucción.

3. **Alcances mínimos y consentimiento granular.** El usuario ve exactamente qué puede hacer cada asistente conectado y puede revocar por herramienta, no solo por aplicación completa.

4. **Límites de gasto por sesión.** Un asistente conectado no puede comprometer más de un monto configurado sin re-autorización.

5. **Registro de auditoría completo.** Cada llamada queda registrada con cliente, usuario, herramienta, parámetros y resultado, visible para el usuario en su consola de seguridad.

6. **Aislamiento multi-organización.** El token está atado a una organización; Row Level Security hace imposible el acceso cruzado incluso ante un fallo de la capa de aplicación.

7. **Sin herramientas destructivas irreversibles.** No se expone eliminación permanente. La baja es lógica y reversible durante un periodo de gracia.

### 15.6 DéjateLlevar como cliente MCP

El lado inverso, igual de importante. Los agentes internos se conectan a servidores MCP de terceros que el usuario autorice:

| Servidor MCP externo | Lo que habilita |
|---|---|
| Google Workspace | Leer agenda real, crear eventos, redactar correos de seguimiento |
| Microsoft 365 | Equivalente corporativo |
| HubSpot / Salesforce | Consultar y actualizar el CRM propio del usuario |
| Notion / Slack | Publicar reportes y notificar al equipo |
| Sistemas contables | Consultar estado de facturas y conciliación |
| Almacenamiento (Drive, Dropbox) | Recuperar materiales de marca para la campaña |

**Registro de conectores:** un catálogo interno donde el usuario conecta, autoriza y revoca servidores MCP externos, con los mismos controles de auditoría que aplican en sentido inverso. Todo servidor de terceros se trata como no confiable: sus respuestas nunca se interpretan como instrucciones para el agente.

---

## 16. Modelo de monetización

| Fuente | Estructura | Notas |
|---|---|---|
| **Comisión por reserva** | 8-15% del valor, escalonada por volumen y categoría | Por debajo del 20-30% de las OTAs: es argumento de venta directo |
| **Comisión sobre campañas** | 10-15% del presupuesto, cobrada a la empresa | Cubre escrow, contrato, atribución y mediación |
| **Comisión de afiliación** | Porcentaje pactado al creador, tomado del margen de la empresa | La plataforma retiene una fracción del flujo |
| **Suscripción de empresa** | Gratuito (solo comisión) / Pro / Business | El plan gratuito es clave para el arranque en frío: sin costo fijo, no hay razón para no publicar |
| **Suscripción de creador** | Gratuito / Pro (analítica avanzada, kit de medios, cobro prioritario) | |
| **Destacados y pauta** | Posición promocionada, siempre rotulada | No altera el puntaje de emparejamiento |
| **Servicios de valor agregado** | Cobro anticipado de comisiones, seguros, verificación premium, factura electrónica gestionada | Márgenes altos, opcionales |
| **API y MCP empresarial** | Plan por volumen para integradores y agencias | Monetiza la interoperabilidad |

**Principio de precio:** la comisión baja en reservas es deliberada. El margen se construye sobre las campañas de creadores —donde la plataforma aporta valor que nadie más aporta— y sobre servicios de valor agregado. Competir con las OTAs por comisión es una guerra perdida; competir por operación completa y promoción medible no lo es.

---
---

# PARTE III — ARQUITECTURA E IMPLEMENTACIÓN

---

## 17. Arquitectura técnica

### 17.1 Vista general

```
┌───────────────────────────────────────────────────────────────┐
│  CLIENTES                                                     │
│  Web (React) · Móvil (React Native) · Consola admin           │
│  Asistentes de IA vía MCP · Integraciones de terceros vía API │
└──────────────────────────┬────────────────────────────────────┘
                           │
┌──────────────────────────▼────────────────────────────────────┐
│  CAPA DE ACCESO                                               │
│  API REST · GraphQL · Servidor MCP · Webhooks salientes       │
│  Autenticación · Alcances · Límites de uso · Auditoría        │
└──────────────────────────┬────────────────────────────────────┘
                           │
┌──────────────────────────▼────────────────────────────────────┐
│  NÚCLEO DE DOMINIO (monolito modular)                         │
│                                                               │
│  Identidad │ Catálogo │ Agenda │ Reservas │ Pagos+Ledger      │
│  Campañas  │ Atribución │ Reseñas │ CRM │ Mensajería          │
│  Notificaciones │ Facturación │ Analítica │ Confianza         │
│                                                               │
│  Bus de eventos de dominio ────────────────────────────┐      │
└────────────────────────────────────────────────────────┼──────┘
                           │                             │
┌──────────────────────────▼──────────┐   ┌──────────────▼──────┐
│  DATOS                              │   │  ASÍNCRONO          │
│  PostgreSQL + pgvector              │   │  Colas de trabajos  │
│  Almacenamiento de objetos          │   │  Reintentos         │
│  Caché · Búsqueda                   │   │  Programados        │
└─────────────────────────────────────┘   └─────────────────────┘
                           │
┌──────────────────────────▼────────────────────────────────────┐
│  ADAPTADORES EXTERNOS (uno por integración, aislados)         │
│  Pagos · Calendarios · CRM · Redes sociales · DIAN · IA · MCP │
└───────────────────────────────────────────────────────────────┘
```

### 17.2 Por qué monolito modular y no microservicios

Las fronteras entre módulos son contratos explícitos: cada módulo expone una interfaz y emite eventos, y **nunca accede a las tablas de otro**. Eso permite extraer cualquier módulo a un servicio independiente el día que su carga lo justifique, sin la penalización operativa de gestionar quince despliegues, quince bases de datos y trazabilidad distribuida desde el día uno.

Martin Fowler lo formuló así en *MonolithFirst*: *"you should build a new application as a monolith initially, even if you think it's likely that it will benefit from a microservices architecture later on."*

**Módulos candidatos a extracción temprana** cuando llegue el volumen: procesamiento de medios, motor de atribución, orquestador de IA y servidor MCP.

### 17.3 Arquitectura hexagonal: puertos y adaptadores

Este es el patrón que sostiene toda la portabilidad. El dominio define lo que necesita; los adaptadores lo implementan.

```ts
// packages/core/ports/payment-provider.ts
// El dominio no sabe que existe Wompi. Solo sabe qué necesita.

export interface PaymentProvider {
  createCharge(input: {
    amount: Money;
    reference: string;
    customerEmail: string;
  }): Promise<Result<Charge, PaymentError>>;

  releaseHeld(chargeId: string): Promise<Result<void, PaymentError>>;

  refund(chargeId: string, amount: Money): Promise<Result<Refund, PaymentError>>;
}
```

```ts
// packages/core/use-cases/create-booking.ts
// El caso de uso depende de la interfaz, nunca de la implementación.

export function createBooking(deps: {
  bookings: BookingRepository;
  payments: PaymentProvider;      // ← la interfaz, no Wompi
  events: EventPublisher;
}) {
  return async (input: CreateBookingInput): Promise<Result<Booking, BookingError>> => {
    // Lógica de negocio pura, testeable sin red ni base de datos
  };
}
```

```ts
// packages/db/adapters/wompi-payment-provider.ts
export class WompiPaymentProvider implements PaymentProvider { /* ... */ }

// El día que toque:
// packages/db/adapters/mercadopago-payment-provider.ts
export class MercadoPagoPaymentProvider implements PaymentProvider { /* ... */ }
```

Cambiar de pasarela es cambiar una línea donde se arma la aplicación.

**Beneficio secundario, y no menor:** las pruebas no necesitan red ni base de datos. Se le pasa un `FakePaymentProvider` al caso de uso y se prueba la lógica de negocio en milisegundos.

### 17.4 Estructura del monorepo

```
dejatellevar/
├── apps/
│   ├── web/                    Next.js 15 — sitio y panel
│   │   └── app/api/[[...route]]/route.ts   ← aquí se monta Hono
│   └── mobile/                 Expo — app iOS y Android
├── packages/
│   ├── core/                   DOMINIO PURO. Sin frameworks.
│   │   ├── entities/           Cuenta, Servicio, Reserva, Reseña...
│   │   ├── ports/              Interfaces: AuthProvider, PaymentProvider...
│   │   └── use-cases/          Lógica de negocio con sus pruebas
│   ├── contracts/              Esquemas Zod compartidos. Fuente única de tipos
│   ├── db/                     Drizzle: esquema, migraciones, repositorios,
│   │                           y los adaptadores de proveedores externos
│   ├── api/                    Rutas Hono, middleware, generación de OpenAPI
│   ├── ui/                     Tokens de diseño y componentes compartidos
│   └── config/                 TS, Biome y Tailwind compartidos
├── docker-compose.yml          Postgres local para desarrollar sin internet
├── CLAUDE.md                   Contexto permanente para Claude Code
├── .claudeignore
├── .env.example
└── turbo.json
```

**Dirección de dependencias permitida:**

```
apps  →  api  →  core  ←  db
  ↓              ↑
 ui          contracts
```

`core` no importa nada del proyecto salvo `contracts`. Si algo intenta importar hacia arriba, la arquitectura se rompió y hay que corregirlo de inmediato.

---

## 18. Modelo de datos

### 18.1 Entidades principales

```
cuenta ──┬── perfil_cliente
         ├── perfil_creador ──── audiencia_verificada
         └── membresia_organizacion ──── organizacion
                                            │
organizacion ──┬── servicio ──┬── variante_servicio
               │              ├── disponibilidad_regla
               │              ├── recurso_asignado
               │              └── poliza_seguro
               ├── cliente_crm
               ├── cuenta_pago
               └── suscripcion

servicio ──── reserva ──┬── pago ──── asiento_ledger
                        ├── resena ──── eje_calificacion
                        ├── atribucion ──── campana
                        └── factura

campana ──┬── brief
          ├── postulacion
          ├── contrato ──── firma
          ├── escrow
          ├── entregable ──── revision
          ├── publicacion_social
          └── reporte_campana

conector ──┬── conexion_externa (tokens OAuth cifrados)
           ├── mapeo_campos
           └── log_sincronizacion

mcp_cliente_autorizado ──── concesion_alcance ──── log_llamada_mcp

consentimiento ──── version_politica
evento_dominio (append-only, nunca UPDATE ni DELETE)
```

### 18.2 Decisiones de modelado

| Decisión | Razón |
|---|---|
| **Ledger de doble entrada** con `debe`/`haber` por movimiento. Nunca un campo `saldo` que se actualiza | El saldo se calcula. Hace la contabilidad auditable y a prueba de condiciones de carrera |
| **Atribución como entidad propia**, no campo en la reserva | Una reserva puede tener varios toques de atribución con pesos distintos |
| **Eventos inmutables** en tabla append-only | Fuente de verdad para reconstruir estado, auditar y alimentar webhooks |
| **`pgvector` en la misma base** | Combina búsqueda semántica con filtros de disponibilidad y precio en una sola consulta |
| **Credenciales de terceros cifradas** con clave gestionada externamente | Nunca en texto plano, ni siquiera en la base |
| **Consentimientos versionados** con marca de tiempo y finalidad | Requisito de la Ley 1581. Un booleano no es suficiente prueba |
| **UUID v7 como clave primaria** | Ordenables por tiempo, buenos para índices, no exponen conteo de registros |

### 18.3 Reglas de datos innegociables

1. **Dinero:** siempre enteros en centavos. Nunca `float`, nunca `number` suelto para montos. En base de datos: `bigint` en centavos o `numeric(15,2)`. Jamás punto flotante.
2. **Fechas:** todo se almacena en UTC con `timestamptz`. La zona `America/Bogota` se aplica solo al presentar.
3. **Multi-inquilino:** cada consulta que toca datos de una organización recibe `organization_id` **explícito en la firma del repositorio**, no inferido del contexto. Además, Row Level Security activo como segunda línea de defensa.
4. **Eventos:** ningún cambio de estado importante ocurre sin escribir en `evento_dominio`.
5. **Errores:** los casos de uso devuelven `Result<T, E>`. Las excepciones son solo para fallas imprevistas.

---

## 19. Stack tecnológico y regla de portabilidad

### 19.1 La decisión central

Vercel y Supabase son la combinación más rápida y barata para llegar a un producto funcional. Ese es un argumento real y no hay que disculparse por él. El riesgo es quedar atrapado: mucha gente construye tan pegada al proveedor que migrar significa reescribir.

La solución no es evitarlos. Es **usarlos como implementaciones intercambiables detrás de interfaces propias.**

> **REGLA DE ORO:** el paquete `packages/core` nunca importa Next.js, Vercel, Supabase, React ni ningún SDK de proveedor. Solo TypeScript, Zod y sus propios tipos. Si necesita hablar con el mundo exterior, define un puerto y alguien más lo implementa.

### 19.2 Aplicación concreta de la regla

| Proveedor | Cómo se usa | Cómo se sale |
|---|---|---|
| **Supabase (base de datos)** | Como "un Postgres con hosting". Las consultas van por **Drizzle ORM**, no por el cliente de Supabase | `pg_dump` + cambiar `DATABASE_URL`. Las migraciones de Drizzle son SQL estándar |
| **Supabase Auth** | Detrás del puerto `AuthProvider` | Escribir el adaptador de Better Auth o Auth.js |
| **Supabase Storage** | Detrás del puerto `StorageProvider` | Escribir el adaptador de S3 o R2 |
| **Vercel** | Como "un lugar donde corre Node". Next.js con `output: "standalone"` desde el día uno | Construir imagen Docker y desplegar donde sea |
| **API** | Escrita con **Hono**, montada dentro de Next.js en una ruta catch-all. Hono corre en Node, Bun, Cloudflare y Deno sin cambios | Mover la carpeta a un servicio propio |
| **Wompi** | Detrás del puerto `PaymentProvider` | Escribir el adaptador de Mercado Pago |

**Cero uso de APIs propietarias de Vercel** (KV, Blob, Postgres) en el dominio. Si alguna vez hacen falta, van detrás de un puerto.

El costo de esta disciplina es bajo: unas horas de estructura al inicio. El costo de no tenerla, cuando toque migrar, se cuenta en meses.

### 19.3 El stack

| Capa | Elección | Por qué |
|---|---|---|
| Monorepo | pnpm workspaces + Turborepo | Web y móvil comparten dominio, tipos y validaciones |
| Web | Next.js 15 App Router | Renderizado del lado del servidor para SEO del catálogo, despliegue trivial |
| Móvil | Expo + expo-router | Una base de código para iOS y Android, actualizaciones sobre la marcha |
| API | Hono + Zod + OpenAPI | Portátil entre entornos. Sirve a web, móvil, terceros y al servidor MCP desde una sola superficie |
| Base de datos | PostgreSQL vía Supabase | RLS para aislamiento entre organizaciones, `pgvector` para búsqueda semántica |
| ORM | Drizzle | SQL tipado, migraciones versionadas, sin abstracción mágica, independiente del proveedor |
| Validación | Zod | Una definición que sirve de validación en ejecución y de tipo en TypeScript |
| Estilos | Tailwind (web) + NativeWind (móvil) | Los mismos tokens en ambas plataformas |
| Componentes | shadcn/ui | El código vive en tu repositorio, no en `node_modules`. Nada que migrar |
| Datos en cliente | TanStack Query | Caché, reintentos y estados de carga resueltos, igual en web y móvil |
| Pruebas | Vitest + Playwright | Rápidas, configuración mínima |
| Formato y linter | Biome | Reemplaza ESLint + Prettier con una herramienta mucho más rápida |
| Observabilidad | Sentry + OpenTelemetry | Errores y trazas desde el día uno |
| CI/CD | GitHub Actions | Estándar, gratuito para el volumen inicial |

### 19.4 Costos de infraestructura estimados

| Escenario | Costo mensual aproximado | Supuesto |
|---|---|---|
| 1.000 usuarios | Menos de USD 50 | Supabase Free o Pro, video embebido |
| 10.000 usuarios | USD 100 a 300 | Supabase Pro + egreso + servicios auxiliares |
| 100.000 usuarios | USD 1.000 a 3.000 | Depende fuertemente del egreso |

**La variable que puede romper estas cifras es el video.** Referencias públicas: Mux cobra aproximadamente USD 2,40 de almacenamiento y USD 0,80 de entrega por cada 1.000 minutos en 720p (con 100.000 minutos gratuitos al mes); Cloudflare Stream cobra USD 5 de almacenamiento y USD 1 de entrega por cada 1.000 minutos. El problema es que **la entrega escala con las vistas**, no con el almacenamiento. Por eso el video se embebe.

Supabase Pro cuesta aproximadamente USD 25 al mes con 8 GB de base de datos y 100.000 usuarios activos mensuales. Es más predecible que Firebase, donde una consulta ineficiente puede disparar la factura porque el cobro es por lectura y escritura. Atención al egreso, que se cobra por gigabyte.

*Verificar precios en las páginas oficiales antes de decidir: cambian con frecuencia.*

---

## 20. Seguridad, cumplimiento y gobernanza técnica

### 20.1 Seguridad técnica

- Cifrado en tránsito (TLS 1.3) y en reposo.
- Contraseñas con algoritmo de derivación resistente; segundo factor obligatorio para perfiles con acceso a dinero.
- **Row Level Security** en PostgreSQL para aislamiento entre organizaciones.
- Cabeceras de seguridad, política de contenido, protección CSRF y limitación de intentos.
- Registro de auditoría inmutable para acciones sensibles.
- Rotación de secretos y gestión centralizada de claves.
- Copias de seguridad diarias con **restauración probada periódicamente**. Una copia nunca restaurada no es una copia.
- Programa de divulgación responsable de vulnerabilidades.
- **Cumplimiento PCI-DSS por delegación:** la plataforma nunca toca datos de tarjeta; el PSP los tokeniza.
- Tokens en cookies `httpOnly`. Nada sensible en `localStorage`.
- Validación con Zod en **toda** frontera: entrada de API, respuestas de terceros, parámetros de ruta, variables de entorno.

### 20.2 Gobernanza de la interoperabilidad

Cada conector externo se somete a una revisión que documenta: datos que se envían, datos que se reciben, base legal del tratamiento, ubicación del procesamiento, política de retención del tercero y procedimiento de revocación. El usuario ve esta ficha antes de autorizar. **Ninguna integración se activa por defecto.**

### 20.3 Cumplimiento con impacto en el código

Repetido aquí como referencia para quien implementa (detalle completo en §5):

| Norma | Implementación concreta |
|---|---|
| Ley 2068/2020 (RNT) | Campo RNT validado antes de publicar servicio turístico |
| Ley 1581/2012 | Tabla de consentimientos versionada; exportación y borrado; retención por tabla |
| Ley 1735/2014 | Ledger de doble entrada; prohibición de recarga libre y transferencias entre usuarios |
| Guía SIC influenciadores | Cláusula contractual + verificación de revelación en el entregable |
| Ley 1480/2011 | Política de cancelación visible antes del pago; flujo de reversión |
| Estatuto Tributario | Desglose fiscal por asiento contable, en el momento de la transacción |
| Antecedente Güejar | Póliza verificada por categoría de riesgo; suspensión por alerta |


---
---

# PARTE IV — CONSTRUCCIÓN CON CLAUDE CODE

---

## 21. Preparación: cuentas, herramientas, entorno

### 21.1 Herramientas locales

```bash
# Node.js 20 o superior — verifica
node --version

# pnpm, gestor de paquetes del monorepo
npm install -g pnpm

# Git
git --version

# Docker Desktop — para el Postgres local
# Descargar de docker.com

# Supabase CLI
npm install -g supabase

# Vercel CLI
npm install -g vercel
```

### 21.2 Cuentas a crear

| Servicio | Plan | Para qué |
|---|---|---|
| **GitHub** | Gratis | Repositorio y CI |
| **Supabase** | Gratis para desarrollar, Pro (~USD 25/mes) al lanzar | Base de datos, auth y archivos. El plan gratuito pausa el proyecto tras 7 días sin uso: sirve para desarrollar, no para producción |
| **Vercel** | Hobby gratis; Pro cuando haya usuarios | Despliegue de la web |
| **Anthropic** | Pro o Max | Claude Code. Max si vas a trabajar sesiones largas y sostenidas |
| **Wompi** | Registro con NIT | Pagos. El entorno de pruebas no requiere empresa constituida |
| **Expo** | Gratis | Compilación de la app móvil |

**Crea dos proyectos de Supabase desde el inicio:** `dejatellevar-dev` y `dejatellevar-prod`. Mezclar datos de prueba con datos reales es un error que sale caro y es tedioso de deshacer.

### 21.3 Instalar Claude Code en VS Code

```bash
npm install -g @anthropic-ai/claude-code
claude --version
```

En VS Code, abre la vista de extensiones con `Ctrl+Shift+X` (o `Cmd+Shift+X` en Mac), busca **"Claude Code"** e instala la del publicador **Anthropic**. Requiere VS Code 1.98.0 o superior. También funciona en Cursor, Windsurf y VSCodium.

Abre el panel con el icono de chispa en la barra del editor, o desde la paleta de comandos (`Ctrl/Cmd+Shift+P` → *Claude Code: Open*). Si el icono no aparece, casi siempre es porque no hay ningún archivo abierto en el editor.

La primera vez pedirá iniciar sesión con tu cuenta de Anthropic.

### 21.4 Las tres cosas que marcan la diferencia

**Plan Mode.** Hace que Claude presente un plan como documento Markdown editable antes de tocar archivos. Puedes anotarlo con comentarios en línea del tipo "no toques el módulo de pagos" y Claude ajusta. Para una sesión de inicialización, es indispensable.

**CLAUDE.md.** Claude lo lee al comenzar cada sesión. Es donde viven tus convenciones para no repetirlas cada vez. El contenido completo está en §22.1.

**`/compact`.** Cuando el contexto se llena, Claude resume lo anterior automáticamente y puede perder decisiones tomadas al principio. Ejecutarlo **manualmente antes** de empezar una fase nueva da resultados mucho más predecibles que esperar a que se active solo a mitad de una tarea.

### 21.5 Extensiones recomendadas de VS Code

Tailwind CSS IntelliSense · Biome · Error Lens · GitLens · resaltado de esquema para Drizzle

---

## 22. Archivos base del repositorio

Crea estos archivos **antes** de lanzar el prompt inicial. Claude trabaja mucho mejor con contexto que teniendo que adivinarlo.

```bash
mkdir dejatellevar && cd dejatellevar
git init
code .
```

### 22.1 `CLAUDE.md`

Copia este archivo completo a la raíz del proyecto.

````markdown
# CLAUDE.md — DéjateLlevar

> Claude Code lee este archivo al inicio de cada sesión. Mantenerlo corto y actualizado.
> Si una convención cambia, se actualiza aquí primero.

## Qué es este proyecto

Plataforma donde negocios y creadores publican y venden servicios, y donde las marcas
contratan creadores para promocionarlos con atribución de ventas verificable.

Mercado inicial: Villavicencio y el Meta, Colombia. Idioma del producto: español de
Colombia. Moneda: COP.

Actores: Cliente, Empresa, Creador — **una sola cuenta con perfiles activables**, no
tres tipos de usuario separados.

Ciclo transaccional:
descubrimiento → reserva → pago retenido → prestación → confirmación → liberación →
reseña → atribución → liquidación

Diferenciador: la reseña con eje **Expectativa vs Realidad** (−3 a +3), de donde sale
el Índice de Fidelidad Promocional.

## Regla de oro: portabilidad

`packages/core` **nunca** importa Next.js, Vercel, Supabase, React ni SDK de proveedor.
Solo TypeScript, Zod y sus propios tipos.

Si el dominio necesita hablar con el exterior, define un **puerto** (interfaz) y el
adaptador vive en otro paquete.

| Necesidad | Puerto | Adaptador actual | Migración prevista |
|---|---|---|---|
| Datos | Repositorios en `core` | Drizzle sobre Postgres | Cualquier Postgres |
| Auth | `AuthProvider` | Supabase Auth | Better Auth |
| Archivos | `StorageProvider` | Supabase Storage | S3 / R2 |
| Pagos | `PaymentProvider` | Wompi | Mercado Pago |
| Eventos | `EventPublisher` | Tabla `domain_event` | Cola externa |

Supabase se usa como "un Postgres con hosting", **no** como framework. Las consultas
van por Drizzle, no por el cliente de Supabase.

Stripe **no** opera oficialmente en Colombia. No usarlo como pasarela principal.

## Estructura

```
apps/web         Next.js 15 App Router. API montada en app/api/[[...route]]/route.ts
apps/mobile      Expo + expo-router + NativeWind
packages/core    Dominio puro: entidades, casos de uso, puertos
packages/db      Esquema Drizzle, migraciones, repositorios, adaptadores externos
packages/api     Rutas Hono + Zod + OpenAPI
packages/contracts  Esquemas Zod compartidos (única fuente de verdad de tipos)
packages/ui      Tokens de diseño y componentes
packages/config  TS, Biome, Tailwind compartidos
```

Dirección de dependencias permitida:
```
apps  →  api  →  core  ←  db
  ↓              ↑
 ui          contracts
```
`core` no depende de nada del proyecto excepto `contracts`. Si algo intenta importar
hacia arriba, está mal.

## Reglas de código innegociables

1. **Dinero**: enteros en centavos. `Money = { amount: number; currency: "COP" }`.
   Nunca `float`. En BD: `bigint` en centavos o `numeric(15,2)`.
2. **Fechas**: se almacenan en UTC (`timestamptz`). `America/Bogota` solo al presentar.
3. **IDs**: UUID v7. Nunca enteros autoincrementales expuestos.
4. **Multi-inquilino**: todo repositorio que toca datos de una organización recibe
   `organizationId` **explícito en la firma**. Además, RLS activo en Postgres.
5. **Eventos**: ningún cambio de estado importante ocurre sin escribir en
   `domain_event`. Esa tabla es append-only: no se hace UPDATE ni DELETE sobre ella.
6. **Errores**: los casos de uso devuelven `Result<T, E>`. Las excepciones son solo
   para fallas imprevistas.
7. **Entorno**: todas las variables pasan por un esquema Zod validado al arrancar.
   Si falta una, la app no levanta.
8. **Tokens**: en cookies `httpOnly`. Nada sensible en `localStorage`.
9. **Validación en toda frontera**: entrada de API, respuestas de terceros,
   parámetros de ruta. Nunca `any`.

## Convenciones

- Código (archivos, variables, funciones, tablas) en **inglés**. Textos visibles al
  usuario, comentarios de dominio y documentación en **español**.
- Componentes React: `PascalCase.tsx`. Utilidades: `kebab-case.ts`.
- Un caso de uso por archivo en `core/use-cases/`.
- Pruebas junto al archivo: `create-booking.test.ts` al lado de `create-booking.ts`.
- Commits convencionales: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Toda función pública exportada lleva JSDoc de una línea en español.

## Comandos

```bash
pnpm dev            # web + mobile + API en paralelo
pnpm dev:web        # solo web
pnpm dev:mobile     # solo Expo
pnpm build          # build de todo
pnpm typecheck      # tsc --noEmit en todos los paquetes
pnpm lint           # Biome
pnpm test           # Vitest
pnpm test:e2e       # Playwright
pnpm db:migrate     # aplica migraciones
pnpm db:seed        # datos de prueba
pnpm db:studio      # explorador visual de la BD
pnpm db:local       # levanta Postgres local con Docker
```

## Antes de dar una tarea por terminada

Corre siempre, en este orden:
```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```
Si algo falla, arréglalo antes de reportar. No reportes "listo" con el build roto.

## Cumplimiento legal (Colombia) — afecta el código

- **Ley 1581 de 2012**: consentimiento explícito y registrado antes de tratar datos
  personales. Toda tabla con datos personales necesita política de retención.
- **Registro Nacional de Turismo**: los prestadores turísticos deben tener RNT vigente
  validado antes de publicar.
- **No construir wallet con saldo propio**: guardar depósitos de usuarios exige
  licencia SEDPE. El "saldo" es un ledger de doble entrada respaldado por dinero en
  custodia del PSP. No permitir recargas libres ni transferencias entre usuarios sin
  transacción subyacente.
- **Guía SIC de influenciadores**: el contrato de campaña debe exigir revelación de
  contenido pagado, y el sistema debe poder verificarla.
- **Datos de accesibilidad**: pueden ser dato sensible. Consentimiento separado y
  agregación que no identifique a la persona.
- **Categorías de riesgo** (aventura, deportes acuáticos, transporte): requieren póliza
  de responsabilidad civil vigente y verificada antes de publicar.

## Cómo quiero que trabajes

- Explica decisiones técnicas no obvias en una o dos frases, en español.
- Pocas dependencias bien elegidas. Antes de agregar una librería, di qué problema
  resuelve.
- Si algo que pedí es mala idea, dilo y propón la alternativa. No lo implementes mal
  para complacerme.
- Cambios pequeños y verificables. Prefiero cinco commits que funcionan a uno enorme
  que no sé revisar.
- Avísame antes de compactar el contexto.

## Estado actual

<!-- Actualizar al cerrar cada sesión -->
- **Fase**: 1 — Andamiaje
- **Hecho**: —
- **En curso**: —
- **Siguiente**: —
````

### 22.2 `.claudeignore`

Evita que Claude lea archivos que no aportan y sí gastan contexto o exponen secretos.

```
node_modules/
.next/
.turbo/
dist/
build/
.expo/
coverage/
*.log
pnpm-lock.yaml
.env
.env.local
.env.*.local
supabase/.temp/
playwright-report/
test-results/
*.png
*.jpg
*.mp4
```

### 22.3 `.gitignore`

```
node_modules/
.next/
.turbo/
dist/
build/
.expo/
coverage/
.env
.env.local
.env.*.local
.DS_Store
*.log
playwright-report/
test-results/
.vercel
```

Sube el proyecto a GitHub antes de la primera sesión grande. Tener historial de Git es tu red de seguridad: si una sesión sale mal, `git reset` te devuelve a un estado conocido.

---

## 23. El prompt inicial

Pega este bloque completo en Claude Code, en una carpeta vacía, **con Plan Mode activado**.

```
Vas a inicializar el proyecto "DejateLlevar" desde cero. Antes de escribir código,
presenta un plan y espera mi aprobación.

=== QUÉ ESTAMOS CONSTRUYENDO ===

DéjateLlevar es una plataforma donde negocios y creadores de contenido publican y
venden servicios, y donde las marcas contratan creadores para promocionarlos con
atribución de ventas verificable. Mercado inicial: Villavicencio y el departamento
del Meta, Colombia. Idioma del producto: español de Colombia. Moneda: COP.

Los tres actores son Cliente, Empresa y Creador, pero comparten UNA sola cuenta con
perfiles activables. No son tres tipos de usuario incompatibles.

El ciclo transaccional completo es:
  descubrimiento -> reserva -> pago retenido -> prestación -> confirmación ->
  liberación de fondos -> reseña -> atribución -> liquidación

El diferenciador del producto es la reseña con eje "Expectativa vs Realidad":
el cliente califica de -3 a +3 qué tan fiel fue el servicio real respecto a lo
que se le prometió en la publicidad. De ahí se deriva el "Índice de Fidelidad
Promocional" de cada creador y empresa.

=== OBJETIVO DE ESTA SESIÓN ===

Crear el andamiaje completo del monorepo: estructura de carpetas, configuración,
capa de dominio con sus puertos, primeros adaptadores, esquema de base de datos,
una ruta de API funcionando de extremo a extremo, y las apps web y móvil
arrancando en blanco pero conectadas. NO implementes funcionalidades de negocio
todavía. Quiero cimientos correctos, no features.

=== RESTRICCIÓN MÁS IMPORTANTE: PORTABILIDAD ===

Hoy despliego en Vercel + Supabase porque es lo más rápido y barato para empezar.
Pero el proyecto DEBE poder migrar a cualquier otro proveedor sin reescribirse.
Esta es la regla que gobierna todas las demás decisiones:

  REGLA DE ORO: el paquete de dominio (packages/core) NUNCA importa Next.js,
  Vercel, Supabase, React ni ningún SDK de proveedor. Solo TypeScript puro,
  Zod y sus propios tipos. Si necesita hablar con el mundo exterior, define
  una interfaz (un "puerto") y alguien más la implementa.

Aplicación concreta de la regla:

  - Base de datos: uso Drizzle ORM sobre PostgreSQL estándar, NO el cliente de
    Supabase para consultas. Supabase es solo "un Postgres con hosting". Migrar
    a Neon, RDS o un Postgres propio debe ser cambiar una cadena de conexión.

  - Autenticación: puerto AuthProvider. Adaptador inicial: Supabase Auth.
    Debe poder cambiarse por Better Auth o Auth.js sin tocar el dominio.

  - Archivos: puerto StorageProvider. Adaptador inicial: Supabase Storage.
    Debe poder cambiarse por S3 o R2 cambiando solo el adaptador.

  - Pagos: puerto PaymentProvider. Adaptador inicial: Wompi (Colombia).
    Debe poder sumarse Mercado Pago sin tocar la lógica de reservas.
    IMPORTANTE: Stripe NO opera oficialmente en Colombia, no lo uses como
    pasarela principal.

  - API: escrita con Hono, montada dentro de Next.js en una ruta catch-all.
    Hono corre en Node, Bun, Cloudflare y Deno sin cambios, así que sacar la
    API de Vercel es mover una carpeta, no reescribir.

  - Next.js configurado con output: "standalone" para que se pueda contenerizar
    y desplegar en cualquier parte desde el día uno.

  - Cero uso de APIs propietarias de Vercel (KV, Blob, Postgres) en el dominio.
    Si alguna vez hacen falta, van detrás de un puerto.

=== STACK ===

Monorepo con pnpm workspaces + Turborepo.

  apps/web        Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
  apps/mobile     Expo (React Native) + expo-router + NativeWind
  packages/core   Dominio puro: entidades, casos de uso, puertos. Sin dependencias
                  de framework.
  packages/db     Esquema Drizzle, migraciones, repositorios y adaptadores externos
  packages/api    Rutas Hono + esquemas Zod + generación de OpenAPI
  packages/contracts  Esquemas Zod compartidos entre backend, web y móvil.
                  Única fuente de verdad de los tipos de datos.
  packages/ui     Tokens de diseño y componentes compartibles
  packages/config Configuraciones compartidas de TypeScript, Biome, Tailwind

Otras piezas:
  - Validación: Zod en TODA frontera (entrada de API, variables de entorno,
    respuestas de terceros). Nunca confíes en un `any`.
  - Datos en cliente: TanStack Query
  - Pruebas: Vitest para unitarias e integración, Playwright para end-to-end
  - Formato y linter: Biome
  - Git hooks: Lefthook, corriendo typecheck y lint antes de cada commit

=== REGLAS DE CÓDIGO INNEGOCIABLES ===

1. DINERO: siempre enteros en centavos. Nunca float, nunca number suelto para
   montos. Tipo Money = { amount: number (centavos), currency: "COP" }.
   En la base de datos: numeric(15,2) o bigint en centavos, jamás float.

2. FECHAS: todo se almacena en UTC con timestamptz. La zona horaria de
   presentación (America/Bogota) se aplica solo en la capa de interfaz.

3. IDENTIFICADORES: UUID v7 para claves primarias. Nunca enteros
   autoincrementales expuestos al público.

4. MULTI-INQUILINO: cada consulta que toca datos de una organización recibe
   organizationId explícito. Los repositorios lo exigen en la firma del método,
   no lo infieren. Además se activa Row Level Security en Postgres como segunda
   línea de defensa.

5. EVENTOS: ningún estado importante cambia sin emitir un evento de dominio a
   una tabla append-only. Esa tabla nunca se actualiza ni se borra. Es la base
   de la auditoría, los webhooks y la analítica.

6. ERRORES: los casos de uso devuelven Result<T, E>, no lanzan excepciones para
   errores esperados. Las excepciones son solo para fallas realmente imprevistas.

7. SIN SECRETOS EN EL CÓDIGO: todas las variables de entorno pasan por un
   esquema Zod que se valida al arrancar. Si falta una, la app no levanta.

8. NADA DE localStorage PARA DATOS SENSIBLES. Tokens en cookies httpOnly.

=== QUÉ QUIERO QUE HAGAS AHORA ===

FASE 1 — Plan
Preséntame un plan que incluya:
  a) El árbol de carpetas completo que vas a crear, con una línea explicando
     el propósito de cada carpeta
  b) La lista de puertos (interfaces) que vas a definir en packages/core y su
     firma
  c) Las tablas iniciales del esquema con sus columnas clave
  d) Las decisiones donde tengas dudas o donde veas más de una opción razonable,
     con tu recomendación y el porqué
  e) Qué NO vas a hacer en esta sesión

Espera mi aprobación antes de continuar.

FASE 2 — Andamiaje
Una vez apruebe:
  1. Inicializa el monorepo con pnpm y Turborepo
  2. Crea packages/config con las configuraciones compartidas
  3. Crea packages/contracts con los esquemas Zod base
     (Money, Direccion, Paginacion, IdentificadorOrganizacion)
  4. Crea packages/core con:
     - Entidades: Cuenta, Organizacion, Servicio, Reserva, Resena
     - Puertos: AuthProvider, StorageProvider, PaymentProvider,
       EventPublisher, y los repositorios de cada entidad
     - Un caso de uso completo de ejemplo: CrearServicio, con sus pruebas
       unitarias usando implementaciones falsas de los puertos
  5. Crea packages/db con el esquema Drizzle de estas tablas:
     - account, client_profile, creator_profile, organization,
       organization_membership
     - service, service_variant, availability_rule
     - booking, payment, ledger_entry
     - review, review_axis
     - consent
     - domain_event (append-only)
     Incluye la primera migración y un archivo de datos de prueba (seed).
  6. Crea packages/api con Hono:
     - Middleware de autenticación, de contexto de organización y de manejo de
       errores
     - Endpoints funcionales: GET /v1/services y POST /v1/services
     - Generación automática de OpenAPI 3.1
  7. Crea apps/web con Next.js 15:
     - La API montada en app/api/[[...route]]/route.ts
     - Una página que liste servicios consumiendo la API real
     - Tailwind configurado con los tokens de packages/ui
  8. Crea apps/mobile con Expo:
     - expo-router configurado
     - Una pantalla que liste los mismos servicios usando el mismo cliente
       tipado que la web
  9. Crea la infraestructura de desarrollo:
     - docker-compose.yml con Postgres local (para desarrollar sin depender
       de Supabase)
     - .env.example completo y comentado
     - Scripts de package.json: dev, build, test, typecheck, lint, db:migrate,
       db:seed, db:studio, db:local
     - GitHub Actions con typecheck, lint, test y build
  10. Escribe el README.md con las instrucciones exactas para que alguien
      clone el repo y lo tenga corriendo en menos de diez minutos
  11. Actualiza CLAUDE.md con lo que haya cambiado

FASE 3 — Verificación
Después de crear todo:
  - Corre pnpm install, pnpm typecheck, pnpm lint y pnpm test
  - Arregla lo que falle
  - Confirma que apps/web levanta y muestra la lista de servicios
  - Hazme un resumen de qué quedó hecho, qué quedó pendiente y cuál es el
    siguiente paso lógico

=== CÓMO QUIERO QUE TRABAJES ===

- Explícame las decisiones en español, claro y sin jerga innecesaria. Estoy
  aprendiendo, así que cuando tomes una decisión técnica no obvia, dime por qué
  en una o dos frases.
- Prefiero pocas dependencias bien elegidas a muchas. Antes de agregar una
  librería, dime qué problema resuelve y si vale la pena.
- Si algo de lo que pedí es una mala idea, dímelo y propón la alternativa. No
  lo implementes en silencio ni lo implementes mal para complacerme.
- Los nombres de archivos, variables y funciones en inglés. Los textos visibles
  al usuario, comentarios de dominio y documentación en español.
- Commits pequeños con mensajes en formato convencional (feat:, fix:, chore:).
- Si el contexto se llena, avísame antes de compactar.

Empieza por la Fase 1: el plan.
```

---

## 24. La sesión inicial paso a paso

### Paso 1 — Lanza el prompt

Abre el panel de Claude Code, **activa Plan Mode**, y pega el prompt completo de §23.

### Paso 2 — Revisa el plan con criterio

Claude devolverá un plan. No lo apruebes en automático. Verifica que:

- [ ] `packages/core` no tenga ninguna dependencia de Next.js, Supabase ni React
- [ ] Los puertos estén definidos como interfaces, no como implementaciones concretas
- [ ] El esquema de base de datos use `timestamptz` para fechas y enteros para dinero
- [ ] Cada tabla con datos de organización tenga su columna `organization_id`
- [ ] Exista la tabla `domain_event` y esté marcada como append-only
- [ ] Exista la tabla `consent` con versión de política y marca de tiempo
- [ ] La API esté montada con Hono, no con handlers nativos de Next
- [ ] Te haya dicho explícitamente qué **no** va a hacer en esta sesión

Si algo falta, escríbelo como comentario en el plan y pide la corrección antes de aprobar.

### Paso 3 — Deja que ejecute

Con el plan aprobado, Claude creará los archivos. Revisa los diffs. En VS Code cada archivo aparece en su propia pestaña de comparación. Al inicio revisa todo: es la etapa donde se fijan los patrones que se repetirán durante meses.

### Paso 4 — Verifica que funciona

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm db:local        # levanta Postgres en Docker
pnpm db:migrate
pnpm db:seed
pnpm dev:web         # debe abrir en localhost:3000 y listar servicios
```

Si algo falla, pásale el error a Claude **tal cual**. No lo parafrasees: el mensaje literal contiene información que tú puedes considerar ruido y que para el diagnóstico es clave.

### Paso 5 — Primer commit y cierre

```bash
git add .
git commit -m "chore: andamiaje inicial del monorepo"
git push
```

Antes de cerrar la sesión, pídele a Claude que actualice la sección **Estado actual** de `CLAUDE.md`. Ese hábito es lo que hace que la sesión siguiente empiece con contexto en lugar de con arqueología.

---

## 25. Prompts de sprint

Después de la sesión inicial, avanza en bloques pequeños. Un prompt gigante que pide diez cosas produce diez cosas a medias.

### Sprint 1 — Autenticación e identidad

```
Implementa autenticación completa siguiendo la arquitectura de puertos ya
establecida en packages/core.

Incluye: registro con correo y contraseña, verificación por correo, inicio de
sesión, recuperación de contraseña, e inicio de sesión con Google.

El puerto AuthProvider ya existe. Escribe el adaptador SupabaseAuthProvider en
packages/db/adapters. El resto del código nunca debe importar Supabase.

Cuando un usuario se registra, se crea una Cuenta con perfil de Cliente activo
por defecto. Los perfiles de Empresa y Creador se activan después, con
verificación adicional.

Implementa también los niveles de verificación:
  0 correo -> 1 teléfono -> 2 documento -> 3 NIT -> 4 RNT -> 5 póliza
Cada nivel habilita capacidades distintas. Modélalo como una función pura del
dominio, no como condicionales dispersos.

Registra el consentimiento de tratamiento de datos en la tabla consent, con
versión de política, finalidad y marca de tiempo. Un booleano no es suficiente
prueba bajo la Ley 1581 de 2012.

Sesión en cookies httpOnly. Middleware de protección de rutas en la web y
almacenamiento seguro en la app móvil.

Escribe pruebas del caso de uso con un FakeAuthProvider, sin llamadas de red.
```

### Sprint 2 — Catálogo de servicios

```
Implementa el módulo de catálogo.

Un Servicio tiene cuatro modalidades: SCHEDULED (slots de calendario),
CAPACITY (fechas con aforo), ON_DEMAND (cotización previa) y DIGITAL (sin
agenda). El modelo debe soportar las cuatro sin condicionales dispersos por el
código: piensa en cómo modelar la disponibilidad de forma polimórfica.

Campos: nombre, descripción, categoría y subcategoría, precio (fijo / desde /
por cotizar), duración, ubicación o modalidad remota, política de cancelación,
requisitos previos, idiomas, capacidad, medios, categoría de riesgo, y
accesibilidad estructurada (movilidad reducida, apoyo visual, apoyo auditivo,
apto neurodivergencia, apto menores).

La accesibilidad es un campo declarado por la empresa, no texto libre. Se va a
contrastar después con lo que reporten las reseñas.

Reglas de negocio que deben estar en el dominio, no en la interfaz:
  - Un servicio turístico no se puede publicar sin RNT vigente de la organización
  - Un servicio en categoría de riesgo no se puede publicar sin póliza vigente

CRUD completo en la API, panel de gestión en la web, listado y detalle en móvil.
Los precios en centavos, siempre.
```

### Sprint 3 — Agenda y disponibilidad

```
Implementa el motor de disponibilidad.

Debe manejar: horarios base por día de la semana, excepciones y bloqueos,
recursos (personas, salas, equipos) donde una reserva puede consumir varios y
la disponibilidad es la intersección, buffers de preparación entre reservas, y
antelación mínima y máxima.

Todo en UTC con timestamptz. La zona America/Bogota se aplica solo al presentar.

Prevención de doble reserva con bloqueo optimista al confirmar. Escribe una
prueba que simule dos reservas simultáneas del mismo slot y verifique que solo
una gana. Esta prueba es obligatoria, no opcional.

Genera además un feed iCalendar (RFC 5545) de solo lectura con token secreto,
para que un prestador pueda ver su agenda en cualquier calendario. Es la base de
la sincronización con Google Calendar que viene después.
```

### Sprint 4 — Reservas y pagos

```
Implementa el ciclo de reserva y pago.

Estados: DRAFT -> PENDING_PAYMENT -> CONFIRMED -> COMPLETED, más CANCELLED y
NO_SHOW. Cada transición emite un evento a domain_event. Modela las transiciones
como una máquina de estados explícita; las transiciones inválidas deben ser
imposibles de expresar, no solo rechazadas en tiempo de ejecución.

Pagos con Wompi detrás del puerto PaymentProvider. Métodos: tarjeta, PSE, Nequi.
El dinero se retiene hasta que el servicio se presta y se confirma.

Ledger de doble entrada: tabla ledger_entry con debe/haber. NUNCA un campo
"saldo" que se actualiza. El saldo se calcula sumando asientos. Esto es lo que
hace la contabilidad auditable y a prueba de condiciones de carrera.

Split por transacción: comisión de plataforma, monto neto de la empresa,
retenciones e IVA. Todo registrado en el momento de la transacción, no al cierre
del mes.

Reglas del dominio que evitan el requisito de licencia SEDPE, y que deben ser
invariantes del código, no política escrita:
  - No se permite recargar saldo sin destino transaccional identificado
  - No se permite transferencia entre usuarios sin transacción de servicio
  - Los retiros van siempre a una cuenta a nombre del titular verificado

Webhook de Wompi con verificación de firma e idempotencia: si el mismo evento
llega tres veces, se procesa una sola vez.
```

### Sprint 5 — Reseñas y Expectativa vs Realidad

```
Implementa el módulo de reseñas, que es el diferenciador del producto.

Cinco ejes: Expectativa vs Realidad (-3 a +3), calidad del servicio (1-5),
puntualidad (tiempo declarado vs real), accesibilidad (validación de lo que
declaró la empresa) y relación valor-precio (1-5). Más comentario libre y medios.

Solo puede reseñar quien tenga una reserva COMPLETED y pagada. Esta es una
invariante del dominio.

Calcula y expón los índices derivados: fidelidad de promesa de la empresa, y la
base del Índice de Fidelidad Promocional del creador (se completará cuando
exista atribución).

Cuando la accesibilidad reportada difiera de la declarada, genera una señal
interna para revisión.

Las reseñas de accesibilidad pueden contener datos sensibles bajo la Ley 1581.
Agrégalas de forma que no identifiquen a la persona que las reportó.
```

### Sprint 6 — Perfil de creador y verificación de audiencia

```
Implementa el perfil de creador con verificación de audiencia real.

Conexión OAuth a TikTok, Instagram y YouTube. Los datos de audiencia se traen de
la API del proveedor, NUNCA se declaran manualmente ni se aceptan capturas.

Guarda: seguidores, alcance medio, interacción, demografía (edad, género,
ciudad), horarios activos. Guarda también series temporales para poder detectar
anomalías después.

Genera un kit de medios exportable con los datos verificados.

Implementa la detección básica de audiencia inflada: relación seguidores /
interacción fuera de rango, picos de crecimiento anómalos. En esta fase basta
con reglas; el modelo viene después.

El puerto para las APIs sociales debe seguir el mismo patrón: SocialProvider con
un adaptador por red. Añadir una red nueva no debe tocar el dominio.
```

### Sprint 7 — Afiliación y atribución

```
Implementa la afiliación por resultado, que es el modelo más simple de los dos
de contratación de creadores.

Un creador genera un enlace de seguimiento y un código para un servicio o una
organización. Cuando alguien reserva a través de ese enlace o aplicando ese
código, la reserva queda atribuida.

Mecanismos de atribución, en orden de prioridad:
  1. Enlace de seguimiento con parámetros firmados
  2. Código de creador aplicado en el pago
  3. Encuesta post-reserva "¿cómo nos conociste?"

Modela la atribución como entidad propia (tabla attribution), no como campo de
la reserva: una reserva puede tener varios toques con pesos distintos.

Reglas explícitas y configurables: ventana de 30 días por defecto, modelo de
último toque no directo por defecto, y procedimiento de resolución cuando dos
creadores reclaman la misma reserva.

La comisión del creador se calcula y se registra en el ledger en el momento de
la reserva, no al cierre del mes.
```

### Sprint 8 — Campañas con contrato y escrow

```
Implementa el módulo de campañas: el ciclo completo de contratación de creadores.

Etapas: brief -> emparejamiento -> invitación o postulación -> negociación ->
contrato -> escrow -> producción -> aprobación -> publicación -> atribución ->
liquidación -> reporte.

Elementos que no pueden faltar:
  - El contrato se genera desde plantilla e incluye cláusula obligatoria de
    revelación publicitaria (guía SIC 2020). Firma electrónica de ambas partes.
  - El escrow retiene el presupuesto al firmar y libera contra entregables
    aprobados.
  - Aprobación tácita: si la empresa no responde en N días, el entregable se
    considera aprobado. Esto protege al creador y debe ser una regla del dominio.
  - Límite configurable de rondas de revisión.
  - Verificación de que la publicación incluya la revelación de contenido pagado
    antes de aprobar el entregable.

El emparejamiento en esta fase puede ser por reglas (categoría, ciudad, rango de
audiencia, presupuesto). El modelo de IA viene en el sprint 10.
```

### Sprint 9 — Interoperabilidad: API pública, webhooks y calendarios

```
Implementa la capa de interoperabilidad.

1. API pública documentada:
   - OpenAPI 3.1 generado automáticamente desde los esquemas Zod
   - OAuth 2.1 con PKCE para aplicaciones de terceros
   - Alcances granulares: catalog:read, bookings:write, campaigns:write,
     payments:read, crm:write, calendar:sync
   - Idempotency-Key obligatorio en todas las escrituras
   - Límites de uso por organización con cabeceras X-RateLimit-*

2. Webhooks salientes:
   - Firma HMAC-SHA256
   - Reintentos con retroceso exponencial
   - Cola de mensajes fallidos con reenvío manual
   - Catálogo completo de eventos publicados

3. Sincronización de calendarios:
   - Google Calendar bidireccional con canales de notificación push
   - Microsoft Graph bidireccional
   - CalDAV para el resto
   - Sincronización incremental por tokens de cambio, nunca barrido completo
   - Los eventos externos bloquean disponibilidad; las reservas se escriben en
     el calendario externo

Cada conector va detrás de un puerto. Los tokens OAuth se almacenan cifrados,
nunca en texto plano.
```

### Sprint 10 — Capa de IA

```
Implementa el orquestador de IA y los tres primeros casos de uso.

El orquestador debe ser agnóstico del proveedor: una interfaz LLMProvider con
adaptadores para Claude, GPT y Gemini. El enrutamiento por tarea permite usar
modelos pequeños para tareas simples y grandes solo donde aportan.

Requisitos del orquestador:
  - Caché semántico para no pagar dos veces por la misma consulta
  - Límites de gasto por organización
  - Registro de auditoría: modelo, versión, entrada resumida, salida, quién aceptó
  - Degradación elegante: si el proveedor falla, cae a reglas deterministas,
    nunca a error

Casos de uso a implementar:
  1. Búsqueda semántica del catálogo con embeddings + pgvector, reordenada por
     disponibilidad y cercanía geográfica
  2. Asistente de publicación: la empresa describe su servicio en texto libre y
     la IA genera la ficha completa. La salida debe validarse contra el esquema
     Zod antes de guardarse.
  3. Resumen de reseñas: convierte N reseñas en cinco líneas con lo bueno, lo
     malo y los patrones. Recalculado por lote, no en cada visita.

Toda salida de IA visible al usuario debe estar etiquetada como generada por IA.
```

### Sprint 11 — Servidor MCP

```
Implementa el servidor MCP de DéjateLlevar.

Transporte HTTP con streaming para el servidor remoto multiusuario. Autorización
OAuth 2.1 con PKCE, funcionando como servidor de recursos protegido, con
metadatos publicados para descubrimiento y registro dinámico de clientes.

Los alcances son EXACTAMENTE los mismos de la API REST. No debe existir ninguna
puerta trasera con más privilegios.

Herramientas a exponer en esta primera versión:
  Descubrimiento: buscar_servicios, obtener_servicio, consultar_disponibilidad
  Reservas: crear_reserva, listar_reservas, cancelar_reserva
  Creadores: buscar_creadores, obtener_perfil_creador
  Negocio: obtener_metricas, listar_resenas, resumen_resenas

Seguridad, no negociable:
  1. Confirmación humana obligatoria en toda acción con consecuencia financiera
     o contractual (crear_reserva, cancelar_reserva). Usa elicitation.
  2. El contenido generado por usuarios (descripciones, mensajes, reseñas) se
     devuelve marcado como NO CONFIABLE y saneado. Nunca como instrucción.
     Este es el vector de inyección de prompts y hay que tratarlo en serio.
  3. Consentimiento granular: el usuario ve y revoca por herramienta, no solo
     por aplicación.
  4. Límite de gasto por sesión.
  5. Registro de auditoría de cada llamada, visible para el usuario.
  6. Aislamiento multi-organización garantizado por RLS.
  7. Ninguna herramienta destructiva irreversible.

Documenta el servidor para que un desarrollador externo pueda conectarse.
```

Los sprints siguientes —CRM, facturación DIAN, gestor de canales hacia OTAs, cliente MCP, emparejamiento con IA— se derivan de las secciones 11, 12, 14 y 15 de este documento.

---

## 26. Plan de migración: salir de Vercel y Supabase

Esto no es teoría. Documéntalo y verifícalo, porque un plan de migración que nunca se prueba deja de ser cierto.

| Salir de | Cuándo se justifica | Qué hay que hacer | Esfuerzo |
|---|---|---|---|
| **Supabase → Postgres propio o Neon** | El costo se dispara, o necesitas control de infraestructura | `pg_dump` + restaurar; cambiar `DATABASE_URL`. Las migraciones de Drizzle ya están versionadas y son SQL estándar | Bajo — horas |
| **Supabase Auth → Better Auth** | Necesitas SSO empresarial o control total de la sesión | Escribir el adaptador de `AuthProvider`; migrar la tabla de usuarios; forzar re-login | Medio — días |
| **Supabase Storage → S3 o R2** | Costo de egreso o requisito de región | Escribir el adaptador de `StorageProvider`; copiar archivos; actualizar URLs | Bajo — horas |
| **Vercel → Docker en cualquier nube** | Costo, requisito de datos en Colombia, o configuración especial | `output: "standalone"` ya está puesto; construir imagen y desplegar | Bajo — horas |
| **API fuera de Next.js** | La API necesita escalar aparte del sitio | Mover `packages/api` a su propio servicio; Hono corre igual en Node standalone | Bajo — horas |

### 26.1 Verificación trimestral

Una vez al trimestre, corre el proyecto completo contra el Postgres local de Docker en lugar de Supabase. Si funciona sin cambios, la portabilidad sigue viva. Si no, algo se coló y hay que corregirlo mientras es barato.

### 26.2 Señales de alarma en revisión de código

- Un `import` de `@supabase/supabase-js` fuera de `packages/db/adapters/`
- Un `import` de `next/*` dentro de `packages/core`
- Uso de `@vercel/kv` o `@vercel/blob` sin puerto de por medio
- Una consulta escrita con el cliente de Supabase en lugar de Drizzle
- Lógica de negocio dentro de un componente de React o de un route handler

---

## 27. Cómo trabajar bien con Claude Code

**Una tarea por sesión.** El contexto es finito. "Implementa autenticación" da mejor resultado que "implementa autenticación, catálogo y reservas".

**Plan Mode para todo lo grande.** Cualquier cosa que toque más de tres archivos merece plan previo. Revisar un plan cuesta cinco minutos; revertir una implementación equivocada cuesta una tarde.

**`/compact` antes de cada fase nueva**, no cuando ya se llenó el contexto.

**Pega los errores literales.** El mensaje completo, con traza de pila. Lo que a ti te parece ruido suele ser el dato que resuelve el diagnóstico.

**`@` para dar contexto preciso.** `@packages/core/ports/payment-provider.ts implementa el adaptador de Mercado Pago siguiendo este contrato` funciona mucho mejor que describir el archivo con palabras.

**Commits pequeños y frecuentes.** Git es tu botón de deshacer. Si una sesión toma un rumbo equivocado, `git reset --hard` te devuelve a terreno conocido sin drama.

**Cuestiona cuando algo no cuadre.** Si Claude propone una librería que no conoces o una estructura que te parece rara, pregunta por qué. A veces hay una buena razón. A veces no, y la conversación mejora el resultado.

**Actualiza `CLAUDE.md` al cerrar cada sesión.** Es la diferencia entre empezar la siguiente con contexto o con arqueología.

**Dónde Claude Code brilla:** andamiaje, código repetitivo, migraciones, pruebas, refactorizaciones amplias, adaptadores de integración, documentación.

**Dónde necesita tu supervisión:** decisiones de arquitectura con consecuencias a largo plazo, seguridad, lógica de dinero, y cualquier cosa donde el requisito de negocio sea ambiguo. En esos casos, decide tú e implementa Claude.


---
---

# PARTE V — GOBIERNO DEL PROYECTO

---

## 28. Hoja de ruta por fases

### Fase 0 — Validación sin código (4-8 semanas)

Detalle completo en §7. Resumen:

- 20-30 entrevistas con prestadores y clientes, metodología de comportamiento pasado.
- Operación manual tipo concierge: 20-30 reservas reales gestionadas por WhatsApp, cobrando de verdad.
- Página de aterrizaje con lista de espera y medición de conversión.
- 5-10 cartas de intención de prestadores.

**Umbral para avanzar:** demanda medida real, no interés declarado. Si no se cumple, se repite la Fase 0 con la propuesta ajustada.

### Fase 1 — MVP transaccional (3-4 meses)

**Alcance:** identidad y perfiles con niveles de verificación · catálogo con las cuatro modalidades · agenda con feed iCal · reservas y cotizaciones · pagos con Wompi y ledger de doble entrada · reseñas con eje Expectativa vs Realidad · panel de empresa · notificaciones por WhatsApp y correo · API REST de lectura · consola administrativa · registro RNT y cumplimiento de la Ley 1581.

**IA en esta fase:** búsqueda semántica, asistente de publicación, resumen de reseñas.

**Fuera de alcance:** creadores, campañas, CRM avanzado, MCP.

**Métrica de éxito:** liquidez demostrada — reservas recurrentes semanales en al menos una categoría y una ciudad.

**Sprints correspondientes:** 1 a 5, más los tres primeros casos de IA del sprint 10.

### Fase 2 — Capa de creadores (3-4 meses)

**Alcance:** perfil de creador con verificación de audiencia por OAuth · afiliación con enlaces y códigos · motor de atribución · campañas con brief, contrato, escrow y entregables · Índice de Fidelidad Promocional · CRM nativo · webhooks · conector de Zapier, Make y n8n.

**IA:** emparejamiento marca-creador, redacción de briefs, precio justo bilateral, verificación de audiencia, detección de fraude.

**Umbral de activación — bloqueante:** esta fase **no se abre** hasta que la Fase 1 tenga liquidez comprobada. Activarla antes reproduce exactamente el error del marketplace de tres lados prematuro que cerró a Vayable.

**Sprints correspondientes:** 6 a 8.

### Fase 3 — Interoperabilidad completa y MCP (2-3 meses)

**Alcance:** API pública documentada con portal de desarrolladores y SDK · GraphQL · CalDAV y Microsoft Graph · conectores de CRM · facturación electrónica DIAN · gestor de canales hacia OTAs · **servidor MCP completo** · **cliente MCP para conectores externos** · consola de seguridad y auditoría de integraciones.

**IA:** agente de agendamiento, analista conversacional.

**Sprints correspondientes:** 9 y 11.

### Fase 4 — Escala y expansión (continuo)

Predicción de demanda · programa de agencias · expansión a nuevas ciudades por réplica del modelo de nicho · evaluación de expansión regional con dLocal · extracción de módulos a servicios independientes según carga · evaluación de video propio si el player se vuelve diferenciador y hay ingresos que lo sostengan.

### 28.1 Equipo y presupuesto estimado

**Equipo mínimo:** fundador con rol de producto y ventas + 1-2 desarrolladores full-stack (React / React Native-Expo / Node / Postgres) + apoyo por contrato de diseño y de asesoría jurídica.

**Presupuesto de 6 meses hasta MVP:** aproximadamente **COP 120 a 250 millones**, incluyendo desarrollo, costos legales (constitución de SAS, RNT, política de tratamiento de datos, contratos plantilla) y marketing de nicho inicial.

**La Fase 0 puede hacerse casi sin capital.** Ese es precisamente su valor: descubrir si vale la pena gastar los 120-250 millones antes de gastarlos.

*Estas cifras son orientativas para un emprendedor inicial, no cotizaciones formales.*

---

## 29. Métricas y umbrales de decisión

### 29.1 Indicadores por nivel

| Nivel | Indicador | Definición | Referencia sana |
|---|---|---|---|
| **Marketplace** | GMV | Volumen bruto transaccionado | Crecimiento mensual sostenido |
| | Take rate | Ingreso de plataforma / GMV | 10-18% combinado |
| | **Liquidez de demanda** | % de búsquedas que terminan en reserva | > 10% |
| | **Liquidez de oferta** | % del inventario publicado que se reserva en 30 días | > 40% |
| | Tiempo hasta primera reserva | Desde el alta del prestador | < 14 días |
| **Creadores** | Tasa de emparejamiento | Briefs que terminan en contrato | > 60% |
| | Tiempo de pago al creador | Desde aprobación hasta acreditación | < 5 días |
| | ROAS medio de campaña | GMV atribuido / costo de campaña | > 3x |
| | Índice de Fidelidad medio | Promedio de la plataforma | > +0,5 |
| **Retención** | Recurrencia de cliente | % que reserva otra vez en 90 días | > 30% |
| | Retención de prestador | Activo a los 6 meses | > 70% |
| **Economía** | CAC por lado | Costo de adquisición | — |
| | LTV/CAC | Relación | ≥ 3 |
| **Confianza** | Tasa de disputa | Disputas / reservas | < 1% |
| | Tasa de no-show | | < 5% |
| **Interoperabilidad** | Organizaciones con ≥1 conector activo | | > 40% |
| | Llamadas MCP por sesión activa | Adopción de la vía agéntica | — |

### 29.2 Umbrales que cambian la estrategia

Estos no son indicadores para mirar: son **disparadores de decisión** con acción predefinida.

| Si ocurre | Entonces | Por qué |
|---|---|---|
| Sin liquidez a los 6 meses en el nicho inicial | **No expandir geográficamente** | El problema es de producto o de oferta, no de alcance. Expandir lo multiplica en lugar de resolverlo |
| LTV/CAC por debajo de 3 sostenido | **Detener adquisición pagada** y volver a crecimiento orgánico | Es el error que hundió a Tripping.com |
| Una OTA global profundiza en experiencias hiperlocales del Meta | **Replegarse al ángulo defendible**: creadores, comunidad, operación integral | No se puede ganar de frente contra su presupuesto |
| TikTok habilita servicios agendables en Colombia | **Integrarse como canal**, no competir | Su distribución es inalcanzable; su ejecución transaccional, no |
| Tasa de desintermediación estimada supera el 20% | **Revisar qué valor falta en la transacción interna**, no endurecer candados | Los candados se evaden y envenenan la relación |
| El costo de infraestructura supera el 15% del ingreso | **Auditar egreso y video** antes que cualquier otra cosa | Son las dos variables que se disparan silenciosamente |
| Un creador acumula fidelidad promocional negativa sostenida | **Reducir su visibilidad en el emparejamiento** | El índice debe tener consecuencia económica o no significa nada |

---

## 30. Riesgos y mitigaciones

| Riesgo | Impacto | Probabilidad | Mitigación |
|---|---|---|---|
| **Arranque en frío del marketplace** | Crítico | Alta | Nicho geográfico estrecho, plan gratuito para prestadores, herramienta útil antes que red, gestor de canales hacia OTAs, curación estricta |
| **Activar tres lados demasiado pronto** | Crítico | Alta | Fase 2 bloqueada hasta demostrar liquidez en Fase 1 |
| **Riesgo regulatorio de wallet (SEDPE)** | Crítico | Media | Ledger sobre PSP licenciado; las tres reglas de §5.4 como invariantes del dominio |
| **Incumplimiento del RNT** | Alto | Media | Inscripción desde el inicio y validación automática del RNT de prestadores |
| **Desintermediación** | Alto | Alta | Valor concentrado en la transacción interna: escrow, atribución, disputas, reputación. Sin candados hostiles |
| **Costo descontrolado de video** | Alto | Media | Embebido, no alojado. Reevaluar solo con ingresos que lo sostengan |
| **Fuga de datos por integración de terceros** | Alto | Media | Revisión formal por conector, alcances mínimos, credenciales cifradas, revocación granular |
| **Inyección de instrucciones vía MCP** | Alto | Media | Contenido de usuario marcado como no confiable, confirmación humana en acciones con dinero, límites de gasto por sesión |
| **Responsabilidad en experiencias de riesgo** | Alto | Baja-media | Póliza obligatoria verificada, protocolos, suspensión automática por alerta. El antecedente del río Güejar fija el estándar |
| **Fraude de atribución** | Medio | Alta | Detección por grafo, reglas publicadas, mediación con evidencia |
| **Audiencia inflada de creadores** | Medio | Alta | Verificación por API social, detección de anomalías, ranking por conversión real |
| **Dependencia de un proveedor de IA** | Medio | Media | Orquestador agnóstico con enrutamiento por tarea |
| **Estacionalidad del turismo del Meta** | Medio | Alta | Catálogo mixto con servicios urbanos recurrentes (belleza, bienestar, formación) |
| **Bloqueo con Vercel o Supabase** | Medio | Media | Arquitectura hexagonal, verificación trimestral contra Postgres local |
| **Dispersión del fundador** | Medio | Alta | Fases con criterios de avance explícitos; no abrir la siguiente sin cerrar la anterior |

---

## 31. Checklists operativos

### 31.1 Antes de construir (cierre de Fase 0)

- [ ] 20+ entrevistas completadas con notas estructuradas
- [ ] 20+ reservas reales gestionadas manualmente y cobradas
- [ ] 5-10 cartas de intención firmadas
- [ ] Al menos una categoría con demanda repetida identificada
- [ ] Tasa de conversión de la página de aterrizaje por encima del 5%
- [ ] Lean Canvas y Business Model Canvas completados
- [ ] Buyer personas de los tres actores respaldadas por entrevistas reales

### 31.2 Antes de la primera sesión de código

- [ ] Node 20+, pnpm, Git y Docker instalados
- [ ] Cuentas de GitHub, Supabase, Vercel, Anthropic y Expo creadas
- [ ] Dos proyectos de Supabase: `dev` y `prod`
- [ ] CLI de Claude Code instalado y extensión de VS Code activa
- [ ] Carpeta creada con `git init`
- [ ] `CLAUDE.md`, `.claudeignore` y `.gitignore` en su lugar
- [ ] Repositorio subido a GitHub

### 31.3 Cierre de la sesión inicial

- [ ] Plan revisado contra el checklist de §24, paso 2
- [ ] Andamiaje ejecutado y diffs revisados
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` en verde
- [ ] Web levantando en local y mostrando servicios
- [ ] Móvil levantando en Expo Go
- [ ] Primer commit hecho y subido
- [ ] `CLAUDE.md` actualizado con el estado

### 31.4 Antes de invitar al primer usuario real

- [ ] Variables de entorno de producción configuradas
- [ ] Row Level Security activo y **probado** en todas las tablas con `organization_id`
- [ ] Política de tratamiento de datos publicada y bases inscritas en el RNBD ante la SIC
- [ ] Plataforma inscrita en el Registro Nacional de Turismo
- [ ] Wompi en modo producción con webhooks verificados y firma validada
- [ ] Prueba de doble reserva simultánea pasando
- [ ] Prueba de idempotencia de webhook pasando
- [ ] Copias de seguridad automáticas activadas y **una restauración probada**
- [ ] Monitoreo de errores conectado (Sentry)
- [ ] Términos y condiciones y contratos plantilla revisados por abogado
- [ ] SAS constituida y facturación electrónica habilitada ante la DIAN
- [ ] Póliza verificada para todo servicio en categoría de riesgo publicado

### 31.5 Revisión trimestral

- [ ] Proyecto corriendo contra Postgres local sin cambios (verificación de portabilidad)
- [ ] Auditoría de imports prohibidos (§26.2)
- [ ] Restauración de copia de seguridad probada
- [ ] Revisión de métricas contra los umbrales de §29.2
- [ ] Auditoría de sesgo del emparejamiento
- [ ] Revisión de conectores activos y alcances concedidos
- [ ] Actualización de precios de infraestructura contra las páginas oficiales

---
---

# ANEXOS

---

## Anexo A — Glosario

| Término | Definición |
|---|---|
| **Arranque en frío** | Problema de un marketplace vacío: sin oferta no hay demanda y sin demanda no hay oferta |
| **Atribución** | Proceso de determinar qué contenido o creador originó una reserva |
| **CAC** | Costo de adquisición de cliente |
| **Escrow** | Retención de fondos por un tercero hasta el cumplimiento de condiciones pactadas |
| **GMV** | Volumen bruto de mercancía: valor total transaccionado en la plataforma |
| **Hono** | Framework web ligero y portátil entre entornos de ejecución de JavaScript |
| **Índice de Fidelidad Promocional** | Medida de qué tan fiel es la promesa de un creador respecto a la experiencia real reportada por quienes compraron |
| **Ledger** | Libro contable de doble entrada que registra todos los movimientos de valor |
| **Liquidez** | Probabilidad de que una búsqueda encuentre oferta y de que una oferta encuentre demanda |
| **LTV** | Valor de vida del cliente |
| **MCP** | Model Context Protocol: estándar abierto para conectar modelos de IA con datos y herramientas |
| **Monolito modular** | Aplicación desplegada como una unidad pero con fronteras internas de dominio explícitas |
| **OTA** | Online Travel Agency: agencia de viajes en línea (Viator, GetYourGuide, Civitatis) |
| **Puerto / Adaptador** | Patrón donde el dominio define interfaces y la infraestructura las implementa |
| **PSP** | Proveedor de servicios de pago |
| **RLS** | Row Level Security: seguridad a nivel de fila en la base de datos |
| **RNBD** | Registro Nacional de Bases de Datos, ante la SIC |
| **RNT** | Registro Nacional de Turismo |
| **ROAS** | Retorno sobre el gasto publicitario |
| **SEDPE** | Sociedad Especializada en Depósitos y Pagos Electrónicos |
| **SIC** | Superintendencia de Industria y Comercio |
| **Take rate** | Porcentaje del GMV que la plataforma retiene como ingreso |
| **TAM / SAM / SOM** | Mercado total, mercado alcanzable, mercado obtenible |

---

## Anexo B — Catálogo completo de eventos de dominio

```
# Catálogo
servicio.creado | servicio.actualizado | servicio.pausado | servicio.eliminado
disponibilidad.cambiada
poliza.cargada | poliza.verificada | poliza.vencida

# Reservas
reserva.creada | reserva.confirmada | reserva.reprogramada
reserva.cancelada | reserva.completada | reserva.no_asistio
cotizacion.solicitada | cotizacion.respondida | cotizacion.aceptada

# Pagos
pago.autorizado | pago.retenido | pago.liberado | pago.reembolsado
pago.fallido | pago.revertido
liquidacion.generada | retiro.solicitado | retiro.completado
asiento.registrado

# Reseñas
resena.publicada | resena.respondida | resena.moderada
divergencia_accesibilidad.detectada

# Campañas y creadores
campana.publicada | campana.postulacion_recibida
campana.contraoferta_enviada | campana.contrato_firmado
campana.escrow_retenido | campana.entregable_cargado
campana.entregable_aprobado | campana.entregable_rechazado
campana.aprobacion_tacita | campana.publicada_en_red
campana.revelacion_verificada | campana.liquidada
creador.audiencia_verificada | creador.anomalia_detectada

# Atribución
atribucion.registrada | atribucion.disputada | atribucion.resuelta

# CRM y clientes
cliente.creado | cliente.actualizado | cliente.segmento_cambiado

# Confianza
disputa.abierta | disputa.evidencia_cargada | disputa.resuelta
fraude.senal_detectada
verificacion.nivel_alcanzado

# Interoperabilidad
conector.autorizado | conector.revocado | conector.sincronizacion_fallida
mcp.cliente_autorizado | mcp.alcance_revocado | mcp.llamada_ejecutada

# Cumplimiento
consentimiento.otorgado | consentimiento.revocado
datos.exportados | datos.eliminados
```

---

## Anexo C — Catálogo completo de herramientas MCP

### Descubrimiento y catálogo

| Herramienta | Función | Alcance |
|---|---|---|
| `buscar_servicios` | Búsqueda semántica con filtros de categoría, ciudad, fecha, precio, accesibilidad | `catalog:read` |
| `obtener_servicio` | Ficha completa de un servicio | `catalog:read` |
| `consultar_disponibilidad` | Slots libres en un rango de fechas | `catalog:read` |
| `listar_categorias` | Taxonomía vigente | público |

### Reservas

| Herramienta | Función | Alcance | Confirmación |
|---|---|---|---|
| `crear_reserva` | Reserva un servicio | `bookings:write` | **Sí** |
| `listar_reservas` | Reservas del usuario o la organización | `bookings:read` | No |
| `reprogramar_reserva` | Cambia fecha respetando la política | `bookings:write` | **Sí** |
| `cancelar_reserva` | Cancela y calcula reembolso | `bookings:write` | **Sí** |
| `solicitar_cotizacion` | Abre cotización para servicio bajo demanda | `bookings:write` | No |

### Creadores y campañas

| Herramienta | Función | Alcance | Confirmación |
|---|---|---|---|
| `buscar_creadores` | Filtra por categoría, ciudad, audiencia, presupuesto, fidelidad | `creators:read` | No |
| `obtener_perfil_creador` | Métricas verificadas y tarifas | `creators:read` | No |
| `estimar_precio_campana` | Rango de precio justo para un brief | `campaigns:read` | No |
| `crear_brief` | Genera un brief estructurado | `campaigns:write` | No |
| `publicar_campana` | Publica el brief a postulaciones | `campaigns:write` | **Sí** |
| `invitar_creador` | Invita a un creador específico | `campaigns:write` | No |
| `listar_postulaciones` | Postulaciones con puntaje de ajuste | `campaigns:read` | No |
| `enviar_contraoferta` | Negocia precio, entregables o plazos | `campaigns:write` | No |
| `aceptar_propuesta` | Genera contrato y activa escrow | `campaigns:write` | **Sí** |
| `revisar_entregable` | Aprueba o solicita cambios | `campaigns:write` | **Sí** |
| `obtener_resultados_campana` | Alcance, clics, reservas, GMV, ROAS | `campaigns:read` | No |

### Gestión del negocio

| Herramienta | Función | Alcance | Confirmación |
|---|---|---|---|
| `crear_servicio` / `actualizar_servicio` | Alta y edición de catálogo | `catalog:write` | No |
| `configurar_disponibilidad` | Horarios, bloqueos, recursos | `catalog:write` | No |
| `listar_clientes` / `buscar_cliente` | CRM | `crm:read` | No |
| `crear_nota_cliente` | Nota interna | `crm:write` | No |
| `enviar_mensaje` | Mensaje en hilo existente | `messages:write` | No |
| `obtener_metricas` | Ingresos, ocupación, conversión, cohortes | `analytics:read` | No |
| `listar_liquidaciones` | Pagos recibidos y pendientes | `payments:read` | No |
| `solicitar_retiro` | Retiro de fondos | `payments:write` | **Sí** |

### Reseñas

| Herramienta | Función | Alcance |
|---|---|---|
| `listar_resenas` | Reseñas de un servicio u organización | `reviews:read` |
| `resumen_resenas` | Síntesis con patrones y alertas | `reviews:read` |
| `responder_resena` | Respuesta pública | `reviews:write` |

---

## Anexo D — Artefactos a producir

**Antes de construir**
1. Lean Canvas y Business Model Canvas
2. Buyer personas de los tres actores, respaldadas por entrevistas reales
3. Mapa de historias de usuario con el corte de MVP marcado
4. Wireframes de los diez flujos críticos
5. Propuesta de valor por actor, validada

**Antes de la primera línea de código**
6. Diagrama entidad-relación completo
7. Especificación OpenAPI 3.1 inicial
8. Registro de decisiones de arquitectura (ADR)
9. Plan de pruebas y criterios de aceptación por módulo

**Antes de operar**
10. Política de tratamiento de datos personales, revisada por abogado
11. Términos y condiciones, revisados por abogado
12. Contratos plantilla de campaña, revisados por abogado
13. Manual de operación de disputas
14. Protocolo de suspensión por alerta en categorías de riesgo

---

## Anexo E — Financiación y apoyo al emprendimiento en Colombia

| Fuente | Tipo | Nota |
|---|---|---|
| **Fondo Emprender (SENA)** | Capital semilla condonable | Requiere completar la Ruta Emprendedora. Algunas convocatorias llegan a montos de hasta aproximadamente COP 780 millones. Hay convocatorias nacionales y focalizadas por región |
| **iNNpulsa Colombia** | Programas de apoyo | Sin costo, financiados con el Presupuesto General de la Nación |
| **Apps.co (MinTIC)** | Acompañamiento a productos digitales | Enfoque específico en aplicaciones y contenidos digitales |
| **Cámara de Comercio de Villavicencio** | Acompañamiento regional | Cercanía, red local y trámites |
| **Centros de Desarrollo Empresarial del SENA en el Meta** | Asesoría | Apoyo regional |
| **Rockstart, Ventures y aceleradoras privadas** | Equity | Etapa posterior, con tracción demostrada |

**Recomendación:** agotar las fuentes no dilutivas antes de ceder participación. Con un MVP validado y liquidez demostrada en un nicho, la valoración en una eventual ronda es sustancialmente mejor.

**Lo que estas convocatorias valoran** es precisamente la evidencia de la Fase 0: entrevistas, transacciones reales, cartas de intención. No la sofisticación del plan.

---

## Anexo F — Advertencias sobre los datos de esta investigación

Un documento de este tipo pierde valor si presenta estimaciones como certezas. Estas son las limitaciones conocidas:

- **No existe cifra pública desglosada del segmento de tours y actividades para LatAm.** Phocuswright la comercializa en reportes de pago. Las cifras regionales citadas corresponden al mercado de viajes total y no deben usarse como si fueran del segmento de experiencias.

- **Las proyecciones de la economía de creadores** (Mobility Foresights) provienen de firmas de investigación de mercado. Son estimaciones, no hechos consolidados.

- **Withlocals y Peek NO son fracasos.** Siguen operando. No deben citarse como cierres.

- **Los precios de Supabase, Firebase, Mux y Cloudflare Stream** provienen de páginas oficiales cruzadas con comparativas de 2026. Cambian con frecuencia: verificarlos en las fuentes oficiales antes de decidir.

- **Sobre los 6.696.835 visitantes de 2024:** el portal estadístico del MinCIT reportaba una cifra menor (aproximadamente 5,83 millones) al momento del anuncio oficial, discrepancia atribuida a insumos pendientes de consolidación.

- **Las cifras de visitantes de Caño Cristales** presentan leve discrepancia según metodología de conteo (por ejemplo, 8.498 frente a 9.017 en 2024, según se cuente solo el sendero del área protegida o todos los ingresos al municipio).

- **Los montos de presupuesto en COP** son estimaciones orientativas para un emprendedor inicial, no cotizaciones formales.

- **Toda la información regulatoria de este documento requiere validación con un abogado colombiano** antes de operar. Está basada en las normas citadas, pero la aplicación concreta a un modelo de negocio específico es un ejercicio jurídico que este documento no reemplaza.

---
---

# Cierre: las decisiones que definen este documento

**Sobre el negocio**

1. **Un foco, no siete.** El producto es contratar servicios y contratar creadores. Todo lo demás lo sostiene.
2. **Dos lados antes de tres.** La Fase 2 está bloqueada hasta demostrar liquidez. Es la diferencia entre este proyecto y Vayable.
3. **Nicho antes que alcance.** Villavicencio, no Colombia. La densidad importa más que el tamaño.
4. **Validar antes de construir.** La Fase 0 vale más que cualquier decisión de arquitectura de este documento.

**Sobre el producto**

5. **Operación completa dentro, conexión completa hacia afuera.** No son opuestos. La plataforma que exige abandonar herramientas pierde.
6. **Interoperabilidad y MCP como producto**, no como integración posterior. Tienen su propio plan y su propio modelo de ingresos.
7. **IA aplicada, no decorativa.** Doce casos de uso concretos con gobernanza explícita.
8. **La honestidad como activo medible.** El Índice de Fidelidad Promocional es lo único que nadie más puede copiar sin operar el mismo tiempo.

**Sobre la técnica**

9. **Ledger antes que wallet.** Evita un requisito de capital de dos millones de dólares.
10. **Monolito modular antes que microservicios.** Extraer después es fácil; consolidar después es imposible.
11. **Embebido antes que alojado.** El video es la variable que puede romper la economía unitaria.
12. **Puertos y adaptadores en todo.** La portabilidad cuesta horas al inicio y ahorra meses después.

**Y una advertencia final**

El error más caro en proyectos como este no es técnico. Es construir seis meses antes de hablar con un solo cliente. Toda la Parte IV de este documento es inútil si lo que se construye no lo quiere nadie.

Construye cuando sepas qué construir. Este documento se asegura de que lo que construyas después no haya que tirarlo.
