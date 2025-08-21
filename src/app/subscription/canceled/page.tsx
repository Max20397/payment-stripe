// app/subscription/canceled/page.tsx
import Link from "next/link";

export default function CanceledPage() {
    return (
        <div className="max-w-xl mx-auto p-6 space-y-2">
            <h1 className="text-2xl font-bold">Bạn đã hủy checkout</h1>
            <p>Không sao, lúc khác quay lại quẹt tiếp cũng được 😉</p>
            <Link
                href="/"
                className="underline"
            >
                Về trang chủ
            </Link>
        </div>
    );
}
