/**
 * Утилиты для профилирования и отладки Quadtree hit detection
 * 
 * Используйте эти функции в консоли браузера для измерения производительности
 */

export interface HitDetectionMetrics {
  totalTime: number;
  candidatesFound: number;
  actualMatch: boolean;
  markerClicked?: string;
}

export class QuadtreeProfiler {
  private metrics: HitDetectionMetrics[] = [];
  private isEnabled = true;

  /**
   * Начать профилирование hit detection
   */
  startProfiling() {
    this.metrics = [];
    this.isEnabled = true;
    console.log('🟢 Quadtree profiling started');
  }

  /**
   * Остановить профилирование и вернуть результаты
   */
  stopProfiling() {
    this.isEnabled = false;
    const stats = this.getStats();
    console.log('🔴 Quadtree profiling stopped');
    console.table(stats);
    return stats;
  }

  /**
   * Записать метрику hit detection
   */
  recordHit(metric: HitDetectionMetrics) {
    if (!this.isEnabled) return;
    this.metrics.push(metric);
  }

  /**
   * Получить статистику профилирования
   */
  getStats() {
    if (this.metrics.length === 0) {
      return { message: 'No metrics recorded yet' };
    }

    const times = this.metrics.map(m => m.totalTime);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);

    const candidatesCounts = this.metrics.map(m => m.candidatesFound);
    const avgCandidates = candidatesCounts.reduce((a, b) => a + b, 0) / candidatesCounts.length;

    return {
      'Total Samples': this.metrics.length,
      'Avg Hit Detection Time (ms)': avgTime.toFixed(3),
      'Max Time (ms)': maxTime.toFixed(3),
      'Min Time (ms)': minTime.toFixed(3),
      'Avg Candidates Checked': avgCandidates.toFixed(1),
      'Click Success Rate': `${((this.metrics.filter(m => m.actualMatch).length / this.metrics.length) * 100).toFixed(1)}%`,
    };
  }

  /**
   * Вывести детальный лог последних N метрик
   */
  printLastN(n: number = 10) {
    const last = this.metrics.slice(-n);
    console.table(last.map((m, i) => ({
      '#': i,
      'Time (ms)': m.totalTime.toFixed(3),
      'Candidates': m.candidatesFound,
      'Match': m.actualMatch ? '✓' : '✗',
      'Marker': m.markerClicked || 'None',
    })));
  }

  /**
   * Сравнить текущее профилирование с предыдущим
   */
  compareWithBaseline() {
    const stats = this.getStats();
    console.log('📊 Hit Detection Performance:');
    console.log(`Average time: ${(stats['Avg Hit Detection Time (ms)'] as any).toFixed(3)}ms`);
    console.log(`Candidates checked: ${(stats['Avg Candidates Checked'] as any).toFixed(1)}`);
    
    const avgTime = parseFloat((stats['Avg Hit Detection Time (ms)'] as any).toFixed(3));
    
    if (avgTime < 5) {
      console.log('✅ EXCELLENT - Quadtree working perfectly!');
    } else if (avgTime < 10) {
      console.log('⚠️  OK - Good performance, but can optimize further');
    } else {
      console.log('❌ POOR - Hit detection is slow, check Quadtree');
    }
  }
}

// Глобальный экземпляр profiler
declare global {
  interface Window {
    quadtreeProfiler?: QuadtreeProfiler;
  }
}

// Инициализировать profiler в window
if (typeof window !== 'undefined') {
  window.quadtreeProfiler = new QuadtreeProfiler();
}

/**
 * Вспомогательные функции для тестирования в консоли браузера
 */
export const QuadtreeDebugTools = {
  /**
   * Начать профилирование
   * Использование: QuadtreeDebugTools.start()
   */
  start() {
    if (window.quadtreeProfiler) {
      window.quadtreeProfiler.startProfiling();
    }
  },

  /**
   * Остановить профилирование и показать результаты
   * Использование: QuadtreeDebugTools.stop()
   */
  stop() {
    if (window.quadtreeProfiler) {
      window.quadtreeProfiler.stopProfiling();
    }
  },

  /**
   * Показать последние N клики
   * Использование: QuadtreeDebugTools.showLast(10)
   */
  showLast(n: number = 10) {
    if (window.quadtreeProfiler) {
      window.quadtreeProfiler.printLastN(n);
    }
  },

  /**
   * Сравнить с baseline
   * Использование: QuadtreeDebugTools.compare()
   */
  compare() {
    if (window.quadtreeProfiler) {
      window.quadtreeProfiler.compareWithBaseline();
    }
  },

  /**
   * Полезные советы по тестированию
   * Использование: QuadtreeDebugTools.help()
   */
  help() {
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║        Quadtree Hit Detection - Debug Tools                        ║
╚════════════════════════════════════════════════════════════════════╝

🎯 QUICK START:
  1. QuadtreeDebugTools.start()        // Start profiling
  2. Click on markers (10-20 times)
  3. QuadtreeDebugTools.stop()         // Stop and show results

📊 AVAILABLE COMMANDS:
  • QuadtreeDebugTools.start()         - Begin recording metrics
  • QuadtreeDebugTools.stop()          - Stop recording and show stats
  • QuadtreeDebugTools.showLast(N)     - Show last N clicks (default 10)
  • QuadtreeDebugTools.compare()       - Compare with baseline performance
  • QuadtreeDebugTools.help()          - Show this help message

🔍 WHAT TO LOOK FOR:
  ✅ GOOD:
     - Avg hit detection time < 5ms
     - Avg candidates checked < 10
     - All clicks result in match (100%)
  
  ⚠️  NEEDS IMPROVEMENT:
     - Avg hit detection time 5-10ms
     - Avg candidates checked 10-20
  
  ❌ BAD:
     - Avg hit detection time > 10ms
     - Avg candidates checked > 50

📈 EXAMPLE SESSION:
  > QuadtreeDebugTools.start()
  🟢 Quadtree profiling started
  
  > // Click on 15 markers on the map
  
  > QuadtreeDebugTools.stop()
  🔴 Quadtree profiling stopped
  ┌─────────────────────────────────┬────────┐
  │ Total Samples                   │ 15     │
  │ Avg Hit Detection Time (ms)     │ 1.234  │
  │ Max Time (ms)                   │ 2.456  │
  │ Min Time (ms)                   │ 0.789  │
  │ Avg Candidates Checked          │ 4.7    │
  │ Click Success Rate              │ 100%   │
  └─────────────────────────────────┴────────┘
  ✅ EXCELLENT - Quadtree working perfectly!

💡 OPTIMIZATION TIPS:
  • If time > 10ms: Check if Quadtree is being rebuilt too often
  • If candidates > 30: Increase maxZoom in Quadtree constructor
  • If success rate < 100%: Adjust searchRadius in query calls
    `);
  },
};

/**
 * Вспомогательная функция для логирования в консоли
 */
export function logHitDetectionMetric(
  candidates: number,
  success: boolean,
  markerClicked?: string,
  executionTime?: number
) {
  if (window.quadtreeProfiler && executionTime !== undefined) {
    window.quadtreeProfiler.recordHit({
      totalTime: executionTime,
      candidatesFound: candidates,
      actualMatch: success,
      markerClicked,
    });
  }
}

// Экспортируем для использования в компоненте
export default QuadtreeDebugTools;
