# Hiera

Hiera es un estudio local-first para inspeccionar exportaciones JSON de LuckPerms, resolver herencias de grupos y aplicar catálogos de permisos trazables.

## Estado actual

- Landing pública en español con guía de exportación e importación de LuckPerms.
- Estudio local: importa un JSON en el navegador, muestra grupos, usuarios, herencias y permisos efectivos.
- Catálogo inicial: AuthMe Reloaded, con origen, versión, fecha, clasificación y recomendaciones.
- Exportación explícita de un nuevo JSON; ningún backup se envía a un servidor.
- Guía pública de resolución en `/guia/permisos` y catálogo verificable de AuthMe Reloaded en `/catalogos/authme-reloaded`.

## Flujo de LuckPerms

1. En consola, crea un backup: `/lp export hiera-backup.json`.
2. Ábrelo desde `/studio` usando **Importar backup**.
3. Revisa permisos directos, herencias, contextos y procedencia; después añade una selección del catálogo o un permiso personalizado.
4. Descarga el resultado e impórtalo en un entorno de pruebas con `/lp import hiera-luckperms-backup.json --replace`.

`--replace` reemplaza datos existentes. Haz una copia y valida en staging antes de usarlo en producción.

## Catálogos

El esquema de `PermissionCatalog` en `src/lib/permissions.ts` exige:

- Identificador estable, nombre, versión y fecha de actualización.
- Página de distribución y URL de la fuente documental.
- Permisos tipados con descripción, categoría y audiencias recomendadas.

Esto permite añadir futuros catálogos sin acoplarlos a la interfaz ni mezclar forks de plugins con nombres similares.

Cada registro representa una fuente documental y versión concretas. Un fork o una distribución compatible debe declararse como un registro distinto: Hiera no infiere que sus permisos sean idénticos.

## Cómo resuelve Hiera

- Un permiso **directo** está definido en el grupo o usuario seleccionado.
- Un permiso **heredado** llega a través de una membresía o un padre de grupo; la interfaz conserva su origen.
- Un permiso **contextual** solo aplica si todos sus pares clave-valor coinciden con el contexto activo local. Para valores en lista basta una coincidencia por clave y no se distinguen mayúsculas.
- Hiera prefiere un nodo directo aplicable sobre uno heredado. Dentro de la misma fuente prefiere el contexto más específico. Los empates de igual especificidad con valores opuestos se señalan como conflicto y conservan el primer nodo del backup como resultado determinista.

La resolución no reproduce calculadores, extensiones o configuración externa de LuckPerms. Consulta `/guia/permisos` para el detalle y valida siempre el resultado en staging.

## Desarrollo

```bash
bun install
bun run dev
bun run lint
bun run test
bun run build
bun run test:e2e
```

El repositorio usa Bun como gestor único de dependencias. El lockfile canónico es `bun.lock`; no se debe generar ni mantener un `package-lock.json`.

## Privacidad

La importación, resolución de permisos y exportación se ejecutan en el cliente. Hiera no transmite UUIDs, grupos ni configuraciones de LuckPerms.

## Arquitectura

- `src/components/studio.tsx` coordina el estado efímero de la sesión local.
- `src/lib/luckperms/` concentra lectura, validación, edición, serialización y resolución como reglas puras probadas.
- `src/components/studio/` separa las superficies de grupos, usuarios, catálogo, exportación, historial y resolución.
- Las rutas públicas solo describen el producto y catálogos documentados; no reciben ni persisten backups.
