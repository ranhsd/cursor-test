const SCRIPT_CONFIG = {
  prod: {
    src: import.meta.env.VITE_GLASSBOX_SCRIPT_SRC_PROD,
    reportURI: import.meta.env.VITE_GLASSBOX_REPORT_URI_PROD,
  },
  dev: {
    src: import.meta.env.VITE_GLASSBOX_SCRIPT_SRC_DEV,
    reportURI: import.meta.env.VITE_GLASSBOX_REPORT_URI_DEV,
  },
};

const HOST_CONFIG = {
  'merkava.mrp.gov.il': { env: 'prod', allowedPorts: [443] },
  'merkava.mrq.gov.il': { env: 'dev', allowedPorts: [443] },
  'merkava.mrd.gov.il': { env: 'dev', allowedPorts: [443] },
};

function buildDataClsConfig(reportURI) {
  return `reportURI=${reportURI};recordErrors=true;recordScrolls=true;recordMouseMoves=true;`;
}

export default {
  install(app) {
    if (typeof window === 'undefined') return;

    const config = HOST_CONFIG[window.location.hostname] ?? null;

    if (!config) return; // not an external host, disable Glassbox

    // window.location.port is an empty string when the browser uses the
    // protocol's default port (443 for HTTPS), so fall back to 443.
    const port = parseInt(window.location.port || '443', 10);

    if (!config.allowedPorts.includes(port)) return; // port not allowed, disable Glassbox

    const scriptConfig = SCRIPT_CONFIG[config.env];

    if (!scriptConfig.src || !scriptConfig.reportURI) return; // env vars not set, disable Glassbox

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.id = '_cls_detector';
    script.src = scriptConfig.src;
    script.async = true;
    script.setAttribute('data-clsconfig', buildDataClsConfig(scriptConfig.reportURI));
    document.head.appendChild(script);
  },
};
