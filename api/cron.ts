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
	{ name: "Тест", date: "06-11" },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
	// Гарантуємо, що Vercel віддасть JSON-заголовки від початку
	res.setHeader('Content-Type', 'application/json');

	if (!token || !myChatId) {
		console.error("❌ Відсутні токен або ID чату!");
		res.statusCode = 500;
		return res.end(JSON.stringify({ error: "Missing environment variables" }));
	}

	// Захист від сміттєвих запитів браузера
	if (req.url?.includes('favicon') || req.url === '/robots.txt') {
		res.statusCode = 204;
		return res.end();
	}

	if (req.url !== '/api/cron') {
		res.statusCode = 200;
		return res.end(JSON.stringify({ message: "Welcome. Use /api/cron for updates." }));
	}

	const bot = new TelegramBot(token, { polling: false });

	try {
		// Явно виставляємо часову зону України, щоб уникнути багів з UTC на серверах Vercel
		const targetTimeZone = "Europe/Kyiv";
		const formatter = new Intl.DateTimeFormat("en-US", {
			timeZone: targetTimeZone,
			month: "2-digit",
			day: "2-digit",
		});

		const getMonthDayStr = (date: Date): string => {
			const parts = formatter.formatToParts(date);
			const month = parts.find(p => p.type === 'month')?.value || '01';
			const day = parts.find(p => p.type === 'day')?.value || '01';
			return `${month}-${day}`;
		};

		// Отримуємо поточну дату
		const todayStr = getMonthDayStr(new Date());

		// Розрахунок дати через 7 днів
		const inWeekDate = new Date();
		inWeekDate.setDate(inWeekDate.getDate() + 7);
		const inWeekStr = getMonthDayStr(inWeekDate)

		console.log(`[Cron Run] Сортування дат для часового поясу Kyiv. Сьогодні: ${todayStr}, За тиждень: ${inWeekStr}`);

		const messagePromises = [];
		const processedToday = new Set<string>();
		const processedInWeek = new Set<string>();

		for (const person of birthdays) {
			if (person.date === todayStr && !processedToday.has(person.name)) {
				processedToday.add(person.name);
				const p = bot.sendMessage(myChatId, `🎉 СЬОГОДНІ День народження у: *${person.name}*! Не забудь привітати! 🎂`, { parse_mode: 'Markdown' });
				messagePromises.push(p);
			}

			if (person.date === inWeekStr && !processedInWeek.has(person.name)) {
				processedInWeek.add(person.name);
				const p = bot.sendMessage(myChatId, `🔔 Нагадування: Рівно за тиждень (🎂) День народження у: *${person.name}*. Час шукати подарунок! 🎁`, { parse_mode: 'Markdown' });
				messagePromises.push(p);
			}
		}

		if (messagePromises.length > 0) {
			// Чекаємо повного виконання запитів до Telegram API
			await Promise.all(messagePromises);
			console.log(`✅ Надіслано повідомлень: ${messagePromises.length}`);
		} else {
			console.log("Сьогодні та за тиждень днів народжень немає.");
		}

		// Повертаємо успішний статус
		res.statusCode = 200;
		res.end(JSON.stringify({ success: true, cron_executed: true }));

		// Фінальний штрих для серверлес: очищення внутрішнього стану бота
		// (іноді пакети тримають HTTP-з'єднання відкритими "keep-alive", через що Vercel думає, що функція ще працює)
		if ((bot as any)._requestReg) {
			(bot as any)._requestReg = null;
		}
		return;

	} catch (error) {
		console.error("❌ Помилка під час виконання Cron:", error);
		res.statusCode = 500;
		return res.end(JSON.stringify({ success: false, error: "Internal Server Error" }));
	}
}