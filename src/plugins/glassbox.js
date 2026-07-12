const HOST_CONFIG = {
  'merkava.mrp.gov.il': import.meta.env.VITE_GLASSBOX_SITE_ID_PROD,
  'merkava.mrq.gov.il': import.meta.env.VITE_GLASSBOX_SITE_ID_DEV,
  'merkava.mrd.gov.il': import.meta.env.VITE_GLASSBOX_SITE_ID_DEV,
};

const DEFAULT_PORT = '443';

export default {
  install(app) {
    if (typeof window === 'undefined') return;

    const siteId = HOST_CONFIG[window.location.hostname] ?? null;

    if (!siteId) return; // not an external host, disable Glassbox

    // window.location.port is an empty string when the browser uses the
    // protocol's default port, so treat empty as the default (443).
    const port = window.location.port || DEFAULT_PORT;
    if (port !== DEFAULT_PORT) return; // non-standard port, disable Glassbox

    window._cls_cfg = { siteId };

    const script = document.createElement('script');
    script.src = 'https://cdn.glassbox.com/gb-recorder.js';
    script.async = true;
    document.head.appendChild(script);
  },
};
