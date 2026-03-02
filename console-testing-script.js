// 🧪 ФАЗА 1 ТЕСТИРОВАНИЕ - БЫСТРЫЙ СКРИПТ
// Скопируй этот весь файл в консоль браузера (F12 → Console)
// Или используй как reference для отдельных команд

// ============================================
// 1️⃣ ГЕНЕРИРОВАНИЕ 100 ТЕСТОВЫХ ЛОКАЦИЙ
// ============================================

async function createTestLocations(count = 100) {
  console.log(`%c🚀 Creating ${count} test locations...`, 'color: blue; font-size: 14px; font-weight: bold;');
  let created = 0;
  let failed = 0;
  
  for (let i = 0; i < count; i++) {
    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Test Location ${i + 1}`,
          type: ['workstation', 'meeting-room', 'common-area', 'equipment'][Math.floor(Math.random() * 4)],
          status: ['available', 'occupied', 'maintenance'][Math.floor(Math.random() * 3)],
          floor: '5',
          x: Math.random() * 100,
          y: Math.random() * 100,
          capacity: Math.floor(Math.random() * 4) + 1,
          equipment: `PC-${String(Math.floor(Math.random() * 100)).padStart(3, '0')}`,
        })
      });
      
      if (response.ok) {
        created++;
        if (created % 10 === 0) {
          console.log(`%c✓ Created ${created}/${count}`, 'color: green;');
        }
      } else {
        failed++;
      }
    } catch (e) {
      failed++;
      console.error(`Error creating location ${i}:`, e);
    }
  }
  
  console.log(`%c✅ DONE: Created ${created} / Failed ${failed}`, 
              created === count ? 'color: green; font-weight: bold; font-size: 12px;' : 'color: orange;');
  
  console.log('%cReloading page in 2 seconds...', 'color: gray; font-style: italic;');
  setTimeout(() => {
    location.reload();
  }, 2000);
}

// Выполни: createTestLocations(100);

// ============================================
// 2️⃣ ИЗМЕРЕНИЕ FPS (REAL-TIME)
// ============================================

function measureFPS() {
  let frameCount = 0;
  let fps = 60;
  let startTime = performance.now();
  
  const results = {
    fps: 60,
    frames: 0,
    duration: 0,
    memory: 0,
    domNodes: 0,
  };
  
  function countFrames() {
    frameCount++;
    requestAnimationFrame(countFrames);
  }
  
  countFrames();
  
  // Результаты через 10 секунд
  const timer = setTimeout(() => {
    const elapsed = performance.now() - startTime;
    const avgFps = Math.round((frameCount * 1000) / elapsed);
    const memory = (performance.memory?.usedJSHeapSize / 1048576).toFixed(1);
    const domNodes = document.querySelectorAll('*').length;
    
    const hasCanvas = !!document.querySelector('canvas [data-testid*="canvas"], canvas[data-testid*="canvas"]');
    const markerCount = document.querySelectorAll('[data-testid*="marker"], circle[id*="marker"]').length;
    
    // Вывод результатов
    console.clear();
    console.log('%c📊 ============ FPS MEASUREMENT RESULTS ============', 'color: blue; font-weight: bold; font-size: 14px;');
    console.log(`%c⏱️  Duration: ${Math.round(elapsed)}ms`, 'font-size: 12px;');
    console.log(`%c📈 FPS Average: ${avgFps}`, avgFps >= 55 ? 'color: green; font-weight: bold; font-size: 14px;' : 'color: orange; font-size: 14px;');
    console.log(`%c🖼️  Total Frames: ${frameCount}`, 'font-size: 12px;');
    console.log(`%c💾 Memory Used: ${memory} MB`, 'font-size: 12px;');
    console.log(`%c🌳 DOM Nodes: ${domNodes}`, 'font-size: 12px;');
    console.log(`%c🎨 Render Mode: ${hasCanvas ? 'Canvas ✅' : 'DOM'}`, hasCanvas ? 'color: green;' : 'color: orange;');
    console.log(`%c📍 Marker Count: ${markerCount}`, 'font-size: 12px;');
    
    console.log('%c========================================', 'color: blue; font-weight: bold;');
    
    if (avgFps >= 55) {
      console.log('%c✅ EXCELLENT! Performance is optimal. FPS is stable at 55+', 'color: green; font-weight: bold; font-size: 12px;');
    } else if (avgFps >= 50) {
      console.log('%c⚠️ ACCEPTABLE but can be better. FPS 50-55 range.', 'color: orange; font-weight: bold; font-size: 12px;');
    } else if (avgFps >= 45) {
      console.log('%c❌ BELOW TARGET. FPS below 50. Phase 2 optimization recommended.', 'color: red; font-weight: bold; font-size: 12px;');
    } else {
      console.log('%c❌ CRITICAL. FPS below 45. Something is wrong.', 'color: red; font-weight: bold; font-size: 14px;');
    }
    
    console.log('%c========================================', 'color: blue; font-weight: bold;');
  }, 10000);
  
  console.log('%c🔴 RECORDING FPS... Perform pan/zoom actions now!', 'color: red; font-weight: bold; font-size: 14px;');
  console.log('%cResults will appear in 10 seconds ...', 'color: gray;');
}

// Выполни: measureFPS();

// ============================================
// 3️⃣ ПРОВЕРКА ТЕКУЩЕГО РЕЖИМА РЕНДЕРИНГА
// ============================================

function checkRenderMode() {
  const markerCount = document.querySelectorAll('[data-testid*="marker"], circle').length || 'unknown';
  const hasCanvas = !!document.querySelector('canvas[data-testid*="canvas"], canvas[id*="interactive"]');
  const domMarkers = document.querySelectorAll('[data-testid*="location-marker"]').length;
  const domNodes = document.querySelectorAll('*').length;
  const memory = (performance.memory?.usedJSHeapSize / 1048576).toFixed(1);
  
  console.log('%c🔍 ============ RENDER MODE CHECK ============', 'color: blue; font-weight: bold; font-size: 14px;');
  console.log(`%c📍 Marker count: ${markerCount}`, 'font-size: 12px;');
  console.log(`%c🎨 Rendering Mode: ${hasCanvas ? 'CANVAS ✅' : 'DOM'}`, 
              hasCanvas ? 'color: green; font-weight: bold;' : 'color: orange;');
  
  if (hasCanvas) {
    console.log(`%c  └─ Canvas mode (90+ markers): Expected for ${markerCount}+ markers`, 'color: green; font-size: 11px;');
  } else if (domMarkers > 0) {
    console.log(`%c  └─ DOM mode: ${domMarkers} LocationMarker components`, 'color: orange; font-size: 11px;');
    if (domMarkers > 80) {
      console.log(`%c     ⚠️ WARNING: ${domMarkers} DOM markers may cause performance issues!`, 'color: red;');
    }
  }
  
  console.log(`%c💾 Memory: ${memory} MB`, 'font-size: 12px;');
  console.log(`%c🌳 Total DOM Nodes: ${domNodes}`, 'font-size: 12px;');
  console.log('%c==========================================', 'color: blue; font-weight: bold;');
}

// Выполни: checkRenderMode();

// ============================================
// 4️⃣ FULL PERFORMANCE REPORT
// ============================================

function fullPerformanceReport() {
  const markerCount = document.querySelectorAll('[data-testid*="marker"], circle').length;
  const hasCanvas = !!document.querySelector('canvas[data-testid*="canvas"]');
  const domMarkers = document.querySelectorAll('[data-testid*="location-marker"]').length;
  const memory = (performance.memory?.usedJSHeapSize / 1048576).toFixed(1);
  const domNodes = document.querySelectorAll('*').length;
  
  // Получи историю FPS за последние 60 frames
  let fpsSamples = [];
  let lastTime = performance.now();
  let framesSampled = 0;
  
  const collectSamples = () => {
    const now = performance.now();
    const deltaTime = now - lastTime;
    const currentFps = Math.round(1000 / deltaTime);
    fpsSamples.push(currentFps);
    lastTime = now;
    framesSampled++;
    
    if (framesSampled < 60) {
      requestAnimationFrame(collectSamples);
    } else {
      // Анализ результатов
      const avgFps = Math.round(fpsSamples.reduce((a, b) => a + b) / fpsSamples.length);
      const minFps = Math.min(...fpsSamples);
      const maxFps = Math.max(...fpsSamples);
      
      console.clear();
      console.log('%c╔════════════════════════════════════════════════════╗', 'color: blue; font-weight: bold;');
      console.log('%c║         PHASE 1 OPTIMIZATION REPORT                ║', 'color: blue; font-weight: bold;');
      console.log('%c╚════════════════════════════════════════════════════╝', 'color: blue; font-weight: bold;');
      
      console.log('%c\n📊 PERFORMANCE METRICS:', 'color: blue; font-weight: bold; font-size: 13px;');
      console.log(`%c  ✓ Average FPS: ${avgFps}`, avgFps >= 55 ? 'color: green; font-weight: bold;' : 'color: orange;');
      console.log(`%c  ✓ Min FPS: ${minFps}`);
      console.log(`%c  ✓ Max FPS: ${maxFps}`);
      console.log(`%c  ✓ Memory: ${memory} MB`);
      console.log(`%c  ✓ DOM Nodes: ${domNodes}`);
      
      console.log('%c\n🎨 RENDERING MODE:', 'color: blue; font-weight: bold; font-size: 13px;');
      console.log(`%c  ✓ Mode: ${hasCanvas ? 'Canvas ✅' : 'DOM'}`, 
                  hasCanvas ? 'color: green; font-weight: bold;' : 'color: orange;');
      console.log(`%c  ✓ Markers: ${markerCount}`);
      if (hasCanvas) {
        console.log(`%c  ✓ Canvas is rendering ${markerCount} markers efficiently`, 'color: green;');
      } else {
        console.log(`%c  ✓ DOM mode with ${domMarkers} components`, domMarkers > 80 ? 'color: orange;' : 'color: green;');
      }
      
      console.log('%c\n✅ ASSESSMENT:', 'color: blue; font-weight: bold; font-size: 13px;');
      if (avgFps >= 55 && hasCanvas) {
        console.log('%c  ✨ EXCELLENT! Phase 1 optimization successful!', 'color: green; font-weight: bold; font-size: 12px;');
        console.log('%c  🎉 System ready for production', 'color: green;');
      } else if (avgFps >= 50) {
        console.log('%c  ⚠️ ACCEPTABLE but proceed to Phase 2', 'color: orange; font-weight: bold;');
      } else {
        console.log('%c  ❌ Needs further investigation', 'color: red; font-weight: bold;');
      }
      
      console.log('%c\n╔════════════════════════════════════════════════════╗', 'color: blue; font-weight: bold;');
    }
  };
  
  requestAnimationFrame(collectSamples);
  console.log('%c📊 Collecting FPS samples for 60 frames (~1 second)...', 'color: blue; font-weight: bold;');
}

// Выполни: fullPerformanceReport();

// ============================================
// QUICK COMMANDS SUMMARY
// ============================================

console.log(`%c
╔════════════════════════════════════════════════════════════════════╗
║              🧪 PHASE 1 TESTING - QUICK COMMANDS                  ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  1️⃣  CREATE TEST DATA (100 locations):                            ║
║     createTestLocations(100);                                     ║
║                                                                    ║
║  2️⃣  MEASURE FPS (10 seconds):                                    ║
║     measureFPS();                                                 ║
║     Then perform pan/zoom actions!                                ║
║                                                                    ║
║  3️⃣  CHECK RENDER MODE:                                           ║
║     checkRenderMode();                                            ║
║                                                                    ║
║  4️⃣  FULL PERFORMANCE REPORT:                                     ║
║     fullPerformanceReport();                                      ║
║                                                                    ║
║  Expected Results after Phase 1:                                  ║
║  ✅ Canvas mode active for 90+ markers                            ║
║  ✅ FPS should be 55-60                                           ║
║  ✅ Memory < 130 MB                                               ║
║  ✅ DOM nodes < 10                                                ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
`, 'color: blue; font-weight: bold; font-size: 11px;');
