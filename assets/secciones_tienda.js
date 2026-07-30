/* Radar Ofertas MX - "top por categoria" para paginas de tienda que cargan
   deals.json completo (Costco, MeLi, Coppel, Elektra, Amazon).

   Mismo formato que /palacio/ (que lo calcula del lado del servidor porque
   pagina sus 3,400+ ofertas); aqui todo es cliente: la pagina ya tiene TODAS
   las ofertas en memoria, asi que no hay nada que publicar aparte.

   Reglas (identicas a secciones.py):
   - la vista por categorias se activa si la TIENDA pasa de 150 productos
     (regla de Carlos, 29-jul); una categoria entra con al menos 6 ofertas
     (menos no llena una fila digna) y el tope es 12 secciones por jale;
   - top 5 por score con tope de 2 por familia (tipo de producto, primer
     sustantivo del nombre): sin el, "Colchones y Boxes" son 5 colchones;
   - categorias de mas jale arriba (jale = score promedio de lo MOSTRADO);
   - categorias genericas excluidas ("Otras ofertas" no es una seccion);
   - chips como pestañas, "Ver las N" filtra la parrilla completa;
   - si ninguna categoria pasa el umbral, la pagina queda como siempre.

   Contrato con la pagina (ver cualquier page_template.html de tienda):
     RadarSecciones.montar({deals, cardHtml, score, esc})  tras cargar ALL
     RadarSecciones.filtro          categoria activa ('' = sin filtro)
     RadarSecciones.actualizar(hayBusqueda, sort)  desde render()
   y el render() de la pagina filtra su lista con RadarSecciones.filtro. */
(function () {
  'use strict';
  var MIN_TIENDA = 150, MIN_CAT = 6, TOP_N = 5, MAX_FAMILIA = 2, MAX_SECCIONES = 12;
  var GENERICAS = { 'otras ofertas': 1, 'otros': 1, 'otras': 1, 'varios': 1,
                    'general': 1, 'sin categoria': 1 };
  var GEN = { de: 1, del: 1, la: 1, el: 1, los: 1, las: 1, un: 1, una: 1,
              unos: 1, unas: 1, para: 1, con: 1, y: 1, en: 1, a: 1, al: 1,
              por: 1, set: 1, kit: 1, pack: 1, paquete: 1, juego: 1,
              combo: 1, caja: 1, par: 1 };
  var o = null, secciones = [], nCat = {}, total = 0;

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function familia(nombre) {
    var toks = norm(nombre).match(/[a-z0-9]+/g) || [];
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i];
      if (GEN[t] || /^\d+$/.test(t) || t.length < 3) continue;
      if (t.length > 4 && t.slice(-2) === 'es') return t.slice(0, -2);
      if (t.length > 3 && t.slice(-1) === 's') return t.slice(0, -1);
      return t;
    }
    return 'otros';
  }
  function cmpDe(sort) {
    var f = {
      pct: function (a, b) { return (b.pct || 0) - (a.pct || 0); },
      amount: function (a, b) { return (b.amount || 0) - (a.amount || 0); },
      price: function (a, b) { return (a.price_new || 0) - (b.price_new || 0); }
    }[sort];
    return f || function (a, b) { return o.score(b) - o.score(a); };
  }
  function slug(s) {
    return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'cat';
  }

  function calcula() {
    var porcat = {};
    total = (o.deals || []).length;
    (o.deals || []).forEach(function (d) {
      var c = String(d.category || '').trim();
      if (!c || c.length < 3 || GENERICAS[norm(c)]) return;   // "c" de Costco y ruido
      (porcat[c] = porcat[c] || []).push(d);
    });
    secciones = []; nCat = {};
    if (total <= MIN_TIENDA) return;   // tienda chica: pagina como siempre
    Object.keys(porcat).forEach(function (c) {
      var ds = porcat[c];
      nCat[c] = ds.length;
      if (ds.length < MIN_CAT) return;
      ds = ds.slice().sort(function (a, b) { return o.score(b) - o.score(a); });
      var top = [], fam = {};
      for (var i = 0; i < ds.length && top.length < TOP_N; i++) {
        var f = familia(ds[i].name);
        if ((fam[f] || 0) >= MAX_FAMILIA) continue;
        top.push(ds[i]); fam[f] = (fam[f] || 0) + 1;
      }
      for (i = 0; i < ds.length && top.length < TOP_N; i++) {
        if (top.indexOf(ds[i]) < 0) top.push(ds[i]);
      }
      var jale = top.reduce(function (s, d) { return s + o.score(d); }, 0) / (top.length || 1);
      secciones.push({ nombre: c, slug: slug(c), total: ds.length, jale: jale, top: top });
    });
    secciones.sort(function (a, b) { return b.jale - a.jale; });
    secciones = secciones.slice(0, MAX_SECCIONES);
  }

  function nodos() {
    var cnt = document.getElementById('cnt');
    var nav = document.createElement('div'); nav.className = 'catnav'; nav.id = 'catnav'; nav.hidden = true;
    var box = document.createElement('div'); box.id = 'secciones';
    var hd = document.createElement('div'); hd.className = 'gridhd'; hd.id = 'gridhd'; hd.hidden = true;
    hd.innerHTML = '<h2 id="gridhdt">Todas las ofertas</h2><button class="clr" id="gridclr" type="button" hidden>× quitar filtro</button>';
    cnt.parentNode.insertBefore(nav, cnt);
    cnt.parentNode.insertBefore(box, cnt);
    cnt.parentNode.insertBefore(hd, cnt);
    nav.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[data-cat]'); if (!a) return;
      e.preventDefault(); pon(a.getAttribute('data-cat') || '');
    });
    box.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a.all'); if (!a) return;
      e.preventDefault(); pon(a.getAttribute('data-cat') || '');
      var t = document.getElementById('gridhdt');
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    hd.querySelector('#gridclr').addEventListener('click', function () { pon(''); });
  }

  function pon(cat) {
    A.filtro = cat || '';
    var q = document.getElementById('q');
    if (q && q.value) {
      q.value = '';
      q.dispatchEvent(new Event('input'));   // la pagina resetea su variable q
    } else if (o.alFiltrar) {
      o.alFiltrar();
    }
    if (!cat) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function pinta(busqueda, sort) {
    var nav = document.getElementById('catnav'), box = document.getElementById('secciones');
    var hd = document.getElementById('gridhd');
    if (!nav || !secciones.length) return;
    var cmp = cmpDe(sort);
    nav.innerHTML = '<span class="cnlb">Por categoría:</span>' +
      '<a href="#" data-cat="" class="' + (A.filtro ? '' : 'on') + '">Todas<small>' +
      total.toLocaleString('es-MX') + '</small></a>' +
      secciones.map(function (s) {
        return '<a href="#" data-cat="' + o.esc(s.nombre) + '" class="' +
          (A.filtro === s.nombre ? 'on' : '') + '">' + o.esc(s.nombre) +
          '<small>' + s.total.toLocaleString('es-MX') + '</small></a>';
      }).join('');
    nav.hidden = false;
    box.innerHTML = (busqueda || A.filtro) ? '' : secciones.map(function (s) {
      return '<section class="sec" id="sec-' + s.slug + '">' +
        '<div class="sechd"><h2>' + o.esc(s.nombre) + '</h2>' +
        '<span class="of">top ' + s.top.length + ' de ' + s.total.toLocaleString('es-MX') + '</span>' +
        '<a class="all" href="#gridhdt" data-cat="' + o.esc(s.nombre) + '">Ver las ' +
        s.total.toLocaleString('es-MX') + ' →</a></div>' +
        '<div class="grid">' + s.top.slice().sort(cmp).map(o.cardHtml).join('') + '</div></section>';
    }).join('');
    hd.hidden = false;
    hd.querySelector('#gridhdt').textContent = A.filtro ? ('Ofertas de ' + A.filtro) : 'Todas las ofertas';
    hd.querySelector('#gridclr').hidden = !A.filtro;
  }

  var A = {
    filtro: '',
    montar: function (opts) {
      o = opts;
      calcula();
      if (!secciones.length) return;      // tienda chica: pagina como siempre
      nodos();
      pinta(false, 'score');
    },
    actualizar: function (busqueda, sort) {
      if (o) pinta(!!busqueda, sort || 'score');
    }
  };
  window.RadarSecciones = A;
})();
