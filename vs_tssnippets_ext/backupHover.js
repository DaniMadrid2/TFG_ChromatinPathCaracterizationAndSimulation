const zlib = require("node:zlib");

function crc32(buffer) {
    let crc = 0xffffffff;
    for (const byte of buffer) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
    const name = Buffer.from(type, "ascii");
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
    return Buffer.concat([length, name, data, checksum]);
}

function textureImage(value) {
    const sourceWidth = Number(value?.w);
    const sourceHeight = Number(value?.h);
    const channels = Number(value?.dim);
    const data = value?.data;
    if (!Number.isInteger(sourceWidth) || !Number.isInteger(sourceHeight) ||
        sourceWidth < 1 || sourceHeight < 1 || !Number.isInteger(channels) ||
        channels < 1 || channels > 4 || !Array.isArray(data) ||
        data.length < sourceWidth * sourceHeight * channels) return null;

    const names = ["R", "G", "B", "A"].slice(0, channels);
    const ranges = names.map(() => ({ min: Infinity, max: -Infinity }));
    for (let index = 0; index < sourceWidth * sourceHeight; index++) {
        for (let channel = 0; channel < channels; channel++) {
            const sample = Number(data[index * channels + channel]);
            if (!Number.isFinite(sample)) continue;
            ranges[channel].min = Math.min(ranges[channel].min, sample);
            ranges[channel].max = Math.max(ranges[channel].max, sample);
        }
    }
    const scale = Math.min(8, 384 / sourceWidth, 256 / sourceHeight);
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const rows = Buffer.alloc(height * (1 + width * 4));
    const normalized = (index, channel) => {
        const range = ranges[channel];
        const sample = Number(data[index * channels + channel]);
        if (!Number.isFinite(sample) || !Number.isFinite(range.min)) return 0;
        if (range.max === range.min) return sample === 0 ? 0 : 1;
        return Math.max(0, Math.min(1, (sample - range.min) / (range.max - range.min)));
    };
    for (let y = 0; y < height; y++) {
        const sourceY = Math.min(sourceHeight - 1, Math.floor((y + 0.5) * sourceHeight / height));
        for (let x = 0; x < width; x++) {
            const sourceX = Math.min(sourceWidth - 1, Math.floor((x + 0.5) * sourceWidth / width));
            const sourceIndex = sourceY * sourceWidth + sourceX;
            const offset = y * (1 + width * 4) + 1 + x * 4;
            const r = Math.round(normalized(sourceIndex, 0) * 255);
            const g = channels >= 2 ? Math.round(normalized(sourceIndex, 1) * 255) : r;
            const b = channels >= 3 ? Math.round(normalized(sourceIndex, 2) * 255) : channels === 2 ? 0 : r;
            const alpha = channels === 4 ? Math.max(0, Math.min(1, Number(data[sourceIndex * channels + 3]) || 0)) : 1;
            const background = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? 190 : 235;
            rows[offset] = Math.round(r * alpha + background * (1 - alpha));
            rows[offset + 1] = Math.round(g * alpha + background * (1 - alpha));
            rows[offset + 2] = Math.round(b * alpha + background * (1 - alpha));
            rows[offset + 3] = 255;
        }
    }
    const header = Buffer.alloc(13);
    header.writeUInt32BE(width, 0);
    header.writeUInt32BE(height, 4);
    header[8] = 8;
    header[9] = 6;
    const png = Buffer.concat([
        Buffer.from("89504e470d0a1a0a", "hex"),
        pngChunk("IHDR", header),
        pngChunk("IDAT", zlib.deflateSync(rows)),
        pngChunk("IEND", Buffer.alloc(0)),
    ]);
    return {
        uri: `data:image/png;base64,${png.toString("base64")}`,
        width,
        height,
        ranges: ranges.map((range, index) => ({
            name: names[index],
            min: Number.isFinite(range.min) ? range.min : null,
            max: Number.isFinite(range.max) ? range.max : null,
        })),
    };
}

module.exports = { textureImage };
