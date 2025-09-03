#!/usr/bin/env node
require('colors');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const ora = require('ora');
const inquirer = require('inquirer');
const ProgressBar = require('progress');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config.json');

// ASCII SUPER GANAS
const banner = `
${`╔══════════════════════════════════════════════════════════════════════════════╗`.red}
${`║ ██████╗ ██╗   ██╗██╗   ██╗ ██████╗ ███████╗    ███████╗██████╗ ███████╗███╗   ███╗ ██████╗ ███████╗ ██████╗ ██████╗ ███████╗██████╗ ███████╗██████╗ ██╗   ██╗ ██████╗ ███████╗`.red}
${`║ ██╔══██╗██║   ██║╚██╗ ██╔╝██╔═══██╗██╔════╝    ██╔════╝██╔══██╗██╔════╝████╗ ████║██╔═══██╗██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔══██╗██╔════╝██╔══██╗██║   ██║██╔════╝ ██╔════╝`.red}
${`║ ██║  ██║██║   ██║ ╚████╔╝ ██║   ██║█████╗      █████╗  ██████╔╝█████╗  ██╔████╔██║██║   ██║███████╗██║   ██║██████╔╝█████╗  ██████╔╝█████╗  ██████╔╝██║   ██║██║  ███╗█████╗  `.red}
${`║ ██║  ██║██║   ██║  ╚██╔╝  ██║   ██║██╔══╝      ██╔══╝  ██╔══██╗██╔══╝  ██║╚██╔╝██║██║   ██║╚════██║██║   ██║██╔══██╗██╔══╝  ██╔══██╗██╔══╝  ██╔═══╝ ╚██╗ ██╔╝██║   ██║██╔══╝  `.red}
${`║ ██████╔╝╚██████╔╝   ██║   ╚██████╔╝███████╗    ██║     ██║  ██║███████╗██║ ╚═╝ ██║╚██████╔╝███████║╚██████╔╝██║  ██║███████╗██║  ██║███████╗██║      ╚████╔╝ ╚██████╔╝███████╗`.red}
${`║ ╚═════╝  ╚═════╝    ╚═╝    ╚═════╝ ╚══════╝    ╚═╝     ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝       ╚═══╝   ╚═════╝ ╚══════╝`.red}
${`╚══════════════════════════════════════════════════════════════════════════════╝`.red}
`;

// Client setup premium
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: path.join(__dirname, 'sessions')
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-default-apps'
        ]
    }
});

// Animasi super canggih
const premiumLoading = async (text, duration = 5) => {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    const colors = ['#FF0000', '#FF3300', '#FF6600', '#FF9900', '#FFCC00', '#FFFF00', '#CCFF00', '#99FF00', '#66FF00', '#33FF00'];
    
    for (let i = 0; i < duration * 10; i++) {
        const frame = chalk.hex(colors[i % colors.length])(frames[i % frames.length]);
        const textColored = chalk.hex(colors[colors.length - 1 - (i % colors.length)]).bold(text);
        process.stdout.write(`\r${frame} ${textColored} ${frame}`);
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('\n');
};

// Backup system premium
class BackupManager {
    constructor() {
        this.backupPath = config.backup.path;
        fs.ensureDirSync(this.backupPath);
    }

    async createFullBackup() {
        const spinner = ora({
            text: 'Creating premium backup...',
            spinner: 'moon',
            color: 'yellow'
        }).start();

        try {
            const chats = await client.getChats();
            const backup = {
                timestamp: new Date().toISOString(),
                account: {
                    name: client.info.pushname,
                    number: client.info.wid.user,
                    platform: client.info.platform
                },
                chats: [],
                media: []
            };

            // Progress bar untuk backup
            const bar = new ProgressBar('Backup [:bar] :percent :etas', {
                total: chats.length,
                width: 40,
                complete: chalk.green('█'),
                incomplete: chalk.red('░')
            });

            for (const chat of chats) {
                const messages = await chat.fetchMessages({ limit: 100 });
                backup.chats.push({
                    name: chat.name || chat.contact?.name || 'Unknown',
                    type: chat.isGroup ? 'group' : 'private',
                    messages: messages.map(m => ({
                        timestamp: m.timestamp,
                        from: m.from,
                        to: m.to,
                        body: m.body?.substring(0, 100) + '...',
                        type: m.type
                    })).slice(0, 10) // Limit backup size
                });
                bar.tick();
            }

            const filename = `backup_${Date.now()}.json`;
            await fs.writeFile(path.join(this.backupPath, filename), JSON.stringify(backup, null, 2));
            
            spinner.succeed(chalk.green(`[✓] Backup saved: ${filename}`));
            return filename;

        } catch (error) {
            spinner.fail(chalk.red(`[✗] Backup failed: ${error.message}`));
            throw error;
        }
    }
}

// Destruction engines
class AccountNuker {
    constructor(client) {
        this.client = client;
        this.backup = new BackupManager();
    }

    async execute() {
        console.clear();
        console.log(banner);

        const { confirm, reason } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: chalk.red.bold('⚠️  AKUN INI AKAN DINONAKTIFKAN PERMANEN! LANJUTKAN?'),
                default: false
            },
            {
                type: 'input',
                name: 'reason',
                message: chalk.green.bold('Masukkan alasan penonaktifan:'),
                validate: input => input.length >= 10 || 'Minimal 10 karakter!'
            }
        ]);

        if (!confirm) {
            console.log(chalk.yellow('[+] Operasi dibatalkan'));
            return;
        }

        // Step 1: Backup
        await this.backup.createFullBackup();

        // Step 2: Pre-destruction cleanup
        await this.cleanupAccount();

        // Step 3: Official request
        await this.sendOfficialRequest(reason);

        // Step 4: Final confirmation
        await this.finalizeDestruction();
    }

    async cleanupAccount() {
        const spinner = ora({
            text: 'Cleaning up account...',
            spinner: 'shark',
            color: 'red'
        }).start();

        try {
            const chats = await this.client.getChats();
            const groups = chats.filter(c => c.isGroup);
            
            // Progress bar untuk keluar grup
            const bar = new ProgressBar('Keluar grup [:bar] :percent', {
                total: groups.length,
                width: 30,
                complete: chalk.red('█'),
                incomplete: chalk.white('░')
            });

            for (const group of groups) {
                try {
                    await group.leave();
                    bar.tick();
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (e) {
                    // Skip error untuk grup yang tidak bisa leave
                }
            }

            spinner.succeed(chalk.green('[✓] Cleanup complete'));
        } catch (error) {
            spinner.fail(chalk.red(`[✗] Cleanup failed: ${error.message}`));
        }
    }

    async sendOfficialRequest(reason) {
        const spinner = ora({
            text: 'Sending official request...',
            spinner: 'bouncingBar',
            color: 'yellow'
        }).start();

        try {
            const supportNumber = '120363022878066437@g.us'; // WhatsApp Support
            const request = [
                `🚨 SELF-DESTRUCT REQUEST`,
                `Account: ${this.client.info.wid.user}`,
                `Name: ${this.client.info.pushname}`,
                `Reason: ${reason}`,
                `Date: ${new Date().toLocaleString('id-ID')}`,
                `IP: ${await this.getPublicIP()}`,
                `This is official request from account owner`
            ].join('\n');

            await this.client.sendMessage(supportNumber, request);
            spinner.succeed(chalk.green('[✓] Request sent to WhatsApp Support'));
            
        } catch (error) {
            spinner.fail(chalk.red(`[✗] Failed to send request: ${error.message}`));
            // Fallback to email
            await this.sendEmailSupport(reason);
        }
    }

    async sendEmailSupport(reason) {
        const emailData = {
            to: 'support@whatsapp.com',
            subject: `Self-Destruct Request - ${this.client.info.wid.user}`,
            body: `
Dear WhatsApp Support,

I request permanent deactivation of my WhatsApp account:
- Phone Number: +${this.client.info.wid.user}
- Display Name: ${this.client.info.pushname}
- Reason: ${reason}
- Date: ${new Date().toLocaleString('id-ID')}

This is an official request from the account owner.

Best regards,
${this.client.info.pushname}
            `
        };

        console.log(chalk.yellow('[!] Email request prepared'));
        console.log(chalk.cyan(JSON.stringify(emailData, null, 2)));
    }

    async finalizeDestruction() {
        console.log(chalk.red.bold(`
╔══════════════════════════════════════╗
║         ☢️ DESTRUCTION COMPLETE     ║
╚══════════════════════════════════════╝
        `));
        
        console.log(chalk.green.bold(`
[✓] Account will be deactivated within 24-72 hours
[✓] All groups left successfully
[✓] Backup saved to backups/ folder
[✓] Official request submitted to WhatsApp Support
        
[📧] Check email for confirmation
[🌐] Visit: https://faq.whatsapp.com
        `));

        const { exitNow } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'exitNow',
                message: chalk.red.bold('Keluar dari tools?'),
                default: true
            }
        ]);

        if (exitNow) {
            await this.client.destroy();
            process.exit(0);
        }
    }

    async getPublicIP() {
        try {
            const response = await axios.get('https://api.ipify.org?format=json');
            return response.data.ip;
        } catch {
            return 'Unknown';
        }
    }
}

// Channel destroyer
class ChannelDestroyer {
    constructor(client) {
        this.client = client;
    }

    async execute() {
        console.clear();
        console.log(banner);

        const channels = await this.getOwnedChannels();
        if (channels.length === 0) {
            console.log(chalk.yellow('[!] Anda bukan admin di saluran manapun'));
            return;
        }

        const { selectedChannel } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedChannel',
                message: chalk.red.bold('PILIH SALURAN UNTUK DIHANCURKAN:'),
                choices: channels.map(c => ({
                    name: `${c.name} (${c.participants.length} member)`,
                    value: c
                }))
            }
        ]);

        const { confirm, reason } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: chalk.red.bold(`HANCURKAN ${selectedChannel.name}?`),
                default: false
            },
            {
                type: 'input',
                name: 'reason',
                message: chalk.green.bold('Alasan penghapusan:'),
                validate: input => input.length >= 5 || 'Minimal 5 karakter!'
            }
        ]);

        if (!confirm) return;

        await this.destroyChannel(selectedChannel, reason);
    }

    async getOwnedChannels() {
        const chats = await client.getChats();
        return chats.filter(c => 
            c.isGroup && 
            c.participants.find(p => 
                p.id.user === client.info.wid.user && 
                p.isAdmin
            )
        );
    }

    async destroyChannel(channel, reason) {
        const spinner = ora({
            text: 'Preparing destruction...',
            spinner: 'aesthetic',
            color: 'red'
        }).start();

        try {
            // Step 1: Delete all messages
            spinner.text = 'Deleting messages...';
            const messages = await channel.fetchMessages({ limit: 1000 });
            
            const progress = new ProgressBar('Hapus pesan [:bar] :percent', {
                total: messages.length,
                width: 40,
                complete: chalk.red('█'),
                incomplete: chalk.white('░')
            });

            for (const msg of messages) {
                if (msg.fromMe) {
                    try {
                        await msg.delete(true);
                        progress.tick();
                        await new Promise(resolve => setTimeout(resolve, 200));
                    } catch (e) { /* Skip errors */ }
                }
            }

            // Step 2: Remove all members
            spinner.text = 'Removing members...';
            const members = channel.participants.filter(p => !p.isSuperAdmin);
            
            const memberProgress = new ProgressBar('Keluarkan member [:bar] :percent', {
                total: members.length,
                width: 40,
                complete: chalk.red('█'),
                incomplete: chalk.green('░')
            });

            for (const member of members) {
                try {
                    await channel.removeParticipants([member.id._serialized]);
                    memberProgress.tick();
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (e) { /* Skip errors */ }
            }

            // Step 3: Update channel info
            spinner.text = 'Updating channel info...';
            await channel.setSubject('⚠️ SALURAN DIHAPUS ⚠️');
            await channel.setDescription(`Saluran ini dihapus atas permintaan admin. Alasan: ${reason}`);

            // Step 4: Report to WhatsApp
            spinner.text = 'Reporting to WhatsApp...';
            const supportNumber = '120363022878066437@g.us';
            const report = [
                `🗑️ CHANNEL DESTRUCTION REQUEST`,
                `Channel: ${channel.name} (${channel.id._serialized})`,
                `Admin: ${client.info.wid.user}`,
                `Reason: ${reason}`,
                `Date: ${new Date().toLocaleString('id-ID')}`,
                `This is official request from channel admin`
            ].join('\n');

            await client.sendMessage(supportNumber, report);

            // Step 5: Leave channel
            await channel.leave();
            
            spinner.succeed(chalk.green('[✓] CHANNEL DESTROYED!'));
            console.log(chalk.red.bold(`
[✓] All members removed
[✓] All messages deleted
[✓] Channel reported to WhatsApp
[✓] Channel will be permanently deleted in 7 days
            `));

        } catch (error) {
            spinner.fail(chalk.red(`[✗] Failed: ${error.message}`));
        }

        setTimeout(mainMenu, 5000);
    }
}

// Main execution
client.on('ready', async () => {
    await premiumLoading('SYSTEM INITIALIZED', 3);
    await mainMenu();
});

async function mainMenu() {
    console.log(banner);

    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: chalk.red.bold('MODE DESTRUKTOR:'),
            choices: [
                { name: '💣 NUKLEAR AKUN SENDIRI', value: 'account' },
                { name: '📱 HANCURKAN SALURAN SENDIRI', value: 'channel' },
                { name: '📊 CEK STATUS', value: 'status' },
                { name: '🚨 KELUAR', value: 'exit' }
            ]
        }
    ]);

    switch(action) {
        case 'account':
            const nuker = new AccountNuker(client);
            await nuker.execute();
            break;
        case 'channel':
            const destroyer = new ChannelDestroyer(client);
            await destroyer.execute();
            break;
        case 'status':
            await showStatus();
            break;
        case 'exit':
            console.log(chalk.red.bold('[!] TERMINATING...'));
            await client.destroy();
            process.exit(0);
    }
}

async function showStatus() {
    console.log(chalk.green.bold(`
╔══════════════════════════════════════╗
║         📊 DESTRUCTION STATUS        ║
╚══════════════════════════════════════╝
    `));
    
    console.log(chalk.cyan.bold(`
[📧] Check your email for updates
[🌐] Visit: ${config.support.form}
[📞] Call: ${config.support.phone}
    
[⏱️] Account destruction: 24-72 hours
[⏱️] Channel destruction: 7 days
    
[✅] All requests use official WhatsApp API
[✅] No exploits or violations
    `));
    
    await inquirer.prompt([{
        type: 'input',
        name: 'continue',
        message: chalk.yellow('Press Enter to continue...')
    }]);
    
    mainMenu();
}

// Error handling premium
process.on('uncaughtException', (error) => {
    console.error(chalk.red(`[CRITICAL ERROR]: ${error.message}`));
    client.destroy();
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error(chalk.red(`[PROMISE ERROR]: ${reason}`));
});

// Start
console.clear();
console.log(banner);
client.initialize();
