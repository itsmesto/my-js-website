
// Basic number to words converter (Sri Lankan English style for LKR)
// This is a simplified version. For production, consider a more robust library.
export const convertToWordsLKR = (amount: number): string => {
  const rupees = Math.floor(amount);
  const cents = Math.round((amount - rupees) * 100);

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const numToWords = (num: number): string => {
    if (num === 0) return 'Zero';
    let words = '';

    if (Math.floor(num / 10000000) > 0) { // Crores
      words += numToWords(Math.floor(num / 10000000)) + ' Crore ';
      num %= 10000000;
    }
    if (Math.floor(num / 100000) > 0) { // Lakhs
      words += numToWords(Math.floor(num / 100000)) + ' Lakh ';
      num %= 100000;
    }
    if (Math.floor(num / 1000) > 0) { // Thousands
      words += numToWords(Math.floor(num / 1000)) + ' Thousand ';
      num %= 1000;
    }
    if (Math.floor(num / 100) > 0) { // Hundreds
      words += numToWords(Math.floor(num / 100)) + ' Hundred ';
      num %= 100;
    }
    if (num > 0) {
      if (words !== '') words += 'and ';
      if (num < 20) {
        words += ones[num];
      } else {
        words += tens[Math.floor(num / 10)];
        if (num % 10 > 0) {
          words += ' ' + ones[num % 10];
        }
      }
    }
    return words.trim();
  };

  let result = numToWords(rupees) + ' LKR';
  if (cents > 0) {
    result += ' and ' + numToWords(cents) + ' Cents';
  }
  result += ' Only';
  return result.replace(/\s+/g, ' ').toUpperCase(); // Consolidate spaces and uppercase
};
