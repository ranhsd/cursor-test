const HOST_CONFIG = {
  'merkava.mrp.gov.il': import.meta.env.VITE_GLASSBOX_SITE_ID_PROD,
  'merkava.mrq.gov.il': import.meta.env.VITE_GLASSBOX_SITE_ID_DEV,
  'merkava.mrd.gov.il': import.meta.env.VITE_GLASSBOX_SITE_ID_DEV,
};

const DEFAULT_PORT = '443';

export default {
  install(app) {
    if (typeof window === 'undefined') return;

    const { hostname, port } = window.location;

    // window.location.port is "" when the default port for the protocol is used
    const effectivePort = port || DEFAULT_PORT;

    if (effectivePort !== DEFAULT_PORT) return; // only activate on port 443

    const siteId = HOST_CONFIG[hostname] ?? null;

    if (!siteId) return; // not an external host, disable Glassbox

    window._cls_cfg = { siteId };

    const script = document.createElement('script');
    script.src = 'https://cdn.glassbox.com/gb-recorder.js';
    script.async = true;
    document.head.appendChild(script);
  },
};
