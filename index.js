const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder'); 
const { pvp } = require('mineflayer-pvp');
const express = require('express');

// Web Server để Render không kill bot
const app = express();
app.get('/', (req, res) => res.send('Bot Archer + Trash System đang chạy!'));
app.listen(process.env.PORT || 3000);

let bot;

function createBot() {
    bot = mineflayer.createBot({
        host: process.env.MC_HOST,
        port: parseInt(process.env.MC_PORT) || 25565,
        username: process.env.MC_USER || 'ArcherBot',
        version: process.env.MC_VER || '1.20.1',
        hideErrors: true // Ẩn lỗi packet để tránh tràn log
    });

    bot.loadPlugin(pathfinder);
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

        // 1. Lệnh vứt hết đồ
        if (msg === 'throw') {
            const items = bot.inventory.items();
            if (items.length === 0) {
                bot.chat('Túi đồ của mình đang trống không!');
                return;
            }
            bot.chat('Đang dọn dẹp túi đồ, chờ tí...');
            for (const item of items) {
                try {
                    await bot.tossStack(item);
                } catch (err) {
                    continue; // Bỏ qua nếu món đồ bị kẹt
                }
            }
            bot.chat('Đã vứt sạch đồ rồi!');
        }

        // 2. Lệnh đi theo (Fix lỗi goals is not defined)
        if (msg === 'come') {
            const player = bot.players[username]?.entity;
            if (player) {
                bot.pathfinder.setGoal(new goals.GoalFollow(player, 1));
            } else {
                bot.chat('Không thấy bạn đâu cả!');
            }
        }

        // 3. Lệnh bắn cung
        if (msg === 'bắn') {
            const mob = bot.nearestEntity((e) => e.type === 'mob' && e.kind === 'Hostile monsters');
            const bow = bot.inventory.items().find(i => i.name.includes('bow'));
            if (mob && bow) {
                await bot.equip(bow, 'hand');
                bot.pvp.shootArrow(mob);
            }
        }
    });

    // --- CƠ CHẾ TỰ JOIN LẠI (RECONNECT) ---
    bot.on('error', (err) => {
        console.log(`⚠️ Lỗi: ${err.message}`);
        // Thoát để Render tự khởi động lại (Sửa lỗi Exited with status 1)
        if (err.code === 'ERR_ASSERTION' || err.message.includes('goals')) {
            process.exit(1); 
        }
    });

    bot.on('end', (reason) => {
        console.log(`❌ Mất kết nối (${reason}). Khởi động lại sau 10s...`);
        setTimeout(() => process.exit(1), 10000);
    });
}

createBot();
