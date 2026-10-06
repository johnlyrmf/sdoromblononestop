# SDO Romblon OneStop

This workspace contains the starting concept for the Schools Division Office of Romblon OneStop Service Portal.

## What is inside

- `assets/logos/` — official logos supplied for the project
- `docs/` — the proposed system design and architecture
- `portal/` — a visual starter page for the public portal
- `firebase/` — Firestore rules, indexes, deployment configuration, and Firebase/Google Drive notes

## Initial product direction

The portal is one place for employees, schools, and clients to submit a request, follow its progress, receive released documents, and communicate with the responsible unit. Unit staff use the same system but see only the services and requests assigned to their own unit.

Open `portal/index.html` in a browser to view the starter design.

## Deploy to Vercel

Import this repository with the Vercel project **Root Directory** set to the repository root (the default). Use the **Other** framework preset with no build command and no custom output directory. The root `index.html` forwards visitors to `/portal/`, where the portal pages and their shared assets are served from the correct paths. Do not set the project root to `portal/`, because the shared `assets/` directory is a sibling of that folder.
