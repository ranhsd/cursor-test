const HOST_CONFIG = {
  'merkava.mrp.gov.il': { siteId: import.meta.env.VITE_GLASSBOX_SITE_ID_PROD, allowedPorts: [443] },
  'merkava.mrq.gov.il': { siteId: import.meta.env.VITE_GLASSBOX_SITE_ID_DEV, allowedPorts: [443] },
  'merkava.mrd.gov.il': { siteId: import.meta.env.VITE_GLASSBOX_SITE_ID_DEV, allowedPorts: [443] },
};

export default {
  install(app) {
    if (typeof window === 'undefined') return;

    const config = HOST_CONFIG[window.location.hostname] ?? null;

    if (!config) return; // not an external host, disable Glassbox

    // window.location.port is an empty string when the browser uses the
    // protocol's default port (443 for HTTPS), so fall back to 443.
    const port = parseInt(window.location.port || '443', 10);

    if (!config.allowedPorts.includes(port)) return; // port not allowed, disable Glassbox

    window._cls_cfg = { siteId: config.siteId };

    const script = document.createElement('script');
    script.src = 'https://cdn.glassbox.com/gb-recorder.js';
    script.async = true;
    document.head.appendChild(script);
  },
};
