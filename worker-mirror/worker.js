// Worker mínimo — solo para que wrangler deploy no se queje de falta de main.
// El serving real lo hace el binding [assets] desde wrangler.toml.
export default {
  async fetch(request, env, ctx) {
    // Si la request no matchea un asset, devolvemos 404 simple.
    return new Response("Not found", { status: 404 });
  },
};
