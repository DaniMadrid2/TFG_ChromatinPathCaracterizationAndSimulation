let trajectory: number[] = [
  [0.06, 0.74], [0.15, 0.57], [0.24, 0.62], [0.33, 0.35],
  [0.44, 0.43], [0.53, 0.28], [0.64, 0.39], [0.73, 0.17],
  [0.84, 0.26], [0.94, 0.11],
].flat();
//Somehow trajectory is length 20, but it should be able to add more points to it

//Add 300 more points to the trajectory by interpolating between the last point and the first point
//make sure trajectory is a flat array of numbers, not an array of tuples

const lastPoint = trajectory.slice(-2);
const firstPoint = trajectory.slice(0, 2);
for (let i = 1; i <= 300; i++) {
  const t = i / 300;
  const x = lastPoint[0] * (1 - t) + firstPoint[0] * t;
  const y = lastPoint[1] * (1 - t) + firstPoint[1] * t;
  trajectory.push(x, y);
}