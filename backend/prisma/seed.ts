import { PrismaClient, Role, ComponentType, ValueType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Base system users
  const users = [
    { email: 'admin@sahu.com', password: 'Password123!', role: Role.ADMIN, name: 'Admin User' },
    { email: 'manager@sahu.com', password: 'Password123!', role: Role.MANAGER, name: 'Manager User' },
    { email: 'hr@sahu.com', password: 'Password123!', role: Role.HR, name: 'HR User' },
    { email: 'employee@sahu.com', password: 'Password123!', role: Role.USER, name: 'Employee User' },
    { email: 'finance@sahu.com', password: 'Password123!', role: Role.FINANCE, name: 'Finance User' }, // Finance Admin
  ];

  const createdUsers: Record<string, any> = {};

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10);

    let user = await prisma.user.findUnique({ where: { email: u.email } });

    if (!user) {
      // create new user + employee profile
      user = await prisma.user.create({
        data: {
          email: u.email,
          password: hashedPassword,
          role: u.role,
          employee: {
            create: {
              name: u.name,
              phone: '9999999999',
            },
          },
        },
        include: { employee: true },
      });
      console.log(`✅ Created ${u.role}: ${u.email}`);
    } else {
      // fetch with employee relation if already exists
      user = await prisma.user.findUnique({
        where: { email: u.email },
        include: { employee: true },
      });
      console.log(`ℹ️ ${u.role} already exists: ${u.email}`);
    }

    createdUsers[u.role] = user;
  }

  // Link default employee → manager
  if (createdUsers['USER'] && createdUsers['MANAGER']) {
    await prisma.employee.update({
      where: { id: createdUsers['USER'].employee.id },
      data: { managerId: createdUsers['MANAGER'].employee.id },
    });
    console.log(
      `🔗 Linked ${createdUsers['USER'].email} to manager ${createdUsers['MANAGER'].email}`,
    );
  }

  // Create default salary structure if not exists
  let salaryStruct = await prisma.salaryStructure.findFirst();
  if (!salaryStruct) {
    salaryStruct = await prisma.salaryStructure.create({
      data: {
        name: 'Default Structure',
        components: {
          create: [
            {
              key: 'basic',
              label: 'Basic',
              type: ComponentType.EARNING,
              valueType: ValueType.FIXED,
              value: 20000,
              order: 1,
            },
            {
              key: 'hra',
              label: 'HRA',
              type: ComponentType.EARNING,
              valueType: ValueType.PERCENTAGE,
              value: 20,
              order: 2,
            },
            {
              key: 'conveyance',
              label: 'Conveyance',
              type: ComponentType.EARNING,
              valueType: ValueType.FIXED,
              value: 1600,
              order: 3,
            },
            {
              key: 'pf',
              label: 'PF',
              type: ComponentType.DEDUCTION,
              valueType: ValueType.PERCENTAGE,
              value: 12,
              order: 10,
            },
          ],
        },
      },
    });
    console.log('✅ Created Default Salary Structure');
  }

  // Assign salary to every employee (if not already assigned)
  const employees = await prisma.employee.findMany();
  for (const emp of employees) {
    const existingSalary = await prisma.employeeSalary.findFirst({
      where: { employeeId: emp.id },
    });

    if (!existingSalary) {
      await prisma.employeeSalary.create({
        data: {
          employeeId: emp.id,
          structureId: salaryStruct.id,
          basic: 20000, // can be varied later role-wise
          effectiveFrom: new Date(),
        },
      });
      console.log(`💰 Salary assigned to ${emp.name}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
