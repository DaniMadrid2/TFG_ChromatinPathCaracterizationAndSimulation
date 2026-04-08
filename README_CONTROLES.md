# Controles C1 y C2 (Reologia_01_Intro_a_la_reologia)

Este resumen recoge las teclas activas definidas en `parseText2.shaderdsl.ts` (C1) y `parseTextC2.shaderdsl.ts` (C2).

## C1 (`parseText2.shaderdsl.ts`)

| Tecla | Acción | Notas |
|---|---|---|
| `r` | Reinicia el porcentaje mostrado y cambia velocidad aleatoria de aparición | `percentageShown=0`, `ShownSpeed` aleatoria entre 1 y 4 |
| `p` | Toggle marcador de inicio | Activa/desactiva `showStartPointer` |
| `h` | Toggle visualización PCA | Activa/desactiva `showPCA` |
| `u` | Toggle modo cromatina simulada | Activa/desactiva `showSimulatedChrom` |
| `g` | Toggle mostrar otras cromatinas | Activa/desactiva `showOtherChromatins` |
| `y` | Toggle media de subsecuencias para simulación | Cambia `simMeanSubseq` y fuerza rebuild en C2 vía `window.simReqRebuild` |
| `k` | Toggle modo 2D/3D | Reconfigura cámara, `offset`, `scale` e `is3D` en shaders |

## C2 (`parseTextC2.shaderdsl.ts`)

| Tecla | Acción | Notas |
|---|---|---|
| `u` | Recalcular pipeline de tau | Pone `recomputeTau=true` |
| `q` | Toggle vista LS | `useLSView` |
| `e` | Toggle auto-selección del mejor modelo | `autoPickBest` + recalcula |
| `n` | Aumenta `%` top modelos | `keepTopPercent += 5` (máx. 80) + recalcula |
| `i` | Disminuye `%` top modelos | `keepTopPercent -= 5` (mín. 5) + recalcula |
| `j` | Toggle overlay MSD (original vs simulada) | Activa/desactiva `showMSDOverlay` |
| `f` | Toggle filtro FP | `useFPFilter` + recalcula |
| `t` | Toggle modo curvas HUD | `showTauCurves` (si está apagado no se dibujan paneles de curvas) |
| `b` | Toggle overlay crudo `f_km/a_km` (tau=1) | `showRawKMOverlay` |
| `m` | Toggle overlay `f(t)` por Least Squares (tau=1) | `showLSFOverlay` |
| `r` | Toggle curva FP estacionaria | `showFPStationary` |
| `o` | Toggle selección por score | `useScoreSelection` + recalcula |
| `l` | Toggle logs top modelos | `logTopModels` |
| `x` | Tau siguiente | Incrementa `bestTau` dentro de `[tauMinVeces, tauMaxVeces]` + recalcula |
| `z` | Tau anterior | Decrementa `bestTau` dentro de rango + recalcula |
| `v` | Subsecuencia siguiente | Sólo si `bestTau>1`; avanza circular + recalcula |
| `c` | Subsecuencia anterior | Sólo si `bestTau>1`; retrocede circular + recalcula |

## Casos y contexto visual en C2

- Las curvas/paneles de diagnóstico se ven cuando `showTauCurves=true` (tecla `t`).
- El overlay MSD (tecla `j`) dibuja:
  - MSD original: blanco
  - MSD simulada: verde
- Overlays opcionales sobre la gráfica principal:
  - `b`: `f_km/a_km` crudos para `tau=1`
  - `m`: `f(t)` LS para `tau=1`

## Nota rápida

- C1 y C2 comparten estado por `window` para la parte de simulación (por ejemplo `simUseMeanSubseq`, `simReqRebuild`, `simDataX/simDataY`).


