import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const usersService = app.get(UsersService);
  const usersRepository = app.get(getRepositoryToken(User));

  console.log('🔐 Создание администратора...\n');

  // Параметры админа (можно изменить)
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@supermock.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminName = process.env.ADMIN_NAME || 'Admin';

  try {
    // Проверяем, существует ли уже админ с таким email
    let admin = await usersService.findByEmail(adminEmail);
    
    if (admin) {
      // Если пользователь существует, обновляем его роль на админа
      if (admin.role !== UserRole.ADMIN) {
        admin.role = UserRole.ADMIN;
        admin.status = UserStatus.PREMIUM;
        admin = await usersRepository.save(admin);
        console.log(`✅ Роль пользователя ${adminEmail} обновлена на ADMIN`);
      } else {
        console.log(`ℹ️  Администратор ${adminEmail} уже существует`);
      }
      console.log(`\n📧 Email: ${adminEmail}`);
      console.log(`🔑 Пароль: ${adminPassword}`);
      console.log(`👤 Имя: ${admin.name}`);
      console.log(`🎭 Роль: ${admin.role}`);
      console.log(`💎 Статус: ${admin.status}\n`);
    } else {
      // Создаем нового админа
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const newAdmin = usersRepository.create({
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        status: UserStatus.PREMIUM,
        role: UserRole.ADMIN,
        points: 0,
      });
      admin = await usersRepository.save(newAdmin);
      
      console.log(`✅ Администратор успешно создан!\n`);
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Пароль: ${adminPassword}`);
      console.log(`👤 Имя: ${admin.name}`);
      console.log(`🎭 Роль: ${admin.role}`);
      console.log(`💎 Статус: ${admin.status}\n`);
    }

    console.log('🎉 Готово! Теперь вы можете войти как администратор.\n');
  } catch (error) {
    console.error('❌ Ошибка при создании администратора:', error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();

