let trajectory: number[] = [
  [0.07, 0.19], [0.15, 0.30], [0.23, 0.22], [0.31, 0.49],
  [0.40, 0.41], [0.50, 0.64], [0.61, 0.55], [0.72, 0.77],
  [0.84, 0.68], [0.94, 0.87],
].flat();



const lastPoint = trajectory.slice(-2);
const firstPoint = trajectory.slice(0, 2);
for (let i = 1; i <= 300; i++) {
  const t = i / 300;
  const x = lastPoint[0] * (1 - t) + firstPoint[0] * t;
  const y = lastPoint[1] * (1 - t) + firstPoint[1] * t;
  trajectory.push(x, y);
}
