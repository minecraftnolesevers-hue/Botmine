const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder'); // Fix lỗi goals
const { pvp } = require('mineflayer-pvp');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Bot Archer đang chạy!'));
app.listen(process.env.PORT || 3000);

const bot = mineflayer.createBot({
    host: process.env.MC_HOST,
    port: parseInt(process.env.MC_PORT) || 25565,
    username: process.env.MC_USER || 'ArcherBot',
    version: process.env.MC_VER || '1.21.11',
    hideErrors: true // Fix lỗi partial packet trong log
});

bot.loadPlugin(pathfinder);
bot.loadPlugin(pvp);

bot.on('spawn', () => {
    const mcData = require('minecraft-data')(bot.version);
    const movements = new Movements(bot, mcData);
    bot.pathfinder.setMovements(movements);
    console.log('✅ Bot đã sẵn sàng!');
});

bot.on('chat', async (username, message) => {
    if (username === bot.username) return;
    const msg = message.toLowerCase();
    const player = bot.players[username]?.entity;

    if (msg === 'come') {
        if (!player) return bot.chat('Không thấy bạn!');
        bot.pathfinder.setGoal(new goals.GoalFollow(player, 1), true);
    }

    if (msg === 'bắn') {
        const mob = bot.nearestEntity((e) => e.type === 'mob' && e.kind === 'Hostile monsters');
        if (!mob) return bot.chat('Không có quái!');
        
        const bow = bot.inventory.items().find(i => i.name.includes('bow'));
        if (!bow) return bot.chat('Không có cung!');

        await bot.equip(bow, 'hand');
        bot.pvp.shootArrow(mob);
        bot.chat('Đã bắn!');
    }
});

bot.on('error', (err) => console.log('⚠️ Lỗi hệ thống:', err.message));
bot.on('end', () => setTimeout(() => process.exit(), 5000));
