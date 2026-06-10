import TelegramBot from 'node-telegram-bot-api';
import { VercelRequest, VercelResponse } from '@vercel/node';

const token = process.env.TELEGRAM_TOKEN;
const myChatId = process.env.MY_CHAT_ID;

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
	// 1. Перевірка змінних
	if (!token || !myChatId) {
		console.error("❌ Відсутні токен або ID чату!");
		res.statusCode = 500;
		res.setHeader('Content-Type', 'application/json');
		return res.end(JSON.stringify({ error: "Missing environment variables" }));
	}

	// 💡 ЗАХИСТ ВІД ІКОНОК ТА СМІТТЄВИХ ЗАПИТІВ
	// Якщо браузер просить іконку — одразу віддаємо 204 (No Content) і виходимо
	if (req.url?.includes('favicon') || req.url === '/robots.txt') {
		res.statusCode = 204;
		return res.end();
	}

	if (req.url !== '/api/cron' && req.url !== '/') {
		res.statusCode = 404;
		return res.end(JSON.stringify({ error: "Not found" }));
	}

	// Ініціалізуємо бота всередині хандлера з вимкненим polling
	const bot = new TelegramBot(token, { polling: false });

	try {
		const today = new Date();
		const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

		const inWeek = new Date();
		inWeek.setDate(today.getDate() + 7);
		const inWeekStr = `${String(inWeek.getMonth() + 1).padStart(2, '0')}-${String(inWeek.getDate()).padStart(2, '0')}`;

		// Масив для збору промісів відправки (щоб відправляти паралельно і швидко)
		const messagePromises = [];

		for (const person of birthdays) {
			if (person.date === todayStr) {
				// Заміни рядок надсилання для СЬОГОДНІ на цей:
				const p = bot.sendMessage(myChatId, `🎉 СЬОГОДНІ День народження у: *${person.name}*! Не забудь привітати! 🎂\n\n_(Виклик з URL: ${req.url})_`, { parse_mode: 'Markdown' });
				messagePromises.push(p);
			} else if (person.date === inWeekStr) {
				const p = bot.sendMessage(myChatId, `🔔 Нагадування: Рівно за тиждень (🎂) День народження у: *${person.name}*. Час шукати подарунок! 🎁`, { parse_mode: 'Markdown' });
				messagePromises.push(p);
			}
		}

		if (messagePromises.length > 0) {
			// Чекаємо виконання всіх відправок одночасно
			await Promise.all(messagePromises);
			console.log(`✅ Успішно надіслано повідомлень: ${messagePromises.length}`);
		} else {
			console.log("Сьогодні та за тиждень днів народжень немає.");
		}

		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		return res.end(JSON.stringify({ success: true, message: "Checked successfully" }));

	} catch (error) {
		console.error("❌ Помилка під час виконання:", error);
		// Повертаємо 500, але у правильному форматі Vercel
		return res.status(500).json({ success: false, error: "Internal Server Error" });
	}
}