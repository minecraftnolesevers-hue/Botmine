const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder'); 
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Bot đã fix lỗi và đang chạy!'));
app.listen(process.env.PORT || 3000);

const bot = mineflayer.createBot({
    host: process.env.MC_HOST,
    port: parseInt(process.env.MC_PORT) || 25565,
    username: process.env.MC_USER || 'ArcherBot',
    version: process.env.MC_VER || '1.20.1',
    hideErrors: true 
});

bot.loadPlugin(pathfinder);

bot.on('spawn', () => {
    console.log('✅ Bot đã vào game và không còn lỗi goals!');
    const mcData = require('minecraft-data')(bot.version);
    const movements = new Movements(bot, mcData);
    bot.pathfinder.setMovements(movements);
});

bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    if (message === 'come') {
        const player = bot.players[username]?.entity;
        if (player) {
            bot.pathfinder.setGoal(new goals.GoalFollow(player, 1));
        }
    }
});

// Chống sập khi gặp lỗi vặt
bot.on('error', (err) => {
    if (err.code === 'ERR_ASSERTION') {
        console.log('⚠️ Đã chặn lỗi Assertion để bot không sập.');
    }
});
