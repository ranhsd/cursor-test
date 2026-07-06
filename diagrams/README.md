# SAP BTP + Work Zone + Umbraco Architecture Diagram

Architecture for a web app hosted on the **SAP BTP HTML5 Application Repository** that:

- Consumes **SAP Build Work Zone, Standard Edition** APIs to build the user's links/navigation.
- Consumes **Umbraco Headless CMS** APIs for additional content, reached through the
  **Destination Service + Connectivity Service + Cloud Connector** into the customer's
  **on-premise** landscape.

The diagram explicitly separates the **Cloud (SAP BTP)** and **On-Premise (Customer)** environments.

## Files

- `btp-workzone-umbraco-architecture.mmd` – Mermaid source (edit this).
- `btp-workzone-umbraco-architecture.svg` – Vector export.
- `btp-workzone-umbraco-architecture.png` – Raster export (3x scale).
- `IMPLEMENTATION_GUIDE.md` – Step-by-step guide for developers to read the diagram and implement it.

## Regenerate

```bash
npx -y @mermaid-js/mermaid-cli -i btp-workzone-umbraco-architecture.mmd \
  -o btp-workzone-umbraco-architecture.svg -b white -p puppeteer-config.json

npx -y @mermaid-js/mermaid-cli -i btp-workzone-umbraco-architecture.mmd \
  -o btp-workzone-umbraco-architecture.png -b white -s 3 -p puppeteer-config.json
```

`puppeteer-config.json` passes `--no-sandbox` so headless Chrome can run in CI/containers.
