const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const express = require('express');

// --- CẤU HÌNH WEB SERVER ĐỂ TREO TRÊN RENDER ---
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot Minecraft đang chạy!');
});

app.listen(port, () => {
  console.log(`Web server listening at http://localhost:${port}`);
});

// --- CẤU HÌNH BOT MINECRAFT ---
const bot = mineflayer.createBot({
  host: 'your-wilt.gl.joinmc.link', 
  port: 28191,
  username: 'RenderBot_V1',
  version: '1.21.4'
});

bot.loadPlugin(pathfinder);

bot.on('spawn', () => {
  const mcData = require('minecraft-data')(bot.version);
  const movements = new Movements(bot, mcData);
  bot.pathfinder.setMovements(movements);
  console.log('Bot đã sẵn sàng!');
});

// Các lệnh chat (come1, attack, drop) giữ nguyên như cũ...
bot.on('chat', async (username, message) => {
  if (username === bot.username) return;
  const target = bot.players[username]?.entity;

  if (message === 'come1' && target) {
    bot.pathfinder.setGoal(new goals.GoalFollow(target, 1), true);
  }

  if (message === 'drop') {
    const items = bot.inventory.items();
    for (const item of items) await bot.tossStack(item);
    bot.chat("Đã vứt sạch đồ!");
  }
  
  // Lệnh tấn công (Yêu cầu có cung và tên)
  if (message === 'attack') {
    const mob = bot.nearestEntity((e) => e.type === 'mob' && e.kind === 'Hostile monsters');
    if (mob) {
      const bow = bot.inventory.items().find(i => i.name.includes('bow'));
      if (bow) {
        await bot.equip(bow, 'hand');
        bot.lookAt(mob.position.offset(0, 1.6, 0));
        bot.activateItem();
        setTimeout(() => bot.deactivateItem(), 1200);
      }
    }
  }
});

// Tự động kết nối lại nếu bị kick
bot.on('end', () => setTimeout(() => process.exit(), 5000));
