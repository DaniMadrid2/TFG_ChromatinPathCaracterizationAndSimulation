export type Point = readonly [number, number];

export function meanPoint(points: readonly Point[]): Point {
  if (!points.length) throw new Error('A trajectory needs at least one point');
  const sum = points.reduce(([x, y], [px, py]) => [x + px, y + py], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

export function drawTrajectory(canvas: HTMLCanvasElement, background: HTMLCanvasElement, points: readonly Point[]): void {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is required');
  const width = canvas.width;
  const height = canvas.height;
  const padX = 44;
  const padY = 70;
  const toPixel = ([x, y]: Point): Point => [padX + x * (width - 2 * padX), padY + y * (height - padY - 42)];
  const mean = meanPoint(points);

  context.drawImage(background, 0, 0, width, height);
  context.fillStyle = 'rgba(16, 28, 34, 0.82)';
  context.fillRect(0, 0, width, 62);
  context.fillStyle = '#f7faf8';
  context.font = '600 19px system-ui';
  context.fillText(`Media: (${mean[0].toFixed(3)}, ${mean[1].toFixed(3)})`, 22, 39);

  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.beginPath();
  points.forEach((point, index) => {
    const [x, y] = toPixel(point);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.strokeStyle = '#173b42';
  context.lineWidth = 8;
  context.stroke();
  context.strokeStyle = '#ffffff';
  context.lineWidth = 3;
  context.stroke();

  for (const point of points) {
    const [x, y] = toPixel(point);
    context.beginPath();
    context.arc(x, y, 5, 0, Math.PI * 2);
    context.fillStyle = '#15343c';
    context.fill();
    context.beginPath();
    context.arc(x, y, 2.5, 0, Math.PI * 2);
    context.fillStyle = '#ffffff';
    context.fill();
  }

  const [mx, my] = toPixel(mean);
  context.beginPath();
  context.arc(mx, my, 12, 0, Math.PI * 2);
  context.fillStyle = '#e63946';
  context.fill();
  context.strokeStyle = '#ffffff';
  context.lineWidth = 3;
  context.stroke();
}
