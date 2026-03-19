# WHVAC Portal — Deployment Runbook
# Server: 192.168.2.250 (Debian 12 LXC)
# Domain: whvac.abreeze.studio → port 3002
# Lygotype already running on port 3001

---

## BEFORE YOU PUSH TO GITHUB

On your laptop, in the project root:

```bash
# 1. Make sure .env is gitignored
cat .gitignore | grep .env
# Should see: .env and .env.local — if not, add them

# 2. Make sure .env is NOT staged
git status
# If .env appears green, remove it:
git rm --cached .env

# 3. Add .env.example (safe to commit)
cp .env.example .env.example   # already in project root
git add .env.example

# 4. Make sure next.config has standalone output
# Open next.config.js and confirm:
#   output: 'standalone'
# Add it if missing.

# 5. Push
git add .
git commit -m "feat: ready for production deployment"
git push origin main
```

---

## ON THE SERVER

SSH in:
```bash
ssh root@192.168.2.250
```

### Step 1 — Clone the repo

```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/whvac-portal.git whvac-portal
cd whvac-portal
```

Use a GitHub Personal Access Token when prompted (not your password).
Generate one at: github.com → Settings → Developer Settings → Personal Access Tokens → Tokens (classic) → repo scope.

### Step 2 — Create the .env file on the server

```bash
nano .env
```

Paste in all your real credentials (see .env.example for the list).
Save: Ctrl+X → Y → Enter

Verify nothing is missing:
```bash
cat .env
```

### Step 3 — Generate BETTER_AUTH_SECRET if you haven't yet

```bash
openssl rand -base64 32
```

Copy the output into your .env as BETTER_AUTH_SECRET.

### Step 4 — Build and run the Docker container

```bash
# Build the image
docker build -t whvac-portal .

# Run it on port 3002
docker run -d \
  --name whvac-portal \
  --restart unless-stopped \
  -p 3002:3002 \
  --env-file .env \
  whvac-portal

# Verify it's running
docker ps
docker logs whvac-portal
```

You should see the Next.js server starting on port 3002.

### Step 5 — nginx config

```bash
# Copy the config
cp /var/www/whvac-portal/whvac.abreeze.studio.conf /etc/nginx/sites-available/whvac.abreeze.studio

# Enable it
ln -s /etc/nginx/sites-available/whvac.abreeze.studio /etc/nginx/sites-enabled/

# Test the config
nginx -t

# Reload nginx
systemctl reload nginx
```

### Step 6 — SSL cert with Certbot

```bash
certbot --nginx -d whvac.abreeze.studio
```

Certbot will:
- Prompt for your email (for renewal notices)
- Ask to redirect HTTP → HTTPS — say YES (option 2)
- Automatically update your nginx config with SSL

Verify SSL is working:
```bash
curl -I https://whvac.abreeze.studio
# Should return HTTP/2 200
```

---

## AFTER DEPLOYMENT

### Register the Stripe webhook

In Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: https://whvac.abreeze.studio/api/webhooks/stripe
- Events: checkout.session.completed

Copy the signing secret and update STRIPE_WEBHOOK_SECRET in your .env on the server, then restart the container:

```bash
docker stop whvac-portal
docker rm whvac-portal
docker run -d \
  --name whvac-portal \
  --restart unless-stopped \
  -p 3002:3002 \
  --env-file .env \
  whvac-portal
```

---

## UPDATING THE APP (future deployments)

```bash
cd /var/www/whvac-portal
git pull origin main
docker stop whvac-portal
docker rm whvac-portal
docker build -t whvac-portal .
docker run -d \
  --name whvac-portal \
  --restart unless-stopped \
  -p 3002:3002 \
  --env-file .env \
  whvac-portal
```

---

## TROUBLESHOOTING

Container won't start:
```bash
docker logs whvac-portal
```

nginx errors:
```bash
nginx -t
tail -f /var/log/nginx/error.log
```

App returns 502:
- Container not running: `docker ps`
- Wrong port: confirm container is on 3002
- Check logs: `docker logs whvac-portal`

Certbot fails:
- DNS not propagated yet — wait 5-10 min and retry
- Check A record: `dig whvac.abreeze.studio`
