import smtplib
from email.mime.text import MIMEText
import datetime
from django.conf import settings

def send_email(recipient: str, subject: str = "Eduvate", message: str = None):
    """Send an email using SMTP.
    
    Args:
        recipient (str): Recipient email address
        subject (str): Email subject
        message (str): HTML email content
    """
    # Ensure message is treated as HTML
    msg = MIMEText(message, "html")
    msg['From'] = settings.EMAIL_SENDER
    msg['To'] = recipient
    msg['Subject'] = subject

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(settings.EMAIL_SENDER, settings.EMAIL_PASSWORD)
        smtp.sendmail(settings.EMAIL_SENDER, recipient, msg.as_string())
    print("Message sent!")

def password_reset_email_template(first_name: str, reset_link: str) -> str:
    """Generate password reset email template.
    
    Args:
        first_name (str): User's first name
        reset_link (str): Password reset link
        
    Returns:
        str: Formatted HTML email template
    """
    return f"""<!DOCTYPE html>
<html>
<head>
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <style>
       body {{
           font-family: Arial, sans-serif;
           background-color: #F7F7F7;
           padding: 20px;
       }}
       .email-container {{
           background-color: #FFFFFF;
           padding: 20px;
           border-radius: 8px;
           box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
           max-width: 600px;
           margin: 0 auto;
       }}
       .button {{
           display: inline-block;
           padding: 12px 20px;
           background-color: #4CAF50;
           color: #FFFFFF;
           text-decoration: none;
           border-radius: 5px;
           font-size: 16px;
           margin-top: 20px;
       }}
   </style>
</head>
<body>
   <div class="email-container">
       <h2>Password Reset Request</h2>
       <p>Hi {first_name},</p>
       <p>We received a request to reset your password. Click the button below to set a new password:</p>
       <a href="{reset_link}" class="button">Reset Password</a>
       <p>If you didn't request this, you can safely ignore this email.</p>
       <p>This link will expire in 1 hour for security purposes.</p>
       <p>If the button doesn't work, copy and paste this link into your browser:</p>
       <p>{reset_link}</p>
   </div>
</body>
</html>"""

def password_changed_email_template(first_name: str) -> str:
    """Generate password changed notification email template.
    
    Args:
        first_name (str): User's first name
        
    Returns:
        str: Formatted HTML email template
    """
    return f"""<!DOCTYPE html>
<html>
<head>
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <style>
       body {{
           font-family: Arial, sans-serif;
           background-color: #F7F7F7;
           padding: 20px;
       }}
       .email-container {{
           background-color: #FFFFFF;
           padding: 20px;
           border-radius: 8px;
           box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
           max-width: 600px;
           margin: 0 auto;
       }}
       .content {{
           font-size: 16px;
           color: #333333;
           line-height: 1.5;
       }}
       .footer {{
           text-align: center;
           font-size: 12px;
           color: #999999;
           margin-top: 20px;
       }}
   </style>
</head>
<body>
   <div class="email-container">
       <div class="content">
           <p>Hi {first_name},</p>
           <p>The password for your account was recently changed.</p>
           <p>If you made this change, you can safely disregard this email.</p>
           <p>If you did not make this change, please contact our support team immediately.</p>
       </div>
       <div class="footer">
           <p>&copy; {datetime.datetime.now().year} EduVate. All rights reserved.</p>
       </div>
   </div>
</body>
</html>""" 