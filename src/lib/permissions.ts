export type PermissionAudience = "admin" | "player" | "group" | "sensitive";

export type PermissionEntry = {
  node: string;
  description: string;
  audience: PermissionAudience[];
  recommendedFor?: Array<"admin" | "player">;
  category: string;
};

export type PermissionCatalog = {
  slug: string;
  name: string;
  version: string;
  updatedAt: string;
  description: string;
  website: string;
  source: string;
  sourceLabel: string;
  permissions: PermissionEntry[];
};

export type LuckPermsNode = {
  type: string;
  key: string;
  value: boolean;
  context?: Record<string, string | string[]>;
  [key: string]: unknown;
};
export type LuckPermsGroup = { nodes: LuckPermsNode[] };
export type LuckPermsUser = {
  username?: string;
  primaryGroup?: string;
  nodes: LuckPermsNode[];
};
export type LuckPermsBackup = {
  metadata?: Record<string, string>;
  groups: Record<string, LuckPermsGroup>;
  users?: Record<string, LuckPermsUser>;
  tracks?: Record<string, unknown>;
};

function authme(
  category: string,
  audience: PermissionAudience[],
  entries: Array<[string, string]>,
): PermissionEntry[] {
  return entries.map(([node, description]) => ({
    node,
    description,
    category,
    audience,
    recommendedFor: audience.includes("admin")
      ? ["admin"]
      : audience.includes("player")
        ? ["player"]
        : [],
  }));
}

export const authMeReloaded: PermissionCatalog = {
  slug: "authme-reloaded",
  name: "AuthMe Reloaded",
  version: "Latest development builds",
  updatedAt: "2026-05-06",
  description:
    "Autenticación y registro para servidores Bukkit, Spigot y Paper. La lista usa la documentación generada por el proyecto AuthMe Reloaded.",
  website: "https://modrinth.com/plugin/authmereloaded",
  source:
    "https://github.com/AuthMe/AuthMeReloaded/blob/master/docs/permission_nodes.md",
  sourceLabel: "AuthMe/AuthMeReloaded permission_nodes.md",
  permissions: [
    ...authme(
      "Administración",
      ["admin", "sensitive"],
      [
        ["authme.admin.*", "Da acceso a todos los comandos administrativos."],
        [
          "authme.admin.accounts",
          "Consulta las cuentas asociadas a un jugador.",
        ],
        [
          "authme.admin.antibotmessages",
          "Muestra mensajes del sistema AntiBot.",
        ],
        [
          "authme.admin.backup",
          "Permite usar el comando de copias de seguridad.",
        ],
        ["authme.admin.changemail", "Cambia el correo de otro jugador."],
        [
          "authme.admin.changepassword",
          "Cambia la contraseña de otro jugador.",
        ],
        [
          "authme.admin.converter",
          "Convierte datos antiguos o de otros sistemas.",
        ],
        [
          "authme.admin.firstspawn",
          "Teletransporta al primer spawn de AuthMe.",
        ],
        [
          "authme.admin.forcelogin",
          "Fuerza el inicio de sesión de una cuenta.",
        ],
        ["authme.admin.getemail", "Consulta el correo de un jugador."],
        ["authme.admin.getip", "Consulta la última IP conocida."],
        [
          "authme.admin.lastlogin",
          "Consulta la última fecha de inicio de sesión.",
        ],
        ["authme.admin.purge", "Purgea datos de usuarios antiguos."],
        [
          "authme.admin.purgeplayer",
          "Purgea los datos de un jugador concreto.",
        ],
        ["authme.admin.register", "Registra una nueva cuenta."],
        ["authme.admin.reload", "Recarga la configuración del plugin."],
        [
          "authme.admin.seeotheraccounts",
          "Muestra otras cuentas durante el inicio de sesión.",
        ],
        [
          "authme.admin.seerecent",
          "Muestra jugadores conectados recientemente.",
        ],
        ["authme.admin.setfirstspawn", "Configura el primer spawn de AuthMe."],
        ["authme.admin.setpremium", "Activa modo premium para un jugador."],
        ["authme.admin.setspawn", "Configura el spawn de AuthMe."],
        ["authme.admin.spawn", "Teletransporta al spawn de AuthMe."],
        [
          "authme.admin.switchantibot",
          "Activa o desactiva la protección AntiBot.",
        ],
        [
          "authme.admin.totpdisable",
          "Desactiva el doble factor de otro jugador.",
        ],
        ["authme.admin.totpviewstatus", "Consulta el estado de doble factor."],
        ["authme.admin.unregister", "Elimina el registro de una cuenta."],
      ],
    ),
    ...authme(
      "Diagnóstico",
      ["admin", "sensitive"],
      [
        ["authme.debug.command", "Permite usar /authme debug."],
        ["authme.debug.country", "Consulta el módulo de países."],
        ["authme.debug.db", "Consulta datos de la base de datos."],
        ["authme.debug.group", "Consulta grupos de permisos."],
        ["authme.debug.limbo", "Consulta datos de limbo."],
        ["authme.debug.mail", "Prueba el envío de correo."],
        ["authme.debug.perm", "Usa el comprobador de permisos."],
        ["authme.debug.spawn", "Consulta información de spawn."],
        ["authme.debug.stats", "Usa la sección de estadísticas."],
        ["authme.debug.valid", "Usa validación de muestra."],
      ],
    ),
    ...authme(
      "Jugadores",
      ["player"],
      [
        ["authme.player.*", "Da acceso a todos los comandos de jugador."],
        ["authme.player.captcha", "Permite usar captcha."],
        [
          "authme.player.changepassword",
          "Permite cambiar la propia contraseña.",
        ],
        ["authme.player.email", "Concede todos los permisos de correo."],
        ["authme.player.email.add", "Añade un correo propio."],
        ["authme.player.email.change", "Cambia el correo propio."],
        [
          "authme.player.email.confirm",
          "Confirma un correo con código de verificación.",
        ],
        ["authme.player.email.recover", "Recupera una cuenta con correo."],
        ["authme.player.email.see", "Muestra el correo propio."],
        ["authme.player.login", "Permite iniciar sesión."],
        ["authme.player.logout", "Permite cerrar sesión."],
        ["authme.player.register", "Permite registrarse."],
        [
          "authme.player.seeownaccounts",
          "Muestra las propias cuentas asociadas.",
        ],
        ["authme.player.totpadd", "Activa doble factor."],
        ["authme.player.totpremove", "Desactiva doble factor."],
        ["authme.player.unregister", "Permite borrar el propio registro."],
      ],
    ),
    ...authme(
      "Excepciones y capacidad",
      ["group", "sensitive"],
      [
        [
          "authme.allowchatbeforelogin",
          "Permite hablar antes de iniciar sesión.",
        ],
        ["authme.allowmultipleaccounts", "Permite registrar varias cuentas."],
        ["authme.bypassantibot", "Evita la protección AntiBot."],
        ["authme.bypassbungeesend", "Evita la teletransportación del proxy."],
        ["authme.bypasscountrycheck", "Evita la comprobación geográfica."],
        ["authme.bypassforcesurvival", "Evita el modo supervivencia forzado."],
        ["authme.bypasspurge", "Evita el proceso de purga."],
        [
          "authme.player.canbeforced",
          "Permite que un inicio de sesión sea forzado.",
        ],
        ["authme.player.freemium", "Desactiva el modo premium propio."],
        [
          "authme.player.premium",
          "Activa modo premium con cuenta Mojang verificada.",
        ],
        [
          "authme.player.protection.quickcommandsprotection",
          "Activa comprobaciones de comandos rápidos al entrar.",
        ],
        [
          "authme.player.security.verificationcode",
          "Permite usar códigos de verificación por correo.",
        ],
        ["authme.vip", "Da prioridad al entrar cuando el servidor está lleno."],
      ],
    ),
  ],
};

export const catalogs = [authMeReloaded];
