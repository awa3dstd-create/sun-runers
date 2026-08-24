/* ════════════════════════════════════════════════════════════
   SUN-RUNERS — Mobile Performance Patch JS
   Inyectado al final del <body> para arreglar:
   1. Scroll se sube solo (interceptar window.scrollTo espurios)
   2. Animación intro no aparece (forzar hide después de 4s)
   3. Multi-equipo selector en el formulario de contacto
   ════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  console.log('[SUN-RUNERS Patch] Inicializando mobile patches...');

  /* ──────────────────────────────────────────────
     FIX 1: Interceptar window.scrollTo espurios
     Solo permitir si el usuario hizo click en botón "Arriba"
     ────────────────────────────────────────────── */
  var originalScrollTo = window.scrollTo.bind(window);

  var allowScrollTo = false;
  var allowScrollUntil = 0;

  // Permitir scrollTo solo cuando el usuario hace click explícito
  document.addEventListener('click', function(e) {
    var target = e.target;
    while (target && target !== document.body) {
      if (target.getAttribute && target.getAttribute('aria-label') === 'Volver arriba') {
        allowScrollTo = true;
        allowScrollUntil = Date.now() + 1000;
        break;
      }
      // Cualquier botón con texto "Arriba"
      if (target.tagName === 'BUTTON' && target.textContent.trim().includes('Arriba')) {
        allowScrollTo = true;
        allowScrollUntil = Date.now() + 1000;
        break;
      }
      target = target.parentNode;
    }
  }, true);

  // Sobrescribir window.scrollTo
  window.scrollTo = function() {
    var args = arguments;
    var opts = args[0] && typeof args[0] === 'object' ? args[0] : { top: args[1] || 0, behavior: 'auto' };

    // Si es scrollTo({top: 0, behavior: 'smooth'}) sin permiso, BLOQUEAR
    if (opts.top === 0 && opts.behavior === 'smooth') {
      if (Date.now() > allowScrollUntil) {
        console.log('[SUN-RUNERS Patch] Bloqueado scrollTo espurio al top');
        return;
      }
    }
    return originalScrollTo.apply(window, args);
  };

  /* ──────────────────────────────────────────────
     FIX 2: Forzar hide del intro-overlay después de 4s
     (en caso de que React no hidrate bien)
     ────────────────────────────────────────────── */
  function hideIntroOverlay() {
    var overlay = document.querySelector('.intro-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.visibility = 'hidden';
      overlay.style.pointerEvents = 'none';
      overlay.style.transition = 'opacity 0.4s ease-out';
      console.log('[SUN-RUNERS Patch] Intro overlay forzado a ocultarse');
    }
  }

  // Hide a los 4s sin importar qué
  setTimeout(hideIntroOverlay, 4000);

  // Hide también cuando el usuario hace scroll (señal de que quiere ver el sitio)
  var introHiddenByScroll = false;
  function hideOnFirstInteraction() {
    if (!introHiddenByScroll) {
      introHiddenByScroll = true;
      setTimeout(hideIntroOverlay, 100);
    }
  }
  // Primer scroll o touch
  window.addEventListener('scroll', hideOnFirstInteraction, { once: true, passive: true });
  window.addEventListener('touchmove', hideOnFirstInteraction, { once: true, passive: true });
  // Primer click en cualquier parte
  document.addEventListener('click', hideOnFirstInteraction, { once: true });

  /* ──────────────────────────────────────────────
     FIX 3: Asegurar que body tenga overflow auto
     (algunos modales pueden dejarlo en hidden)
     ────────────────────────────────────────────── */
  var bodyOverflowObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.attributeName === 'style' || m.attributeName === 'class') {
        var body = document.body;
        if (body.style.overflow === 'hidden' && !body.dataset.modalOpen) {
          // Si no hay modal abierto activamente, restaurar scroll
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
  bodyOverflowObserver.observe(document.body, { attributes: true });

  /* ──────────────────────────────────────────────
     FIX 4: Asegurar que el scrollIntoView con smooth
     funcione correctamente (no se trabe en móvil)
     ────────────────────────────────────────────── */
  var originalScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function(options) {
    // En móvil, forzar auto en lugar de smooth
    if (window.innerWidth <= 1024) {
      options = options || {};
      options.behavior = 'auto';
    }
    return originalScrollIntoView.call(this, options);
  };

  /* ──────────────────────────────────────────────
     NUEVA FUNCIONALIDAD: Selector multi-equipo
     Se inyecta en el formulario de contacto
     Solo cuando el servicio seleccionado es "fotovoltaico"
     ────────────────────────────────────────────── */

  var EQUIPOS_FOTOVOLTAICOS = {
    'inversores': {
      label: 'Inversores',
      options: [
        'Inversor híbrido 3 kW (MUST/Deye)',
        'Inversor híbrido 5 kW (MUST/Deye)',
        'Inversor híbrido 8 kW (Growatt)',
        'Inversor híbrido 10 kW (Growatt)',
        'Inversor híbrido 12 kW (Deye)',
        'Inversor off-grid 3 kW (Felicity)',
        'Inversor off-grid 5 kW (Sunri)',
        'Inversor split-phase 120/240V',
        'Otro (especificar en mensaje)'
      ]
    },
    'baterias': {
      label: 'Baterías LiFePO4',
      options: [
        'Banco 24V 100Ah (2.56 kWh)',
        'Banco 48V 100Ah (5.12 kWh)',
        'Banco 48V 200Ah (10.24 kWh)',
        'Banco 51.2V 100Ah (5.12 kWh) MUST',
        'Banco 51.2V 200Ah (10.24 kWh) Pylontech',
        'Banco modular 15 kWh',
        'Banco modular 20 kWh',
        'Otro (especificar en mensaje)'
      ]
    },
    'paneles': {
      label: 'Paneles solares',
      options: [
        'Panel 450 W monocrystallino',
        'Panel 550 W monocrystallino',
        'Panel 600 W LONGi Hi-MO',
        'Panel 615 W LONGi Hi-MO',
        'Kit 4 paneles (aprox 2.4 kW)',
        'Kit 6 paneles (aprox 3.3 kW)',
        'Kit 8 paneles (aprox 4.4 kW)',
        'Kit 12 paneles (aprox 6.6 kW)',
        'Kit 16 paneles (aprox 8.8 kW)',
        'Otro (especificar en mensaje)'
      ]
    },
    'controladores': {
      label: 'Controladores y MPPT',
      options: [
        'MPPT 60 A (Voltronic)',
        'MPPT 80 A (Epsolar)',
        'MPPT 100 A (Victron)',
        'Controlador PWM 30 A',
        'Controlador PWM 60 A',
        'Otro (especificar en mensaje)'
      ]
    }
  };

  function createMultiEquiposWidget() {
    var container = document.createElement('div');
    container.className = 'sun-runers-multi-equipos';
    container.id = 'sun-runers-multi-equipos';
    container.style.display = 'none';

    container.innerHTML = `
      <div class="sun-runers-multi-equipos-title">
        <span style="color: var(--accent, #B8702E);">●</span>
        Configura tu sistema (opcional)
      </div>
      <p style="font-size: 0.75rem; color: var(--muted-foreground, #6A655A); margin-bottom: 0.5rem;">
        Si ya sabes qué equipos necesitas, agréguelos aquí. Si no, déjalo en blanco y el ingeniero te orientará.
      </p>
      <div class="sun-runers-multi-equipos-list" id="sun-runers-equipos-list"></div>
      <button type="button" class="sun-runers-add-equipo-btn" id="sun-runers-add-equipo">
        + Agregar equipo
      </button>
      <div class="sun-runers-equipos-summary" id="sun-runers-equipos-summary" style="display:none;"></div>
    `;

    return container;
  }

  function createEquipoRow() {
    var row = document.createElement('div');
    row.className = 'sun-runers-equipo-row';

    var categoriaSelect = document.createElement('select');
    categoriaSelect.className = 'sun-runers-categoria';
    categoriaSelect.innerHTML = '<option value="">Categoría...</option>';
    Object.keys(EQUIPOS_FOTOVOLTAICOS).forEach(function(key) {
      var opt = document.createElement('option');
      opt.value = key;
      opt.textContent = EQUIPOS_FOTOVOLTAICOS[key].label;
      categoriaSelect.appendChild(opt);
    });

    var equipoSelect = document.createElement('select');
    equipoSelect.className = 'sun-runers-equipo-select';
    equipoSelect.disabled = true;
    equipoSelect.innerHTML = '<option value="">Primero elige categoría</option>';

    var cantidadInput = document.createElement('input');
    cantidadInput.type = 'number';
    cantidadInput.min = '1';
    cantidadInput.max = '50';
    cantidadInput.value = '1';
    cantidadInput.className = 'sun-runers-equipo-cantidad';
    cantidadInput.setAttribute('aria-label', 'Cantidad');

    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-equipo';
    removeBtn.textContent = '×';
    removeBtn.setAttribute('aria-label', 'Quitar equipo');
    removeBtn.onclick = function() {
      if (row.parentNode.children.length > 1) {
        row.remove();
        updateSummary();
      } else {
        // Si es el último, solo resetear
        categoriaSelect.value = '';
        equipoSelect.disabled = true;
        equipoSelect.innerHTML = '<option value="">Primero elige categoría</option>';
        cantidadInput.value = '1';
        updateSummary();
      }
    };

    categoriaSelect.onchange = function() {
      var cat = categoriaSelect.value;
      equipoSelect.innerHTML = '<option value="">Elige equipo...</option>';
      if (cat && EQUIPOS_FOTOVOLTAICOS[cat]) {
        EQUIPOS_FOTOVOLTAICOS[cat].options.forEach(function(opt) {
          var o = document.createElement('option');
          o.value = opt;
          o.textContent = opt;
          equipoSelect.appendChild(o);
        });
        equipoSelect.disabled = false;
      } else {
        equipoSelect.disabled = true;
        equipoSelect.innerHTML = '<option value="">Primero elige categoría</option>';
      }
      updateSummary();
    };

    equipoSelect.onchange = updateSummary;
    cantidadInput.oninput = updateSummary;

    row.appendChild(categoriaSelect);
    row.appendChild(equipoSelect);
    row.appendChild(cantidadInput);
    row.appendChild(removeBtn);

    return row;
  }

  function updateSummary() {
    var rows = document.querySelectorAll('.sun-runers-equipo-row');
    var summary = document.getElementById('sun-runers-equipos-summary');
    var items = [];
    rows.forEach(function(row) {
      var cat = row.querySelector('.sun-runers-categoria').value;
      var eq = row.querySelector('.sun-runers-equipo-select').value;
      var qty = row.querySelector('.sun-runers-equipo-cantidad').value;
      if (cat && eq) {
        var catLabel = EQUIPOS_FOTOVOLTAICOS[cat] ? EQUIPOS_FOTOVOLTAICOS[cat].label : cat;
        items.push('• ' + (qty || 1) + 'x ' + eq + ' (' + catLabel + ')');
      }
    });
    if (items.length > 0) {
      summary.style.display = 'block';
      summary.innerHTML = '<strong>Resumen:</strong><br>' + items.join('<br>');
    } else {
      summary.style.display = 'none';
    }

    // Actualizar el campo message del form con los equipos
    var messageField = document.querySelector('textarea[name="message"]');
    if (messageField) {
      var currentVal = messageField.value;
      // Quitar resumen anterior si existe
      var marker = '\n\n--- Configuración seleccionada ---';
      var baseMsg = currentVal.split(marker)[0];
      if (items.length > 0) {
        messageField.value = baseMsg + marker + '\n' + items.join('\n');
      } else {
        messageField.value = baseMsg;
      }
    }
  }

  function injectMultiEquipos() {
    // Buscar el form de contacto
    var form = document.querySelector('#contacto form');
    if (!form) {
      console.log('[SUN-RUNERS Patch] Form no encontrado, reintentando...');
      setTimeout(injectMultiEquipos, 1000);
      return;
    }
    if (document.getElementById('sun-runers-multi-equipos')) {
      // Ya inyectado, solo observar cambios de servicio
      setupServiceWatcher();
      return;
    }

    console.log('[SUN-RUNERS Patch] Inyectando multi-equipos en form');

    var widget = createMultiEquiposWidget();
    // Insertar antes del botón submit
    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      var submitContainer = submitBtn.closest('div');
      if (submitContainer) {
        submitContainer.parentNode.insertBefore(widget, submitContainer);
      } else {
        form.appendChild(widget);
      }
    } else {
      form.appendChild(widget);
    }

    // Agregar primera fila inicial
    var list = document.getElementById('sun-runers-equipos-list');
    list.appendChild(createEquipoRow());

    // Botón "Agregar equipo"
    document.getElementById('sun-runers-add-equipo').onclick = function() {
      list.appendChild(createEquipoRow());
    };

    setupServiceWatcher();
  }

  function setupServiceWatcher() {
    // Detectar cambio de servicio seleccionado
    var serviceTrigger = document.querySelector('#contacto [role="combobox"], #contacto button[role="combobox"]');
    var widget = document.getElementById('sun-runers-multi-equipos');
    if (!widget) return;

    // Por defecto oculto, mostrar solo si servicio es "fotovoltaico"
    function checkService() {
      var selectedText = '';
      if (serviceTrigger) {
        selectedText = serviceTrigger.textContent.trim().toLowerCase();
      }
      // Mostrar widget si servicio incluye "fotovoltaico"
      if (selectedText.includes('fotovolta')) {
        widget.style.display = 'block';
      } else {
        widget.style.display = 'none';
      }
    }

    if (serviceTrigger) {
      // Observer para detectar cambios de texto
      var observer = new MutationObserver(checkService);
      observer.observe(serviceTrigger, { childList: true, subtree: true, characterData: true });
      checkService();
    }

    // También observar clicks en opciones del dropdown
    document.addEventListener('click', function(e) {
      var target = e.target;
      if (target && target.getAttribute && target.getAttribute('role') === 'option') {
        setTimeout(checkService, 100);
      }
    });
  }

  // Inyectar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(injectMultiEquipos, 500);
    });
  } else {
    setTimeout(injectMultiEquipos, 500);
  }

  // Re-intentar inyección si React tarda en hidratar
  setTimeout(injectMultiEquipos, 2000);
  setTimeout(injectMultiEquipos, 5000);

  console.log('[SUN-RUNERS Patch] Patches aplicados correctamente');
})();
