
export function HSLtoRGB(h, s, l,trs=1){
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    //return [255 * f(0), 255 * f(8), 255 * f(4)];
    return `rgba(${255*f(0)},${255*f(8)},${255*f(4)},${trs})`
};

export function randomBetween(min=0, max=1) {
    return Math.random()*(max-min) + min;
}


export function randRange(min=0, max=1) {
    return Math.random()*(max-min) + min;
}


/**
 * 
 * @param space array of numbers defining [-x,+x,-y,+y,-z,+z,-w,+w,...] spaces to get random values
 * @returns Random Values obtained in that space (space.length/2)
 */
export function rand(...space:number[]) {
    let rs=[];
    for (let i = 0; i < space.length; i+=2) {
      rs[i/2]=Math.random()*(space[i+1]-space[i]) + space[i];
      
    }
    return rs;
}