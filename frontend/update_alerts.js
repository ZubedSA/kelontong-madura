const fs = require('fs');

const files = [
  'src/app/juragan/transaksi/page.tsx',
  'src/app/penjaga/page.tsx',
  'src/app/juragan/tabungan/page.tsx',
  'src/app/juragan/gaji/page.tsx',
  'src/app/juragan/shift/page.tsx',
  'src/app/juragan/pengaturan/page.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('useToast')) {
    content = `import { useToast } from '@/components/ui/toast-context';\n` + content;
  }

  // Inject useToast hook after the component definition
  content = content.replace(/(export default function \w+\(\) {\n)/, "$1  const { success: toastSuccess, error: toastError } = useToast();\n");

  content = content.replace(/alert\((.*?)\);/g, (match, msg) => {
    let lowerMsg = msg.toLowerCase();
    if (lowerMsg.includes('gagal') || lowerMsg.includes('pilih') || lowerMsg.includes('error') || lowerMsg.includes('isi jumlah') || lowerMsg.includes('kesalahan')) {
      return `toastError(${msg});`;
    }
    return `toastSuccess(${msg});`;
  });

  fs.writeFileSync(file, content, 'utf8');
});
console.log('Update complete!');
