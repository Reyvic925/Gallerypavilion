# Gallery Pavilion - Photography Platform

A modern, full-featured photography platform built with Next.js, featuring gallery management, photographer profiles, and client collaboration tools.

## Features

- **Gallery Management**: Create and organize photo collections
- **Photographer Profiles**: Professional photographer showcases
- **Client Collaboration**: Share galleries and collect feedback
- **Photo Comparison**: Side-by-side photo comparison tools
- **Analytics Dashboard**: Track engagement and performance
- **Responsive Design**: Beautiful UI that works on all devices

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [https://gallerypavilion.com](https://gallerypavilion.com) with your browser to see the result.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Prisma with SQLite
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with modern design
- **Authentication**: Built-in auth system
- **File Upload**: Image handling and optimization

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable UI components
├── lib/                 # Utility functions and configurations
└── types/               # TypeScript type definitions
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Email configuration (Namecheap Private Email)

Gallery Pavilion sends transactional emails (invitations, approval/rejection notices) via SMTP. For Namecheap Private Email use the following environment variables in your deployment or local .env:

```
EMAIL_SERVER_HOST=smtp.privateemail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your@domain.com
EMAIL_SERVER_PASSWORD=yourpassword
EMAIL_FROM="Gallery Pavilion <noreply@gallerypavilion.com>"
```

- Use a strong, unique password for `EMAIL_SERVER_PASSWORD` and keep it secret (don't commit to Git).
- If your provider requires SSL, set `EMAIL_SERVER_SECURE=true` and adjust `EMAIL_SERVER_PORT` accordingly (typically 465).
- On production, prefer a dedicated transactional email provider (SendGrid, Postmark) for better deliverability and analytics.

