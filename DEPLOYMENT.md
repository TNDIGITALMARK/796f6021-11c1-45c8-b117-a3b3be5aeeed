# Deployment Guide - TrustPositif Bot Manager

## Quick Start (Development)

1. **Install Dependencies**:
```bash
npm install
```

2. **Run Development Server**:
```bash
npm run dev
```

3. **Access Application**:
- Open http://localhost:4006
- Login with admin account: `admin` / `admin123`

## Deployment ke VPS Indonesia

### Prerequisites
- VPS dengan Node.js 18+ installed
- PM2 untuk process management
- Nginx untuk reverse proxy
- Domain (opsional)

### Step 1: Setup VPS

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### Step 2: Clone & Build Project

```bash
# Clone project ke VPS
cd /var/www
git clone [your-repo-url] trustpositif-bot
cd trustpositif-bot

# Install dependencies
npm install

# Build production
npm run build
```

### Step 3: Setup PM2

```bash
# Start aplikasi dengan PM2
pm2 start npm --name "trustpositif-bot" -- start

# Set PM2 untuk auto-start saat reboot
pm2 startup
pm2 save
```

### Step 4: Configure Nginx

Create file `/etc/nginx/sites-available/trustpositif-bot`:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Ganti dengan domain Anda

    location / {
        proxy_pass http://localhost:4006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/trustpositif-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: Setup SSL (Optional tapi Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Dapatkan SSL certificate
sudo certbot --nginx -d your-domain.com
```

### Step 6: Setup Cron Job untuk Monitoring

Edit crontab:
```bash
crontab -e
```

Add line untuk monitoring setiap 5 menit:
```
*/5 * * * * curl -X POST http://localhost:4006/api/monitoring/check-all
```

## Deployment ke Vercel (Alternative)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Deploy

```bash
vercel
```

Follow prompts untuk setup project.

### Step 3: Setup Cron Job

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/monitoring/check-all",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Redeploy:
```bash
vercel --prod
```

## Environment Variables

Untuk production, tambahkan environment variables:

### Di VPS:
Create `.env.local`:
```env
NODE_ENV=production
TELEGRAM_BOT_TOKEN=7760727060:AAGGwhPNVMcmnhHsXttlhNfx-4vAinCshWo
TELEGRAM_BOT_USERNAME=@crozxy_ceknawala_bot
```

### Di Vercel:
Add via Vercel Dashboard:
- Settings → Environment Variables
- Add same variables as above

## Monitoring & Maintenance

### Check Logs (PM2)
```bash
pm2 logs trustpositif-bot
```

### Restart Application
```bash
pm2 restart trustpositif-bot
```

### Update Application
```bash
cd /var/www/trustpositif-bot
git pull
npm install
npm run build
pm2 restart trustpositif-bot
```

### Monitor Process
```bash
pm2 monit
```

## Security Checklist

- [ ] Change default admin password
- [ ] Add firewall rules (UFW)
- [ ] Enable HTTPS/SSL
- [ ] Restrict API access
- [ ] Regular backups
- [ ] Update Node.js regularly
- [ ] Monitor server logs

## Troubleshooting

### Bot tidak mengirim pesan
1. Check Telegram bot token valid
2. Pastikan bot sudah ditambahkan ke grup
3. Verify Chat ID benar
4. Check logs untuk error messages

### Domain tidak ter-check
1. Verify cron job berjalan: `grep CRON /var/log/syslog`
2. Check API endpoint accessible
3. Verify TrustPositif API accessible dari server

### Application crash
```bash
# Check logs
pm2 logs trustpositif-bot --err

# Restart
pm2 restart trustpositif-bot

# Check process status
pm2 status
```

## Performance Optimization

### Nginx Caching
Add to nginx config:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;
```

### PM2 Clustering
```bash
pm2 start npm --name "trustpositif-bot" -i max -- start
```

### Database Optimization
- Implement Google Sheets caching
- Add Redis for session storage
- Optimize query patterns

## Backup Strategy

### Automated Backup Script
Create `/root/backup-trustpositif.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups/trustpositif"
mkdir -p $BACKUP_DIR

# Backup application
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/trustpositif-bot

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

Schedule dengan cron:
```bash
0 2 * * * /root/backup-trustpositif.sh
```

## Contact & Support

- VPS Provider: [Your Provider]
- Server Location: Indonesia
- Port: 4006 (internal), 80/443 (external)

---

**Deployment completed! Your TrustPositif Bot Manager is now live!** 🚀
