const test = require("node:test");
const assert = require("node:assert/strict");
const zlib = require("node:zlib");
const { textureImage } = require("./backupHover");

function decodeImage(image) {
    const png = Buffer.from(image.uri.split(",")[1], "base64");
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    let offset = 8;
    const data = [];
    while (offset < png.length) {
        const size = png.readUInt32BE(offset);
        const name = png.toString("ascii", offset + 4, offset + 8);
        if (name === "IDAT") data.push(png.subarray(offset + 8, offset + 8 + size));
        offset += size + 12;
    }
    return { width, height, pixels: zlib.inflateSync(Buffer.concat(data)) };
}

test("renders scalar values as a scaled grayscale PNG", () => {
    const image = textureImage({ w: 2, h: 1, dim: 1, data: [0, 10] });
    const decoded = decodeImage(image);
    assert.equal(decoded.width, 16);
    assert.equal(decoded.height, 8);
    assert.deepEqual(image.ranges, [{ name: "R", min: 0, max: 10 }]);
    assert.deepEqual([...decoded.pixels.subarray(1, 5)], [0, 0, 0, 255]);
    assert.deepEqual([...decoded.pixels.subarray(1 + 15 * 4, 1 + 16 * 4)], [255, 255, 255, 255]);
});

test("renders RG and RGBA with separate channel ranges", () => {
    const rg = textureImage({ w: 2, h: 1, dim: 2, data: [0, 10, 2, 0] });
    const rgba = textureImage({ w: 1, h: 1, dim: 4, data: [4, 8, 12, 0.5] });
    assert.equal(decodeImage(rg).pixels[3], 0);
    assert.deepEqual(rg.ranges.map((range) => [range.min, range.max]), [[0, 2], [0, 10]]);
    assert.equal(rgba.ranges[3].min, 0.5);
    assert.equal(decodeImage(rgba).width, 8);
});

test("rejects incomplete texture payloads", () => {
    assert.equal(textureImage({ w: 2, h: 2, dim: 4, data: [1] }), null);
});
