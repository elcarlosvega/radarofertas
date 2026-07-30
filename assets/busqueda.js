/* Radar Ofertas MX - contrato UNICO de normalizacion y busqueda (30-jul).
   Dos representaciones, nunca se mezclan:
     - el texto VISIBLE conserva sus acentos ("Cámara fotográfica");
     - la CAPA DE BUSQUEDA usa la forma normalizada ("camara fotografica").
   La coincidencia es por token exacto o prefijo, sobre nombre+categoria+
   marca+tienda: "oster" encuentra Oster y NO Booster/Foster/Repostería;
   "camara" encuentra "Cámara"; "ost" encuentra Oster (prefijo).

   Pruebas del contrato (se cumplen por construccion):
     normaliza("Cámara") === "camara"
     normaliza("Colchón") === "colchon"
     normaliza("Línea blanca") === "linea blanca"
     normaliza("Niños y Bebés") === "ninos y bebes"
     coincide(tokeniza("Lacoste Booster"), "oster") === false
     coincide(tokeniza("Licuadora Oster"), "oster") === true */
(function () {
  'use strict';
  function normaliza(v) {
    return String(v == null ? '' : v)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLocaleLowerCase('es-MX')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function tokeniza(v) {
    return normaliza(v).split(/[^a-z0-9]+/).filter(Boolean);
  }
  function tokensDe(d, extra) {
    return tokeniza([d.name, d.brand, d.model, d.category, d.sub, d.marca,
                     extra].filter(Boolean).join(' '));
  }
  function coincide(tokens, consulta) {
    var qs = tokeniza(consulta);
    if (!qs.length) return true;
    tokens = tokens || [];
    return qs.every(function (t) {
      return tokens.some(function (w) {
        return w === t || w.indexOf(t) === 0;
      });
    });
  }
  window.RadarBusqueda = { normaliza: normaliza, tokeniza: tokeniza,
                           tokensDe: tokensDe, coincide: coincide };
})();
