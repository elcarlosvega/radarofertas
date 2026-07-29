/* Radar Ofertas MX - "Ahorradores en línea": visitantes activos REALES.

   Cada visitante se une a un canal de Supabase Realtime con Presence; el
   contador es el numero de llaves distintas del roster (una por navegador,
   no por pestania: la llave vive en localStorage). Se actualiza solo, en
   cada alta/baja (presence sync), sin sondeos.

   Honestidad del dato:
   - sin config (presencia_config.js vacio) -> el widget no aparece;
   - si el socket falla o se corta -> el widget se oculta;
   - nunca se muestra un numero inventado ni "el ultimo conocido".

   Carga: page_home.html incluye presencia_config.js y luego este archivo
   (defer). La libreria (assets/supabase.js, misma-origen por la CSP) se
   inyecta SOLO si hay config: quien no configura no baja 200 KB. */
(function () {
  'use strict';
  var cfg = window.RADAR_PRESENCIA;
  if (!cfg || !cfg.url || !cfg.anonKey) return;
  var el = document.getElementById('enlinea');
  if (!el) return;

  // una llave por navegador (multi-pestania no infla el conteo)
  var KEY = 'radar_presencia_id';
  var id;
  try {
    id = localStorage.getItem(KEY);
    if (!id) {
      id = 'v-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem(KEY, id);
    }
  } catch (e) {
    id = 'v-' + Math.random().toString(36).slice(2, 12);   // sin localStorage: por pestania
  }

  function muestra(n) {
    if (n > 0) {
      el.querySelector('b').textContent = n.toLocaleString('es-MX');
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  }

  function arranca() {
    if (!window.supabase || !window.supabase.createClient) return;
    var cli = window.supabase.createClient(cfg.url, cfg.anonKey);
    var canal = cli.channel('ahorradores', { config: { presence: { key: id } } });
    canal.on('presence', { event: 'sync' }, function () {
      muestra(Object.keys(canal.presenceState()).length);
    });
    canal.subscribe(function (estado) {
      if (estado === 'SUBSCRIBED') {
        canal.track({ t: Date.now() });
      } else if (estado === 'CHANNEL_ERROR' || estado === 'TIMED_OUT' || estado === 'CLOSED') {
        muestra(0);   // sin conexion no hay dato real que mostrar
      }
    });
    window.addEventListener('pagehide', function () { try { canal.untrack(); } catch (e) {} });
  }

  var s = document.createElement('script');
  s.src = '/assets/supabase.js';
  s.onload = arranca;
  document.head.appendChild(s);
})();
