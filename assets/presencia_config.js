/* Config del contador de "Ahorradores en línea" (visitantes activos REALES
   via Supabase Realtime Presence).

   Para activarlo:
   1. Crea un proyecto gratis en https://supabase.com (2 min).
   2. En Project Settings -> API copia estos dos valores:
      - Project URL  (https://xxxx.supabase.co)
      - anon public key  (esta llave ES publica por diseño: viaja en el JS a
        cada visitante y solo permite lo que Supabase deja al rol anon; no es
        un secreto como el GH_TOKEN).
   3. Pegalos abajo y publica con PUBLICAR_MICROSITIOS.bat.

   Sin estos valores el contador simplemente NO se muestra: nunca se inventa
   un numero. */
window.RADAR_PRESENCIA = {
  url: "",        /* ej. "https://abcdefgh.supabase.co" */
  anonKey: ""     /* ej. "eyJhbGciOi..." */
};
