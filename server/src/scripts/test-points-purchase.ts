import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { PaymentsService } from '../payments/payments.service';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PurchaseRequest, PurchaseRequestStatus } from '../payments/entities/purchase-request.entity';
import { TransactionType } from '../payments/entities/transaction.entity';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const usersService = app.get(UsersService);
  const paymentsService = app.get(PaymentsService);
  const usersRepository = app.get(getRepositoryToken(User));
  const purchaseRequestRepository = app.get(getRepositoryToken(PurchaseRequest));

  console.log('🚀 Начинаем тестирование покупки поинтов...\n');

  try {
    // Создаем или получаем тестового пользователя
    let testUser = await usersService.findByEmail('testuser@points.com');
    if (!testUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = usersRepository.create({
        email: 'testuser@points.com',
        password: hashedPassword,
        name: 'Тестовый Пользователь',
        status: UserStatus.FREE,
        role: UserRole.USER,
        points: 0, // Начинаем с 0 поинтов
      });
      testUser = await usersRepository.save(user);
      console.log(`✅ Создан тестовый пользователь: ${testUser!.name} (${testUser!.email})`);
    } else {
      console.log(`ℹ️  Используем существующего пользователя: ${testUser!.name} (${testUser!.email})`);
      console.log(`   Текущий баланс поинтов: ${testUser!.points}`);
    }

    if (!testUser) {
      throw new Error('Не удалось создать или получить тестового пользователя');
    }

    // Создаем или получаем тестового админа
    let testAdmin: User | null = await usersService.findByEmail('admin@points.com');
    if (!testAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = usersRepository.create({
        email: 'admin@points.com',
        password: hashedPassword,
        name: 'Тестовый Админ',
        status: UserStatus.PREMIUM,
        role: UserRole.ADMIN,
        points: 0,
      });
      testAdmin = await usersRepository.save(admin);
      console.log(`✅ Создан тестовый админ: ${testAdmin!.name} (${testAdmin!.email})`);
    } else {
      console.log(`ℹ️  Используем существующего админа: ${testAdmin!.name} (${testAdmin!.email})`);
    }

    if (!testAdmin) {
      throw new Error('Не удалось создать или получить тестового админа');
    }

    // После проверок гарантируем, что переменные не null
    const user = testUser;
    const admin = testAdmin;

    // Шаг 1: Пользователь создает запрос на покупку поинтов
    console.log('\n📝 Шаг 1: Пользователь создает запрос на покупку 100 поинтов...');
    const requestAmount = 100;
    const requestDescription = 'Тестовая покупка поинтов';
    
    const purchaseRequest = await paymentsService.createPurchaseRequest(
      user.id,
      requestAmount,
      requestDescription
    );
    
    console.log(`✅ Запрос создан:`);
    console.log(`   ID: ${purchaseRequest.id}`);
    console.log(`   Количество: ${purchaseRequest.amount} поинтов`);
    console.log(`   Описание: ${purchaseRequest.description}`);
    console.log(`   Статус: ${purchaseRequest.status}`);

    // Проверяем начальный баланс пользователя
    const initialPoints = user.points;
    console.log(`\n💰 Начальный баланс пользователя: ${initialPoints} поинтов`);

    // Шаг 2: Админ одобряет запрос
    console.log('\n✅ Шаг 2: Админ одобряет запрос...');
    const adminNotes = 'Одобрено автоматическим тестом';
    
    const approvedRequest = await paymentsService.approvePurchaseRequest(
      purchaseRequest.id,
      admin.id,
      adminNotes
    );
    
    console.log(`✅ Запрос одобрен:`);
    console.log(`   Статус: ${approvedRequest.status}`);
    console.log(`   Заметки админа: ${approvedRequest.adminNotes}`);
    console.log(`   Обработано админом: ${admin.email}`);

    // Шаг 3: Проверяем, что поинты были зачислены
    console.log('\n🔍 Шаг 3: Проверяем зачисление поинтов...');
    const updatedUser = await usersService.findOne(user.id);
    
    if (!updatedUser) {
      throw new Error('Пользователь не найден после обновления');
    }

    const finalPoints = updatedUser.points;
    const pointsAdded = finalPoints - initialPoints;
    
    console.log(`💰 Финальный баланс пользователя: ${finalPoints} поинтов`);
    console.log(`📊 Добавлено поинтов: ${pointsAdded}`);
    
    if (pointsAdded === requestAmount) {
      console.log(`✅ УСПЕХ: Поинты зачислены корректно!`);
    } else {
      console.log(`❌ ОШИБКА: Ожидалось ${requestAmount} поинтов, получено ${pointsAdded}`);
    }

    // Шаг 4: Проверяем транзакцию
    console.log('\n📋 Шаг 4: Проверяем транзакцию...');
    const transactions = await paymentsService.getTransactions(user.id);
    const lastTransaction = transactions[0]; // Самая последняя транзакция
    
    if (lastTransaction) {
      console.log(`✅ Транзакция найдена:`);
      console.log(`   ID: ${lastTransaction.id}`);
      console.log(`   Сумма: ${lastTransaction.amount}`);
      console.log(`   Тип: ${lastTransaction.type}`);
      console.log(`   Описание: ${lastTransaction.description}`);
      console.log(`   Дата: ${lastTransaction.createdAt}`);
      
      if (lastTransaction.amount === requestAmount && lastTransaction.type === TransactionType.DEPOSIT) {
        console.log(`✅ УСПЕХ: Транзакция создана корректно!`);
      } else {
        console.log(`❌ ОШИБКА: Транзакция некорректна`);
      }
    } else {
      console.log(`❌ ОШИБКА: Транзакция не найдена`);
    }

    // Шаг 5: Тестируем отклонение запроса
    console.log('\n🧪 Шаг 5: Тестируем отклонение запроса...');
    
    // Создаем новый запрос для теста отклонения
    const rejectTestRequest = await paymentsService.createPurchaseRequest(
      user.id,
      50,
      'Запрос для теста отклонения'
    );
    
    console.log(`✅ Создан запрос для теста отклонения: ${rejectTestRequest.id}`);
    
    const pointsBeforeReject = updatedUser.points;
    await paymentsService.rejectPurchaseRequest(
      rejectTestRequest.id,
      admin.id,
      'Отклонено в тестовых целях'
    );
    
    const userAfterReject = await usersService.findOne(testUser.id);
    const pointsAfterReject = userAfterReject?.points || 0;
    
    if (pointsAfterReject === pointsBeforeReject) {
      console.log(`✅ УСПЕХ: При отклонении поинты не зачисляются (баланс: ${pointsAfterReject})`);
    } else {
      console.log(`❌ ОШИБКА: При отклонении баланс изменился`);
    }

    // Итоговая статистика
    console.log('\n📈 Итоговая статистика:\n');
    console.log(`👤 Пользователь: ${user.email}`);
    console.log(`   Начальный баланс: ${initialPoints} поинтов`);
    console.log(`   Финальный баланс: ${finalPoints} поинтов`);
    console.log(`   Изменение: +${pointsAdded} поинтов`);
    console.log(`\n👨‍💼 Админ: ${admin.email}`);
    console.log(`\n📝 Запросы:`);
    const allRequests = await paymentsService.getPurchaseRequests(user.id);
    console.log(`   Всего запросов: ${allRequests.length}`);
    console.log(`   Одобрено: ${allRequests.filter(r => r.status === PurchaseRequestStatus.APPROVED).length}`);
    console.log(`   Отклонено: ${allRequests.filter(r => r.status === PurchaseRequestStatus.REJECTED).length}`);
    console.log(`   В ожидании: ${allRequests.filter(r => r.status === PurchaseRequestStatus.PENDING).length}`);
    
    console.log(`\n💳 Транзакции:`);
    console.log(`   Всего транзакций: ${transactions.length}`);
    const deposits = transactions.filter(t => t.type === TransactionType.DEPOSIT);
    const withdrawals = transactions.filter(t => t.type === TransactionType.WITHDRAWAL);
    console.log(`   Пополнений: ${deposits.length}`);
    console.log(`   Списаний: ${withdrawals.length}`);

    console.log('\n✨ Тестирование завершено!\n');
    console.log('📋 Данные для входа:');
    console.log(`   Пользователь: ${user.email} / password123`);
    console.log(`   Админ: ${admin.email} / admin123`);

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    if (error instanceof Error) {
      console.error('   Сообщение:', error.message);
      console.error('   Стек:', error.stack);
    }
  } finally {
    await app.close();
  }
}

bootstrap();

