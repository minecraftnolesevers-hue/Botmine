const mineflayer = require('mineflayer');
const autofish = require('mineflayer-autofish');
// SỬA LỖI 1: Phải có "goals" trong dấu ngoặc nhọn ở đây
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder'); 
const { pvp } = require('mineflayer-pvp');
const express = require('express');

// Web Server để Render không tắt bot
const app = express();
app.get('/', (req, res) => res.send('Bot đã fix lỗi và đang chạy!'));
app.listen(process.env.PORT || 3000);

let bot;

function createBot() {
    bot = mineflayer.createBot({
        host: process.env.MC_HOST,
        port: parseInt(process.env.MC_PORT) || 25565,
        username: process.env.MC_USER || 'ArcherBot',
        version: process.env.MC_VER || '1.20.1',
        hideErrors: true // SỬA LỖI 3: Ẩn các gói tin lỗi (partial packet)
    });

    // SỬA LỖI 2: Đảm bảo các plugin được nạp đúng định dạng function
    bot.loadPlugin(pathfinder);
    bot.loadPlugin(autofish);
    bot.loadPlugin(pvp);

    bot.once('spawn', () => {
        console.log('✅ Bot đã vào game thành công!');
        const mcData = require('minecraft-data')(bot.version);
        const movements = new Movements(bot, mcData);
        bot.pathfinder.setMovements(movements);
    });

    bot.on('chat', async (username, message) => {
        if (username === bot.username) return;
        const msg = message.toLowerCase();

        // --- LỆNH VỨT HẾT ĐỒ ---
        if (msg === 'throw') {
            const items = bot.inventory.items();
            if (items.length === 0) return bot.chat('Túi đồ trống không!');
            bot.chat('Đang vứt hết đồ...');
            for (const item of items) {
                try {
                    await bot.tossStack(item);
                } catch (e) {}
            }
            bot.chat('Đã vứt xong!');
        }

        // --- LỆNH ĐI THEO (Đã fix lỗi goals) ---
        if (msg === 'come') {
            const player = bot.players[username]?.entity;
            if (player) {
                bot.pathfinder.setGoal(new goals.GoalFollow(player, 1));
            } else {
                bot.chat('Không thấy bạn!');
            }
        }
    });

    // --- CƠ CHẾ TỰ JOIN LẠI (SỬA LỖI BOT KHÔNG TỰ RECONNECT) ---
    bot.on('error', (err) => {
        console.log(`⚠️ Lỗi: ${err.message}`);
        // Khi gặp lỗi nghiêm trọng, thoát để Render tự khởi động lại toàn bộ
        if (err.code === 'ERR_ASSERTION' || err.message.includes('goals')) {
            process.exit(1); 
        }
    });

    bot.on('end', (reason) => {
        console.log(`❌ Mất kết nối: ${reason}. Đang khởi động lại...`);
        // Thoát với mã 1 để Render tự động bật lại bot ngay lập tức
        setTimeout(() => process.exit(1), 5000);
    });
}

createBot();
