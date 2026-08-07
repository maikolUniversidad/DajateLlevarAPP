# CI pendiente de activar

El flujo de CI (`ci.yml`) está aquí y no en `.github/workflows/` porque el token
con el que se hizo el primer push no tenía el permiso `workflow` de GitHub.

Para activarlo, en tu máquina:

```bash
# 1. Concede el permiso workflow al CLI de GitHub (abre el navegador una vez)
gh auth refresh -h github.com -s workflow

# 2. Mueve el archivo a su lugar y súbelo
git mv .github/workflows-pending/ci.yml .github/workflows/ci.yml
git commit -m "ci: activar GitHub Actions"
git push
```

A partir de ahí, cada push a `main` y cada PR correrán typecheck, lint, pruebas,
migraciones + seed y build.
