// app/subscription/success/page.tsx
import Stripe from "stripe";
import Link from "next/link";

export const dynamic = "force-dynamic"; // tránh cache vì query khác nhau
export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-07-30.basil",
});

type Props = {
    searchParams: { session_id?: string };
};

export default async function SuccessPage({ searchParams }: Props) {
    const sessionId = searchParams.session_id;
    if (!sessionId) {
        return (
            <div className="max-w-xl mx-auto p-6">
                <h1 className="text-2xl font-bold">
                    Thiếu session_id rồi bạn ơi 😅
                </h1>
                <p>Về trang chủ hoặc thử thanh toán lại nhé.</p>
                <Link
                    href="/"
                    legacyBehavior
                >
                    <a className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Quay lại trang chủ
                    </a>
                </Link>
            </div>
        );
    }

    // Lấy thông tin session từ Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription", "customer"],
    });

    // Lưu ý: nguồn dữ liệu “chuẩn” vẫn là webhook → DB. Trang này chỉ để show friendly.
    const subscription = session.subscription as
        | (Stripe.Subscription & {
              current_period_end?: number;
          })
        | null;
    const customer = session.customer as Stripe.Customer | string | null;

    const email =
        typeof customer === "object" && customer?.email
            ? customer.email
            : typeof customer === "string"
            ? customer
            : "Unknown";

    const subId = subscription ? subscription.id : "N/A";
    const subStatus = subscription ? subscription.status : session.status;
    const periodEnd =
        subscription && subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toLocaleString()
            : "N/A";

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-4">
            <h1 className="text-2xl font-bold">Đăng ký thành công! 🎉</h1>

            <div className="rounded-lg border p-4 space-y-2">
                <div>
                    <b>Checkout Session:</b> {session.id}
                </div>
                <div>
                    <b>Khách hàng:</b> {email}
                </div>
                <div>
                    <b>Subscription ID:</b> {subId}
                </div>
                <div>
                    <b>Trạng thái:</b> {subStatus}
                </div>
                <div>
                    <b>Chu kỳ đến hết:</b> {periodEnd}
                </div>
            </div>

            <p className="text-sm text-gray-600">
                Lưu ý: quyền truy cập nên được cấp qua <b>webhook</b> (source of
                truth). Nếu bạn đã xử lý webhook đúng, tài khoản sẽ được mở khóa
                ngay. Nếu chưa, ping lại server nha.
            </p>

            <Link
                href="/"
                legacyBehavior
            >
                <a className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Quay lại trang chủ
                </a>
            </Link>

            {/* Tuỳ chọn: link sang Customer Portal nếu bạn có route tạo portal */}
            {/* <a className="underline" href="/api/billing/portal">Quản lý thanh toán</a> */}
        </div>
    );
}
