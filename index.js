const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { pvp, Autoeat } = require('mineflayer-pvp');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Bot Cung Thủ đang hoạt động!'));
app.listen(process.env.PORT || 3000);

const bot = mineflayer.createBot({
    host: process.env.MC_HOST || 'localhost',
    port: parseInt(process.env.MC_PORT) || 25565,
    username: 'KhoaTopBot',
    version: '1.20.1'
});

bot.loadPlugin(pathfinder);
bot.loadPlugin(pvp);

bot.once('spawn', () => {
    console.log('✅ Bot Cung Thủ đã sẵn sàng!');
    const mcData = require('minecraft-data')(bot.version);
    const movements = new Movements(bot, mcData);
    bot.pathfinder.setMovements(movements);
});

bot.on('chat', async (username, message) => {
    if (username === bot.username) return;
    const msg = message.toLowerCase();
    const player = bot.players[username]?.entity;

    if (msg === 'come') {
        if (!player) return bot.chat('Tôi không thấy bạn!');
        bot.chat(`Đang đi theo ${username}`);
        bot.pathfinder.setGoal(new goals.GoalFollow(player, 2), true);
    }

    if (msg === 'bắn' || msg === 'shoot') {
        const mob = bot.nearestEntity((e) => {
            return e.type === 'mob' && e.kind === 'Hostile monsters';
        });

        if (!mob) {
            bot.chat('Không có quái vật nào quanh đây để bắn!');
            return;
        }

        const bow = bot.inventory.items().find(item => item.name.includes('bow'));
        if (!bow) {
            bot.chat('Tôi không có cung!');
            return;
        }

        bot.chat(`Đang nhắm bắn ${mob.displayName || mob.name}...`);
        
        await bot.equip(bow, 'hand');

        bot.pvp.shootArrow(mob);
        
        setTimeout(() => {
            bot.pvp.stop();
            bot.chat('Đã bắn xong!');
        }, 2000);
    }

    if (msg === 'stop') {
        bot.pathfinder.setGoal(null);
        bot.pvp.stop();
        bot.chat('Đã dừng lại.');
    }
});

bot.on('end', () => {
    console.log('Mất kết nối, đang khởi động lại sau 15 giây...');
    setTimeout(() => {
        process.exit(); 
    }, 15000);
});
