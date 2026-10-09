dnti_shaderdsl parse . --watch --serve 3030 

## Mesh LOD

The native-resolution radius is 256 texels (40.96 world units at dx=dy=0.16).
The mesh covers 24 texture periods on each side and limits outer spacing to
128 texels. Priority texel [512,512] is included in every repeated tile.

LOD coordinates belong to fixed world grids. Camera movement selects a new
grid window only after crossing its hysteresis threshold; it does not slide
the sampled height field. Coordinates are uploaded once per window change.
The active surface uses {time}, so its height animation continues independently
of camera motion. Freeze time when comparing static LOD sampling.
