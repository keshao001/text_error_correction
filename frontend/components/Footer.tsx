import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          @{currentYear} 基于大模型的中文文本校正. 保留所有权利.
        </div>
        <div className="text-sm">
          <Link href="/privacy-policy" className="text-blue-500 hover:text-blue-700">
            隐私政策
          </Link>
        </div>
      </div>
    </footer>
  );
}
