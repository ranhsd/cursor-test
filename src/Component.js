sap.ui.define([
  "sap/ui/core/UIComponent",
], function (UIComponent) {
  "use strict";

  const SCRIPT_CONFIG = {
    prod: {
      src: "https://cdn.gbqofs.com/finance_ministry/p/detector-dom.min.js",
      dataClsConfig:
        "reportURI=https://report.gb-pov.gbqofs.io/rcqgqx3o/reporting/e9d834e4-f152-3379-c79c-046534ed1eab/cls_report;recordErrors=true;recordScrolls=true;recordMouseMoves=true;",
    },
    dev: {
      src: "https://cdn.gbqofs.com/finance_ministry/u/detector-dom.min.js",
      dataClsConfig:
        "reportURI=https://report.gb-pov.gbqofs.io/rcqgqx3o/reporting/23a92793-1e3c-7ef8-2ef7-bee054652f9f/cls_report;recordErrors=true;recordScrolls=true;recordMouseMoves=true;",
    },
  };

  const HOST_CONFIG = {
    "merkava.mrp.gov.il": { env: "prod", allowedPorts: [443] },
    "merkava.mrq.gov.il": { env: "dev", allowedPorts: [443] },
    "merkava.mrd.gov.il": { env: "dev", allowedPorts: [443] },
  };

  return UIComponent.extend("your.app.Component", {

    init: function () {
      UIComponent.prototype.init.apply(this, arguments);
      this._initGlassbox();
    },

    _initGlassbox: function () {
      const config = HOST_CONFIG[window.location.hostname] ?? null;

      if (!config) return; // not an external host, disable Glassbox

      // window.location.port is an empty string when the browser uses the
      // protocol's default port (443 for HTTPS), so fall back to 443.
      const port = parseInt(window.location.port || "443", 10);

      if (!config.allowedPorts.includes(port)) return; // port not allowed, disable Glassbox

      const scriptConfig = SCRIPT_CONFIG[config.env];

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.id = "_cls_detector";
      script.src = scriptConfig.src;
      script.async = true;
      script.setAttribute("data-clsconfig", scriptConfig.dataClsConfig);
      script.onload = this._onGlassboxLoaded.bind(this);
      document.head.appendChild(script);
    },

    _onGlassboxLoaded: function () {
      window._detector?.plugins?.resourceRecorderPlugin?.startRecordingAll();
    },

  });
});
