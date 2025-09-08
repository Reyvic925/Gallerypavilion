import nodemailer from 'nodemailer'

interface InviteEmailData {
  recipientEmail: string
  recipientName?: string
  galleryTitle: string
  photographerName: string
  inviteUrl: string
  inviteCode?: string
  expiresAt?: Date
  permissions: {
    canView: boolean
    canFavorite: boolean
    canComment: boolean
    canDownload: boolean
    canRequestPurchase: boolean
  }
}

// Create email transporter with local testing fallback
async function createTransporter() {
  // Build SMTP config favoring environment variables. Default to
  // Namecheap Private Email SMTP (smtp.privateemail.com) when not provided.
  const host = process.env.EMAIL_SERVER_HOST || 'smtp.privateemail.com'
  const port = parseInt(process.env.EMAIL_SERVER_PORT || '587')
  const secure = (process.env.EMAIL_SERVER_SECURE || 'false') === 'true'
  const user = process.env.EMAIL_SERVER_USER || ''
  const pass = process.env.EMAIL_SERVER_PASSWORD || ''

  console.log(`Creating SMTP transporter for host=${host} port=${port} secure=${secure}`)

  const config = {
    host,
    port,
    secure,
    requireTLS: true,
    auth: {
      user,
      pass
    },
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateLimit: 14,
    tls: {
      // For some SMTP providers, including Namecheap, this may be necessary in some environments.
      rejectUnauthorized: false
    }
  }

  return nodemailer.createTransport(config)
}

// Generate HTML email template
function generateInviteEmailHTML(data: InviteEmailData): string {
  const permissionsList = Object.entries(data.permissions)
    .filter(([, value]) => value)
    .map(([key]) => {
      const labels: Record<string, string> = {
        canView: 'View photos',
        canFavorite: 'Mark favorites',
        canComment: 'Leave comments',
        canDownload: 'Download photos',
        canRequestPurchase: 'Request purchases'
      }
      return `<li>${labels[key] || key}</li>`
    })
    .join('')

  const expiryText = data.expiresAt 
    ? `<p><strong>Note:</strong> This invite expires on ${data.expiresAt.toLocaleDateString()}</p>`
    : ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Gallery Invitation</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .cta-button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 600;
        }
        .permissions {
          background: white;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 14px;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎨 Gallery Invitation</h1>
        <p>You've been invited to view a private photo gallery</p>
      </div>
      
      <div class="content">
        <h2>Hello${data.recipientName ? ` ${data.recipientName}` : ''}!</h2>
        
        <p><strong>${data.photographerName}</strong> has invited you to view their private gallery: <strong>"${data.galleryTitle}"</strong></p>
        
        ${data.inviteCode ? `<div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; border: 2px dashed #667eea;">
          <h3 style="margin-top: 0; color: #667eea;">Your Invitation Code</h3>
          <p style="font-size: 24px; font-weight: bold; color: #333; letter-spacing: 2px; margin: 10px 0;">${data.inviteCode}</p>
          <p style="font-size: 14px; color: #666; margin-bottom: 0;">Use this code to access the gallery at <a href="https://www.gallerypavilion.com" style="color: #667eea;">www.gallerypavilion.com</a></p>
        </div>` : ''}
        
        <div class="permissions">
          <h3>Your Access Permissions:</h3>
          <ul>
            ${permissionsList}
          </ul>
        </div>
        
        <div style="text-align: center;">
          <a href="${data.inviteUrl}" class="cta-button">View Gallery</a>
        </div>
        
        <p style="text-align: center; margin-top: 20px;">
          <small>Or visit <a href="https://www.gallerypavilion.com" style="color: #667eea;">www.gallerypavilion.com</a> and enter your invitation code</small>
        </p>
        
        ${expiryText}
        
        <p><small>If the button doesn&apos;t work, copy and paste this link into your browser:<br>
        <a href="${data.inviteUrl}">${data.inviteUrl}</a></small></p>
      </div>
      
      <div class="footer">
        <p>This is an automated email from Gallery Pavilion. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `
}

// Generate plain text email
function generateInviteEmailText(data: InviteEmailData): string {
  const permissions = Object.entries(data.permissions)
    .filter(([, value]) => value)
    .map(([key]) => {
      const labels: Record<string, string> = {
        canView: 'View photos',
        canFavorite: 'Mark favorites',
        canComment: 'Leave comments',
        canDownload: 'Download photos',
        canRequestPurchase: 'Request purchases'
      }
      return `- ${labels[key] || key}`
    })
    .join('\n')

  const expiryText = data.expiresAt 
    ? `\n\nNote: This invite expires on ${data.expiresAt.toLocaleDateString()}`
    : ''

  return `
Gallery Invitation

Hello${data.recipientName ? ` ${data.recipientName}` : ''}!

${data.photographerName} has invited you to view their private gallery: "${data.galleryTitle}"

${data.inviteCode ? `Your Invitation Code: ${data.inviteCode}
You can use this code at www.gallerypavilion.com

` : ''}Your Access Permissions:
${permissions}

View Gallery: ${data.inviteUrl}

Or visit www.gallerypavilion.com and enter your invitation code
${expiryText}

This is an automated email from Gallery Pavilion. Please do not reply to this email.
  `
}

// Send invite email with retry logic
export async function sendInviteEmail(data: InviteEmailData): Promise<boolean> {
  const maxRetries = 3
  const retryDelay = 2000 // 2 seconds

  // Check if email configuration is available
  if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
    console.warn('Email configuration not found. Skipping email send.')
    return false
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Gallery Pavilion" <noreply@gallerypavilion.com>`,
    to: data.recipientEmail,
    subject: `Gallery Invitation: ${data.galleryTitle}`,
    text: generateInviteEmailText(data),
    html: generateInviteEmailHTML(data)
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting to send email (attempt ${attempt}/${maxRetries})...`)
      const transporter = await createTransporter()
      
      // Test connection first
      await transporter.verify()
      console.log('SMTP connection verified successfully')
      
      const result = await transporter.sendMail(mailOptions)
      console.log('Invite email sent successfully:', result.messageId)
      
      console.log('Email sent successfully to:', data.recipientEmail)
      console.log('Message ID:', result.messageId)
      
      // Close the transporter
      transporter.close()
      return true
    } catch (error) {
      console.error(`Email send attempt ${attempt} failed:`, error)
      
      if (attempt === maxRetries) {
        console.error('All email send attempts failed')
        return false
      }
      
      // Wait before retrying
      console.log(`Waiting ${retryDelay}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }
  
  return false
}

// Test email configuration
export async function testEmailConfig(): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = await createTransporter()
    await transporter.verify()
    console.log('Email configuration test passed')
    return { success: true }
  } catch (error) {
    console.error('Email configuration test failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

// Send approval notification to a photographer when their application is approved
export async function sendPhotographerApprovalEmail(recipientEmail: string, recipientName?: string): Promise<boolean> {
  if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
    console.warn('Email configuration not found. Skipping approval email send.')
    return false
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Gallery Pavilion" <noreply@gallerypavilion.com>`,
    to: recipientEmail,
    subject: 'Your photographer application has been approved',
    text: `Hello ${recipientName || ''},\n\nYour photographer application has been approved by Gallery Pavilion. You can now sign in and start creating galleries and uploading photos.\n\nVisit: https://www.gallerypavilion.com\n\nBest,\nGallery Pavilion Team`,
    html: `<p>Hello ${recipientName || ''},</p><p>Good news — your photographer application has been <strong>approved</strong> by Gallery Pavilion. You can now sign in and start creating galleries and uploading photos.</p><p><a href="https://www.gallerypavilion.com" style="color:#667eea">Sign in to your account</a></p><p>Best,<br/>Gallery Pavilion Team</p>`
  }

  try {
    const transporter = await createTransporter()
    await transporter.verify()
    const result = await transporter.sendMail(mailOptions)
    transporter.close()
    console.log('Approval email sent:', result.messageId)
    return true
  } catch (err) {
    console.error('Failed to send approval email', err)
    return false
  }
}

// Send rejection notification to a photographer when their application is rejected
export async function sendPhotographerRejectionEmail(recipientEmail: string, recipientName?: string, reason?: string): Promise<boolean> {
  if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
    console.warn('Email configuration not found. Skipping rejection email send.')
    return false
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Gallery Pavilion" <noreply@gallerypavilion.com>`,
    to: recipientEmail,
    subject: 'Your photographer application has been reviewed',
    text: `Hello ${recipientName || ''},\n\nWe reviewed your photographer application and, unfortunately, it was not approved at this time.${reason ? `\n\nReason: ${reason}` : ''}\n\nIf you have questions, please contact support.\n\nBest,\nGallery Pavilion Team`,
    html: `<p>Hello ${recipientName || ''},</p><p>We reviewed your photographer application and, unfortunately, it was not approved at this time.${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}</p><p>If you have questions, please contact support.</p><p>Best,<br/>Gallery Pavilion Team</p>`
  }

  try {
    const transporter = await createTransporter()
    await transporter.verify()
    const result = await transporter.sendMail(mailOptions)
    transporter.close()
    console.log('Rejection email sent:', result.messageId)
    return true
  } catch (err) {
    console.error('Failed to send rejection email', err)
    return false
  }
}