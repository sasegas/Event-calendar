import TelegramBot from 'node-telegram-bot-api';
import cron from 'node-cron';
import dotenv from 'dotenv';

// Завантажуємо змінні з .env
dotenv.config();

const token = process.env.TELEGRAM_TOKEN;
const myChatId = process.env.MY_CHAT_ID;

if (!token || !myChatId) {
	console.error("❌ Помилка: не вказано TELEGRAM_TOKEN або MY_CHAT_ID у файлі .env");
	process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// Створюємо інтерфейс, щоб TS знав, як виглядає наш об'єкт
interface BirthdayUser {
	name: string;
	date: string; // Формат "MM-DD", наприклад "06-16"
}

// Наша тимчасова база даних
const birthdays: BirthdayUser[] = [
	{ name: "Сясік", date: "12-13" },
	{ name: "Стас", date: "03-01" },
	{ name: "Антон", date: "07-14" },
	{ name: "Микита", date: "04-18" },
	{ name: "Даша", date: "07-19" },
	{ name: "Діма(Півці)", date: "07-19" },
	{ name: "Дарка", date: "09-27" },
	{ name: "Поліна", date: "04-30" },
	{ name: "Леся", date: "10-28" },
	{ name: "Гриша", date: "04-19" },
	{ name: "Міша", date: "10-13" },
	{ name: "Емо-Бой", date: "10-18" },
	{ name: "Анджела", date: "12-21" },
	{ name: "Єгор(Сновськ)", date: "03-14" },
	{ name: "Яся", date: "07-12" },
	{ name: "Мама", date: "01-25" },
	{ name: "Тест", date: "06-09" },
];

function checkBirthdays(): void {
	const today = new Date();

	// Дата сьогодні у форматі ММ-ДД
	const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

	// Дата за 7 днів у форматі ММ-ДД
	const inWeek = new Date();
	inWeek.setDate(today.getDate() + 7);
	const inWeekStr = `${String(inWeek.getMonth() + 1).padStart(2, '0')}-${String(inWeek.getDate()).padStart(2, '0')}`;

	birthdays.forEach((person) => {
		if (person.date === todayStr) {
			bot.sendMessage(myChatId!, `🎉 СЬОГОДНІ День народження у: *${person.name}*! Не забудь привітати! 🎂`, { parse_mode: 'Markdown' });
		} else if (person.date === inWeekStr) {
			bot.sendMessage(myChatId!, `🔔 Нагадування: Рівно за тиждень (🎂) День народження у: *${person.name}*. Час шукати подарунок! 🎁`, { parse_mode: 'Markdown' });
		}
	});
}

// Запускаємо щодня о 09:00
cron.schedule('0 9 * * *', () => {
	console.log('🔄 Запуск щоденної перевірки...');
	checkBirthdays();
}, {
	timezone: "Europe/Kyiv"
});

console.log("🤖 Бот на TypeScript успішно запущений і чекає на роботу!");