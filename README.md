# CocoRapado - Barber Shop Management System

Sistema web completo para gestión operativa y financiera de una barbería.

## Requisitos Previos
- Node.js (v18+)
- PostgreSQL (v14+)
- pnpm o npm

## 1. Configuración de Base de Datos y Backend

1. Entra a la carpeta del backend e instala dependencias:
   ```bash
   cd backend
   npm install
   ```

2. Configura las variables de entorno en `backend/.env`:
   ```env
   DATABASE_URL="postgresql://usuario:password@localhost:5432/cocorapado?schema=public"
   JWT_ACCESS_SECRET="tu-secreto-access-super-seguro"
   JWT_REFRESH_SECRET="tu-secreto-refresh-super-seguro"
   PORT=3001
   ```

3. Genera el cliente de Prisma y ejecuta las migraciones:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. Corre el Seed para poblar datos base (Administrador, Servicios, Barberos de ejemplo):
   ```bash
   npm run seed
   # (O ejecuta npx prisma db seed si está configurado en el package.json)
   ```

5. Inicia el servidor backend en modo dev:
   ```bash
   npm run start:dev
   ```

## 2. Configuración del Frontend

1. Entra a la carpeta del frontend e instala dependencias:
   ```bash
   cd frontend
   npm install
   ```

2. Configura las variables de entorno en `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:3001"
   ```

3. Inicia el entorno de desarrollo:
   ```bash
   npm run dev
   ```
   El frontend estará corriendo en `http://localhost:3000`.

## 3. Notas de Operación y Cron Jobs
- **Trabajo "SIN_COBRO":** El backend de NestJS incluye un `CronJob` que se ejecuta cada 5 minutos (configurado usando `@nestjs/schedule`), verificando cortes que tengan estado `FINISHED`, sin un pago asociado y cuyo `finished_at` haya pasado hace más de 2 horas, para pasarlos a `SIN_COBRO`.
- **SSE (Realtime):** El frontend consume `GET /events` para actualizar el tablero en tiempo real.
