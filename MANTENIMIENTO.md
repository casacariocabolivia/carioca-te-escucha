# Carioca Te Escucha — Guía de Mantenimiento

## URLs en producción

| Pantalla | URL | Acceso |
|---|---|---|
| Feedback del cliente (QR) | https://carioca-te-escucha.netlify.app/feedback/centro | Público |
| Tablero del supervisor | https://carioca-te-escucha.netlify.app/dashboard | Login |
| Historial de vendedores | https://carioca-te-escucha.netlify.app/historial | Login |
| Configuración de alertas | https://carioca-te-escucha.netlify.app/alertas | Login |
| Página QR para imprimir | https://carioca-te-escucha.netlify.app/qr | Público |
| Login del equipo | https://carioca-te-escucha.netlify.app/login | — |

---

## Usuarios del sistema

| Nombre | Email | Contraseña | Rol |
|---|---|---|---|
| Supervisor | supervisor@carioca.com | carioca2026 | Supervisor |
| Edwin | edwin@carioca.com | carioca2026 | Vendedor |
| Elias | elias@carioca.com | carioca2026 | Vendedor |
| Alvaro | alvaro@carioca.com | carioca2026 | Vendedor |
| Silvia | silvia@carioca.com | carioca2026 | Vendedor |

> ⚠️ Cambiar las contraseñas antes de usar en producción real.

---

## Variables de entorno

Están configuradas en **Netlify → Site configuration → Environment variables**.

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión a la base de datos PostgreSQL en Neon |
| `NEXTAUTH_SECRET` | Clave secreta para cifrar sesiones de login |
| `NEXTAUTH_URL` | URL pública de la app (`https://carioca-te-escucha.netlify.app`) |

Para desarrollo local se guardan en el archivo `.env.local` (no se sube a GitHub).

---

## Infraestructura

| Servicio | Plataforma | URL de administración |
|---|---|---|
| App web | Netlify | https://app.netlify.com |
| Base de datos | Neon (PostgreSQL) | https://console.neon.tech |
| Código fuente | GitHub | https://github.com/casacariocabolivia/carioca-te-escucha |

**Flujo de deploy:** cada `git push` a la rama `main` dispara un deploy automático en Netlify.

---

## Stack tecnológico

- **Framework:** Next.js 14 (App Router)
- **Base de datos:** PostgreSQL via Neon + Prisma ORM
- **Autenticación:** NextAuth.js v4
- **Estilos:** Tailwind CSS + fuente DM Sans
- **Lenguaje:** TypeScript

---

## Comandos útiles (desarrollo local)

```bash
# Instalar dependencias
npm install

# Correr en local
npm run dev

# Aplicar cambios del schema a la BD
npm run db:push

# Poblar la BD con datos iniciales (vendedores, tienda, reglas)
npm run db:seed

# Aplicar schema + seed en un solo comando
npm run db:setup

# Abrir interfaz visual de la BD
npm run db:studio
```

---

## Tareas comunes de mantenimiento

### Limpiar feedbacks de prueba
```bash
# En la terminal del proyecto
npx ts-node --compiler-options '{"module":"CommonJS"}' -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  await p.task.deleteMany();
  await p.alert.deleteMany();
  await p.feedback.deleteMany();
  console.log('BD limpia');
}
main().finally(() => p.\$disconnect());
"
```

### Cambiar nombre de un vendedor
Edita `prisma/seed.ts` con el nuevo nombre y corre:
```bash
npm run db:seed
```
O cambia directamente desde **Neon → SQL Editor**:
```sql
UPDATE "User" SET name = 'Nuevo Nombre' WHERE email = 'vendedor@carioca.com';
```

### Agregar un nuevo vendedor
1. Entra a Neon → SQL Editor
2. Primero obtén el `storeId`:
```sql
SELECT id FROM "Store" WHERE slug = 'centro';
```
3. Inserta el nuevo usuario (reemplaza los valores):
```sql
INSERT INTO "User" (id, name, email, password, role, "storeId", "createdAt")
VALUES (gen_random_uuid(), 'Nombre', 'email@carioca.com', 'HASH', 'VENDOR', 'STORE_ID', NOW());
```
> La contraseña debe ser un hash bcrypt. Lo más fácil es agregarlo en `prisma/seed.ts` y correr `npm run db:seed`.

### Desactivar una regla de alerta temporalmente
En la app: **Alertas → toggle del switch** de la regla.

### Ver todos los feedbacks en la BD
En **Neon → SQL Editor**:
```sql
SELECT f.*, u.name as vendedor
FROM "Feedback" f
LEFT JOIN "User" u ON f."vendorId" = u.id
ORDER BY f."createdAt" DESC;
```

---

## Reglas de alerta configuradas por defecto

| Nombre | Tipo | Condición |
|---|---|---|
| Calificación crítica | Umbral | Rating ≤ 1 |
| Palabra clave: fraude | Keyword | Comentario contiene "fraude" |

Se pueden agregar más desde la pantalla `/alertas`.

---

## Hacer un cambio en el código

1. Edita los archivos en el proyecto local
2. Corre `npm run dev` para probar localmente
3. Sube el cambio:
```bash
git add -A
git commit -m "descripción del cambio"
git push
```
4. Netlify despliega automáticamente en ~2 minutos.

### Revertir el último cambio
```bash
git revert HEAD --no-edit && git push
```
