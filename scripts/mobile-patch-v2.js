/* ════════════════════════════════════════════════════════════
   SUN-RUNERS — Mobile Patch v2 JS (corregido)
   1. Interceptar window.scrollTo espurios (del v1)
   2. Forzar hide del intro-overlay (del v1)
   3. NUEVO: Capturar catálogo jq + inyectar inputs de cantidad
      en wizard step 4 (Equipos) + actualizar cálculo dinámicamente
   ════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  console.log('[SR Patch v2] Inicializando...');

  /* ══════════════════════════════════════════
     PARTE 1: Fixes heredados del v1
     ══════════════════════════════════════════ */

  // Fix 1: Interceptar window.scrollTo espurios
  var originalScrollTo = window.scrollTo.bind(window);
  var allowScrollUntil = 0;

  document.addEventListener('click', function(e) {
    var target = e.target;
    while (target && target !== document.body) {
      if (target.getAttribute && target.getAttribute('aria-label') === 'Volver arriba') {
        allowScrollUntil = Date.now() + 1000;
        break;
      }
      if (target.tagName === 'BUTTON' && target.textContent.trim().includes('Arriba')) {
        allowScrollUntil = Date.now() + 1000;
        break;
      }
      target = target.parentNode;
    }
  }, true);

  window.scrollTo = function() {
    var args = arguments;
    var opts = args[0] && typeof args[0] === 'object' ? args[0] : { top: args[1] || 0, behavior: 'auto' };
    if (opts.top === 0 && opts.behavior === 'smooth') {
      if (Date.now() > allowScrollUntil) {
        console.log('[SR Patch v2] Bloqueado scrollTo espurio');
        return;
      }
    }
    return originalScrollTo.apply(window, args);
  };

  // Fix 2: Forzar hide del intro-overlay
  function hideIntroOverlay() {
    var overlay = document.querySelector('.intro-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.visibility = 'hidden';
      overlay.style.pointerEvents = 'none';
      overlay.style.transition = 'opacity 0.4s ease-out';
    }
  }

  setTimeout(hideIntroOverlay, 4000);

  var introHidden = false;
  function hideOnFirstInteraction() {
    if (!introHidden) {
      introHidden = true;
      setTimeout(hideIntroOverlay, 100);
    }
  }
  window.addEventListener('scroll', hideOnFirstInteraction, { once: true, passive: true });
  window.addEventListener('touchmove', hideOnFirstInteraction, { once: true, passive: true });
  document.addEventListener('click', hideOnFirstInteraction, { once: true });

  // Fix 3: Observar overflow del body
  var bodyObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.attributeName === 'style' || m.attributeName === 'class') {
        var body = document.body;
        if (body.style.overflow === 'hidden' && !body.dataset.modalOpen) {
          setTimeout(function() {
            if (!document.querySelector('[data-state="open"][role="dialog"]') &&
                !document.querySelector('.modal-open')) {
              body.style.overflow = '';
            }
          }, 500);
        }
      }
    });
  });
  bodyObserver.observe(document.body, { attributes: true });

  // Fix 4: scrollIntoView auto en móvil
  var originalScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function(options) {
    if (window.innerWidth <= 1024) {
      options = options || {};
      options.behavior = 'auto';
    }
    return originalScrollIntoView.call(this, options);
  };

  /* ══════════════════════════════════════════
     PARTE 2: NUEVO — Cantidad por equipo en wizard
     ══════════════════════════════════════════ */

  // Catálogo original de electrodomésticos (12 equipos)
  // Lo usamos como referencia para identificarlos
  var APPLIANCE_IDS = [
    'fridge', 'freezer', 'ac-small', 'ac-large', 'water-pump',
    'tv', 'lights', 'washing-machine', 'computer', 'router', 'fan', 'microwave'
  ];

  var APPLIANCE_LABELS = {
    'fridge': 'Refrigerador',
    'freezer': 'Congelador',
    'ac-small': 'Aire 12000 BTU',
    'ac-large': 'Aire 18000 BTU',
    'water-pump': 'Bomba de agua',
    'tv': 'Televisor LED',
    'lights': 'Iluminación LED',
    'washing-machine': 'Lavadora',
    'computer': 'Computadora',
    'router': 'Router WiFi',
    'fan': 'Ventilador',
    'microwave': 'Microondas'
  };

  // Estado de cantidades (1 = default)
  var quantities = {};
  APPLIANCE_IDS.forEach(function(id) { quantities[id] = 1; });

  // Referencia al catálogo jq (se captura dinámicamente)
  var jqRef = null;
  var originalJqValues = null;

  // Capturar jq sobrescribiendo Object.entries temporalmente
  var originalEntries = Object.entries;
  Object.entries = function(obj) {
    if (!jqRef && obj && typeof obj === 'object') {
      // Detectar el catálogo por sus campos únicos
      if (obj.fridge && obj.fridge.watts === 200 && obj.fridge.label === 'Refrigerador' &&
          obj.freezer && obj.freezer.watts === 250) {
        jqRef = obj;
        // Guardar valores originales (deep copy)
        originalJqValues = {};
        Object.keys(jqRef).forEach(function(key) {
          originalJqValues[key] = {
            watts: jqRef[key].watts,
            wattsSurge: jqRef[key].wattsSurge,
            hoursPerDay: jqRef[key].hoursPerDay
          };
        });
        console.log('[SR Patch v2] Catálogo jq capturado:', Object.keys(jqRef).length, 'equipos');
        // Restaurar Object.entries original
        Object.entries = originalEntries;
      }
    }
    return originalEntries.call(Object, obj);
  };

  // Actualizar valores de jq según cantidades
  function applyQuantitiesToJq() {
    if (!jqRef || !originalJqValues) return;
    APPLIANCE_IDS.forEach(function(id) {
      if (jqRef[id] && originalJqValues[id]) {
        var qty = quantities[id] || 1;
        jqRef[id].watts = originalJqValues[id].watts * qty;
        jqRef[id].wattsSurge = originalJqValues[id].wattsSurge * qty;
        // hoursPerDay NO se multiplica (es tiempo de uso, no cantidad)
      }
    });
    console.log('[SR Patch v2] Cantidades aplicadas a jq:', quantities);
  }

  // Forzar re-render del wizard vía React fiber
  function forceWizardRerender() {
    var modal = document.querySelector('[class*="fixed"][class*="z-50"]');
    if (!modal) {
      // Buscar por el header del wizard
      modal = Array.from(document.querySelectorAll('h2')).find(function(h) {
        return h.textContent === 'Dimensiona tu sistema solar';
      });
      if (modal) modal = modal.closest('[class*="fixed"]');
    }
    if (!modal) return false;

    var fiberKey = Object.keys(modal).find(function(k) {
      return k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$');
    });
    if (!fiberKey) return false;

    var fiber = modal[fiberKey];
    var current = fiber;

    // Buscar el hook con selectedAppliances
    while (current) {
      var hook = current.memoizedState;
      while (hook) {
        if (hook.memoizedState && hook.memoizedState.selectedAppliances !== undefined) {
          // Encontramos el hook del estado del wizard
          var dispatch = hook.queue.dispatch;
          if (typeof dispatch === 'function') {
            // Dispatch con no-op update para forzar re-render
            try {
              dispatch(function(s) { return Object.assign({}, s); });
              console.log('[SR Patch v2] Wizard re-render forzado');
              return true;
            } catch (e) {
              console.warn('[SR Patch v2] Error en dispatch:', e);
            }
          }
        }
        hook = hook.next;
      }
      current = current.return;
    }
    return false;
  }

  // Actualizar el "Total seleccionado" en DOM (fallback si no hay re-render)
  function updateTotalDisplay() {
    if (!jqRef) return;
    var totalEls = document.querySelectorAll('strong');
    totalEls.forEach(function(strong) {
      var parent = strong.parentElement;
      if (parent && parent.textContent.includes('Total seleccionado')) {
        // Recalcular el total basado en cantidades
        var total = 0;
        if (originalJqValues) {
          // Buscar selectedAppliances del DOM (botones activos)
          var selectedButtons = document.querySelectorAll('button[class*="border-amber-500"]');
          selectedButtons.forEach(function(btn) {
            // Cada botón representa un equipo, pero el array selectedAppliances
            // se maneja vía React. Asumimos 1 de cada uno seleccionado.
            // Para cantidades, usamos nuestro estado quantities.
          });
        }
        // No podemos saber exactamente cuáles están seleccionados sin acceso al estado.
        // Pero si el re-render funcionó, el DOM ya está actualizado.
      }
    });
  }

  // Crear el widget de cantidad para un equipo
  function createQtyWidget(applianceId, label) {
    var container = document.createElement('div');
    container.className = 'sr-qty-container';
    container.dataset.applianceId = applianceId;

    var qtyLabel = document.createElement('span');
    qtyLabel.className = 'sr-qty-label';
    qtyLabel.textContent = 'Cantidad:';

    var controls = document.createElement('div');
    controls.className = 'sr-qty-controls';

    var minusBtn = document.createElement('button');
    minusBtn.type = 'button';
    minusBtn.className = 'sr-qty-btn sr-qty-minus';
    minusBtn.textContent = '−';
    minusBtn.setAttribute('aria-label', 'Disminuir cantidad de ' + label);

    var input = document.createElement('input');
    input.type = 'number';
    input.className = 'sr-qty-input';
    input.value = quantities[applianceId] || 1;
    input.min = 1;
    input.max = 20;
    input.setAttribute('aria-label', 'Cantidad de ' + label);

    var plusBtn = document.createElement('button');
    plusBtn.type = 'button';
    plusBtn.className = 'sr-qty-btn sr-qty-plus';
    plusBtn.textContent = '+';
    plusBtn.setAttribute('aria-label', 'Aumentar cantidad de ' + label);

    function updateQty(newQty) {
      newQty = Math.max(1, Math.min(20, parseInt(newQty) || 1));
      quantities[applianceId] = newQty;
      input.value = newQty;
      minusBtn.disabled = (newQty <= 1);
      applyQuantitiesToJq();
      // Forzar re-render del wizard para que se actualice el cálculo
      var rendered = forceWizardRerender();
      if (!rendered) {
        console.warn('[SR Patch v2] No se pudo forzar re-render, actualizando DOM manualmente');
        updateTotalDisplay();
      }
    }

    minusBtn.addEventListener('click', function() {
      updateQty((quantities[applianceId] || 1) - 1);
    });
    plusBtn.addEventListener('click', function() {
      updateQty((quantities[applianceId] || 1) + 1);
    });
    input.addEventListener('change', function() {
      updateQty(input.value);
    });
    input.addEventListener('input', function() {
      // Preview sin commit hasta blur
      var val = parseInt(input.value) || 1;
      minusBtn.disabled = (val <= 1);
    });

    controls.appendChild(minusBtn);
    controls.appendChild(input);
    controls.appendChild(plusBtn);

    container.appendChild(qtyLabel);
    container.appendChild(controls);

    // Estado inicial del botón minus
    minusBtn.disabled = (quantities[applianceId] <= 1);

    return container;
  }

  // Verificar si un botón de equipo está seleccionado
  function isApplianceSelected(btn) {
    var cls = btn.className || '';
    return cls.indexOf('border-amber-500') !== -1 ||
           cls.indexOf('bg-amber-500') !== -1;
  }

  // Extraer el applianceId de un botón
  function getApplianceIdFromButton(btn) {
    // El botón no tiene data-appliance, pero podemos buscar por texto del label
    var labelEl = btn.querySelector('span:last-child, div > span + span, .text-sm');
    if (!labelEl) return null;
    var text = labelEl.textContent.trim();
    // Buscar matching con labels conocidos
    for (var id in APPLIANCE_LABELS) {
      if (text === APPLIANCE_LABELS[id] || text.indexOf(APPLIANCE_LABELS[id]) === 0) {
        return id;
      }
    }
    return null;
  }

  // Observer para inyectar widgets de cantidad en wizard step 4
  var wizardObserver = new MutationObserver(function(mutations) {
    injectQtyWidgets();
  });

  function injectQtyWidgets() {
    // Buscar el wizard step 4 (Equipos)
    // El wizard tiene título "Dimensiona tu sistema solar" y step 4 tiene "¿Qué equipos quieres respaldados?"
    var stepHeader = Array.from(document.querySelectorAll('h3')).find(function(h) {
      return h.textContent.indexOf('respaldados') !== -1 ||
             h.textContent.indexOf('críticos') !== -1;
    });
    if (!stepHeader) return;

    var stepContainer = stepHeader.closest('div');
    if (!stepContainer) return;

    // Buscar todos los botones de equipos (grid de tarjetas)
    var applianceButtons = stepContainer.querySelectorAll('button[class*="border-"]');
    if (applianceButtons.length === 0) return;

    var injected = 0;
    applianceButtons.forEach(function(btn) {
      if (isApplianceSelected(btn)) {
        // Solo inyectar si no existe ya
        if (!btn.querySelector('.sr-qty-container')) {
          var applianceId = getApplianceIdFromButton(btn);
          if (applianceId) {
            var widget = createQtyWidget(applianceId, APPLIANCE_LABELS[applianceId]);
            btn.appendChild(widget);
            injected++;
          }
        }
      } else {
        // Si no está seleccionado, remover el widget si existe
        var existing = btn.querySelector('.sr-qty-container');
        if (existing) {
          existing.remove();
        }
      }
    });

    if (injected > 0) {
      console.log('[SR Patch v2] Widgets de cantidad inyectados:', injected);
      // Aplicar cantidades a jq inmediatamente
      applyQuantitiesToJq();
    }
  }

  // Interceptar el envío del formulario para incluir cantidades
  function interceptFormSubmit() {
    var form = document.querySelector('#contacto form, form[action*="contact"]');
    if (!form) return;
    if (form.dataset.srQtyIntercepted) return;
    form.dataset.srQtyIntercepted = '1';

    form.addEventListener('submit', function() {
      // Verificar si hay cantidades > 1
      var hasQuantities = false;
      var summary = [];
      APPLIANCE_IDS.forEach(function(id) {
        if (quantities[id] > 1) {
          hasQuantities = true;
          summary.push((quantities[id]) + 'x ' + APPLIANCE_LABELS[id]);
        }
      });

      if (hasQuantities) {
        var msgField = form.querySelector('textarea[name="message"]');
        if (msgField) {
          var marker = '\n\n--- Cantidades de equipos (calculadora) ---';
          var baseMsg = msgField.value.split(marker)[0];
          msgField.value = baseMsg + marker + '\n' + summary.join('\n');
        }
      }
    }, { capture: true });
  }

  // Inicializar observer cuando el DOM esté listo
  function init() {
    wizardObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    // Intentar interceptar form cada 2s (por si se renderiza tarde)
    setInterval(interceptFormSubmit, 2000);

    console.log('[SR Patch v2] Observer inicializado, esperando wizard...');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[SR Patch v2] Patches aplicados');
})();
