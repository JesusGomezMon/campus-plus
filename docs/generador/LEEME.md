# Generador de la documentación

Los documentos se construyen a partir de los resultados reales de las pruebas.

```bash
# 1. Resultados (se guardan en reportes/ y coverage/)
node --env-file=.env.local node_modules/vitest/vitest.mjs run --coverage --coverage.reporter=json-summary --reporter=json --outputFile=reportes/vitest.json
npx playwright test --reporter=json > reportes/e2e.json
npm run db:verificar > reportes/verificacion-supabase.txt
npm run db:medir
# Lighthouse: reportes/lighthouse.report.json (perfil móvil sobre `vite preview`)

# 2. Capturas y diagramas
node docs/generador/capturas.mjs     # requiere vite preview --port 4174 en modo e2e
node docs/generador/diagramas.mjs

# 3. Documentos .docx (y PDF con Microsoft Word)
node docs/generador/generar.mjs
powershell -File docs/generador/word-pdf.ps1
```
