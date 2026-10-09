async function obtenerLimitesNativos() {
    console.log("--- 🚀 LÍMITES REALES DESBLOQUEADOS EN NODE.JS --- \n");

    // 1. Solución al error: Importación dinámica del módulo ESM en CommonJS
    const { create } = await import('webgpu');

    // 2. Inicializar el entorno WebGPU nativo de Dawn
    const navigator = { gpu: create([]) };
    
    // 3. Solicitar el adaptador físico forzando alto rendimiento
    const adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance'
    });
    
    if (!adapter) {
        console.error("❌ No se encontró una GPU compatible con WebGPU nativo.");
        return;
    }

    // 4. Solicitar el dispositivo inyectando los límites MÁXIMOS del hardware físico
    const device = await adapter.requestDevice({
        requiredLimits: adapter.limits 
    });

    const limits = device.limits;

    console.log("🔹 [Hilos y Cómputo Nativos]");
    console.log(`  - Hilos Máximos por Grupo de Trabajo (Workgroup Size): ${limits.maxComputeInvocationsPerWorkgroup}`);
    console.log(`  - Despachos Máximos por Dimensión (dispatchWorkgroups): ${limits.maxComputeWorkgroupsPerDimension}`);

    console.log("\n🔹 [Memoria y Búferes Nativos]");
    const bufferSizeGB = (limits.maxStorageBufferBindingSize / (1024 * 1024 * 1024)).toFixed(2);
    console.log(`  - Tamaño Máximo de UN SOLO Storage Buffer: ${limits.maxStorageBufferBindingSize.toLocaleString()} bytes (~${bufferSizeGB} GB)`);
    console.log(`  - Storage Buffers Activos Simultáneos por Shader: ${limits.maxStorageBuffersPerShaderStage}`);
    
    const maxVramTeorica = ((limits.maxStorageBufferBindingSize * limits.maxStorageBuffersPerShaderStage) / (1024 * 1024 * 1024)).toFixed(2);
    console.log(`  - Capacidad Teórica de Salida Simultánea (Todos los slots): ~${maxVramTeorica} GB`);
}

obtenerLimitesNativos().catch(console.error);
