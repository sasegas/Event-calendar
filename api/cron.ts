import TelegramBot from 'node-telegram-bot-api';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel автоматично бере ці змінні з налаштувань (Environment Variables)
const token = process.env.TELEGRAM_TOKEN;
const myChatId = process.env.MY_CHAT_ID;

// Ваші дані
const birthdays = [
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
	{ name: "Тест", date: "06-10" },
];
// Головна функція, яку викликатиме Vercel за розкладом
export default async function handler(req: VercelRequest, res: VercelResponse) {
	// 1. Перевірка змінних
	if (!token || !myChatId) {
		console.error("❌ Відсутні токен або ID чату!");
		return res.status(500).json({ error: "Missing environment variables" });
	}

	// Ініціалізація бота (без polling, як і було)
	const bot = new TelegramBot(token);

	try {
		const today = new Date();
		const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

		const inWeek = new Date();
		inWeek.setDate(today.getDate() + 7);
		const inWeekStr = `${String(inWeek.getMonth() + 1).padStart(2, '0')}-${String(inWeek.getDate()).padStart(2, '0')}`;

		let sentSomething = false;

		// 2. Перевірка дат та відправка
		for (const person of birthdays) {
			if (person.date === todayStr) {
				await bot.sendMessage(myChatId, `🎉 СЬОГОДНІ День народження у: *${person.name}*! Не забудь привітати! 🎂`, { parse_mode: 'Markdown' });
				sentSomething = true;
			} else if (person.date === inWeekStr) {
				await bot.sendMessage(myChatId, `🔔 Нагадування: Рівно за тиждень (🎂) День народження у: *${person.name}*. Час шукати подарунок! 🎁`, { parse_mode: 'Markdown' });
				sentSomething = true;
			}
		}

		if (!sentSomething) {
			console.log("Сьогодні та за тиждень днів народжень немає.");
		}

		console.log("✅ Скрипт успішно завершив роботу.");

		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		return res.end(JSON.stringify({ success: true, message: "Checked successfully" }));

	} catch (error) {
		console.error("❌ Помилка під час виконання:", error);

		res.statusCode = 500;
		res.setHeader('Content-Type', 'application/json');
		return res.end(JSON.stringify({ success: false, error: "Internal Server Error" }));
	}
}