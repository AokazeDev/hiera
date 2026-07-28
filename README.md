# Hiera

Hiera es un estudio local-first para inspeccionar exportaciones JSON de LuckPerms, resolver herencias de grupos y aplicar catálogos de permisos trazables.

## Estado actual

- Landing pública en español con guía de exportación e importación de LuckPerms.
- Estudio local: importa un JSON en el navegador, muestra grupos, usuarios, herencias y permisos efectivos.
- Catálogo inicial: AuthMe Reloaded, con origen, versión, fecha, clasificación y recomendaciones.
- Exportación explícita de un nuevo JSON; ningún backup se envía a un servidor.

## Flujo de LuckPerms

1. En consola, crea un backup: `/lp export hiera-backup.json`.
2. Ábrelo desde `/studio` usando **Importar backup**.
3. Revisa las herencias y añade una selección del catálogo al grupo activo.
4. Descarga el resultado e impórtalo en un entorno de pruebas con `/lp import hiera-luckperms-backup.json --replace`.

`--replace` reemplaza datos existentes. Haz una copia y valida en staging antes de usarlo en producción.

## Catálogos

El esquema de `PermissionCatalog` en `src/lib/permissions.ts` exige:

- Identificador estable, nombre, versión y fecha de actualización.
- Página de distribución y URL de la fuente documental.
- Permisos tipados con descripción, categoría y audiencias recomendadas.

Esto permite añadir futuros catálogos sin acoplarlos a la interfaz ni mezclar forks de plugins con nombres similares.

## Desarrollo

```bash
bun install
bun run dev
bun run lint
bun run build
```

El repositorio usa Bun como gestor único de dependencias. El lockfile canónico es `bun.lock`; no se debe generar ni mantener un `package-lock.json`.

## Privacidad

La importación, resolución de permisos y exportación se ejecutan en el cliente. Hiera no transmite UUIDs, grupos ni configuraciones de LuckPerms.
