import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { CardsService } from '../cards/cards.service';
import { MatchesService } from '../matches/matches.service';
import { UserStatus, User } from '../users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const usersService = app.get(UsersService);
  const cardsService = app.get(CardsService);
  const matchesService = app.get(MatchesService);
  const usersRepository = app.get(getRepositoryToken(User));

  console.log('🚀 Начинаем создание тестовых пользователей и тестирование матчинга...\n');

  try {
    // Создаем тестовых пользователей
    const testUsers = [
      {
        email: 'alice@test.com',
        password: 'password123',
        name: 'Алиса Иванова',
        status: UserStatus.FREE,
        professions: ['Дизайнер', 'UX/UI'],
        skills: ['Figma', 'Photoshop', 'Illustrator'],
        contacts: {
          telegram: '@alice_design',
          whatsapp: '+79001234567'
        }
      },
      {
        email: 'bob@test.com',
        password: 'password123',
        name: 'Боб Петров',
        status: UserStatus.PREMIUM,
        professions: ['Разработчик', 'Full Stack'],
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
        contacts: {
          telegram: '@bob_dev',
          discord: 'bob_dev#1234'
        }
      },
      {
        email: 'charlie@test.com',
        password: 'password123',
        name: 'Чарли Сидоров',
        status: UserStatus.FREE,
        professions: ['Маркетолог', 'SMM'],
        skills: ['SEO', 'Контент-маркетинг', 'Аналитика'],
        contacts: {
          telegram: '@charlie_marketing'
        }
      },
      {
        email: 'diana@test.com',
        password: 'password123',
        name: 'Диана Козлова',
        status: UserStatus.PREMIUM,
        professions: ['Дизайнер', 'Графический дизайнер'],
        skills: ['Illustrator', 'InDesign', 'Branding'],
        contacts: {
          telegram: '@diana_design',
          whatsapp: '+79007654321'
        }
      },
      {
        email: 'eve@test.com',
        password: 'password123',
        name: 'Ева Морозова',
        status: UserStatus.FREE,
        professions: ['Разработчик', 'Frontend'],
        skills: ['React', 'Vue', 'CSS', 'HTML'],
        contacts: {
          telegram: '@eve_frontend'
        }
      }
    ];

    const createdUsers = [];
    
    // Создаем пользователей
    for (const userData of testUsers) {
      try {
        // Проверяем, существует ли пользователь
        const existingUser = await usersService.findByEmail(userData.email);
        if (existingUser) {
          console.log(`⚠️  Пользователь ${userData.email} уже существует, пропускаем...`);
          createdUsers.push(existingUser);
          continue;
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = usersRepository.create({
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          status: userData.status,
          professions: userData.professions,
          skills: userData.skills,
          contacts: userData.contacts,
        });
        const savedUser = await usersRepository.save(user);
        createdUsers.push(savedUser);
        console.log(`✅ Создан пользователь: ${user.name} (${user.email}) - ${user.status}`);
      } catch (error) {
        console.error(`❌ Ошибка при создании пользователя ${userData.email}:`, error.message);
      }
    }

    console.log(`\n📊 Всего создано пользователей: ${createdUsers.length}\n`);

    // Создаем тестовые карточки
    console.log('📝 Создаем тестовые карточки...\n');
    
    const testCards = [
      {
        owner: createdUsers[0], // Алиса
        profession: 'Дизайнер интерфейсов',
        skills: ['Figma', 'UI/UX', 'Прототипирование'],
        datetime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // через 2 дня
      },
      {
        owner: createdUsers[1], // Боб
        profession: 'Full Stack разработчик',
        skills: ['Node.js', 'React', 'PostgreSQL', 'Docker'],
        datetime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // через 3 дня
      },
      {
        owner: createdUsers[2], // Чарли
        profession: 'SMM специалист',
        skills: ['Контент-план', 'Аналитика', 'Таргетинг'],
        datetime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // через 5 дней
      },
      {
        owner: createdUsers[3], // Диана
        profession: 'Графический дизайнер',
        skills: ['Branding', 'Логотипы', 'Полиграфия'],
        datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // через 7 дней
      },
      {
        owner: createdUsers[4], // Ева
        profession: 'Frontend разработчик',
        skills: ['React', 'TypeScript', 'Next.js'],
        datetime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // через 4 дня
      },
    ];

    const createdCards = [];
    
    for (const cardData of testCards) {
      try {
        const card = await cardsService.create(
          {
            profession: cardData.profession,
            skills: cardData.skills,
            datetime: cardData.datetime.toISOString(),
          },
          { userId: cardData.owner.id }
        );
        createdCards.push(card);
        console.log(`✅ Создана карточка: ${card.profession} (владелец: ${cardData.owner.name})`);
      } catch (error) {
        console.error(`❌ Ошибка при создании карточки:`, error.message);
      }
    }

    console.log(`\n📊 Всего создано карточек: ${createdCards.length}\n`);

    // Тестируем матчинг
    console.log('🎯 Тестируем матчинг...\n');

    const matchTests = [
      {
        requester: createdUsers[1], // Боб запрашивает матч
        card: createdCards[0], // на карточку Алисы
        description: 'Боб (Premium) запрашивает матч на карточку Алисы (Free)',
      },
      {
        requester: createdUsers[2], // Чарли запрашивает матч
        card: createdCards[1], // на карточку Боба
        description: 'Чарли (Free) запрашивает матч на карточку Боба (Premium)',
      },
      {
        requester: createdUsers[3], // Диана запрашивает матч
        card: createdCards[0], // на карточку Алисы
        description: 'Диана (Premium) запрашивает матч на карточку Алисы (Free)',
      },
      {
        requester: createdUsers[4], // Ева запрашивает матч
        card: createdCards[1], // на карточку Боба
        description: 'Ева (Free) запрашивает матч на карточку Боба (Premium)',
      },
      {
        requester: createdUsers[0], // Алиса запрашивает матч
        card: createdCards[3], // на карточку Дианы
        description: 'Алиса (Free) запрашивает матч на карточку Дианы (Premium)',
      },
    ];

    const createdMatches = [];

    for (const test of matchTests) {
      try {
        const match = await matchesService.create(
          { cardId: test.card.id },
          test.requester
        );
        createdMatches.push(match);
        console.log(`✅ ${test.description}`);
        console.log(`   Match ID: ${match.id}, Status: ${match.status}`);
      } catch (error) {
        console.error(`❌ Ошибка при создании матча: ${test.description}`);
        console.error(`   ${error.message}`);
      }
    }

    console.log(`\n📊 Всего создано матчей: ${createdMatches.length}\n`);

    // Тестируем подтверждение матчей
    console.log('✅ Тестируем подтверждение матчей...\n');

    if (createdMatches.length > 0) {
      // Подтверждаем первый матч (владелец карточки подтверждает)
      const firstMatch = createdMatches[0];
      const cardOwner = createdCards.find(c => c.id === firstMatch.cardId)?.owner;
      
      if (cardOwner) {
        try {
          const confirmedMatch = await matchesService.confirm(firstMatch.id, cardOwner.id);
          console.log(`✅ Матч ${firstMatch.id} подтвержден владельцем карточки ${cardOwner.name}`);
          console.log(`   Новый статус: ${confirmedMatch.status}`);
        } catch (error) {
          console.error(`❌ Ошибка при подтверждении матча:`, error.message);
        }
      }
    }

    // Проверяем лимиты для Free пользователей
    console.log('\n🔍 Проверяем лимиты для Free пользователей...\n');
    
    const freeUsers = createdUsers.filter(u => u.status === UserStatus.FREE);
    for (const freeUser of freeUsers) {
      try {
        const userMatches = await matchesService.findAllForUser(freeUser.id);
        const userMatchesCount = userMatches.filter(m => m.requesterId === freeUser.id).length;
        console.log(`👤 ${freeUser.name} (Free): ${userMatchesCount} матчей как requester`);
        
        if (userMatchesCount >= 3) {
          console.log(`   ⚠️  Достигнут лимит для Free плана (3 матча)`);
        }
      } catch (error) {
        console.error(`❌ Ошибка при проверке матчей пользователя ${freeUser.name}:`, error.message);
      }
    }

    // Пытаемся создать матч сверх лимита для Free пользователя
    console.log('\n🧪 Тестируем превышение лимита для Free пользователя...\n');
    
    const freeUserWithLimit = createdUsers.find(u => u.status === UserStatus.FREE);
    if (freeUserWithLimit && createdCards.length > 0) {
      try {
        // Получаем актуальные матчи пользователя
        let userMatches = await matchesService.findAllForUser(freeUserWithLimit.id);
        let currentMatches = userMatches.filter(m => m.requesterId === freeUserWithLimit.id).length;
        
        console.log(`   Текущее количество матчей для ${freeUserWithLimit.name}: ${currentMatches}`);
        
        if (currentMatches < 3) {
          // Создаем матчи до лимита
          console.log(`   Создаем дополнительные матчи до лимита (3)...`);
          for (let i = currentMatches; i < 3; i++) {
            // Обновляем список матчей
            userMatches = await matchesService.findAllForUser(freeUserWithLimit.id);
            const existingCardIds = userMatches
              .filter(m => m.requesterId === freeUserWithLimit.id)
              .map(m => m.cardId);
            
            const testCard = createdCards.find(c => 
              c.ownerId !== freeUserWithLimit.id && 
              !existingCardIds.includes(c.id)
            );
            
            if (testCard) {
              try {
                await matchesService.create({ cardId: testCard.id }, freeUserWithLimit);
                console.log(`   ✅ Создан матч ${i + 1}/3`);
                currentMatches++;
              } catch (error) {
                console.log(`   ⚠️  Не удалось создать матч: ${error.message}`);
                break;
              }
            } else {
              console.log(`   ⚠️  Нет доступных карточек для создания матча`);
              break;
            }
          }
        }
        
        // Пытаемся создать матч сверх лимита
        userMatches = await matchesService.findAllForUser(freeUserWithLimit.id);
        const existingCardIds = userMatches
          .filter(m => m.requesterId === freeUserWithLimit.id)
          .map(m => m.cardId);
        
        const extraCard = createdCards.find(c => 
          c.ownerId !== freeUserWithLimit.id && 
          !existingCardIds.includes(c.id)
        );
        
        if (extraCard) {
          try {
            await matchesService.create({ cardId: extraCard.id }, freeUserWithLimit);
            console.log(`   ⚠️  Неожиданно: матч создан сверх лимита для ${freeUserWithLimit.name}`);
          } catch (error) {
            console.log(`   ✅ Лимит работает корректно: ${error.message}`);
          }
        } else {
          console.log(`   ℹ️  Нет доступных карточек для тестирования превышения лимита`);
        }
      } catch (error) {
        console.error(`   ❌ Ошибка при тестировании лимита:`, error.message);
      }
    }

    // Выводим итоговую статистику
    console.log('\n📈 Итоговая статистика:\n');
    console.log(`👥 Пользователей: ${createdUsers.length}`);
    console.log(`   - Free: ${createdUsers.filter(u => u.status === UserStatus.FREE).length}`);
    console.log(`   - Premium: ${createdUsers.filter(u => u.status === UserStatus.PREMIUM).length}`);
    console.log(`📝 Карточек: ${createdCards.length}`);
    console.log(`🎯 Матчей: ${createdMatches.length}`);
    
    const allMatches = [];
    for (const user of createdUsers) {
      const userMatches = await matchesService.findAllForUser(user.id);
      allMatches.push(...userMatches);
    }
    const uniqueMatches = Array.from(new Set(allMatches.map(m => m.id)));
    console.log(`   - Всего уникальных матчей: ${uniqueMatches.length}`);

    console.log('\n✨ Тестирование завершено!\n');
    console.log('📋 Данные для входа:');
    testUsers.forEach(user => {
      console.log(`   ${user.email} / ${user.password}`);
    });

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  } finally {
    await app.close();
  }
}

bootstrap();

