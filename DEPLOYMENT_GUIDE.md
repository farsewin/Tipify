# Tipify Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables

Create a `.env.production` file with:

```env
# Database
DATABASE_URL=your_production_database_url
DATABASE_AUTH_TOKEN=your_auth_token_if_needed

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Payment Gateway (when ready)
PAYMENT_GATEWAY_API_KEY=your_api_key
PAYMENT_GATEWAY_SECRET=your_secret
PAYMENT_GATEWAY_URL=https://api.gateway.com

# Sentry (optional)
SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project

# Email Service (optional)
EMAIL_API_KEY=your_email_api_key
EMAIL_FROM=noreply@your-domain.com
```

### 2. Database Setup

1. **Create Production Database**
   - Set up your production database (PostgreSQL recommended)
   - Update `DATABASE_URL` in environment variables

2. **Run Migrations**
   ```bash
   npx drizzle-kit generate
   npx drizzle-kit migrate
   ```

3. **Verify Schema**
   - Check all tables are created
   - Verify relationships and indexes

### 3. Payment Gateway Integration

1. **Replace Mock Payment Service**
   - Update `src/infrastructure/services/payment.service.ts`
   - Implement real gateway API calls
   - Test in sandbox/test environment first

2. **Update Payment Provider**
   - Change `LOCAL_GATEWAY` to your gateway name
   - Update in `src/modules/tips/create/create-tip.use-case.ts`

3. **Set Up Webhooks** (if applicable)
   - Create webhook endpoint: `app/api/webhooks/payment/route.ts`
   - Verify webhook signatures
   - Handle payment status updates

### 4. Build & Test

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test production build locally
npm start
```

### 5. Security Checklist

- [ ] All environment variables set
- [ ] Database credentials secure
- [ ] Payment gateway credentials secure
- [ ] HTTPS enabled
- [ ] CORS configured (if needed)
- [ ] Rate limiting configured (if needed)
- [ ] Error messages don't expose sensitive info

## Deployment Options

### Vercel (Recommended for Next.js)

1. **Connect Repository**
   - Push code to GitHub/GitLab
   - Import project in Vercel

2. **Configure Environment Variables**
   - Add all environment variables in Vercel dashboard
   - Set `NEXT_PUBLIC_APP_URL` to your Vercel domain

3. **Deploy**
   - Vercel will auto-deploy on push
   - Or deploy manually from dashboard

4. **Database**
   - Use Vercel Postgres or external database
   - Update `DATABASE_URL` in environment variables

### Other Platforms

#### Railway
- Connect GitHub repository
- Add environment variables
- Set up PostgreSQL database
- Deploy

#### Render
- Connect GitHub repository
- Add environment variables
- Set up PostgreSQL database
- Deploy

#### Self-Hosted
- Set up server (Node.js 18+)
- Install dependencies
- Set environment variables
- Run `npm run build && npm start`
- Use PM2 or similar for process management

## Post-Deployment

### 1. Verify Deployment

- [ ] Home page loads
- [ ] Sign-up works
- [ ] Sign-in works
- [ ] Dashboard loads
- [ ] Can create branches
- [ ] Can create staff
- [ ] QR codes generate
- [ ] Public tipping flow works
- [ ] Payment processing works (test mode)

### 2. Monitor

- [ ] Set up error monitoring (Sentry)
- [ ] Set up performance monitoring
- [ ] Monitor database performance
- [ ] Check logs regularly

### 3. Backup Strategy

- [ ] Set up automated database backups
- [ ] Test backup restoration
- [ ] Document backup procedures

## Testing in Production

### Test Checklist

1. **Authentication**
   - [ ] Sign up creates company
   - [ ] Sign in works
   - [ ] Sign out works
   - [ ] Session persists

2. **Company Management**
   - [ ] Can view company
   - [ ] Company information displays correctly

3. **Branch Management**
   - [ ] Can create branch
   - [ ] Can list branches
   - [ ] Branch details correct

4. **Staff Management**
   - [ ] Can create staff
   - [ ] Can list staff
   - [ ] Can update staff

5. **QR Codes**
   - [ ] Branch QR generates
   - [ ] Staff QR generates
   - [ ] QR codes are scannable
   - [ ] URLs work correctly

6. **Tipping Flow**
   - [ ] Branch page loads
   - [ ] Staff selection works
   - [ ] Tip form works
   - [ ] Payment processes
   - [ ] Success page displays

7. **Tips Management**
   - [ ] Tips appear in list
   - [ ] Filters work
   - [ ] Can mark tips as paid

8. **Payout Batches**
   - [ ] Can create batch
   - [ ] Can view batch details
   - [ ] Can complete batch

9. **Staff Dashboard**
   - [ ] Staff can view their tips
   - [ ] Statistics display correctly

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check `DATABASE_URL` is correct
   - Verify database is accessible
   - Check firewall rules

2. **Payment Gateway Errors**
   - Verify API keys are correct
   - Check gateway status
   - Review error logs

3. **Session Issues**
   - Check cookie settings
   - Verify `SESSION_COOKIE` name
   - Check domain settings

4. **QR Code Issues**
   - Verify `NEXT_PUBLIC_APP_URL` is set
   - Check QR code service is working
   - Test QR code URLs

## Performance Optimization

1. **Database**
   - Add indexes for frequently queried fields
   - Monitor query performance
   - Optimize slow queries

2. **Caching**
   - Consider caching frequently accessed data
   - Use Next.js caching strategies
   - Cache QR codes if needed

3. **Images**
   - Optimize avatar images
   - Use Next.js Image component
   - Consider CDN for static assets

## Maintenance

### Regular Tasks

- [ ] Monitor error logs
- [ ] Review performance metrics
- [ ] Update dependencies
- [ ] Backup database
- [ ] Review security updates
- [ ] Test payment gateway integration
- [ ] Monitor subscription statuses

---

**Ready to Deploy!** 🚀

Follow this guide step-by-step to deploy Tipify to production. The application is fully functional and ready for real-world use once the payment gateway is integrated.







