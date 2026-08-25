/* ════════════════════════════════════════════════════════════
   SUN-RUNERS Calculadora v3 — UI Awwward-quality
   - Glass morphism premium
   - SVG icons tipo Lucide (sin emojis)
   - Body scroll bloqueado cuando modal abierto
   - Texto rotatorio en botón flotante restaurado
   ════════════════════════════════════════════════════════════ */
(function() {
  'use strict';
  var D = window.__srCalcData;
  if (!D) { console.error('[SR v3] Datos no disponibles'); return; }
  var state = D.state;
  var ICONS = D.ICONS;

  /* === Texto rotatorio del botón flotante === */
  var ROTATING_TEXTS = [
    "Dimensiona tu sistema solar",
    "¿No sabes qué escoger? Te ayudamos",
    "Calcula tu sistema en 2 minutos",
    "Cotiza tu instalación solar",
    "¿Cuántos paneles necesitas? Descúbrelo",
    "Diseña tu sistema a tu medida"
  ];
  var rotatingIndex = 0;
  var rotatingEl = null;

  function startRotatingText() {
    var btn = document.querySelector('button[aria-label="Dimensiona tu sistema solar"]');
    if (!btn) {
      setTimeout(startRotatingText, 1000);
      return;
    }
    // Buscar o crear span para el texto rotatorio
    var existingSpan = btn.querySelector('.sr-rotating-text');
    if (!existingSpan) {
      // El botón original tiene un icono y texto. Encontrar el span del texto.
      var spans = btn.querySelectorAll('span');
      for (var i = 0; i < spans.length; i++) {
        if (spans[i].textContent === 'Dimensiona tu sistema solar' || spans[i].textContent.trim().length > 10) {
          existingSpan = spans[i];
          existingSpan.classList.add('sr-rotating-text');
          break;
        }
      }
      if (!existingSpan) {
        // Crear un span si no existe
        existingSpan = document.createElement('span');
        existingSpan.className = 'sr-rotating-text';
        btn.appendChild(existingSpan);
      }
    }
    rotatingEl = existingSpan;
    rotatingEl.textContent = ROTATING_TEXTS[0];
    rotatingEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    rotatingEl.style.display = 'inline-block';

    setInterval(function() {
      rotatingEl.style.opacity = '0';
      rotatingEl.style.transform = 'translateY(-4px)';
      setTimeout(function() {
        rotatingIndex = (rotatingIndex + 1) % ROTATING_TEXTS.length;
        rotatingEl.textContent = ROTATING_TEXTS[rotatingIndex];
        rotatingEl.style.transform = 'translateY(4px)';
        setTimeout(function() {
          rotatingEl.style.opacity = '1';
          rotatingEl.style.transform = 'translateY(0)';
        }, 50);
      }, 400);
    }, 3500);
  }

  /* === Body scroll lock (robusto) === */
  var savedBodyOverflow = '';
  var savedBodyPaddingRight = '';
  function lockBodyScroll() {
    if (document.body.style.overflow === 'hidden') return;
    savedBodyOverflow = document.body.style.overflow;
    savedBodyPaddingRight = document.body.style.paddingRight;
    var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = scrollbarWidth + 'px';
  }
  function unlockBodyScroll() {
    document.body.style.overflow = savedBodyOverflow || '';
    document.body.style.paddingRight = savedBodyPaddingRight || '';
  }

  /* === Render del modal === */
  function getStepTitle(step) {
    var titles = ['Ubicación', 'Vivienda', 'Consumo', 'Equipos', 'Autonomía', 'Presupuesto', 'Resultado'];
    return titles[step] || '';
  }

  function esc(str) {
    return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  function render() {
    var modal = document.getElementById('sr-calc-modal');
    if (!modal || !state.open) return;

    var isMobile = window.innerWidth <= 768;
    var width = isMobile ? '94%' : '580px';
    var maxHeight = isMobile ? '92vh' : '86vh';
    var stepTitle = getStepTitle(state.step);
    var c = '';

    // Header con glass morphism
    c += '<div class="sr-modal-header">';
    c += '<div class="sr-modal-header-content">';
    c += '<div class="sr-modal-icon">';
    c += '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
    c += '</div>';
    c += '<div class="sr-modal-titles">';
    c += '<h2>Dimensiona tu sistema solar</h2>';
    c += '<p>Paso ' + (state.step + 1) + ' de 7 — ' + stepTitle + '</p>';
    c += '</div></div>';
    c += '<button onclick="window.__srCalc.close()" class="sr-modal-close" aria-label="Cerrar">';
    c += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    c += '</button>';
    c += '</div>';

    // Progress bar
    c += '<div class="sr-modal-progress"><div class="sr-modal-progress-bar" style="width:' + ((state.step + 1) / 7 * 100) + '%"></div></div>';

    // Body
    c += '<div class="sr-modal-body">';

    if (state.step === 0) {
      c += '<h3 class="sr-step-title">¿Dónde vas a instalar el sistema?</h3>';
      c += '<p class="sr-step-desc">La ubicación define las horas de sol pico (HSP) y la inclinación óptima de los paneles.</p>';
      c += '<div class="sr-option-grid">';
      Object.keys(D.PROVINCES).forEach(function(key) {
        var p = D.PROVINCES[key];
        var sel = state.province === key;
        c += '<button onclick="window.__srCalc.set(\'province\',\'' + key + '\')" class="sr-option-card' + (sel ? ' selected' : '') + '">';
        c += '<div class="sr-option-main"><div class="sr-option-label">' + p.label + '</div>';
        c += '<div class="sr-option-meta">HSP: ' + p.hsp + ' · Temp: ' + p.avgTempC + '°C</div></div>';
        c += '<div class="sr-option-check">' + (sel ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '') + '</div>';
        c += '</button>';
      });
      c += '</div>';
    }

    if (state.step === 1) {
      c += '<h3 class="sr-step-title">¿Qué tipo de vivienda es?</h3>';
      c += '<p class="sr-step-desc">El factor de diversidad ajusta el cálculo según el tipo de propiedad.</p>';
      c += '<div class="sr-card-grid-3">';
      var housingIcons = {
        house: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        apartment: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M13 21V9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12M3 21h18M7 7h0M11 11h0M17 11h0"/></svg>',
        'small-business': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4M3 9v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9M3 9h18M9 21V13h4v8"/></svg>'
      };
      Object.keys(D.HOUSING_TYPES).forEach(function(key) {
        var h = D.HOUSING_TYPES[key];
        var sel = state.housingType === key;
        c += '<button onclick="window.__srCalc.set(\'housingType\',\'' + key + '\')" class="sr-card-3' + (sel ? ' selected' : '') + '">';
        c += '<div class="sr-card-3-icon">' + housingIcons[key] + '</div>';
        c += '<div class="sr-card-3-label">' + h.label + '</div>';
        c += '<div class="sr-card-3-desc">' + h.desc + '</div>';
        c += '</button>';
      });
      c += '</div>';
    }

    if (state.step === 2) {
      c += '<h3 class="sr-step-title">¿Cuál es tu consumo mensual?</h3>';
      c += '<p class="sr-step-desc">Esto ayuda a dimensionar la cantidad de paneles necesarios.</p>';
      c += '<div class="sr-option-grid">';
      Object.keys(D.CONSUMPTION_TIERS).forEach(function(key) {
        var t = D.CONSUMPTION_TIERS[key];
        var sel = state.consumptionTier === key;
        c += '<button onclick="window.__srCalc.set(\'consumptionTier\',\'' + key + '\')" class="sr-option-card' + (sel ? ' selected' : '') + '">';
        c += '<div class="sr-option-main"><div class="sr-option-label">' + t.label + '</div>';
        c += '<div class="sr-option-meta">' + t.desc + '</div></div>';
        c += '<div class="sr-option-check">' + (sel ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '') + '</div>';
        c += '</button>';
      });
      var selCustom = state.consumptionTier === 'custom';
      c += '<button onclick="window.__srCalc.set(\'consumptionTier\',\'custom\')" class="sr-option-card' + (selCustom ? ' selected' : '') + '" style="flex-direction:column;align-items:stretch;">';
      c += '<div class="sr-option-main"><div class="sr-option-label">Personalizado</div></div>';
      if (selCustom) {
        c += '<div class="sr-custom-input"><input type="number" value="' + state.customConsumption + '" min="50" max="2000" onchange="window.__srCalc.set(\'customConsumption\',this.value)" placeholder="kWh/mes"/><span>kWh/mes</span></div>';
      }
      c += '</button>';
      c += '</div>';
    }

    if (state.step === 3) {
      c += '<h3 class="sr-step-title">¿Qué equipos quieres respaldados?</h3>';
      c += '<p class="sr-step-desc">Selecciona los equipos críticos y ajusta la cantidad de cada uno. Esto dimensiona el banco de baterías.</p>';
      c += '<div class="sr-appliance-grid">';
      Object.keys(D.APPLIANCES).forEach(function(id) {
        var app = D.APPLIANCES[id];
        var sel = D.isApplianceSelected(id);
        var qty = state.appliances[id] || 1;
        c += '<div class="sr-appliance-card' + (sel ? ' selected' : '') + '">';
        c += '<button onclick="window.__srCalc.toggle(\'' + id + '\')" class="sr-appliance-toggle">';
        c += '<div class="sr-appliance-icon' + (sel ? ' active' : '') + '">' + ICONS[app.icon] + '</div>';
        c += '<div class="sr-appliance-info"><div class="sr-appliance-name">' + app.label + '</div>';
        c += '<div class="sr-appliance-meta">' + app.watts + 'W · ' + app.hoursPerDay + 'h/día</div></div>';
        c += '<div class="sr-appliance-check' + (sel ? ' active' : '') + '"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>';
        c += '</button>';
        if (sel) {
          c += '<div class="sr-qty-row">';
          c += '<span class="sr-qty-label">Cantidad</span>';
          c += '<div class="sr-qty-controls">';
          c += '<button onclick="event.stopPropagation();window.__srCalc.qty(\'' + id + '\',' + (qty - 1) + ')" class="sr-qty-btn"' + (qty <= 1 ? ' disabled' : '') + '><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg></button>';
          c += '<input type="number" value="' + qty + '" min="1" max="20" onchange="window.__srCalc.qty(\'' + id + '\',this.value)" class="sr-qty-input' + (qty <= 1 ? ' first' : '') + '" />';
          c += '<button onclick="event.stopPropagation();window.__srCalc.qty(\'' + id + '\',' + (qty + 1) + ')" class="sr-qty-btn"' + (qty >= 20 ? ' disabled' : '') + '><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>';
          c += '</div></div>';
        }
        c += '</div>';
      });
      c += '</div>';
      var totalWh = D.getTotalConsumptionWhPerDay();
      if (totalWh > 0) {
        c += '<div class="sr-total-summary"><span>Total seleccionado</span><strong>' + totalWh.toLocaleString('en-US') + ' Wh/día</strong></div>';
      }
    }

    if (state.step === 4) {
      c += '<h3 class="sr-step-title">¿Cuántas horas sin sol quieres aguantar?</h3>';
      c += '<p class="sr-step-desc">Esto define cuánto durará la batería alimentando tus equipos en caso de apagón o durante la noche.</p>';
      c += '<div class="sr-option-grid">';
      var hoursLabels = { 6: 'Noche mínima', 12: 'Noche típica', 24: '1 día completo', 48: '2 días / off-grid' };
      [6, 12, 24, 48].forEach(function(h) {
        var sel = state.autonomyHours === h;
        c += '<button onclick="window.__srCalc.set(\'autonomyHours\',' + h + ')" class="sr-option-card' + (sel ? ' selected' : '') + '">';
        c += '<div class="sr-option-main"><div class="sr-option-label">' + hoursLabels[h] + '</div>';
        c += '<div class="sr-option-meta">' + h + ' horas de autonomía</div></div>';
        c += '<div class="sr-option-check">' + (sel ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '') + '</div>';
        c += '</button>';
      });
      c += '</div>';
    }

    if (state.step === 5) {
      c += '<h3 class="sr-step-title">¿Cuál es tu presupuesto?</h3>';
      c += '<p class="sr-step-desc">Esto ajusta las marcas y el alcance del sistema recomendado.</p>';
      c += '<div class="sr-option-grid">';
      Object.keys(D.BUDGETS).forEach(function(key) {
        var b = D.BUDGETS[key];
        var sel = state.budget === key;
        c += '<button onclick="window.__srCalc.set(\'budget\',\'' + key + '\')" class="sr-option-card' + (sel ? ' selected' : '') + '">';
        c += '<div class="sr-option-main"><div class="sr-option-label">' + b.label + '</div>';
        c += '<div class="sr-option-meta">' + b.desc + '</div></div>';
        c += '<div class="sr-option-check">' + (sel ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '') + '</div>';
        c += '</button>';
      });
      c += '</div>';
    }

    if (state.step === 6) {
      var r = state.result || (state.result = D.calculateResult());
      c += '<h3 class="sr-step-title">Tu sistema dimensionado</h3>';
      c += '<p class="sr-step-desc">Basado en tus selecciones, esta es la configuración recomendada.</p>';
      c += '<div class="sr-result-grid">';
      c += '<div class="sr-result-card"><div class="sr-result-label">Paneles solares</div><div class="sr-result-value">' + r.panelCount + '</div><div class="sr-result-meta">550W c/u · ' + r.panelKW.toFixed(1) + ' kW total</div></div>';
      c += '<div class="sr-result-card"><div class="sr-result-label">Inversor</div><div class="sr-result-value">' + (Math.round(r.inverterKW * 10) / 10) + 'kW</div><div class="sr-result-meta">Sistema ' + r.systemVoltage + 'V</div></div>';
      c += '<div class="sr-result-card"><div class="sr-result-label">Baterías LiFePO4</div><div class="sr-result-value">' + r.batteryCount + '</div><div class="sr-result-meta">100Ah · ' + r.batteryCapacity.toFixed(1) + ' kWh</div></div>';
      c += '<div class="sr-result-card"><div class="sr-result-label">Consumo diario</div><div class="sr-result-value">' + r.dailyWh.toLocaleString() + '</div><div class="sr-result-meta">Wh/día · Autonomía ' + r.autonomyHours + 'h</div></div>';
      c += '</div>';
      c += '<div class="sr-cost-card"><span>Inversión estimada</span><strong>$' + r.estimatedCost.toLocaleString() + '</strong></div>';
      c += '<div class="sr-rec-section"><div class="sr-rec-label">Recomendaciones técnicas</div>';
      r.recommendations.forEach(function(rec) {
        c += '<div class="sr-rec-item"><span class="sr-rec-dot"></span><span>' + rec + '</span></div>';
      });
      c += '</div>';
      if (r.selectedEquipos.length > 0) {
        c += '<div class="sr-rec-section"><div class="sr-rec-label">Equipos seleccionados (' + r.selectedEquipos.length + ')</div>';
        r.selectedEquipos.forEach(function(eq) {
          c += '<div class="sr-eq-row"><span>' + eq.qty + 'x ' + eq.label + '</span><span class="sr-eq-wh">' + eq.dailyWh + ' Wh/día</span></div>';
        });
        c += '</div>';
      }
      c += '<button onclick="window.__srCalc.sendToContact()" class="sr-send-btn">Enviar solicitud con esta configuración</button>';
    }

    c += '</div>';

    if (state.step < 6) {
      c += '<div class="sr-modal-footer">';
      if (state.step > 0) {
        c += '<button onclick="window.__srCalc.prev()" class="sr-btn-back">';
        c += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>';
        c += ' Atrás</button>';
      } else { c += '<div></div>'; }
      c += '<button onclick="window.__srCalc.next()" class="sr-btn-next">' + (state.step === 5 ? 'Calcular' : 'Continuar') + ' →</button>';
      c += '</div>';
    } else {
      c += '<div class="sr-modal-footer sr-center"><button onclick="window.__srCalc.close()" class="sr-btn-back">Cerrar</button></div>';
    }

    modal.innerHTML = '<div class="sr-modal-inner" style="width:' + width + ';max-height:' + maxHeight + ';">' + c + '</div>';
    modal.style.display = 'flex';
  }

  /* === API pública === */
  var api = {
    open: function() {
      state.open = true; state.step = 0; state.result = null; state.appliances = {};
      ensureModalExists();
      lockBodyScroll();
      render();
    },
    close: function() {
      state.open = false;
      unlockBodyScroll();
      var modal = document.getElementById('sr-calc-modal');
      if (modal) modal.style.display = 'none';
    },
    next: function() {
      if (state.step < 6) {
        state.step++;
        if (state.step === 6) state.result = D.calculateResult();
        render();
      }
    },
    prev: function() {
      if (state.step > 0) { state.step--; state.result = null; render(); }
    },
    set: function(key, value) {
      state[key] = value;
      state.result = null;
      render();
    },
    toggle: function(id) {
      D.toggleAppliance(id);
      state.result = null;
      render();
    },
    qty: function(id, qty) {
      D.setApplianceQty(id, qty);
      state.result = null;
      render();
    },
    sendToContact: function() {
      var r = state.result;
      var msg = 'SOLICITUD DE COTIZACIÓN — Sistema fotovoltaico\n\nCONFIGURACIÓN DIMENSIONADA:\n';
      msg += '• ' + r.panelCount + ' paneles solares (550W c/u) — ' + r.panelKW.toFixed(1) + ' kW total\n';
      msg += '• Inversor ' + (Math.round(r.inverterKW * 10) / 10) + ' kW (sistema ' + r.systemVoltage + 'V)\n';
      msg += '• ' + r.batteryCount + ' baterías LiFePO4 (100Ah) — ' + r.batteryCapacity.toFixed(1) + ' kWh\n';
      msg += '• Autonomía: ' + r.autonomyHours + ' horas\n';
      msg += '• Consumo diario estimado: ' + r.dailyWh.toLocaleString() + ' Wh/día\n';
      msg += '• Inversión estimada: $' + r.estimatedCost.toLocaleString() + '\n\n';
      msg += 'EQUIPOS A RESPALDAR:\n';
      r.selectedEquipos.forEach(function(eq) {
        msg += '• ' + eq.qty + 'x ' + eq.label + ' (' + eq.watts + 'W, ' + eq.hoursPerDay + 'h/día) = ' + eq.dailyWh + ' Wh/día\n';
      });
      msg += '\nDATOS DEL CÁLCULO:\n• Ubicación: ' + r.province + ' (HSP ' + r.hsp + ')\n• Consumo mensual: ' + r.consumptionKwhMonth + ' kWh\n\n';
      msg += 'RECOMENDACIONES TÉCNICAS:\n';
      r.recommendations.forEach(function(rec) { msg += '• ' + rec + '\n'; });
      api.close();

      // Función para setear valor en input/textarea de React (native setter approach)
      function setReactValue(element, value) {
        if (!element) return;
        var proto = element.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        var nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value');
        if (nativeSetter && nativeSetter.set) {
          nativeSetter.set.call(element, value);
        } else {
          element.value = value;
        }
        // Disparar eventos que React escucha
        element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        // También dispatch como Event normal para compatibilidad con react-hook-form
        try {
          var ev = new Event('input', { bubbles: true });
          Object.defineProperty(ev, 'target', { value: element });
          Object.defineProperty(ev, 'currentTarget', { value: element });
        } catch(e) {}
      }

      // Esperar a que el modal se cierre y el form esté visible
      setTimeout(function() {
        // 1. Setear el mensaje (textarea)
        var msgField = document.querySelector('#contacto textarea[name="message"]');
        if (msgField) {
          setReactValue(msgField, msg);
          console.log('[SR] Mensaje precargado en textarea');
        }

        // 2. Setear el servicio a "fotovoltaico" via Radix Select
        var serviceTrigger = document.querySelector('#contacto button[role="combobox"]');
        if (serviceTrigger) {
          serviceTrigger.click();
          setTimeout(function() {
            var options = document.querySelectorAll('[role="option"]');
            options.forEach(function(opt) {
              var text = opt.textContent.toLowerCase();
              if (text.includes('fotovoltaico') || text.includes('fotovolta')) {
                opt.click();
                console.log('[SR] Servicio fotovoltaico seleccionado');
              }
            });
            // Si no se encontró opción, cerrar el dropdown
            if (!document.querySelector('[role="option"][data-selected]')) {
              document.body.click();
            }
          }, 300);
        }

        // 3. Hacer scroll al formulario
        var contactSection = document.querySelector('#contacto');
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // 4. Mostrar toast
        var toast = document.createElement('div');
        toast.className = 'sr-toast';
        toast.textContent = '✓ Configuración cargada en el formulario';
        document.body.appendChild(toast);
        setTimeout(function() { toast.remove(); }, 3000);
      }, 400);
    }
  };
  window.__srCalc = api;

  /* === Crear modal garantizado (siempre que se llame) === */
  function ensureModalExists() {
    if (!document.getElementById('sr-calc-modal')) {
      var modal = document.createElement('div');
      modal.id = 'sr-calc-modal';
      document.body.appendChild(modal);
      modal.addEventListener('click', function(e) { if (e.target === modal) api.close(); });
    }
    return document.getElementById('sr-calc-modal');
  }

  /* === Inicialización === */
  function init() {
    // Inyectar estilos del modal
    if (!document.getElementById('sr-calc-styles')) {
      var style = document.createElement('style');
      style.id = 'sr-calc-styles';
      style.textContent = `
#sr-calc-modal{position:fixed;inset:0;z-index:200;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.75);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);padding:10px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}
.sr-modal-inner{background:rgba(15,16,12,0.96);backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);border:1px solid rgba(255,255,255,0.08);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 30px 80px -10px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.04);}
.sr-modal-header{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid rgba(255,255,255,0.06);background:linear-gradient(135deg,rgba(245,158,11,0.08) 0%,transparent 50%);}
.sr-modal-header-content{display:flex;align-items:center;gap:14px;}
.sr-modal-icon{width:38px;height:38px;border-radius:10px;background:rgba(245,158,11,0.12);display:flex;align-items:center;justify-content:center;color:#fbbf24;border:1px solid rgba(245,158,11,0.2);}
.sr-modal-titles h2{margin:0;font-size:15px;font-weight:600;color:#fff;letter-spacing:-0.01em;}
.sr-modal-titles p{margin:3px 0 0;font-size:11px;color:rgba(255,255,255,0.5);font-weight:500;}
.sr-modal-close{width:32px;height:32px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;}
.sr-modal-close:hover{background:rgba(255,255,255,0.1);color:#fff;}
.sr-modal-progress{height:2px;background:rgba(255,255,255,0.05);overflow:hidden;}
.sr-modal-progress-bar{height:100%;background:linear-gradient(90deg,#f59e0b,#fbbf24);transition:width 0.4s cubic-bezier(0.16,1,0.3,1);box-shadow:0 0 12px rgba(245,158,11,0.5);}
.sr-modal-body{padding:24px 22px;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;flex:1;touch-action:pan-y;}
.sr-modal-body::-webkit-scrollbar{width:0px;background:transparent;}
.sr-step-title{margin:0 0 8px;font-size:19px;font-weight:600;color:#fff;letter-spacing:-0.02em;line-height:1.3;}
.sr-step-desc{margin:0 0 20px;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.5;}
.sr-option-grid{display:flex;flex-direction:column;gap:8px;}
.sr-option-card{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-radius:11px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);color:#fff;cursor:pointer;text-align:left;transition:all 0.2s cubic-bezier(0.16,1,0.3,1);}
.sr-option-card:hover{border-color:rgba(255,255,255,0.15);background:rgba(255,255,255,0.04);}
.sr-option-card.selected{border-color:#f59e0b;background:rgba(245,158,11,0.08);box-shadow:0 0 0 1px rgba(245,158,11,0.2),0 8px 24px -8px rgba(245,158,11,0.3);}
.sr-option-main{flex:1;}
.sr-option-label{font-size:14px;font-weight:600;color:#fff;letter-spacing:-0.01em;}
.sr-option-meta{font-size:11px;color:rgba(255,255,255,0.5);margin-top:3px;}
.sr-option-check{width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;color:#000;transition:all 0.2s;flex-shrink:0;}
.sr-option-card.selected .sr-option-check{background:#f59e0b;border-color:#f59e0b;}
.sr-card-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
.sr-card-3{padding:20px 12px;border-radius:11px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);color:#fff;cursor:pointer;text-align:center;transition:all 0.2s;}
.sr-card-3:hover{border-color:rgba(255,255,255,0.15);background:rgba(255,255,255,0.04);}
.sr-card-3.selected{border-color:#f59e0b;background:rgba(245,158,11,0.08);}
.sr-card-3-icon{color:rgba(255,255,255,0.6);margin-bottom:10px;display:flex;justify-content:center;transition:color 0.2s;}
.sr-card-3.selected .sr-card-3-icon{color:#fbbf24;}
.sr-card-3-label{font-size:13px;font-weight:600;margin-bottom:4px;}
.sr-card-3-desc{font-size:10px;color:rgba(255,255,255,0.5);line-height:1.4;}
.sr-custom-input{display:flex;align-items:center;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);}
.sr-custom-input input{flex:1;padding:8px 12px;background:rgba(0,0,0,0.3);border:1px solid rgba(245,158,11,0.3);border-radius:7px;color:#fbbf24;font-size:14px;font-weight:600;font-family:ui-monospace,monospace;}
.sr-custom-input input:focus{outline:none;border-color:#f59e0b;box-shadow:0 0 0 3px rgba(245,158,11,0.15);}
.sr-custom-input span{font-size:11px;color:rgba(255,255,255,0.5);white-space:nowrap;}
.sr-appliance-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.sr-appliance-card{padding:14px;border-radius:11px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);transition:all 0.2s;}
.sr-appliance-card.selected{border-color:#f59e0b;background:rgba(245,158,11,0.06);}
.sr-appliance-toggle{width:100%;background:none;border:none;color:#fff;cursor:pointer;text-align:left;padding:0;display:flex;align-items:flex-start;gap:12px;}
.sr-appliance-icon{width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.5);flex-shrink:0;transition:all 0.2s;}
.sr-appliance-icon.active{background:rgba(245,158,11,0.15);border-color:rgba(245,158,11,0.3);color:#fbbf24;}
.sr-appliance-info{flex:1;min-width:0;}
.sr-appliance-name{font-size:13px;font-weight:600;color:#fff;letter-spacing:-0.01em;}
.sr-appliance-meta{font-size:10px;color:rgba(255,255,255,0.5);margin-top:3px;}
.sr-appliance-check{width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;color:#000;flex-shrink:0;transition:all 0.2s;}
.sr-appliance-check.active{background:#f59e0b;border-color:#f59e0b;}
.sr-qty-row{display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:1px solid rgba(245,158,11,0.15);}
.sr-qty-label{font-size:10px;color:#fbbf24;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;}
.sr-qty-controls{display:flex;align-items:center;gap:6px;}
.sr-qty-btn{width:28px;height:28px;border-radius:7px;border:none;background:rgba(245,158,11,0.15);color:#fbbf24;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;}
.sr-qty-btn:hover:not(:disabled){background:rgba(245,158,11,0.25);}
.sr-qty-btn:active:not(:disabled){transform:scale(0.92);}
.sr-qty-btn:disabled{opacity:0.3;cursor:not-allowed;}
.sr-qty-input{width:42px;height:28px;text-align:center;background:rgba(0,0,0,0.4);border:1px solid rgba(245,158,11,0.25);border-radius:6px;color:#fbbf24;font-size:13px;font-weight:700;font-family:ui-monospace,monospace;-moz-appearance:textfield;}
.sr-qty-input::-webkit-outer-spin-button,.sr-qty-input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
.sr-qty-input:focus{outline:none;border-color:#f59e0b;box-shadow:0 0 0 2px rgba(245,158,11,0.2);}
.sr-total-summary{margin-top:16px;padding:13px 16px;background:linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.04));border:1px solid rgba(245,158,11,0.2);border-radius:10px;display:flex;align-items:center;justify-content:space-between;}
.sr-total-summary span{font-size:12px;color:rgba(255,255,255,0.7);}
.sr-total-summary strong{font-size:15px;color:#fbbf24;font-weight:700;letter-spacing:-0.01em;}
.sr-result-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;}
.sr-result-card{padding:14px 16px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:11px;}
.sr-result-label{font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.08em;font-weight:600;}
.sr-result-value{font-size:26px;font-weight:700;color:#fbbf24;margin:6px 0 2px;letter-spacing:-0.02em;}
.sr-result-meta{font-size:10px;color:rgba(255,255,255,0.5);}
.sr-cost-card{padding:14px 16px;background:linear-gradient(135deg,rgba(245,158,11,0.18),rgba(245,158,11,0.06));border:1px solid rgba(245,158,11,0.3);border-radius:11px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;}
.sr-cost-card span{font-size:12px;color:rgba(255,255,255,0.75);}
.sr-cost-card strong{font-size:20px;color:#fbbf24;font-weight:700;letter-spacing:-0.02em;}
.sr-rec-section{margin-bottom:18px;}
.sr-rec-label{font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.08em;font-weight:600;margin-bottom:10px;}
.sr-rec-item{display:flex;gap:8px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px;color:rgba(255,255,255,0.75);line-height:1.5;}
.sr-rec-dot{width:5px;height:5px;border-radius:50%;background:#fbbf24;flex-shrink:0;margin-top:6px;}
.sr-eq-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px;color:rgba(255,255,255,0.8);}
.sr-eq-wh{color:rgba(255,255,255,0.5);}
.sr-send-btn{width:100%;padding:13px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#000;border:none;border-radius:11px;font-weight:700;font-size:14px;cursor:pointer;letter-spacing:-0.01em;transition:all 0.2s;box-shadow:0 8px 24px -8px rgba(245,158,11,0.5);}
.sr-send-btn:hover{transform:translateY(-1px);box-shadow:0 12px 28px -8px rgba(245,158,11,0.6);}
.sr-modal-footer{padding:14px 22px;border-top:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;align-items:center;gap:10px;background:rgba(0,0,0,0.2);}
.sr-modal-footer.sr-center{justify-content:center;}
.sr-btn-back{padding:10px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);border-radius:9px;cursor:pointer;font-size:13px;font-weight:500;display:flex;align-items:center;gap:6px;transition:all 0.2s;}
.sr-btn-back:hover{background:rgba(255,255,255,0.08);color:#fff;}
.sr-btn-next{padding:11px 22px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#000;border:none;border-radius:9px;cursor:pointer;font-weight:600;font-size:13px;letter-spacing:-0.01em;transition:all 0.2s;box-shadow:0 6px 20px -6px rgba(245,158,11,0.4);}
.sr-btn-next:hover{transform:translateY(-1px);box-shadow:0 10px 24px -6px rgba(245,158,11,0.5);}
.sr-toast{position:fixed;top:24px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#f59e0b,#d97706);color:#000;padding:12px 24px;border-radius:10px;font-weight:600;z-index:300;font-size:13px;box-shadow:0 12px 30px rgba(245,158,11,0.4);}
@media (max-width:640px){
  .sr-appliance-grid{grid-template-columns:1fr;}
  .sr-card-grid-3{grid-template-columns:1fr 1fr 1fr;gap:6px;}
  .sr-modal-body{padding:20px 18px;}
  .sr-modal-header{padding:16px 18px;}
  .sr-modal-footer{padding:12px 18px;}
  .sr-step-title{font-size:18px;}
}
      `;
      document.head.appendChild(style);
    }

    // Crear modal
    if (!document.getElementById('sr-calc-modal')) {
      var modal = document.createElement('div');
      modal.id = 'sr-calc-modal';
      document.body.appendChild(modal);
      modal.addEventListener('click', function(e) { if (e.target === modal) api.close(); });
      document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && state.open) api.close(); });
    }

    // Interceptar evento del wizard viejo
    window.addEventListener('open-sizing-calculator', function(e) {
      e.preventDefault(); e.stopPropagation(); api.open();
    }, true);

    // Event delegation robusto: interceptar TODOS los clicks en el botón flotante
    // sin necesidad de reemplazar el nodo (que rompe React/framer-motion)
    function isFloatingButton(target) {
      if (!target || !target.closest) return false;
      var btn = target.closest('button[aria-label="Dimensiona tu sistema solar"]');
      return !!btn;
    }

    // Capturar click en capture phase (antes de que framer-motion lo procese)
    document.addEventListener('click', function(e) {
      if (isFloatingButton(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        api.open();
        return false;
      }
    }, true);

    // También capturar pointerdown para prevenir animaciones de framer-motion
    document.addEventListener('pointerdown', function(e) {
      if (isFloatingButton(e.target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    // Y touchstart para móvil
    document.addEventListener('touchstart', function(e) {
      if (isFloatingButton(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        api.open();
      }
    }, { capture: true, passive: false });

    // Reemplazar handler del botón flotante (fallback si event delegation no alcanza)
    function replaceFloatingButton() {
      var btn = document.querySelector('button[aria-label="Dimensiona tu sistema solar"]');
      if (btn && !btn.dataset.srCalcReplaced) {
        btn.dataset.srCalcReplaced = '1';
        // NO clonar el botón (rompe framer-motion). Solo añadir click listener adicional.
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          api.open();
        }, { capture: true });
      }
    }
    var btnObserver = new MutationObserver(function() { replaceFloatingButton(); });
    btnObserver.observe(document.body, { childList: true, subtree: true });
    replaceFloatingButton();
    setInterval(replaceFloatingButton, 1000);

    // Iniciar texto rotatorio
    setTimeout(startRotatingText, 1500);

    console.log('[SR v3] Calculadora lista');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
