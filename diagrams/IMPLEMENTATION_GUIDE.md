# Developer Implementation Guide

A step-by-step guide to implement the architecture in
[`btp-workzone-umbraco-architecture.mmd`](./btp-workzone-umbraco-architecture.mmd)
(a web app on the **SAP BTP HTML5 Application Repository** that consumes **SAP Build Work Zone,
Standard Edition** for navigation/links and **Umbraco Headless CMS** for content via the
**Destination Service + Cloud Connector**).

Read the diagram top-to-bottom: an end user hits the app in the **Cloud (SAP BTP)** environment,
the app reads links from Work Zone, and it reaches Umbraco in the **On-Premise (Customer)**
environment through a secure tunnel. This guide implements each box and arrow in that picture.

---

## How to read the diagram

| Diagram element | What it is | Where you configure it |
| --- | --- | --- |
| End User → Custom Domain/CDN | Browser entry point | BTP subaccount / Custom Domain service |
| Approuter / Launchpad module | Serves the app, manages sessions & auth | `approuter` or Work Zone site |
| IAS + XSUAA | Authentication + authorization | SAP Cloud Identity Services + `xsuaa` |
| HTML5 Application Repository | Static hosting of the web app | `html5-apps-repo` service + MTA deploy |
| Web App (SAPUI5/Fiori/SPA) | Your front-end code | your app module |
| SAP Build Work Zone (Std) | Site & navigation APIs (builds links) | Work Zone Standard Edition subscription |
| Destination Service | Endpoint + auth config for backends | `destination` service, destinations |
| Connectivity Service | Proxy for on-prem calls | `connectivity` service |
| Cloud Connector | Secure reverse-proxy agent on-prem | Cloud Connector admin UI (on-prem) |
| Firewall / Reverse Proxy → Umbraco | On-prem CMS delivery API | Customer network + Umbraco |

---

## Prerequisites

- An **SAP BTP** global account + a **subaccount** (Cloud Foundry runtime enabled, or Kyma).
- Entitlements for: **SAP Build Work Zone, Standard Edition**, **HTML5 Application Repository**,
  **Destination**, **Connectivity**, **Authorization & Trust Management (XSUAA)**.
- **SAP Cloud Identity Services (IAS)** tenant established as trust for the subaccount (recommended).
- A running **Umbraco** instance (v10+/Heartcore-style) with the **Content Delivery API** enabled,
  reachable inside the customer network.
- A host in the customer landscape to install the **SAP Cloud Connector** (JDK + Cloud Connector).
- Local tooling: **Node.js 18+**, `npm`, **`@sap/cds` / MTA Build Tool (`mbt`)** (optional but
  recommended), **Cloud Foundry CLI** (`cf`) with the **MultiApps** plugin, and the **UI5 CLI**.

---

## Step 1 — Prepare the BTP subaccount

1. In the BTP cockpit, open your **subaccount** and enable the **Cloud Foundry** runtime (create an org/space).
2. Under **Entitlements**, add the services listed in Prerequisites and **save**.
3. Under **Instances & Subscriptions**, subscribe to **SAP Build Work Zone, Standard Edition**.
4. Assign yourself the Work Zone admin role collections (e.g. `Launchpad_Admin`).

## Step 2 — Configure identity & trust (IAS + XSUAA)

1. In the subaccount, go to **Security → Trust Configuration** and establish trust to your **IAS** tenant.
2. In IAS, create/import the users (or federate with the corporate IdP) that will use the app.
3. Define app **roles/scopes** in your XSUAA config (`xs-security.json`) — e.g. a `Viewer` scope.
4. Map scopes to **role collections** and assign them to users/groups.

```jsonc
// xs-security.json
{
  "xsappname": "workzone-umbraco-app",
  "tenant-mode": "dedicated",
  "scopes": [{ "name": "$XSAPPNAME.Viewer", "description": "View content" }],
  "role-templates": [
    { "name": "Viewer", "description": "Viewer", "scope-references": ["$XSAPPNAME.Viewer"] }
  ]
}
```

## Step 3 — Install & configure the Cloud Connector (on-premise)

This implements the **On-Premise** side of the diagram and the secure tunnel.

1. On a host in the customer landscape, install the **SAP Cloud Connector** (JDK + SCC package).
2. Open the Cloud Connector admin UI (`https://<host>:8443`).
3. **Connect to your BTP subaccount**: add subaccount → region host, subaccount ID, and an
   S-user/technical user with connectivity permissions. A green status means the tunnel is up.
4. Add a **Cloud To On-Premise** system mapping:
   - **Internal host/port** = the real Umbraco host (e.g. `umbraco.internal:443`).
   - **Virtual host/port** = an alias the cloud will use (e.g. `umbraco-cms:443`). *Never expose the
     real hostname to the cloud.*
   - **Protocol** = HTTPS; **Backend type** = Non-SAP System (Generic).
5. Under **Resources**, whitelist only the Content Delivery API paths, e.g. `/umbraco/delivery/api`
   (path + sub-paths). Everything not whitelisted is blocked.
6. (Optional) Configure **Principal Propagation** if Umbraco must know the end-user identity;
   otherwise use a technical user / API key.

## Step 4 — Create the Destination(s) in BTP

This implements the **Destination Service** box and the arrow into on-prem.

1. In the subaccount, go to **Connectivity → Destinations → New Destination**.
2. Create the **Umbraco (on-prem)** destination:

```properties
Name=umbraco-cms
Type=HTTP
URL=https://umbraco-cms:443        # the VIRTUAL host from the Cloud Connector
ProxyType=OnPremise                # <- critical: routes via Connectivity Service + Cloud Connector
Authentication=NoAuthentication    # or BasicAuthentication / PrincipalPropagation / apikey header
WebIDEEnabled=true
HTML5.DynamicDestination=true
# If Umbraco needs an API key header:
# URL.headers.Api-Key=<your-umbraco-delivery-api-key>
```

3. (Optional) Create a **Work Zone** destination only if you call Work Zone APIs from a backend;
   for front-end calls you typically use the launchpad-provided endpoints directly.

## Step 5 — Model content & navigation

1. In **Umbraco**, enable the **Content Delivery API**, model your document types, and publish content.
   Note the endpoint shape: `GET /umbraco/delivery/api/v2/content?filter=...`.
2. In **SAP Build Work Zone (Standard Edition)**, build the **Site**: create groups, roles, and
   assign apps/links per role so links are rendered per user. This is what the diagram calls
   "builds user links."

## Step 6 — Scaffold the web app

Use the SAP Fiori generator (or plain UI5). Project layout for an MTA deployment:

```
workzone-umbraco-app/
├── mta.yaml                 # deployment descriptor (Step 8)
├── xs-security.json         # from Step 2
├── app/                     # UI5 / Fiori / SPA source
│   ├── webapp/
│   │   ├── manifest.json    # data sources point to destinations
│   │   └── ...
│   └── package.json
└── approuter/               # optional standalone approuter (or use Work Zone runtime)
    └── xs-app.json          # routing rules to destinations
```

Point the app's data sources at the destinations via the approuter/HTML5 repo path. Example
`xs-app.json` routes:

```jsonc
{
  "authenticationMethod": "route",
  "routes": [
    {
      "source": "^/umbraco/(.*)$",
      "target": "/umbraco/delivery/api/$1",
      "destination": "umbraco-cms",          // -> on-prem via Cloud Connector
      "authenticationType": "xsuaa"
    },
    { "source": "^(.*)$", "target": "$1", "service": "html5-apps-repo", "authenticationType": "xsuaa" }
  ]
}
```

## Step 7 — Consume the APIs from the front end

- **Work Zone links/navigation**: read the launchpad/site navigation the app is running in
  (Work Zone injects the shell), or call the Work Zone site/OData APIs for tiles the user is entitled to.
- **Umbraco content**: call the *relative* app path so it is proxied through the approuter →
  destination → Cloud Connector. Never call the on-prem URL directly from the browser.

```javascript
// Runs in the browser; the approuter proxies /umbraco/* to the on-prem destination.
async function getContent(alias) {
  const res = await fetch(`/umbraco/v2/content/item/${encodeURIComponent(alias)}`, {
    headers: { Accept: "application/json" },
    credentials: "include", // carries the app session (XSUAA)
  });
  if (!res.ok) throw new Error(`Umbraco error ${res.status}`);
  return res.json();
}
```

## Step 8 — Deploy to the HTML5 Application Repository

1. Describe the app in `mta.yaml` binding `html5-apps-repo`, `destination`, `connectivity`, `xsuaa`:

```yaml
_schema-version: "3.2"
ID: workzone-umbraco-app
version: 1.0.0
modules:
  - name: app-content
    type: com.sap.application.content
    requires:
      - name: html5-repo-host
        parameters: { content-target: true }
    build-parameters:
      build-result: resources
      requires:
        - name: workzone-umbraco-ui
          artifacts: [workzone-umbraco-ui.zip]
          target-path: resources/
resources:
  - name: html5-repo-host
    type: org.cloudfoundry.managed-service
    parameters: { service: html5-apps-repo, service-plan: app-host }
  - name: uaa
    type: org.cloudfoundry.managed-service
    parameters: { service: xsuaa, service-plan: application, path: ./xs-security.json }
  - name: dest-service
    type: org.cloudfoundry.managed-service
    parameters: { service: destination, service-plan: lite }
```

2. Build and deploy:

```bash
mbt build                          # produces mta_archives/*.mtar
cf login                           # target your org/space
cf deploy mta_archives/workzone-umbraco-app_1.0.0.mtar
```

3. In **Work Zone**, add the deployed HTML5 app to a **Content** entry and assign it to a role/group
   so it appears in the site for entitled users.

## Step 9 — End-to-end test

1. Open the Work Zone site URL as a test user → confirm login via IAS and that **links render per role**.
2. Open the app → confirm **Umbraco content loads** (network tab shows calls to `/umbraco/...`, not the
   internal host).
3. In the **Cloud Connector** UI, check **Monitoring → Most Recent Requests** to confirm traffic is
   flowing through the tunnel.

## Step 10 — Harden & operate

- Restrict Cloud Connector resources to the minimum paths; rotate API keys / use principal propagation.
- Enable **Custom Domain** + TLS for the productive tenant (the "Custom Domain/CDN" box).
- Add **CORS**/CSP as needed; keep all backend calls behind the approuter (no direct on-prem exposure).
- Set up **High Availability** for the Cloud Connector (install a shadow instance).
- Configure logging/alerting: BTP Application Logging, Cloud Connector audit logs, Umbraco logs.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `503`/`502` on `/umbraco/*` | Cloud Connector down or path not whitelisted | Check SCC status + Resources list |
| `403` from app | Missing role collection / scope | Assign Work Zone + XSUAA roles to the user |
| Content loads locally, not in cloud | Called internal host directly | Use the virtual host + relative app path |
| Login loop | Trust to IAS misconfigured | Re-check Trust Configuration + IAS app |
| Empty links in Work Zone | User not assigned to role/group | Assign apps to the user's role in Work Zone |
