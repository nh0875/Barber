import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('Borrandos datos anteriores para hacer un nuevo seed...');
  await prisma.payment.deleteMany();
  await prisma.cut.deleteMany();
  await prisma.client.deleteMany();

  console.log('Iniciando el Seed de Datos Sintéticos...');

  // 1. Crear Administrador y Barberos (Actualiza si existen)
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password_hash: passwordHash },
    create: {
      username: 'admin',
      name: 'Admin Principal',
      role: 'ADMIN',
      password_hash: passwordHash,
    },
  });

  const barber1 = await prisma.user.upsert({
    where: { username: 'juan' },
    update: {},
    create: {
      username: 'juan',
      name: 'Juan Pérez',
      role: 'BARBER',
      password_hash: passwordHash,
    },
  });

  const barber2 = await prisma.user.upsert({
    where: { username: 'carlos' },
    update: {},
    create: {
      username: 'carlos',
      name: 'Carlos Gomez',
      role: 'BARBER',
      password_hash: passwordHash,
    },
  });

  const barbers = [barber1, barber2];

  // 2. Crear Servicios
  const servicesData = [
    { name: 'Corte Clásico', base_price: 9000, expected_duration_min: 30 },
    { name: 'Barba', base_price: 9000, expected_duration_min: 20 },
    { name: 'Corte + Barba', base_price: 12000, expected_duration_min: 60 },
    { name: 'Corte Niño', base_price: 7000, expected_duration_min: 30 },
    { name: 'Coloración Básica', base_price: 15000, expected_duration_min: 90 },
  ];

  const services = [];
  for (const s of servicesData) {
    const existing = await prisma.service.findFirst({ where: { name: s.name } });
    if (!existing) {
      services.push(await prisma.service.create({ data: s }));
    } else {
      services.push(existing);
    }
  }

  // 3. Crear Clientes Sintéticos
  const unparsedClients = [
    'Juan Rodriguez', 'Marcos Gimenez', 'Lautaro Silva', 'Federico Alvarez', 
    'Julian Sosa', 'Martin Herrera', 'Lucas Torres', 'Pedro Gonzalez', 
    'Agustin Ruiz', 'Tomas Romero', 'Matias Suarez', 'Emiliano Diaz', 
    'Maximiliano Castro', 'Alan Flores', 'Rodrigo Alonso'
  ];

  const clients = [];
  for (let i = 0; i < unparsedClients.length; i++) {
    const phone = `11${Math.floor(10000000 + Math.random() * 90000000)}`;
    const c = await prisma.client.create({
      data: {
        full_name: unparsedClients[i],
        phone
      }
    });
    clients.push(c);
  }

  console.log(`Se crearon ${clients.length} clientes.`);

  // 4. Crear Historico de Cortes y Gastos (últimos 365 días)
  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);

  const paymentMethods = ['CASH', 'TRANSFER', 'CARD'];
  let cutsCreated = 0;

  for (let i = 0; i < 900; i++) {
    const barber = barbers[Math.floor(Math.random() * barbers.length)];
    const client = clients[Math.floor(Math.random() * clients.length)];
    const service = services[Math.floor(Math.random() * services.length)];
    
    // Distribuir el 90% pagados (PAID), el 10% que terminaron huérfanos (SIN_COBRO)
    const isPaid = Math.random() > 0.1;
    const pastDate = randomDate(oneYearAgo, new Date(now.getTime() - 86400000)); // Antes de hoy

    const finishedDate = new Date(pastDate.getTime() + service.expected_duration_min * 60000);
    const status = isPaid ? 'PAID' : 'SIN_COBRO';
    
    const cut = await prisma.cut.create({
      data: {
        barber_id: barber.id,
        client_id: client.id,
        service_id: service.id,
        status: status,
        price_snapshot: service.base_price,
        created_at: pastDate,
        started_at: pastDate,
        finished_at: finishedDate,
        paid_at: isPaid ? new Date(finishedDate.getTime() + 1000 * 60 * 5) : null,
      }
    });

    if (isPaid) {
      // Modificar un poco el monto para dar realismo a las gráficas (entre el 80% y 120% del precio base)
      const varPrice = service.base_price * (0.8 + Math.random() * 0.4);
      await prisma.payment.create({
        data: {
          cut_id: cut.id,
          method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          amount: Math.round(varPrice),
          created_at: cut.paid_at!,
        }
      });
    }
    cutsCreated++;
  }

  console.log(`Se crearon ${cutsCreated} cortes históricos.`);

  // Generar gastos aleatorios en el último año
  const expenseCategories = ['INSUMOS', 'SUELDOS', 'IMPUESTOS', 'ALQUILER', 'OTROS'];
  const expenseDescriptions = {
    'INSUMOS': ['Shampoo y cremas', 'Navajas', 'Toallas', 'Geles y fijadores', 'Productos de limpieza'],
    'SUELDOS': ['Sueldo Juan', 'Sueldo Carlos', 'Bono a empleado', 'Adelanto de sueldo'],
    'IMPUESTOS': ['Monotributo', 'Ingresos Brutos', 'Municipalidad', 'Servicios Agua y Luz'],
    'ALQUILER': ['Pago mensual', 'Expensas', 'Mantenimiento'],
    'OTROS': ['Reparación de máquina', 'Café y bebidas', 'Marketing', 'Publicidad en IG']
  };

  let expensesCreated = 0;
  for (let i = 0; i < 200; i++) {
    const pastDate = randomDate(oneYearAgo, now);
    const cat = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
    const descs = expenseDescriptions[cat as keyof typeof expenseDescriptions];
    const desc = descs[Math.floor(Math.random() * descs.length)];
    
    let amount = 0;
    if (cat === 'ALQUILER') amount = 150000 + (Math.random() * 50000);
    else if (cat === 'SUELDOS') amount = 80000 + (Math.random() * 120000);
    else if (cat === 'IMPUESTOS') amount = 10000 + (Math.random() * 30000);
    else amount = 5000 + (Math.random() * 25000); // INSUMOS y OTROS

    await prisma.expense.create({
      data: {
        description: desc,
        amount: Math.round(amount),
        category: cat,
        date: pastDate
      }
    });
    expensesCreated++;
  }

  console.log(`Se crearon ${expensesCreated} gastos históricos.`);

  // 5. Crear Cortes para Hoy (Board actual)
  const todayStart = new Date();
  todayStart.setHours(9, 0, 0, 0);

  const todayStatus = [
    { s: 'WAITING', count: 12 },
    { s: 'IN_PROGRESS', count: 8 },
    { s: 'FINISHED', count: 15 }, // Terminados pero no pagados
    { s: 'PAID', count: 24 },
  ];

  let todayCuts = 0;
  for (const ts of todayStatus) {
    for (let i = 0; i < ts.count; i++) {
      const barber = barbers[Math.floor(Math.random() * barbers.length)];
      const client = clients[Math.floor(Math.random() * clients.length)];
      const service = services[Math.floor(Math.random() * services.length)];
      
      const createdDate = new Date(todayStart.getTime() + Math.random() * (now.getTime() - todayStart.getTime()));

      await prisma.cut.create({
        data: {
          barber_id: Math.random() > 0.5 ? barber1.id : barber2.id, // Balancear un poco para el demo
          client_id: client.id,
          service_id: service.id,
          status: ts.s,
          price_snapshot: service.base_price,
          created_at: createdDate,
          started_at: ['IN_PROGRESS', 'FINISHED', 'PAID'].includes(ts.s) ? new Date(createdDate.getTime() + 1000 * 60 * 5) : null,
          finished_at: ['FINISHED', 'PAID'].includes(ts.s) ? new Date(createdDate.getTime() + 1000 * 60 * 35) : null,
          paid_at: ts.s === 'PAID' ? new Date(createdDate.getTime() + 1000 * 60 * 40) : null,
        }
      }).then(async (cut) => {
        if (ts.s === 'PAID') {
           await prisma.payment.create({
            data: {
              cut_id: cut.id,
              method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
              amount: service.base_price,
              created_at: cut.paid_at!,
            }
          });
        }
      });
      todayCuts++;
    }
  }

  console.log(`Se crearon ${todayCuts} cortes para el tablero de HOY.`);

  console.log('✅ Seed ejecutado con éxito');
  console.log(`Admin User: ${admin.username} / Pass: admin123`);
  console.log(`Barber 1: ${barber1.username} / Pass: 123456`);
  console.log(`Barber 2: ${barber2.username} / Pass: 123456`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });