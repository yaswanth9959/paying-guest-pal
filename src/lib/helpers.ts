export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
}

export function generateWhatsAppLink(
  phone: string,
  tenantName: string,
  amount: number,
  month: string
): string {
  // Clean phone number (remove non-digits except +)
  let cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // Add India country code if not present
  if (!cleanPhone.startsWith('+')) {
    if (!cleanPhone.startsWith('91')) {
      cleanPhone = '91' + cleanPhone;
    }
    cleanPhone = '+' + cleanPhone;
  }
  
  const message = encodeURIComponent(
    `Hi ${tenantName}, this is a reminder that your rent of ${formatCurrency(amount)} for ${month} is due. Please pay at your earliest convenience. Thank you!`
  );
  
  return `https://wa.me/${cleanPhone.replace('+', '')}?text=${message}`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getDaysOverdue(dueDate: string): number {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = today.getTime() - due.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
