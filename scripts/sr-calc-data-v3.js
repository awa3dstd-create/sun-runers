/* ════════════════════════════════════════════════════════════
   SUN-RUNERS — Calculadora v3 (Awwward-quality)
   - Sin emojis, con SVG icons tipo Lucide
   - Glass morphism premium
   - Texto rotatorio en botón flotante
   - Body scroll bloqueado cuando modal abierto
   - Cantidad por equipo funcional
   ════════════════════════════════════════════════════════════ */
(function() {
  'use strict';
  console.log('[SR v3] Init...');

  /* === Patches heredados (scroll, intro, etc) === */
  var originalScrollTo = window.scrollTo.bind(window);
  var allowScrollUntil = 0;
  document.addEventListener('click', function(e) {
    var t = e.target;
    while (t && t !== document.body) {
      if (t.getAttribute && t.getAttribute('aria-label') === 'Volver arriba') { allowScrollUntil = Date.now() + 1000; break; }
      if (t.tagName === 'BUTTON' && t.textContent.trim().includes('Arriba')) { allowScrollUntil = Date.now() + 1000; break; }
      t = t.parentNode;
    }
  }, true);
  window.scrollTo = function() {
    var a = arguments;
    var o = a[0] && typeof a[0] === 'object' ? a[0] : { top: a[1] || 0, behavior: 'auto' };
    if (o.top === 0 && o.behavior === 'smooth' && Date.now() > allowScrollUntil) return;
    return originalScrollTo.apply(window, a);
  };

  function hideIntroOverlay() {
    var o = document.querySelector('.intro-overlay');
    if (o) { o.style.opacity = '0'; o.style.visibility = 'hidden'; o.style.pointerEvents = 'none'; o.style.transition = 'opacity 0.6s ease-out'; }
  }
  setTimeout(hideIntroOverlay, 6000);
  var introHidden = false;
  function hideOnFirstInteraction() { if (!introHidden) { introHidden = true; setTimeout(hideIntroOverlay, 100); } }
  window.addEventListener('scroll', hideOnFirstInteraction, { once: true, passive: true });
  window.addEventListener('touchmove', hideOnFirstInteraction, { once: true, passive: true });
  document.addEventListener('click', hideOnFirstInteraction, { once: true });

  var originalScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function(options) {
    if (window.innerWidth <= 1024) { options = options || {}; options.behavior = 'auto'; }
    return originalScrollIntoView.call(this, options);
  };

  /* === SVG ICONS (estilo Lucide) === */
  var ICONS = {
    fridge: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="5" y1="10" x2="19" y2="10"/><line x1="9" y1="6" x2="9" y2="7"/><line x1="9" y1="14" x2="9" y2="15"/></svg>',
    freezer: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"/></svg>',
    ac: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"/></svg>',
    water: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
    tv: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>',
    light: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><circle cx="12" cy="12" r="4"/></svg>',
    washer: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="14" r="6"/><line x1="8" y1="6" x2="8" y2="6"/><line x1="12" y1="6" x2="12" y2="6"/></svg>',
    computer: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    router: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="18" x2="6.01" y2="18"/><line x1="10" y1="18" x2="10.01" y2="18"/><path d="M12 14V8M9 11l3-3 3 3M16 16h2"/></svg>',
    fan: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2M9.6 4.6A2 2 0 1 1 11 8H2M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>',
    microwave: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><rect x="6" y="8" width="12" height="8"/><line x1="18" y1="11" x2="18" y2="13"/></svg>'
  };

  /* === Catálogo de electrodomésticos === */
  var APPLIANCES = {
    'fridge':           { label: 'Refrigerador',            watts: 200,  wattsSurge: 1200, hoursPerDay: 24,  icon: 'fridge',    category: 'Cocina' },
    'freezer':          { label: 'Congelador',              watts: 250,  wattsSurge: 1500, hoursPerDay: 24,  icon: 'freezer',   category: 'Cocina' },
    'ac-small':         { label: 'Aire 12000 BTU',         watts: 1200, wattsSurge: 3600, hoursPerDay: 8,   icon: 'ac',        category: 'Clima' },
    'ac-large':         { label: 'Aire 18000 BTU',          watts: 1800, wattsSurge: 5400, hoursPerDay: 8,   icon: 'ac',        category: 'Clima' },
    'water-pump':       { label: 'Bomba de agua',           watts: 750,  wattsSurge: 2250, hoursPerDay: 2,   icon: 'water',     category: 'Agua' },
    'tv':               { label: 'Televisor LED',          watts: 120,  wattsSurge: 120,  hoursPerDay: 5,   icon: 'tv',        category: 'Entretenimiento' },
    'lights':           { label: 'Iluminación LED (8 pts)', watts: 80,  wattsSurge: 80,   hoursPerDay: 5,   icon: 'light',     category: 'Iluminación' },
    'washing-machine':  { label: 'Lavadora',                watts: 500,  wattsSurge: 1800, hoursPerDay: 1,   icon: 'washer',    category: 'Electrodoméstico' },
    'computer':         { label: 'Computadora / Laptop',   watts: 150,  wattsSurge: 150,  hoursPerDay: 6,   icon: 'computer',   category: 'Oficina' },
    'router':           { label: 'Router WiFi',             watts: 15,   wattsSurge: 15,   hoursPerDay: 24,  icon: 'router',     category: 'Conectividad' },
    'fan':              { label: 'Ventilador',              watts: 75,   wattsSurge: 225,  hoursPerDay: 8,   icon: 'fan',        category: 'Clima' },
    'microwave':        { label: 'Microondas',              watts: 1100, wattsSurge: 1100, hoursPerDay: 0.5, icon: 'microwave',  category: 'Cocina' }
  };

  var PROVINCES = {
    'habana':    { label: 'La Habana',  hsp: 5.1, avgTempC: 25.4 },
    'mayabeque': { label: 'Mayabeque',   hsp: 5.3, avgTempC: 25.8 },
    'artemisa':  { label: 'Artemisa',    hsp: 5.4, avgTempC: 26.1 }
  };
  var CONSUMPTION_TIERS = {
    'low':    { label: 'Bajo',    desc: '~100 kWh/mes', kwhPerMonth: 100 },
    'medium': { label: 'Medio',   desc: '~250 kWh/mes', kwhPerMonth: 250 },
    'high':   { label: 'Alto',     desc: '~500+ kWh/mes', kwhPerMonth: 500 }
  };
  var BUDGETS = {
    '1000-1500': { label: '$1,000 – $1,500', desc: 'Sistema básico' },
    '1500-3000': { label: '$1,500 – $3,000', desc: 'Sistema estándar' },
    '3000-5000': { label: '$3,000 – $5,000', desc: 'Sistema completo con buena autonomía' },
    '5000-plus': { label: 'Más de $5,000',   desc: 'Sistema premium / off-grid total' }
  };
  var HOUSING_TYPES = {
    'house':          { label: 'Casa',       desc: 'Vivienda unifamiliar',      diversity: 0.65 },
    'apartment':      { label: 'Apartamento', desc: 'Edificio multifamiliar',   diversity: 0.75 },
    'small-business': { label: 'Negocio',    desc: 'Local pequeño / oficina',   diversity: 0.85 }
  };

  /* === Estado === */
  var state = {
    step: 0, open: false,
    housingType: 'house', consumptionTier: 'medium', customConsumption: 250,
    appliances: {}, autonomyHours: 12, budget: '1500-3000', province: 'habana',
    result: null
  };

  function isApplianceSelected(id) { return state.appliances[id] && state.appliances[id] > 0; }
  function toggleAppliance(id) {
    if (isApplianceSelected(id)) delete state.appliances[id];
    else state.appliances[id] = 1;
  }
  function setApplianceQty(id, qty) {
    qty = Math.max(1, Math.min(20, parseInt(qty) || 1));
    if (isApplianceSelected(id)) state.appliances[id] = qty;
  }
  function getTotalConsumptionWhPerDay() {
    var total = 0;
    Object.keys(state.appliances).forEach(function(id) {
      var app = APPLIANCES[id], qty = state.appliances[id];
      if (app && qty > 0) total += app.watts * app.hoursPerDay * qty;
    });
    return total;
  }
  function getTotalSurgeWatts() {
    var maxSurge = 0, totalWatts = 0;
    Object.keys(state.appliances).forEach(function(id) {
      var app = APPLIANCES[id], qty = state.appliances[id];
      if (app && qty > 0) {
        totalWatts += app.watts * qty;
        maxSurge = Math.max(maxSurge, (app.wattsSurge - app.watts) * qty);
      }
    });
    return totalWatts + 0.5 * maxSurge;
  }

  function calculateResult() {
    var province = PROVINCES[state.province];
    var consumptionKwhMonth = state.consumptionTier === 'custom' ? (state.customConsumption || 250) : CONSUMPTION_TIERS[state.consumptionTier].kwhPerMonth;
    var consumptionKwhDay = consumptionKwhMonth / 30;
    var dailyWh = getTotalConsumptionWhPerDay();
    var surgeWatts = getTotalSurgeWatts();
    var tempFactor = 0.96 * 0.97 * 0.98 * 0.98 * 0.98 * 0.995 * 0.985 * 0.99 * 0.985 * 0.97;
    var tempAdjust = 1 + (-0.0036 * (province.avgTempC + 25 - 25));
    var systemEfficiency = tempFactor * tempAdjust;
    var panelCount = Math.max(2, Math.ceil(1000 * (consumptionKwhDay / (province.hsp * systemEfficiency)) / 550));
    var panelKW = 550 * panelCount / 1000;
    var inverterKW = Math.max(1.1 * panelKW, surgeWatts / 1000 * 1.25, 3);
    var systemVoltage = inverterKW >= 3 ? 48 : 24;
    var batteryAh = Object.keys(state.appliances).length > 0
      ? dailyWh * (state.autonomyHours / 24) / 1000 / 0.8 / systemVoltage * 1000
      : consumptionKwhDay * (state.autonomyHours / 24) * 1000 / 0.8 / systemVoltage;
    var batteryCount = Math.max(1, Math.ceil(batteryAh / 100));
    var batteryCapacity = 100 * batteryCount * systemVoltage / 1000;
    var inverterCost = inverterKW >= 10 ? 2400 : inverterKW >= 8 ? 2000 : inverterKW >= 5 ? 1200 : 800;
    var batteryCost = 675 * batteryCount;
    var panelCost = 100 * panelCount;
    var installCost = inverterCost + batteryCost + panelCost + 200;

    var recommendations = [];
    var inverterKWrounded = Math.round(inverterKW * 10) / 10;
    if (systemVoltage === 48) recommendations.push('Sistema 48V: óptimo para ' + inverterKWrounded + 'kW. Mejor eficiencia y permite escalado futuro.');
    else recommendations.push('Sistema 24V suficiente para tu carga actual (' + inverterKWrounded + 'kW). Considerar 48V si planeas AC.');
    var angle = state.province === 'habana' ? '20°' : state.province === 'mayabeque' ? '21°' : '22°';
    recommendations.push('Inclinación óptima: ' + angle + ' orientación sur (latitud ' + province.label + ').');
    if (panelCount <= 6) recommendations.push(panelCount + ' paneles en 1 hilera (~' + Math.ceil(2.3 * panelCount) + 'm lineales). Apto para azotea ≥ 12m².');
    else if (panelCount <= 12) recommendations.push(panelCount + ' paneles en 2 hileras (~' + Math.ceil(2.3 * panelCount / 2) + 'm × 4m). Verificar techo.');
    else recommendations.push(panelCount + ' paneles requieren estructura reforzada.');
    if (batteryCount <= 2) recommendations.push('Banco de baterías compacto: ' + batteryCount + ' módulos (~' + (35 * batteryCount) + 'kg).');
    else if (batteryCount <= 4) recommendations.push('Banco en rack vertical de ' + batteryCount + ' módulos (~' + (35 * batteryCount) + 'kg).');
    else recommendations.push('Banco en rack industrial de ' + batteryCount + ' módulos. Requiere cuarto técnico ventilado.');

    var selectedEquipos = [];
    Object.keys(state.appliances).forEach(function(id) {
      var app = APPLIANCES[id], qty = state.appliances[id];
      if (app && qty > 0) selectedEquipos.push({ label: app.label, qty: qty, watts: app.watts, hoursPerDay: app.hoursPerDay, dailyWh: app.watts * app.hoursPerDay * qty });
    });

    return {
      panelCount: panelCount, panelKW: panelKW, inverterKW: inverterKW, systemVoltage: systemVoltage,
      batteryCount: batteryCount, batteryCapacity: batteryCapacity, dailyWh: dailyWh, surgeWatts: surgeWatts,
      autonomyHours: state.autonomyHours, estimatedCost: installCost, recommendations: recommendations,
      selectedEquipos: selectedEquipos, consumptionKwhMonth: consumptionKwhMonth,
      province: province.label, hsp: province.hsp
    };
  }

  window.__srCalcData = {
    state: state, APPLIANCES: APPLIANCES, PROVINCES: PROVINCES, CONSUMPTION_TIERS: CONSUMPTION_TIERS,
    BUDGETS: BUDGETS, HOUSING_TYPES: HOUSING_TYPES, ICONS: ICONS,
    isApplianceSelected: isApplianceSelected, toggleAppliance: toggleAppliance,
    setApplianceQty: setApplianceQty, getTotalConsumptionWhPerDay: getTotalConsumptionWhPerDay,
    calculateResult: calculateResult
  };
  console.log('[SR v3] Datos listos');
})();
